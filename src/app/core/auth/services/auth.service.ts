import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _token = signal<string | null>(localStorage.getItem('access_token'));
  private _user = signal<AuthUser | null>(
    JSON.parse(localStorage.getItem('auth_user') ?? 'null')
  );

  token = this._token.asReadonly();
  user = this._user.asReadonly();
  isAuthenticated = computed(() => !!this._token());

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
    );
    this.setSession(res);
    this.router.navigate(['/stages']);
  }

  async register(email: string, password: string, name?: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, { email, password, name })
    );
    this.setSession(res);
    this.router.navigate(['/stages']);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    this._token.set(res.access_token);
    this._user.set(res.user);
  }
}
