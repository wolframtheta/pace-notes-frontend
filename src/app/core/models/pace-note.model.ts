export type PaceNoteType = 'curve' | 'straight';
export type PaceNoteDirection = 'left' | 'right';

export interface PaceNote {
  id: string;
  stageId: string;
  groupId?: string | null;
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
  /** Impressió: salt de pàgina després d’aquesta nota */
  pageBreakAfter?: boolean;
  /** Dir la nota més ràpid (ralla vertical vermella a la impressió) */
  fasterCall?: boolean;
  lat: number;
  lng: number;
  createdAt: Date;
}

export interface PaceNoteCreateInput {
  stageId: string;
  groupId?: string;
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
  pageBreakAfter?: boolean;
  fasterCall?: boolean;
  lat: number;
  lng: number;
}

export interface PaceNoteUpdateInput {
  id: string;
  groupId?: string | null;
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
  pageBreakAfter?: boolean;
  fasterCall?: boolean;
  lat?: number;
  lng?: number;
}
