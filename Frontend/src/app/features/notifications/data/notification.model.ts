export type NotificationType =
  | 'REQUEST_ACCEPTED'
  | 'REQUEST_IN_PROGRESS'
  | 'REQUEST_COMPLETED'
  | 'REQUEST_CANCELLED'
  | 'PAYMENT_COLLECTED'
  | 'NEW_MESSAGE'
  | 'MECHANIC_VALIDATED'
  | 'GENERAL';

export interface AppNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string | null;
  /** Chemin relatif à ouvrir au clic, ou `null`. */
  readonly link: string | null;
  readonly read: boolean;
  readonly createdAt: string;
}

interface BackendNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function toAppNotification(b: BackendNotification): AppNotification {
  return {
    id: String(b.id),
    type: b.type,
    title: b.title,
    body: b.body,
    link: b.link,
    read: b.read,
    createdAt: b.createdAt,
  };
}
