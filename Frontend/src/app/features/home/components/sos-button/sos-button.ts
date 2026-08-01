import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

import { Button } from '@shared/ui';

/**
 * Appel à l'aide en urgence, mis en avant sur l'accueil.
 *
 *   <app-sos-button link="/demandes/signaler" [linkParams]="{ urgence: 'true' }" />
 *
 * Rendu comme un **lien** et non comme un bouton : le geste conduit à un autre
 * écran. Un `<button>` casserait l'ouverture dans un nouvel onglet et ferait
 * annoncer « bouton » par les lecteurs d'écran là où l'utilisateur change de
 * page. `Button` s'applique donc ici par attribut sur une balise `<a>`, ce que
 * son sélecteur prévoit explicitement.
 *
 * Comme la carte de catégorie, il ignore sa destination : elle lui est fournie.
 */
@Component({
  selector: 'app-sos-button',
  imports: [RouterLink, Button],
  templateUrl: './sos-button.html',
  styleUrl: './sos-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-sos-button',
  },
})
export class SosButton {
  readonly link = input.required<string | unknown[]>();

  readonly linkParams = input<Params | null>(null);
}
