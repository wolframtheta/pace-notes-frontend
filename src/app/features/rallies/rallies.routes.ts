import { Routes } from '@angular/router';
import { RallyListComponent } from './components/rally-list/rally-list.component';
import { RallyDetailComponent } from './components/rally-detail/rally-detail.component';

export default [
  {
    path: '',
    component: RallyListComponent,
  },
  {
    path: ':id',
    component: RallyDetailComponent,
  },
] as Routes;
