import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NoteGroup, NoteGroupCreateInput, NoteGroupUpdateInput } from '../../../core/models/note-group.model';

@Injectable({ providedIn: 'root' })
export class NoteGroupService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/note-groups`;

  groups = signal<NoteGroup[]>([]);

  async loadByStage(stageId: string): Promise<void> {
    const results = await firstValueFrom(
      this.http.get<NoteGroup[]>(`${this.baseUrl}/stage/${stageId}`)
    );
    this.groups.set(results.map(this.mapGroup));
  }

  async create(input: NoteGroupCreateInput): Promise<NoteGroup> {
    const row = await firstValueFrom(this.http.post<NoteGroup>(this.baseUrl, input));
    const group = this.mapGroup(row);
    this.groups.update(gs => [...gs, group].sort((a, b) => a.position - b.position));
    return group;
  }

  async update(input: NoteGroupUpdateInput): Promise<void> {
    const { id, ...rest } = input;
    const row = await firstValueFrom(this.http.patch<NoteGroup>(`${this.baseUrl}/${id}`, rest));
    const updated = this.mapGroup(row);
    this.groups.update(gs => gs.map(g => g.id === id ? updated : g).sort((a, b) => a.position - b.position));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
    this.groups.update(gs => gs.filter(g => g.id !== id));
  }

  private mapGroup(row: any): NoteGroup {
    return {
      id: row.id,
      stageId: row.stageId ?? row.stage_id,
      name: row.name,
      position: Number(row.position),
      createdAt: new Date(row.createdAt ?? row.created_at),
    };
  }
}
