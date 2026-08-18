import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  CLIENT_PROFILE,
  MECHANIC_PROFILE,
  MOCK_CONVERSATIONS,
} from '../../data/mock-conversations.data';
import { ChatConversation, ChatMessage, ChatParticipant, ChatParticipantRole } from '../../models/chat.model';

@Component({
  selector: 'app-chat-page',
  imports: [RouterLink],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPage {
  private readonly route = inject(ActivatedRoute);
  private readonly conversations = signal<readonly ChatConversation[]>(MOCK_CONVERSATIONS);

  protected readonly roleOptions: readonly { role: ChatParticipantRole; label: string }[] = [
    { role: 'client', label: 'Client' },
    { role: 'mechanic', label: 'Atelier' },
  ];
  protected readonly quickReplies = ['Où êtes-vous ?', 'Combien de temps ?', 'Je confirme'];

  protected readonly currentUserRole = signal<ChatParticipantRole>(this.initialRole());
  protected readonly searchTerm = signal('');
  protected readonly selectedConversationId = signal(this.initialConversationId());
  protected readonly draftMessage = signal('');

  protected readonly currentUser = computed<ChatParticipant>(() =>
    this.currentUserRole() === 'client' ? CLIENT_PROFILE : MECHANIC_PROFILE,
  );

  protected readonly currentUserId = computed(() => this.currentUser().id);

  protected readonly visibleConversations = computed(() => {
    const userId = this.currentUserId();
    return this.conversations().filter(
      (conversation) => conversation.client.id === userId || conversation.mechanic.id === userId,
    );
  });

  protected readonly filteredConversations = computed(() => {
    const term = this.normalize(this.searchTerm());
    if (term === '') {
      return this.visibleConversations();
    }

    return this.visibleConversations().filter((conversation) => {
      const remote = this.remoteParticipant(conversation);
      const haystack = this.normalize(
        [
          remote.fullName,
          remote.subtitle,
          conversation.vehicleLabel,
          conversation.requestLabel,
          this.lastMessage(conversation)?.body ?? '',
        ].join(' '),
      );

      return haystack.includes(term);
    });
  });

  protected readonly selectedConversation = computed<ChatConversation | null>(() => {
    const selectedId = this.selectedConversationId();
    return this.visibleConversations().find((conversation) => conversation.id === selectedId) ?? null;
  });

  protected readonly totalUnread = computed(() =>
    this.visibleConversations().reduce((total, conversation) => total + this.unreadCount(conversation), 0),
  );

  protected readonly audienceLabel = computed(() =>
    this.currentUserRole() === 'client' ? 'Mécaniciens' : 'Clients',
  );

  protected readonly searchPlaceholder = computed(() =>
    this.currentUserRole() === 'client'
      ? 'Mécanicien, véhicule, demande...'
      : 'Client, véhicule, demande...',
  );

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected switchRole(role: ChatParticipantRole): void {
    this.currentUserRole.set(role);
    const firstConversation = this.findConversationFromUrl(role) ?? this.firstConversationForRole(role);
    this.selectedConversationId.set(firstConversation?.id ?? '');
    this.draftMessage.set('');
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  protected selectConversation(conversation: ChatConversation): void {
    this.selectedConversationId.set(conversation.id);
    const userId = this.currentUserId();
    this.conversations.update((conversations) =>
      conversations.map((item) =>
        item.id === conversation.id
          ? {
              ...item,
              unreadByParticipant: {
                ...item.unreadByParticipant,
                [userId]: 0,
              },
            }
          : item,
      ),
    );
  }

  protected onDraftInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.draftMessage.set(textarea.value);
  }

  protected sendMessage(): void {
    const text = this.draftMessage().trim();
    const conversation = this.selectedConversation();
    if (!conversation || text === '') return;

    const message: ChatMessage = {
      id: `msg-local-${Date.now()}`,
      authorId: this.currentUserId(),
      body: text,
      sentAt: new Date().toISOString(),
      status: 'sent',
    };

    this.conversations.update((conversations) =>
      conversations.map((item) =>
        item.id === conversation.id
          ? {
              ...item,
              lastActivityAt: message.sentAt,
              typingParticipantId: undefined,
              messages: [...item.messages, message],
            }
          : item,
      ),
    );
    this.draftMessage.set('');
  }

  protected lastMessage(conversation: ChatConversation): ChatMessage | null {
    return conversation.messages.at(-1) ?? null;
  }

  protected conversationPreview(conversation: ChatConversation): string {
    return this.lastMessage(conversation)?.body ?? '';
  }

  protected remoteParticipant(conversation: ChatConversation): ChatParticipant {
    return conversation.client.id === this.currentUserId() ? conversation.mechanic : conversation.client;
  }

  protected unreadCount(conversation: ChatConversation): number {
    return conversation.unreadByParticipant[this.currentUserId()] ?? 0;
  }

  protected isRemoteTyping(conversation: ChatConversation): boolean {
    return (
      typeof conversation.typingParticipantId === 'string' &&
      conversation.typingParticipantId !== this.currentUserId()
    );
  }

  protected actionLink(conversation: ChatConversation): readonly string[] {
    const remote = this.remoteParticipant(conversation);
    return remote.role === 'mechanic' ? ['/mecaniciens', remote.id] : ['/demandes'];
  }

  protected actionLabel(conversation: ChatConversation): string {
    return this.remoteParticipant(conversation).role === 'mechanic'
      ? 'Voir le profil du mécanicien'
      : 'Voir la demande du client';
  }

  protected applyQuickReply(reply: string): void {
    this.draftMessage.set(reply);
  }

  protected timeLabel(value: string): string {
    return new Intl.DateTimeFormat('fr-SN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  }

  protected isMine(message: ChatMessage): boolean {
    return message.authorId === this.currentUserId();
  }

  protected messageStatusLabel(status: ChatMessage['status']): string {
    switch (status) {
      case 'read':
        return 'Lu';
      case 'delivered':
        return 'Reçu';
      default:
        return 'Envoyé';
    }
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private initialRole(): ChatParticipantRole {
    const role = this.route.snapshot.queryParamMap.get('role') ?? this.route.snapshot.queryParamMap.get('vue');
    return role === 'mechanic' || role === 'atelier' ? 'mechanic' : 'client';
  }

  private initialConversationId(): string {
    const role = this.initialRole();
    return (this.findConversationFromUrl(role) ?? this.firstConversationForRole(role))?.id ?? '';
  }

  private findConversationFromUrl(role: ChatParticipantRole): ChatConversation | undefined {
    const params = this.route.snapshot.queryParamMap;
    const conversationId = params.get('conversation');
    const mechanicId = params.get('mecanicien') ?? params.get('mechanicId');
    const clientId = params.get('client') ?? params.get('clientId');

    if (conversationId) {
      return this.conversations().find((conversation) => conversation.id === conversationId);
    }

    if (role === 'client' && mechanicId) {
      return this.conversations().find(
        (conversation) => conversation.client.id === CLIENT_PROFILE.id && conversation.mechanic.id === mechanicId,
      );
    }

    if (role === 'mechanic' && clientId) {
      return this.conversations().find(
        (conversation) => conversation.mechanic.id === MECHANIC_PROFILE.id && conversation.client.id === clientId,
      );
    }

    return undefined;
  }

  private firstConversationForRole(role: ChatParticipantRole): ChatConversation | undefined {
    return this.conversations().find((conversation) =>
      role === 'client'
        ? conversation.client.id === CLIENT_PROFILE.id
        : conversation.mechanic.id === MECHANIC_PROFILE.id,
    );
  }
}
