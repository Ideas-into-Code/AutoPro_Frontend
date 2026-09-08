import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { Button, Spinner } from '@shared/ui';
import { ManagedAccount, PendingMechanic, SystemMetric } from '../../models/admin-dashboard.model';
import {
  AccountDirectoryRepository,
  AccountModerationRepository,
  MechanicApprovalRepository,
  SystemOverviewRepository,
} from '../../data/admin-dashboard.repository';
import { AccountsTable, AccountModeration } from '../../components/accounts-table/accounts-table';
import { ApprovalQueue, ApprovalReview } from '../../components/approval-queue/approval-queue';
import { MetricCard } from '../../components/metric-card/metric-card';

/**
 * Tableau de bord de l'administrateur.
 *
 * Les trois blocs du ticket #17, et rien d'autre : les cartes de vue
 * d'ensemble, la table de gestion des comptes et la file de validation des
 * mécaniciens.
 *
 * Écran d'**agrégation** : il réunit des informations venues de plusieurs
 * microservices et n'appartient donc à aucun d'eux. Il n'importe aucune autre
 * feature — seulement `shared` et ses propres composants.
 *
 * Il ne connaît que des classes abstraites. Le jour où les microservices
 * répondent, quatre lignes changent dans `admin.routes.ts`, et pas une ici.
 */
@Component({
  selector: 'app-admin-dashboard',
  imports: [Button, Spinner, MetricCard, AccountsTable, ApprovalQueue],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage {
  private readonly overview = inject(SystemOverviewRepository);
  private readonly directory = inject(AccountDirectoryRepository);
  private readonly moderation = inject(AccountModerationRepository);
  private readonly approvals = inject(MechanicApprovalRepository);

  // --- Tâche 1 : vue d'ensemble ---------------------------------------------

  // Le paramètre générique est explicite : sans lui, le tableau vide de
  // `defaultValue` serait inféré comme `never[]` et refusé face au flux.
  protected readonly metricsResource = rxResource<readonly SystemMetric[], unknown>({
    stream: () => this.overview.metrics(),
    defaultValue: [],
  });

  protected readonly metricsFailed = computed(() => this.metricsResource.error() !== undefined);

  // --- Tâche 2 : comptes ----------------------------------------------------

  protected readonly accountsResource = rxResource<readonly ManagedAccount[], unknown>({
    stream: () => this.directory.accounts(),
    defaultValue: [],
  });

  protected readonly accountsFailed = computed(() => this.accountsResource.error() !== undefined);

  /** Compte dont le changement de statut est en cours d'envoi, s'il y en a un. */
  protected readonly compteEnCours = signal<string | null>(null);

  // --- Tâche 3 : validations ------------------------------------------------

  protected readonly approvalsResource = rxResource<readonly PendingMechanic[], unknown>({
    stream: () => this.approvals.pending(),
    defaultValue: [],
  });

  protected readonly approvalsFailed = computed(() => this.approvalsResource.error() !== undefined);

  /** Dossier dont la décision est en cours d'envoi, s'il y en a un. */
  protected readonly dossierEnCours = signal<string | null>(null);

  /**
   * Message d'échec commun aux deux gestes d'écriture.
   *
   * Un seul, et non un par bloc : l'administrateur n'agit que sur une ligne à
   * la fois, et deux bandeaux d'erreur simultanés ne diraient rien de plus.
   */
  protected readonly actionError = signal<string | null>(null);

  // --- Actions --------------------------------------------------------------

  protected changerStatut({ accountId, status }: AccountModeration): void {
    this.compteEnCours.set(accountId);
    this.actionError.set(null);

    this.moderation.setStatus(accountId, status).subscribe({
      next: () => {
        this.compteEnCours.set(null);
        // On relit plutôt que de modifier la liste sur place : le serveur fait
        // autorité sur le statut enregistré, et lui seul sait ce qu'il a retenu.
        this.accountsResource.reload();
        // Les indicateurs comptent les comptes actifs : une suspension les périme.
        this.metricsResource.reload();
      },
      error: () => {
        this.compteEnCours.set(null);
        this.actionError.set(
          "Le statut du compte n'a pas pu être modifié. Vérifiez votre connexion.",
        );
      },
    });
  }

  protected trancher({ mechanicId, decision }: ApprovalReview): void {
    this.dossierEnCours.set(mechanicId);
    this.actionError.set(null);

    this.approvals.decide(mechanicId, decision).subscribe({
      next: () => {
        this.dossierEnCours.set(null);
        this.approvalsResource.reload();
        // La table est relue aussi : une validation fait passer le compte du
        // mécanicien à « actif », et les deux blocs doivent dire la même chose.
        this.accountsResource.reload();
        // Et les indicateurs : « validés » et « en attente » viennent de bouger.
        this.metricsResource.reload();
      },
      error: () => {
        // Le dossier reste dans la file : il n'est pas perdu, et
        // l'administrateur peut réessayer.
        this.dossierEnCours.set(null);
        this.actionError.set("La décision n'a pas pu être enregistrée. Réessayez.");
      },
    });
  }

  protected rechargerIndicateurs(): void {
    this.metricsResource.reload();
  }

  protected rechargerComptes(): void {
    this.accountsResource.reload();
  }

  protected rechargerValidations(): void {
    this.approvalsResource.reload();
  }
}
