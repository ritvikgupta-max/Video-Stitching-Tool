import React, { useState, useRef } from 'react';
import { Download, Film, Settings, Play, X } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { renderVideo } from '../lib/ffmpeg';

export const Header: React.FC = () => {
  const { clips, texts, transitions, audioTracks, settings, setSelection, totalDuration } = useProject();
  const [isExporting, setIsExporting] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleExport = () => {
    setIsExporting(true);
    // Simulate export process
    setTimeout(() => {
      const config = {
        clips,
        texts,
        transitions,
        audioTracks,
        settings
      };
      
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project_config.json';
      a.click();
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
      alert('Project configuration exported! You can use this JSON with the Python rendering pipeline.');
    }, 1500);
  };

  const handleCancelRender = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleRender = async () => {
    if (clips.length === 0) {
      alert('Please add at least one video clip before rendering.');
      return;
    }

    setIsExporting(true);
    setRenderProgress(0);
    setRenderStatus('Initializing...');
    
    abortControllerRef.current = new AbortController();

    try {
      const blob = await renderVideo(
        clips,
        audioTracks,
        texts,
        settings,
        totalDuration,
        (progress, status) => {
          if (status) setRenderStatus(status);
          if (progress >= 0) setRenderProgress(Math.round(progress * 100));
        },
        abortControllerRef.current.signal
      );

      setRenderStatus('Done!');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rendered_video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Render failed:', error);
      if (error instanceof Error && error.message === 'Render cancelled') {
        alert('Rendering was cancelled.');
      } else {
        alert(`Render failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setIsExporting(false);
      setRenderProgress(0);
      setRenderStatus('');
      abortControllerRef.current = null;
    }
  };

  return (
    <header className="h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 text-white shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
          <Film size={18} />
        </div>
        <h1 className="font-semibold text-lg tracking-tight">VideoStitch Pro</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setSelection({ type: 'project', id: null })}
          className="p-2 hover:bg-[#333] rounded-md transition-colors text-gray-400 hover:text-white"
          title="Project Settings"
        >
          <Settings size={18} />
        </button>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-[#333] hover:bg-[#444] text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          <Download size={16} />
          Export JSON
        </button>
        {isExporting && (
          <button
            onClick={handleCancelRender}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            title="Cancel Rendering"
          >
            <X size={16} />
            Cancel
          </button>
        )}
        <button 
          onClick={handleRender}
          disabled={isExporting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors min-w-[140px] justify-center"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{renderStatus} {renderProgress}%</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Render Video</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
