import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Coquille de page : assemble en-tête, contenu principal et pied de page.
 *
 *   <app-page-shell>
 *     <app-header header brand="AutoPro">…</app-header>
 *     <h1>Mécaniciens à proximité</h1>
 *     <app-footer footer />
 *   </app-page-shell>
 *
 * Purement structurel : aucune connaissance de l'en-tête ni du pied de page
 * concrets, qui sont projetés. Le back-office pourra ainsi remplacer
 * l'en-tête public par une barre d'administration sans toucher à ce composant
 * (principe ouvert/fermé).
 */
@Component({
  selector: 'app-page-shell',
  templateUrl: './page-shell.html',
  styleUrl: './page-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-page-shell',
  },
})
export class PageShell {}
