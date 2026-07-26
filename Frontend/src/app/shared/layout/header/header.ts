import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

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

  private readonly router = inject(Router);

  constructor() {
    // Referme le menu mobile après une navigation. On s'appuie sur le routeur
    // plutôt que sur un clic posé sur le <nav> : un gestionnaire de clic sur un
    // élément non interactif est inatteignable au clavier, ce que le lint
    // d'accessibilité signale à juste titre.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }
}
