import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { defer } from 'rxjs';

import { Button, Icon, IconName, Spinner } from '@shared/ui';
import { MechanicRepository } from '../../data/mechanic.repository';

/**
 * Fiche publique d'un mécanicien.
 *
 * N'affiche **que des données réelles** renvoyées par `/api/mechanics/{id}` :
 * nom, présentation, spécialités, années d'expérience, note et avis,
 * disponibilité, validation. Les sections « marques », « horaires » et la photo
 * d'atelier ont été retirées : le backend ne les fournit pas et le mécanicien
 * ne peut pas les renseigner — les inventer serait du « faux fonctionnel ».
 */
@Component({
  selector: 'app-mechanic-profile',
  imports: [Button, Icon, RouterLink, Spinner],
  templateUrl: './mechanic-profile.html',
  styleUrl: './mechanic-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MechanicProfilePage {
  private readonly mechanics = inject(MechanicRepository);

  readonly id = input.required<string>();

  protected readonly mechanicResource = rxResource({
    params: () => this.id(),
    stream: ({ params }) => defer(() => this.mechanics.findById(params)),
  });

  protected readonly mechanic = computed(() => this.mechanicResource.value());
  protected readonly hasFailed = computed(() => this.mechanicResource.error() !== undefined);

  protected readonly stars = [1, 2, 3, 4, 5] as const;

  /** « 6 ans d'expérience », ou `null` si non renseigné. */
  protected readonly experienceLabel = computed(() => {
    const n = this.mechanic()?.experienceYears;
    return n != null ? `${n} an${n > 1 ? 's' : ''} d'expérience` : null;
  });

  protected readonly initiale = computed(
    () => this.mechanic()?.fullName.slice(0, 1).toUpperCase() ?? '?',
  );

  protected specialtyIcon(specialty: string): IconName {
    const normalized = specialty
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    if (normalized.includes('clim')) return 'climatisation';
    if (normalized.includes('pneu')) return 'pneu';
    if (normalized.includes('frein')) return 'freinage';
    if (normalized.includes('electric') || normalized.includes('diagnostic')) return 'electricite';

    return 'cle';
  }

  protected isFilledStar(rating: number, star: number): boolean {
    return star <= Math.round(rating);
  }

  protected reviewAge(createdAt: string): string {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const days = Math.max(1, Math.round(diffMs / 86_400_000));

    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;

    const weeks = Math.round(days / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
}
