import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import { AuthService } from '@core/services/auth.service';
import { RealtimeSocketService } from '@core/services/realtime-socket.service';
import { Conversation, Message, TypingSignal } from './messaging.model';
import {
  BackendChatMessage,
  BackendChatRoom,
  BackendTyping,
  toConversation,
  toMessage,
  toTypingSignal,
} from './messaging.mapper';

/**
 * Messagerie réelle : REST pour l'historique et la liste des conversations,
 * STOMP (`/topic/chat/{id}`) pour le temps réel.
 */
export abstract class MessagingRepository {
  abstract conversations(): Observable<readonly Conversation[]>;
  abstract openDirect(peerUserId: string): Observable<Conversation>;
  abstract history(conversationId: string): Observable<readonly Message[]>;

  /** Messages entrants en temps réel pour une conversation. */
  abstract liveMessages(conversationId: string): Observable<Message>;
  /** Notifications « en train d'écrire » pour une conversation. */
  abstract liveTyping(conversationId: string): Observable<TypingSignal>;

  abstract send(conversationId: string, body: string): void;
  abstract notifyTyping(conversationId: string, typing: boolean): void;
}

export class HttpMessagingRepository extends MessagingRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly auth = inject(AuthService);
  private readonly socket = inject(RealtimeSocketService);

  private get myId(): string {
    return this.auth.currentUser()?.id ?? '';
  }

  private url(path = ''): string {
    return buildServiceUrl(this.config, 'messaging', path);
  }

  conversations(): Observable<readonly Conversation[]> {
    return this.http
      .get<BackendChatRoom[]>(this.url('rooms'))
      .pipe(map((rows) => rows.map((r) => toConversation(r, this.myId))));
  }

  openDirect(peerUserId: string): Observable<Conversation> {
    return this.http
      .post<BackendChatRoom>(this.url('rooms/direct'), { peerId: Number(peerUserId) })
      .pipe(map((r) => toConversation(r, this.myId)));
  }

  history(conversationId: string): Observable<readonly Message[]> {
    const params = new HttpParams().set('page', 0).set('size', 100);
    return this.http
      .get<BackendChatMessage[]>(this.url(`rooms/${conversationId}/messages`), { params })
      .pipe(
        // Le backend renvoie du plus récent au plus ancien : on inverse pour l'affichage.
        map((rows) => rows.map((m) => toMessage(m, this.myId)).reverse()),
      );
  }

  liveMessages(conversationId: string): Observable<Message> {
    return this.socket
      .watch<BackendChatMessage>(`/topic/chat/${conversationId}`)
      .pipe(map((m) => toMessage(m, this.myId)));
  }

  liveTyping(conversationId: string): Observable<TypingSignal> {
    return this.socket
      .watch<BackendTyping>(`/topic/chat/${conversationId}/typing`)
      .pipe(map(toTypingSignal));
  }

  send(conversationId: string, body: string): void {
    this.socket.publish('/app/chat.send', { chatRoomId: Number(conversationId), content: body });
  }

  notifyTyping(conversationId: string, typing: boolean): void {
    this.socket.publish('/app/chat.typing', { chatRoomId: Number(conversationId), typing });
  }
}
