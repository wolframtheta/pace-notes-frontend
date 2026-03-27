import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import * as L from 'leaflet';
import { PaceNote } from '../../../core/models/pace-note.model';
import { NotificationService } from '../../../core/services/notification.service';

export type MapMode = 'pan' | 'addWaypoint' | 'addCurveNote';

const MAX_WAYPOINTS = 2;

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map?: L.Map;
  private routeLayer?: L.Polyline;
  private markers: L.Marker[] = [];
  private noteMarkers: L.Marker[] = [];
  /** Pins de cerca inici / final (no són waypoints ni notes). */
  private roadSearchStartMarker?: L.Marker;
  private roadSearchEndMarker?: L.Marker;
  private curveNoteListener?: (lat: number, lng: number) => void;

  private readonly notification = inject(NotificationService);
  private readonly waypointChange$ = new Subject<void>();

  /** Emès quan canvia el nombre o posició dels waypoints (per recalcular ruta OSRM). */
  readonly waypointsChanged$ = this.waypointChange$.asObservable();

  waypoints = signal<Array<{ lat: number; lng: number }>>([]);
  currentMode = signal<MapMode>('pan');
  routeCoordinates = signal<Array<[number, number]>>([]);

  initMap(container: string, center: [number, number] = [41.4165, 1.9277], zoom: number = 13): L.Map {
    this.map = L.map(container, {
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      boxZoom: true,
      keyboard: true,
      zoomControl: true
    }).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    return this.map;
  }

  setMode(mode: MapMode): void {
    this.currentMode.set(mode);

    if (!this.map) return;

    if (mode === 'pan') {
      this.map.dragging.enable();
      this.map.scrollWheelZoom.enable();
      if (this.map.getContainer()) {
        this.map.getContainer().style.cursor = 'grab';
      }
    } else if (mode === 'addWaypoint') {
      this.map.dragging.disable();
      this.map.scrollWheelZoom.disable();
      if (this.map.getContainer()) {
        this.map.getContainer().style.cursor = 'crosshair';
      }
    } else if (mode === 'addCurveNote') {
      this.map.dragging.enable();
      this.map.scrollWheelZoom.enable();
      if (this.map.getContainer()) {
        this.map.getContainer().style.cursor = 'cell';
      }
    }
  }

  addClickListener(callback: (lat: number, lng: number) => void): void {
    if (!this.map) return;

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.currentMode() === 'addWaypoint') {
        callback(e.latlng.lat, e.latlng.lng);
      } else if (this.currentMode() === 'addCurveNote' && this.curveNoteListener) {
        this.curveNoteListener(e.latlng.lat, e.latlng.lng);
      }
    });
  }

  addCurveNoteListener(callback: (lat: number, lng: number) => void): void {
    this.curveNoteListener = callback;
  }

  canAddMoreWaypoints(): boolean {
    return this.waypoints().length < MAX_WAYPOINTS;
  }

  addWaypoint(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.waypoints().length >= MAX_WAYPOINTS) {
      this.notification.warn('Inici i final definits', 'Ja has col·locat els dos punts. Clica un marcador per eliminar-lo si vols canviar-lo.');
      return;
    }

    const currentWaypoints = this.waypoints();
    this.waypoints.set([...currentWaypoints, { lat, lng }]);
    this.rebuildWaypointMarkers();

    if (this.waypoints().length === MAX_WAYPOINTS) {
      this.setMode('pan');
    }

    this.waypointChange$.next();
  }

  private rebuildWaypointMarkers(): void {
    if (!this.map) return;

    this.markers.forEach(m => this.map!.removeLayer(m));
    this.markers = [];

    const wps = this.waypoints();
    const gradId = `pinkGrad-${Date.now()}`;

    wps.forEach((wp, index) => {
      const isFirst = index === 0;
      const isLast = index === wps.length - 1;

      let marker: L.Marker;

      if (isFirst) {
        const pinkIcon = L.divIcon({
          html: `
          <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#ff1493;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#ff69b4;stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.3 12.5 28.5 12.5 28.5S25 20.8 25 12.5C25 5.6 19.4 0 12.5 0z"
                  fill="url(#${gradId})" stroke="#c71585" stroke-width="1.5"/>
            <circle cx="12.5" cy="12.5" r="4" fill="white"/>
            <text x="12.5" y="15" font-size="10" text-anchor="middle" fill="#ff1493" font-weight="bold">1</text>
          </svg>
        `,
          className: 'custom-pink-marker',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        });

        marker = L.marker([wp.lat, wp.lng], { icon: pinkIcon }).addTo(this.map!);
        marker.bindPopup(`<div style="text-align: center; font-weight: bold;">🏁 Inici</div>`);
      } else if (isLast && wps.length === 2) {
        marker = L.marker([wp.lat, wp.lng], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(this.map!);
        marker.bindPopup(`<div style="text-align: center; font-weight: bold;">🏁 Final</div>`);
      } else {
        const iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
        marker = L.marker([wp.lat, wp.lng], {
          icon: L.icon({
            iconUrl,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(this.map!);
        marker.bindPopup(`<div style="text-align: center; font-weight: bold;">Waypoint #${index + 1}</div>`);
      }

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        this.removeWaypointAt(index);
      });

      this.markers.push(marker);
    });
  }

  removeWaypointAt(index: number): void {
    if (!this.map || index < 0 || index >= this.waypoints().length) return;

    const next = [...this.waypoints()];
    next.splice(index, 1);
    this.waypoints.set(next);
    this.rebuildWaypointMarkers();

    if (this.waypoints().length < 2) {
      this.clearRoute();
    }

    this.waypointChange$.next();
  }

  drawRoute(coordinates: Array<[number, number]>): void {
    if (!this.map) return;

    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }

    this.routeLayer = L.polyline(coordinates, {
      color: 'blue',
      weight: 4,
      opacity: 0.7
    }).addTo(this.map);

    this.map.fitBounds(this.routeLayer.getBounds());
    this.routeCoordinates.set(coordinates);
  }

  clearWaypoints(): void {
    this.markers.forEach(marker => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];
    this.waypoints.set([]);
    this.waypointChange$.next();
  }

  removeLastWaypoint(): void {
    const n = this.waypoints().length;
    if (n > 0) {
      this.removeWaypointAt(n - 1);
    }
  }

  clearRoute(): void {
    if (this.routeLayer && this.map) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = undefined;
    }
    this.routeCoordinates.set([]);
  }

  clearAll(): void {
    this.clearWaypoints();
    this.clearRoute();
    this.clearNoteMarkers();
    this.clearRoadSearchPin();
  }

  private static readonly ICON_GREEN =
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
  private static readonly ICON_RED =
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';

  setRoadSearchStartPin(lat: number, lng: number): void {
    if (!this.map) return;
    this.clearRoadSearchStartPin();
    this.roadSearchStartMarker = this.makeColoredPin(
      lat,
      lng,
      MapService.ICON_GREEN,
      '<strong>Inici (cerca)</strong>',
    );
    this.roadSearchStartMarker.addTo(this.map);
  }

  setRoadSearchEndPin(lat: number, lng: number): void {
    if (!this.map) return;
    this.clearRoadSearchEndPin();
    this.roadSearchEndMarker = this.makeColoredPin(
      lat,
      lng,
      MapService.ICON_RED,
      '<strong>Final (cerca)</strong>',
    );
    this.roadSearchEndMarker.addTo(this.map);
  }

  private makeColoredPin(
    lat: number,
    lng: number,
    iconUrl: string,
    popupHtml: string,
  ): L.Marker {
    return L.marker([lat, lng], {
      icon: L.icon({
        iconUrl,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).bindPopup(`${popupHtml}<br><span style="font-size:11px;color:#666">Carretera, PK o coordenades</span>`);
  }

  clearRoadSearchStartPin(): void {
    if (this.roadSearchStartMarker && this.map) {
      this.map.removeLayer(this.roadSearchStartMarker);
    }
    this.roadSearchStartMarker = undefined;
  }

  clearRoadSearchEndPin(): void {
    if (this.roadSearchEndMarker && this.map) {
      this.map.removeLayer(this.roadSearchEndMarker);
    }
    this.roadSearchEndMarker = undefined;
  }

  clearRoadSearchPins(): void {
    this.clearRoadSearchStartPin();
    this.clearRoadSearchEndPin();
  }

  /** @deprecated use clearRoadSearchPins */
  clearRoadSearchPin(): void {
    this.clearRoadSearchPins();
  }

  hasRoadSearchPin(): boolean {
    return this.roadSearchStartMarker != null || this.roadSearchEndMarker != null;
  }

  hasRoadSearchStartPin(): boolean {
    return this.roadSearchStartMarker != null;
  }

  hasRoadSearchEndPin(): boolean {
    return this.roadSearchEndMarker != null;
  }

  /** Ajusta zoom per veure un o dos pins de cerca. */
  fitSearchPinsView(): void {
    if (!this.map) return;
    const pts: L.LatLng[] = [];
    if (this.roadSearchStartMarker) {
      pts.push(this.roadSearchStartMarker.getLatLng());
    }
    if (this.roadSearchEndMarker) {
      pts.push(this.roadSearchEndMarker.getLatLng());
    }
    if (pts.length === 0) return;
    if (pts.length === 1) {
      this.map.flyTo(pts[0], 15, { duration: 0.6 });
      return;
    }
    const bounds = L.latLngBounds(pts);
    this.map.fitBounds(bounds, { padding: [56, 56], maxZoom: 16, animate: true });
  }

  flyTo(lat: number, lng: number, zoom: number = 15): void {
    this.map?.flyTo([lat, lng], zoom, { duration: 0.6 });
  }

  addNoteMarkers(notes: PaceNote[]): void {
    if (!this.map) return;

    this.clearNoteMarkers();

    notes.forEach((note, index) => {
      const iconUrl = note.type === 'curve'
        ? (note.direction === 'left'
            ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
            : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png')
        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';

      const marker = L.marker([note.lat, note.lng], {
        icon: L.icon({
          iconUrl,
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      });

      let popupContent = `
        <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="background: linear-gradient(135deg, ${note.type === 'curve' ? (note.direction === 'left' ? '#ef4444' : '#3b82f6') : '#22c55e'} 0%, ${note.type === 'curve' ? (note.direction === 'left' ? '#dc2626' : '#2563eb') : '#16a34a'} 100%); color: white; padding: 12px; margin: -15px -20px 10px -15px; border-radius: 8px 8px 0 0;">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px;">
              ${note.noteLabel}
            </div>
            <div style="font-size: 11px; opacity: 0.9;">
              Nota #${note.position}
            </div>
          </div>

          <div style="padding: 0 4px;">`;

      if (note.type === 'curve') {
        const curveType = note.angle! < 30 ? 'Molt oberta' :
                         note.angle! < 60 ? 'Oberta' :
                         note.angle! < 90 ? 'Normal' :
                         note.angle! < 120 ? 'Tancada' :
                         note.angle! < 150 ? 'Molt tancada' : 'Hairpin';

        popupContent += `
            <div style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 8px; margin-bottom: 8px; border-radius: 4px;">
              <div style="font-weight: 600; color: #92400e; font-size: 13px; margin-bottom: 4px;">
                🔄 Corba ${note.direction === 'left' ? 'Esquerra ⬅️' : 'Dreta ➡️'}
              </div>
            </div>

            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Angle:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1f2937;">
                  ${note.angle?.toFixed(1)}°
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Categoria:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1f2937;">
                  ${curveType}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Direcció:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1f2937;">
                  ${note.direction === 'left' ? 'Esquerra' : 'Dreta'}
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Coordenades:</td>
                <td style="padding: 6px 0; text-align: right; font-size: 10px; color: #9ca3af;">
                  ${note.lat.toFixed(5)}, ${note.lng.toFixed(5)}
                </td>
              </tr>
            </table>`;
      } else {
        const distanceCategory = note.distance! < 50 ? 'Molt curta' :
                                note.distance! < 100 ? 'Curta' :
                                note.distance! < 200 ? 'Mitjana' :
                                note.distance! < 500 ? 'Llarga' : 'Molt llarga';

        popupContent += `
            <div style="background: #d1fae5; border-left: 3px solid #10b981; padding: 8px; margin-bottom: 8px; border-radius: 4px;">
              <div style="font-weight: 600; color: #065f46; font-size: 13px; margin-bottom: 4px;">
                ➡️ Recta
              </div>
            </div>

            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Distància:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1f2937;">
                  ${note.distance?.toFixed(0)}m
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Longitud:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1f2937;">
                  ${distanceCategory}
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Coordenades:</td>
                <td style="padding: 6px 0; text-align: right; font-size: 10px; color: #9ca3af;">
                  ${note.lat.toFixed(5)}, ${note.lng.toFixed(5)}
                </td>
              </tr>
            </table>`;
      }

      if (note.customText) {
        popupContent += `
            <div style="background: #f3f4f6; border-left: 3px solid #6366f1; padding: 8px; margin-top: 10px; border-radius: 4px;">
              <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                Nota personalitzada
              </div>
              <div style="font-size: 12px; color: #1f2937; font-style: italic;">
                "${note.customText}"
              </div>
            </div>`;
      }

      popupContent += `
          </div>
        </div>`;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      marker.addTo(this.map!);

      this.noteMarkers.push(marker);
    });
  }

  clearNoteMarkers(): void {
    this.noteMarkers.forEach(marker => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.noteMarkers = [];
  }

  getMap(): L.Map | undefined {
    return this.map;
  }

  destroy(): void {
    this.clearAll();
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}
