import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { ServiceCategory, ServiceCategoryRepository, emptyPage } from '@core';
import { Button, Icon, IconName, SearchBar, Spinner } from '@shared/ui';
import { MOCK_NEARBY_MECHANICS, MOCK_RECENT_REQUESTS } from '../../data/mock-home-highlights.data';
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

  protected readonly ecranMecaniciens = ECRAN_MECANICIENS;
  protected readonly ecranSignalement = ECRAN_SIGNALEMENT;

  protected readonly categoriesResource = rxResource({
    stream: () => this.repository.findAll(),
    defaultValue: emptyPage<ServiceCategory>(),
  });

  protected readonly categories = computed(() => this.categoriesResource.value().items);
  protected readonly hasFailed = computed(() => this.categoriesResource.error() !== undefined);

  /** 3 premiers mécaniciens du mock comme "proches" */
  protected readonly nearbyMechanics = MOCK_NEARBY_MECHANICS;

  protected readonly recentRequests = MOCK_RECENT_REQUESTS;

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
