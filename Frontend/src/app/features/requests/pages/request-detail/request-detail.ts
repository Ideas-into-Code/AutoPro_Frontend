import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { Button, MapCoordinates, Spinner } from '@shared/ui';
import { LiveTrackingCard } from '../../components/live-tracking-card/live-tracking-card';
import { PROBLEM_TYPE_LABELS } from '../../models/request-draft.model';
import {
  CANCELLATION_REASONS,
  CANCELLATION_REASON_LABELS,
  CancellationReason,
  InterventionRequest,
  REQUEST_PAYMENT_LABELS,
  REQUEST_STATUS_LABELS,
  peutEtreAnnulee,
} from '../../models/request.model';
import { RequestRepository } from '../../data/request.repository';

/**
 * Détail d'une demande d'intervention : état d'avancement, mécanicien assigné,
 * prix convenu et statut du paiement en espèces. Le client peut annuler tant
 * que l'intervention n'a pas démarré, en indiquant un motif.
 */
@Component({
  selector: 'app-request-detail',
  imports: [RouterLink, DecimalPipe, Button, Spinner, LiveTrackingCard],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestDetailPage {
  private readonly requests = inject(RequestRepository);
  private readonly router = inject(Router);

  /** Identifiant de la demande, lié au segment d'URL `/demandes/:id`. */
  readonly id = input.required<string>();

  protected readonly demande = rxResource<InterventionRequest | undefined, string>({
    params: () => this.id(),
    stream: ({ params }) => this.requests.findById(params),
    defaultValue: undefined,
  });

  protected readonly annulationEnCours = signal(false);
  protected readonly erreurAnnulation = signal<string | null>(null);

  /** Ouverture du choix de motif avant de confirmer l'annulation. */
  protected readonly choixMotif = signal(false);
  protected readonly motif = signal<CancellationReason | null>(null);

  protected readonly PROBLEM_LABELS = PROBLEM_TYPE_LABELS;
  protected readonly STATUS_LABELS = REQUEST_STATUS_LABELS;
  protected readonly PAYMENT_LABELS = REQUEST_PAYMENT_LABELS;
  protected readonly MOTIFS = CANCELLATION_REASONS;
  protected readonly MOTIF_LABELS = CANCELLATION_REASON_LABELS;

  protected readonly annulable = computed(() => {
    const d = this.demande.value();
    return d !== undefined && peutEtreAnnulee(d.status);
  });

  /** Le suivi n'a de sens qu'une fois le mécanicien assigné et en route. */
  protected readonly suitLeMecanicien = computed(() => {
    const d = this.demande.value();
    return d !== undefined && (d.status === 'acceptee' || d.status === 'en_cours');
  });

  /** Lieu de l'intervention, s'il a été géolocalisé à la création. */
  protected readonly lieuIntervention = computed<MapCoordinates | null>(() => {
    const d = this.demande.value();
    if (d?.latitude == null || d?.longitude == null) {
      return null;
    }
    return { latitude: d.latitude, longitude: d.longitude };
  });

  protected ouvrirChoixMotif(): void {
    this.choixMotif.set(true);
    this.erreurAnnulation.set(null);
  }

  protected fermerChoixMotif(): void {
    this.choixMotif.set(false);
    this.motif.set(null);
  }

  protected choisirMotif(reason: CancellationReason): void {
    this.motif.set(reason);
  }

  protected confirmerAnnulation(): void {
    const d = this.demande.value();
    const reason = this.motif();
    if (d === undefined || reason === null) {
      return;
    }
    this.erreurAnnulation.set(null);
    this.annulationEnCours.set(true);
    this.requests.cancel(d.id, reason).subscribe({
      next: () => {
        this.annulationEnCours.set(false);
        this.choixMotif.set(false);
        this.motif.set(null);
        this.demande.reload();
      },
      error: () => {
        this.annulationEnCours.set(false);
        this.erreurAnnulation.set("L'annulation a échoué. Réessayez.");
      },
    });
  }

  protected retourListe(): void {
    void this.router.navigate(['/demandes']);
  }
}
