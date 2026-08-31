import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button, Spinner } from '@shared/ui';
import { separerMilliers } from '@shared/utils/format-number';
import {
  BookingRepository,
  PaymentMethodRepository,
  PaymentRepository,
} from '../../data/booking.repository';
import {
  BookingSummary,
  PaymentMethod,
  PaymentMethodId,
  PaymentResult,
} from '../../models/booking.model';
import { PaymentMethodPicker } from '../../components/payment-method-picker/payment-method-picker';
import { PaymentResultCard } from '../../components/payment-result/payment-result';

/**
 * Confirmation de paiement — tâche 2 du ticket #25.
 *
 * **Deux moments dans un même écran**, et c'est délibéré : le choix du moyen de
 * paiement, puis son issue. Les séparer en deux routes ajouterait une page à
 * l'historique du navigateur, et un retour arrière après un paiement réussi
 * rouvrirait le formulaire de paiement d'une réservation déjà réglée.
 *
 * Tant qu'aucun résultat n'est revenu, l'écran montre le choix ; dès qu'il
 * arrive, il montre l'issue. Un échec ramène au choix : c'est le seul geste
 * utile après un refus.
 */
@Component({
  selector: 'app-payment',
  imports: [Button, Spinner, RouterLink, PaymentMethodPicker, PaymentResultCard],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentPage {
  private readonly bookings = inject(BookingRepository);
  private readonly methods = inject(PaymentMethodRepository);
  private readonly payments = inject(PaymentRepository);

  protected readonly bookingResource = rxResource<BookingSummary | null, unknown>({
    stream: () => this.bookings.current(),
    defaultValue: null,
  });

  protected readonly methodsResource = rxResource<readonly PaymentMethod[], unknown>({
    stream: () => this.methods.available(),
    defaultValue: [],
  });

  protected readonly chargementFailed = computed(
    () => this.bookingResource.error() !== undefined || this.methodsResource.error() !== undefined,
  );

  protected readonly chargement = computed(
    () => this.bookingResource.isLoading() || this.methodsResource.isLoading(),
  );

  /** Moyen retenu par le client, `null` tant qu'il n'a pas choisi. */
  protected readonly moyenChoisi = signal<PaymentMethodId | null>(null);

  /** Résultat renvoyé par le serveur, `null` tant que rien n'a été tenté. */
  protected readonly resultat = signal<PaymentResult | null>(null);

  protected readonly envoiEnCours = signal(false);

  /**
   * Panne de communication, à distinguer d'un **refus**.
   *
   * Un refus est une réponse du service et s'affiche dans `PaymentResultCard`.
   * Ici on ne traite que le cas où la question n'a pas pu être posée : réseau
   * coupé, service injoignable. Les confondre ferait dire « paiement refusé »
   * là où rien n'a même été tenté.
   */
  protected readonly erreurReseau = signal<string | null>(null);

  protected readonly montant = computed(() => this.bookingResource.value()?.price.totalXOF ?? 0);

  protected readonly montantFormate = computed(() => separerMilliers(this.montant()));

  protected choisir(methode: PaymentMethodId): void {
    this.moyenChoisi.set(methode);
    this.erreurReseau.set(null);
  }

  protected payer(): void {
    const reservation = this.bookingResource.value();
    const methode = this.moyenChoisi();

    // Garde de sûreté : le bouton est déjà neutralisé dans ces deux cas.
    if (reservation === null || methode === null) {
      return;
    }

    this.envoiEnCours.set(true);
    this.erreurReseau.set(null);

    this.payments.pay(reservation.id, methode).subscribe({
      next: (resultat) => {
        this.envoiEnCours.set(false);
        this.resultat.set(resultat);
      },
      error: () => {
        this.envoiEnCours.set(false);
        this.erreurReseau.set(
          "Le paiement n'a pas pu être lancé. Vérifiez votre connexion, aucun montant n'a été débité.",
        );
      },
    });
  }

  /** Retour au choix du moyen après un refus. */
  protected reessayer(): void {
    this.resultat.set(null);
    this.moyenChoisi.set(null);
  }

  protected rechargerEcran(): void {
    this.bookingResource.reload();
    this.methodsResource.reload();
  }
}
