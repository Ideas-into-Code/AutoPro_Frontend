/**
 * Types de la messagerie, propres à cette feature.
 * Le backend expose des « chat rooms » ; l'interface parle de « conversations ».
 */

export interface ConversationPeer {
  readonly id: string;
  readonly name: string;
  readonly role: string | null;
}

export interface Conversation {
  readonly id: string;
  /** L'autre participant (conversation 1-1). `null` pour un groupe. */
  readonly peer: ConversationPeer | null;
  readonly title: string;
  readonly lastMessage: string | null;
  readonly lastMessageAt: string | null;
  /** `true` si le dernier message vient de l'utilisateur courant. */
  readonly lastMessageMine: boolean;
}

export interface Message {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly senderName: string;
  readonly body: string;
  readonly sentAt: string;
  readonly mine: boolean;
}

export interface TypingSignal {
  readonly conversationId: string;
  readonly userId: string;
  readonly userName: string;
  readonly typing: boolean;
}
