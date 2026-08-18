import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Button } from '@shared/ui';
import { NewRequest, RequestDecision } from '../../models/mechanic-dashboard.model';

/**
 * Popup proposant une nouvelle demande au mécanicien.
 *
 *   <app-new-request-dialog
 *     [request]="demande()"
 *     [pending]="envoiDecision()"
 *     (decided)="repondre($event)"
 *   />
 *
 * Repose sur l'élément **`<dialog>` natif**, ouvert en mode modal. Il apporte
 * sans une ligne de code : le piégeage du focus, la fermeture par Échap, le
 * fond inerte, le rôle ARIA et la restitution du focus à la fermeture. Une
 * popup reconstruite avec un `<div>` et un `position: fixed` perd tout cela,
 * et laisse la navigation au clavier s'échapper derrière l'overlay.
 *
 * La popup ne décide de rien : elle émet le choix du mécanicien. C'est l'écran
 * qui appelle le dépôt et gère l'échec.
 */
@Component({
  selector: 'app-new-request-dialog',
  imports: [Button],
  templateUrl: './new-request-dialog.html',
  styleUrl: './new-request-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewRequestDialog {
  /** Demande à proposer. `null` ferme la popup. */
  readonly request = input.required<NewRequest | null>();

  /** Neutralise les deux boutons pendant l'envoi de la décision. */
  readonly pending = input(false);

  readonly decided = output<RequestDecision>();

  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  protected readonly montantFormate = computed(() =>
    (this.request()?.estimatedPayoutXOF ?? 0)
      .toLocaleString('fr-FR')
      .replace(/[\u00A0\u202F\u2009]/g, ' '),
  );

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      const doitEtreOuvert = this.request() !== null;

      // Le DOM du rendu serveur n'implémente pas `showModal()` : l'appeler
      // pendant le prérendu interrompt la génération de la page. La popup
      // n'aurait de toute façon aucun sens sans interaction.
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      const element = this.dialogue().nativeElement;

      // `showModal()` est refusé si la boîte est déjà ouverte, et `close()`
      // sur une boîte fermée est sans effet : on compare avant d'agir.
      if (doitEtreOuvert && !element.open) {
        element.showModal();
      } else if (!doitEtreOuvert && element.open) {
        element.close();
      }
    });
  }

  protected repondre(decision: RequestDecision): void {
    this.decided.emit(decision);
  }

  /**
   * Échap ferme la boîte nativement. On le traduit en refus explicite, sinon
   * la demande resterait affichée sans que le serveur en sache rien.
   */
  protected surFermetureNative(): void {
    if (this.request() !== null) {
      this.decided.emit('refusee');
    }
  }
}
