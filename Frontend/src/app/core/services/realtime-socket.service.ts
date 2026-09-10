import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { AuthService } from './auth.service';

/**
 * Connexion STOMP temps réel vers le backend (`/ws`, WebSocket natif).
 *
 * - une seule connexion partagée pour toute l'application (messagerie,
 *   notifications, suivi de position…) ;
 * - authentifiée par le token JWT courant (en-tête `Authorization` sur CONNECT) ;
 * - strictement navigateur : rien ne se connecte pendant le rendu serveur.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeSocketService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private readonly gateway = inject(API_CONFIG).gateway;
  private client: Client | null = null;

  /** `true` quand la connexion STOMP est établie. */
  readonly connected = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.disconnect());
  }

  /** Établit la connexion si elle n'existe pas déjà. Sans effet côté serveur. */
  connect(): void {
    if (!isPlatformBrowser(this.platformId) || this.client?.active) {
      return;
    }
    const token = this.auth.token();
    if (!token) {
      return;
    }

    this.client = new Client({
      brokerURL: this.brokerUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => this.connected.set(true),
      onWebSocketClose: () => this.connected.set(false),
      onStompError: () => this.connected.set(false),
    });
    this.client.activate();
  }

  /**
   * URL du endpoint STOMP `/ws`, déduite de la passerelle d'API :
   * - passerelle relative (`/api`) → même hôte que la page (`wss://<hôte>/ws`) ;
   * - passerelle absolue (`https://back.onrender.com/api`) → même hôte que
   *   l'API (`wss://back.onrender.com/ws`), pour un front et un back sur des
   *   domaines distincts.
   */
  private brokerUrl(): string {
    const match = /^https?:\/\/[^/]+/i.exec(this.gateway);
    if (match) {
      return `${match[0].replace(/^http/i, 'ws')}/ws`;
    }
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${scheme}://${window.location.host}/ws`;
  }

  disconnect(): void {
    this.connected.set(false);
    void this.client?.deactivate();
    this.client = null;
  }

  /**
   * Flux des messages publiés sur un topic (`/topic/chat/{id}`…).
   * Se (dés)abonne automatiquement à la (dé)souscription de l'Observable.
   */
  watch<T>(destination: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      this.connect();

      let stompSub: { unsubscribe(): void } | undefined;
      const trySubscribe = (): boolean => {
        if (this.client?.connected) {
          stompSub = this.client.subscribe(destination, (frame: IMessage) => {
            try {
              subscriber.next(JSON.parse(frame.body) as T);
            } catch {
              /* trame non-JSON ignorée */
            }
          });
          return true;
        }
        return false;
      };

      // Le client peut ne pas être encore connecté : on retente brièvement.
      let attempts = 0;
      const timer = setInterval(() => {
        if (trySubscribe() || ++attempts > 40) {
          clearInterval(timer);
        }
      }, 250);
      trySubscribe();

      return () => {
        clearInterval(timer);
        stompSub?.unsubscribe();
      };
    });
  }

  /** Publie un message sur une destination `/app/...`. */
  publish(destination: string, body: unknown): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.connect();
    this.client?.publish({ destination, body: JSON.stringify(body) });
  }
}
