export type ChatParticipantRole = 'client' | 'mechanic';

export interface ChatParticipant {
  readonly id: string;
  readonly fullName: string;
  readonly role: ChatParticipantRole;
  readonly avatarInitials: string;
  readonly subtitle: string;
  readonly isOnline: boolean;
}

export type ChatMessageStatus = 'sent' | 'delivered' | 'read';
export type ChatAttachmentType = 'image' | 'document';

export interface ChatAttachment {
  readonly id: string;
  readonly type: ChatAttachmentType;
  readonly name: string;
  readonly sizeLabel: string;
  readonly url?: string;
  readonly previewUrl?: string;
}

export interface ChatMessage {
  readonly id: string;
  readonly authorId: string;
  readonly body: string;
  readonly sentAt: string;
  readonly status: ChatMessageStatus;
  readonly attachments?: readonly ChatAttachment[];
}

export interface ChatConversation {
  readonly id: string;
  readonly requestId: string;
  readonly client: ChatParticipant;
  readonly mechanic: ChatParticipant;
  readonly vehicleLabel: string;
  readonly requestLabel: string;
  readonly unreadByParticipant: Readonly<Record<string, number>>;
  readonly typingParticipantId?: string;
  readonly lastActivityAt: string;
  readonly messages: readonly ChatMessage[];
}
