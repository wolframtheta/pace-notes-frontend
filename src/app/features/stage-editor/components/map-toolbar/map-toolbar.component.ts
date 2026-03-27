import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService, MapMode } from '../../services/map.service';

@Component({
  selector: 'app-map-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-2 flex flex-wrap gap-2 items-center">
      <button
        (click)="setMode('pan')"
        [class.bg-barrufet-500]="mapService.currentMode() === 'pan'"
        [class.text-white]="mapService.currentMode() === 'pan'"
        [class.bg-slate-100]="mapService.currentMode() !== 'pan'"
        class="px-4 py-2 rounded transition flex items-center gap-2 hover:bg-barrufet-400 hover:text-white"
        title="Moure el mapa"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span class="font-medium">Moure mapa</span>
      </button>

      <button
        type="button"
        (click)="setMode('addWaypoint')"
        [disabled]="!mapService.canAddMoreWaypoints()"
        [class.bg-barrufet-500]="mapService.currentMode() === 'addWaypoint' && mapService.canAddMoreWaypoints()"
        [class.text-white]="mapService.currentMode() === 'addWaypoint' && mapService.canAddMoreWaypoints()"
        [class.bg-slate-100]="mapService.currentMode() !== 'addWaypoint' || !mapService.canAddMoreWaypoints()"
        [class.opacity-50]="!mapService.canAddMoreWaypoints()"
        [class.cursor-not-allowed]="!mapService.canAddMoreWaypoints()"
        class="px-4 py-2 rounded transition flex items-center gap-2 hover:bg-barrufet-400 hover:text-white disabled:hover:bg-slate-100 disabled:hover:text-current"
        title="Definir inici i final (2 punts màx.). Clica un marcador per eliminar-lo."
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span class="font-medium">Inici / final</span>
      </button>

      <div class="flex items-center gap-2 px-3 py-1 bg-barrufet-50 rounded border border-barrufet-100">
        <kbd class="px-2 py-1 text-xs font-semibold text-slate-800 bg-white border border-barrufet-200 rounded shadow-sm">
          Space
        </kbd>
        <span class="text-xs text-slate-600">= Mode punt (si falta algun)</span>
      </div>

      <div class="flex items-center gap-2 px-3 py-1 bg-barrufet-50 rounded border border-barrufet-100">
        <kbd class="px-2 py-1 text-xs font-semibold text-slate-800 bg-white border border-barrufet-200 rounded shadow-sm">
          C
        </kbd>
        <span class="text-xs text-slate-600">= Afegir corba</span>
      </div>

      @if (mapService.waypoints().length > 0) {
        <div class="border-l border-barrufet-200 mx-2"></div>

        <button
          (click)="clearLastWaypoint()"
          class="px-4 py-2 rounded transition flex items-center gap-2 bg-accent-100 text-accent-700 hover:bg-accent-200"
          title="Eliminar l'últim punt col·locat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          <span class="font-medium">Desfer últim</span>
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
          <span class="font-medium">Esborrar tot</span>
        </button>
      }
    </div>
  `
})
export class MapToolbarComponent {
  mapService = inject(MapService);

  setMode(mode: MapMode): void {
    if (mode === 'addWaypoint' && !this.mapService.canAddMoreWaypoints()) {
      return;
    }
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
