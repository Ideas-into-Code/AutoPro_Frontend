export type UserRole = 'client' | 'mecanicien' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  workshopName?: string; // Spécifique aux mécaniciens
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
