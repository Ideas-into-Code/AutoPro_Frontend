import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Rappel de ce qui se passe une fois la demande envoyée.
 *
 * Extrait du formulaire pour deux raisons. La première est de séparation :
 * l'écran orchestre la saisie et l'envoi, il n'a pas à porter en plus le
 * contenu explicatif. La seconde est mesurable — le style du formulaire
 * dépassait le budget de 4 ko fixé dans `angular.json`, et un bloc autonome
 * emporte sa propre feuille avec lui.
 *
 * Purement informatif : aucune entrée, aucune sortie, aucun état.
 */
@Component({
  selector: 'app-next-steps',
  templateUrl: './next-steps.html',
  styleUrl: './next-steps.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-next-steps',
  },
})
export class NextSteps {}
