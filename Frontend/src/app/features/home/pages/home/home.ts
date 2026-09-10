import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { ServiceCategory, ServiceCategoryRepository, emptyPage } from '@core';
import { Button, Icon, IconName, SearchBar, Spinner } from '@shared/ui';
import { HomeHighlightsRepository } from '../../data/home-highlights.repository';
import { NearbyMechanic, RecentRequest } from '../../models/home-cards.model';
import { MapPreview } from '../../components/map-preview/map-preview';
import { NearbyMechanics } from '../../components/nearby-mechanics/nearby-mechanics';
import { RecentRequests } from '../../components/recent-requests/recent-requests';

const ECRAN_MECANICIENS = '/mecaniciens';
const ECRAN_SIGNALEMENT = '/demandes/signaler';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    Button,
    Icon,
    SearchBar,
    Spinner,
    NearbyMechanics,
    RecentRequests,
    MapPreview,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly repository = inject(ServiceCategoryRepository);
  private readonly highlights = inject(HomeHighlightsRepository);

  protected readonly ecranMecaniciens = ECRAN_MECANICIENS;
  protected readonly ecranSignalement = ECRAN_SIGNALEMENT;

  protected readonly categoriesResource = rxResource({
    stream: () => this.repository.findAll(),
    defaultValue: emptyPage<ServiceCategory>(),
  });

  protected readonly categories = computed(() => this.categoriesResource.value().items);
  protected readonly hasFailed = computed(() => this.categoriesResource.error() !== undefined);

  /** Mécaniciens disponibles autour de Dakar (`/api/mechanics/nearby`). */
  protected readonly nearbyResource = rxResource<readonly NearbyMechanic[], unknown>({
    stream: () => this.highlights.nearbyMechanics(),
    defaultValue: [],
  });
  protected readonly nearbyMechanics = computed(() => this.nearbyResource.value());

  /** Dernières demandes du client connecté (vide si anonyme). */
  protected readonly recentResource = rxResource<readonly RecentRequest[], unknown>({
    stream: () => this.highlights.recentRequests(),
    defaultValue: [],
  });
  protected readonly recentRequests = computed(() => this.recentResource.value());

  protected categoryIcon(slug: string): IconName {
    const map: Record<string, IconName> = {
      batterie: 'batterie',
      pneu: 'pneu',
      'panne-moteur': 'cle',
      freinage: 'freinage',
      remorquage: 'remorquage',
      climatisation: 'climatisation',
      electricite: 'electricite',
    };
    return map[slug] ?? 'cle';
  }

  protected rechercher(terme: string): void {
    void this.router.navigate([ECRAN_MECANICIENS], {
      queryParams: terme === '' ? {} : { recherche: terme },
    });
  }

  protected reessayer(): void {
    this.categoriesResource.reload();
  }
}
