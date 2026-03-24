import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Rally, RallyCreateInput, RallyUpdateInput } from '../../../core/models/rally.model';

@Injectable({ providedIn: 'root' })
export class RallyService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/rallies`;

  rallies = signal<Rally[]>([]);
  currentRally = signal<Rally | null>(null);

  async loadRallies(): Promise<void> {
    const results = await firstValueFrom(this.http.get<Rally[]>(this.baseUrl));
    this.rallies.set(results.map(this.mapRally));
  }

  async getRallyById(id: string): Promise<Rally | null> {
    try {
      const row = await firstValueFrom(this.http.get<any>(`${this.baseUrl}/${id}`));
      return this.mapRally(row);
    } catch {
      return null;
    }
  }

  async createRally(input: RallyCreateInput): Promise<Rally> {
    const row = await firstValueFrom(this.http.post<Rally>(this.baseUrl, input));
    const rally = this.mapRally(row);
    await this.loadRallies();
    return rally;
  }

  async updateRally(input: RallyUpdateInput): Promise<void> {
    const { id, ...rest } = input;
    await firstValueFrom(this.http.patch(`${this.baseUrl}/${id}`, rest));
    await this.loadRallies();
  }

  async deleteRally(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
    await this.loadRallies();
  }

  private mapRally(row: any): Rally {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      stageCount: row.stageCount ?? row.stages?.length ?? 0,
      createdAt: new Date(row.createdAt ?? row.created_at),
      updatedAt: new Date(row.updatedAt ?? row.updated_at),
    };
  }
}
