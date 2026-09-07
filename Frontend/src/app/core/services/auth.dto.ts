import { User, UserRole } from '../models/user.model';

/**
 * Contrats d'authentification tels que les expose le backend AutoPro
 * (`/api/auth/*`, `/api/users/me`). Isolés ici pour que le reste de
 * l'application ne manipule que le modèle `User` du frontend.
 */

export interface BackendUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'ROLE_CLIENT' | 'ROLE_MECHANIC' | 'ROLE_ADMIN';
  active: boolean;
  mechanicId: number | null;
  createdAt: string;
}

export interface BackendAuthResponse {
  token: string;
  type: string;
  user: BackendUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'ROLE_CLIENT' | 'ROLE_MECHANIC';
  specialization?: string;
  bio?: string;
}

const ROLE_FROM_BACKEND: Record<BackendUser['role'], UserRole> = {
  ROLE_CLIENT: 'client',
  ROLE_MECHANIC: 'mecanicien',
  ROLE_ADMIN: 'admin',
};

export const ROLE_TO_BACKEND: Record<'client' | 'mecanicien', SignUpPayload['role']> = {
  client: 'ROLE_CLIENT',
  mecanicien: 'ROLE_MECHANIC',
};

/** Convertit l'utilisateur renvoyé par le backend vers le modèle du frontend. */
export function toUser(backend: BackendUser): User {
  return {
    id: String(backend.id),
    fullName: `${backend.firstName} ${backend.lastName}`.trim(),
    email: backend.email,
    phone: backend.phone ?? '',
    role: ROLE_FROM_BACKEND[backend.role],
    createdAt: backend.createdAt,
  };
}
