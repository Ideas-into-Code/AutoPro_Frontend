import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const ONBOARDING_SEEN_KEY = 'autopro_onboarding_seen';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly platformId = inject(PLATFORM_ID);

  // Signal réactif indiquant si l'onboarding a été vu
  private readonly _hasSeenOnboarding = signal<boolean>(this.checkIfSeen());
  public readonly hasSeenOnboarding = this._hasSeenOnboarding.asReadonly();

  /**
   * Marque l'onboarding comme vu et sauvegarde dans le localStorage
   */
  markAsSeen(): void {
    this._hasSeenOnboarding.set(true);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
      } catch {
        // En cas de restriction d'accès au localStorage
      }
    }
  }

  /**
   * Réinitialise l'état pour les tests (re-afficher l'onboarding)
   */
  reset(): void {
    this._hasSeenOnboarding.set(false);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(ONBOARDING_SEEN_KEY);
      } catch {
        // Stockage local refusé par le navigateur : l'état en mémoire suffit.
      }
    }
  }

  private checkIfSeen(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true';
      } catch {
        return false;
      }
    }
    return false;
  }
}
