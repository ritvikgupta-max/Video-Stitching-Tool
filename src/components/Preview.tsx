import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Clip } from '../types';

export const Preview: React.FC = () => {
  const { clips, texts, audioTracks, playhead, setPlayhead, isPlaying, setIsPlaying, totalDuration, settings } = useProject();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Find active clip based on playhead
  const getActiveClipInfo = () => {
    let accumulatedTime = 0;
    for (const clip of clips) {
      const clipDuration = (clip.trimEnd - clip.trimStart) / clip.speed;
      if (playhead >= accumulatedTime && playhead < accumulatedTime + clipDuration) {
        return {
          clip,
          localTime: clip.trimStart + (playhead - accumulatedTime) * clip.speed
        };
      }
      accumulatedTime += clipDuration;
    }
    return { clip: null, localTime: 0 };
  };

  const { clip: activeClip, localTime } = getActiveClipInfo();

  // Handle playback loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      
      const updatePlayhead = (time: number) => {
        const delta = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;
        
        setPlayhead(prev => {
          const next = prev + delta;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
        
        animationRef.current = requestAnimationFrame(updatePlayhead);
      };
      
      animationRef.current = requestAnimationFrame(updatePlayhead);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, totalDuration, setPlayhead, setIsPlaying]);

  // Sync video element with localTime
  useEffect(() => {
    if (videoRef.current && activeClip) {
      // Only seek if we're off by more than 0.1s to avoid stuttering
      if (Math.abs(videoRef.current.currentTime - localTime) > 0.1) {
        videoRef.current.currentTime = localTime;
      }
      
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      
      videoRef.current.playbackRate = activeClip.speed;
      videoRef.current.volume = activeClip.volume;
    }
  }, [activeClip, localTime, isPlaying]);

  // Sync audio elements
  useEffect(() => {
    audioTracks.forEach(track => {
      const audioEl = audioRefs.current[track.id];
      if (audioEl) {
        const isActive = playhead >= track.start && playhead <= track.start + (track.trimEnd - track.trimStart);
        if (isActive) {
          const trackPlayhead = track.trimStart + (playhead - track.start);
          if (Math.abs(audioEl.currentTime - trackPlayhead) > 0.1) {
            audioEl.currentTime = trackPlayhead;
          }
          audioEl.volume = track.volume;
          if (isPlaying && audioEl.paused) {
            audioEl.play().catch(() => {});
          } else if (!isPlaying && !audioEl.paused) {
            audioEl.pause();
          }
        } else {
          if (!audioEl.paused) {
            audioEl.pause();
          }
        }
      }
    });
  }, [playhead, isPlaying, audioTracks]);

  // Active texts
  const activeTexts = texts.filter(t => playhead >= t.start && playhead <= t.end);

  // Check if video should be muted due to replaceAudio
  const isVideoMuted = audioTracks.some(a => a.replaceAudio && playhead >= a.start && playhead <= a.start + (a.trimEnd - a.trimStart));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getAspectRatioClass = () => {
    switch (settings.aspectRatio) {
      case '9:16': return 'aspect-[9/16] h-full max-h-[60vh]';
      case '1:1': return 'aspect-square h-full max-h-[60vh]';
      case '4:3': return 'aspect-[4/3] w-full max-w-2xl';
      case '16:9':
      default: return 'aspect-video w-full max-w-3xl';
    }
  };

  return (
    <div className="flex-1 bg-black flex flex-col min-w-0 min-h-0">
      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4 min-h-0">
        <div className={`relative bg-[#111] rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 ${getAspectRatioClass()}`}>
          {/* Hidden Audio Elements */}
          {audioTracks.map(track => (
            <audio
              key={track.id}
              ref={el => { audioRefs.current[track.id] = el; }}
              src={track.url || undefined}
            />
          ))}

          {activeClip ? (
            <video 
              ref={videoRef}
              src={activeClip.url || undefined}
              className="w-full h-full object-contain"
              muted={isVideoMuted}
              playsInline
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              No media at this time
            </div>
          )}

          {/* Text Overlays */}
          {activeTexts.map(text => {
            // Calculate position
            let top = '50%';
            let left = '50%';
            let transform = 'translate(-50%, -50%)';
            
            if (text.position.includes('top')) top = '10%';
            if (text.position.includes('bottom')) top = '90%';
            if (text.position.includes('left')) { left = '10%'; transform = `translate(0, -50%)`; }
            if (text.position.includes('right')) { left = '90%'; transform = `translate(-100%, -50%)`; }
            if (text.position === 'top') transform = 'translate(-50%, 0)';
            if (text.position === 'bottom') transform = 'translate(-50%, -100%)';

            // Calculate opacity for fade in/out
            let opacity = 1;
            const timeIn = playhead - text.start;
            const timeOut = text.end - playhead;
            
            if (timeIn < text.fadeIn) opacity = timeIn / text.fadeIn;
            else if (timeOut < text.fadeOut) opacity = timeOut / text.fadeOut;

            return (
              <div 
                key={text.id}
                className="absolute whitespace-pre-wrap text-center"
                style={{
                  top, left, transform,
                  color: text.color,
                  backgroundColor: text.bgColor !== 'transparent' ? text.bgColor : undefined,
                  fontSize: `${text.fontsize / 2}px`, // Scaled down for preview
                  fontFamily: text.font,
                  opacity,
                  padding: text.bgColor !== 'transparent' ? '8px 16px' : 0,
                  borderRadius: '8px',
                  textShadow: text.bgColor === 'transparent' ? '0 2px 4px rgba(0,0,0,0.8)' : 'none'
                }}
              >
                {text.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="h-14 bg-[#1a1a1a] border-t border-[#333] flex items-center justify-between px-4 shrink-0">
        <div className="text-sm font-mono text-gray-400 w-24">
          {formatTime(playhead)}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setPlayhead(0)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack size={20} />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
          </button>
          
          <button 
            onClick={() => setPlayhead(totalDuration)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>
        
        <div className="w-24 flex justify-end">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
