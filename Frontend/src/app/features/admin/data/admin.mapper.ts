import {
  AccountRole,
  AccountStatus,
  ManagedAccount,
  PendingMechanic,
  SystemMetric,
} from '../models/admin-dashboard.model';

/**
 * Traductions entre les DTO du back-office (`/api/admin/**`) et les types
 * condensés de l'écran.
 *
 * Le backend expose trois vues séparées — statistiques, utilisateurs,
 * mécaniciens — là où la page n'en connaît que des indicateurs, des comptes et
 * des dossiers. Le rapprochement se fait ici, une fois, plutôt que dans le
 * dépôt : fonctions pures, testables sans injection.
 */

// --- DTO backend ------------------------------------------------------------

export interface AdminStatsDTO {
  readonly totalUsers: number;
  readonly totalMechanics: number;
  readonly pendingMechanics: number;
  readonly approvedMechanics: number;
  readonly rejectedMechanics: number;
  readonly activeUsers: number;
  readonly inactiveUsers: number;
}

export interface UserDetailDTO {
  readonly id: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly isActive: boolean;
  readonly role: string;
  readonly createdAt: string;
}

export interface MechanicDetailDTO {
  readonly id: number;
  readonly userId: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly specialization: string | null;
  readonly experienceYears: number | null;
  readonly bio: string | null;
  readonly isAvailable: boolean;
  readonly validationStatus: string;
  readonly createdAt: string;
}

// --- Indicateurs -----------------------------------------------------------

/**
 * Trois cartes tirées des compteurs système.
 *
 * `trendPercent` reste à `0` / `stable` : le backend ne renvoie pas d'historique,
 * et une évolution inventée tromperait l'administrateur. Le champ est conservé
 * pour le jour où l'API fournira une comparaison de période.
 */
export function toMetrics(dto: AdminStatsDTO): SystemMetric[] {
  return [
    {
      id: 'utilisateurs',
      label: 'Utilisateurs inscrits',
      value: dto.totalUsers,
      icon: 'groupes',
      trendPercent: 0,
      direction: 'stable',
    },
    {
      id: 'mecaniciens-actifs',
      label: 'Mécaniciens validés',
      value: dto.approvedMechanics,
      icon: 'cle',
      trendPercent: 0,
      direction: 'stable',
    },
    {
      id: 'mecaniciens-attente',
      label: 'Dossiers en attente',
      value: dto.pendingMechanics,
      icon: 'liste',
      trendPercent: 0,
      direction: 'stable',
    },
  ];
}

// --- Comptes -------------------------------------------------------------

function roleFromBackend(role: string): AccountRole | null {
  if (role === 'ROLE_CLIENT') {
    return 'client';
  }
  if (role === 'ROLE_MECHANIC') {
    return 'mecanicien';
  }
  // ROLE_ADMIN et tout rôle inconnu : hors du périmètre de la table.
  return null;
}

/**
 * Fusionne la liste des utilisateurs et celle des mécaniciens en lignes de
 * table. Le statut d'un mécanicien dépend à la fois de son compte
 * (`isActive`) et de la validation de son dossier — d'où le besoin des deux
 * listes.
 */
export function toManagedAccounts(
  users: readonly UserDetailDTO[],
  mechanics: readonly MechanicDetailDTO[],
): ManagedAccount[] {
  const validationByUserId = new Map<number, string>(
    mechanics.map((m) => [m.userId, m.validationStatus]),
  );

  const comptes: ManagedAccount[] = [];

  for (const user of users) {
    const role = roleFromBackend(user.role);
    if (role === null) {
      continue;
    }

    let status: AccountStatus;
    if (!user.isActive) {
      status = 'suspendu';
    } else if (role === 'mecanicien') {
      const validation = validationByUserId.get(user.id);
      status = validation === 'PENDING' ? 'en_attente' : validation === 'REJECTED' ? 'suspendu' : 'actif';
    } else {
      status = 'actif';
    }

    comptes.push({
      id: String(user.id),
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role,
      status,
      // Le backend ne stocke pas la ville : champ laissé vide, l'écran affiche un tiret.
      city: '',
      registeredAt: user.createdAt,
    });
  }

  return comptes;
}

/** Compte renvoyé par le backend après un changement de statut. */
export function toManagedAccount(dto: UserDetailDTO): ManagedAccount {
  const role = roleFromBackend(dto.role) ?? 'client';
  return {
    id: String(dto.id),
    fullName: `${dto.firstName} ${dto.lastName}`.trim(),
    email: dto.email,
    role,
    status: dto.isActive ? 'actif' : 'suspendu',
    city: '',
    registeredAt: dto.createdAt,
  };
}

// --- Dossiers en attente -------------------------------------------------

/**
 * `id` porte l'identifiant du **mécanicien**, pas celui de son compte : c'est
 * lui qu'attend `PATCH /api/admin/mechanics/{id}/validate`.
 */
export function toPendingMechanic(dto: MechanicDetailDTO): PendingMechanic {
  return {
    id: String(dto.id),
    fullName: `${dto.firstName} ${dto.lastName}`.trim(),
    specialty: dto.specialization?.trim() || 'Spécialité non précisée',
    city: '',
    submittedAt: dto.createdAt,
  };
}
