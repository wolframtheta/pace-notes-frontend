export interface AngleRange {
  min: number;
  max: number;
  label: string;
}

export interface NoteConfig {
  id: string;
  name: string;
  angleRanges: AngleRange[];
  isActive: boolean;
  createdAt: Date;
}

export interface NoteConfigCreateInput {
  name: string;
  angleRanges: AngleRange[];
  isActive: boolean;
}

export interface NoteConfigUpdateInput {
  id: string;
  name?: string;
  angleRanges?: AngleRange[];
  isActive?: boolean;
}
