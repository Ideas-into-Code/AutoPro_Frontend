import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { ServiceCategory, ServiceCategoryRepository, emptyPage } from '@core';
import { Button, SearchBar, Spinner } from '@shared/ui';
import { CategoryCard } from '../../components/category-card/category-card';
import { SosButton } from '../../components/sos-button/sos-button';

/** Écran vers lequel mène une catégorie ou une recherche. */
const ECRAN_MECANICIENS = '/mecaniciens';

/** Écran de signalement d'un problème, ouvert par le bouton SOS. */
const ECRAN_SIGNALEMENT = '/demandes/signaler';

/**
 * Accueil de l'espace client : point d'entrée après la connexion.
 *
 * Trois portes d'entrée, par ordre d'urgence décroissante — le dépannage
 * immédiat, la recherche libre, puis le parcours par catégorie. C'est
 * l'inverse de l'ordre de lecture habituel, et c'est délibéré : un
 * automobiliste en panne sur la route de Rufisque n'a pas le loisir de
 * parcourir une grille.
 *
 * L'écran ne connaît que le contrat `ServiceCategoryRepository`. Il ignore si
 * les catégories viennent de données simulées ou du microservice, et n'aura
 * pas à changer le jour de la bascule.
 */
@Component({
  selector: 'app-home',
  imports: [Button, SearchBar, Spinner, CategoryCard, SosButton],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly repository = inject(ServiceCategoryRepository);

  protected readonly ecranMecaniciens = ECRAN_MECANICIENS;
  protected readonly ecranSignalement = ECRAN_SIGNALEMENT;

  /**
   * `rxResource` porte à lui seul les trois états d'un chargement — en cours,
   * abouti, en échec — là où un `toSignal` obligerait à les reconstituer à la
   * main. Il expose aussi `reload()`, ce qui permet de proposer une nouvelle
   * tentative plutôt que de laisser l'utilisateur devant un écran mort.
   */
  protected readonly categoriesResource = rxResource({
    stream: () => this.repository.findAll(),
    defaultValue: emptyPage<ServiceCategory>(),
  });

  protected readonly categories = computed(() => this.categoriesResource.value().items);

  protected readonly hasFailed = computed(() => this.categoriesResource.error() !== undefined);

  /**
   * La recherche n'interroge pas de dépôt ici : elle délègue à l'écran des
   * mécaniciens, qui sait filtrer et afficher des résultats. L'accueil n'aurait
   * rien à faire d'une liste de résultats qu'il ne sait pas présenter.
   */
  protected rechercher(terme: string): void {
    void this.router.navigate([ECRAN_MECANICIENS], {
      queryParams: terme === '' ? {} : { recherche: terme },
    });
  }

  protected reessayer(): void {
    this.categoriesResource.reload();
  }
}
