import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Spinner } from '@shared/ui';
import {
  MECHANIC_REQUEST_STATUS_LABELS,
  MechanicRequest,
  MechanicRequestStatus,
} from '../../models/mechanic-request.model';
import { MechanicRequestRepository } from '../../data/mechanic-request.repository';

/**
 * « Demandes reçues » du mécanicien : nouvelles demandes à proximité et
 * interventions en cours, avec le point d'entrée vers chaque action.
 */
@Component({
  selector: 'app-mechanic-requests',
  imports: [RouterLink, DecimalPipe, Spinner],
  templateUrl: './mechanic-requests.html',
  styleUrl: './mechanic-requests.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MechanicRequestsPage {
  private readonly repo = inject(MechanicRequestRepository);

  protected readonly demandes = rxResource<readonly MechanicRequest[], unknown>({
    stream: () => this.repo.list(),
    defaultValue: [],
  });

  protected readonly STATUS_LABELS = MECHANIC_REQUEST_STATUS_LABELS;

  protected readonly nouvelles = computed(() =>
    this.demandes.value().filter((d) => d.status === 'en_attente'),
  );
  protected readonly enCours = computed(() =>
    this.demandes
      .value()
      .filter((d) => d.assignedToMe && (d.status === 'acceptee' || d.status === 'en_cours')),
  );
  protected readonly terminees = computed(() =>
    this.demandes.value().filter((d) => d.assignedToMe && d.status === 'terminee'),
  );

  protected classe(status: MechanicRequestStatus): string {
    return `ap-mr-status ap-mr-status--${status}`;
  }
}
