import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Avatar, Button, PhotoUpload, RatingStars, Spinner } from '@shared/ui';
import { ReviewSubmissionRepository, ReviewTargetRepository } from '../../data/review.repository';
import { COMMENTAIRE_MAX, LIBELLES_NOTE, ReviewTarget } from '../../models/review.model';

/**
 * Formulaire d'avis post-service — ticket #26.
 *
 * Les deux tâches du ticket sont ici : la note commentée, et les photos en
 * preuve du travail.
 *
 * **Pas de formulaire réactif**, contrairement au reste du projet, et c'est
 * délibéré : deux champs dont un seul contraint, plus une liste de fichiers
 * qu'un `FormControl` ne peut de toute façon pas porter. Un `FormGroup` ici
 * n'apporterait que de la cérémonie — la règle « note obligatoire » tient en
 * une ligne, et le bouton la traduit en s'activant.
 */
@Component({
  selector: 'app-review-form',
  imports: [Avatar, Button, PhotoUpload, RatingStars, Spinner, RouterLink, LowerCasePipe],
  templateUrl: './review-form.html',
  styleUrl: './review-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewFormPage {
  private readonly cibles = inject(ReviewTargetRepository);
  private readonly envois = inject(ReviewSubmissionRepository);

  protected readonly libelles = LIBELLES_NOTE;
  protected readonly commentaireMax = COMMENTAIRE_MAX;

  // Le paramètre générique est explicite : sans lui, `defaultValue: null`
  // serait confronté au seul type `ReviewTarget` et refusé.
  protected readonly cibleResource = rxResource<ReviewTarget | null, unknown>({
    stream: () => this.cibles.pending(),
    defaultValue: null,
  });

  protected readonly chargementFailed = computed(() => this.cibleResource.error() !== undefined);

  // --- Saisie ---------------------------------------------------------------

  protected readonly note = signal(0);
  protected readonly commentaire = signal('');
  protected readonly photos = signal<readonly File[]>([]);

  protected readonly caracteres = computed(() => this.commentaire().length);

  /**
   * Seule la note est exigée.
   *
   * Un commentaire obligatoire ferait écrire n'importe quoi à qui veut
   * simplement mettre cinq étoiles, et une étoile sans mot reste une
   * information exploitable.
   */
  protected readonly peutEnvoyer = computed(() => this.note() > 0 && !this.envoiEnCours());

  protected readonly envoiEnCours = signal(false);
  protected readonly envoye = signal(false);
  protected readonly erreur = signal<string | null>(null);

  // --- Actions --------------------------------------------------------------

  protected noter(note: number): void {
    this.note.set(note);
    this.erreur.set(null);
  }

  protected saisirCommentaire(texte: string): void {
    // Coupé à la source plutôt que refusé après coup : le compteur ne peut
    // alors jamais afficher un dépassement, et le serveur ne reçoit rien
    // qu'il devrait rejeter.
    this.commentaire.set(texte.slice(0, COMMENTAIRE_MAX));
  }

  protected changerPhotos(photos: readonly File[]): void {
    this.photos.set(photos);
  }

  protected envoyer(): void {
    const cible = this.cibleResource.value();

    // Garde de sûreté : le bouton est déjà neutralisé dans ces deux cas.
    if (cible === null || !this.peutEnvoyer()) {
      return;
    }

    this.envoiEnCours.set(true);
    this.erreur.set(null);

    this.envois
      .submit({
        interventionId: cible.interventionId,
        rating: this.note(),
        comment: this.commentaire().trim(),
        photos: this.photos(),
      })
      .subscribe({
        next: () => {
          this.envoiEnCours.set(false);
          this.envoye.set(true);
        },
        error: () => {
          // La saisie est conservée : refaire une note et un commentaire perdus
          // par une coupure réseau est le meilleur moyen de n'avoir aucun avis.
          this.envoiEnCours.set(false);
          this.erreur.set("Votre avis n'a pas pu être envoyé. Vérifiez votre connexion.");
        },
      });
  }

  protected reessayerChargement(): void {
    this.cibleResource.reload();
  }
}
