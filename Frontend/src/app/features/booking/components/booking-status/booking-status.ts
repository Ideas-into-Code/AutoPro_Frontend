import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button, Icon, Spinner } from '@shared/ui';
import { BookingStatus } from '../../models/booking.model';

/**
 * Où en est la demande, tant que le mécanicien n'a pas répondu.
 *
 *   <app-booking-status [status]="reservation().status" [mechanicName]="…" />
 *
 * Trois états, trois messages, et surtout trois suites différentes : on attend,
 * on peut payer, ou il faut chercher quelqu'un d'autre. Une simple pastille
 * colorée aurait laissé le client sans savoir quoi faire.
 *
 * N'affiche rien quand la demande est acceptée : à ce moment-là, c'est le
 * bouton de paiement qui parle, et un bandeau de plus ne ferait que le
 * repousser plus bas.
 */
@Component({
  selector: 'app-booking-status',
  imports: [Button, Icon, Spinner, RouterLink],
  templateUrl: './booking-status.html',
  styleUrl: './booking-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-bstatus',
    '[class.ap-bstatus--attente]': 'status() === "en_attente"',
    '[class.ap-bstatus--refusee]': 'status() === "refusee"',
  },
})
export class BookingStatusPanel {
  readonly status = input.required<BookingStatus>();

  /** Nom du mécanicien sollicité, pour que l'attente ait un visage. */
  readonly mechanicName = input.required<string>();
}
