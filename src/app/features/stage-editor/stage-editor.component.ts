import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MapComponent } from './components/map/map.component';
import { MapToolbarComponent } from './components/map-toolbar/map-toolbar.component';
import { RouteToolbarComponent } from './components/route-toolbar/route-toolbar.component';
import { RouteSummaryComponent } from './components/route-summary/route-summary.component';
import { MapService } from './services/map.service';
import { RouteAnalyzerService } from './services/route-analyzer.service';
import { OsrmService } from './services/osrm.service';
import { StageService } from '../stages/services/stage.service';
import { PaceNotesService } from '../pace-notes/services/pace-notes.service';
import { NoteGroupService } from '../pace-notes/services/note-group.service';
import { PaceNote, PaceNoteCreateInput } from '../../core/models/pace-note.model';
import { Stage } from '../../core/models/stage.model';
import { NotificationService } from '../../core/services/notification.service';
import { LoadingService } from '../../core/services/loading.service';
import { GeocodingApiService, RoadPointResult } from './services/geocoding-api.service';
import { tryParseCoordinates } from './utils/parse-coordinates';

@Component({
  selector: 'app-stage-editor',
  standalone: true,
  imports: [MapComponent, MapToolbarComponent, RouteToolbarComponent, RouteSummaryComponent, FormsModule],
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
  template: `
    <div class="h-full flex gap-4">
      <div class="flex-1 flex flex-col gap-4">
        <div class="bg-white p-4 rounded-lg shadow-lg">
          <label class="block text-sm font-medium mb-2">Nom del Tram</label>
          <input
            [(ngModel)]="stageName"
            type="text"
            class="w-full border rounded px-3 py-2"
            placeholder="Tram de Montserrat - SP1"
          />
        </div>

        <div class="bg-white p-4 rounded-lg shadow-lg space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="border border-slate-200 rounded-lg p-3 space-y-2">
              <div class="flex justify-between items-center gap-2">
                <span class="text-sm font-semibold text-slate-800">Inici</span>
                <button
                  type="button"
                  (click)="clearSearchStart()"
                  [disabled]="!hasStartSearchContent()"
                  class="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Treure
                </button>
              </div>
              <label class="block text-xs text-slate-600">Carretera o coordenades (lat, lng)</label>
              <input
                [(ngModel)]="roadSearchStartRef"
                (ngModelChange)="onSearchStartChange()"
                type="text"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="TP-2442 o 41,39 2,17"
              />
              <label class="block text-xs text-slate-600">PK (km), opcional si no són coordenades</label>
              <input
                [(ngModel)]="roadSearchStartKm"
                (ngModelChange)="onSearchStartChange()"
                type="text"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="1,70"
              />
              <button
                type="button"
                (click)="goSearchStart()"
                class="w-full sm:w-auto px-4 py-2 rounded bg-emerald-700 text-white text-sm hover:bg-emerald-800"
              >
                Anar a inici
              </button>
            </div>
            <div class="border border-slate-200 rounded-lg p-3 space-y-2">
              <div class="flex justify-between items-center gap-2">
                <span class="text-sm font-semibold text-slate-800">Final</span>
                <button
                  type="button"
                  (click)="clearSearchEnd()"
                  [disabled]="!hasEndSearchContent()"
                  class="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Treure
                </button>
              </div>
              <label class="block text-xs text-slate-600">Carretera o coordenades (lat, lng)</label>
              <input
                [(ngModel)]="roadSearchEndRef"
                (ngModelChange)="onSearchEndChange()"
                type="text"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="C-16 o 42,12 2,45"
              />
              <label class="block text-xs text-slate-600">PK (km), opcional</label>
              <input
                [(ngModel)]="roadSearchEndKm"
                (ngModelChange)="onSearchEndChange()"
                type="text"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="12,5"
              />
              <button
                type="button"
                (click)="goSearchEnd()"
                class="w-full sm:w-auto px-4 py-2 rounded bg-rose-700 text-white text-sm hover:bg-rose-800"
              >
                Anar a final
              </button>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              (click)="clearRoadSearch()"
              [disabled]="!hasRoadSearchContent()"
              class="px-3 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-sm"
              title="Netejar tots els camps i pins"
            >
              Netejar tota la cerca
            </button>
          </div>
          <p class="text-xs text-gray-500">
            El mateix camp accepta referència de carretera o dues coordenades (lat, lng). Amb coordenades el PK s’ignora.
            El PK ve d’OSM i pot diferir del punt quilomètric oficial. Pins: verd inici, vermell final.
          </p>
        </div>
        
        <div class="flex-1 min-h-0">
          <div class="mb-3">
            <app-map-toolbar />
          </div>
          
          <div class="relative h-full">
            <app-map
              (curvePointClicked)="onCurvePointClicked($event)"
              (mapReady)="onMapReady()"
            />
            
            <!-- Indicador de mode tecla C -->
            @if (mapService.currentMode() === 'addCurveNote') {
              <div class="absolute top-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold z-[1000] flex items-center gap-2">
                <span>🎯</span>
                <span>Mode: Afegir Nota</span>
                <span class="text-xs opacity-75">(mantingues C pressiona)</span>
              </div>
            }
            
            <!-- Llegenda dels pins -->
            @if (paceNotes().length > 0) {
              <div class="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs z-[1000]">
                <div class="font-bold mb-2">Llegenda</div>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Corba Esquerra</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-barrufet-500 rounded"></div>
                    <span>Corba Dreta</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Recta</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
        
        @if (paceNotes().length > 0) {
          <div class="h-64 bg-white rounded-lg shadow-lg p-4 overflow-auto">
            <h3 class="text-lg font-bold mb-3">Notes de Pilot Generades</h3>
            <table class="w-full text-sm">
              <thead class="border-b">
                <tr>
                  <th class="text-left p-2">#</th>
                  <th class="text-left p-2">Tipus</th>
                  <th class="text-left p-2">Angle</th>
                  <th class="text-left p-2">Distància</th>
                  <th class="text-left p-2">Etiqueta</th>
                </tr>
              </thead>
              <tbody>
                @for (note of paceNotes(); track note.position) {
                  <tr class="border-b hover:bg-gray-50">
                    <td class="p-2">{{ note.position }}</td>
                    <td class="p-2">{{ note.type === 'curve' ? 'Corba' : 'Recta' }}</td>
                    <td class="p-2">
                      @if (note.angle) {
                        {{ note.angle.toFixed(0) }}° {{ note.direction === 'left' ? 'E' : 'D' }}
                      } @else {
                        -
                      }
                    </td>
                    <td class="p-2">
                      @if (note.distance) {
                        {{ note.distance.toFixed(0) }}m
                      } @else {
                        -
                      }
                    </td>
                    <td class="p-2 font-bold">{{ note.noteLabel }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
      
      <div class="w-64 space-y-4">
        <app-route-toolbar 
          (analyze)="onAnalyze()"
          (save)="onSave()"
        />
        
        <app-route-summary 
          [waypointCount]="waypointCount()"
          [totalDistance]="totalDistance()"
          [noteCount]="paceNotes().length"
        />
      </div>
    </div>
  `
})
export class StageEditorComponent implements OnInit {
  mapService = inject(MapService);
  private osrmService = inject(OsrmService);
  private routeAnalyzer = inject(RouteAnalyzerService);
  private stageService = inject(StageService);
  private paceNotesService = inject(PaceNotesService);
  private noteGroupService = inject(NoteGroupService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);
  private loading = inject(LoadingService);
  private geocodingApi = inject(GeocodingApiService);

