import { PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, delay, of, throwError } from 'rxjs';

import {
  AccountStatus,
  ApprovalDecision,
  ManagedAccount,
  PendingMechanic,
  SystemMetric,
  statusFromDecision,
} from '../models/admin-dashboard.model';
import {
  AccountDirectoryRepository,
  AccountModerationRepository,
  MechanicApprovalRepository,
  SystemOverviewRepository,
} from './admin-dashboard.repository';

/** Indicateurs de démonstration, repris de la maquette. */
const INDICATEURS: readonly SystemMetric[] = [
  {
    id: 'utilisateurs',
    label: 'Utilisateurs inscrits',
    value: 14284,
    icon: 'groupes',
    trendPercent: 12,
    direction: 'hausse',
  },
  {
    id: 'mecaniciens',
    label: 'Mécaniciens actifs',
    value: 842,
    icon: 'cle',
    trendPercent: 5.2,
    direction: 'hausse',
  },
  {
    id: 'revenus',
    label: 'Revenus du mois',
    value: 8400000,
    unit: 'FCFA',
    icon: 'paiement',
    trendPercent: 0,
    direction: 'stable',
  },
];

const COMPTES: readonly ManagedAccount[] = [
  {
    id: 'acc-001',
    fullName: 'Moussa Diop',
    email: 'moussa.diop@example.sn',
    role: 'client',
    status: 'actif',
    city: 'Dakar Plateau',
    registeredAt: '2026-01-14',
  },
  {
    id: 'acc-002',
    fullName: 'Awa Ndiaye',
    email: 'awa.ndiaye@example.sn',
    role: 'client',
    status: 'actif',
    city: 'Almadies',
    registeredAt: '2026-02-03',
  },
  {
    id: 'acc-003',
    fullName: 'Samba Fall',
    email: 'samba.fall@autopro.sn',
    role: 'mecanicien',
    status: 'actif',
    city: 'Pikine',
    registeredAt: '2025-11-22',
  },
  {
    id: 'acc-004',
    fullName: 'Omar Sy',
    email: 'omar.sy@example.sn',
    role: 'client',
    status: 'suspendu',
    city: 'Guédiawaye',
    registeredAt: '2025-09-08',
  },
  {
    id: 'acc-005',
    fullName: 'Fatou Gueye',
    email: 'fatou.gueye@autopro.sn',
    role: 'mecanicien',
    status: 'en_attente',
    city: 'Almadies',
    registeredAt: '2026-07-29',
  },
  {
    id: 'acc-006',
    fullName: 'Ibrahima Ba',
    email: 'ibrahima.ba@autopro.sn',
    role: 'mecanicien',
    status: 'actif',
    city: 'Rufisque',
    registeredAt: '2025-12-17',
  },
  {
    id: 'acc-007',
    fullName: 'Aissatou Sow',
    email: 'aissatou.sow@example.sn',
    role: 'client',
    status: 'actif',
    city: 'Yoff',
    registeredAt: '2026-03-30',
  },
  {
    id: 'acc-008',
    fullName: 'Amadou Sall',
    email: 'amadou.sall@autopro.sn',
    role: 'mecanicien',
    status: 'en_attente',
    city: 'Dakar Plateau',
    registeredAt: '2026-07-31',
  },
  {
    id: 'acc-009',
    fullName: 'Cheikh Mbaye',
    email: 'cheikh.mbaye@autopro.sn',
    role: 'mecanicien',
    status: 'en_attente',
    city: 'Parcelles Assainies',
    registeredAt: '2026-07-27',
  },
  {
    id: 'acc-010',
    fullName: 'Ndeye Faye',
    email: 'ndeye.faye@autopro.sn',
    role: 'mecanicien',
    status: 'en_attente',
    city: 'Thiès',
    registeredAt: '2026-07-24',
  },
];

