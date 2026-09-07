import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { Button, Spinner } from '@shared/ui';
import {
  MECHANIC_REQUEST_STATUS_LABELS,
  MechanicRequest,
  actionsFor,
} from '../../models/mechanic-request.model';
import { MechanicRequestRepository } from '../../data/mechanic-request.repository';

/**
 * Détail d'une demande côté mécanicien, avec les actions du cycle de vie :
 * accepter, fixer le prix, démarrer, terminer, confirmer l'encaissement.
 */
@Component({
  selector: 'app-mechanic-request-detail',
  imports: [RouterLink, DecimalPipe, Button, Spinner],
  templateUrl: './mechanic-request-detail.html',
  styleUrl: './mechanic-request-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MechanicRequestDetailPage {
  private readonly repo = inject(MechanicRequestRepository);

  readonly id = input.required<string>();

  protected readonly demande = rxResource<MechanicRequest | undefined, string>({
    params: () => this.id(),
    stream: ({ params }) => this.repo.findById(params),
    defaultValue: undefined,
  });

  protected readonly STATUS_LABELS = MECHANIC_REQUEST_STATUS_LABELS;

  protected readonly busy = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly saisiePrix = signal(false);
  protected readonly prix = signal<number | null>(null);

  protected readonly actions = computed(() => {
    const d = this.demande.value();
    return d ? actionsFor(d) : [];
  });

  protected accepter(): void {
    this.run(this.repo.accept(this.id()));
  }

  protected demarrer(): void {
    this.run(this.repo.start(this.id()));
  }

  protected terminer(): void {
    this.run(this.repo.complete(this.id()));
  }

  protected encaisser(): void {
    this.exec(() => this.repo.collectPayment(this.id()));
  }

  protected ouvrirPrix(): void {
    this.saisiePrix.set(true);
    this.prix.set(this.demande.value()?.priceXOF ?? null);
  }

  protected validerPrix(): void {
    const montant = this.prix();
    if (montant === null || montant <= 0) {
      this.erreur.set('Saisissez un montant supérieur à 0.');
      return;
    }
    this.saisiePrix.set(false);
    this.run(this.repo.setPrice(this.id(), montant));
  }

  protected majPrix(value: string): void {
    const n = Number(value);
    this.prix.set(Number.isFinite(n) && n > 0 ? n : null);
  }

  private run(obs: Observable<MechanicRequest>): void {
    this.exec(() => obs);
  }

  private exec(factory: () => Observable<unknown>): void {
    this.erreur.set(null);
    this.busy.set(true);
    factory().subscribe({
      next: () => {
        this.busy.set(false);
        this.demande.reload();
      },
      error: (e: { message?: string }) => {
        this.busy.set(false);
        this.erreur.set(e?.message ?? "L'action a échoué. Réessayez.");
      },
    });
  }
}
