import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService, MapMode } from '../../services/map.service';

@Component({
  selector: 'app-map-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-2 flex gap-2 items-center">
      <button
        (click)="setMode('pan')"
        [class.bg-blue-600]="mapService.currentMode() === 'pan'"
        [class.text-white]="mapService.currentMode() === 'pan'"
        [class.bg-gray-100]="mapService.currentMode() !== 'pan'"
        class="px-4 py-2 rounded transition flex items-center gap-2 hover:bg-blue-500 hover:text-white"
        title="Moure el mapa (o mantén Espai per afegir temporalment)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span class="font-medium">Moure Mapa</span>
      </button>

      <button
        (click)="setMode('addWaypoint')"
        [class.bg-blue-600]="mapService.currentMode() === 'addWaypoint'"
        [class.text-white]="mapService.currentMode() === 'addWaypoint'"
        [class.bg-gray-100]="mapService.currentMode() !== 'addWaypoint'"
        class="px-4 py-2 rounded transition flex items-center gap-2 hover:bg-blue-500 hover:text-white"
        title="Afegir waypoints (o mantén Espai)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span class="font-medium">Afegir Waypoint</span>
      </button>

      <!-- Indicador de tecla Espai -->
      <div class="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded border border-gray-200">
        <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-sm">
          Space
        </kbd>
        <span class="text-xs text-gray-600">= Afegir temporalment</span>
      </div>

      <!-- Indicador de tecla C -->
      <div class="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded border border-gray-200">
        <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-sm">
          C
        </kbd>
        <span class="text-xs text-gray-600">= Afegir corba</span>
      </div>

      @if (mapService.waypoints().length > 0) {
        <div class="border-l border-gray-300 mx-2"></div>
        
        <button
          (click)="clearLastWaypoint()"
          class="px-4 py-2 rounded transition flex items-center gap-2 bg-orange-100 text-orange-700 hover:bg-orange-200"
          title="Eliminar últim waypoint"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          <span class="font-medium">Desfer Últim</span>
        </button>

        <button
          (click)="clearAllWaypoints()"
          class="px-4 py-2 rounded transition flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200"
          title="Eliminar tots els waypoints"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <span class="font-medium">Esborrar Tot</span>
        </button>
      }
    </div>
  `
})
export class MapToolbarComponent {
  mapService = inject(MapService);

  setMode(mode: MapMode): void {
    this.mapService.setMode(mode);
  }

  clearLastWaypoint(): void {
    this.mapService.removeLastWaypoint();
  }

  clearAllWaypoints(): void {
    if (confirm('Segur que vols eliminar tots els waypoints?')) {
      this.mapService.clearAll();
    }
  }
}
