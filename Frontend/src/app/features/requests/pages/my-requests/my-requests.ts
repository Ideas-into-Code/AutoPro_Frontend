import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Spinner } from '@shared/ui';
import { PROBLEM_TYPE_LABELS } from '../../models/request-draft.model';
import { InterventionRequest, REQUEST_STATUS_LABELS, RequestStatus } from '../../models/request.model';
import { RequestRepository } from '../../data/request.repository';

/**
 * « Mes demandes » : la liste réelle des demandes d'intervention du client,
 * la plus récente d'abord. Remplace l'ancienne page « bientôt disponible ».
 */
@Component({
  selector: 'app-my-requests',
  imports: [RouterLink, DecimalPipe, Spinner],
  templateUrl: './my-requests.html',
  styleUrl: './my-requests.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRequestsPage {
  private readonly requests = inject(RequestRepository);

  protected readonly demandes = rxResource<readonly InterventionRequest[], unknown>({
    stream: () => this.requests.list(),
    defaultValue: [],
  });

  protected readonly PROBLEM_LABELS = PROBLEM_TYPE_LABELS;
  protected readonly STATUS_LABELS = REQUEST_STATUS_LABELS;

  protected classeStatut(status: RequestStatus): string {
    return `ap-req-status ap-req-status--${status}`;
  }
}
