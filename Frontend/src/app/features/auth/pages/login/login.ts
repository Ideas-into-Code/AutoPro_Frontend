import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Écran d'arrivée après une connexion réussie.
 *
 * Menait auparavant à la sélection de rôle, qui enchaîne sur l'inscription :
 * l'utilisateur qui venait de se connecter était renvoyé au début du tunnel
 * d'inscription, sans issue. L'accueil client (ticket #6) est la première
 * destination réelle disponible.
 */
const ECRAN_APRES_CONNEXION = '/accueil';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Tab State: 'email' | 'phone'
  protected readonly activeTab = signal<'email' | 'phone'>('email');

  // Password Visibility State
  protected readonly showPassword = signal(false);

  // Loading & Error States
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);

  // Form Definitions with typed AbstractControl
  protected readonly emailForm = this.fb.group({
    email: [
      '',
      [(c: AbstractControl) => Validators.required(c), (c: AbstractControl) => Validators.email(c)],
    ],
    password: [
      '',
      [
        (c: AbstractControl) => Validators.required(c),
        (c: AbstractControl) => Validators.minLength(8)(c),
      ],
    ],
  });

  protected readonly phoneForm = this.fb.group({
    countryCode: ['+221', [(c: AbstractControl) => Validators.required(c)]],
    phoneNumber: [
      '',
      [
        (c: AbstractControl) => Validators.required(c),
        (c: AbstractControl) => Validators.pattern(/^[0-9]{9}$/)(c),
      ],
    ],
  });

  setTab(tab: 'email' | 'phone'): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.activeTab() === 'email') {
      if (this.emailForm.invalid) {
        this.emailForm.markAllAsTouched();
        return;
      }
    } else {
      if (this.phoneForm.invalid) {
        this.phoneForm.markAllAsTouched();
        return;
      }
    }

    // Le backend n'accepte que la connexion par e-mail pour l'instant.
    if (this.activeTab() !== 'email') {
      this.errorMessage.set(
        'La connexion par téléphone arrive bientôt. Utilisez votre adresse e-mail.',
      );
      return;
    }

    this.isLoading.set(true);

    const email = this.emailForm.value.email!;
    const password = this.emailForm.value.password!;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.router.navigate([this.destinationParRole()]);
      },
      error: (err: { message?: string }) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message ?? 'Échec de la connexion.');
      },
    });
  }

  /** Écran d'arrivée selon le rôle renvoyé par le backend. */
  private destinationParRole(): string {
    switch (this.authService.userRole()) {
      case 'admin':
        return '/admin';
      case 'mecanicien':
        return '/mecanicien';
      default:
        return ECRAN_APRES_CONNEXION;
    }
  }

  onSocialLogin(_provider: 'google' | 'apple'): void {
    this.errorMessage.set("La connexion via un réseau social n'est pas encore disponible.");
  }

  onForgotPassword(): void {
    const email = this.emailForm.value.email;
    if (!email) {
      this.errorMessage.set('Saisissez votre adresse e-mail puis cliquez sur « mot de passe oublié ».');
      return;
    }
    this.errorMessage.set(null);
    this.authService.requestPasswordReset(email).subscribe({
      next: () =>
        this.infoMessage.set(
          'Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.',
        ),
      error: () =>
        this.infoMessage.set(
          'Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.',
        ),
    });
  }
}
