import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button } from '../../ui/button/button';

/**
 * Page affichée par la route joker `**`.
 *
 * Placée dans `shared/` et non dans une feature : elle n'appartient à aucun
 * domaine métier et sert de repli à toute l'application.
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Button],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-not-found',
  },
})
export class NotFound {}
