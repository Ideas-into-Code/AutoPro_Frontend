import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import { PositionProvider } from '@core';
import { AuthService } from '@core/services/auth.service';

import { ProfileRepository } from '../../data/profile.repository';
import { AccountPatch, MechanicPatch, Profile } from '../../models/profile.model';
import { ProfilePage } from './profile';

const CLIENT: Profile = {
  account: { firstName: 'Awa', lastName: 'Sow', phone: '77', email: 'awa@sn', role: 'client' },
  mechanic: null,
};

const MECANO: Profile = {
  account: { firstName: 'Modou', lastName: 'Ba', phone: '', email: 'm@sn', role: 'mecanicien' },
  mechanic: {
    specialization: 'Freinage',
    experienceYears: 5,
    bio: '',
    isAvailable: false,
    isVerified: true,
    latitude: null,
    longitude: null,
  },
};

class FakeRepo extends ProfileRepository {
  constructor(private readonly profile: Profile) {
    super();
  }
  accountPatches: AccountPatch[] = [];
  mechanicPatches: MechanicPatch[] = [];

  load(): Observable<Profile> {
    return of(this.profile);
  }
  saveAccount(patch: AccountPatch): Observable<Profile> {
    this.accountPatches.push(patch);
    return of(this.profile);
  }
  saveMechanic(patch: MechanicPatch): Observable<Profile> {
    this.mechanicPatches.push(patch);
    return of(this.profile);
  }
}

class FakePositions extends PositionProvider {
  next: 'ok' | 'fail' = 'ok';
  current(): Observable<{ latitude: number; longitude: number; accuracyMeters: number }> {
    return this.next === 'ok'
      ? of({ latitude: 14.693, longitude: -17.444, accuracyMeters: 10 })
      : throwError(() => new Error('refusee'));
  }
}

const authStub = { refreshCurrentUser: () => of(null) } as unknown as AuthService;

async function render(repo: ProfileRepository, positions = new FakePositions()) {
  await TestBed.configureTestingModule({
    imports: [ProfilePage],
    providers: [
      { provide: ProfileRepository, useValue: repo },
      { provide: PositionProvider, useValue: positions },
      { provide: AuthService, useValue: authStub },
    ],
  }).compileComponents();
  const fixture: ComponentFixture<ProfilePage> = TestBed.createComponent(ProfilePage);
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

const hote = (f: ComponentFixture<ProfilePage>) => f.nativeElement as HTMLElement;
const bouton = (f: ComponentFixture<ProfilePage>, label: string) =>
  [...hote(f).querySelectorAll('button')].find((b) => b.textContent?.includes(label)) as HTMLButtonElement;

describe('ProfilePage', () => {
  it('n’affiche pas la fiche mécanicien pour un client', async () => {
    const fixture = await render(new FakeRepo(CLIENT));
    expect(hote(fixture).textContent).toContain('Compte');
    expect(hote(fixture).textContent).not.toContain('Fiche mécanicien');
  });

  it('préremplit et enregistre le compte', async () => {
    const repo = new FakeRepo(CLIENT);
    const fixture = await render(repo);

    const prenom = hote(fixture).querySelector<HTMLInputElement>('input[formControlName="firstName"]')!;
    expect(prenom.value).toBe('Awa');

    prenom.value = 'Awa II';
    prenom.dispatchEvent(new Event('input'));
    bouton(fixture, 'Enregistrer').click();
    await fixture.whenStable();

    expect(repo.accountPatches).toEqual([{ firstName: 'Awa II', lastName: 'Sow', phone: '77' }]);
  });

  it('affiche la fiche mécanicien et capture la position GPS', async () => {
    const repo = new FakeRepo(MECANO);
    const fixture = await render(repo);

    expect(hote(fixture).textContent).toContain('Fiche mécanicien');

    bouton(fixture, 'Utiliser ma position actuelle').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(hote(fixture).textContent).toContain('14.693');

    bouton(fixture, 'Enregistrer la fiche').click();
    await fixture.whenStable();

    expect(repo.mechanicPatches[0].latitude).toBe(14.693);
    expect(repo.mechanicPatches[0].longitude).toBe(-17.444);
  });
});
