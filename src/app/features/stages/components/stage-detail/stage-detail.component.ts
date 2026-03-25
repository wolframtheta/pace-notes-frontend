import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { StageService } from '../../services/stage.service';
import { PaceNotesService } from '../../../pace-notes/services/pace-notes.service';
import { NoteGroupService } from '../../../pace-notes/services/note-group.service';
import { MapService } from '../../../stage-editor/services/map.service';
import { Stage } from '../../../../core/models/stage.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { PaceNote } from '../../../../core/models/pace-note.model';
import { NoteGroup } from '../../../../core/models/note-group.model';

@Component({
  selector: 'app-stage-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">Notes de Pilot</h3>
              <div class="flex items-center gap-2">
                @if (selectedNoteIds().size > 0) {
                  <span class="text-xs font-medium"
                    [class]="selectionAction() === 'mixed-groups' ? 'text-gray-400' : 'text-red-600'"
                  >{{ selectedNoteIds().size }} seleccionades</span>

                  <button
                    type="button"
                    (click)="toggleFasterCallOnSelection()"
                    [disabled]="notesToolbarBusy()"
                    class="inline-flex items-center justify-center gap-2 min-w-[8.5rem] px-3 py-1.5 rounded text-sm bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:pointer-events-none text-white transition"
                    [title]="fasterCallToggleTitle()"
                  >
                    @if (fasterCallBusy()) {
                      <span class="btn-spinner" aria-hidden="true"></span>
                      <span>Guardant…</span>
                    } @else {
                      Més velocitat
                    }
                  </button>

                  @if (selectionAction() === 'create') {
                    <button
                      type="button"
                      (click)="applySelection()"
                      [disabled]="notesToolbarBusy()"
                      class="inline-flex items-center justify-center gap-2 min-w-[9.5rem] px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:pointer-events-none text-white transition"
                    >
                      @if (groupSelectionBusy()) {
                        <span class="btn-spinner" aria-hidden="true"></span>
                        <span>Guardant…</span>
                      } @else {
                        Agrupar corbes
                      }
                    </button>
                  } @else if (selectionAction() === 'add-to-group') {
                    <button
                      type="button"
                      (click)="applySelection()"
                      [disabled]="notesToolbarBusy()"
                      class="inline-flex items-center justify-center gap-2 min-w-[10.5rem] px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:pointer-events-none text-white transition"
                    >
                      @if (groupSelectionBusy()) {
                        <span class="btn-spinner" aria-hidden="true"></span>
                        <span>Guardant…</span>
                      } @else {
                        Afegir a l’agrupació
                      }
                    </button>
                  } @else if (selectionAction() === 'remove-from-group') {
                    <button
                      type="button"
                      (click)="applySelection()"
                      [disabled]="notesToolbarBusy()"
                      class="inline-flex items-center justify-center gap-2 min-w-[11rem] px-3 py-1.5 rounded text-sm bg-gray-600 hover:bg-gray-700 disabled:opacity-60 disabled:pointer-events-none text-white transition"
                    >
                      @if (groupSelectionBusy()) {
                        <span class="btn-spinner" aria-hidden="true"></span>
                        <span>Guardant…</span>
                      } @else {
                        Treure de l’agrupació
                      }
                    </button>
                  } @else if (selectionAction() === 'mixed-groups') {
                    <span class="text-xs text-gray-400 italic">Notes de grups diferents</span>
                  } @else if (selectionAction() === 'not-consecutive') {
                    <span class="text-xs text-gray-400 italic">Les notes han de ser consecutives</span>
                  }

                  <button
                    type="button"
                    (click)="clearSelection()"
                    [disabled]="notesToolbarBusy()"
                    class="px-2 py-1.5 rounded text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:pointer-events-none text-gray-600 transition"
                  >
                    ✕
                  </button>
                } @else {
                  <span class="text-xs text-gray-400">Selecciona notes per agrupar-les</span>
                }
              </div>
            </div>

            <table class="w-full text-sm">
              <thead class="border-b">
                <tr>
                  <th class="p-2 w-8"></th>
                  <th class="text-left p-2">Tipus</th>
                  <th class="text-left p-2">Detalls</th>
                  <th class="text-left p-2">Etiqueta</th>
                  <th class="text-left p-2 w-6"></th>
                </tr>
              </thead>
              <tbody>
                @for (note of paceNotesService.notes(); track note.id) {
                  <tr
                    class="border-b cursor-pointer transition-colors"
                    [class]="selectedNoteIds().has(note.id) ? 'bg-red-50' : (note.groupId ? 'bg-red-50/30' : 'hover:bg-gray-50')"
                    (click)="toggleNoteSelection(note.id)"
                  >
                    <td class="p-2">
                      <input
                        type="checkbox"
                        [checked]="selectedNoteIds().has(note.id)"
                        (click)="$event.stopPropagation()"
                        (change)="toggleNoteSelection(note.id)"
                        class="accent-red-600"
                      />
                    </td>
                    <td class="p-2 flex items-center gap-1.5">
                      @if (note.fasterCall) {
                        <span
                          class="inline-block w-1 self-stretch min-h-[1.25rem] bg-red-600 shrink-0 rounded-sm"
                          title="Més velocitat"
                        ></span>
                      }
                      @if (note.groupId) {
                        <span class="inline-block w-1 self-stretch rounded-full bg-red-500 shrink-0" title="Agrupació"></span>
                      }
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
                    <td class="p-2">
                      @if (note.groupId) {
                        <button
                          (click)="$event.stopPropagation(); removeFromGroup(note)"
                          class="text-sm text-red-300 hover:text-red-600 transition-colors font-bold leading-none"
                          title="Treure de l’agrupació"
                        >×</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            @if (noteGroupService.groups().length > 0) {
              <div class="mt-3 flex flex-wrap gap-2">
                @for (group of noteGroupService.groups(); track group.id) {
                  <span class="inline-flex items-center gap-1 text-xs border border-red-400 text-red-600 rounded px-2 py-0.5">
                    Agrupació ({{ notesForGroup(group.id).length }})
                    <button (click)="deleteGroup(group)" class="hover:text-red-800 font-bold">×</button>
                  </span>
                }
              </div>
            }
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
    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: white;
      border-radius: 50%;
      animation: stage-detail-spin 0.7s linear infinite;
    }
    @keyframes stage-detail-spin {
      to { transform: rotate(360deg); }
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
  noteGroupService = inject(NoteGroupService);

  stage = this.stageService.currentStage;
  private mapInitialized = false;

  selectedNoteIds = signal<Set<string>>(new Set());

  fasterCallBusy = signal(false);
  groupSelectionBusy = signal(false);
  /** Bloqueja la barra d’eines mentre corre una petició (evita solapaments). */
  notesToolbarBusy = computed(() => this.fasterCallBusy() || this.groupSelectionBusy());

  ungroupedNotes = computed(() =>
    this.paceNotesService.notes().filter(n => !n.groupId)
  );

  selectionAction = computed<'create' | 'add-to-group' | 'remove-from-group' | 'mixed-groups' | 'not-consecutive' | 'none'>(() => {
    const ids = this.selectedNoteIds();
    if (ids.size === 0) return 'none';

    const allNotes = this.paceNotesService.notes();
    const selectedIndices = allNotes
      .map((n, i) => ids.has(n.id) ? i : -1)
      .filter(i => i !== -1);

    // Check consecutive
    for (let i = 1; i < selectedIndices.length; i++) {
      if (selectedIndices[i] !== selectedIndices[i - 1] + 1) return 'not-consecutive';
    }

    const notes = allNotes.filter(n => ids.has(n.id));
    const hasGrouped = notes.some(n => n.groupId);
    const hasUngrouped = notes.some(n => !n.groupId);
    const groupedIds = [...new Set(notes.map(n => n.groupId).filter(Boolean))] as string[];

    if (!hasGrouped) return 'create';
    if (groupedIds.length > 1) return 'mixed-groups';
    if (hasGrouped && !hasUngrouped) return 'remove-from-group';
    return 'add-to-group';
  });

  selectionGroupId = computed<string | null>(() => {
    const ids = this.selectedNoteIds();
    if (ids.size === 0) return null;
    const notes = this.paceNotesService.notes().filter(n => ids.has(n.id) && n.groupId);
    return notes[0]?.groupId ?? null;
  });

  notesForGroup(groupId: string): PaceNote[] {
    return this.paceNotesService.notes().filter(n => n.groupId === groupId);
  }

  /** Tooltip del botó «Més velocitat»: toggle segons si totes les seleccionades ja tenen la marca. */
  fasterCallToggleTitle = computed(() => {
    const ids = this.selectedNoteIds();
    if (ids.size === 0) return '';
    const selected = this.paceNotesService.notes().filter(n => ids.has(n.id));
    if (selected.length === 0) return '';
    const allOn = selected.every(n => !!n.fasterCall);
    return allOn ? 'Treure marca «més velocitat»' : 'Marcar «més velocitat» (dir més ràpid)';
  });

  async toggleFasterCallOnSelection(): Promise<void> {
    const selectedIds = this.selectedNoteIds();
    if (selectedIds.size === 0 || this.notesToolbarBusy()) return;
    const selected = this.paceNotesService.notes().filter(n => selectedIds.has(n.id));
    const allOn = selected.length > 0 && selected.every(n => !!n.fasterCall);
    const next = !allOn;
    this.fasterCallBusy.set(true);
    try {
      await Promise.all(
        [...selectedIds].map(id => this.paceNotesService.updateNote({ id, fasterCall: next })),
      );
      this.paceNotesService.notes.update(list =>
        list.map(n => (selectedIds.has(n.id) ? { ...n, fasterCall: next } : n)),
      );
    } catch (e: unknown) {
      this.notification.error('No s’ha pogut guardar', this.httpErrorDetail(e));
    } finally {
      this.fasterCallBusy.set(false);
    }
  }

  async ngOnInit() {
    const stageId = this.route.snapshot.paramMap.get('id');
    
    if (stageId) {
      await this.loading.wrap((async () => {
        const stage = await this.stageService.getStageById(stageId);
        this.stageService.currentStage.set(stage);
        
        if (stage) {
          await Promise.all([
            this.paceNotesService.loadNotesByStage(stageId),
            this.noteGroupService.loadByStage(stageId),
          ]);
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

  toggleNoteSelection(noteId: string): void {
    this.selectedNoteIds.update(set => {
      const next = new Set(set);
      next.has(noteId) ? next.delete(noteId) : next.add(noteId);
      return next;
    });
  }

  clearSelection(): void {
    this.selectedNoteIds.set(new Set());
  }

  async applySelection(): Promise<void> {
    const action = this.selectionAction();
    const selectedIds = this.selectedNoteIds();
    if (action === 'none' || action === 'mixed-groups' || action === 'not-consecutive') return;
    if (this.notesToolbarBusy()) return;

    this.groupSelectionBusy.set(true);
    try {
      if (action === 'create') {
        const stageId = this.route.snapshot.paramMap.get('id');
        if (!stageId) return;
        const nextPosition = this.noteGroupService.groups().length;
        const group = await this.noteGroupService.create({
          stageId,
          name: `superset-${nextPosition + 1}`,
          position: nextPosition,
        });
        await Promise.all([...selectedIds].map(id => this.paceNotesService.updateNote({ id, groupId: group.id })));
        this.paceNotesService.notes.update(notes =>
          notes.map(n => (selectedIds.has(n.id) ? { ...n, groupId: group.id } : n)),
        );
        await this.noteGroupService.loadByStage(stageId);
      } else if (action === 'add-to-group') {
        const groupId = this.selectionGroupId()!;
        const ungroupedSelected = this.paceNotesService
          .notes()
          .filter(n => selectedIds.has(n.id) && !n.groupId);
        await Promise.all(ungroupedSelected.map(n => this.paceNotesService.updateNote({ id: n.id, groupId })));
        this.paceNotesService.notes.update(notes =>
          notes.map(n => (ungroupedSelected.some(u => u.id === n.id) ? { ...n, groupId } : n)),
        );
      } else if (action === 'remove-from-group') {
        const groupId = this.selectionGroupId();
        await Promise.all([...selectedIds].map(id => this.paceNotesService.updateNote({ id, groupId: null })));
        this.paceNotesService.notes.update(notes =>
          notes.map(n => (selectedIds.has(n.id) ? { ...n, groupId: null } : n)),
        );
        if (groupId && this.notesForGroup(groupId).length === 0) {
          await this.noteGroupService.delete(groupId);
          const stageId = this.route.snapshot.paramMap.get('id');
          if (stageId) await this.noteGroupService.loadByStage(stageId);
        }
      }

      this.selectedNoteIds.set(new Set());
    } catch (e: unknown) {
      this.notification.error('No s’ha pogut guardar l’agrupació', this.httpErrorDetail(e));
    } finally {
      this.groupSelectionBusy.set(false);
    }
  }

  private httpErrorDetail(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const body = e.error;
      if (body && typeof body === 'object' && 'message' in body) {
        const m = (body as { message: string | string[] }).message;
        return Array.isArray(m) ? m.join(', ') : String(m);
      }
      return e.status ? `${e.status} ${e.statusText || ''}`.trim() : e.message || 'Petició fallida';
    }
    if (e instanceof Error) return e.message;
    return String(e);
  }

  async removeFromGroup(note: PaceNote): Promise<void> {
    this.paceNotesService.notes.update(notes =>
      notes.map(n => n.id === note.id ? { ...n, groupId: null } : n)
    );
    await this.paceNotesService.updateNote({ id: note.id, groupId: null });
    // If group is now empty, delete it
    const groupId = note.groupId;
    if (groupId && this.notesForGroup(groupId).length === 0) {
      await this.noteGroupService.delete(groupId);
    }
  }

  async deleteGroup(group: NoteGroup): Promise<void> {
    await this.noteGroupService.delete(group.id);
    this.paceNotesService.notes.update(notes =>
      notes.map(n => n.groupId === group.id ? { ...n, groupId: null } : n)
    );
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
    const s = this.stage();
    if (!s) return;
    this.router.navigate(['/stage-editor'], {
      queryParams: { rallyId: s.rallyId, stageId: s.id },
    });
  }
}
