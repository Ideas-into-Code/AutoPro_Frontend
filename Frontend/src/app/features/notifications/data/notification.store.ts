import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { API_CONFIG, buildServiceUrl } from '@core';
import { AuthService } from '@core/services/auth.service';
import { RealtimeSocketService } from '@core/services/realtime-socket.service';
import { AppNotification, toAppNotification } from './notification.model';

interface BackendNotification {
  id: number;
  type: AppNotification['type'];
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/**
 * État partagé des notifications de l'utilisateur connecté.
 *
 * - charge la liste et le compteur au démarrage (une fois connecté) ;
 * - reçoit les nouvelles en temps réel via STOMP `/user/queue/notifications` ;
 * - navigateur uniquement (les appels et la socket ne partent pas en SSR).
 */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly auth = inject(AuthService);
  private readonly socket = inject(RealtimeSocketService);

  private readonly _items = signal<readonly AppNotification[]>([]);
  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((n) => !n.read).length);

  private started = false;

  constructor() {
    // Démarre (ou arrête) selon l'état d'authentification.
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.start();
      } else {
        this.started = false;
        this._items.set([]);
      }
    });
  }

  private url(path = ''): string {
    return buildServiceUrl(this.config, 'notifications', path);
  }

  private start(): void {
    if (this.started || typeof window === 'undefined') {
      return;
    }
    this.started = true;
    this.reload();
    this.socket.watch<BackendNotification>('/user/queue/notifications').subscribe((raw) => {
      const n = toAppNotification(raw);
      this._items.update((list) => (list.some((x) => x.id === n.id) ? list : [n, ...list]));
    });
  }

  reload(): void {
    this.http.get<BackendNotification[]>(this.url()).subscribe({
      next: (rows) => this._items.set(rows.map(toAppNotification)),
      error: () => {
        /* silencieux : la cloche affichera simplement 0 */
      },
    });
  }

  markRead(id: string): void {
    this._items.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    this.http.patch(this.url(`${id}/read`), {}).subscribe({ error: () => this.reload() });
  }

  markAllRead(): void {
    this._items.update((list) => list.map((n) => ({ ...n, read: true })));
    this.http.patch(this.url('read-all'), {}).subscribe({ error: () => this.reload() });
  }
}
