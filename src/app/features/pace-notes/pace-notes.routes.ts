import { Routes } from '@angular/router';
import { NotesListComponent } from './components/notes-list/notes-list.component';
import { NotesPrintComponent } from './components/notes-print/notes-print.component';

export default [
  {
    path: '',
    component: NotesListComponent
  },
  {
    path: 'print',
    component: NotesPrintComponent
  }
] as Routes;
