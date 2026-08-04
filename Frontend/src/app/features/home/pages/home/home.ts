import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { ServiceCategory, ServiceCategoryRepository, emptyPage } from '@core';
import { Button, Icon, IconName, SearchBar, Spinner } from '@shared/ui';
import { MOCK_MECHANICS } from '@features/mechanics/data/mock-mechanics.data';

const ECRAN_MECANICIENS = '/mecaniciens';
const ECRAN_SIGNALEMENT = '/demandes/signaler';

/** Icônes Material Symbols pour chaque slug de catégorie. */
const CATEGORY_ICONS: Record<string, string> = {
  batterie: 'battery_charging_full',
  pneu: 'tire_repair',
  'panne-moteur': 'build',
  freinage: 'emergency_brake',
  remorquage: 'local_shipping',
  climatisation: 'ac_unit',
  electricite: 'electrical_services',
};

interface NearbyMechanic {
  id: string;
  name: string;
  district: string;
  distance: string;
  rating: number;
  tags: string[];
}

interface RecentRequest {
  id: string;
  label: string;
  date: string;
  icon: string;
  color: 'primary' | 'warning';
  status: 'pending' | 'done';
  statusLabel: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, Button, Icon, SearchBar, Spinner],
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
  protected readonly nearbyMechanics: NearbyMechanic[] = MOCK_MECHANICS.slice(0, 3).map((m) => ({
    id: m.id,
    name: m.fullName,
    district: m.address.split(',')[0],
    distance: `${((m.location.latitude - 14.6937) ** 2 + (m.location.longitude + 17.4441) ** 2) ** 0.5 < 0.05 ? '0.8' : '2.4'} km`,
    rating: m.rating,
    tags: m.specialties.slice(0, 2),
  }));

  /** Demandes fictives récentes */
  protected readonly recentRequests: RecentRequest[] = [
    {
      id: 'req-1',
      label: 'Inspection complète',
      date: 'Prévu le 24 oct. à 10h00',
      icon: 'build',
      color: 'primary',
      status: 'pending',
      statusLabel: 'Confirmé',
    },
    {
      id: 'req-2',
      label: 'Vidange moteur',
      date: 'Terminé le 12 oct.',
      icon: 'oil_barrel',
      color: 'warning',
      status: 'done',
      statusLabel: 'Terminé',
    },
  ];

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
