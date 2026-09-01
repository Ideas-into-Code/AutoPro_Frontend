import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button, Spinner } from '@shared/ui';
import { separerMilliers } from '@shared/utils/format-number';
import {
  BookingRepository,
  InvoiceRepository,
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
import { PriceBreakdownCard } from '../../components/price-breakdown/price-breakdown';

/** Extensions connues, par type MIME renvoyé par le serveur. */
const EXTENSIONS: Readonly<Record<string, string>> = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
};

/**
 * Extension du fichier à enregistrer, déduite de son type.
 *
 * Repli sur `bin` plutôt que sur une extension inventée : mieux vaut un nom
 * neutre qu'un nom qui ment sur le contenu, ce que le système d'exploitation
 * rejetterait à l'ouverture.
 */
function extensionDe(fichier: Blob): string {
  return EXTENSIONS[fichier.type] ?? 'bin';
}

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
  imports: [
    Button,
    Spinner,
    RouterLink,
    PaymentMethodPicker,
    PaymentResultCard,
    PriceBreakdownCard,
  ],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentPage {
  private readonly bookings = inject(BookingRepository);
  private readonly methods = inject(PaymentMethodRepository);
  private readonly payments = inject(PaymentRepository);
  private readonly invoices = inject(InvoiceRepository);
  private readonly platformId = inject(PLATFORM_ID);

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

  /**
   * `true` tant que le mécanicien n'a pas accepté.
   *
   * Le paiement n'a lieu qu'après son accord : encaisser avant obligerait à
   * rembourser chaque refus.
   */
  protected readonly enAttenteDAcceptation = computed(
    () => this.bookingResource.value()?.status !== 'acceptee',
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

  protected readonly telechargementEnCours = signal(false);

  /**
   * Enregistre la facture renvoyée par le serveur.
   *
   * Passe par une URL objet et un lien cliqué par le code : c'est le seul
   * moyen de déclencher un enregistrement à partir d'un `Blob` déjà reçu, sans
   * relancer une requête que le serveur refuserait faute d'en-têtes de session.
   * L'URL est libérée aussitôt, sinon le fichier resterait en mémoire jusqu'à
   * la fermeture de l'onglet.
   */
  protected telechargerFacture(): void {
    const reservation = this.bookingResource.value();

    if (reservation === null || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.telechargementEnCours.set(true);
    this.erreurReseau.set(null);

    this.invoices.download(reservation.id).subscribe({
      next: (fichier) => {
        this.telechargementEnCours.set(false);

        const url = URL.createObjectURL(fichier);
        const lien = document.createElement('a');

        lien.href = url;
        // L'extension est déduite du type reçu, jamais écrite en dur : nommer
        // « .pdf » un fichier texte fait échouer l'ouverture avec « fichier
        // endommagé », alors que le contenu est intact.
        lien.download = `facture-${reservation.id}.${extensionDe(fichier)}`;
        lien.click();

        URL.revokeObjectURL(url);
      },
      error: () => {
        this.telechargementEnCours.set(false);
        this.erreurReseau.set(
          "La facture n'a pas pu être téléchargée. Votre paiement, lui, est bien enregistré.",
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
