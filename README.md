# TUAZ — TeamUpAgainstZombi

Jeu web en JavaScript pur : pas de dépendance, pas d'outil de construction,
pas d'étape de compilation. **Pour jouer : ouvrir `index.html`** (double-clic
suffit, aucun serveur nécessaire).

Le suivi de projet — version, journal, chantiers en cours — vit en tête de
`index.html`, comme avant.

## Carte des fichiers

`index.html` tient la page (les balises du HUD, des panneaux, des fenêtres) et
charge dans l'ordre la feuille de style puis les vingt-trois morceaux du
script.

| Fichier | Lignes | Ce qu'il contient |
|---|---:|---|
| `css/tuaz.css` | 694 | toute la feuille de style |
| `js/00-config.js` | 117 | l'échelle (4 px = 1 m), le numéro de version, les réglages chiffrés |
| `js/01-utils.js` | 105 | les trois flux de hasard, la math déterministe D3, le son |
| `js/02-sprites.js` | 1365 | les corps : silhouettes, cinq vues, couleur de clan, habits cuits |
| `js/03-monde-graines.js` | 304 | les registres du décor, les graines, les grilles d'obstacles et de voies |
| `js/04-genmap.js` | 2405 | `genMap` : la génération de la carte, puis les requêtes de terrain |
| `js/05-paintworld.js` | 1810 | `paintWorld` : le fond statique du monde |
| `js/06-minimap.js` | 54 | la minicarte et le brouillard de guerre |
| `js/07-etat.js` | 810 | l'état de partie `G`, l'objectif du jour, l'apparition, les touches |
| `js/08-faune.js` | 999 | la faune, et la routine qui décoince un corps bloqué |
| `js/09-menace.js` | 2094 | prologue, se terrer, riposte, assaut, défense, compagnons au combat |
| `js/10-monde-vivant.js` | 678 | le journal de bord, l'interaction [F], les trente-sept métiers |
| `js/11-base.js` | 854 | la base, les missions, le moral, ce qu'on bâtit |
| `js/12-groupe.js` | 1163 | le groupe, le suivi, les blessés, les six consignes, les coupures |
| `js/13-rumeur.js` | 1708 | la rumeur, les dialogues, les quêtes, les témoins et la réputation |
| `js/14-fouille.js` | 1104 | objets au sol, fouille des bâtiments, plans, fenêtre de fouille, sorties |
| `js/15-joueur.js` | 137 | le joueur : mise à jour, souffle, allure |
| `js/16-render.js` | 1540 | le rendu d'une image |
| `js/17-hud-ecrans.js` | 1841 | le HUD en DOM et tous les écrans (menu, pause, scores, options…) |
| `js/18-objets.js` | 1090 | la valeur d'échange et LA TABLE, catalogue unique des objets |
| `js/19-equipement.js` | 1394 | vêtements, porteur, équiper les siens, inventaire, maladie, munitions |
| `js/20-souris.js` | 1964 | le glisser-déposer et la table d'échange à deux |
| `js/21-viedavant.js` | 668 | la vie d'avant de chaque habitant et les retrouvailles |
| `js/22-rejeu-boucle.js` | 535 | journal d'inputs, empreinte d'état, boucle à pas fixe, `boot()` |

## Pourquoi des `<script>` classiques et non des modules ES

Chaque fichier est chargé par un `<script src>` ordinaire. Les fichiers
partagent donc **une seule portée globale**, exactement comme les morceaux
d'un unique script — aucun `import` / `export` n'a été ajouté, aucune fonction
n'a été renommée. Deux conséquences voulues :

- le jeu s'ouvre toujours d'un simple double-clic, sans serveur local (les
  modules ES, eux, sont interdits en `file://`) ;
- l'ordre des balises dans `index.html` **est** l'ordre du script d'avant : y
  toucher, ou déplacer du code d'un fichier à l'autre, peut casser le jeu.

Chaque fichier ouvre sur `"use strict";`, ce qu'imposait l'unique script.

## Vérifier qu'on n'a rien cassé

```
npm install          # une seule dépendance : playwright, pour le banc
npx playwright install chromium
npm run verif        # joue 1 800 tours sur trois cartes et sort une empreinte
npm run check        # node --check sur chaque fichier de js/
```

Le banc ouvre la page dans un vrai Chromium, force les graines et rend une
empreinte : l'état canonique (`stateHash`), la taille de tous les tableaux de
`G`, un hachage des pixels du canvas, la position et les points de vie du
joueur, le nombre de globales. **Deux versions du jeu qui rendent la même
empreinte se comportent pareil.** C'est ainsi qu'a été validé le découpage :
mono-fichier et version découpée rendent une empreinte identique sur les trois
graines, sans une erreur de console.

Un `node --check` sur chaque fichier de `js/` reste le premier réflexe après
une modification.
