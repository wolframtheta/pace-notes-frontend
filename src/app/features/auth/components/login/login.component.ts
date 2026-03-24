import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
    <div class="flex items-center justify-center min-h-screen bg-gray-50">
      <p-card class="w-full max-w-md shadow-lg">
        <ng-template pTemplate="header">
          <div class="text-center pt-6 pb-2">
            <h1 class="text-2xl font-bold text-gray-800">Pace Notes</h1>
            <p class="text-gray-500 mt-1">Inicia sessió per continuar</p>
          </div>
        </ng-template>

        <form (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
          @if (error()) {
            <p-message severity="error" [text]="error()!" />
          }

          <div class="flex flex-col gap-1">
            <label for="email" class="font-medium text-sm text-gray-700">Email</label>
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
            <label for="password" class="font-medium text-sm text-gray-700">Contrasenya</label>
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
          <div class="text-center text-sm text-gray-500">
            No tens compte?
            <a routerLink="/register" class="text-primary-600 font-medium hover:underline ml-1">
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

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async onSubmit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.login(this.email, this.password);
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Credencials incorrectes');
    } finally {
      this.loading.set(false);
    }
  }
}
