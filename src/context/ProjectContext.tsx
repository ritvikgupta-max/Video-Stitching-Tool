import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Clip, TextOverlay, AudioTrack, Transition, Selection, ProjectSettings } from '../types';

interface ProjectContextType {
  clips: Clip[];
  setClips: React.Dispatch<React.SetStateAction<Clip[]>>;
  texts: TextOverlay[];
  setTexts: React.Dispatch<React.SetStateAction<TextOverlay[]>>;
  transitions: Record<string, Transition>;
  setTransitions: React.Dispatch<React.SetStateAction<Record<string, Transition>>>;
  audioTracks: AudioTrack[];
  setAudioTracks: React.Dispatch<React.SetStateAction<AudioTrack[]>>;
  settings: ProjectSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProjectSettings>>;
  selection: Selection;
  setSelection: React.Dispatch<React.SetStateAction<Selection>>;
  playhead: number;
  setPlayhead: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  totalDuration: number;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const DUMMY_CLIPS: Clip[] = [
  { id: 'c1', name: 'Intro Sequence.mp4', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', duration: 10, trimStart: 0, trimEnd: 5, speed: 1, volume: 1 },
  { id: 'c2', name: 'Main Action.mp4', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', duration: 10, trimStart: 2, trimEnd: 8, speed: 1, volume: 1 },
];

const DUMMY_TEXTS: TextOverlay[] = [
  { id: 't1', text: 'Summer Vibes', start: 1, end: 4, position: 'center', fontsize: 64, color: '#ffffff', bgColor: 'transparent', font: 'Inter', fadeIn: 0.5, fadeOut: 0.5 }
];

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clips, setClips] = useState<Clip[]>(DUMMY_CLIPS);
  const [texts, setTexts] = useState<TextOverlay[]>(DUMMY_TEXTS);
  const [transitions, setTransitions] = useState<Record<string, Transition>>({
    'c1-c2': { id: 'tr1', type: 'cross_dissolve', duration: 1 }
  });
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([{
    id: 'a1',
    name: 'Background Music.mp3',
    url: '',
    duration: 10,
    trimStart: 0,
    trimEnd: 10,
    start: 0,
    volume: 0.15,
    fadeOut: 3,
    replaceAudio: false
  }]);
  const [settings, setSettings] = useState<ProjectSettings>({
    targetDuration: null,
    resolution: 720,
    aspectRatio: '16:9',
    fps: 24,
    preset: 'medium',
    bitrate: '5000k'
  });
  const [selection, setSelection] = useState<Selection>({ type: 'project', id: null });
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Calculate total duration
  const totalDuration = clips.reduce((acc, clip) => acc + (clip.trimEnd - clip.trimStart) / clip.speed, 0);

  return (
    <ProjectContext.Provider value={{
      clips, setClips,
      texts, setTexts,
      transitions, setTransitions,
      audioTracks, setAudioTracks,
      settings, setSettings,
      selection, setSelection,
      playhead, setPlayhead,
      isPlaying, setIsPlaying,
      totalDuration
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
