export type PaceNoteType = 'curve' | 'straight';
export type PaceNoteDirection = 'left' | 'right';

export interface PaceNote {
  id: string;
  stageId: string;
  position: number;
  type: PaceNoteType;
  direction?: PaceNoteDirection;
  angle?: number;
  distance?: number;
  noteLabel?: string;
  customText?: string;
  noteBefore?: string;
  noteAfter?: string;
  noteBeforeSize?: number;
  noteAfterSize?: number;
  notePosition?: number;
  noteGapLeft?: number;
  noteGapRight?: number;
  lat: number;
  lng: number;
  createdAt: Date;
}

export interface PaceNoteCreateInput {
  stageId: string;
  position: number;
  type: PaceNoteType;
  direction?: PaceNoteDirection;
  angle?: number;
  distance?: number;
  noteLabel?: string;
  customText?: string;
  noteBefore?: string;
  noteAfter?: string;
  noteBeforeSize?: number;
  noteAfterSize?: number;
  notePosition?: number;
  noteGapLeft?: number;
  noteGapRight?: number;
  lat: number;
  lng: number;
}

export interface PaceNoteUpdateInput {
  id: string;
  position?: number;
  type?: PaceNoteType;
  direction?: PaceNoteDirection;
  angle?: number;
  distance?: number;
  noteLabel?: string;
  customText?: string;
  noteBefore?: string;
  noteAfter?: string;
  noteBeforeSize?: number;
  noteAfterSize?: number;
  notePosition?: number;
  noteGapLeft?: number;
  noteGapRight?: number;
  lat?: number;
  lng?: number;
}
