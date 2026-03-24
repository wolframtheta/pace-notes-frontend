import { Routes } from '@angular/router';
import { StageDetailComponent } from './components/stage-detail/stage-detail.component';

export default [
  {
    path: '',
    redirectTo: '/rallies',
    pathMatch: 'full',
  },
  {
    path: ':id',
    component: StageDetailComponent,
  },
] as Routes;
