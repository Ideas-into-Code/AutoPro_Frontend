import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Footer, Header, PageShell } from '@shared/layout';
import { Button } from '@shared/ui';

/**
 * Coquille de l'espace client : en-tête, navigation, contenu, pied de page.
 *
 * Composant **routé** : les écrans deviennent ses enfants et ne rendent que
 * leur contenu. Trois conséquences, toutes voulues :
 *
 *   - la navigation **survit au changement de page**, y compris vers une route
 *     sans écran ou vers la 404. Auparavant chaque page rendait son propre
 *     en-tête, si bien qu'atterrir sur un domaine encore vide laissait une page
 *     entièrement blanche, sans aucun moyen de repartir ;
 *   - l'en-tête n'est plus recopié dans chaque gabarit — il l'était trois fois,
 *     et une quatrième aurait suivi à chaque nouvel écran ;
 *   - l'en-tête n'est pas détruit puis reconstruit à chaque navigation, donc
 *     pas de scintillement du menu.
 *
 * Placé dans `layouts/` et non dans `shared/layout/` : c'est le seul composant
 * de mise en page qui **connaisse les routes** de l'application. `shared/`
 * n'héberge que des briques ignorantes du métier et de la navigation
 * (CONVENTIONS.md §1) — `Header` reste d'ailleurs neutre, ce sont bien les
 * liens ci-dessous qui lui sont projetés.
 *
 * L'onboarding et l'authentification restent hors de cette coquille : ce sont
 * des parcours plein écran, sans navigation, et en afficher une inviterait à
 * quitter un tunnel qu'on veut voir terminé.
 */
@Component({
  selector: 'app-client-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PageShell, Header, Footer, Button],
  templateUrl: './client-shell.html',
  styleUrl: './client-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientShell {}
