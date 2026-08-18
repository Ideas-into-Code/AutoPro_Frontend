import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export type UserRole = 'client' | 'mecanicien';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-selection.html',
  styleUrls: ['./role-selection.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleSelectionComponent {
  private readonly router = inject(Router);

  protected readonly selectedRole = signal<UserRole | null>(null);

  selectRole(role: UserRole): void {
    this.selectedRole.set(role);
    void this.router.navigate(['/compte/inscription'], {
      queryParams: { role },
    });
  }

  onLogin(): void {
    void this.router.navigate(['/compte/connexion']);
  }
}
