import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/auth/guards/auth.guard';
import { guestGuard } from './core/auth/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/components/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'stages/:id/print',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/stages/components/stage-print/stage-print.component').then(m => m.StagePrintComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: '/rallies', pathMatch: 'full' },
      {
        path: 'rallies',
        loadChildren: () => import('./features/rallies/rallies.routes')
      },
      {
        path: 'stages',
        loadChildren: () => import('./features/stages/stages.routes')
      },
      {
        path: 'stage-editor',
        loadChildren: () => import('./features/stage-editor/stage-editor.routes')
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes')
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
