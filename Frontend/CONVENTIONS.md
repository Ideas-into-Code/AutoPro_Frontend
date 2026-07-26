# Conventions de code — AutoPro Frontend

Document de référence de l'équipe frontend. Toute exception doit être justifiée
en revue de code.

## 1. Architecture des dossiers

```
src/
├── styles/                    design system global (voir §4)
└── app/
    ├── core/                  briques transverses, instanciées une seule fois
    │   ├── config/            configuration injectable (API, microservices)
    │   ├── data/              contrats et base des dépôts de données
    │   ├── http/              intercepteurs, normalisation des erreurs
    │   └── models/            types partagés par plusieurs domaines
    ├── shared/                réutilisable, SANS logique métier
    │   ├── ui/                button, card, form-field, spinner
    │   ├── layout/            header, footer, page-shell
    │   ├── pages/             pages transverses (404)
    │   └── validators/        validateurs et messages d'erreur en français
    └── features/              un dossier = un domaine = un microservice
        ├── auth/              authentification, OTP
        ├── onboarding/        parcours de première utilisation
        ├── mechanics/         profils, spécialités, justificatifs
        ├── requests/          demandes d'intervention
        ├── pricing/           grilles tarifaires
        ├── reviews/           notes et avis
        ├── messaging/         messagerie instantanée
        ├── geolocation/       carte, suivi GPS
        └── admin/             back-office (validation, modération)
```

### Règle de dépendance

Les dépendances vont **toujours** vers l'intérieur :

```
features  →  shared  →  core
```

- `core` ne dépend de rien d'autre que d'Angular.
- `shared` peut dépendre de `core`, jamais d'une feature.
- une feature **ne doit jamais importer une autre feature**. Si deux features
  ont besoin de la même chose, cette chose remonte dans `shared` ou `core`.

### Structure interne d'une feature

```
features/mechanics/
├── data/                      dépôts d'accès au microservice
├── models/                    types propres au domaine
├── components/                composants réutilisés dans CETTE feature
├── pages/                     composants routés
└── mechanics.routes.ts        routes chargées en différé
```

### Routage

`app.routes.ts` ne contient **que** des déclarations, jamais de logique. Chaque
domaine est chargé en différé et expose ses routes dans son propre fichier :

```ts
// app.routes.ts
{ path: 'compte', loadChildren: () => import('@features/auth/auth.routes')
                                        .then((m) => m.authRoutes) }
```

Trois règles :

- **Chargement différé obligatoire.** Le code d'une feature ne doit jamais
  partir dans le bundle initial. Sur une 3G instable, envoyer le back-office
  admin à un client qui cherche un mécanicien est du gaspillage de données.
- **Les gardes vivent dans le fichier de routes de leur feature**, au plus près
  de la règle qu'ils appliquent — pas dans `app.routes.ts`.
- **La route joker `**` reste en dernier.** Placée plus haut, elle avalerait
  toutes les routes suivantes.

Un composant chargé en différé s'importe **directement** par son chemin, jamais
via un barrel `index.ts` : passer par un barrel réintroduirait le composant dans
le bundle initial et annulerait le découpage.

## 2. Application de SOLID

| Principe                           | Application concrète                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S** — responsabilité unique      | Un composant affiche, un service décide, un dépôt transporte. Un composant ne fait jamais d'appel HTTP directement.                                           |
| **O** — ouvert/fermé               | Ajouter un microservice = ajouter une entrée dans `MicroserviceName`, sans modifier les dépôts existants. `PageShell` accepte n'importe quel en-tête projeté. |
| **L** — substitution de Liskov     | Tout `HttpRepository` respecte le contrat `ReadRepository` : un dépôt factice est interchangeable avec le vrai en test.                                       |
| **I** — ségrégation des interfaces | `ReadRepository`, `WriteRepository` et `DeleteRepository` sont séparés : un dépôt en lecture seule n'hérite pas de méthodes d'écriture inutiles.              |
| **D** — inversion des dépendances  | Les composants dépendent d'abstractions (`ReadRepository`, `API_CONFIG`), jamais de `HttpClient` ni d'une URL en dur.                                         |

## 3. Motifs de conception en place

- **Singleton** — `providedIn: 'root'` sur les services. Une seule instance pour
  toute l'application, garantie par l'injecteur d'Angular. Ne jamais déclarer un
  service dans le tableau `providers` d'un composant sauf besoin explicite d'une
  instance par composant.
