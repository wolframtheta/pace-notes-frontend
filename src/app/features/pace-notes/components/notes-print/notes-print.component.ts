import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaceNotesService } from '../../services/pace-notes.service';

@Component({
  selector: 'app-notes-print',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-white p-8 print:p-0">
      <div class="max-w-4xl mx-auto">
        <div class="mb-8 print:mb-4">
          <h1 class="text-3xl font-bold mb-2">Notes de Pilot</h1>
          <p class="text-gray-600">Data: {{ currentDate | date:'dd/MM/yyyy' }}</p>
        </div>

        <div class="space-y-2">
          @for (note of notesService.notes(); track note.id) {
            <div class="flex items-center border-b py-3 print:py-2">
              <div class="w-12 text-center font-bold text-gray-500">
                {{ note.position }}
              </div>
              
              <div class="flex-1 flex items-center gap-4">
                <div class="font-bold text-2xl w-20 text-center print:text-xl">
                  {{ note.noteLabel }}
                </div>
                
                <div class="text-sm text-gray-600 w-32">
                  @if (note.type === 'curve') {
                    Corba {{ note.direction === 'left' ? 'E' : 'D' }} - {{ note.angle?.toFixed(0) }}°
                  } @else {
                    Recta - {{ note.distance?.toFixed(0) }}m
                  }
                </div>
                
                @if (note.customText) {
                  <div class="flex-1 text-sm italic text-gray-700">
                    {{ note.customText }}
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <div class="mt-8 flex gap-4 print:hidden">
          <button
            (click)="print()"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
          >
            Imprimir
          </button>
          <button
            (click)="close()"
            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition"
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @media print {
      .print\\:hidden {
        display: none !important;
      }
    }
  `]
})
export class NotesPrintComponent {
  notesService = inject(PaceNotesService);
  currentDate = new Date();

  print(): void {
    window.print();
  }

  close(): void {
    window.close();
  }
}
