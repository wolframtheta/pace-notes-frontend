import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaceNotesService } from '../../services/pace-notes.service';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold">Notes de Pilot</h2>
        <button
          (click)="showPrintView()"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          Editar i Imprimir
        </button>
      </div>

      @if (notesService.notes().length === 0) {
        <div class="bg-white p-8 rounded-lg shadow-lg text-center text-gray-500">
          <p>No hi ha notes disponibles. Crea un tram i analitza'l per generar notes.</p>
        </div>
      } @else {
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-100 border-b">
              <tr>
                <th class="text-left p-4">#</th>
                <th class="text-left p-4">Etiqueta</th>
                <th class="text-left p-4">Tipus</th>
                <th class="text-left p-4">Detalls</th>
                <th class="text-left p-4">Accions</th>
              </tr>
            </thead>
            <tbody>
              @for (note of notesService.notes(); track note.id) {
                <tr class="border-b hover:bg-gray-50">
                  <td class="p-4 text-gray-500 font-mono text-sm">{{ note.position }}</td>
                  <td class="p-4 font-black text-3xl leading-none">
                    @if (note.type === 'curve') {
                      {{ note.noteLabel || '—' }}
                    } @else {
                      {{ categorizeStraight(note.distance) }}
                    }
                  </td>
                  <td class="p-4">
                    <span class="inline-block px-2 py-1 rounded text-xs"
                          [class.bg-blue-100]="note.type === 'curve'"
                          [class.bg-green-100]="note.type === 'straight'">
                      {{ note.type === 'curve' ? 'Corba' : 'Recta' }}
                    </span>
                  </td>
                  <td class="p-4 text-sm text-gray-600">
                    @if (note.type === 'curve') {
                      {{ note.angle?.toFixed(0) }}° {{ note.direction === 'left' ? 'Esquerra' : 'Dreta' }}
                    } @else {
                      {{ note.distance?.toFixed(0) }}m
                    }
                  </td>
                  <td class="p-4">
                    <button
                      (click)="deleteNote(note.id)"
                      class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <p class="text-sm text-gray-500 text-center">
          Clica "Editar i Imprimir" per afegir anotacions abans/després de cada nota.
        </p>
      }
    </div>
  `
})
export class NotesListComponent implements OnInit {
  notesService = inject(PaceNotesService);

  async ngOnInit() {}

  async deleteNote(noteId: string): Promise<void> {
    if (confirm('Segur que vols eliminar aquesta nota?')) {
      await this.notesService.deleteNote(noteId);
      this.notesService.notes.set(this.notesService.notes().filter(n => n.id !== noteId));
    }
  }

  showPrintView(): void {
    window.open('/pace-notes/print', '_blank');
  }

  categorizeStraight(distance: number | undefined): string {
    if (!distance) return '25';
    if (distance <= 37) return '25';
    if (distance <= 75) return '50';
    if (distance <= 125) return '100';
    if (distance <= 175) return '150';
    return '150';
  }
}
