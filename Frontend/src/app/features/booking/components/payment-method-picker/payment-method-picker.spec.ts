import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentMethod, PaymentMethodId } from '../../models/booking.model';
import { PaymentMethodPicker } from './payment-method-picker';

const MOYENS: readonly PaymentMethod[] = [
  { id: 'wave', label: 'Wave', hint: 'Via l’application Wave.', available: true },
  { id: 'orange-money', label: 'Orange Money', hint: 'Code par SMS.', available: true },
  { id: 'carte', label: 'Carte bancaire', hint: 'Visa et Mastercard.', available: false },
];

describe('PaymentMethodPicker', () => {
  let fixture: ComponentFixture<PaymentMethodPicker>;
  let emis: PaymentMethodId[];

  const rendre = async (
    selected: PaymentMethodId | null = null,
    disabled = false,
  ): Promise<void> => {
    fixture = TestBed.createComponent(PaymentMethodPicker);
    fixture.componentRef.setInput('methods', MOYENS);
    fixture.componentRef.setInput('selected', selected);
    fixture.componentRef.setInput('disabled', disabled);

    emis = [];
    fixture.componentInstance.methodChange.subscribe((m) => emis.push(m));

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const radios = (): HTMLInputElement[] => [
    ...hote().querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaymentMethodPicker] }).compileComponents();
  });

  it('propose un vrai groupe de boutons radio', async () => {
    await rendre();

    // De vrais radios, pour hériter du parcours aux flèches, de l'annonce
    // « 1 sur 3 » et de l'exclusivité du choix sans les réécrire.
    expect(radios()).toHaveLength(3);
    expect(new Set(radios().map((r) => r.name)).size).toBe(1);
  });

  it('désactive un moyen indisponible sans le masquer', async () => {
    await rendre();

    // Masqué, le client croirait que la carte n'est pas acceptée du tout.
    expect(radios()[2].disabled).toBe(true);
    expect(hote().textContent).toContain('Carte bancaire');
    expect(hote().textContent).toContain('Momentanément indisponible');
  });

  it('émet le moyen retenu', async () => {
    await rendre();

    radios()[1].click();

    expect(emis).toEqual(['orange-money']);
  });

  it('coche celui que lui donne l’écran', async () => {
    await rendre('wave');

    expect(radios()[0].checked).toBe(true);
    expect(radios()[1].checked).toBe(false);
  });

  it('neutralise tout le groupe pendant l’envoi', async () => {
    await rendre('wave', true);

    // Neutralisé par le `<fieldset>`, qui désactive ses descendants d'un seul
    // attribut. On vérifie donc le groupe et non chaque `input.disabled` :
    // cette propriété ne reflète que l'attribut porté par le champ lui-même,
    // jamais celui hérité du groupe.
    const groupe = hote().querySelector('fieldset') as HTMLFieldSetElement;

    expect(groupe.disabled).toBe(true);
    // Sans cela, changer de moyen pendant qu'un paiement part enverrait une
    // seconde demande sur la même réservation.
    expect(radios()[1].matches(':disabled')).toBe(true);
  });
});
