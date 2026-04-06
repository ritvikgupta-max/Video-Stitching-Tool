import React, { useRef, useState } from 'react';
import { Video, Type, Sparkles, Music, Plus, Upload, X, GripVertical } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

type Tab = 'media' | 'text' | 'transitions' | 'audio';

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('media');
  const [draggedClipIndex, setDraggedClipIndex] = useState<number | null>(null);
  const { clips, setClips, texts, setTexts, setSelection, audioTracks, setAudioTracks, transitions, setTransitions, selection } = useProject();

  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveClip = (e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    setClips(clips.filter(c => c.id !== clipId));
    
    const newTransitions = { ...transitions };
    Object.keys(newTransitions).forEach(key => {
      if (key.includes(clipId)) {
        delete newTransitions[key];
      }
    });
    setTransitions(newTransitions);

    if (selection.id === clipId) {
      setSelection({ type: 'project', id: null });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedClipIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedClipIndex === null || draggedClipIndex === dropIndex) return;

    const newClips = [...clips];
    const [draggedClip] = newClips.splice(draggedClipIndex, 1);
    newClips.splice(dropIndex, 0, draggedClip);
    
    setClips(newClips);
    setDraggedClipIndex(null);
    
    const validTransitionKeys = new Set();
    for (let i = 0; i < newClips.length - 1; i++) {
      validTransitionKeys.add(`${newClips[i].id}-${newClips[i+1].id}`);
    }
    const newTransitions = { ...transitions };
    Object.keys(newTransitions).forEach(key => {
      if (!validTransitionKeys.has(key)) {
        delete newTransitions[key];
      }
    });
    setTransitions(newTransitions);
  };

  const handleAddText = () => {
    const newText = {
      id: `t${Date.now()}`,
      text: 'New Text',
      start: 0,
      end: 3,
      position: 'center',
      fontsize: 48,
      color: '#ffffff',
      bgColor: 'transparent',
      font: 'Inter',
      fadeIn: 0.5,
      fadeOut: 0.5
    };
    setTexts([...texts, newText]);
    setSelection({ type: 'text', id: newText.id });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file: File, index) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const newClip = {
          id: `c${Date.now()}-${index}`,
          name: file.name,
          url: url,
          duration: video.duration,
          trimStart: 0,
          trimEnd: video.duration,
          speed: 1,
          volume: 1
        };
        setClips(prev => [...prev, newClip]);
      };
      video.src = url;
    });
    
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file: File, index) => {
      const url = URL.createObjectURL(file);
      const audioEl = document.createElement('audio');
      audioEl.preload = 'metadata';
      audioEl.onloadedmetadata = () => {
        setAudioTracks(prev => [...prev, {
          id: `a${Date.now()}-${index}`,
          name: file.name,
          url: url,
          duration: audioEl.duration,
          trimStart: 0,
          trimEnd: audioEl.duration,
          start: 0,
          volume: 0.15,
          fadeOut: 3,
          replaceAudio: false
        }]);
      };
      audioEl.src = url;
    });
    
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const handleRemoveText = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTexts(texts.filter(t => t.id !== id));
    if (selection.id === id) setSelection({ type: 'project', id: null });
  };

  const handleRemoveAudio = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAudioTracks(audioTracks.filter(a => a.id !== id));
    if (selection.id === id) setSelection({ type: 'project', id: null });
  };

  return (
    <div className="w-72 bg-[#1e1e1e] border-r border-[#333] flex flex-col h-full shrink-0">
      <div className="flex border-b border-[#333]">
        <TabButton active={activeTab === 'media'} onClick={() => setActiveTab('media')} icon={<Video size={16} />} label="Media" />
        <TabButton active={activeTab === 'text'} onClick={() => setActiveTab('text')} icon={<Type size={16} />} label="Text" />
        <TabButton active={activeTab === 'transitions'} onClick={() => setActiveTab('transitions')} icon={<Sparkles size={16} />} label="Trans" />
        <TabButton active={activeTab === 'audio'} onClick={() => setActiveTab('audio')} icon={<Music size={16} />} label="Audio" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'media' && (
          <div className="space-y-4">
            <input 
              type="file" 
              accept="video/*" 
              multiple
              className="hidden" 
              ref={videoInputRef} 
              onChange={handleVideoUpload} 
            />
            <button 
              onClick={() => videoInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-[#444] rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 hover:bg-[#2a2a2a] transition-all"
            >
              <Upload size={24} className="mb-2" />
              <span className="text-sm font-medium">Upload Media</span>
            </button>
            
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Project Media</h3>
              {clips.map((clip, i) => (
                <div 
                  key={clip.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={() => setDraggedClipIndex(null)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer group transition-colors ${selection.id === clip.id ? 'bg-[#333] ring-1 ring-blue-500' : 'bg-[#2a2a2a] hover:bg-[#333]'} ${draggedClipIndex === i ? 'opacity-50' : ''}`}
                  onClick={() => setSelection({ type: 'clip', id: clip.id })}
                >
                  <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 shrink-0">
                    <GripVertical size={14} />
                  </div>
                  <div className="w-10 h-10 bg-black rounded overflow-hidden relative shrink-0">
                    <video src={clip.url} className="w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FilmIcon className="text-white/50 w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{clip.name}</p>
                    <p className="text-xs text-gray-400">{clip.duration.toFixed(1)}s</p>
                  </div>
                  <button 
                    onClick={(e) => handleRemoveClip(e, clip.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#444] rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Remove from project"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            <button 
              onClick={handleAddText}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Add Text Overlay
            </button>
            
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Text Overlays</h3>
              {[...texts].sort((a, b) => a.start - b.start).map((text, i) => (
                <div 
                  key={text.id} 
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer group transition-colors ${selection.id === text.id ? 'bg-[#333] ring-1 ring-blue-500' : 'bg-[#2a2a2a] hover:bg-[#333]'}`}
                  onClick={() => setSelection({ type: 'text', id: text.id })}
                >
                  <div className="w-10 h-10 bg-black rounded flex items-center justify-center shrink-0">
                    <Type className="text-white/50 w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">Text Overlay {i + 1}</p>
                    <p className="text-xs text-gray-400">"{text.text.substring(0, 20)}{text.text.length > 20 ? '...' : ''}"</p>
                  </div>
                  <button 
                    onClick={(e) => handleRemoveText(e, text.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#444] rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Remove text"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transitions' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Transition Points</h3>
              {clips.length > 1 ? (
                Array.from({ length: clips.length - 1 }).map((_, i) => {
                  const transId = `${clips[i].id}-${clips[i+1].id}`;
                  const trans = transitions[transId];
                  return (
                    <div 
                      key={transId} 
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer group transition-colors ${selection.id === transId ? 'bg-[#333] ring-1 ring-blue-500' : 'bg-[#2a2a2a] hover:bg-[#333]'}`}
                      onClick={() => setSelection({ type: 'transition', id: transId })}
                    >
                      <div className="w-10 h-10 bg-black rounded flex items-center justify-center shrink-0">
                        <Sparkles className="text-yellow-500/50 w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">Transition Point {i + 1}</p>
                        <p className="text-xs text-gray-400">{trans ? trans.type.replace('_', ' ') : 'Straight Cut'}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400">Add more clips to create transition points.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-4">
            <input 
              type="file" 
              accept="audio/*" 
              multiple
              className="hidden" 
              ref={audioInputRef} 
              onChange={handleAudioUpload} 
            />
            <button 
              onClick={() => audioInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-[#444] rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 hover:bg-[#2a2a2a] transition-all"
            >
              <Upload size={24} className="mb-2" />
              <span className="text-sm font-medium">Upload Audio</span>
            </button>
            
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Project Audio</h3>
              {audioTracks.map((track, i) => (
                <div 
                  key={track.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer group transition-colors ${selection.id === track.id ? 'bg-[#333] ring-1 ring-blue-500' : 'bg-[#2a2a2a] hover:bg-[#333]'}`}
                  onClick={() => setSelection({ type: 'audio', id: track.id })}
                >
                  <div className="w-10 h-10 bg-black rounded flex items-center justify-center shrink-0">
                    <Music className="text-white/50 w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{track.name}</p>
                    <p className="text-xs text-gray-400">Audio Track {i + 1}</p>
                  </div>
                  <button 
                    onClick={(e) => handleRemoveAudio(e, track.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#444] rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Remove audio"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${
      active ? 'border-blue-500 text-blue-400 bg-[#2a2a2a]' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#222]'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);

const FilmIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M7 3v18" />
    <path d="M17 3v18" />
    <path d="M3 7.5h4" />
    <path d="M3 12h4" />
    <path d="M3 16.5h4" />
    <path d="M17 7.5h4" />
    <path d="M17 12h4" />
    <path d="M17 16.5h4" />
  </svg>
);
