import { composerPdf } from './invoice-pdf';

/** Lit le Blob en octets, un caractère par octet, comme il a été composé. */
async function texteBrut(blob: Blob): Promise<string> {
  const octets = new Uint8Array(await blob.arrayBuffer());

  return Array.from(octets, (octet) => String.fromCharCode(octet)).join('');
}

describe('composerPdf', () => {
  it('produit bien un PDF, et non un texte renommé', async () => {
    const pdf = composerPdf(['AutoPro - Facture']);

    expect(pdf.type).toBe('application/pdf');
    expect(await texteBrut(pdf)).toMatch(/^%PDF-1\.4/);
    expect((await texteBrut(pdf)).trimEnd()).toMatch(/%%EOF$/);
  });

  it('annonce une table de références qui tombe juste', async () => {
    const source = await texteBrut(composerPdf(['Ligne']));
    const depart = Number(/startxref\s+(\d+)/.exec(source)?.[1]);

    // Un décalage faux rend le fichier illisible par certains lecteurs tout en
    // restant ouvrable par d'autres : le vérifier ici évite un bogue qui ne se
    // manifesterait que chez l'utilisateur.
    expect(source.slice(depart, depart + 4)).toBe('xref');
  });

  it('place chaque objet là où la table le dit', async () => {
    const source = await texteBrut(composerPdf(['Ligne']));
    const decalages = [...source.matchAll(/^(\d{10}) 00000 n/gm)].map((trouve) =>
      Number(trouve[1]),
    );

    expect(decalages).toHaveLength(5);
    for (const decalage of decalages) {
      expect(source.slice(decalage)).toMatch(/^\d+ 0 obj/);
    }
  });

  it('échappe les parenthèses du texte', async () => {
    // « Déplacement (4,2 km) » refermerait le littéral en plein milieu et
    // casserait le fichier.
    const source = await texteBrut(composerPdf(['Deplacement (4,2 km)']));

    expect(source).toContain('Deplacement \\(4,2 km\\)');
  });

  it('ramène les caractères hors Latin-1 à un équivalent', async () => {
    // Un tiret cadratin encodé en UTF-8 occuperait trois octets et décalerait
    // toute la table de références.
    const source = await texteBrut(composerPdf(['AutoPro — Facture']));

    expect(source).toContain('AutoPro - Facture');
  });

  it('conserve les accents, qui tiennent sur un octet', async () => {
    const source = await texteBrut(composerPdf(['Mécanicien']));

    expect(source).toContain('Mécanicien');
  });
});
