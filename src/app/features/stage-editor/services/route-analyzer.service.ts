import { Injectable, inject } from '@angular/core';
import * as turf from '@turf/turf';
import { PaceNote, PaceNoteType, PaceNoteDirection } from '../../../core/models/pace-note.model';
import { NoteConfigService } from '../../settings/services/note-config.service';

interface RouteSegment {
  type: PaceNoteType;
  startIndex: number;
  endIndex: number;
  coordinates: Array<[number, number]>;
  angle?: number;
  direction?: PaceNoteDirection;
  distance?: number;
  /** Metres des de l’inici del traç (resamplejat) fins al vèrtex `startIndex`; per ordenar inici → final. */
  routeProgressM?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RouteAnalyzerService {
  private noteConfigService = inject(NoteConfigService);

  // Interval de re-mostreig: punts cada N metres (elimina soroll GPS per densitat variable)
  private readonly RESAMPLE_INTERVAL_METERS = 15;
  // Suavitzat de bearings per eliminar micro-oscillacions GPS
  private readonly BEARING_SMOOTH_WINDOW = 5;
  // Mida del bloc endavant per detectar canvi de direcció
  private readonly ANALYSIS_BLOCK_METERS = 60;
  // Angle mínim en el bloc per considerar que hi ha una corba
  private readonly CURVE_THRESHOLD_PER_BLOCK = 2.5;
  // Angle net mínim total del segment per confirmar-lo com a corba real
  private readonly MIN_CURVE_TOTAL_ANGLE = 5;
  // Mínim de punts per a un segment (evita segments massa curts)
  private readonly MIN_SEGMENT_LENGTH = 3;

  analyzeRoute(coordinates: Array<[number, number]>): PaceNote[] {
    if (coordinates.length < 3) return [];

    const resampled = this.resampleRoute(coordinates, this.RESAMPLE_INTERVAL_METERS);
    const rawBearings = this.calculateBearings(resampled);
    const bearings = this.smoothBearings(rawBearings, this.BEARING_SMOOTH_WINDOW);

    console.log('[RouteAnalyzer] Coords orig:', coordinates.length, '→ resampled:', resampled.length);

    const segments = this.identifySegmentsByBlocks(resampled, bearings);
    console.log('[RouteAnalyzer] After identify:', segments.map(s => ({ type: s.type, pts: s.coordinates.length })));

    const validated = this.validateCurveSegments(segments);
    console.log('[RouteAnalyzer] After validate:', validated.map(s => ({ type: s.type, pts: s.coordinates.length })));

    const merged = this.mergeSmallSegments(validated);
    console.log('[RouteAnalyzer] After merge:', merged.map(s => ({ type: s.type, pts: s.coordinates.length })));

    const processed = this.processSegments(merged);
    console.log('[RouteAnalyzer] Final:', processed.map(s => ({
      type: s.type, angle: s.angle?.toFixed(1), dir: s.direction, dist: s.distance?.toFixed(0)
    })));

    const cum = this.cumulativeDistancesM(resampled);
    const ordered = this.orderSegmentsAlongRoute(processed, cum);
    return this.generatePaceNotes(ordered);
  }

  /**
   * Ordena les notes pel punt del traç on cauen (projecció al polyline), inici → final.
   * Útil després d’afegir notes manuals o si les posicions venen desordenades de l’API.
   */
  sortPaceNotesAlongRoute(
    notes: PaceNote[],
    routeCoordinates: Array<[number, number]>,
  ): PaceNote[] {
    if (notes.length <= 1 || routeCoordinates.length < 2) {
      return notes.map((n, i) => ({ ...n, position: i + 1 }));
    }

    const line = turf.lineString(routeCoordinates.map(([lat, lng]) => [lng, lat]));

    const scored = notes.map(note => {
      const snapped = turf.nearestPointOnLine(line, turf.point([note.lng, note.lat]), {
        units: 'meters',
      });
      const progress =
        snapped.properties.lineDistance >= 0
          ? snapped.properties.lineDistance
          : snapped.properties.location;
      return { note, progress };
    });

    scored.sort((a, b) => {
      const d = a.progress - b.progress;
      if (Math.abs(d) < 1e-3) {
        return a.note.position - b.note.position;
      }
      return d;
    });

    return scored.map((x, i) => ({ ...x.note, position: i + 1 }));
  }

  private cumulativeDistancesM(coordinates: Array<[number, number]>): number[] {
    const d: number[] = [0];
    for (let i = 1; i < coordinates.length; i++) {
      const from = turf.point([coordinates[i - 1][1], coordinates[i - 1][0]]);
      const to = turf.point([coordinates[i][1], coordinates[i][0]]);
      d.push(d[i - 1] + turf.distance(from, to, { units: 'meters' }));
    }
    return d;
  }

  private orderSegmentsAlongRoute(
    segments: RouteSegment[],
    cumulativeMeters: number[],
  ): RouteSegment[] {
    if (segments.length <= 1) return segments;

    const last = cumulativeMeters.length - 1;
    const withP = segments.map(seg => {
      const idx = Math.max(0, Math.min(seg.startIndex, last));
      const routeProgressM = cumulativeMeters[idx] ?? 0;
      return { seg: { ...seg, routeProgressM }, progress: routeProgressM };
    });

    withP.sort((a, b) => {
      const d = a.progress - b.progress;
      if (Math.abs(d) < 1e-3) {
        return a.seg.startIndex - b.seg.startIndex;
      }
      return d;
    });

    return withP.map(x => x.seg);
  }

  /**
   * Analitza un punt específic de la ruta per determinar el tipus (corba o recta)
   * Busca el segment de ruta més proper al punt clickat i analitza la seva curvatura
   */
  analyzeCurveAtPoint(
    routeCoordinates: Array<[number, number]>,
    clickLat: number,
    clickLng: number,
    radiusMeters: number = 100
  ): PaceNote | null {
    if (routeCoordinates.length < 3) return null;

    const clickPoint = turf.point([clickLng, clickLat]);
    
    // Trobar el segment més proper
    let closestDistance = Infinity;
    let closestIndex = -1;
    
    for (let i = 0; i < routeCoordinates.length; i++) {
      const routePoint = turf.point([routeCoordinates[i][1], routeCoordinates[i][0]]);
      const distance = turf.distance(clickPoint, routePoint, { units: 'meters' });
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    if (closestIndex === -1 || closestDistance > radiusMeters) {
      console.log('[AnalyzePointAtRoute] No hi ha punts propers dins del radi');
      return null;
    }

    // Extreure segment al voltant del punt
    const segmentCoords: Array<[number, number]> = [];
    let currentDist = 0;
    const halfRadius = radiusMeters / 2;

    // Punts cap enrere
    for (let i = closestIndex; i >= 0 && currentDist < halfRadius; i--) {
      if (i < closestIndex) {
        const from = turf.point([routeCoordinates[i][1], routeCoordinates[i][0]]);
        const to = turf.point([routeCoordinates[i + 1][1], routeCoordinates[i + 1][0]]);
        currentDist += turf.distance(from, to, { units: 'meters' });
      }
      segmentCoords.unshift(routeCoordinates[i]);
    }

    // Punts cap endavant
    currentDist = 0;
    for (let i = closestIndex + 1; i < routeCoordinates.length && currentDist < halfRadius; i++) {
      const from = turf.point([routeCoordinates[i - 1][1], routeCoordinates[i - 1][0]]);
      const to = turf.point([routeCoordinates[i][1], routeCoordinates[i][0]]);
      currentDist += turf.distance(from, to, { units: 'meters' });
      segmentCoords.push(routeCoordinates[i]);
    }

    if (segmentCoords.length < 3) {
      console.log('[AnalyzePointAtRoute] Segment massa curt');
      return null;
    }

    // Analitzar curvatura del segment
    const { angle, direction } = this.calculateCurveAngle(segmentCoords);
    
    console.log(`[AnalyzePointAtRoute] Angle detectat: ${angle.toFixed(1)}° ${direction}`);

    // Si l'angle és massa petit, és una recta
    if (angle < this.MIN_CURVE_TOTAL_ANGLE) {
      const distance = this.calculateDistance(segmentCoords);
      const noteLabel = `${Math.round(distance)}m`;
      
      console.log(`[AnalyzePointAtRoute] Detectada recta de ${distance.toFixed(0)}m`);

      return {
        id: crypto.randomUUID(),
        stageId: '',
        position: 0,
        type: 'straight',
        distance,
        noteLabel,
        lat: clickLat,
        lng: clickLng,
        createdAt: new Date()
      };
    }

    // És una corba
    const activeConfig = this.noteConfigService.getActiveConfig();
    const classification = this.classifyAngle(angle, activeConfig?.angleRanges);
    const directionLabel = direction === 'left' ? 'I' : 'D';
    const noteLabel = `${directionLabel}${classification}`;

    console.log(`[AnalyzePointAtRoute] Detectada corba ${noteLabel}`);

    return {
      id: crypto.randomUUID(),
      stageId: '',
      position: 0,
      type: 'curve',
      direction,
      angle,
      noteLabel,
      lat: clickLat,
      lng: clickLng,
      createdAt: new Date()
    };
  }

  private resampleRoute(coordinates: Array<[number, number]>, intervalMeters: number): Array<[number, number]> {
    const resampled: Array<[number, number]> = [coordinates[0]];
    let accumulated = 0;

    for (let i = 1; i < coordinates.length; i++) {
      const from = turf.point([coordinates[i - 1][1], coordinates[i - 1][0]]);
      const to = turf.point([coordinates[i][1], coordinates[i][0]]);
      accumulated += turf.distance(from, to, { units: 'meters' });

      if (accumulated >= intervalMeters) {
        resampled.push(coordinates[i]);
        accumulated = 0;
      }
    }

    const last = coordinates[coordinates.length - 1];
    if (resampled[resampled.length - 1] !== last) resampled.push(last);

    return resampled;
  }

  private calculateBearings(coordinates: Array<[number, number]>): number[] {
    const bearings: number[] = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = turf.point([coordinates[i][1], coordinates[i][0]]);
      const to = turf.point([coordinates[i + 1][1], coordinates[i + 1][0]]);
      bearings.push(turf.bearing(from, to));
    }
    return bearings;
  }

  private smoothBearings(bearings: number[], windowSize: number): number[] {
    const half = Math.floor(windowSize / 2);
    return bearings.map((_, i) => {
      const start = Math.max(0, i - half);
      const end = Math.min(bearings.length, i + half + 1);
      const window = bearings.slice(start, end);
      const sinSum = window.reduce((s, b) => s + Math.sin(b * Math.PI / 180), 0);
      const cosSum = window.reduce((s, b) => s + Math.cos(b * Math.PI / 180), 0);
      return Math.atan2(sinSum / window.length, cosSum / window.length) * 180 / Math.PI;
    });
  }

  // Per cada punt, mira el canvi de bearing en un bloc de ANALYSIS_BLOCK_METERS endavant.
  // Bearings ja suavitzats → estables i fiables.
  private identifySegmentsByBlocks(
    coordinates: Array<[number, number]>,
    bearings: number[]
  ): RouteSegment[] {
    const distances: number[] = [0];
    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = turf.point([coordinates[i][1], coordinates[i][0]]);
      const to = turf.point([coordinates[i + 1][1], coordinates[i + 1][0]]);
      distances.push(distances[i] + turf.distance(from, to, { units: 'meters' }));
    }

    const isCurvePoint: boolean[] = new Array(coordinates.length).fill(false);

    for (let i = 0; i < bearings.length - 1; i++) {
      const targetDist = distances[i] + this.ANALYSIS_BLOCK_METERS;
      let j = i + 1;
      while (j < bearings.length - 1 && distances[j] < targetDist) j++;
      if (j <= i + 1) continue;

      const blockAngle = Math.abs(this.normalizeAngle(bearings[j] - bearings[i]));
      if (blockAngle > this.CURVE_THRESHOLD_PER_BLOCK) {
        isCurvePoint[i] = true;
      }
    }

    const segments: RouteSegment[] = [];
    let currentSegment: RouteSegment | null = null;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const isCurve = isCurvePoint[i];

      if (!currentSegment) {
        currentSegment = {
          type: isCurve ? 'curve' : 'straight',
          startIndex: i,
          endIndex: i + 1,
          coordinates: [coordinates[i], coordinates[i + 1]]
        };
      } else if (
        (isCurve && currentSegment.type === 'curve') ||
        (!isCurve && currentSegment.type === 'straight')
      ) {
        currentSegment.endIndex = i + 1;
        currentSegment.coordinates.push(coordinates[i + 1]);
      } else {
        segments.push(currentSegment);
        currentSegment = {
          type: isCurve ? 'curve' : 'straight',
          startIndex: i,
          endIndex: i + 1,
          coordinates: [coordinates[i], coordinates[i + 1]]
        };
      }
    }

