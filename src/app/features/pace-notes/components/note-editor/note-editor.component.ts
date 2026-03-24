import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaceNote } from '../../../../core/models/pace-note.model';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (note()) {
      <div class="bg-white p-4 rounded-lg shadow-lg">
        <h3 class="text-lg font-bold mb-4">Editar Nota</h3>
        
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">Etiqueta</label>
            <input
              [(ngModel)]="editedLabel"
              type="text"
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Text Personalitzat</label>
            <textarea
              [(ngModel)]="editedCustomText"
              class="w-full border rounded px-3 py-2"
              rows="3"
            ></textarea>
          </div>

          <div class="flex gap-2">
            <button
              (click)="saveChanges()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Guardar
            </button>
            <button
              (click)="cancel.emit()"
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition"
            >
              Cancel·lar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class NoteEditorComponent {
  note = input<PaceNote | null>(null);
  save = output<{ noteLabel: string; customText: string }>();
  cancel = output<void>();

  editedLabel = '';
  editedCustomText = '';

  ngOnInit() {
    const n = this.note();
    if (n) {
      this.editedLabel = n.noteLabel || '';
      this.editedCustomText = n.customText || '';
    }
  }

  saveChanges(): void {
    this.save.emit({
      noteLabel: this.editedLabel,
      customText: this.editedCustomText
    });
  }
}
