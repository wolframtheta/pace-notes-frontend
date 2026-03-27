import { Component, inject, output } from '@angular/core';
import { MapService } from '../../services/map.service';

@Component({
  selector: 'app-route-toolbar',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-white p-4 rounded-lg shadow-lg space-y-2">
      <button 
        (click)="onAnalyze()"
        class="w-full bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded transition"
      >
        Analitzar Ruta
      </button>
      
      <button 
        (click)="onClear()"
        class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
      >
        Esborrar Tot
      </button>
      
      <button 
        (click)="onSave()"
        class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
      >
        Guardar Tram
      </button>
    </div>
  `
})
export class RouteToolbarComponent {
  private mapService = inject(MapService);
  
  analyze = output<void>();
  save = output<void>();

  onAnalyze(): void {
    this.analyze.emit();
  }

  onClear(): void {
    this.mapService.clearAll();
  }

  onSave(): void {
    this.save.emit();
  }
}
