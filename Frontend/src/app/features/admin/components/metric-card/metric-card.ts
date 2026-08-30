import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Icon } from '@shared/ui';
import { abregerNombre } from '@shared/utils/format-number';
import { SystemMetric } from '../../models/admin-dashboard.model';

/**
 * Carte d'indicateur de la vue d'ensemble.
 *
 *   <app-metric-card [metric]="indicateur" />
 *
 * Ne connaît ni les comptes, ni les revenus : elle affiche ce qu'on lui donne.
 * Ajouter un quatrième indicateur ne demande donc qu'une entrée de plus dans
 * le dépôt, et pas une ligne ici (ouvert à l'extension, fermé à la
 * modification).
 */
@Component({
  selector: 'app-metric-card',
  imports: [Icon],
  templateUrl: './metric-card.html',
  styleUrl: './metric-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-metric',
    '[class.ap-metric--hausse]': 'metric().direction === "hausse"',
    '[class.ap-metric--baisse]': 'metric().direction === "baisse"',
  },
})
export class MetricCard {
  readonly metric = input.required<SystemMetric>();

  protected readonly valeur = computed(() => abregerNombre(this.metric().value));

  /**
   * Libellé de l'évolution.
   *
   * Le signe est explicite pour une hausse : « +12 % » se distingue d'un seuil
   * ou d'une part, que « 12 % » laisserait ambigu. Un indicateur stable
   * n'affiche aucun chiffre — « 0 % » se lit comme une mesure alors qu'il
   * s'agit d'une absence de mouvement.
   */
  protected readonly evolution = computed(() => {
    const { direction, trendPercent } = this.metric();

    if (direction === 'stable') {
      return 'Stable';
    }

    const signe = direction === 'hausse' ? '+' : '−';

    return `${signe}${Math.abs(trendPercent).toLocaleString('fr-FR')} %`;
  });

  /**
   * Phrase complète destinée aux lecteurs d'écran.
   *
   * « +12 % » posé à côté d'un nombre ne dit pas de quoi il s'agit : la
   * flèche et la couleur portent ce sens, et ni l'une ni l'autre ne s'entend.
   */
  protected readonly evolutionAnnoncee = computed(() => {
    const { direction, trendPercent } = this.metric();

    if (direction === 'stable') {
      return 'stable par rapport au mois précédent';
    }

    const sens = direction === 'hausse' ? 'en hausse' : 'en baisse';

    return `${sens} de ${Math.abs(trendPercent).toLocaleString('fr-FR')} % par rapport au mois précédent`;
  });
}
