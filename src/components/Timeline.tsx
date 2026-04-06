import React, { useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { Scissors, Copy, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

const PIXELS_PER_SECOND = 50;

export const Timeline: React.FC = () => {
  const { 
    clips, setClips, texts, setTexts, transitions, setTransitions, audioTracks, setAudioTracks,
    playhead, setPlayhead, 
    selection, setSelection,
    totalDuration
  } = useProject();
  
  const timelineRef = useRef<HTMLDivElement>(null);

  // Handle playhead drag
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const newTime = Math.max(0, Math.min(totalDuration, x / PIXELS_PER_SECOND));
    setPlayhead(newTime);
  };

  // Calculate clip positions
  const clipPositions = clips.map((clip, index) => {
    const duration = (clip.trimEnd - clip.trimStart) / clip.speed;
    const start = clips.slice(0, index).reduce((acc, c) => acc + (c.trimEnd - c.trimStart) / c.speed, 0);
    return { ...clip, start, duration };
  });

  const handleDelete = () => {
    if (!selection.id) return;
    
    if (selection.type === 'clip') {
      setClips(clips.filter(c => c.id !== selection.id));
      // Clean up transitions
      const newTransitions = { ...transitions };
      Object.keys(newTransitions).forEach(key => {
        if (key.includes(selection.id!)) {
          delete newTransitions[key];
        }
      });
      setTransitions(newTransitions);
    } else if (selection.type === 'text') {
      setTexts(texts.filter(t => t.id !== selection.id));
    } else if (selection.type === 'audio') {
      setAudioTracks(audioTracks.filter(a => a.id !== selection.id));
    } else if (selection.type === 'transition') {
      const newTransitions = { ...transitions };
      delete newTransitions[selection.id];
      setTransitions(newTransitions);
    } else if (selection.type === 'audio') {
      setAudioTracks(audioTracks.filter(a => a.id !== selection.id));
    }
    
    setSelection({ type: 'project', id: null });
  };

  const handleCopy = () => {
    if (!selection.id) return;
    
    if (selection.type === 'clip') {
      const clipToCopy = clips.find(c => c.id === selection.id);
      if (clipToCopy) {
        const newClip = { ...clipToCopy, id: `c${Date.now()}` };
        const index = clips.findIndex(c => c.id === selection.id);
        const newClips = [...clips];
        newClips.splice(index + 1, 0, newClip);
        setClips(newClips);
        setSelection({ type: 'clip', id: newClip.id });
      }
    } else if (selection.type === 'text') {
      const textToCopy = texts.find(t => t.id === selection.id);
      if (textToCopy) {
        const newText = { ...textToCopy, id: `t${Date.now()}`, start: textToCopy.start + 1, end: textToCopy.end + 1 };
        setTexts([...texts, newText]);
        setSelection({ type: 'text', id: newText.id });
      }
    } else if (selection.type === 'audio') {
      const audioToCopy = audioTracks.find(a => a.id === selection.id);
      if (audioToCopy) {
        const newAudio = { ...audioToCopy, id: `a${Date.now()}`, start: audioToCopy.start + 1 };
        setAudioTracks([...audioTracks, newAudio]);
        setSelection({ type: 'audio', id: newAudio.id });
      }
    }
  };

  const handleTrim = () => {
    if (selection.type === 'clip' && selection.id) {
      const clipIndex = clips.findIndex(c => c.id === selection.id);
      if (clipIndex === -1) return;
      
      const clip = clips[clipIndex];
      const clipPos = clipPositions[clipIndex];
      
      if (playhead > clipPos.start && playhead < clipPos.start + clipPos.duration) {
        const localSplitTime = clip.trimStart + (playhead - clipPos.start) * clip.speed;
        
        const clip1 = { ...clip, trimEnd: localSplitTime };
        const clip2 = { ...clip, id: `c${Date.now()}`, trimStart: localSplitTime };
        
        const newClips = [...clips];
        newClips.splice(clipIndex, 1, clip1, clip2);
        setClips(newClips);
        setSelection({ type: 'clip', id: clip2.id });
      }
    } else if (selection.type === 'text' && selection.id) {
      const textIndex = texts.findIndex(t => t.id === selection.id);
      if (textIndex === -1) return;
      
      const text = texts[textIndex];
      if (playhead > text.start && playhead < text.end) {
        const text1 = { ...text, end: playhead };
        const text2 = { ...text, id: `t${Date.now()}`, start: playhead };
        
        const newTexts = [...texts];
        newTexts.splice(textIndex, 1, text1, text2);
        setTexts(newTexts);
        setSelection({ type: 'text', id: text2.id });
      }
    } else if (selection.type === 'audio' && selection.id) {
      const audioIndex = audioTracks.findIndex(a => a.id === selection.id);
      if (audioIndex === -1) return;
      
      const audio = audioTracks[audioIndex];
      const audioEnd = audio.start + (audio.trimEnd - audio.trimStart);
      if (playhead > audio.start && playhead < audioEnd) {
        const splitPoint = audio.trimStart + (playhead - audio.start);
        const audio1 = { ...audio, trimEnd: splitPoint };
        const audio2 = { ...audio, id: `a${Date.now()}`, start: playhead, trimStart: splitPoint };
        
        const newAudio = [...audioTracks];
        newAudio.splice(audioIndex, 1, audio1, audio2);
        setAudioTracks(newAudio);
        setSelection({ type: 'audio', id: audio2.id });
      }
    }
  };

  return (
    <div className="h-72 bg-[#141414] border-t border-[#333] flex flex-col shrink-0 select-none">
      {/* Timeline Toolbar */}
      <div className="h-10 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleTrim}
            disabled={!selection.id || (selection.type !== 'clip' && selection.type !== 'text' && selection.type !== 'audio')}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 rounded transition-colors"
            title="Split at playhead"
          >
            <Scissors size={16} />
          </button>
          <button 
            onClick={handleCopy}
            disabled={!selection.id || (selection.type !== 'clip' && selection.type !== 'text' && selection.type !== 'audio')}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 rounded transition-colors"
            title="Duplicate"
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={handleDelete}
            disabled={!selection.id || selection.type === 'project'}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#333] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"><ZoomOut size={16} /></button>
          <div className="w-24 h-1.5 bg-[#333] rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-gray-500 rounded-full"></div>
          </div>
          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"><ZoomIn size={16} /></button>
        </div>
      </div>

      {/* Timeline Tracks Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Track Headers */}
        <div className="w-24 bg-[#1a1a1a] border-r border-[#333] flex flex-col shrink-0 z-10">
          <div className="h-6 border-b border-[#333]"></div> {/* Ruler spacer */}
          <div className="h-20 border-b border-[#333] flex items-center px-2 text-xs font-medium text-gray-400">V1</div>
          <div className="h-12 border-b border-[#333] flex items-center px-2 text-xs font-medium text-gray-400">T1</div>
          <div className="h-16 border-b border-[#333] flex items-center px-2 text-xs font-medium text-gray-400">A1</div>
        </div>

        {/* Tracks Content */}
        <div 
          className="flex-1 overflow-x-auto overflow-y-hidden relative"
          ref={timelineRef}
          onClick={(e) => {
            handleTimelineClick(e);
            setSelection({ type: 'project', id: null });
          }}
        >
          <div style={{ width: `${Math.max(totalDuration + 10, 100) * PIXELS_PER_SECOND}px` }} className="h-full relative">
            
            {/* Time Ruler */}
            <div className="h-6 border-b border-[#333] relative bg-[#1a1a1a] sticky top-0 z-0">
              {Array.from({ length: Math.ceil(totalDuration) + 10 }).map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-[#333]" style={{ left: `${i * PIXELS_PER_SECOND}px` }}>
                  <span className="text-[10px] text-gray-500 ml-1 select-none">{i}s</span>
                </div>
              ))}
            </div>

            {/* Playhead Line */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
              style={{ left: `${playhead * PIXELS_PER_SECOND}px` }}
            >
              <div className="absolute top-0 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-sm"></div>
            </div>

            {/* Video Track */}
            <div className="h-20 border-b border-[#333] relative group" onClick={(e) => e.stopPropagation()}>
              {clipPositions.map((clip, i) => {
                const isSelected = selection.type === 'clip' && selection.id === clip.id;
                return (
                  <React.Fragment key={clip.id}>
                    <div 
                      className={`absolute top-2 bottom-2 rounded-md overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 z-10' : 'ring-1 ring-white/10 hover:ring-white/30'}`}
                      style={{ 
                        left: `${clip.start * PIXELS_PER_SECOND}px`, 
                        width: `${clip.duration * PIXELS_PER_SECOND}px`,
                        backgroundColor: '#2b4c7e'
                      }}
                      onClick={() => setSelection({ type: 'clip', id: clip.id })}
                    >
                      <div className="px-2 py-1 text-xs text-white truncate font-medium drop-shadow-md">{clip.name}</div>
                      {/* Simulated thumbnails */}
                      <div className="absolute bottom-0 left-0 right-0 h-8 flex overflow-hidden opacity-50">
                        {Array.from({ length: Math.ceil(clip.duration) }).map((_, j) => (
                          <div key={j} className="h-full w-12 shrink-0 border-r border-black/20 bg-[#1a3052]"></div>
                        ))}
                      </div>
                    </div>

                    {/* Transition Handle */}
                    {i < clips.length - 1 && (
                      <div 
                        className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-yellow-500/80 cursor-pointer z-20 flex items-center justify-center hover:bg-yellow-400 transition-colors ${selection.type === 'transition' && selection.id === `${clip.id}-${clips[i+1].id}` ? 'ring-2 ring-white' : ''}`}
                        style={{ left: `${(clip.start + clip.duration) * PIXELS_PER_SECOND - 12}px` }}
                        onClick={() => setSelection({ type: 'transition', id: `${clip.id}-${clips[i+1].id}` })}
                      >
                        <div className="w-3 h-3 border-t-2 border-r-2 border-white rotate-45 -translate-x-0.5"></div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Text Track */}
            <div className="h-12 border-b border-[#333] relative" onClick={(e) => e.stopPropagation()}>
              {texts.map(text => {
                const isSelected = selection.type === 'text' && selection.id === text.id;
                return (
                  <div 
                    key={text.id}
                    className={`absolute top-2 bottom-2 rounded cursor-pointer transition-all flex items-center px-2 ${isSelected ? 'ring-2 ring-green-500 z-10 bg-green-600/80' : 'ring-1 ring-white/10 bg-green-700/50 hover:bg-green-600/60'}`}
                    style={{ 
                      left: `${text.start * PIXELS_PER_SECOND}px`, 
                      width: `${(text.end - text.start) * PIXELS_PER_SECOND}px`
                    }}
                    onClick={() => setSelection({ type: 'text', id: text.id })}
                  >
                    <span className="text-xs text-white truncate font-medium">{text.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Audio Track */}
            <div className="h-16 border-b border-[#333] relative" onClick={(e) => e.stopPropagation()}>
              {audioTracks.map(track => {
                const isSelected = selection.type === 'audio' && selection.id === track.id;
                return (
                  <div 
                    key={track.id}
                    className={`absolute top-2 bottom-2 rounded cursor-pointer transition-all ${isSelected ? 'ring-2 ring-purple-500 z-10' : 'ring-1 ring-white/10 hover:ring-white/30'}`}
                    style={{ 
                      left: `${track.start * PIXELS_PER_SECOND}px`, 
                      width: `${(track.trimEnd - track.trimStart) * PIXELS_PER_SECOND}px`,
                      backgroundColor: '#4a2b7e'
                    }}
                    onClick={() => setSelection({ type: 'audio', id: track.id })}
                  >
                    <div className="px-2 py-1 text-xs text-white truncate font-medium">{track.name}</div>
                    {/* Simulated waveform */}
                    <div className="absolute bottom-1 left-0 right-0 h-6 flex items-end gap-0.5 px-1 opacity-50 overflow-hidden">
                      {Array.from({ length: Math.max(10, Math.floor((track.trimEnd - track.trimStart) * 2)) }).map((_, j) => (
                        <div key={j} className="w-1 bg-white rounded-t-sm" style={{ height: `${Math.random() * 100}%` }}></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
