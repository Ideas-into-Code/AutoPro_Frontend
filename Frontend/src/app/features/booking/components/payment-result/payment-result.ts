import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button, Icon } from '@shared/ui';
import { separerMilliers } from '@shared/utils/format-number';
import { PaymentResult } from '../../models/booking.model';

/**
 * Issue du paiement : réussi ou refusé.
 *
 *   <app-payment-result
 *     [result]="resultat()"
 *     [amountXOF]="montant()"
 *     (retryRequested)="reessayer()"
 *   />
 *
 * Un seul composant pour les deux issues, et non deux : ce sont les mêmes
 * informations — un montant, un état, une suite à donner — et deux composants
 * jumeaux dériveraient l'un de l'autre à la première retouche.
 *
 * L'échec affiche **son motif**. « Le paiement a échoué » sans explication
 * laisse le client sans recours, alors qu'un solde insuffisant et une banque
 * qui refuse n'appellent pas du tout le même geste.
 */
@Component({
  selector: 'app-payment-result',
  imports: [Button, Icon, RouterLink],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-result',
    '[class.ap-result--ok]': 'result().status === "reussi"',
    '[class.ap-result--ko]': 'result().status === "echoue"',
  },
})
export class PaymentResultCard {
  readonly result = input.required<PaymentResult>();

  /** Montant concerné, pour que le client le retrouve sans remonter l'écran. */
  readonly amountXOF = input.required<number>();

  readonly retryRequested = output<void>();

  protected readonly reussi = computed(() => this.result().status === 'reussi');

  protected readonly montant = computed(() => separerMilliers(this.amountXOF()));
}
