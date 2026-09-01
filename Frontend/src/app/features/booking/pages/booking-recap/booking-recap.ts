import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button, Spinner } from '@shared/ui';
import { separerMilliers } from '@shared/utils/format-number';
import { BookingRepository } from '../../data/booking.repository';
import { BookingSummary } from '../../models/booking.model';
import { BookingDetails } from '../../components/booking-details/booking-details';
import { BookingStatusPanel } from '../../components/booking-status/booking-status';
import { PriceBreakdownCard } from '../../components/price-breakdown/price-breakdown';

/**
 * Récapitulatif de réservation — tâche 1 du ticket #25.
 *
 * Le dernier écran avant de payer. Il ne saisit rien : il relit. Toute
 * correction se fait en revenant en arrière, là où la saisie a eu lieu.
 *
 * Écran d'**agrégation** : mécanicien, véhicule, panne et prix viennent de
 * quatre microservices. Il n'importe aucune autre feature — seulement `shared`
 * et ses propres composants.
 */
@Component({
  selector: 'app-booking-recap',
  imports: [Button, Spinner, RouterLink, BookingDetails, BookingStatusPanel, PriceBreakdownCard],
  templateUrl: './booking-recap.html',
  styleUrl: './booking-recap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingRecapPage {
  private readonly bookings = inject(BookingRepository);

  // Le paramètre générique est explicite : sans lui, `defaultValue: null`
  // serait confronté au seul type `BookingSummary` et refusé.
  protected readonly bookingResource = rxResource<BookingSummary | null, unknown>({
    stream: () => this.bookings.current(),
    defaultValue: null,
  });

  protected readonly failed = computed(() => this.bookingResource.error() !== undefined);

  /** Réexposé au gabarit : la mise en forme est commune à tout le projet. */
  protected readonly separerMilliers = separerMilliers;

  protected reessayer(): void {
    this.bookingResource.reload();
  }
}
