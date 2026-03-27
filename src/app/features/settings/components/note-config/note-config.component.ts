import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NoteConfigService } from '../../services/note-config.service';
import { AngleRange } from '../../../../core/models/note-config.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-note-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold">Configuració de Notes</h2>
        <button
          (click)="showCreateForm = !showCreateForm"
          class="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded transition"
        >
          Nova Configuració
        </button>
      </div>

      @if (showCreateForm) {
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h3 class="text-lg font-bold mb-4">Nova Configuració</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nom</label>
              <input
                [(ngModel)]="newConfigName"
                type="text"
                class="w-full border rounded px-3 py-2"
                placeholder="Sistema Classic 1-6"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Rangs d'Angles</label>
              
              @for (range of newAngleRanges; track $index) {
                <div class="flex gap-2 mb-2">
                  <input
                    [(ngModel)]="range.min"
                    type="number"
                    class="w-24 border rounded px-3 py-2"
                    placeholder="Min"
                  />
                  <input
                    [(ngModel)]="range.max"
                    type="number"
                    class="w-24 border rounded px-3 py-2"
                    placeholder="Max"
                  />
                  <input
                    [(ngModel)]="range.label"
                    type="text"
                    class="w-24 border rounded px-3 py-2"
                    placeholder="Etiqueta"
                  />
                  <button
                    (click)="removeRange($index)"
                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition"
                  >
                    Eliminar
                  </button>
                </div>
              }
              
              <button
                (click)="addRange()"
                class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition text-sm"
              >
                Afegir Rang
              </button>
            </div>

            <div class="flex gap-2">
              <button
                (click)="createConfig()"
                class="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded transition"
              >
                Crear
              </button>
              <button
                (click)="cancelCreate()"
                class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition"
              >
                Cancel·lar
              </button>
            </div>
          </div>
        </div>
      }

      <div class="grid gap-4">
        @for (config of configService.configs(); track config.id) {
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-bold">{{ config.name }}</h3>
                @if (config.isActive) {
                  <span class="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded mt-1">
                    Activa
                  </span>
                }
              </div>
              
              <div class="flex gap-2">
                @if (!config.isActive) {
                  <button
                    (click)="activateConfig(config.id)"
                    class="bg-accent-500 hover:bg-accent-600 text-white px-3 py-1 rounded text-sm transition"
                  >
                    Activar
                  </button>
                }
                <button
                  (click)="deleteConfig(config.id)"
                  class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              @for (range of config.angleRanges; track $index) {
                <div class="border rounded p-2 text-center text-sm">
                  <div class="font-bold text-lg">{{ range.label }}</div>
                  <div class="text-gray-600 text-xs">{{ range.min }}° - {{ range.max }}°</div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class NoteConfigComponent implements OnInit {
  configService = inject(NoteConfigService);
  private notification = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);
  
  showCreateForm = false;
  newConfigName = '';
  newAngleRanges: AngleRange[] = [];

  async ngOnInit() {
    await this.configService.initializeDefaultConfig();
    await this.configService.loadConfigs();
  }

  addRange(): void {
    this.newAngleRanges.push({ min: 0, max: 30, label: '' });
  }

  removeRange(index: number): void {
    this.newAngleRanges.splice(index, 1);
  }

  async createConfig(): Promise<void> {
    if (!this.newConfigName || this.newAngleRanges.length === 0) {
      this.notification.warn('Camps buits', 'Omple tots els camps');
      return;
    }

    await this.configService.createConfig({
      name: this.newConfigName,
      angleRanges: this.newAngleRanges,
      isActive: false
    });

    this.cancelCreate();
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.newConfigName = '';
    this.newAngleRanges = [];
  }

  async activateConfig(id: string): Promise<void> {
    await this.configService.updateConfig({ id, isActive: true });
  }

  async deleteConfig(id: string): Promise<void> {
    this.confirmationService.confirm({
      message: 'Segur que vols eliminar aquesta configuració?',
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancel·lar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.configService.deleteConfig(id);
      }
    });
  }
}
