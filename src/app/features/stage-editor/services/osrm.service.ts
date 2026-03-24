import { Injectable } from '@angular/core';

interface OsrmResponse {
  routes: Array<{
    geometry: {
      coordinates: Array<[number, number]>;
    };
    distance: number;
    duration: number;
  }>;
}

export interface RouteData {
  coordinates: Array<[number, number]>;
  distance: number;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class OsrmService {
  private readonly OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

  async getRoute(waypoints: Array<{ lat: number; lng: number }>): Promise<Array<[number, number]> | null> {
    const routeData = await this.getRouteWithGeometry(waypoints);
    return routeData ? routeData.coordinates : null;
  }

  async getRouteWithGeometry(waypoints: Array<{ lat: number; lng: number }>): Promise<RouteData | null> {
    if (waypoints.length < 2) return null;

    const coordinates = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
    const url = `${this.OSRM_BASE_URL}/${coordinates}?geometries=geojson&overview=full`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('OSRM API error:', response.statusText);
        return null;
      }

      const data: OsrmResponse = await response.json();

      if (!data.routes || data.routes.length === 0) {
        console.error('No routes found');
        return null;
      }

      const route = data.routes[0];
      
      return {
        coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
        distance: route.distance,
        duration: route.duration
      };
    } catch (error) {
      console.error('Error fetching route from OSRM:', error);
      return null;
    }
  }
}
