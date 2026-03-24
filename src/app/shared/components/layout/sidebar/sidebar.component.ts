import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-gray-800 text-white w-64 min-h-screen p-4">
      <ul class="space-y-2">
        <li>
          <a 
            routerLink="/rallies" 
            routerLinkActive="bg-blue-600"
            class="block px-4 py-2 rounded hover:bg-gray-700 transition"
          >
            Rallies
          </a>
        </li>
        <li>
          <a 
            routerLink="/pace-notes" 
            routerLinkActive="bg-blue-600"
            class="block px-4 py-2 rounded hover:bg-gray-700 transition"
          >
            Notes de Pilot
          </a>
        </li>
        <li>
          <a 
            routerLink="/settings" 
            routerLinkActive="bg-blue-600"
            class="block px-4 py-2 rounded hover:bg-gray-700 transition"
          >
            Configuració
          </a>
        </li>
      </ul>
    </nav>
  `
})
export class SidebarComponent {}
