import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaceNote, PaceNoteCreateInput, PaceNoteUpdateInput } from '../../../core/models/pace-note.model';

@Injectable({ providedIn: 'root' })
export class PaceNotesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/pace-notes`;

  notes = signal<PaceNote[]>([]);

  async loadNotesByStage(stageId: string): Promise<void> {
    const results = await firstValueFrom(
      this.http.get<PaceNote[]>(`${this.baseUrl}/stage/${stageId}`)
    );
    this.notes.set(results.map(this.mapNote));
  }

  async createNote(input: PaceNoteCreateInput): Promise<PaceNote> {
    const row = await firstValueFrom(this.http.post<PaceNote>(this.baseUrl, input));
    return this.mapNote(row);
  }

  async updateNote(input: PaceNoteUpdateInput): Promise<void> {
    const { id, ...rest } = input;
    await firstValueFrom(this.http.patch(`${this.baseUrl}/${id}`, rest));
  }

  async deleteNote(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
  }

  async bulkCreateNotes(notes: PaceNoteCreateInput[]): Promise<void> {
    await firstValueFrom(this.http.post(`${this.baseUrl}/bulk`, notes));
  }

  async deleteNotesByStage(stageId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/stage/${stageId}`));
  }

  private mapNote(row: any): PaceNote {
    return {
      id: row.id,
      stageId: row.stageId ?? row.stage_id,
      groupId: row.groupId ?? row.group_id ?? null,
      position: Number(row.position),
      type: row.type,
      direction: row.direction,
      angle: row.angle != null ? Number(row.angle) : undefined,
      distance: row.distance != null ? Number(row.distance) : undefined,
      noteLabel: row.noteLabel ?? row.note_label,
      customText: row.customText ?? row.custom_text,
      noteBefore: row.noteBefore ?? row.note_before,
      noteAfter: row.noteAfter ?? row.note_after,
      noteBeforeSize: row.noteBeforeSize ?? row.note_before_size ?? undefined,
      noteAfterSize: row.noteAfterSize ?? row.note_after_size ?? undefined,
      notePosition: row.notePosition ?? row.note_position ?? undefined,
      noteGapLeft: row.noteGapLeft ?? row.note_gap_left ?? undefined,
      noteGapRight: row.noteGapRight ?? row.note_gap_right ?? undefined,
      pageBreakAfter: !!(row.pageBreakAfter ?? row.page_break_after),
      fasterCall: !!(row.fasterCall ?? row.faster_call),
      lat: Number(row.lat),
      lng: Number(row.lng),
      createdAt: new Date(row.createdAt ?? row.created_at),
    };
  }
}
