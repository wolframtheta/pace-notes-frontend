export interface Rally {
  id: string;
  name: string;
  description?: string;
  stageCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RallyCreateInput {
  name: string;
  description?: string;
}

export interface RallyUpdateInput {
  id: string;
  name?: string;
  description?: string;
}
