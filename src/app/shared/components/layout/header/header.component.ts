import { Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Button],
  template: `
    <header class="bg-blue-600 text-white shadow-lg">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="text-2xl font-bold">Rally Pace Notes</h1>
        <div class="flex items-center gap-3">
          @if (auth.user()) {
            <span class="text-blue-100 text-sm">{{ auth.user()!.name || auth.user()!.email }}</span>
          }
          <p-button
            icon="pi pi-sign-out"
            severity="secondary"
            [text]="true"
            size="small"
            styleClass="text-white hover:text-blue-200"
            (onClick)="auth.logout()"
            title="Tancar sessió"
          />
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  auth = inject(AuthService);
}
