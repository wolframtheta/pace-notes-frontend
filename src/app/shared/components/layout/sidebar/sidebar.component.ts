import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-white text-slate-800 w-64 min-h-screen p-4 border-r border-barrufet-100">
      <ul class="space-y-1">
        <li>
          <a 
            routerLink="/rallies" 
            routerLinkActive="bg-barrufet-500 text-white shadow-sm"
            class="block px-4 py-2 rounded-lg font-medium text-slate-700 hover:bg-barrufet-50 transition"
          >
            Rallies
          </a>
        </li>
        <li>
          <a 
            routerLink="/settings" 
            routerLinkActive="bg-barrufet-500 text-white shadow-sm"
            class="block px-4 py-2 rounded-lg font-medium text-slate-700 hover:bg-barrufet-50 transition"
          >
            Configuració
          </a>
        </li>
      </ul>
    </nav>
  `
})
export class SidebarComponent {}
