import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NearbyMechanic } from '../../models/home-cards.model';

/**
 * Bandeau défilant des mécaniciens proches, sur l'accueil.
 *
 *   <app-nearby-mechanics [mechanics]="mecaniciensProches" />
 *
 * Extrait de la page d'accueil, qui rassemblait quatre sections dans un seul
 * gabarit de 206 lignes et une feuille de style de 709 lignes — au-delà du
 * budget de 8 ko fixé dans `angular.json`, ce qui faisait **échouer la
 * compilation de production**. Chaque section emporte désormais son style.
 *
 * Purement présentationnel : il reçoit une liste et l'affiche. Il ne va la
 * chercher nulle part, ce qui le rend indifférent à l'origine des données —
 * données simulées aujourd'hui, microservice demain.
 */
@Component({
  selector: 'app-nearby-mechanics',
  imports: [RouterLink],
  templateUrl: './nearby-mechanics.html',
  styleUrl: './nearby-mechanics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NearbyMechanics {
  readonly mechanics = input.required<readonly NearbyMechanic[]>();
}
