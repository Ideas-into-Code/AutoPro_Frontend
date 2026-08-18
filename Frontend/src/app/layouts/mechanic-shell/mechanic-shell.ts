import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { BottomNav, BottomNavItem, Footer, Header, PageShell } from '@shared/layout';

/**
 * Coquille de l'espace mécanicien.
 *
 * Assemble **les mêmes briques que la coquille client** — `PageShell`,
 * `Header`, `Footer` — et n'en change que le contenu projeté. Le mécanicien
 * retrouve donc exactement la même barre, le même pied de page et les mêmes
 * proportions ; seuls les liens diffèrent. C'est précisément ce pour quoi ces
 * composants avaient été écrits sans connaître les routes.
 *
 * Distincte de `ClientShell` malgré tout, pour deux raisons :
 *
 *   - la navigation n'est pas la même. Proposer « Mécaniciens » ou « Mes
 *     demandes » à un mécanicien n'a pas de sens : ce sont les entrées de
 *     quelqu'un qui *cherche* un mécanicien ;
 *   - **tous les liens restent sous `/mecanicien`**. Une barre qui renverrait
 *     vers `/carte` ou `/demandes` ferait basculer le mécanicien dans l'espace
 *     client sans qu'il s'en aperçoive, coquille comprise.
 */
@Component({
  selector: 'app-mechanic-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PageShell, Header, Footer, BottomNav],
  templateUrl: './mechanic-shell.html',
  styleUrl: './mechanic-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MechanicShell {
  private readonly auth = inject(AuthService);

  /**
   * Nom du mécanicien connecté, affiché à la place d'une mention générique.
   *
   * « Espace mécanicien » n'apprenait rien : la barre indique désormais *qui*
   * est connecté, ce qui compte davantage sur un poste partagé en atelier.
   * Repli sur un libellé neutre tant que personne n'est authentifié.
   */
  protected readonly nomAffiche = computed(() => this.auth.currentUser()?.fullName ?? 'Mécanicien');

  /**
   * Entrées de la barre basse, toutes sous `/mecanicien`.
   *
   * Le tableau de bord est marqué `exact` : sans cela, il resterait actif sur
   * toutes les pages de l'espace, puisque son chemin les préfixe toutes.
   */
  protected readonly navItems: readonly BottomNavItem[] = [
    { label: 'Tableau de bord', icon: 'accueil', link: '/mecanicien', exact: true },
    { label: 'Interventions', icon: 'cle', link: '/mecanicien/interventions' },
    { label: 'Tarifs', icon: 'tendance', link: '/mecanicien/tarifs' },
    { label: 'Profil', icon: 'profil', link: '/mecanicien/profil' },
  ];
}
