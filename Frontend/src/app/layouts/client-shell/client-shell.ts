import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { NotificationBell } from '@features/notifications/components/notification-bell/notification-bell';
import { BottomNav, BottomNavItem, Footer, Header, PageShell } from '@shared/layout';
import { Button } from '@shared/ui';

/**
 * Coquille de l'espace client : en-tête, navigation, contenu, pied de page.
 *
 * Composant **routé** : les écrans deviennent ses enfants et ne rendent que
 * leur contenu — la navigation survit au changement de page, l'en-tête n'est
 * ni recopié ni reconstruit.
 *
 * Placé dans `layouts/` et non dans `shared/layout/` : c'est le seul composant
 * de mise en page qui **connaisse les routes et l'utilisateur connecté**.
 * `shared/` n'héberge que des briques neutres (CONVENTIONS.md §1).
 */
@Component({
  selector: 'app-client-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    PageShell,
    Header,
    Footer,
    Button,
    BottomNav,
    NotificationBell,
  ],
  templateUrl: './client-shell.html',
  styleUrl: './client-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientShell {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navItems: readonly BottomNavItem[] = [
    { label: 'Accueil', icon: 'accueil', link: '/accueil' },
    { label: 'Mécanos', icon: 'cle', link: '/mecaniciens' },
    { label: 'Carte', icon: 'carte', link: '/carte' },
    { label: 'Demandes', icon: 'liste', link: '/demandes' },
    { label: 'Messages', icon: 'message', link: '/messages' },
  ];

  protected deconnexion(): void {
    this.auth.logout();
    void this.router.navigate(['/compte/connexion']);
  }
}
