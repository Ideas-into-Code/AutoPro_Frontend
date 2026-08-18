import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

/**
 * Identité d'une personne : pastille de profil suivie de ses initiales.
 *
 *   <app-avatar name="Mohamed Badji" />   → ⬤ MB
 *
 * Aucune photo : elle demanderait un stockage, une requête réseau de plus au
 * premier écran, et un repli à dessiner quand elle manque. La silhouette et
 * deux initiales suffisent à identifier qui est connecté, et se rendent
 * instantanément.
 *
 * Le nom complet reste **annoncé aux lecteurs d'écran** sans être affiché :
 * « M, B » épelé n'apprendrait rien à qui ne voit pas la pastille.
 */
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-avatar',
    '[class.ap-avatar--sm]': 'size() === "sm"',
    '[class.ap-avatar--md]': 'size() === "md"',
    '[class.ap-avatar--lg]': 'size() === "lg"',
  },
})
export class Avatar {
  readonly name = input.required<string>();

  readonly size = input<AvatarSize>('md');

  /**
   * Prénom et nom de famille, soit le **premier et le dernier** mot.
   *
   * Et non les deux premiers : « Mohamed El Fadel Badji » donnerait « ME »,
   * alors que l'usage attend « MB ». Les noms à particule ou à prénom composé
   * sont fréquents ici, la règle doit les absorber.
   */
  protected readonly initiales = computed(() => {
    const mots = this.name()
      .split(/\s+/)
      .filter((mot) => mot.length > 0);

    if (mots.length === 0) {
      return '?';
    }

    const premiere = mots[0].charAt(0).toUpperCase();

    if (mots.length === 1) {
      return premiere;
    }

    return premiere + mots[mots.length - 1].charAt(0).toUpperCase();
  });
}
