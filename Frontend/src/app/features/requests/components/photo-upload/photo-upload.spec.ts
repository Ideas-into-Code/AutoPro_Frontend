import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoUpload } from './photo-upload';

/** Construit un fichier de type et de poids choisis, sans lire de disque. */
const fichier = (nom: string, type: string, octets = 1024): File =>
  new File([new Uint8Array(octets)], nom, { type });

/**
 * `FileList` n'est pas constructible : on fournit un objet « tableau-like »,
 * ce qu'attend `Array.from` dans le composant.
 */
const listeDeFichiers = (fichiers: File[]): FileList => ({
  // Les index d'abord, `length` ensuite : l'inverse ferait écraser `length`
  // par la diffusion du tableau.
  ...fichiers,
  length: fichiers.length,
  item: (index: number): File | null => fichiers[index] ?? null,
  [Symbol.iterator]: (): ArrayIterator<File> => fichiers[Symbol.iterator](),
});

describe('PhotoUpload', () => {
  let fixture: ComponentFixture<PhotoUpload>;
  let emis: File[][];

  const rendre = async (maxPhotos = 3, maxSizeMo = 5): Promise<void> => {
    fixture = TestBed.createComponent(PhotoUpload);
    fixture.componentRef.setInput('maxPhotos', maxPhotos);
    fixture.componentRef.setInput('maxSizeMo', maxSizeMo);

    emis = [];
    fixture.componentInstance.photosChange.subscribe((photos) => emis.push([...photos]));

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const champ = (): HTMLInputElement =>
    hote().querySelector('input[type="file"]') as HTMLInputElement;

  const deposer = async (fichiers: File[]): Promise<void> => {
    Object.defineProperty(champ(), 'files', {
      value: listeDeFichiers(fichiers),
      configurable: true,
    });
    champ().dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };

  const vignettes = (): NodeListOf<Element> => hote().querySelectorAll('.ap-photo-upload__thumb');

  const erreurs = (): string => hote().querySelector('[role="alert"]')?.textContent ?? '';

  beforeEach(async () => {
    // On espionne les deux méthodes plutôt que de remplacer le global `URL` :
    // le substituer en entier le priverait de son constructeur et casserait
    // tous les autres fichiers de test de la campagne.
    URL.createObjectURL ??= (): string => '';
    URL.revokeObjectURL ??= (): void => undefined;

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:apercu');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({ imports: [PhotoUpload] }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepte une image et affiche son aperçu', async () => {
    await rendre();
    await deposer([fichier('panne.jpg', 'image/jpeg')]);

    expect(vignettes().length).toBe(1);
    expect(emis.at(-1)?.map((f) => f.name)).toEqual(['panne.jpg']);
  });

  it("refuse un fichier qui n'est pas une image, en disant pourquoi", async () => {
    await rendre();
    await deposer([fichier('devis.pdf', 'application/pdf')]);

    expect(vignettes().length).toBe(0);
    expect(erreurs()).toContain('seules les images');
    expect(emis).toEqual([]);
  });

  it('refuse une image trop lourde', async () => {
    await rendre(3, 1);
    await deposer([fichier('enorme.jpg', 'image/jpeg', 2 * 1024 * 1024)]);

    expect(vignettes().length).toBe(0);
    expect(erreurs()).toContain('1 Mo au maximum');
  });

  it('accepte les images valides et écarte les autres dans un même dépôt', async () => {
    await rendre();
    await deposer([
      fichier('avant.jpg', 'image/jpeg'),
      fichier('facture.pdf', 'application/pdf'),
      fichier('arriere.png', 'image/png'),
    ]);

    expect(vignettes().length).toBe(2);
    expect(emis.at(-1)?.map((f) => f.name)).toEqual(['avant.jpg', 'arriere.png']);
    expect(erreurs()).toContain('facture.pdf');
  });

  it('plafonne le nombre de photos et neutralise le champ une fois plein', async () => {
    await rendre(2);
    await deposer([
      fichier('a.jpg', 'image/jpeg'),
      fichier('b.jpg', 'image/jpeg'),
      fichier('c.jpg', 'image/jpeg'),
    ]);

    expect(vignettes().length).toBe(2);
    expect(erreurs()).toContain('2 photos au maximum');
    expect(champ().disabled).toBe(true);
  });

  it('retire une photo et libère son aperçu', async () => {
    await rendre();
    await deposer([fichier('panne.jpg', 'image/jpeg')]);

    const retirer = hote().querySelector('.ap-photo-upload__remove') as HTMLButtonElement;
    retirer.click();
    await fixture.whenStable();

    expect(vignettes().length).toBe(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:apercu');
    expect(emis.at(-1)).toEqual([]);
  });

  it('libère tous les aperçus à la destruction du composant', async () => {
    await rendre();
    await deposer([fichier('a.jpg', 'image/jpeg'), fichier('b.jpg', 'image/jpeg')]);

    fixture.destroy();

    // Deux photos jointes, donc deux URL à libérer : sans cela elles
    // resteraient en mémoire jusqu'au rechargement de la page.
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
