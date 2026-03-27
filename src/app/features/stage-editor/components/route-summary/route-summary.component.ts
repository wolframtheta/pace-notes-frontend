import { Component, input } from '@angular/core';

@Component({
  selector: 'app-route-summary',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-white p-4 rounded-lg shadow-lg">
      <h3 class="text-lg font-bold mb-3">Resum del Traçat</h3>
      
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Inici / final:</span>
          <span class="font-semibold">{{ waypointCount() }}</span>
        </div>
        
        @if (totalDistance()) {
          <div class="flex justify-between">
            <span class="text-gray-600">Distància Total:</span>
            <span class="font-semibold">{{ totalDistance() }} km</span>
          </div>
        }
        
        @if (noteCount()) {
          <div class="flex justify-between">
            <span class="text-gray-600">Notes Generades:</span>
            <span class="font-semibold">{{ noteCount() }}</span>
          </div>
        }
      </div>
    </div>
  `
})
export class RouteSummaryComponent {
  waypointCount = input<number>(0);
  totalDistance = input<number | null>(null);
  noteCount = input<number>(0);
}
