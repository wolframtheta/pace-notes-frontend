import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  viewChild,
  ElementRef,
  afterNextRender,
  EnvironmentInjector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { StageService } from '../../services/stage.service';
import { PaceNotesService } from '../../../pace-notes/services/pace-notes.service';
import { NoteGroupService } from '../../../pace-notes/services/note-group.service';
import { RallyService } from '../../../rallies/services/rally.service';
import { PaceNote } from '../../../../core/models/pace-note.model';
import { Rally } from '../../../../core/models/rally.model';
import { Stage } from '../../../../core/models/stage.model';

/** Zoom inicial dels mapes d’impressió (OSM suporta fins ~19). */
const PRINT_MAP_ZOOM = 17;
const PRINT_MAP_HEIGHT_PX = 384;

const PACE_NOTE_ICON_RED =
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
const PACE_NOTE_ICON_BLUE =
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
const PACE_NOTE_ICON_GREEN =
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
const MARKER_SHADOW =
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';
const WAYPOINT_END_ICON =
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png';

/** Mateix pin rosa que l’editor; gradient amb id únic per dos mapes a la mateixa pàgina. */
function waypointStartDivIcon(): L.DivIcon {
  const gradId = `pinkGrad-${Math.random().toString(36).slice(2, 11)}`;
  return L.divIcon({
    html: `
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ff1493;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ff69b4;stop-opacity:1" />
          </linearGradient>
        </defs>
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.3 12.5 28.5 12.5 28.5S25 20.8 25 12.5C25 5.6 19.4 0 12.5 0z"
              fill="url(#${gradId})" stroke="#c71585" stroke-width="1.5"/>
        <circle cx="12.5" cy="12.5" r="4" fill="white"/>
        <text x="12.5" y="15" font-size="10" text-anchor="middle" fill="#ff1493" font-weight="bold">1</text>
      </svg>`,
    className: 'print-maps-wp-start',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}

function waypointEndLeafletIcon(): L.Icon {
  return L.icon({
    iconUrl: WAYPOINT_END_ICON,
    shadowUrl: MARKER_SHADOW,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

function paceNoteIconForPrint(iconUrl: string): L.Icon {
  return L.icon({
    iconUrl,
    shadowUrl: MARKER_SHADOW,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

function noteMarkerIconUrl(note: PaceNote): string {
  if (note.type === 'curve') {
    return note.direction === 'left' ? PACE_NOTE_ICON_RED : PACE_NOTE_ICON_BLUE;
  }
  return PACE_NOTE_ICON_GREEN;
}

@Component({
  selector: 'app-stage-print-maps',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="loading-screen">Carregant mapes…</div>
    } @else if (!hasMapData()) {
      <div class="loading-screen">
        Aquest tram no té waypoints ni traç per generar mapes. Defineix inici/final a l’editor.
      </div>
    } @else {
      <div class="print-wrapper">
        <div class="screen-controls">
          <div class="screen-header">
            <h1>{{ rally()?.name }} — {{ stage()!.name }} — Mapes</h1>
            <span class="screen-date">{{ currentDate | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="screen-actions">
            <button type="button" (click)="print()" class="btn-print">Imprimir mapes</button>
            <button type="button" (click)="close()" class="btn-close">Tancar</button>
          </div>
        </div>

        <div class="page page-map">
          <div class="page-header">
            <span class="page-rally">{{ rally()?.name }}</span>
            <span class="page-stage">{{ stage()!.name }}</span>
            <span class="page-tag">Inici</span>
          </div>
          <figure class="map-figure">
            <div #printMapStart class="print-leaflet-map"></div>
            @if (startMapLink()) {
              <a class="map-osm-link" [href]="startMapLink()!" target="_blank" rel="noopener">OpenStreetMap — inici</a>
            }
          </figure>
        </div>

        @if (endMapSection()) {
          <div class="page page-map">
            <div class="page-header">
              <span class="page-rally">{{ rally()?.name }}</span>
              <span class="page-stage">{{ stage()!.name }}</span>
              <span class="page-tag">Final</span>
            </div>
            <figure class="map-figure">
              <div #printMapEnd class="print-leaflet-map"></div>
              @if (endMapLink()) {
                <a class="map-osm-link" [href]="endMapLink()!" target="_blank" rel="noopener">OpenStreetMap — final</a>
              }
            </figure>
          </div>
        }

        <p class="map-attrib screen-attrib">
          © col·laboradors
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>
        </p>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .loading-screen {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px; text-align: center;
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 16px; color: #64748b; max-width: 36rem; margin: 0 auto;
    }
    .print-wrapper { padding-top: 68px; background: #f1f5f9; min-height: 100vh; padding-bottom: 24px; }
    .screen-controls {
      position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
      background: #0f766e; color: white; padding: 10px 24px;
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .screen-header h1 { margin: 0; font-size: 17px; font-family: sans-serif; }
    .screen-date { font-size: 12px; opacity: 0.85; font-family: sans-serif; }
    .screen-actions { display: flex; gap: 10px; }
    .btn-print {
      background: white; color: #0f766e; border: none;
      padding: 8px 18px; border-radius: 6px; cursor: pointer;
      font-size: 14px; font-weight: 700; font-family: sans-serif;
    }
    .btn-close {
      background: #134e4a; color: white; border: none;
      padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-family: sans-serif;
    }
    .page-map {
      width: 210mm; margin: 0 auto 24px; padding: 12mm 16mm 16mm;
      background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.12);
      box-sizing: border-box;
    }
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px;
    }
    .page-rally { font-size: 13px; font-weight: 600; color: #475569; flex: 1; min-width: 0; }
    .page-stage { font-size: 15px; font-weight: 700; color: #0f172a; flex: 1; text-align: center; }
    .page-tag {
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 13px; font-weight: 800; color: #0f766e; text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .map-figure { margin: 0; }
    .print-leaflet-map {
      width: 100%; height: ${PRINT_MAP_HEIGHT_PX}px;
      border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;
    }
    .print-leaflet-map .leaflet-container {
      height: 100%; width: 100%;
      font-family: ui-sans-serif, system-ui, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-leaflet-map .print-maps-wp-start {
      background: transparent !important;
      border: none !important;
    }
    .map-osm-link { display: inline-block; margin-top: 8px; font-size: 11px; color: #0f766e; }
    .map-attrib { font-size: 9px; color: #64748b; font-family: sans-serif; margin: 0 16mm; }
    .screen-attrib { padding: 0 24px 16px; max-width: 210mm; margin-left: auto; margin-right: auto; }

    @media print {
      @page { size: A4 portrait; margin: 0; }
      :host, html, body { margin: 0; padding: 0; background: white; }
      .screen-controls, .screen-attrib { display: none !important; }
      .print-wrapper { padding: 0; background: white; }
      .print-wrapper > div.page-map {
        box-shadow: none; margin: 0; width: 100%;
        min-height: 297mm; padding-top: 16mm;
        page-break-after: always; break-after: page;
      }
      .print-wrapper > div.page-map:last-of-type {
        page-break-after: avoid; break-after: avoid;
      }
      .print-leaflet-map .leaflet-container,
      .print-leaflet-map .leaflet-tile {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `],
})
export class StagePrintMapsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private stageService = inject(StageService);
  private paceNotesService = inject(PaceNotesService);
  private noteGroupService = inject(NoteGroupService);
  private rallyService = inject(RallyService);
  private envInjector = inject(EnvironmentInjector);
  private originalTitle = document.title;

  private printMapStartEl = viewChild<ElementRef<HTMLElement>>('printMapStart');
  private printMapEndEl = viewChild<ElementRef<HTMLElement>>('printMapEnd');

  private mapStart?: L.Map;
  private mapEnd?: L.Map;
  private printRouteLatLng: [number, number][] = [];
  private printCenterStart: { lat: number; lng: number } | null = null;
  private printCenterEnd: { lat: number; lng: number } | null = null;

  stage = this.stageService.currentStage;
  rally = signal<Rally | null>(null);
  loading = signal(true);
  hasMapData = signal(false);
  endMapSection = signal(false);
  startMapLink = signal<string | null>(null);
  endMapLink = signal<string | null>(null);
  currentDate = new Date();

  async ngOnInit() {
    const stageId = this.route.snapshot.paramMap.get('id');
    if (!stageId) {
      this.loading.set(false);
      return;
    }

    const stage = await this.stageService.getStageById(stageId);
    this.stageService.currentStage.set(stage);

    if (!stage) {
      this.loading.set(false);
      return;
    }

    await Promise.all([
      this.paceNotesService.loadNotesByStage(stageId),
      this.noteGroupService.loadByStage(stageId),
      this.rallyService.getRallyById(stage.rallyId).then(r => this.rally.set(r)),
    ]);

    this.configureFromStage(stage);
    this.loading.set(false);

    if (this.hasMapData()) {
      if (this.rally()) document.title = `${this.rally()!.name} - ${stage.name} (mapes)`;
      this.scheduleInitPrintMaps();
    }
  }

  ngOnDestroy(): void {
    this.destroyPrintMaps();
    document.title = this.originalTitle;
  }

  print(): void {
    window.print();
  }

  close(): void {
    window.close();
  }

  private osmMapLink(lat: number, lng: number, zoom = PRINT_MAP_ZOOM): string {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
  }

  private parseWaypoint(raw: unknown): { lat: number; lng: number } | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    const lat = Number(o.lat ?? o.latitude);
    const lng = Number(o.lng ?? o.longitude ?? o.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }

  private endpointsFromRouteGeometry(geom: Stage['routeGeometry']): {
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
  } | null {
    if (!geom || typeof geom !== 'object') return null;
    const g = geom as { type?: string; coordinates?: number[][] };
    if (g.type !== 'LineString' || !Array.isArray(g.coordinates) || g.coordinates.length < 2) {
      return null;
    }
    const first = g.coordinates[0];
    const last = g.coordinates[g.coordinates.length - 1];
    if (!Array.isArray(first) || !Array.isArray(last) || first.length < 2 || last.length < 2) {
      return null;
    }
    const ll = (c: number[]) => ({ lat: c[1], lng: c[0] });
    return { start: ll(first), end: ll(last) };
  }

  private configureFromStage(stage: Stage): void {
    this.printRouteLatLng = [];
    this.printCenterStart = null;
    this.printCenterEnd = null;

    const wps = Array.isArray(stage.waypoints) ? stage.waypoints : [];
    const routeEnds = this.endpointsFromRouteGeometry(stage.routeGeometry);

    let start = wps.length ? this.parseWaypoint(wps[0]) : null;
    let end = wps.length >= 2 ? this.parseWaypoint(wps[wps.length - 1]) : null;

    if (!start && routeEnds) start = routeEnds.start;
    if (!end && routeEnds) end = routeEnds.end;
    if (wps.length === 1 && !end && routeEnds) end = routeEnds.end;

    if (stage.routeGeometry && typeof stage.routeGeometry === 'object') {
      const g = stage.routeGeometry as { type?: string; coordinates?: number[][] };
      if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
        this.printRouteLatLng = g.coordinates
          .filter(c => Array.isArray(c) && c.length >= 2)
          .map(c => [c[1], c[0]] as [number, number]);
      }
    }

    if (!start) {
      this.hasMapData.set(false);
      this.endMapSection.set(false);
      this.startMapLink.set(null);
      this.endMapLink.set(null);
      return;
    }

    this.hasMapData.set(true);
    this.printCenterStart = start;
    this.startMapLink.set(this.osmMapLink(start.lat, start.lng));

    if (!end || (end.lat === start.lat && end.lng === start.lng)) {
      this.printCenterEnd = null;
      this.endMapSection.set(false);
      this.endMapLink.set(null);
    } else {
      this.printCenterEnd = end;
      this.endMapSection.set(true);
      this.endMapLink.set(this.osmMapLink(end.lat, end.lng));
    }
  }

  private scheduleInitPrintMaps(): void {
    afterNextRender(() => this.beginInitPrintMapsWithRetries(0), { injector: this.envInjector });
  }

  private beginInitPrintMapsWithRetries(attempt: number): void {
    const startEl = this.printMapStartEl()?.nativeElement;
    if (startEl) {
      this.initPrintLeafletMaps();
      return;
    }
    if (attempt < 50) {
      setTimeout(() => this.beginInitPrintMapsWithRetries(attempt + 1), 40);
    }
  }

  private initPrintLeafletMaps(): void {
    this.destroyPrintMaps();
    const startEl = this.printMapStartEl()?.nativeElement;
    const centerStart = this.printCenterStart;
    if (!startEl || !centerStart) return;

    const notes = this.paceNotesService.notes();

    this.mapStart = L.map(startEl, { zoomControl: true, attributionControl: true }).setView(
      [centerStart.lat, centerStart.lng],
      PRINT_MAP_ZOOM,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.mapStart);
    this.addTrailAndNotes(
      this.mapStart,
      this.printRouteLatLng,
      notes,
      centerStart,
      this.printCenterEnd,
    );
    this.mapStart.setView([centerStart.lat, centerStart.lng], PRINT_MAP_ZOOM);

    const endEl = this.printMapEndEl()?.nativeElement;
    const centerEnd = this.printCenterEnd;
    if (this.endMapSection() && endEl && centerEnd) {
      this.mapEnd = L.map(endEl, { zoomControl: true, attributionControl: true }).setView(
        [centerEnd.lat, centerEnd.lng],
        PRINT_MAP_ZOOM,
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(this.mapEnd);
      this.addTrailAndNotes(this.mapEnd, this.printRouteLatLng, notes, centerStart, centerEnd);
      this.mapEnd.setView([centerEnd.lat, centerEnd.lng], PRINT_MAP_ZOOM);
    }

    setTimeout(() => {
      this.mapStart?.invalidateSize();
      this.mapEnd?.invalidateSize();
    }, 0);
  }

  private addTrailAndNotes(
    map: L.Map,
    route: [number, number][],
    notes: PaceNote[],
    tramStart: { lat: number; lng: number },
    tramEnd: { lat: number; lng: number } | null,
  ): void {
    if (route.length >= 2) {
      L.polyline(route, { color: 'blue', weight: 4, opacity: 0.7 }).addTo(map);
    }
    for (const note of notes) {
      const label = this.escapeHtml(note.noteLabel || '—');
      L.marker([note.lat, note.lng], { icon: paceNoteIconForPrint(noteMarkerIconUrl(note)) })
        .bindPopup(
          `<div style="font-family:system-ui,sans-serif;font-size:13px"><strong>${label}</strong><br><span style="color:#64748b">#${note.position}</span></div>`,
          { maxWidth: 280, className: 'custom-popup' },
        )
        .addTo(map);
    }

    L.marker([tramStart.lat, tramStart.lng], {
      icon: waypointStartDivIcon(),
      zIndexOffset: 800,
    })
      .bindPopup('<div style="text-align:center;font-weight:700;font-family:system-ui,sans-serif">Inici del tram</div>')
      .addTo(map);

    const distinctEnd =
      tramEnd &&
      (tramEnd.lat !== tramStart.lat || tramEnd.lng !== tramStart.lng);
    if (distinctEnd) {
      L.marker([tramEnd.lat, tramEnd.lng], {
        icon: waypointEndLeafletIcon(),
        zIndexOffset: 800,
      })
        .bindPopup('<div style="text-align:center;font-weight:700;font-family:system-ui,sans-serif">Final del tram</div>')
        .addTo(map);
    }
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private destroyPrintMaps(): void {
    this.mapStart?.remove();
    this.mapEnd?.remove();
    this.mapStart = undefined;
    this.mapEnd = undefined;
  }
}
