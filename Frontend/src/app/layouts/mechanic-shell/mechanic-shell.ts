import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Icon } from '@shared/ui';

/**
 * Coquille de l'espace mécanicien : barre de marque, contenu, navigation basse.
 *
 * Distincte de `ClientShell`, et c'est tout l'objet de ce composant. Le
 * tableau de bord était initialement rendu sous la coquille client, dont il
 * héritait le menu — « Mécaniciens », « Mes demandes »… — c'est-à-dire la
 * navigation de quelqu'un qui *cherche* un mécanicien, proposée à un
 * mécanicien. Deux personas, deux navigations.
 *
 * Navigation basse plutôt que latérale : le mécanicien consulte son tableau de
 * bord au téléphone, souvent debout devant un véhicule. C'est ce que montre la
 * maquette, et ce que le pouce atteint.
 */
@Component({
  selector: 'app-mechanic-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './mechanic-shell.html',
  styleUrl: './mechanic-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MechanicShell {}
