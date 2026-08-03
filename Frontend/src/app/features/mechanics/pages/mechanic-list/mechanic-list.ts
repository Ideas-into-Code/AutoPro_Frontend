import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { ServiceCategoryRepository, emptyPage } from '@core';
import { Button, Icon, SearchBar, Spinner } from '@shared/ui';
import { Mechanic } from '../../models/mechanic.model';
import { MechanicRepository } from '../../data/mechanic.repository';

/** Adresse de cet écran, utilisée pour se rappeler soi-même avec de nouveaux filtres. */
const ECRAN_MECANICIENS = '/mecaniciens';

/**
 * Ramène un paramètre d'URL absent à la chaîne vide.
 *
 * `withComponentInputBinding()` **écrit `undefined`** dans l'entrée quand le
 * paramètre ne figure pas dans l'URL : la valeur par défaut d'`input()` ne joue
 * qu'avant la première liaison et ne protège donc de rien. Sans cette
 * normalisation, `/mecaniciens` sans filtre s'intitulait
 * « Résultats pour « undefined » ».
 */
function versChaine(valeur: string | undefined): string {
  return valeur ?? '';
}

/**
 * Liste des mécaniciens, filtrée par catégorie et par terme de recherche.
 *
 * C'est la destination des cartes de l'accueil : sans elle, « navigation vers
 * les catégories » se terminerait sur une page introuvable.
 *
 * Les deux critères arrivent par l'URL (`?categorie=freinage&recherche=dakar`)
 * et non par un service d'état partagé. Une recherche est ainsi partageable,
 * ajoutable aux favoris, et le bouton « précédent » du navigateur la restitue
 * telle quelle — trois comportements qu'un état en mémoire ferait perdre.
 *
 * `withComponentInputBinding()` étant actif, les paramètres d'URL alimentent
 * directement ces entrées : pas besoin d'injecter `ActivatedRoute`.
 */
@Component({
  selector: 'app-mechanic-list',
  imports: [RouterLink, Button, Icon, SearchBar, Spinner],
  templateUrl: './mechanic-list.html',
  styleUrl: './mechanic-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MechanicListPage {
  private readonly router = inject(Router);
  private readonly mechanics = inject(MechanicRepository);
  private readonly categories = inject(ServiceCategoryRepository);

  /** `slug` de catégorie, issu du paramètre d'URL `categorie`. */
  readonly categorie = input('', { transform: versChaine });

  /** Terme libre, issu du paramètre d'URL `recherche`. */
  readonly recherche = input('', { transform: versChaine });

  protected readonly mecaniciensResource = rxResource({
    params: () => ({ categorySlug: this.categorie(), search: this.recherche() }),
    stream: ({ params }) =>
      this.mechanics.search({
        categorySlug: params.categorySlug === '' ? undefined : params.categorySlug,
        search: params.search === '' ? undefined : params.search,
      }),
    defaultValue: emptyPage<Mechanic>(),
  });

  /**
   * Intitulé de la catégorie filtrée. Chargé séparément parce qu'il ne dépend
   * que du `slug` : inutile de le redemander à chaque frappe dans la recherche.
   */
  protected readonly categorieResource = rxResource({
    params: () => this.categorie(),
    stream: ({ params }) => (params === '' ? of(null) : this.categories.findBySlug(params)),
    defaultValue: null,
  });

  protected readonly mecaniciens = computed(() => this.mecaniciensResource.value().items);

  protected readonly total = computed(() => this.mecaniciensResource.value().totalItems);

  protected readonly hasFailed = computed(() => this.mecaniciensResource.error() !== undefined);

  protected readonly isFiltered = computed(
    () => this.categorie() !== '' || this.recherche() !== '',
  );

  protected readonly titre = computed(() => {
    const categorie = this.categorieResource.value();

    if (categorie !== null) {
      return categorie.label;
    }

    return this.recherche() === ''
      ? 'Tous les mécaniciens'
      : `Résultats pour « ${this.recherche()} »`;
  });

  /**
   * Relance la recherche en conservant la catégorie en cours : affiner par
   * mot-clé n'annule pas le filtre déjà posé depuis l'accueil.
   *
   * La destination est écrite en toutes lettres. Un `navigate([])` se résout
   * depuis la **racine** faute de `relativeTo`, et non depuis la page courante :
   * chercher depuis cet écran renvoyait à `/`, donc à l'onboarding.
   */
  protected rechercher(terme: string): void {
    void this.router.navigate([ECRAN_MECANICIENS], {
      queryParams: {
        categorie: this.categorie() === '' ? null : this.categorie(),
        recherche: terme === '' ? null : terme,
      },
    });
  }

  protected reessayer(): void {
    this.mecaniciensResource.reload();
  }
}
