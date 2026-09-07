import { Conversation, Message, TypingSignal } from './messaging.model';

interface BackendParticipant {
  id: number;
  fullName: string;
  role: string | null;
}

export interface BackendChatRoom {
  id: number;
  name: string | null;
  group: boolean;
  participantIds: number[];
  participants: BackendParticipant[];
  lastMessageContent: string | null;
  lastMessageSenderId: number | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface BackendChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: string;
  sentAt: string;
}

export interface BackendTyping {
  chatRoomId: number;
  userId: number;
  userName: string;
  typing: boolean;
}

export function toConversation(r: BackendChatRoom, myId: string): Conversation {
  const peerRaw = (r.participants ?? []).find((p) => String(p.id) !== myId) ?? null;
  const peer = peerRaw
    ? { id: String(peerRaw.id), name: peerRaw.fullName, role: peerRaw.role }
    : null;
  return {
    id: String(r.id),
    peer,
    title: r.name?.trim() || peer?.name || 'Conversation',
    lastMessage: r.lastMessageContent,
    lastMessageAt: r.lastMessageAt,
    lastMessageMine: r.lastMessageSenderId != null && String(r.lastMessageSenderId) === myId,
  };
}

export function toMessage(m: BackendChatMessage, myId: string): Message {
  return {
    id: String(m.id),
    conversationId: String(m.chatRoomId),
    senderId: String(m.senderId),
    senderName: m.senderName,
    body: m.content,
    sentAt: m.sentAt,
    mine: String(m.senderId) === myId,
  };
}

export function toTypingSignal(t: BackendTyping): TypingSignal {
  return {
    conversationId: String(t.chatRoomId),
    userId: String(t.userId),
    userName: t.userName,
    typing: t.typing,
  };
}
