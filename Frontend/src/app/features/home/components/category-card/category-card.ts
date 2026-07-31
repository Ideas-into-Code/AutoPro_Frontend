import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

import { ServiceCategory } from '@core';
import { Card, Icon, IconName } from '@shared/ui';

/**
 * Pictogramme retenu pour chaque catégorie.
 *
 * Cette correspondance vit dans l'interface, et non dans `ServiceCategory` :
 * choisir une icône est une décision de présentation. Le serveur n'a pas à
 * connaître le jeu de pictogrammes du frontend, et une refonte graphique ne
 * doit pas exiger une migration de données.
 */
const PICTOGRAMMES: Readonly<Record<string, IconName>> = {
  batterie: 'batterie',
  pneu: 'pneu',
  'panne-moteur': 'cle',
  freinage: 'freinage',
  remorquage: 'remorquage',
  climatisation: 'climatisation',
  electricite: 'electricite',
};

/**
 * Repli pour une catégorie ajoutée côté serveur après cette version du
 * frontend : elle s'affiche avec une icône générique plutôt qu'avec un trou.
 */
const PICTOGRAMME_PAR_DEFAUT: IconName = 'cle';

/**
 * Carte d'une catégorie de service sur l'accueil.
 *
 *   <app-category-card
 *     [category]="categorie"
 *     link="/mecaniciens"
 *     [linkParams]="{ categorie: categorie.slug }"
 *   />
 *
 * La carte **ne décide pas** où elle mène : la destination lui est donnée. Le
 * jour où les catégories ouvriront sur un autre écran, seul l'appelant change.
 * C'est la même règle que pour `Button`, qui ignore ce que fait son clic.
 *
 * Toute la carte est un lien, pas seulement son intitulé : sur mobile, viser
 * un mot de trois lettres au pouce est pénible, et la cible utile est ici la
 * surface entière.
 */
@Component({
  selector: 'app-category-card',
  imports: [RouterLink, Card, Icon],
  templateUrl: './category-card.html',
  styleUrl: './category-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-category-card',
  },
})
export class CategoryCard {
  readonly category = input.required<ServiceCategory>();

  /** Destination du lien, sous la forme attendue par `routerLink`. */
  readonly link = input.required<string | unknown[]>();

  readonly linkParams = input<Params | null>(null);

  protected readonly iconName = computed<IconName>(
    () => PICTOGRAMMES[this.category().slug] ?? PICTOGRAMME_PAR_DEFAUT,
  );
}