const CANDIDATURES: readonly PendingMechanic[] = [
  {
    id: 'acc-008',
    fullName: 'Amadou Sall',
    specialty: 'BMW et Audi',
    city: 'Dakar Plateau',
    submittedAt: '2026-07-31',
  },
  {
    id: 'acc-005',
    fullName: 'Fatou Gueye',
    specialty: 'Systèmes hybrides',
    city: 'Almadies',
    submittedAt: '2026-07-29',
  },
  {
    id: 'acc-009',
    fullName: 'Cheikh Mbaye',
    specialty: 'Boîtes automatiques',
    city: 'Parcelles Assainies',
    submittedAt: '2026-07-27',
  },
  {
    id: 'acc-010',
    fullName: 'Ndeye Faye',
    specialty: 'Diagnostic électronique',
    city: 'Thiès',
    submittedAt: '2026-07-24',
  },
];

/**
 * Latence artificielle, dans le navigateur seulement.
 * L'appliquer au rendu serveur figerait la page prérendue sur son état de
 * chargement — même règle que les autres dépôts simulés du projet.
 */
function simuler<T>(valeur: T, platformId: object, ms = 400): Observable<T> {
  const reponse = of(valeur);

  return isPlatformBrowser(platformId) ? reponse.pipe(delay(ms)) : reponse;
}

/**
 * Serveur d'administration simulé.
 *
 * **Une seule classe pour les quatre contrats**, contrairement aux autres
 * dépôts simulés du projet, et pour une raison précise : les trois blocs de
 * l'écran partagent un même état. Valider une candidature la retire de la file
 * *et* fait passer le compte correspondant à « actif » dans la table. Deux
 * instances séparées afficheraient deux vérités contradictoires.
 *
 * La ségrégation reste entière là où elle compte : les **contrats** demeurent
 * distincts, et l'écran continue de ne dépendre que de celui dont il a besoin.
 * C'est le serveur qui est unique, pas l'interface — et le vrai backend l'est
 * tout autant.
 *
 * L'état vit dans des signaux d'instance et non dans des constantes de module :
 * une suspension survit ainsi à une navigation aller-retour, tandis que chaque
 * test repart d'un annuaire intact.
 */
export class MockAdminBackend
  extends SystemOverviewRepository
  implements AccountDirectoryRepository, AccountModerationRepository, MechanicApprovalRepository
{
  private readonly platformId = inject(PLATFORM_ID);

  private readonly comptes = signal<readonly ManagedAccount[]>(COMPTES);
  private readonly attente = signal<readonly PendingMechanic[]>(CANDIDATURES);

  metrics(): Observable<readonly SystemMetric[]> {
    return simuler(INDICATEURS, this.platformId, 300);
  }

  accounts(): Observable<readonly ManagedAccount[]> {
    return simuler(this.comptes(), this.platformId);
  }

  setStatus(accountId: string, status: AccountStatus): Observable<ManagedAccount> {
    const modifie = this.appliquerStatut(accountId, status);

    if (modifie === null) {
      // Un identifiant inconnu est une anomalie, pas un cas courant : on le
      // signale plutôt que de renvoyer un compte inventé.
      return throwError(() => new Error(`Compte introuvable : ${accountId}`));
    }

    return simuler(modifie, this.platformId, 300);
  }

  pending(): Observable<readonly PendingMechanic[]> {
    return simuler(this.attente(), this.platformId, 500);
  }

  decide(mechanicId: string, decision: ApprovalDecision): Observable<void> {
    // Validé ou rejeté, le dossier quitte la file : c'est le fait d'avoir été
    // tranché qui l'en retire, pas le sens de la décision. Le statut du compte,
    // lui, dépend bien de ce sens.
    this.attente.update((liste) => liste.filter((candidat) => candidat.id !== mechanicId));
    this.appliquerStatut(mechanicId, statusFromDecision(decision));

    return simuler(undefined, this.platformId, 300);
  }

  /** Renvoie le compte modifié, ou `null` si l'identifiant est inconnu. */
  private appliquerStatut(accountId: string, status: AccountStatus): ManagedAccount | null {
    const compte = this.comptes().find((candidat) => candidat.id === accountId);

    if (compte === undefined) {
      return null;
    }

    const modifie: ManagedAccount = { ...compte, status };

    this.comptes.update((liste) =>
      liste.map((candidat) => (candidat.id === accountId ? modifie : candidat)),
    );

    return modifie;
  }
}
