import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

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

  // Form Definitions with typed AbstractControl
  protected readonly emailForm = this.fb.group({
    email: [
      '',
      [
        (c: AbstractControl) => Validators.required(c),
        (c: AbstractControl) => Validators.email(c),
      ],
    ],
    password: [
      '',
      [
        (c: AbstractControl) => Validators.required(c),
        (c: AbstractControl) => Validators.minLength(6)(c),
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

    this.isLoading.set(true);

    const identifier =
      this.activeTab() === 'email'
        ? this.emailForm.value.email!
        : `${this.phoneForm.value.countryCode}${this.phoneForm.value.phoneNumber}`;

    const password = this.emailForm.value.password ?? 'password123';

    // Appel du service d'authentification mock
    this.authService.login(identifier, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.router.navigate(['/compte/selection-role']);
      },
      error: (err: { message?: string }) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message ?? 'Échec de la connexion.');
      },
    });
  }

  onSocialLogin(_provider: 'google' | 'apple'): void {
    this.isLoading.set(true);
    this.authService.login('moussa@example.sn', 'social-auth').subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.router.navigate(['/compte/selection-role']);
      },
    });
  }

  onForgotPassword(): void {
    alert('Un lien de réinitialisation sera envoyé à votre adresse e-mail.');
  }
}

