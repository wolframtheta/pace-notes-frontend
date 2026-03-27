import { Component, OnDestroy, AfterViewInit, inject, signal, output } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapService } from '../../services/map.service';
import { OsrmService } from '../../services/osrm.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  template: `
    <div id="map" class="w-full h-full rounded-lg shadow-lg" style="min-height: 500px;"></div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    #map {
      width: 100%;
      height: 100%;
    }
  `]
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private mapService = inject(MapService);
  private osrmService = inject(OsrmService);
  
  isLoading = signal(false);
  private keydownHandler?: (e: KeyboardEvent) => void;
  private keyupHandler?: (e: KeyboardEvent) => void;
  private cKeyPressed = signal(false);
  private waypointSub?: Subscription;

  curvePointClicked = output<{ lat: number; lng: number }>();
  mapReady = output<void>();

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.mapService.initMap('map');
      
      this.mapService.setMode('pan');
      
      this.mapService.addClickListener((lat, lng) => {
        this.mapService.addWaypoint(lat, lng);
      });

      this.waypointSub = this.mapService.waypointsChanged$.subscribe(() => {
        void this.updateRoute();
      });

      this.mapService.addCurveNoteListener((lat, lng) => {
        this.curvePointClicked.emit({ lat, lng });
      });

      this.setupKeyboardListeners();
      this.mapReady.emit();
    }, 100);
  }

  private setupKeyboardListeners(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (this.isInputFocused()) return;

      // Barra espaiadora per afegir waypoints
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.mapService.currentMode() === 'pan' && this.mapService.canAddMoreWaypoints()) {
          this.mapService.setMode('addWaypoint');
        }
      }

      // Tecla C per afegir notes de corba
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        this.cKeyPressed.set(true);
        if (this.mapService.currentMode() === 'pan') {
          this.mapService.setMode('addCurveNote');
        }
      }
    };

    this.keyupHandler = (e: KeyboardEvent) => {
      if (this.isInputFocused()) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.mapService.setMode('pan');
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        this.cKeyPressed.set(false);
        this.mapService.setMode('pan');
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return activeElement?.tagName === 'INPUT' || 
           activeElement?.tagName === 'TEXTAREA' ||
           activeElement?.hasAttribute('contenteditable') || false;
  }

  private async updateRoute(): Promise<void> {
    const waypoints = this.mapService.waypoints();
    
    if (waypoints.length < 2) return;

    this.isLoading.set(true);
    
    try {
      const route = await this.osrmService.getRoute(waypoints);
      if (route) {
        this.mapService.drawRoute(route);
      }
    } catch (error) {
      console.error('Error updating route:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.waypointSub?.unsubscribe();
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    if (this.keyupHandler) {
      document.removeEventListener('keyup', this.keyupHandler);
    }

    this.mapService.destroy();
  }
}
