import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';
import { clientAreaGuard, roleGuard } from './auth.guard';

function withRole(role: UserRole | null) {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: AuthService,
        useValue: {
          userRole: () => role,
          homeRoute: () => (role === 'mecanicien' ? '/mecanicien' : role === 'admin' ? '/admin' : '/accueil'),
          isAuthenticated: () => role !== null,
        },
      },
    ],
  });
}

// Les gardes ci-dessous n'utilisent pas leurs arguments de route : on les
// appelle sans, en s'affranchissant de la signature exacte de `CanMatchFn`
// (qui varie selon la version d'Angular).
const run = (guard: CanMatchFn) =>
  TestBed.runInInjectionContext(() => (guard as () => boolean | UrlTree)());
const path = (t: unknown) => (t instanceof UrlTree ? TestBed.inject(Router).serializeUrl(t) : t);

describe('clientAreaGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('laisse passer un visiteur non connecté (pages publiques)', () => {
    withRole(null);
    expect(run(clientAreaGuard)).toBe(true);
  });

  it('laisse passer un client', () => {
    withRole('client');
    expect(run(clientAreaGuard)).toBe(true);
  });

  it('renvoie un mécanicien vers son espace', () => {
    withRole('mecanicien');
    expect(path(run(clientAreaGuard))).toBe('/mecanicien');
  });

  it('renvoie un admin vers son espace', () => {
    withRole('admin');
    expect(path(run(clientAreaGuard))).toBe('/admin');
  });
});

describe('roleGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('autorise le bon rôle', () => {
    withRole('mecanicien');
    expect(run(roleGuard('mecanicien'))).toBe(true);
  });

  it('renvoie vers l’espace du rôle courant, pas vers l’accueil client', () => {
    withRole('mecanicien');
    expect(path(run(roleGuard('admin')))).toBe('/mecanicien');
  });
});
