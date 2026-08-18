import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Compteur de module : un identifiant unique par bascule affichée. */
let prochainId = 0;

/**
 * Bascule de disponibilité du mécanicien.
 *
 *   <app-availability-toggle
 *     [isOnline]="enLigne()"
 *     [pending]="enregistrement()"
 *     (toggled)="changerDisponibilite($event)"
 *   />
 *
 * Repose sur une **case à cocher native** habillée en interrupteur, et non sur
 * un `<div>` cliquable : on récupère ainsi gratuitement la navigation au
 * clavier, la barre d'espace, l'annonce de l'état par les lecteurs d'écran et
 * le respect des préférences système. Un interrupteur reconstruit à la main
 * perd les quatre.
 *
 * Le composant ne décide pas : il émet l'intention. C'est l'écran qui appelle
 * le dépôt, et qui reste maître de ce qui se passe en cas d'échec.
 */
@Component({
  selector: 'app-availability-toggle',
  templateUrl: './availability-toggle.html',
  styleUrl: './availability-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-availability',
  },
})
export class AvailabilityToggle {
  readonly isOnline = input.required<boolean>();

  /** Neutralise la bascule pendant l'enregistrement, pour éviter les doubles clics. */
  readonly pending = input(false);

  readonly toggled = output<boolean>();

  protected readonly fieldId = `ap-availability-${prochainId++}`;

  /**
   * Le titre annonce l'action à venir, pas l'état courant : « Passer hors
   * ligne » quand on est en ligne. C'est ce que la maquette montre, et c'est
   * ce qu'attend quelqu'un qui cherche à se rendre indisponible.
   */
  protected readonly titre = computed(() =>
    this.isOnline() ? 'Passer hors ligne ?' : 'Repasser en ligne ?',
  );

  protected readonly aide = computed(() =>
    this.isOnline()
      ? 'Désactivez pour cesser de recevoir des demandes.'
      : 'Activez pour recevoir de nouvelles demandes.',
  );

  protected surChangement(coche: boolean): void {
    this.toggled.emit(coche);
  }
}
