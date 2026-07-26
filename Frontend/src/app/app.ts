import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Racine de l'application. Ne porte aucune logique métier : elle se contente
 * d'exposer le point de montage du routeur. La coquille visuelle (header,
 * navigation, footer) est fournie par les composants de `shared/layout`.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