  paceNotes = signal<PaceNote[]>([]);
  totalDistance = signal<number | null>(null);
  stageName = '';
  roadSearchStartRef = '';
  roadSearchStartKm = '';
  roadSearchEndRef = '';
  roadSearchEndKm = '';
  currentRouteGeometry: any = null;

  private mapInitialized = false;
  private pendingHydrateStage: Stage | null = null;

  waypointCount = computed(() => this.mapService.waypoints().length);

  async ngOnInit(): Promise<void> {
    const stageId = this.route.snapshot.queryParamMap.get('stageId');
    const rallyId = this.route.snapshot.queryParamMap.get('rallyId');
    if (!stageId || !rallyId) return;

    try {
      await this.loading.wrap((async () => {
        const stage = await this.stageService.getStageById(stageId);
        if (!stage) {
          this.notification.error('Tram no trobat', 'No s\'ha pogut carregar el tram');
          return;
        }
        if (stage.rallyId !== rallyId) {
          this.notification.warn('Rally incorrecte', 'Els paràmetres de l\'URL no coincideixen');
          return;
        }

        await this.paceNotesService.loadNotesByStage(stageId);
        const notes = [...this.paceNotesService.notes()].sort((a, b) => a.position - b.position);
        this.paceNotes.set(notes);

        this.stageName = stage.name;
        this.totalDistance.set(stage.totalDistance ?? null);
        this.currentRouteGeometry = stage.routeGeometry ?? null;

        this.pendingHydrateStage = stage;
        this.tryHydrateFromPendingStage();
      })());
    } catch (e) {
      console.error(e);
      this.notification.error('Error', 'No s\'ha pogut carregar el tram per editar');
    }
  }

