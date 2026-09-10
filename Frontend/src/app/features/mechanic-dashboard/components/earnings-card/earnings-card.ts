import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Icon } from '@shared/ui';
import { separerMilliers } from '@shared/utils/format-number';
import { EarningsSummary } from '../../models/mechanic-dashboard.model';

/** Barre du graphique, avec sa hauteur déjà exprimée en pourcentage. */
interface Barre {
  readonly label: string;
  readonly amountXOF: number;
  readonly heightPercent: number;
  readonly isLast: boolean;
}

/** Hauteur minimale d'une barre, pour qu'un jour creux reste visible. */
const HAUTEUR_MINIMALE = 6;

/**
 * Carte des gains du jour, avec l'historique récent en barres.
 *
 *   <app-earnings-card [earnings]="gains()" />
 *
 * Le graphique est dessiné en **HTML et CSS**, sans bibliothèque. Six barres
 * proportionnelles ne justifient pas d'embarquer Chart.js ou ngx-charts, qui
 * coûteraient 50 à 200 ko au premier rendu — indéfendable sur la 3G visée par
 * le cahier des charges, pour un rendu identique.
 *
 * Le graphique est **résumé en texte** juste avant, à l'usage des lecteurs
 * d'écran : une suite de barres colorées ne dit rien à qui ne les voit pas.
 */
@Component({
  selector: 'app-earnings-card',
  imports: [Icon],
  templateUrl: './earnings-card.html',
  styleUrl: './earnings-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-earnings',
  },
})
export class EarningsCard {
  readonly earnings = input.required<EarningsSummary>();

  /** `true` si les gains progressent, ce qui change la couleur et le pictogramme. */
  protected readonly enHausse = computed(() => this.earnings().trendPercent >= 0);

  /**
   * Hauteurs relatives au meilleur jour de la période.
   *
   * Rapportées au maximum et non à une échelle fixe : le mécanicien compare
   * ses journées entre elles, pas à un objectif abstrait.
   */
  protected readonly barres = computed<Barre[]>(() => {
    const points = this.earnings().points;
    const maximum = Math.max(...points.map((p) => p.amountXOF), 1);

    return points.map((point, index) => ({
      label: point.label,
      amountXOF: point.amountXOF,
      heightPercent: Math.max(HAUTEUR_MINIMALE, (point.amountXOF / maximum) * 100),
      isLast: index === points.length - 1,
    }));
  });

  /** Résumé lu par les lecteurs d'écran à la place du graphique. */
  protected readonly resumeAccessible = computed(() =>
    this.barres()
      .map((barre) => `${barre.label} : ${separerMilliers(barre.amountXOF)} francs CFA`)
      .join(', '),
  );

  /** Réexposé au gabarit : la mise en forme est commune à tout le projet. */
  protected readonly separerMilliers = separerMilliers;
}
