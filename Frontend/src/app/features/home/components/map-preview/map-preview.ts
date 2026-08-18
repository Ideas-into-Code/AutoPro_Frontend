import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Aperçu cliquable de la carte, sur l'accueil.
 *
 *   <app-map-preview [mechanicCount]="3" />
 *
 * Ne charge aucune carte : c'est une vignette qui mène à l'écran de
 * géolocalisation. Afficher une vraie carte ici coûterait le poids de la
 * bibliothèque cartographique à tout visiteur de l'accueil, y compris à
 * celui qui n'y va jamais.
 */
@Component({
  selector: 'app-map-preview',
  imports: [RouterLink],
  templateUrl: './map-preview.html',
  styleUrl: './map-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPreview {
  /** Nombre de mécaniciens annoncé sur la vignette. */
  readonly mechanicCount = input.required<number>();
}