  onMapReady(): void {
    this.mapInitialized = true;
    this.tryHydrateFromPendingStage();
  }

  onSearchStartChange(): void {
    const line = this.roadSearchStartRef?.trim() ?? '';
    if (!line) {
      this.mapService.clearRoadSearchStartPin();
    }
  }

  onSearchEndChange(): void {
    const line = this.roadSearchEndRef?.trim() ?? '';
    if (!line) {
      this.mapService.clearRoadSearchEndPin();
    }
  }

  hasStartSearchContent(): boolean {
    const line = this.roadSearchStartRef?.trim() ?? '';
    const km = this.roadSearchStartKm?.trim() ?? '';
    return !!(line || km || this.mapService.hasRoadSearchStartPin());
  }

  hasEndSearchContent(): boolean {
    const line = this.roadSearchEndRef?.trim() ?? '';
    const km = this.roadSearchEndKm?.trim() ?? '';
    return !!(line || km || this.mapService.hasRoadSearchEndPin());
  }

  /** Hi ha text, o algun pin de cerca al mapa. */
  hasRoadSearchContent(): boolean {
    const a = this.roadSearchStartRef?.trim() ?? '';
    const b = this.roadSearchStartKm?.trim() ?? '';
    const c = this.roadSearchEndRef?.trim() ?? '';
    const d = this.roadSearchEndKm?.trim() ?? '';
    return !!(a || b || c || d || this.mapService.hasRoadSearchPin());
  }

  clearSearchStart(): void {
    this.roadSearchStartRef = '';
    this.roadSearchStartKm = '';
    this.mapService.clearRoadSearchStartPin();
  }

  clearSearchEnd(): void {
    this.roadSearchEndRef = '';
    this.roadSearchEndKm = '';
    this.mapService.clearRoadSearchEndPin();
  }

  clearRoadSearch(): void {
    this.clearSearchStart();
    this.clearSearchEnd();
  }

  async goSearchStart(): Promise<void> {
    const line = this.roadSearchStartRef?.trim() ?? '';
    if (!line) {
      this.notification.warn('Inici', 'Indica carretera o coordenades (lat, lng)');
      return;
    }
    await this.runSearchToPin(
      line,
      this.roadSearchStartKm,
      'start',
      (lat, lng) => {
        this.mapService.setRoadSearchStartPin(lat, lng);
        this.mapService.fitSearchPinsView();
      },
    );
  }

  async goSearchEnd(): Promise<void> {
    const line = this.roadSearchEndRef?.trim() ?? '';
    if (!line) {
      this.notification.warn('Final', 'Indica carretera o coordenades (lat, lng)');
      return;
    }
    await this.runSearchToPin(
      line,
      this.roadSearchEndKm,
      'end',
      (lat, lng) => {
        this.mapService.setRoadSearchEndPin(lat, lng);
        this.mapService.fitSearchPinsView();
      },
    );
  }

