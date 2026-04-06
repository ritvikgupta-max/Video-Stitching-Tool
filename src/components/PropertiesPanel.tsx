import React from 'react';
import { useProject } from '../context/ProjectContext';
import { Settings2, Type, Video, Sparkles } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const { selection, clips, setClips, texts, setTexts, transitions, setTransitions, audioTracks, setAudioTracks, settings, setSettings } = useProject();

  if (!selection.id && selection.type !== 'project') {
    return (
      <div className="w-80 bg-[#1e1e1e] border-l border-[#333] flex flex-col items-center justify-center text-gray-500 p-6 text-center shrink-0">
        <Settings2 size={32} className="mb-4 opacity-50" />
        <p>Select an item in the timeline to edit its properties.</p>
      </div>
    );
  }

  const renderClipProps = () => {
    const clip = clips.find(c => c.id === selection.id);
    if (!clip) return null;

    const updateClip = (updates: Partial<typeof clip>) => {
      setClips(clips.map(c => c.id === clip.id ? { ...c, ...updates } : c));
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Video size={16} className="text-blue-400" />
            Clip Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Name</label>
              <input 
                type="text" 
                value={clip.name} 
                onChange={e => updateClip({ name: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Trim Start (s)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max={clip.trimEnd - 0.1}
                  value={clip.trimStart} 
                  onChange={e => updateClip({ trimStart: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Trim End (s)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min={clip.trimStart + 0.1}
                  max={clip.duration}
                  value={clip.trimEnd} 
                  onChange={e => updateClip({ trimEnd: parseFloat(e.target.value) || clip.duration })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Speed</span>
                <span>{clip.speed.toFixed(2)}x</span>
              </label>
              <input 
                type="range" 
                min="0.1" max="5" step="0.1"
                value={clip.speed}
                onChange={e => updateClip({ speed: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Volume</span>
                <span>{Math.round(clip.volume * 100)}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="2" step="0.1"
                value={clip.volume}
                onChange={e => updateClip({ volume: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTextProps = () => {
    const text = texts.find(t => t.id === selection.id);
    if (!text) return null;

    const updateText = (updates: Partial<typeof text>) => {
      setTexts(texts.map(t => t.id === text.id ? { ...t, ...updates } : t));
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Type size={16} className="text-green-400" />
            Text Overlay
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Content</label>
              <textarea 
                value={text.text} 
                onChange={e => updateText({ text: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none resize-none h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Font Size</label>
                <input 
                  type="number" 
                  value={text.fontsize} 
                  onChange={e => updateText({ fontsize: parseInt(e.target.value) || 48 })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Position</label>
                <select 
                  value={text.position}
                  onChange={e => updateText({ position: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={text.color} 
                    onChange={e => updateText({ color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input 
                    type="text" 
                    value={text.color} 
                    onChange={e => updateText({ color: e.target.value })}
                    className="flex-1 bg-[#2a2a2a] border border-[#444] rounded px-2 text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Background</label>
                <select 
                  value={text.bgColor === 'transparent' ? 'transparent' : 'solid'}
                  onChange={e => updateText({ bgColor: e.target.value === 'transparent' ? 'transparent' : '#000000' })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none mb-1"
                >
                  <option value="transparent">None</option>
                  <option value="solid">Solid Color</option>
                </select>
                {text.bgColor !== 'transparent' && (
                  <input 
                    type="color" 
                    value={text.bgColor} 
                    onChange={e => updateText({ bgColor: e.target.value })}
                    className="w-full h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#333]">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Start Time (s)</label>
                <input 
                  type="number" step="0.1" min="0"
                  value={text.start} 
                  onChange={e => updateText({ start: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">End Time (s)</label>
                <input 
                  type="number" step="0.1" min={text.start + 0.1}
                  value={text.end} 
                  onChange={e => updateText({ end: parseFloat(e.target.value) || (text.start + 1) })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#333]">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Fade In (s)</label>
                <input 
                  type="number" step="0.1" min="0"
                  value={text.fadeIn} 
                  onChange={e => updateText({ fadeIn: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Fade Out (s)</label>
                <input 
                  type="number" step="0.1" min="0"
                  value={text.fadeOut} 
                  onChange={e => updateText({ fadeOut: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectProps = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Settings2 size={16} className="text-purple-400" />
            Export Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Target Duration (s)</label>
              <input 
                type="number" 
                value={settings.targetDuration || ''} 
                onChange={e => setSettings({...settings, targetDuration: e.target.value ? parseInt(e.target.value) : null})}
                placeholder="Auto (based on clips)"
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Resolution (Height)</label>
              <select 
                value={settings.resolution}
                onChange={e => setSettings({...settings, resolution: parseInt(e.target.value)})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value={720}>720p (HD)</option>
                <option value={1080}>1080p (FHD)</option>
                <option value={2160}>2160p (4K)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Aspect Ratio</label>
              <select 
                value={settings.aspectRatio}
                onChange={e => setSettings({...settings, aspectRatio: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3 (Classic)</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Framerate (FPS)</label>
              <select 
                value={settings.fps}
                onChange={e => setSettings({...settings, fps: parseInt(e.target.value)})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value={24}>24 fps (Cinematic)</option>
                <option value={30}>30 fps (Standard)</option>
                <option value={60}>60 fps (Smooth)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Encoding Preset</label>
              <select 
                value={settings.preset}
                onChange={e => setSettings({...settings, preset: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="ultrafast">Ultrafast (Lower quality, fast)</option>
                <option value="fast">Fast</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="slow">Slow (Best quality)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTransitionProps = () => {
    const transId = selection.id!;
    const trans = transitions[transId] || { id: transId, type: 'straight_cut', duration: 1 };

    const updateTrans = (updates: Partial<typeof trans>) => {
      setTransitions({
        ...transitions,
        [transId]: { ...trans, ...updates }
      });
    };

    const applyToAll = () => {
      const newTransitions = { ...transitions };
      for (let i = 0; i < clips.length - 1; i++) {
        const key = `${clips[i].id}-${clips[i+1].id}`;
        newTransitions[key] = {
          id: key,
          type: trans.type,
          duration: trans.duration
        };
      }
      setTransitions(newTransitions);
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            Transition
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Type</label>
              <select 
                value={trans.type}
                onChange={e => updateTrans({ type: e.target.value as any })}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="straight_cut">Straight Cut (None)</option>
                <option value="cross_dissolve">Cross Dissolve</option>
                <option value="fade_to_black">Fade to Black</option>
                <option value="wipe">Wipe</option>
                <option value="zoom_in">Zoom In</option>
                <option value="glitch_light_leaks">Glitch</option>
              </select>
            </div>
            
            {trans.type !== 'straight_cut' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Duration (s)</label>
                <input 
                  type="number" step="0.1" min="0.1" max="5"
                  value={trans.duration} 
                  onChange={e => updateTrans({ duration: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            )}

            <button
              onClick={applyToAll}
              className="w-full bg-[#333] hover:bg-[#444] text-white text-xs py-2 rounded transition-colors mt-4 border border-[#555]"
            >
              Apply to All Transitions
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAudioProps = () => {
    const audio = audioTracks.find(a => a.id === selection.id);
    if (!audio) return null;

    const updateAudio = (updates: Partial<typeof audio>) => {
      setAudioTracks(audioTracks.map(a => a.id === audio.id ? { ...a, ...updates } : a));
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Settings2 size={16} className="text-purple-400" />
            Audio Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Name</label>
              <input 
                type="text" 
                value={audio.name} 
                onChange={e => updateAudio({ name: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Start Time (s)</label>
                <input 
                  type="number" step="0.1" min="0"
                  value={audio.start} 
                  onChange={e => updateAudio({ start: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Fade Out (s)</label>
                <input 
                  type="number" step="0.1" min="0" max="10"
                  value={audio.fadeOut} 
                  onChange={e => updateAudio({ fadeOut: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Trim Start (s)</label>
                <input 
                  type="number" step="0.1" min="0" max={audio.trimEnd - 0.1}
                  value={audio.trimStart} 
                  onChange={e => updateAudio({ trimStart: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Trim End (s)</label>
                <input 
                  type="number" step="0.1" min={audio.trimStart + 0.1} max={audio.duration}
                  value={audio.trimEnd} 
                  onChange={e => updateAudio({ trimEnd: parseFloat(e.target.value) || audio.duration })}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Volume</span>
                <span>{Math.round(audio.volume * 100)}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="1" step="0.05"
                value={audio.volume}
                onChange={e => updateAudio({ volume: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input 
                type="checkbox" 
                checked={audio.replaceAudio}
                onChange={e => updateAudio({ replaceAudio: e.target.checked })}
                className="w-4 h-4 rounded border-gray-400 text-blue-500 focus:ring-blue-500 bg-[#2a2a2a]"
              />
              <span className="text-sm text-gray-300">Replace original clip audio</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-[#1e1e1e] border-l border-[#333] flex flex-col h-full shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-[#333]">
        <h2 className="font-medium text-white">Properties</h2>
      </div>
      <div className="p-4">
        {selection.type === 'clip' && renderClipProps()}
        {selection.type === 'text' && renderTextProps()}
        {selection.type === 'transition' && renderTransitionProps()}
        {selection.type === 'audio' && renderAudioProps()}
        {selection.type === 'project' && renderProjectProps()}
      </div>
    </div>
  );
};
