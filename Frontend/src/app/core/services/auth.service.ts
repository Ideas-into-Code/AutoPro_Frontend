import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { MOCK_USERS } from '../data/mock/mock-users.data';
import { AuthResponse, User, UserRole } from '../models/user.model';

const STORAGE_KEY = 'autopro_auth_session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals pour l'état réactif de l'authentification
  private readonly _currentUser = signal<User | null>(this.loadSavedSession());

  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);
  public readonly userRole = computed(() => this._currentUser()?.role ?? null);

  constructor() {}

  /**
   * Simule la connexion d'un utilisateur avec vérification des identifiants mock
   */
  login(identifier: string, _password: string): Observable<AuthResponse> {
    const cleanIdentifier = identifier.trim().toLowerCase();

    // Recherche de l'utilisateur fictif correspondant ou sélection du premier client par défaut
    const user =
      MOCK_USERS.find(
        (u) =>
          u.email.toLowerCase() === cleanIdentifier ||
          u.phone.replace(/\s+/g, '') === cleanIdentifier.replace(/\s+/g, '')
      ) ?? MOCK_USERS[0];

    const mockResponse: AuthResponse = {
      user,
      token: `mock-jwt-token-${user.id}-${Date.now()}`,
    };

    return of(mockResponse).pipe(
      delay(600), // Simulation du délai réseau
      tap((response) => this.setSession(response))
    );
  }

  /**
   * Simule l'inscription d'un nouvel utilisateur
   */
  register(userData: Partial<User>): Observable<AuthResponse> {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      fullName: userData.fullName ?? 'Nouvel Utilisateur',
      email: userData.email ?? '',
      phone: userData.phone ?? '',
      role: userData.role ?? 'client',
      workshopName: userData.workshopName,
      createdAt: new Date().toISOString(),
    };

    const mockResponse: AuthResponse = {
      user: newUser,
      token: `mock-jwt-token-${newUser.id}-${Date.now()}`,
    };

    return of(mockResponse).pipe(
      delay(800),
      tap((response) => this.setSession(response))
    );
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private setSession(authResponse: AuthResponse): void {
    this._currentUser.set(authResponse.user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authResponse));
    } catch {
      // Ignorer les erreurs d'écriture localStorage si désactivé
    }
  }

  private loadSavedSession(): User | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: AuthResponse = JSON.parse(saved);
        return parsed.user;
      }
    } catch {
      // Session corrompue
    }
    return null;
  }
}
