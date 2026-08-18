import { PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, delay, of } from 'rxjs';

import {
  Availability,
  EarningsSummary,
  NewRequest,
  RequestDecision,
} from '../models/mechanic-dashboard.model';
import {
  MechanicAvailabilityRepository,
  MechanicDashboardRepository,
  RequestDecisionRepository,
} from './mechanic-dashboard.repository';

/** Gains de démonstration, du plus ancien au plus récent. */
const GAINS: EarningsSummary = {
  todayXOF: 145500,
  trendPercent: 12,
  points: [
    { label: 'Lun', amountXOF: 62000 },
    { label: 'Mar', amountXOF: 88000 },
    { label: 'Mer', amountXOF: 74000 },
    { label: 'Jeu', amountXOF: 105000 },
    { label: 'Ven', amountXOF: 129000 },
    { label: 'Sam', amountXOF: 145500 },
  ],
};

const DEMANDE_ENTRANTE: NewRequest = {
  id: 'req-2026-118',
  clientName: 'Moussa Diop',
  vehicle: 'Toyota Prado',
  problemLabel: 'Bruit au freinage',
  distanceLabel: '2,4 km',
  estimatedPayoutXOF: 15000,
};

/**
 * Latence artificielle, dans le navigateur seulement.
 * L'appliquer au rendu serveur figerait la page prérendue sur son état de
 * chargement — voir les autres dépôts simulés du projet.
 */
function simuler<T>(valeur: T, platformId: object, ms = 400): Observable<T> {
  const reponse = of(valeur);

  return isPlatformBrowser(platformId) ? reponse.pipe(delay(ms)) : reponse;
}

export class MockMechanicDashboardRepository extends MechanicDashboardRepository {
  private readonly platformId = inject(PLATFORM_ID);

  earnings(): Observable<EarningsSummary> {
    return simuler(GAINS, this.platformId);
  }

  incomingRequest(): Observable<NewRequest | null> {
    return simuler(DEMANDE_ENTRANTE, this.platformId, 900);
  }
}

/**
 * Disponibilité simulée.
 *
 * L'état est porté par un signal de l'instance : le dépôt étant fourni une
 * seule fois par la route, la bascule survit à une navigation aller-retour.
 * Un `const` de module aurait le même effet mais serait partagé entre les
 * tests, qui se contamineraient.
 */
export class MockMechanicAvailabilityRepository extends MechanicAvailabilityRepository {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly enLigne = signal(true);

  current(): Observable<Availability> {
    return simuler({ isOnline: this.enLigne() }, this.platformId, 200);
  }

  update(isOnline: boolean): Observable<Availability> {
    this.enLigne.set(isOnline);

    return simuler({ isOnline }, this.platformId, 300);
  }
}

export class MockRequestDecisionRepository extends RequestDecisionRepository {
  private readonly platformId = inject(PLATFORM_ID);

  decide(_requestId: string, _decision: RequestDecision): Observable<void> {
    return simuler(undefined, this.platformId, 300);
  }
}
