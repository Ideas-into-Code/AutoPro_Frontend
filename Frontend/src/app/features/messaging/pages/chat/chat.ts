import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiError } from '@core';
import { AuthService } from '@core/services/auth.service';
import { Spinner } from '@shared/ui';
import { Conversation, Message } from '../../data/messaging.model';
import { HttpMessagingRepository, MessagingRepository } from '../../data/messaging.repository';

/**
 * Messagerie réelle : liste des conversations + fil de discussion, branchée sur
 * `/api/chat` (historique) et STOMP `/topic/chat/{id}` (temps réel).
 */
@Component({
  selector: 'app-chat-page',
  imports: [Spinner, RouterLink],
  providers: [{ provide: MessagingRepository, useClass: HttpMessagingRepository }],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPage {
  private readonly repo = inject(MessagingRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Retour vers l'espace du rôle courant — la messagerie n'a pas de coquille. */
  protected readonly retour = this.auth.homeRoute;

  protected readonly conversations = signal<readonly Conversation[]>([]);
  protected readonly loadingList = signal(true);
  protected readonly listError = signal(false);
  protected readonly ouvertureError = signal<string | null>(null);

  protected readonly selectedId = signal<string | null>(null);
  protected readonly messages = signal<readonly Message[]>([]);
  protected readonly loadingThread = signal(false);
  protected readonly draft = signal('');
  protected readonly peerTyping = signal(false);

  protected readonly selected = computed(
    () => this.conversations().find((c) => c.id === this.selectedId()) ?? null,
  );

  private liveSub?: Subscription;
  private typingSub?: Subscription;
  private typingTimeout?: ReturnType<typeof setTimeout>;
  private peerTypingTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    // Toute la messagerie (REST + WebSocket) est strictement navigateur.
    if (!this.isBrowser) {
      this.loadingList.set(false);
      return;
    }

    this.loadConversations();

    // Ouvre la conversation demandée par l'URL (?conversation=id ou ?peer=userId).
    effect(() => {
      const list = this.conversations();
      const convId = this.route.snapshot.queryParamMap.get('conversation');
      const peerId = this.route.snapshot.queryParamMap.get('peer');
      if (this.selectedId() !== null) {
        return;
      }
      if (convId && list.some((c) => c.id === convId)) {
        this.select(convId);
      } else if (peerId) {
        this.openWithPeer(peerId);
      } else if (list.length > 0) {
        this.select(list[0].id);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.liveSub?.unsubscribe();
      this.typingSub?.unsubscribe();
    });
  }

  private loadConversations(): void {
    this.loadingList.set(true);
    this.listError.set(false);
    this.repo
      .conversations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.conversations.set(list);
          this.loadingList.set(false);
        },
        error: () => {
          this.loadingList.set(false);
          this.listError.set(true);
        },
      });
  }

  protected openWithPeer(peerUserId: string): void {
    if (peerUserId === this.auth.currentUser()?.id) {
      // Arrive quand deux onglets d'un même navigateur partagent la session :
      // le « correspondant » est en fait le compte connecté.
      this.ouvertureError.set(
        'Vous ne pouvez pas ouvrir une conversation avec vous-même. Pour tester les deux rôles, utilisez deux navigateurs distincts.',
      );
      return;
    }
    this.ouvertureError.set(null);
    this.repo
      .openDirect(peerUserId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (conv) => {
          this.conversations.update((list) =>
            list.some((c) => c.id === conv.id) ? list : [conv, ...list],
          );
          this.select(conv.id);
        },
        error: (err: ApiError) => {
          this.ouvertureError.set(
            err?.message ?? "La conversation n'a pas pu être ouverte.",
          );
        },
      });
  }

  protected select(id: string): void {
    if (this.selectedId() === id) {
      return;
    }
    this.selectedId.set(id);
    this.messages.set([]);
    this.peerTyping.set(false);
    this.loadingThread.set(true);
    this.draft.set('');

    this.repo
      .history(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (msgs) => {
          this.messages.set(msgs);
          this.loadingThread.set(false);
        },
        error: () => this.loadingThread.set(false),
      });

    this.liveSub?.unsubscribe();
    this.liveSub = this.repo.liveMessages(id).subscribe((msg) => {
      this.messages.update((list) => (list.some((m) => m.id === msg.id) ? list : [...list, msg]));
      if (!msg.mine) {
        this.peerTyping.set(false);
      }
      this.bumpConversation(id, msg);
    });

    this.typingSub?.unsubscribe();
    this.typingSub = this.repo.liveTyping(id).subscribe((sig) => {
      if (sig.userId === this.auth.currentUser()?.id) {
        return;
      }
      this.peerTyping.set(sig.typing);
      clearTimeout(this.peerTypingTimeout);
      if (sig.typing) {
        this.peerTypingTimeout = setTimeout(() => this.peerTyping.set(false), 4000);
      }
    });
  }

  protected onDraft(value: string): void {
    this.draft.set(value);
    const id = this.selectedId();
    if (!id) {
      return;
    }
    this.repo.notifyTyping(id, true);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => this.repo.notifyTyping(id, false), 2500);
  }

  protected send(): void {
    const id = this.selectedId();
    const text = this.draft().trim();
    if (!id || text === '') {
      return;
    }
    this.repo.send(id, text);
    this.repo.notifyTyping(id, false);
    this.draft.set('');
  }

  private bumpConversation(id: string, msg: Message): void {
    this.conversations.update((list) => {
      const next = list.map((c) =>
        c.id === id
          ? { ...c, lastMessage: msg.body, lastMessageAt: msg.sentAt, lastMessageMine: msg.mine }
          : c,
      );
      next.sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
      return next;
    });
  }

  protected heure(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }
}
