import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Icon, IconName } from '../../ui/icon/icon';

/** Une entrée de la barre de navigation basse. */
export interface BottomNavItem {
  readonly label: string;
  readonly icon: IconName;

  /** Destination, sous la forme attendue par `routerLink`. */
  readonly link: string | readonly unknown[];

  /**
   * Ne marque l'entrée active que sur une correspondance exacte.
   * Utile pour une racine (`/mecanicien`) qui préfixe toutes les autres.
   */
  readonly exact?: boolean;
}

/**
 * Barre de navigation basse, affichée sur mobile.
 *
 *   <app-bottom-nav [items]="entrees" ariaLabel="Navigation mécanicien" />
 *
 * Extraite de la coquille client, où elle était écrite en dur : ses styles y
 * étaient encapsulés, donc inutilisables ailleurs. L'espace mécanicien ne
 * pouvait pas la réutiliser sans recopier cent cinquante lignes de SCSS.
 *
 * Les entrées arrivent en **données** plutôt qu'en contenu projeté : les
 * styles des éléments vivent dans ce composant, et l'encapsulation d'Angular
 * les empêcherait de s'appliquer à des liens fournis de l'extérieur.
 *
 * Comme `Header` et `Footer`, elle ne connaît aucune route : chaque coquille
 * lui donne les siennes.
 */
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNav {
  readonly items = input.required<readonly BottomNavItem[]>();

  readonly ariaLabel = input('Navigation principale');
}
