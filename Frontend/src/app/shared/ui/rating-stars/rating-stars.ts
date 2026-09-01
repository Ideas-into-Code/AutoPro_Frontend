import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

/** Compteur de module : garantit un nom de groupe unique par notation affichée. */
let prochainId = 0;

export type RatingSize = 'sm' | 'md' | 'lg';

/**
 * Notation par étoiles, en saisie ou en lecture seule.
 *
 *   <app-rating-stars [value]="note()" [labels]="LIBELLES" (valueChange)="noter($event)" />
 *   <app-rating-stars [value]="4.7" readOnly size="sm" />
 *
 * Dans `shared/ui` et non dans la feature « avis » : le profil d'un mécanicien
 * et la liste des mécaniciens devront afficher une moyenne, et une feature n'a
 * pas le droit d'en importer une autre (CONVENTIONS.md §1).
 *
 * En saisie, repose sur de **vrais boutons radio**, masqués sous les étoiles.
 * Le groupe se parcourt alors aux flèches, s'annonce « 4 sur 5 » et n'accepte
 * qu'une valeur — trois comportements qu'une rangée de `<span>` cliquables
 * obligerait à réécrire, et qu'on oublierait.
 *
 * En lecture seule, aucun contrôle de formulaire n'est rendu : une note qu'on
 * ne peut pas changer n'a rien à faire dans l'ordre de tabulation. Elle est
 * alors annoncée en toutes lettres, une rangée d'étoiles pleines et vides ne
 * disant rien à qui ne les voit pas.
 */
@Component({
  selector: 'app-rating-stars',
  templateUrl: './rating-stars.html',
  styleUrl: './rating-stars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-rating',
    '[class.ap-rating--sm]': 'size() === "sm"',
    '[class.ap-rating--md]': 'size() === "md"',
    '[class.ap-rating--lg]': 'size() === "lg"',
  },
})
export class RatingStars {
  /** Note affichée. `0` signifie « pas encore noté ». */
  readonly value = input(0);

  readonly max = input(5);

  readonly readOnly = input(false, { transform: booleanAttribute });

  readonly size = input<RatingSize>('md');

  /**
   * Libellé de chaque échelon, du plus bas au plus haut.
   *
   * Passés en entrée et non écrits ici : « Passable » convient à un service
   * rendu, pas à la note d'un article ou d'un trajet. Un composant partagé ne
   * porte aucun libellé propre à un écran.
   */
  readonly labels = input<readonly string[]>([]);

  /** Intitulé du groupe, annoncé aux lecteurs d'écran. */
  readonly legend = input('Votre note');

  readonly valueChange = output<number>();

  protected readonly groupe = `ap-rating-${prochainId++}`;

  /** Échelons à rendre : [1, 2, … max]. */
  protected readonly echelons = computed(() =>
    Array.from({ length: this.max() }, (_, index) => index + 1),
  );

  /**
   * Part remplie de chaque étoile, en pourcentage.
   *
   * Une moyenne de 4,7 doit se voir : la cinquième étoile est remplie aux sept
   * dixièmes. Arrondir à l'entier ferait afficher la même chose pour 4,5 et
   * pour 5, ce qui est précisément la nuance qu'une moyenne apporte.
   */
  protected remplissage(echelon: number): number {
    const ecart = this.value() - echelon + 1;
    const part = Math.min(1, Math.max(0, ecart));

    // Arrondi au dixième de pourcent : sans lui, 4,7 produit une largeur de
    // « 70.00000000000001% » dans le style de l'élément — exact, mais
    // impossible à comparer et disgracieux à l'inspection.
    return Math.round(part * 1000) / 10;
  }

  /** Libellé de l'échelon courant, s'il en existe un. */
  protected readonly libelleCourant = computed(() => this.labels()[this.value() - 1] ?? '');

  protected readonly annonce = computed(() => {
    const note = this.value();

    if (note === 0) {
      return 'Pas encore noté';
    }

    return `${note.toLocaleString('fr-FR')} sur ${this.max()}`;
  });

  protected noter(echelon: number): void {
    this.valueChange.emit(echelon);
  }
}
