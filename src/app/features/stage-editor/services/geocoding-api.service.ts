import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RoadPointResult {
  lat: number;
  lng: number;
  source: 'overpass' | 'overpass_milestone' | 'nominatim' | 'coordinates';
  approximate: boolean;
  detail?: string;
}

@Injectable({ providedIn: 'root' })
export class GeocodingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/geocoding`;

  roadPoint(ref: string, km?: string): Promise<RoadPointResult> {
    let params = new HttpParams().set('ref', ref.trim());
    if (km?.trim()) {
      params = params.set('km', km.trim());
    }
    return firstValueFrom(
      this.http.get<RoadPointResult>(`${this.base}/road-point`, { params }),
    );
  }
}