    if (currentSegment) segments.push(currentSegment);
    return segments;
  }

  private validateCurveSegments(segments: RouteSegment[]): RouteSegment[] {
    return segments.map(segment => {
      if (segment.type !== 'curve') return segment;

      const { angle } = this.calculateCurveAngle(segment.coordinates);
      console.log(`[Validate] angle_net=${angle.toFixed(1)}°`);

      if (angle < this.MIN_CURVE_TOTAL_ANGLE) {
        return { ...segment, type: 'straight' as PaceNoteType };
      }
      return segment;
    });
  }

  private mergeSmallSegments(segments: RouteSegment[]): RouteSegment[] {
    if (segments.length === 0) return [];

    const merged: RouteSegment[] = [];
    for (const segment of segments) {
      const prev = merged[merged.length - 1];
      if (prev && prev.type === segment.type) {
        prev.endIndex = segment.endIndex;
        prev.coordinates = [...prev.coordinates, ...segment.coordinates.slice(1)];
      } else {
        merged.push({ ...segment, coordinates: [...segment.coordinates] });
      }
    }

    const result: RouteSegment[] = [];
    for (let i = 0; i < merged.length; i++) {
      const seg = merged[i];
      if (seg.coordinates.length >= this.MIN_SEGMENT_LENGTH) {
        result.push(seg);
      } else if (result.length > 0) {
        const prev = result[result.length - 1];
        prev.endIndex = seg.endIndex;
        prev.coordinates = [...prev.coordinates, ...seg.coordinates.slice(1)];
      } else if (i + 1 < merged.length) {
        const next = merged[i + 1];
        next.startIndex = seg.startIndex;
        next.coordinates = [...seg.coordinates, ...next.coordinates.slice(1)];
      }
    }

    return result;
  }

  private processSegments(segments: RouteSegment[]): RouteSegment[] {
    return segments.map(segment => {
      if (segment.type === 'curve') {
        const { angle, direction } = this.calculateCurveAngle(segment.coordinates);
        return { ...segment, angle, direction };
      } else {
        const distance = this.calculateDistance(segment.coordinates);
        return { ...segment, distance };
      }
    });
  }

  private calculateCurveAngle(coordinates: Array<[number, number]>): {
    angle: number;
    direction: PaceNoteDirection;
  } {
    if (coordinates.length < 2) return { angle: 0, direction: 'left' };

    const bearings: number[] = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = turf.point([coordinates[i][1], coordinates[i][0]]);
      const to = turf.point([coordinates[i + 1][1], coordinates[i + 1][0]]);
      bearings.push(turf.bearing(from, to));
    }

    let netAngle = 0;
    for (let i = 0; i < bearings.length - 1; i++) {
      netAngle += this.normalizeAngle(bearings[i + 1] - bearings[i]);
    }

    return {
      angle: Math.abs(netAngle),
      direction: netAngle > 0 ? 'right' : 'left'
    };
  }

  private calculateDistance(coordinates: Array<[number, number]>): number {
    let total = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = turf.point([coordinates[i][1], coordinates[i][0]]);
      const to = turf.point([coordinates[i + 1][1], coordinates[i + 1][0]]);
      total += turf.distance(from, to, { units: 'meters' });
    }
    return total;
  }

  private normalizeAngle(angle: number): number {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  }

  private generatePaceNotes(segments: RouteSegment[]): PaceNote[] {
    const activeConfig = this.noteConfigService.getActiveConfig();

    return segments.map((segment, index) => {
      const centerIndex = Math.floor(segment.coordinates.length / 2);
      const [lat, lng] = segment.coordinates[centerIndex];

      let noteLabel = '';

      if (segment.type === 'curve' && segment.angle !== undefined) {
        const classification = this.classifyAngle(segment.angle, activeConfig?.angleRanges);
        const directionLabel = segment.direction === 'left' ? 'I' : 'D';
        noteLabel = `${directionLabel}${classification}`;
      } else if (segment.type === 'straight' && segment.distance !== undefined) {
        noteLabel = `${Math.round(segment.distance)}m`;
      }

      return {
        id: crypto.randomUUID(),
        stageId: '',
        position: index + 1,
        type: segment.type,
        direction: segment.direction,
        angle: segment.angle,
        distance: segment.distance,
        noteLabel,
        lat,
        lng,
        createdAt: new Date()
      };
    });
  }

  private classifyAngle(angle: number, ranges?: Array<{ min: number; max: number; label: string }>): string {
    if (!ranges || ranges.length === 0) {
      if (angle < 30) return 'T';
      if (angle < 60) return 'TF';
      if (angle < 90) return 'ST';
      if (angle < 120) return 'S';
      if (angle < 150) return 'SP';
      return 'P';
    }

    for (const range of ranges) {
      if (angle >= range.min && angle < range.max) {
        return range.label;
      }
    }

    return '?';
  }
}
