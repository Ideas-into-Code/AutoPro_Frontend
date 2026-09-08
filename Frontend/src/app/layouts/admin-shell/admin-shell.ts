import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { Footer, Header, PageShell } from '@shared/layout';
import { Avatar } from '@shared/ui';

/**
 * Coquille du back-office.
 *
 * Assemble **les mêmes briques que les coquilles client et mécanicien** —
 * `PageShell`, `Header`, `Footer` — et n'en change que le contenu projeté.
 * L'administrateur retrouve donc la même barre, le même pied de page et les
 * mêmes proportions ; seuls les liens diffèrent. C'est précisément ce pour quoi
 * ces composants avaient été écrits sans connaître les routes.
 *
 * Distincte des deux autres pour la même raison qu'elles le sont entre elles :
 * **tous les liens restent sous `/admin`**. Le back-office était jusqu'ici un
 * enfant de la coquille client, et proposait donc « Mécaniciens » ou « Mes
 * demandes » à un administrateur — les entrées de quelqu'un qui *cherche* un
 * mécanicien, pas de celui qui les valide.
 *
 * Pas de barre basse ici, contrairement à l'espace mécanicien : le ticket #17
 * vise explicitement le **web**, et une table de six colonnes se consulte sur
 * un écran large.
 */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PageShell, Header, Footer, Avatar],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected deconnexion(): void {
    this.auth.logout();
    void this.router.navigate(['/compte/connexion']);
  }

  /**
   * Nom de l'administrateur connecté.
   *
   * Repli sur un libellé neutre tant que personne n'est authentifié : le
   * back-office est souvent ouvert sur un poste partagé, et la barre doit dire
   * *qui* agit — c'est lui qui suspend des comptes.
   */
  protected readonly nomAffiche = computed(
    () => this.auth.currentUser()?.fullName ?? 'Administrateur',
  );
}
