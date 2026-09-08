import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AppNotification } from '../../data/notification.model';
import { NotificationStore } from '../../data/notification.store';

/**
 * Cloche de notifications : badge non-lus + panneau déroulant.
 * Projetée dans la zone `[actions]` de l'en-tête par les coquilles.
 */
@Component({
  selector: 'app-notification-bell',
  imports: [],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBell {
  private readonly store = inject(NotificationStore);
  private readonly router = inject(Router);

  protected readonly items = this.store.items;
  protected readonly unread = this.store.unreadCount;
  protected readonly open = signal(false);

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.open.set(false);
  }

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((o) => !o);
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }

  protected onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  protected activate(n: AppNotification): void {
    if (!n.read) {
      this.store.markRead(n.id);
    }
    this.open.set(false);
    if (n.link) {
      const [path, query] = n.link.split('?');
      const queryParams: Record<string, string> = {};
      if (query) {
        for (const pair of query.split('&')) {
          const [k, v] = pair.split('=');
          queryParams[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
        }
      }
      void this.router.navigate([path], { queryParams });
    }
  }

  protected markAll(): void {
    this.store.markAllRead();
  }

  protected age(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.round(diff / 60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `il y a ${h} h`;
    const j = Math.round(h / 24);
    return `il y a ${j} j`;
  }
}