  private async resolveSearchLocation(
    refLine: string,
    kmRaw: string,
  ): Promise<RoadPointResult> {
    const t = refLine.trim();
    const coords = tryParseCoordinates(t);
    if (coords) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        source: 'coordinates',
        approximate: false,
        detail: 'Coordenades',
      };
    }
    return this.geocodingApi.roadPoint(t, kmRaw?.trim() || undefined);
  }

  private async runSearchToPin(
    refLine: string,
    kmField: string,
    label: 'start' | 'end',
    place: (lat: number, lng: number) => void,
  ): Promise<void> {
    try {
      await this.loading.wrap(
        (async () => {
          const result = await this.resolveSearchLocation(refLine, kmField);
          place(result.lat, result.lng);
          const title = label === 'start' ? 'Inici' : 'Final';
          this.notification.info(
            `${title} trobat`,
            result.detail ?? `${result.source} · ${result.approximate ? 'aproximat' : ''}`,
          );
        })(),
      );
    } catch (e: unknown) {
      let msg = 'No s\'ha pogut resoldre el punt';
      if (e instanceof HttpErrorResponse) {
        const body = e.error;
        if (body && typeof body === 'object' && 'message' in body) {
          msg = String((body as { message: string }).message);
        } else if (typeof body === 'string') {
          msg = body;
        }
      }
      this.notification.error('Cerca', msg);
    }
  }

  private tryHydrateFromPendingStage(): void {
    if (!this.mapInitialized || !this.pendingHydrateStage) return;

    const stage = this.pendingHydrateStage;
    this.pendingHydrateStage = null;

    if (stage.waypoints?.length) {
      const wps =
        stage.waypoints.length > 2
          ? [stage.waypoints[0], stage.waypoints[stage.waypoints.length - 1]]
          : stage.waypoints;
      for (const wp of wps) {
        this.mapService.addWaypoint(wp.lat, wp.lng);
      }
    }

    if (stage.routeGeometry?.coordinates?.length) {
      const coords = stage.routeGeometry.coordinates.map(
        (c: number[]) => [c[1], c[0]] as [number, number],
      );
      this.mapService.drawRoute(coords);
    } else if (this.mapService.waypoints().length >= 2) {
      void this.refreshRouteFromOsrm();
    }

    if (this.paceNotes().length > 0) {
      this.mapService.addNoteMarkers(this.paceNotes());
    }
  }

  private async refreshRouteFromOsrm(): Promise<void> {
    const wps = this.mapService.waypoints();
    if (wps.length < 2) return;
    try {
      const route = await this.osrmService.getRoute(wps);
      if (route) this.mapService.drawRoute(route);
    } catch (e) {
      console.error('Error recalculant ruta:', e);
    }
  }

  onCurvePointClicked(event: { lat: number; lng: number }): void {
    const routeCoords = this.mapService.routeCoordinates();
    
    if (routeCoords.length < 3) {
      console.log('[NotePoint] No hi ha ruta analitzada');
      return;
    }

    const note = this.routeAnalyzer.analyzeCurveAtPoint(
      routeCoords,
      event.lat,
      event.lng,
      100
    );

    if (note) {
      const currentNotes = this.paceNotes();
      note.position = currentNotes.length + 1;
      
      this.paceNotes.set([...currentNotes, note]);
      
      this.mapService.addNoteMarkers(this.paceNotes());
      
      const typeLabel = note.type === 'curve' ? 'Corba' : 'Recta';
      console.log(`[NotePoint] Nova nota ${typeLabel} afegida:`, note.noteLabel);
    } else {
      console.log('[NotePoint] No s\'ha detectat cap element en aquest punt');
    }
  }

  async onAnalyze(): Promise<void> {
    const waypoints = this.mapService.waypoints();
    
    if (waypoints.length < 2) {
      this.notification.warn('Waypoints insuficients', 'Necessites almenys 2 waypoints per analitzar la ruta');
      return;
    }

    try {
      const routeData = await this.loading.wrap(this.osrmService.getRouteWithGeometry(waypoints));
      
      if (!routeData) {
        this.notification.error('Error de ruta', 'No s\'ha pogut obtenir la ruta');
        return;
      }

      const notes = this.routeAnalyzer.analyzeRoute(routeData.coordinates);
      
      this.currentRouteGeometry = {
        type: 'LineString',
        coordinates: routeData.coordinates.map(coord => [coord[1], coord[0]])
      };
      
      this.paceNotes.set(notes);
      this.totalDistance.set(routeData.distance / 1000);
      
      // Afegir pins de les notes al mapa
      this.mapService.addNoteMarkers(notes);
      this.notification.success('Ruta analitzada', `${notes.length} notes generades`);
    } catch (error) {
      console.error('Error analyzing route:', error);
      this.notification.error('Error', 'Error analitzant la ruta');
    }
  }

  async onSave(): Promise<void> {
    const rallyId = this.route.snapshot.queryParamMap.get('rallyId');

    if (!rallyId) {
      this.notification.warn('Rally no especificat', 'Accedeix a l\'editor des d\'un rally');
      return;
    }

    if (!this.stageName) {
      this.notification.warn('Nom requerit', 'Si us plau, introdueix un nom per al tram');
      return;
    }

    if (this.paceNotes().length === 0) {
      this.notification.warn('Sense notes', 'Si us plau, analitza la ruta abans de guardar');
      return;
    }

    try {
      await this.loading.wrap(this._saveStageFully(rallyId));
    } catch (error) {
      console.error('Error saving stage:', error);
      this.notification.error('Error', 'Error guardant el tram');
    }
  }

  private noteToCreateInput(stageId: string, note: PaceNote): PaceNoteCreateInput {
    return {
      stageId,
      position: note.position,
      type: note.type,
      direction: note.direction,
      angle: note.angle,
      distance: note.distance,
      noteLabel: note.noteLabel,
      customText: note.customText,
      noteBefore: note.noteBefore,
      noteAfter: note.noteAfter,
      noteBeforeSize: note.noteBeforeSize,
      noteAfterSize: note.noteAfterSize,
      notePosition: note.notePosition,
      noteGapLeft: note.noteGapLeft,
      noteGapRight: note.noteGapRight,
      pageBreakAfter: note.pageBreakAfter,
      fasterCall: note.fasterCall,
      lat: note.lat,
      lng: note.lng,
    };
  }

  private async _saveStageFully(rallyId: string): Promise<void> {
    const editStageId = this.route.snapshot.queryParamMap.get('stageId');
    const waypoints = this.mapService.waypoints();

    if (editStageId) {
      await this.noteGroupService.loadByStage(editStageId);
      await Promise.all(this.noteGroupService.groups().map(g => this.noteGroupService.delete(g.id)));
      await this.paceNotesService.deleteNotesByStage(editStageId);
      await this.stageService.updateStage({
        id: editStageId,
        name: this.stageName,
        totalDistance: this.totalDistance() ?? undefined,
        routeGeometry: this.currentRouteGeometry,
        waypoints,
      });
      const payloads = this.paceNotes().map(n => this.noteToCreateInput(editStageId, n));
      await this.paceNotesService.bulkCreateNotes(payloads);
      this.notification.success('Tram actualitzat', `"${this.stageName}" actualitzat correctament`);
      this.router.navigate(['/stages', editStageId]);
      return;
    }

    const stage = await this.stageService.createStage({
      rallyId,
      name: this.stageName,
      totalDistance: this.totalDistance() ?? undefined,
      routeGeometry: this.currentRouteGeometry,
      waypoints,
    });

    for (const note of this.paceNotes()) {
      await this.paceNotesService.createNote(this.noteToCreateInput(stage.id, note));
    }

    this.notification.success('Tram guardat', `"${this.stageName}" guardat correctament`);
    this.router.navigate(['/rallies', rallyId]);
  }
}
