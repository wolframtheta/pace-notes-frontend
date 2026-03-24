import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Stage, StageCreateInput, StageUpdateInput } from '../../../core/models/stage.model';

@Injectable({ providedIn: 'root' })
export class StageService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/stages`;

  stages = signal<Stage[]>([]);
  currentStage = signal<Stage | null>(null);
  private currentRallyId: string | null = null;

  async loadStages(rallyId: string): Promise<void> {
    this.currentRallyId = rallyId;
    const results = await firstValueFrom(
      this.http.get<Stage[]>(`${this.baseUrl}?rallyId=${rallyId}`)
    );
    this.stages.set(results.map(this.mapStage));
  }

  async getStageById(id: string): Promise<Stage | null> {
    try {
      const row = await firstValueFrom(this.http.get<any>(`${this.baseUrl}/${id}`));
      return this.mapStage(row);
    } catch {
      return null;
    }
  }

  async createStage(input: StageCreateInput): Promise<Stage> {
    const row = await firstValueFrom(this.http.post<any>(this.baseUrl, input));
    return this.mapStage(row);
  }

  async updateStage(input: StageUpdateInput): Promise<void> {
    const { id, ...rest } = input;
    await firstValueFrom(this.http.patch(`${this.baseUrl}/${id}`, rest));
    if (this.currentRallyId) await this.loadStages(this.currentRallyId);
  }

  async deleteStage(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
    if (this.currentRallyId) await this.loadStages(this.currentRallyId);
  }

  private mapStage(row: any): Stage {
    const dist = row.totalDistance ?? row.total_distance;
    return {
      id: row.id,
      rallyId: row.rallyId ?? row.rally_id,
      name: row.name,
      totalDistance: dist != null ? Number(dist) : undefined,
      routeGeometry: row.routeGeometry ?? row.route_geometry,
      waypoints: row.waypoints,
      createdAt: new Date(row.createdAt ?? row.created_at),
      updatedAt: new Date(row.updatedAt ?? row.updated_at),
    };
  }
}
