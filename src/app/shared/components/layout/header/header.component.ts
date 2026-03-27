import { Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Button],
  template: `
    <header
      class="bg-white text-slate-900 shadow-sm border-b border-slate-200/90"
    >
      <div
        class="mx-auto px-4 py-3 flex items-center justify-between gap-4 min-h-[3.25rem]"
      >
        <div class="flex min-w-0 items-center gap-3 sm:gap-3.5">
          <img
            src="/assets/logo.png"
            width="40"
            height="48"
            alt=""
            class="h-10 w-auto shrink-0 object-contain sm:h-11"
          />
          <h1 class="truncate text-xl tracking-tight sm:text-2xl sm:tracking-[0.01em]">
            <span class="font-medium text-slate-800">Barrufa</span><span class="font-normal text-slate-500"> Notes</span>
          </h1>
        </div>
        <div class="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          @if (auth.user(); as u) {
            <span
              class="text-right text-sm sm:text-base text-slate-600 max-w-[40vw] sm:max-w-none truncate"
              [title]="u.name || u.email"
            >
              {{ u.name || u.email }}
            </span>
          }
          <p-button
            label="Sortir"
            icon="pi pi-sign-out"
            severity="secondary"
            [outlined]="true"
            size="small"
            styleClass="!border-slate-300 !text-slate-700 hover:!bg-slate-100"
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
