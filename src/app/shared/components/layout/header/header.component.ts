import { Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Button],
  template: `
    <header class="bg-barrufet-500 text-white shadow-md border-b border-barrufet-600/30">
      <div class="mx-auto px-4 py-3 flex items-center justify-between gap-4 min-h-[3.25rem]">
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight truncate">Barrufa Notes</h1>
        <div class="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          @if (auth.user(); as u) {
            <span class="text-right text-sm sm:text-base text-barrufet-50 max-w-[40vw] sm:max-w-none truncate" [title]="u.name || u.email">
              {{ u.name || u.email }}
            </span>
          }
          <p-button
            label="Sortir"
            icon="pi pi-sign-out"
            severity="secondary"
            [outlined]="true"
            size="small"
            styleClass="!border-white/40 !text-white hover:!bg-white/10"
            (onClick)="auth.logout()"
          />
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  auth = inject(AuthService);
}
