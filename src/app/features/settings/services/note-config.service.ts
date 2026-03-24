import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NoteConfig, NoteConfigCreateInput, NoteConfigUpdateInput } from '../../../core/models/note-config.model';

@Injectable({ providedIn: 'root' })
export class NoteConfigService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/note-configs`;

  configs = signal<NoteConfig[]>([]);
  activeConfig = signal<NoteConfig | null>(null);

  async loadConfigs(): Promise<void> {
    const results = await firstValueFrom(this.http.get<NoteConfig[]>(this.baseUrl));
    const configs = results.map(this.mapConfig);
    this.configs.set(configs);
    this.activeConfig.set(configs.find(c => c.isActive) ?? null);
  }

  async createConfig(input: NoteConfigCreateInput): Promise<NoteConfig> {
    const row = await firstValueFrom(this.http.post<NoteConfig>(this.baseUrl, input));
    const config = this.mapConfig(row);
    await this.loadConfigs();
    return config;
  }

  async updateConfig(input: NoteConfigUpdateInput): Promise<void> {
    const { id, ...rest } = input;
    await firstValueFrom(this.http.patch(`${this.baseUrl}/${id}`, rest));
    await this.loadConfigs();
  }

  async deleteConfig(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
    await this.loadConfigs();
  }

  getActiveConfig(): NoteConfig | null {
    return this.activeConfig();
  }

  async initializeDefaultConfig(): Promise<void> {
    await firstValueFrom(this.http.post(`${this.baseUrl}/initialize-defaults`, {}));
  }

  private mapConfig(row: any): NoteConfig {
    return {
      id: row.id,
      name: row.name,
      angleRanges: row.angleRanges ?? row.angle_ranges,
      isActive: row.isActive ?? row.is_active,
      createdAt: new Date(row.createdAt ?? row.created_at),
    };
  }
}
