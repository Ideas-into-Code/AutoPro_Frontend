import { IconName } from '@shared/ui';

/**
 * Types du back-office d'administration.
 *
 * Comme les autres tableaux de bord du projet, cet écran **agrège** : il réunit
 * des comptes, des candidatures et des indicateurs qui relèvent de plusieurs
 * microservices. Il déclare donc ses propres types condensés plutôt que
 * d'importer ceux de `mechanics` ou de `requests` — une feature n'en importe
 * jamais une autre (CONVENTIONS.md §1).
 */

/** Sens d'évolution d'un indicateur, du point de vue de l'administrateur. */
export type MetricDirection = 'hausse' | 'baisse' | 'stable';

/**
 * Une carte de vue d'ensemble.
 *
 * La **valeur reste un nombre**, et l'unité un champ à part : c'est l'écran qui
 * met en forme, pas le serveur. Recevoir « 14 284 » déjà formaté interdirait
 * de changer de séparateur, de langue ou d'abréviation sans redéployer le
 * backend, et empêcherait tout calcul côté client.
 */
export interface SystemMetric {
  readonly id: string;

  /** Intitulé affiché sous la valeur (« Utilisateurs inscrits »). */
  readonly label: string;

  readonly value: number;

  /** Unité éventuelle, accolée à la valeur (« FCFA »). */
  readonly unit?: string;

  readonly icon: IconName;

  /** Évolution sur la période, en pourcentage. `0` avec `direction: 'stable'`. */
  readonly trendPercent: number;

  readonly direction: MetricDirection;
}

/** Nature d'un compte inscrit sur la plateforme. */
export type AccountRole = 'client' | 'mecanicien';

/**
 * État d'un compte.
 *
 * `en_attente` désigne un mécanicien dont le dossier n'est pas encore validé :
 * c'est le même individu que dans la file de validation, vu depuis la table.
 */
export type AccountStatus = 'actif' | 'suspendu' | 'en_attente';

/** Une ligne de la table de gestion. */
export interface ManagedAccount {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly role: AccountRole;
  readonly status: AccountStatus;
  readonly city: string;

  /** Date d'inscription au format ISO, mise en forme par l'écran. */
  readonly registeredAt: string;
}

/** Filtre appliqué à la table. `tous` n'écarte rien. */
export type AccountFilter = AccountRole | 'tous';

/** Un mécanicien dont le dossier attend une décision. */
export interface PendingMechanic {
  readonly id: string;
  readonly fullName: string;

  /** Spécialité déclarée (« BMW et Audi », « Systèmes hybrides »). */
  readonly specialty: string;

  readonly city: string;

  /** Date de dépôt du dossier, au format ISO. */
  readonly submittedAt: string;
}

/** Suite donnée par l'administrateur à une candidature. */
export type ApprovalDecision = 'validee' | 'rejetee';

/**
 * Statut appliqué à un compte lorsqu'une candidature est tranchée.
 *
 * Déduit ici plutôt que dans chaque appelant : la table et la file affichent
 * la même vérité, et cette correspondance est la règle qui les relie.
 */
export function statusFromDecision(decision: ApprovalDecision): AccountStatus {
  return decision === 'validee' ? 'actif' : 'suspendu';
}
