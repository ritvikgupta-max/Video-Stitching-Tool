import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Clip, AudioTrack, TextOverlay, ProjectSettings } from '../types';

export const renderVideo = async (
  clips: Clip[],
  audioTracks: AudioTrack[],
  texts: TextOverlay[],
  settings: ProjectSettings,
  totalDuration: number,
  onProgress: (progress: number, status?: string) => void,
  signal?: AbortSignal
): Promise<Blob> => {
  const ffmpeg = new FFmpeg();
  
  if (signal) {
    signal.addEventListener('abort', () => {
      try {
        ffmpeg.terminate();
      } catch (e) {
        console.error('Failed to terminate ffmpeg', e);
      }
    });
  }

  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  ffmpeg.on('progress', ({ progress, time }) => {
    if (progress > 0 && progress <= 1 && !isNaN(progress)) {
      onProgress(progress, 'Rendering...');
    } else if (time !== undefined && totalDuration > 0) {
      // time is in microseconds
      onProgress(Math.min(time / 1000000 / totalDuration, 1), 'Rendering...');
    }
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  onProgress(0, 'Loading FFmpeg...');
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  const validClips = clips.filter(c => c.url && c.url.trim() !== '');
  const validAudioTracks = audioTracks.filter(t => t.url && t.url.trim() !== '');

  onProgress(0, 'Fetching media...');
  // Write files to FFmpeg FS
  for (let i = 0; i < validClips.length; i++) {
    const clip = validClips[i];
    await ffmpeg.writeFile(`clip_${i}.mp4`, await fetchFile(clip.url));
  }

  for (let i = 0; i < validAudioTracks.length; i++) {
    const track = validAudioTracks[i];
    await ffmpeg.writeFile(`audio_${i}.mp3`, await fetchFile(track.url));
  }

  // Build filter_complex
  let filterComplex = '';
  const inputArgs: string[] = [];

  // 1. Process Clips
  validClips.forEach((clip, i) => {
    inputArgs.push('-i', `clip_${i}.mp4`);
    
    // Video: trim, speed, scale to common resolution (e.g., 1280x720), pad
    const ptsMultiplier = 1 / clip.speed;
    let w = 1280, h = 720;
    if (settings.aspectRatio === '9:16') { w = 720; h = 1280; }
    else if (settings.aspectRatio === '1:1') { w = 1080; h = 1080; }
    
    filterComplex += `[${i}:v]trim=start=${clip.trimStart}:end=${clip.trimEnd},setpts=${ptsMultiplier}*(PTS-STARTPTS),scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}];\n`;
    
    // Audio: trim, speed, volume
    // Note: If a clip has no audio, this will fail. In a production app, we would probe the file first.
    filterComplex += `[${i}:a]atrim=start=${clip.trimStart}:end=${clip.trimEnd},asetpts=PTS-STARTPTS,atempo=${clip.speed},volume=${clip.volume}[a${i}];\n`;
  });

  // 2. Concat Clips
  const concatInputs = validClips.map((_, i) => `[v${i}][a${i}]`).join('');
  filterComplex += `${concatInputs}concat=n=${validClips.length}:v=1:a=1[base_v][base_a];\n`;

  // 3. Process Audio Tracks (simplified: just mix them if they exist)
  let finalAudio = '[base_a]';
  if (validAudioTracks.length > 0) {
    let amixInputs = '[base_a]';
    validAudioTracks.forEach((track, i) => {
      const inputIdx = validClips.length + i;
      inputArgs.push('-i', `audio_${i}.mp3`);
      
      // Delay audio to its start time
      const delayMs = Math.floor(track.start * 1000);
      filterComplex += `[${inputIdx}:a]atrim=start=${track.trimStart}:end=${track.trimEnd},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${track.volume}[track_a${i}];\n`;
      amixInputs += `[track_a${i}]`;
    });
    
    filterComplex += `${amixInputs}amix=inputs=${validAudioTracks.length + 1}:duration=first:dropout_transition=2[final_a];\n`;
    finalAudio = '[final_a]';
  } else {
    filterComplex += `[base_a]anull[final_a];\n`;
  }

  // 4. Process Text Overlays
  let finalVideo = '[base_v]';
  if (texts.length > 0) {
    // Fetch a default font (Roboto Regular)
    const fontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/roboto/Roboto-Regular.ttf';
    await ffmpeg.writeFile('font.ttf', await fetchFile(fontUrl));

    let currentVideo = '[base_v]';
    texts.forEach((text, i) => {
      const nextVideo = `[v_text${i}]`;
      
      // Replace single quotes with smart quotes to avoid FFmpeg escaping hell
      const escapedText = text.text.replace(/'/g, "\u2019");
      
      let x = '(w-text_w)/2';
      let y = '(h-text_h)/2';
      
      if (text.position.includes('top')) y = '(h*0.1)';
      if (text.position.includes('bottom')) y = '(h*0.9-text_h)';
      if (text.position.includes('left')) x = '(w*0.1)';
      if (text.position.includes('right')) x = '(w*0.9-text_w)';

      // Handle background color box
      let boxStr = '';
      if (text.bgColor && text.bgColor !== 'transparent') {
        boxStr = `:box=1:boxcolor=${text.bgColor.replace('#', '0x')}@0.8:boxborderw=10`;
      }

      // Handle color
      const fontColor = text.color ? text.color.replace('#', '0x') : '0xffffff';

      // Fade in/out alpha
      let alphaStr = '';
      if (text.fadeIn > 0 && text.fadeOut > 0) {
        alphaStr = `:alpha='if(lt(t,${text.start + text.fadeIn}),(t-${text.start})/${text.fadeIn},if(gt(t,${text.end - text.fadeOut}),(${text.end}-t)/${text.fadeOut},1))'`;
      } else if (text.fadeIn > 0) {
        alphaStr = `:alpha='if(lt(t,${text.start + text.fadeIn}),(t-${text.start})/${text.fadeIn},1)'`;
      } else if (text.fadeOut > 0) {
        alphaStr = `:alpha='if(gt(t,${text.end - text.fadeOut}),(${text.end}-t)/${text.fadeOut},1)'`;
      }

      const drawtextFilter = `drawtext=fontfile=font.ttf:text='${escapedText}':fontsize=${text.fontsize}:fontcolor=${fontColor}${boxStr}:x=${x}:y=${y}:enable='between(t,${text.start},${text.end})'${alphaStr}`;
      
      filterComplex += `${currentVideo}${drawtextFilter}${nextVideo};\n`;
      currentVideo = nextVideo;
    });
    finalVideo = currentVideo;
  }

  // Execute FFmpeg
  const args = [
    ...inputArgs,
    '-filter_complex', filterComplex,
    '-map', finalVideo,
    '-map', finalAudio,
    '-c:v', 'libx264',
    '-preset', 'ultrafast', // use ultrafast for browser rendering
    '-c:a', 'aac',
    '-shortest',
    'output.mp4'
  ];

  try {
    const ret = await ffmpeg.exec(args);
    if (ret !== 0) {
      if (signal?.aborted) {
        throw new Error('Render cancelled by user');
      }
      throw new Error(`FFmpeg exited with code ${ret}`);
    }

    const data = await ffmpeg.readFile('output.mp4');
    return new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' });
  } catch (error) {
    if (signal?.aborted) {
      throw new Error('Render cancelled by user');
    }
    throw error;
  }
};
