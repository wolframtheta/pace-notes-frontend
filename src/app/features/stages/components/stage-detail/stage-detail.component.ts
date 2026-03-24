import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StageService } from '../../services/stage.service';
import { PaceNotesService } from '../../../pace-notes/services/pace-notes.service';
import { MapService } from '../../../stage-editor/services/map.service';
import { Stage } from '../../../../core/models/stage.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-stage-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (stage()) {
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold">{{ stage()!.name }}</h2>
          <div class="flex gap-2">
            <button
              (click)="goBack()"
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition"
            >
              Tornar
            </button>
            @if (paceNotesService.notes().length > 0) {
              <button
                (click)="printNotes()"
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
              >
                🖨 Imprimir Notes
              </button>
            }
            <button
              (click)="editStage()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Editar
            </button>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h3 class="text-lg font-bold mb-4">Informació del Tram</h3>
          
          <div class="grid grid-cols-2 gap-4">
            @if (stage()!.totalDistance) {
              <div>
                <span class="text-gray-600">Distància Total:</span>
                <span class="ml-2 font-semibold">{{ stage()!.totalDistance!.toFixed(2) }} km</span>
              </div>
            }
            
            @if (stage()!.waypoints) {
              <div>
                <span class="text-gray-600">Nombre de Waypoints:</span>
                <span class="ml-2 font-semibold">{{ stage()!.waypoints!.length }}</span>
              </div>
            }
            
            <div>
              <span class="text-gray-600">Data de Creació:</span>
              <span class="ml-2 font-semibold">{{ stage()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            
            <div>
              <span class="text-gray-600">Última Modificació:</span>
              <span class="ml-2 font-semibold">{{ stage()!.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>
        </div>

        @if (paceNotesService.notes().length > 0) {
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">Mapa del Tram</h3>
              <div class="flex gap-4 text-xs">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Corba E</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Corba D</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Recta</span>
                </div>
              </div>
            </div>
            <div id="stage-detail-map" class="h-96 rounded-lg"></div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h3 class="text-lg font-bold mb-4">Notes de Pilot</h3>
            
            <table class="w-full">
              <thead class="border-b">
                <tr>
                  <th class="text-left p-2">Tipus</th>
                  <th class="text-left p-2">Detalls</th>
                  <th class="text-left p-2">Etiqueta</th>
                </tr>
              </thead>
              <tbody>
                @for (note of paceNotesService.notes(); track note.id) {
                  <tr class="border-b hover:bg-gray-50">
                    <td class="p-2">
                      {{ note.type === 'curve' ? 'Corba' : 'Recta' }}
                    </td>
                    <td class="p-2">
                      @if (note.type === 'curve') {
                        {{ note.angle?.toFixed(0) }}° {{ note.direction === 'left' ? 'E' : 'D' }}
                      } @else {
                        {{ note.distance?.toFixed(0) }}m
                      }
                    </td>
                    <td class="p-2 font-bold">{{ note.noteLabel }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="bg-white p-6 rounded-lg shadow-lg text-center text-gray-500">
            <p>Aquest tram encara no té notes generades.</p>
          </div>
        }
      </div>
    } @else {
      <div class="bg-white p-8 rounded-lg shadow-lg text-center text-gray-500">
        <p>Carregant...</p>
      </div>
    }
  `,
  styles: [`
    #stage-detail-map {
      width: 100%;
    }
  `]
})
export class StageDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private stageService = inject(StageService);
  private mapService = inject(MapService);
  private notification = inject(NotificationService);
  private loading = inject(LoadingService);
  paceNotesService = inject(PaceNotesService);
  
  stage = this.stageService.currentStage;
  private mapInitialized = false;

  async ngOnInit() {
    const stageId = this.route.snapshot.paramMap.get('id');
    
    if (stageId) {
      await this.loading.wrap((async () => {
        const stage = await this.stageService.getStageById(stageId);
        this.stageService.currentStage.set(stage);
        
        if (stage) {
          await this.paceNotesService.loadNotesByStage(stageId);
        }
      })());

      // Esperar un tick perquè Angular renderitzi el @if amb les notes abans d'inicialitzar el mapa
      setTimeout(() => this.initializeMap(), 0);
    }
  }

  ngOnDestroy(): void {
    this.mapService.destroy();
  }

  private initializeMap(): void {
    const notes = this.paceNotesService.notes();
    if (notes.length === 0 || this.mapInitialized) return;

    const stage = this.stage();
    if (!stage) return;

    this.mapService.initMap('stage-detail-map');
    
    if (stage.routeGeometry && stage.routeGeometry.coordinates) {
      const coords = stage.routeGeometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
      this.mapService.drawRoute(coords);
    }

    this.mapService.addNoteMarkers(notes);
    this.mapInitialized = true;
  }

  goBack(): void {
    const stage = this.stage();
    if (stage?.rallyId) {
      this.router.navigate(['/rallies', stage.rallyId]);
    } else {
      this.router.navigate(['/rallies']);
    }
  }

  printNotes(): void {
    const stageId = this.route.snapshot.paramMap.get('id');
    window.open(`/stages/${stageId}/print`, '_blank');
  }

  editStage(): void {
    this.notification.info('En desenvolupament', 'Funcionalitat d\'edició en desenvolupament');
  }
}