- **Repository** — `HttpRepository` isole l'accès aux données. Un changement
  d'API ne touche que le dépôt, pas les composants.
- **Racine de composition** — `provideCore()` rassemble les fournisseurs
  transverses pour que `app.config.ts` reste lisible.
- **Adaptateur** — `toApiError()` traduit le HTTP en vocabulaire métier, pour
  que l'interface ne raisonne jamais en codes 4xx/5xx.

## 4. Styles

- **Aucune valeur brute** dans un composant : pas de `#0f4c81`, pas de `16px`.
  On passe par les tokens `var(--ap-*)`.
- Les tokens sont définis dans `src/styles/_tokens.scss` — **seul** fichier à
  modifier pour aligner la charte graphique.
- Un composant importe le design system en une ligne : `@use 'index' as ds;`
- Approche **mobile-first** : le style de base cible le mobile, les mixins
  `ds.from(md)` / `ds.from(lg)` élargissent vers le haut.
- Nommage des classes en BEM avec préfixe `ap-` : `.ap-card__actions`,
  `.ap-button--primary`.

## 5. Composants

- **Toujours `ChangeDetectionStrategy.OnPush`**.
- Signaux (`input()`, `output()`, `signal()`, `computed()`) — pas de décorateurs
  `@Input()` / `@Output()`, pas de `BehaviorSubject` pour de l'état local.
- Composants **autonomes** (standalone) ; aucun `NgModule`.
- Nouvelle syntaxe de contrôle de flux : `@if`, `@for`, `@switch`.
- Un composant `shared/` ne contient **aucune** règle métier ni libellé
  spécifique à un écran : ce qui varie est projeté ou passé en entrée.
- Dès qu'un bloc de balisage apparaît une deuxième fois, il devient un composant
  de `shared/ui`.

## 5 bis. Formulaires

- **Formulaires réactifs** (`ReactiveFormsModule`) uniquement, jamais `ngModel`.
- Un champ se déclare avec `<app-form-field>`, qui porte déjà le libellé, la
  saisie, l'aide et le message d'erreur :

```html
<app-form-field
  label="Numéro de téléphone"
  type="tel"
  autocomplete="tel"
  [control]="formulaire.controls.telephone"
  required
/>
```

- **Aucun message d'erreur écrit en dur dans un écran.** Les messages vivent
  dans `shared/validators/validation-messages.ts`. Ajouter un validateur, c'est
  y ajouter son message.
- Une erreur ne s'affiche qu'une fois le champ **touché ou modifié** : reprocher
  un champ vide avant que l'utilisateur l'ait atteint est hostile.
- Un seul message à la fois par champ.
- Les erreurs renvoyées par le serveur arrivent normalisées dans
  `ApiError.fieldErrors` (`kind: 'validation'` sur un 422) : pas besoin
  d'interpréter le code HTTP dans l'écran.

## 6. Accessibilité

Non négociable, vérifié en revue :

- tout élément interactif est atteignable au clavier et porte un anneau de focus
  visible (mixin `ds.focus-ring`) ;
- une cible tactile mesure au moins 44 px ;
- un état de chargement est annoncé (`role="status"`, `aria-busy`) ;
- les animations respectent `prefers-reduced-motion`.

## 7. Nommage

| Élément                | Convention                             | Exemple                   |
| ---------------------- | -------------------------------------- | ------------------------- |
| Fichier                | kebab-case                             | `http-repository.base.ts` |
| Classe                 | PascalCase                             | `MechanicRepository`      |
| Variable, fonction     | camelCase                              | `buildServiceUrl`         |
| Type, interface        | PascalCase, sans préfixe `I`           | `ApiConfig`               |
| Sélecteur de composant | préfixe `app-`                         | `app-page-shell`          |
| Custom property CSS    | préfixe `--ap-`                        | `--ap-space-4`            |
| Dossier                | kebab-case, au pluriel pour un domaine | `features/mechanics/`     |

Les alias d'import évitent les chemins relatifs fragiles :

```ts
import { HttpRepository, type Page } from '@core';
import { Button, Card } from '@shared/ui';
```

## 8. Git

Voir le `README.md` à la racine du dépôt. En résumé :

- une branche = une tâche, créée depuis `develop` ;
- commit au format `#NumeroTicket Nom du ticket` ;
- toute fusion vers `develop` passe par une Pull Request relue.

## 9. Avant de pousser

```bash
npm run lint      # aucune erreur
npm run format    # code formaté
npm run build     # compile sans erreur
npm test          # tests au vert
```
