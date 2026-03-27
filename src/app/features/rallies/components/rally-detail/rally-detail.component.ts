import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RallyService } from '../../services/rally.service';
import { StageService } from '../../../stages/services/stage.service';
import { Rally } from '../../../../core/models/rally.model';
import { Stage } from '../../../../core/models/stage.model';
import { ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../core/services/loading.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-rally-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (rally()) {
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <button
              (click)="goBack()"
              class="text-gray-500 hover:text-gray-700 text-sm mb-1 flex items-center gap-1"
            >
              ← Tots els Rallies
            </button>
            <h2 class="text-2xl font-bold">{{ rally()!.name }}</h2>
            @if (rally()!.description) {
              <p class="text-gray-600 mt-1">{{ rally()!.description }}</p>
            }
          </div>
          <button
            (click)="createTram()"
            class="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded transition"
          >
            + Nou Tram
          </button>
        </div>

        <!-- Stages list -->
        @if (stages().length === 0) {
          <div class="bg-white p-8 rounded-lg shadow-lg text-center text-gray-500">
            <p class="text-lg mb-2">Encara no hi ha trams en aquest rally.</p>
            <p>Clica "Nou Tram" per crear el primer tram.</p>
          </div>
        } @else {
          <div>
            <h3 class="text-lg font-semibold mb-3">Trams ({{ stages().length }})</h3>
            <div class="grid gap-4">
              @for (stage of stages(); track stage.id) {
                <div class="bg-white p-6 rounded-lg shadow-lg">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h4 class="text-xl font-bold mb-2">{{ stage.name }}</h4>
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
                        (click)="deleteStage(stage.id, stage.name)"
                        class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="bg-white p-8 rounded-lg shadow-lg text-center text-gray-500">
        <p>Carregant...</p>
      </div>
    }
  `
})
export class RallyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rallyService = inject(RallyService);
  private stageService = inject(StageService);
  private confirmationService = inject(ConfirmationService);
  private loading = inject(LoadingService);
  private notification = inject(NotificationService);

  rally = signal<Rally | null>(null);
  stages = signal<Stage[]>([]);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    await this.loading.wrap((async () => {
      const r = await this.rallyService.getRallyById(id);
      this.rally.set(r);
      if (r) {
        await this.stageService.loadStages(id);
        this.stages.set(this.stageService.stages());
      }
    })());
  }

  goBack(): void {
    this.router.navigate(['/rallies']);
  }

  createTram(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/stage-editor'], { queryParams: { rallyId: id } });
  }

  deleteStage(stageId: string, name: string): void {
    this.confirmationService.confirm({
      message: `Segur que vols eliminar "${name}"? S'eliminaran totes les notes associades.`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancel·lar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        const rallyId = this.route.snapshot.paramMap.get('id')!;
        await this.loading.wrap(this.stageService.deleteStage(stageId));
        await this.stageService.loadStages(rallyId);
        this.stages.set(this.stageService.stages());
        this.notification.success('Tram eliminat', `"${name}" eliminat correctament`);
      }
    });
  }
}
