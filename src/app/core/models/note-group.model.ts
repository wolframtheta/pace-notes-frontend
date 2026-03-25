export interface NoteGroup {
  id: string;
  stageId: string;
  name: string;
  position: number;
  createdAt: Date;
}

export interface NoteGroupCreateInput {
  stageId: string;
  name: string;
  position: number;
}

export interface NoteGroupUpdateInput {
  id: string;
  name?: string;
  position?: number;
}
