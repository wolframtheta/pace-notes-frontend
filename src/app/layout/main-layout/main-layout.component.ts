import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/layout/header/header.component';
import { SidebarComponent } from '../../shared/components/layout/sidebar/sidebar.component';
import { LoadingService } from '../../core/services/loading.service';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, Toast, ConfirmDialog, ProgressSpinner],
  styles: [`
    main {
      min-height: 600px;
    }
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
  `],
  template: `
    <div class="flex flex-col h-screen">
      <app-header />
      <div class="flex flex-1 overflow-hidden">
        <app-sidebar />
        <main class="flex-1 overflow-auto bg-gray-50 p-6">
          <router-outlet />
        </main>
      </div>
    </div>

    <p-toast position="bottom-right" />
    <p-confirmDialog />

    @if (loading.isLoading()) {
      <div class="loading-overlay">
        <p-progressSpinner strokeWidth="4" />
      </div>
    }
  `
})
export class MainLayoutComponent {
  loading = inject(LoadingService);
}
