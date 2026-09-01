/**
 * Composition d'un PDF minimal, **à usage de simulation uniquement**.
 *
 * À supprimer le jour où le service `payments` sert la vraie facture : le
 * document définitif porte un numéro de série, un cachet et des mentions
 * légales qui n'ont rien à faire dans un navigateur.
 *
 * Écrit à la main plutôt qu'avec jsPDF ou pdfmake : ces bibliothèques pèsent
 * de 300 ko à 1 Mo, ce qui est indéfendable sur la 3G visée par le cahier des
 * charges — et absurde pour un fichier que le serveur produira lui-même. Le
 * format PDF étant du texte structuré, une page de texte tient en quelques
 * dizaines de lignes.
 *
 * Le fichier produit s'ouvre dans n'importe quel lecteur : c'est bien un PDF,
 * pas un texte renommé.
 */

/** Caractères hors Latin-1 qu'il faut traduire pour l'encodage WinAnsi. */
const EQUIVALENTS: Readonly<Record<string, string>> = {
  '—': '-', // tiret cadratin
  '–': '-', // tiret demi-cadratin
  '’': "'", // apostrophe typographique
  ' ': ' ', // espace insécable étroite
  ' ': ' ', // espace insécable
};

/**
 * Échappe une chaîne pour un littéral PDF.
 *
 * Les parenthèses délimitent les chaînes dans le format : une parenthèse non
 * échappée dans « Déplacement (4,2 km) » referme le littéral en plein milieu
 * et rend le fichier illisible.
 */
function echapper(texte: string): string {
  let sortie = '';

  for (const caractere of texte) {
    sortie += EQUIVALENTS[caractere] ?? caractere;
  }

  return sortie.replace(/[\\()]/g, (trouve) => `\\${trouve}`);
}

/**
 * Convertit la source du PDF en octets, un caractère valant un octet.
 *
 * Indispensable : la table de références croisées d'un PDF est faite de
 * **positions en octets**. Laisser `Blob` encoder en UTF-8 ferait compter deux
 * octets pour chaque « é », et tous les décalages calculés ici seraient faux.
 */
function versOctets(source: string): Uint8Array<ArrayBuffer> {
  // Le tampon est construit explicitement : `new Uint8Array(longueur)` est
  // typé sur `ArrayBufferLike`, que le constructeur de `Blob` refuse.
  const octets = new Uint8Array(new ArrayBuffer(source.length));

  for (let index = 0; index < source.length; index += 1) {
    octets[index] = source.charCodeAt(index) & 0xff;
  }

  return octets;
}

/** Compose un PDF d'une page à partir de lignes de texte. */
export function composerPdf(lignes: readonly string[]): Blob {
  const HAUTEUR_LIGNE = 16;
  const DEPART_Y = 780;

  const contenu = [
    'BT',
    `/F1 11 Tf ${HAUTEUR_LIGNE} TL 56 ${DEPART_Y} Td`,
    ...lignes.map((ligne) => `(${echapper(ligne)}) Tj T*`),
    'ET',
  ].join('\n');

  const objets = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${versOctets(contenu).length} >>\nstream\n${contenu}\nendstream`,
  ];

  let document = '%PDF-1.4\n';
  const decalages: number[] = [];

  objets.forEach((corps, index) => {
    decalages.push(versOctets(document).length);
    document += `${index + 1} 0 obj\n${corps}\nendobj\n`;
  });

  const debutTable = versOctets(document).length;

  document += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
  document += decalages
    .map((decalage) => `${decalage.toString().padStart(10, '0')} 00000 n \n`)
    .join('');
  document += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\n`;
  document += `startxref\n${debutTable}\n%%EOF\n`;

  return new Blob([versOctets(document)], { type: 'application/pdf' });
}
