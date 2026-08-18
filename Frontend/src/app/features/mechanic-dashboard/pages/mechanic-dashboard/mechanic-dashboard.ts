import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { Button, Spinner } from '@shared/ui';
import {
  EarningsSummary,
  NewRequest,
  RequestDecision,
} from '../../models/mechanic-dashboard.model';
import {
  MechanicAvailabilityRepository,
  MechanicDashboardRepository,
  RequestDecisionRepository,
} from '../../data/mechanic-dashboard.repository';
import { AvailabilityToggle } from '../../components/availability-toggle/availability-toggle';
import { EarningsCard } from '../../components/earnings-card/earnings-card';
import { NewRequestDialog } from '../../components/new-request-dialog/new-request-dialog';

/**
 * Tableau de bord du mécanicien.
 *
 * Trois éléments, ceux du ticket #16 : les gains, la bascule de disponibilité
 * et la popup de nouvelle demande.
 *
 * Écran d'**agrégation**, comme l'accueil client : il réunit des informations
 * de plusieurs domaines et n'appartient donc à aucun d'eux. Il n'importe
 * aucune autre feature — seulement `shared` et `core`.
 *
 * Il ne connaît que des classes abstraites. Le jour où les microservices
 * répondent, trois lignes changent dans le fichier de routes, et pas une ici.
 */
@Component({
  selector: 'app-mechanic-dashboard',
  imports: [Button, Spinner, AvailabilityToggle, EarningsCard, NewRequestDialog],
  templateUrl: './mechanic-dashboard.html',
  styleUrl: './mechanic-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MechanicDashboardPage {
  private readonly dashboard = inject(MechanicDashboardRepository);
  private readonly availability = inject(MechanicAvailabilityRepository);
  private readonly decisions = inject(RequestDecisionRepository);

  // --- Gains ----------------------------------------------------------------

  // Le paramètre générique est explicite : sans lui, `defaultValue: null`
  // serait confronté au seul type `EarningsSummary` et refusé.
  protected readonly earningsResource = rxResource<EarningsSummary | null, unknown>({
    stream: () => this.dashboard.earnings(),
    defaultValue: null,
  });

  protected readonly earningsFailed = computed(() => this.earningsResource.error() !== undefined);

  // --- Disponibilité --------------------------------------------------------

  protected readonly availabilityResource = rxResource({
    stream: () => this.availability.current(),
    defaultValue: { isOnline: false },
  });

  /**
   * État affiché par la bascule.
   *
   * Un signal local plutôt que la seule valeur du dépôt : la bascule doit
   * réagir au doigt, sans attendre l'aller-retour réseau. En cas d'échec on
   * revient à l'état confirmé par le serveur.
   */
  private readonly bascule = signal<boolean | null>(null);

  protected readonly isOnline = computed(
    () => this.bascule() ?? this.availabilityResource.value().isOnline,
  );

  protected readonly savingAvailability = signal(false);
  protected readonly availabilityError = signal<string | null>(null);

  // --- Demande entrante -----------------------------------------------------

  private readonly demandeResource = rxResource({
    stream: () => this.dashboard.incomingRequest(),
    defaultValue: null,
  });

  /** Demande écartée localement une fois la décision envoyée. */
  private readonly demandeTraitee = signal(false);

  /**
   * Demande proposée au mécanicien.
   *
   * Trois conditions, et non une seule :
   *
   *   - il doit être **en ligne**. C'est tout l'objet de la bascule : « cessez
   *     de recevoir des demandes » n'aurait aucun sens si une popup s'ouvrait
   *     malgré tout ;
   *   - la demande ne doit pas déjà avoir été traitée ;
   *   - il doit y en avoir une.
   *
   * Sans la première, la popup se rouvrait à chaque affichage de l'écran,
   * quoi que le mécanicien ait choisi.
   */
  protected readonly incomingRequest = computed<NewRequest | null>(() => {
    if (!this.isOnline() || this.demandeTraitee()) {
      return null;
    }

    return this.demandeResource.value();
  });

  protected readonly sendingDecision = signal(false);

  // --- Actions --------------------------------------------------------------

  protected changerDisponibilite(enLigne: boolean): void {
    this.bascule.set(enLigne);
    this.savingAvailability.set(true);
    this.availabilityError.set(null);

    this.availability.update(enLigne).subscribe({
      next: (confirmee) => {
        this.savingAvailability.set(false);
        this.bascule.set(confirmee.isOnline);
      },
      error: () => {
        this.savingAvailability.set(false);
        // Retour à l'état connu du serveur : laisser la bascule sur la
        // position choisie ferait croire au mécanicien qu'il est hors ligne
        // alors qu'il continue de recevoir des demandes.
        this.bascule.set(this.availabilityResource.value().isOnline);
        this.availabilityError.set(
          "Votre disponibilité n'a pas pu être enregistrée. Vérifiez votre connexion.",
        );
      },
    });
  }

  protected repondreALaDemande(decision: RequestDecision): void {
    const demande = this.incomingRequest();

    if (demande === null) {
      return;
    }

    this.sendingDecision.set(true);

    this.decisions.decide(demande.id, decision).subscribe({
      next: () => {
        this.sendingDecision.set(false);
        this.demandeTraitee.set(true);
      },
      error: () => {
        // La popup reste ouverte : la demande n'est pas perdue et le
        // mécanicien peut réessayer.
        this.sendingDecision.set(false);
      },
    });
  }

  protected reessayerGains(): void {
    this.earningsResource.reload();
  }
}
