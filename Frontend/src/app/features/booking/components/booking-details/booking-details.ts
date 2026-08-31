import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Avatar, Icon } from '@shared/ui';
import { BookingSummary } from '../../models/booking.model';

const CRENEAU = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Ce sur quoi porte la réservation : le mécanicien, le véhicule, la panne, le
 * lieu et le créneau.
 *
 *   <app-booking-details [booking]="reservation()" />
 *
 * Rien n'y est modifiable. C'est l'objet même d'un récapitulatif : on relit
 * avant de payer, et toute correction se fait en revenant en arrière, là où la
 * saisie a eu lieu. Un champ modifiable ici obligerait à réenregistrer, donc à
 * gérer un échec, sur l'écran le moins indiqué pour cela.
 */
@Component({
  selector: 'app-booking-details',
  imports: [Avatar, Icon],
  templateUrl: './booking-details.html',
  styleUrl: './booking-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-booking',
  },
})
export class BookingDetails {
  readonly booking = input.required<BookingSummary>();

  /** « mercredi 2 septembre à 09:30 » — jour nommé, car il se retient mieux. */
  protected readonly creneau = computed(() => CRENEAU.format(new Date(this.booking().scheduledAt)));

  /**
   * Note du mécanicien, sur une décimale.
   *
   * `null` tant qu'il n'a jamais été noté : afficher « 0 » laisserait croire à
   * de mauvais avis là où il n'y en a simplement aucun.
   */
  protected readonly note = computed(() => {
    const moyenne = this.booking().mechanic.ratingAverage;

    return moyenne === null ? null : moyenne.toLocaleString('fr-FR', { minimumFractionDigits: 1 });
  });
}
