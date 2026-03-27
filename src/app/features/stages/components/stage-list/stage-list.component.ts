import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StageService } from '../../services/stage.service';
import { ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-stage-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold">Trams</h2>
        <a
          routerLink="/stage-editor"
          class="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded transition"
        >
          Crear Nou Tram
        </a>
      </div>

      @if (stageService.stages().length === 0) {
        <div class="bg-white p-8 rounded-lg shadow-lg text-center text-gray-500">
          <p>No hi ha trams creats. Comença creant el teu primer tram.</p>
        </div>
      } @else {
        <div class="grid gap-4">
          @for (stage of stageService.stages(); track stage.id) {
            <div class="bg-white p-6 rounded-lg shadow-lg">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="text-xl font-bold mb-2">{{ stage.name }}</h3>
                  
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    @if (stage.totalDistance) {
                      <div>
                        <span class="text-gray-600">Distància:</span>
                        <span class="ml-2 font-semibold">{{ stage.totalDistance.toFixed(2) }} km</span>
                      </div>
                    }
                    
                    @if (stage.waypoints) {
                      <div>
                        <span class="text-gray-600">Waypoints:</span>
                        <span class="ml-2 font-semibold">{{ stage.waypoints.length }}</span>
                      </div>
                    }
                    
                    <div>
                      <span class="text-gray-600">Creat:</span>
                      <span class="ml-2 font-semibold">{{ stage.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    
                    <div>
                      <span class="text-gray-600">Modificat:</span>
                      <span class="ml-2 font-semibold">{{ stage.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex gap-2 ml-4">
                  <a
                    [routerLink]="['/stages', stage.id]"
                    class="bg-accent-500 hover:bg-accent-600 text-white px-3 py-1 rounded text-sm transition"
                  >
                    Veure
                  </a>
                  <button
                    (click)="deleteStage(stage.id)"
                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class StageListComponent implements OnInit {
  stageService = inject(StageService);
  private confirmationService = inject(ConfirmationService);
  private loading = inject(LoadingService);

  async ngOnInit() {
    await this.loading.wrap(this.stageService.loadStages(this.stageService.stages()[0]?.rallyId ?? ''));
  }

  deleteStage(stageId: string): void {
    this.confirmationService.confirm({
      message: 'Segur que vols eliminar aquest tram? També s\'eliminaran totes les notes associades.',
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancel·lar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.loading.wrap(this.stageService.deleteStage(stageId));
      }
    });
  }
}
