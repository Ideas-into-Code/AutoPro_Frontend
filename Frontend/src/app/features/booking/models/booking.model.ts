/**
 * Types du tunnel de réservation et de paiement.
 *
 * Cette feature est un écran d'**agrégation**, comme l'accueil client ou les
 * tableaux de bord : le récapitulatif réunit un mécanicien, un véhicule, une
 * panne et un prix, qui relèvent de quatre microservices différents. Elle
 * déclare donc ses propres types condensés plutôt que d'importer ceux de
 * `mechanics`, `requests` ou `pricing` — une feature n'en importe jamais une
 * autre (CONVENTIONS.md §1).
 */

/** Le mécanicien retenu, réduit à ce que le récapitulatif doit montrer. */
export interface BookedMechanic {
  readonly id: string;
  readonly fullName: string;

  /** Spécialité annoncée (« Diagnostic électronique »). */
  readonly specialty: string;

  /** Note moyenne sur 5, ou `null` s'il n'a pas encore été noté. */
  readonly ratingAverage: number | null;
}

/**
 * Une ligne du détail du prix.
 *
 * Le montant reste un **nombre** : c'est l'écran qui met en forme. Recevoir
 * « 12 500 FCFA » déjà composé interdirait tout calcul côté client et figerait
 * le séparateur de milliers dans le backend.
 */
export interface PriceLine {
  readonly label: string;
  readonly amountXOF: number;
}

/**
 * Détail du prix.
 *
 * Le total est **fourni par le serveur**, il n'est pas recalculé ici. Une somme
 * refaite dans le navigateur finirait tôt ou tard par diverger de celle qui est
 * facturée — remise, arrondi ou taxe qu'il ne connaît pas — et c'est la
 * facture qui fait foi.
 */
export interface PriceBreakdown {
  readonly lines: readonly PriceLine[];
  readonly totalXOF: number;
}

/** Ce que le client s'apprête à payer. */
export interface BookingSummary {
  readonly id: string;
  readonly mechanic: BookedMechanic;

  /** Véhicule concerné (« Toyota Corolla 2015 »). */
  readonly vehicle: string;

  /** Panne déclarée, déjà libellée (« Batterie déchargée »). */
  readonly problemLabel: string;

  /** Adresse d'intervention, telle que le client l'a confirmée. */
  readonly address: string;

  /** Créneau retenu, au format ISO. Mis en forme par l'écran. */
  readonly scheduledAt: string;

  readonly price: PriceBreakdown;
}

/**
 * Moyens de paiement. Liste fermée : un identifiant inconnu doit être une
 * erreur de compilation, pas un bouton muet à l'écran.
 */
export type PaymentMethodId = 'wave' | 'orange-money' | 'carte';

/**
 * Un moyen de paiement proposé.
 *
 * La liste vient du **serveur** et n'est pas écrite dans l'écran : selon la
 * ville, le montant ou une panne d'opérateur, tous ne sont pas toujours
 * disponibles, et c'est au backend d'en décider.
 */
export interface PaymentMethod {
  readonly id: PaymentMethodId;
  readonly label: string;

  /** Précision affichée sous le libellé (« Paiement via l'application Wave »). */
  readonly hint: string;

  /** `false` quand l'opérateur est momentanément indisponible. */
  readonly available: boolean;
}

/** Issue d'une tentative de paiement. */
export type PaymentStatus = 'reussi' | 'echoue';

/**
 * Résultat renvoyé par le serveur.
 *
 * L'échec porte un **motif** : « le paiement a échoué » sans explication laisse
 * le client sans recours, alors qu'un solde insuffisant et un opérateur
 * injoignable n'appellent pas du tout le même geste.
 */
export interface PaymentResult {
  readonly status: PaymentStatus;

  /** Référence de transaction, présente uniquement en cas de succès. */
  readonly reference: string | null;

  /** Motif de l'échec, présent uniquement en cas d'échec. */
  readonly failureReason: string | null;
}
