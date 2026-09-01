import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Avatar, Button, Icon } from '@shared/ui';
import { separerMilliers } from '@shared/utils/format-number';
import { BookingSummary, PaymentResult } from '../../models/booking.model';
import { PriceBreakdownCard } from '../price-breakdown/price-breakdown';

const DATE_FACTURE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Issue du paiement : le reçu, ou le refus.
 *
 *   <app-payment-result
 *     [result]="resultat()"
 *     [booking]="reservation()"
 *     [downloading]="telechargementEnCours()"
 *     (invoiceRequested)="telechargerFacture()"
 *     (retryRequested)="reessayer()"
 *   />
 *
 * Un seul composant pour les deux issues, et non deux : ce sont les mêmes
 * informations — un montant, un état, une suite à donner — et deux composants
 * jumeaux dériveraient l'un de l'autre à la première retouche.
 *
 * Le succès prend la forme d'un **reçu** : mécanicien, date, référence,
 * prestation et détail du prix. C'est le document que le client cherchera à
 * retrouver, et il doit tenir dans une capture d'écran.
 *
 * L'échec, lui, affiche son **motif**. « Le paiement a échoué » sans
 * explication laisse le client sans recours, alors qu'un solde insuffisant et
 * une banque qui refuse n'appellent pas du tout le même geste.
 */
@Component({
  selector: 'app-payment-result',
  imports: [Avatar, Button, Icon, RouterLink, PriceBreakdownCard],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-result',
    '[class.ap-result--ok]': 'reussi()',
    '[class.ap-result--ko]': '!reussi()',
  },
})
export class PaymentResultCard {
  readonly result = input.required<PaymentResult>();

  readonly booking = input.required<BookingSummary>();

  /** Neutralise le bouton de facture pendant que le fichier arrive. */
  readonly downloading = input(false);

  readonly invoiceRequested = output<void>();
  readonly retryRequested = output<void>();

  protected readonly reussi = computed(() => this.result().status === 'reussi');

  protected readonly montant = computed(() => separerMilliers(this.booking().price.totalXOF));

  /**
   * Date du paiement, telle que le serveur l'a enregistrée.
   *
   * `null` si elle manque : inventer la date du jour ferait figurer sur un
   * reçu une information que personne n'a validée.
   */
  protected readonly datePaiement = computed(() => {
    const paidAt = this.result().paidAt;

    return paidAt === null ? null : DATE_FACTURE.format(new Date(paidAt));
  });
}
