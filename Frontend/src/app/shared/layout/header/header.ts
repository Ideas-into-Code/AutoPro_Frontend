import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/**
 * En-tête applicatif : marque, navigation et zone d'actions.
 *
 *   <app-header brand="AutoPro">
 *     <a nav routerLink="/mecaniciens">Mécaniciens</a>
 *     <button appButton actions size="sm">Se connecter</button>
 *   </app-header>
 *
 * Ne connaît ni les routes ni l'utilisateur connecté : les liens et les
 * actions sont projetés par l'appelant. C'est ce qui permet de réutiliser le
 * même en-tête pour l'espace client, l'espace mécanicien et le back-office,
 * chacun avec sa propre navigation.
 *
 * Le repli de la navigation en mobile est un état purement visuel, donc porté
 * localement par un signal plutôt que par un service.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-header',
  },
})
export class Header {
  readonly brand = input('AutoPro');

  /** Masque le déclencheur de menu quand aucune navigation n'est projetée. */
  readonly showNavToggle = input(true);

  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
