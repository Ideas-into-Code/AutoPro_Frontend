import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Pied de page applicatif.
 *
 *   <app-footer>
 *     <a link routerLink="/mentions-legales">Mentions légales</a>
 *   </app-footer>
 *
 * Les liens sont projetés par l'appelant, pour la même raison que dans
 * l'en-tête : le back-office et l'espace public n'affichent pas les mêmes.
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-footer',
  },
})
export class Footer {
  readonly brand = input('AutoPro');

  /**
   * Année affichée dans la mention de droits. L'année courante par défaut,
   * surchargeable en entrée pour rendre un test déterministe ou pour figer
   * l'affichage depuis l'appelant.
   */
  readonly year = input(new Date().getFullYear());
}
