import { Observable } from 'rxjs';

import {
  AccountStatus,
  ApprovalDecision,
  ManagedAccount,
  PendingMechanic,
  SystemMetric,
} from '../models/admin-dashboard.model';

/**
 * Dépôts du back-office.
 *
 * Quatre contrats et non un seul : les trois blocs de l'écran interrogent des
 * services différents, et surtout **deux d'entre eux écrivent**. Réunir le tout
 * obligerait un futur écran en lecture seule — un export, un récapitulatif
 * mensuel — à hériter de méthodes de modération dont il n'a que faire
 * (ségrégation des interfaces).
 *
 * Chaque dépôt est une classe abstraite, donc contrat **et** jeton d'injection
 * à la fois, comme partout ailleurs dans le projet.
 */

/** Indicateurs affichés en tête du tableau de bord. */
export abstract class SystemOverviewRepository {
  abstract metrics(): Observable<readonly SystemMetric[]>;
}

/** Lecture de l'annuaire des comptes. */
export abstract class AccountDirectoryRepository {
  abstract accounts(): Observable<readonly ManagedAccount[]>;
}

/**
 * Modération d'un compte : suspension, réactivation.
 *
 * Renvoie le compte tel que le serveur l'a enregistré, et non `void` : c'est
 * lui qui fait autorité sur le statut final, l'écran se contente de l'afficher.
 */
export abstract class AccountModerationRepository {
  abstract setStatus(accountId: string, status: AccountStatus): Observable<ManagedAccount>;
}

/** Candidatures de mécaniciens en attente, et décision de l'administrateur. */
export abstract class MechanicApprovalRepository {
  abstract pending(): Observable<readonly PendingMechanic[]>;

  abstract decide(mechanicId: string, decision: ApprovalDecision): Observable<void>;
}
