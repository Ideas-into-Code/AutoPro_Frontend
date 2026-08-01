import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button, Icon } from '@shared/ui';

/**
 * Écran de remplacement d'un domaine encore vide.
 *
 *   { path: '', component: ComingSoon, data: { fonctionnalite: 'La carte interactive' } }
 *
 * Un tableau de routes vide ne fait rien afficher : l'utilisateur qui clique
 * « Carte » se retrouvait devant une zone blanche, sans savoir si l'application
 * avait planté ou si la page n'existait pas encore. Cet écran répond à la
 * question.
 *
 * Le libellé arrive par les données de route, liées à l'entrée grâce à
 * `withComponentInputBinding()` : un seul composant sert donc tous les domaines
 * en attente, sans en dupliquer un par feature.
 */
@Component({
  selector: 'app-coming-soon',
  imports: [RouterLink, Button, Icon],
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-coming-soon',
  },
})
export class ComingSoon {
  /** Nom de la fonctionnalité attendue, fourni par `data` sur la route. */
  readonly fonctionnalite = input('Cette fonctionnalité');
}
