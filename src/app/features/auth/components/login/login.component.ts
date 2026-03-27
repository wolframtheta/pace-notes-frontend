import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, InputText, Password, Button, Card, MessageModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-barrufet-50">
      <p-card class="w-full max-w-lg shadow-lg border border-barrufet-100">
        <ng-template pTemplate="header">
          <div class="flex flex-col items-center pt-6 pb-2 px-4">
            <div class="flex min-w-0 items-center gap-5 sm:gap-6">
              <img
                src="/assets/logo.png"
                width="80"
                height="96"
                alt=""
                class="h-20 w-auto shrink-0 object-contain sm:h-28"
              />
              <h1 class="text-3xl tracking-tight sm:text-5xl sm:tracking-[0.01em] leading-tight">
                <span class="font-medium text-slate-800">Barrufa</span><span class="font-normal text-slate-500"> Notes</span>
              </h1>
            </div>
            <p class="text-slate-600 mt-5 text-center text-lg sm:text-xl">
              Inicia sessió per continuar
            </p>
          </div>
        </ng-template>

        <form (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
          @if (error()) {
            <p-message severity="error" [text]="error()!" />
          }

          <div class="flex flex-col gap-1">
            <label for="email" class="font-medium text-sm text-slate-700">Email</label>
            <input
              pInputText
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="correu@exemple.com"
              class="w-full"
              required
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="password" class="font-medium text-sm text-slate-700">Contrasenya</label>
            <p-password
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="w-full"
              inputStyleClass="w-full"
              required
            />
          </div>

          <p-button
            type="submit"
            label="Entrar"
            [loading]="loading()"
            styleClass="w-full"
            severity="primary"
          />
        </form>

        <ng-template pTemplate="footer">
          <div class="text-center text-sm text-slate-600">
            No tens compte?
            <a
              routerLink="/register"
              [queryParams]="route.snapshot.queryParams"
              class="text-barrufet-600 font-semibold hover:underline ml-1"
            >
              Registra't
            </a>
          </div>
        </ng-template>
      </p-card>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  protected route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async onSubmit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.authService.login(this.email, this.password, returnUrl);
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Credencials incorrectes');
    } finally {
      this.loading.set(false);
    }
  }
}
