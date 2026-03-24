import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RallyService } from '../../services/rally.service';
import { ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../core/services/loading.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-rally-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, TextareaModule],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold">Rallies</h2>
        <button
          (click)="openCreateDialog()"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          Nou Rally
        </button>
      </div>

      @if (rallyService.rallies().length === 0) {
        <div class="bg-white p-8 rounded-lg shadow-lg text-center text-gray-500">
          <p class="text-lg mb-2">No hi ha rallies creats.</p>
          <p>Comença creant el teu primer rally per organitzar els trams.</p>
        </div>
      } @else {
        <div class="grid gap-4">
          @for (rally of rallyService.rallies(); track rally.id) {
            <div
              class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-blue-600"
              (click)="viewRally(rally.id)"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="text-xl font-bold mb-1">{{ rally.name }}</h3>
                  @if (rally.description) {
                    <p class="text-gray-600 mb-2">{{ rally.description }}</p>
                  }
                  <div class="flex gap-6 text-sm text-gray-500">
                    <span>
                      <span class="font-semibold text-blue-600">{{ rally.stageCount ?? 0 }}</span>
                      {{ (rally.stageCount ?? 0) === 1 ? 'tram' : 'trams' }}
                    </span>
                    <span>Creat: {{ rally.createdAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
                <div class="flex gap-2 ml-4" (click)="$event.stopPropagation()">
                  <button
                    (click)="viewRally(rally.id)"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                  >
                    Veure
                  </button>
                  <button
                    (click)="deleteRally(rally.id, rally.name)"
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

    <!-- Create Rally Dialog -->
    <p-dialog
      header="Nou Rally"
      [(visible)]="showCreateDialog"
      [modal]="true"
      [style]="{ width: '450px' }"
      [draggable]="false"
    >
      <div class="space-y-4 pt-2">
        <div>
          <label class="block text-sm font-medium mb-1">Nom del Rally *</label>
          <input
            pInputText
            [(ngModel)]="newRallyName"
            type="text"
            class="w-full"
            placeholder="Rally de Catalunya 2026"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Descripció (opcional)</label>
          <textarea
            pTextarea
            [(ngModel)]="newRallyDescription"
            rows="3"
            class="w-full"
            placeholder="Descripció del rally..."
          ></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button
          label="Cancel·lar"
          severity="secondary"
          (onClick)="closeCreateDialog()"
        />
        <p-button
          label="Crear Rally"
          (onClick)="createRally()"
          [disabled]="!newRallyName.trim()"
        />
      </ng-template>
    </p-dialog>
  `
})
export class RallyListComponent implements OnInit {
  rallyService = inject(RallyService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private loading = inject(LoadingService);
  private notification = inject(NotificationService);

  showCreateDialog = false;
  newRallyName = '';
  newRallyDescription = '';

  async ngOnInit() {
    await this.loading.wrap(this.rallyService.loadRallies());
  }

  openCreateDialog(): void {
    this.newRallyName = '';
    this.newRallyDescription = '';
    this.showCreateDialog = true;
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
  }

  async createRally(): Promise<void> {
    if (!this.newRallyName.trim()) return;

    try {
      const rally = await this.loading.wrap(
        this.rallyService.createRally({
          name: this.newRallyName.trim(),
          description: this.newRallyDescription.trim() || undefined,
        })
      );
      this.closeCreateDialog();
      this.notification.success('Rally creat', `"${rally.name}" creat correctament`);
      this.router.navigate(['/rallies', rally.id]);
    } catch {
      this.notification.error('Error', 'No s\'ha pogut crear el rally');
    }
  }

  viewRally(id: string): void {
    this.router.navigate(['/rallies', id]);
  }

  deleteRally(id: string, name: string): void {
    this.confirmationService.confirm({
      message: `Segur que vols eliminar "${name}"? S'eliminaran tots els trams i notes associades.`,
      header: 'Confirmar eliminació',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancel·lar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.loading.wrap(this.rallyService.deleteRally(id));
        this.notification.success('Rally eliminat', `"${name}" eliminat correctament`);
      }
    });
  }
}
