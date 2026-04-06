export type MediaType = 'video' | 'audio' | 'text' | 'transition';

export interface Clip {
  id: string;
  name: string;
  url: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  volume: number;
}

export interface Transition {
  id: string;
  type: string;
  duration: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  start: number;
  end: number;
  position: string;
  fontsize: number;
  color: string;
  bgColor: string;
  font: string;
  fadeIn: number;
  fadeOut: number;
}

export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  start: number;
  volume: number;
  fadeOut: number;
  replaceAudio: boolean;
}

export type Selection = {
  type: 'clip' | 'text' | 'audio' | 'transition' | 'project';
  id: string | null;
};

export interface ProjectSettings {
  targetDuration: number | null;
  resolution: number;
  aspectRatio: string;
  fps: number;
  preset: string;
  bitrate: string;
}
