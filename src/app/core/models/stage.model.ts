export interface Stage {
  id: string;
  rallyId: string;
  name: string;
  totalDistance?: number;
  routeGeometry?: GeoJSON.LineString;
  waypoints?: Array<{ lat: number; lng: number }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StageCreateInput {
  rallyId: string;
  name: string;
  totalDistance?: number;
  routeGeometry?: GeoJSON.LineString;
  waypoints?: Array<{ lat: number; lng: number }>;
}

export interface StageUpdateInput {
  id: string;
  name?: string;
  totalDistance?: number;
  routeGeometry?: GeoJSON.LineString;
  waypoints?: Array<{ lat: number; lng: number }>;
}
