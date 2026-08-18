import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Pictogrammes disponibles. La liste est fermée volontairement : un nom
 * inconnu devient une erreur de compilation plutôt qu'un carré vide à l'écran.
 */
export type IconName =
  | 'recherche'
  | 'sos'
  | 'batterie'
  | 'pneu'
  | 'freinage'
  | 'remorquage'
  | 'climatisation'
  | 'electricite'
  | 'cle'
  | 'position'
  | 'fleche-droite'
  | 'croix'
  | 'cloche'
  | 'tendance'
  | 'valide'
  | 'annule'
  | 'accueil'
  | 'carte'
  | 'profil'
  | 'voiture';

export type IconSize = 'sm' | 'md' | 'lg';

/**
 * Pictogramme vectoriel du design system.
 *
 *   <app-icon name="recherche" />                        décoratif
 *   <app-icon name="sos" label="Urgence" size="lg" />     porteur de sens
 *
 * Les tracés sont **inclus dans le bundle**, pas chargés depuis une fonte
 * distante. C'est la même raison qui a fait retenir une pile de polices système
 * dans `_tokens.scss` : une fonte d'icônes coûte 50 à 200 ko au premier rendu,
 * indéfendable sur la 3G instable visée par le cahier des charges. Elle
 * afficherait de surcroît des carrés vides tant qu'elle n'est pas arrivée.
 *
 * Un pictogramme est **décoratif par défaut** : il est masqué aux lecteurs
 * d'écran, car il double presque toujours un texte voisin. Renseigner `label`
 * n'a de sens que lorsque l'icône porte seule l'information.
 */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-icon',
    '[class.ap-icon--sm]': 'size() === "sm"',
    '[class.ap-icon--md]': 'size() === "md"',
    '[class.ap-icon--lg]': 'size() === "lg"',
  },
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize>('md');

  /** Laissé vide, le pictogramme est décoratif et masqué aux lecteurs d'écran. */
  readonly label = input('');

  protected readonly isDecorative = computed(() => this.label() === '');
}
