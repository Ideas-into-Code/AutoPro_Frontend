import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { Avatar, Button, SearchBar } from '@shared/ui';
import {
  AccountFilter,
  AccountRole,
  AccountStatus,
  ManagedAccount,
} from '../../models/admin-dashboard.model';

/** Changement de statut demandé sur une ligne de la table. */
export interface AccountModeration {
  readonly accountId: string;
  readonly status: AccountStatus;
}

/** Onglet de filtrage, avec le rôle qu'il laisse passer. */
interface Onglet {
  readonly valeur: AccountFilter;
  readonly label: string;
}

const ONGLETS: readonly Onglet[] = [
  { valeur: 'tous', label: 'Tous' },
  { valeur: 'client', label: 'Clients' },
  { valeur: 'mecanicien', label: 'Mécaniciens' },
];

const LIBELLES_ROLE: Readonly<Record<AccountRole, string>> = {
  client: 'Client',
  mecanicien: 'Mécanicien',
};

const LIBELLES_STATUT: Readonly<Record<AccountStatus, string>> = {
  actif: 'Actif',
  suspendu: 'Suspendu',
  en_attente: 'En attente',
};

const DATE_COURTE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * Table de gestion des comptes — utilisateurs et mécaniciens réunis.
 *
 *   <app-accounts-table
 *     [accounts]="comptes()"
 *     [savingId]="compteEnCours()"
 *     (moderationRequested)="changerStatut($event)"
 *   />
 *
 * Le filtre et la recherche vivent **ici** : ils ne concernent que l'affichage
 * de la table et ne regardent ni le dépôt, ni l'écran. La modération, elle, est
 * seulement **émise** — c'est la page qui appelle le serveur et gère l'échec.
 * Le composant reste ainsi testable sans injection et réutilisable ailleurs.
 *
 * Un vrai `<table>` et non une grille de `<div>` : l'association d'une cellule
 * à son en-tête, la navigation cellule à cellule des lecteurs d'écran et
 * l'annonce du nombre de lignes sont alors acquises sans une ligne d'ARIA.
 */
@Component({
  selector: 'app-accounts-table',
  imports: [Avatar, Button, SearchBar],
  templateUrl: './accounts-table.html',
  styleUrl: './accounts-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-accounts',
  },
})
export class AccountsTable {
  readonly accounts = input.required<readonly ManagedAccount[]>();

  /** Identifiant de la ligne dont le statut part vers le serveur, s'il y en a une. */
  readonly savingId = input<string | null>(null);

  readonly moderationRequested = output<AccountModeration>();

  protected readonly onglets = ONGLETS;

  protected readonly filtre = signal<AccountFilter>('tous');
  protected readonly terme = signal('');

  /** Comptes retenus par le filtre de rôle **et** par la recherche. */
  protected readonly visibles = computed(() => {
    const filtre = this.filtre();
    const terme = this.terme().trim().toLowerCase();

    return this.accounts().filter((compte) => {
      const roleRetenu = filtre === 'tous' || compte.role === filtre;

      if (!roleRetenu) {
        return false;
      }

      if (terme === '') {
        return true;
      }

      // Nom, adresse et ville : les trois entrées par lesquelles un
      // administrateur cherche un compte dont il n'a pas l'identifiant.
      return (
        compte.fullName.toLowerCase().includes(terme) ||
        compte.email.toLowerCase().includes(terme) ||
        compte.city.toLowerCase().includes(terme)
      );
    });
  });

  /**
   * Décompte annoncé au-dessus de la table.
   *
   * Doublé d'une région `aria-live` dans le gabarit : un filtre qui ne change
   * que des lignes hors du champ de saisie ne serait autrement signalé par
   * rien à qui n'a pas la table sous les yeux.
   */
  protected readonly resume = computed(() => {
    const total = this.visibles().length;

    if (total === 0) {
      return 'Aucun compte ne correspond';
    }

    return total === 1 ? '1 compte affiché' : `${total} comptes affichés`;
  });

  protected libelleRole(role: AccountRole): string {
    return LIBELLES_ROLE[role];
  }

  protected libelleStatut(statut: AccountStatus): string {
    return LIBELLES_STATUT[statut];
  }

  protected dateCourte(iso: string): string {
    return DATE_COURTE.format(new Date(iso));
  }

  protected changerFiltre(valeur: AccountFilter): void {
    this.filtre.set(valeur);
  }

  protected rechercher(terme: string): void {
    this.terme.set(terme);
  }

  /**
   * Bascule le statut d'un compte.
   *
   * `en_attente` n'est pas traité ici : un dossier se tranche dans la file de
   * validation, où l'administrateur voit la spécialité et la pièce jointe. La
   * table le signale mais ne propose pas d'action — le gabarit masque donc le
   * bouton, et cette garde couvre le cas d'un appel malgré tout.
   */
  protected basculerStatut(compte: ManagedAccount): void {
    if (compte.status === 'en_attente') {
      return;
    }

    this.moderationRequested.emit({
      accountId: compte.id,
      status: compte.status === 'actif' ? 'suspendu' : 'actif',
    });
  }
}
