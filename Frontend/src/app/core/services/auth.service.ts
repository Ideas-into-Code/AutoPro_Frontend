import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import { AuthResponse, User } from '../models/user.model';
import {
  BackendAuthResponse,
  BackendUser,
  LoginPayload,
  ROLE_TO_BACKEND,
  SignUpPayload,
  toUser,
} from './auth.dto';

const STORAGE_KEY = 'autopro_auth_session';

interface StoredSession {
  token: string;
  user: User;
}

/**
 * Authentification réelle contre le backend AutoPro.
 *
 * - `POST /api/auth/login` et `/api/auth/signup` renvoient `{ token, type, user }` ;
 * - le token est conservé en `localStorage` et rattaché à chaque requête par
 *   `authInterceptor` ;
 * - `GET /api/users/me` permet de revalider la session au démarrage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _session = signal<StoredSession | null>(this.loadSavedSession());

  public readonly currentUser = computed(() => this._session()?.user ?? null);
  public readonly isAuthenticated = computed(() => this._session() !== null);
  public readonly userRole = computed(() => this._session()?.user.role ?? null);

  /** Écran d'accueil propre au rôle : chaque persona a son espace. */
  public readonly homeRoute = computed(() => {
    switch (this.userRole()) {
      case 'admin':
        return '/admin';
      case 'mecanicien':
        return '/mecanicien';
      default:
        return '/accueil';
    }
  });

  constructor() {
    // Les onglets d'un même navigateur partagent `localStorage`. Sans cette
    // synchronisation, un onglet resté sur un ancien compte affiche des données
    // qui ne sont plus celles de la session active — on croit « changer de
    // rôle tout seul ». On recharge donc la session dès qu'un autre onglet la
    // modifie. (Deux rôles en parallèle => deux navigateurs distincts.)
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this._session.set(this.loadSavedSession());
        }
      });
    }
  }

  /** Token JWT courant, ou `null`. Utilisé par l'intercepteur HTTP. */
  token(): string | null {
    return this._session()?.token ?? null;
  }

  /**
   * Connexion par e-mail + mot de passe.
   * `identifier` doit être une adresse e-mail : le backend n'accepte pas encore
   * la connexion par téléphone (voir issue dédiée).
   */
  login(identifier: string, password: string): Observable<AuthResponse> {
    const payload: LoginPayload = { email: identifier.trim().toLowerCase(), password };
    return this.http
      .post<BackendAuthResponse>(buildServiceUrl(this.config, 'auth', 'login'), payload)
      .pipe(
        map((response) => this.toAuthResponse(response)),
        tap((response) => this.setSession(response)),
      );
  }

  /** Inscription d'un client ou d'un mécanicien. */
  register(input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role: 'client' | 'mecanicien';
    workshopName?: string;
  }): Observable<AuthResponse> {
    const [firstName, ...rest] = input.fullName.trim().split(/\s+/);
    const payload: SignUpPayload = {
      firstName: firstName ?? input.fullName,
      lastName: rest.join(' ') || firstName || '-',
      email: input.email.trim().toLowerCase(),
      password: input.password,
      phone: input.phone,
      role: ROLE_TO_BACKEND[input.role],
      ...(input.workshopName ? { bio: input.workshopName } : {}),
    };
    return this.http
      .post<BackendAuthResponse>(buildServiceUrl(this.config, 'auth', 'signup'), payload)
      .pipe(
        map((response) => this.toAuthResponse(response)),
        tap((response) => this.setSession(response)),
      );
  }

  /**
   * Demande un lien de réinitialisation de mot de passe.
   * Le backend répond toujours de la même façon, que l'e-mail existe ou non
   * (protection contre l'énumération de comptes).
   */
  requestPasswordReset(email: string): Observable<void> {
    return this.http
      .post(
        buildServiceUrl(this.config, 'auth', 'password-reset/request'),
        { email: email.trim().toLowerCase() },
        { responseType: 'text' },
      )
      .pipe(map(() => undefined));
  }

  /** Revalide la session courante auprès du serveur. Sans effet côté serveur (SSR). */
  refreshCurrentUser(): Observable<User | null> {
    if (!isPlatformBrowser(this.platformId) || this._session() === null) {
      return of(this.currentUser());
    }
    return this.http.get<BackendUser>(buildServiceUrl(this.config, 'users', 'me')).pipe(
      map((backend) => toUser(backend)),
      tap((user) => {
        const session = this._session();
        if (session) {
          const updated = { ...session, user };
          this._session.set(updated);
          this.persist(updated);
        }
      }),
      catchError(() => {
        // 401 : session invalide côté serveur, on nettoie.
        this.logout();
        return of(null);
      }),
    );
  }

  logout(): void {
    this._session.set(null);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* localStorage indisponible */
      }
    }
  }

  private toAuthResponse(response: BackendAuthResponse): AuthResponse {
    return { user: toUser(response.user), token: response.token };
  }

  private setSession(authResponse: AuthResponse): void {
    const session: StoredSession = { token: authResponse.token, user: authResponse.user };
    this._session.set(session);
    this.persist(session);
  }

  private persist(session: StoredSession): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* localStorage désactivé : la session reste en mémoire pour cette page */
    }
  }

  private loadSavedSession(): StoredSession | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return null;
      }
      const parsed = JSON.parse(saved) as StoredSession;
      return parsed.token && parsed.user ? parsed : null;
    } catch {
      return null;
    }
  }
}
