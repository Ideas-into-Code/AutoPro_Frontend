import { Observable } from 'rxjs';

import {
  Availability,
  EarningsSummary,
  NewRequest,
  RequestDecision,
} from '../models/mechanic-dashboard.model';

/**
 * Lecture des informations affichées sur le tableau de bord mécanicien.
 *
 * Classe abstraite, donc contrat **et** jeton d'injection — même motif que les
 * autres dépôts du projet. L'écran en dépend, jamais d'une implémentation :
 * données simulées aujourd'hui, microservices demain, sans qu'il change.
 */
export abstract class MechanicDashboardRepository {
  /** Gains du jour et historique récent. */
  abstract earnings(): Observable<EarningsSummary>;

  /**
   * Demande entrante à proposer, ou `null` s'il n'y en a aucune.
   *
   * Un `Observable` et non une promesse : le vrai service poussera les
   * demandes au fil de l'eau, et l'écran n'aura pas à changer de forme.
   */
  abstract incomingRequest(): Observable<NewRequest | null>;
}

/**
 * Lecture et modification de la disponibilité du mécanicien.
 *
 * Séparé du contrat de lecture ci-dessus : c'est le seul geste du tableau de
 * bord qui **écrit** côté serveur. Les réunir obligerait un futur écran en
 * lecture seule — un récapitulatif, un export — à hériter d'une méthode
 * d'écriture dont il n'a que faire (principe de ségrégation des interfaces).
 */
export abstract class MechanicAvailabilityRepository {
  abstract current(): Observable<Availability>;

  /** Renvoie la disponibilité telle que le serveur l'a enregistrée. */
  abstract update(isOnline: boolean): Observable<Availability>;
}

/** Envoi de la décision du mécanicien sur une demande entrante. */
export abstract class RequestDecisionRepository {
  abstract decide(requestId: string, decision: RequestDecision): Observable<void>;
}
