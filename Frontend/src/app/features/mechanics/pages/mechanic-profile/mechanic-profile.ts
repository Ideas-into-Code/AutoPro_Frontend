import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { defer } from 'rxjs';

import { Button, Icon, IconName, Spinner } from '@shared/ui';
import { Mechanic } from '../../models/mechanic.model';
import { MechanicRepository } from '../../data/mechanic.repository';

interface ProfileDetails {
  readonly experience: string;
  readonly certificate: string;
  readonly brands: readonly string[];
  readonly hours: readonly WorkingHour[];
}

interface WorkingHour {
  readonly day: string;
  readonly value: string;
  readonly isMuted?: boolean;
}

const DEFAULT_DETAILS: ProfileDetails = {
  experience: '8+ ans',
  certificate: 'Expert AutoPro',
  brands: ['Toyota', 'Mercedes', 'BMW', 'Renault'],
  hours: [
    { day: 'Lundi - Vendredi', value: '08:00 - 18:00' },
    { day: 'Samedi', value: '09:00 - 14:00' },
    { day: 'Dimanche', value: 'Fermé', isMuted: true },
  ],
};

const PROFILE_DETAILS: Readonly<Record<string, ProfileDetails>> = {
  'mec-001': {
    experience: '12+ ans',
    certificate: 'Diagnostic Gold',
    brands: ['Mercedes', 'Toyota', 'BMW', 'Range Rover'],
    hours: DEFAULT_DETAILS.hours,
  },
  'mec-002': {
    experience: '9+ ans',
    certificate: 'Dépannage certifié',
    brands: ['Toyota', 'Peugeot', 'Renault', 'Hyundai'],
    hours: [
      { day: 'Lundi - Vendredi', value: '07:30 - 20:00' },
      { day: 'Samedi', value: '08:30 - 16:00' },
      { day: 'Dimanche', value: 'Urgences uniquement' },
    ],
  },
};

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

  protected readonly details = computed(() => {
    const mechanic = this.mechanic();
    return mechanic ? (PROFILE_DETAILS[mechanic.id] ?? DEFAULT_DETAILS) : DEFAULT_DETAILS;
  });

  protected readonly stars = [1, 2, 3, 4, 5] as const;

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
