import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
                    <div class="w-4 h-4 bg-blue-500 rounded"></div>
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

  paceNotes = signal<PaceNote[]>([]);
  totalDistance = signal<number | null>(null);
  stageName = '';
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

  private tryHydrateFromPendingStage(): void {
    if (!this.mapInitialized || !this.pendingHydrateStage) return;

    const stage = this.pendingHydrateStage;
    this.pendingHydrateStage = null;

    if (stage.waypoints?.length) {
      for (const wp of stage.waypoints) {
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
