import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent),
  },
] as Routes;
