import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RecentRequest } from '../../models/home-cards.model';

/**
 * Liste des dernières demandes de l'utilisateur, sur l'accueil.
 *
 *   <app-recent-requests [requests]="demandesRecentes" />
 *
 * Extrait de la page d'accueil pour la même raison que `NearbyMechanics` :
 * la feuille de style de la page dépassait le budget et cassait la
 * compilation de production. Il ne fait qu'afficher ce qu'on lui donne.
 */
@Component({
  selector: 'app-recent-requests',
  imports: [RouterLink],
  templateUrl: './recent-requests.html',
  styleUrl: './recent-requests.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentRequests {
  readonly requests = input.required<readonly RecentRequest[]>();
}
