import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { MapCoordinates, Spinner } from '@shared/ui';
import { ClientLocationCard } from '../../components/client-location-card/client-location-card';
import { MechanicRequest } from '../../models/mechanic-request.model';
import { MechanicRequestRepository } from '../../data/mechanic-request.repository';

/**
 * « Carte » de l'espace mécanicien : l'intervention en cours et le chemin vers
 * le client. S'il n'y en a pas, l'écran le dit et renvoie vers les demandes.
 *
 * Le partage de position (le client qui suit le mécanicien) reste géré par la
 * coquille mécanicien ; ici on montre l'inverse — le mécanicien qui rejoint le
 * client.
 */
@Component({
  selector: 'app-mechanic-map',
  imports: [RouterLink, Spinner, ClientLocationCard],
  templateUrl: './mechanic-map.html',
  styleUrl: './mechanic-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MechanicMapPage {
  private readonly repo = inject(MechanicRequestRepository);

  protected readonly demandes = rxResource<readonly MechanicRequest[], unknown>({
    stream: () => this.repo.list(),
    defaultValue: [],
  });

  /** Intervention active du mécanicien : acceptée ou en cours, à lui. */
  protected readonly active = computed<MechanicRequest | null>(
    () =>
      this.demandes
        .value()
        .find(
          (d) => d.assignedToMe && (d.status === 'acceptee' || d.status === 'en_cours'),
        ) ?? null,
  );

  protected readonly lieuClient = computed<MapCoordinates | null>(() => {
    const d = this.active();
    if (!d || d.latitude == null || d.longitude == null) {
      return null;
    }
    return { latitude: d.latitude, longitude: d.longitude };
  });
}
