import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Avatar, Button, Icon } from '@shared/ui';
import { ApprovalDecision, PendingMechanic } from '../../models/admin-dashboard.model';

/** Décision rendue sur une candidature. */
export interface ApprovalReview {
  readonly mechanicId: string;
  readonly decision: ApprovalDecision;
}

const DATE_COURTE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
});

/**
 * File des mécaniciens en attente de validation.
 *
 *   <app-approval-queue
 *     [applications]="candidatures()"
 *     [savingId]="dossierEnCours()"
 *     (decided)="trancher($event)"
 *   />
 *
 * Ne tranche rien : elle émet la décision de l'administrateur, et la page
 * appelle le dépôt. Un composant qui appellerait lui-même le serveur ne
 * pourrait plus être affiché ailleurs sans traîner cette dépendance.
 *
 * Les deux boutons portent des libellés explicites plutôt que deux
 * pictogrammes : « ✓ » et « ✗ » se ressemblent au coup d'œil, et la décision
 * est irréversible pour le mécanicien qui attend son inscription.
 */
@Component({
  selector: 'app-approval-queue',
  imports: [Avatar, Button, Icon],
  templateUrl: './approval-queue.html',
  styleUrl: './approval-queue.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-queue',
  },
})
export class ApprovalQueue {
  readonly applications = input.required<readonly PendingMechanic[]>();

  /** Identifiant du dossier dont la décision part vers le serveur, s'il y en a un. */
  readonly savingId = input<string | null>(null);

  readonly decided = output<ApprovalReview>();

  protected readonly resume = computed(() => {
    const total = this.applications().length;

    if (total === 0) {
      return 'Aucun dossier en attente';
    }

    return total === 1 ? '1 dossier à examiner' : `${total} dossiers à examiner`;
  });

  protected dateCourte(iso: string): string {
    return DATE_COURTE.format(new Date(iso));
  }

  protected trancher(mechanicId: string, decision: ApprovalDecision): void {
    this.decided.emit({ mechanicId, decision });
  }
}
