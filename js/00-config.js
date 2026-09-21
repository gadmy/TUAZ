"use strict";
/* ================================================================
   TUAZ - 00-config.js
   Les chiffres du jeu : l'echelle (4 px = 1 m), le numero de version,
   les reglages d'endurance, de portage, de troc et de voies.
   (lignes 1697 a 1807 du mono-fichier d'origine)
   ================================================================ */
/* ================= CONFIG (chiffres du GDD) ================= */
/* ================= L'ECHELLE =================
   QUATRE PIXELS VALENT UN METRE. C'est la seule mesure du jeu, et tout ce qui
   est une longueur doit s'ecrire en multiples de M.

   Elle n'existait pas : les distances etaient des nombres nus poses au juge,
   et deux echelles se contredisaient dans le meme fichier - le bati (une
   mairie de 76 px pour dix-neuf metres) et les projectiles (2,2 px par
   metre-seconde, note dans un commentaire de la table des munitions). M est
   deduite du bati, qui est la seule des deux a etre coherente d'un bout a
   l'autre de la carte.

   Ce que cela donne : la carte fait 960 m de cote, une route en fait 8,5 de
   large, un chemin de terre 3,75, on voit a 37,5 m en plein jour et la
   silhouette d'un homme tient dans 1,25 m.

   UN ECART CONNU ET ASSUME. Le joueur avance a 88 px/s, soit 22 m/s : six
   fois trop vite pour un homme. La carte se traverse donc en quarante-trois
   secondes. Corriger la vitesse rendrait la carte immense et le jeu
   contemplatif ; reduire la carte la viderait. La vitesse reste donc une
   vitesse de jeu et non une vitesse reelle - c'est une decision, plus un
   oubli, et elle est ecrite ici pour ne plus se rediscuter par accident.
   Toutes les LONGUEURS, elles, sont metriques. */
var M = 4;
function met(m){ return m*M; }
/* la version, ecrite une seule fois : le titre de la page et le menu la
   lisaient chacun de leur cote et affichaient v15 et v9 sur un fichier v16.
   Le titre restait pourtant en dur dans l'en-tete - il le lit maintenant
   lui aussi, et la chaine n'existe plus qu'ici. */
var VERSION = 31;
document.title = "TUAZ v" + VERSION;
var CFG = {
    WORLD: 960*M, VIEW_W: 640, VIEW_H: 360,
    DAY_LEN: 660, NIGHT_LEN: 180, CYCLE: 900, DAWN: 60, DUSK: 60,
    /* Ce qu'une aptitude ordinaire peut gagner au-dessus de sa valeur de
       naissance. La specialite de chacun - sa meilleure aptitude au depart -
       n'a pas cette borne et monte jusqu'a 100. */
    STAT_GAIN: 30,
    /* La montee. Un geste ne donne pas un point : il donne un usage, et il
       en faut d'autant plus qu'on est deja bon. Le cout d'un point suit
       STAT_USE_A * exp(STAT_USE_B * niveau) : environ trois usages a 5,
       douze a 50, quarante a 90, cinquante-quatre a 100. Un debutant
       progresse a vue d'oeil, un maitre s'use a gagner un point. */
    STAT_USE_A: 2.66, STAT_USE_B: 0.0301,
    /* rayon du cercle de visee, le meme pour toutes les armes qui tirent */
    AIM_R: 23*M,
    PLAYER_HP: 100, PLAYER_SPD: 88,
    SWAMP_SLOW: 0.6, SLOPE_SLOW: 0.2, SLOPE_DOWN: 1.35, SLOPE_CROSS: 0.55, GRASS_SLOW: 0.8, FLOW: 26, CAVE_WAVE: 5,
    VEG_RESP: 150, VEG_REACH: 26,
    SEA_BAND: 37.5*M, EXIT_T: 10,
    DARK: 0.55, LIGHT_PLAYER: 120, LIGHT_TORCH: 55,
    /* modes de marche 0=silencieux 1=normal 2=sprint : vitesse et halo */
    MODE_SPD: [0.55, 1.0, 1.65], MODE_LIGHT: [0.5, 1.0, 1.15],
    /* ---- ENDURANCE ----
       La reserve vaut STA_BASE plus STA_PER par point de Souffle effectif :
       100 aux aptitudes de depart, 140 au mieux, 60 au pire. Le sprint la
       vide, la marche la rend, mais jamais avant STA_DELAY secondes sans
       depense. A sec on ne court plus, et il faut remonter a STA_RESUME de
       la reserve pour repartir. */
    STA_BASE: 60, STA_PER: 0.8,
    STA_SPRINT: 14, STA_MELEE: 6, STA_OVER: 6,
    STA_REG: [7, 5, 0], STA_REG_STILL: 11,
    STA_DELAY: 1.2, STA_RESUME: 0.20,
    /* ---- PORTAGE ----
       La charge portable vaut CARRY_BASE plus CARRY_PER par point de Portage
       effectif : 26 kg au depart, 40 au mieux. Jusqu'a CARRY_FREE de cette
       charge on ne sent rien ; au-dela la vitesse descend jusqu'a CARRY_SLOW
       a pleine charge et le sprint coute jusqu'a CARRY_COST de plus.
       On peut depasser le poids autorise. Jusqu'au double, tout ce qui coute
       du souffle coute double. Au-dela du double, il ne reste que la marche
       et l'on perd CARRY_OVER_SLOW. */
    /* ---- LE TROC ----
       La tolerance d'un echange est une part : deux choses s'echangent si
       l'ecart ne depasse pas TRADE_PCT de la plus modeste des deux. TRADE_FLOOR est le plancher en valeur absolue, sans
       lequel les objets a cinq points ne s'echangeraient plus contre rien.
       TRADE_SWING dit ce que l'aptitude Troc ajoute ou retranche a la part :
       a egalite d'aptitude on est a TRADE_PCT, et l'ecart maximal entre deux
       marchandeurs deplace la part de plus ou moins TRADE_SWING. */
    TRADE_PCT: 0.25, TRADE_FLOOR: 10, TRADE_SWING: 0.15,
    CARRY_BASE: 12, CARRY_PER: 0.28,
    CARRY_FREE: 0.5, CARRY_SLOW: 0.30, CARRY_COST: 0.8, CARRY_OVER_SLOW: 0.45,
    /* ---- LES VOIES ----
       Marcher sur une voie aidee vaut mieux que couper a travers champs : on
       va plus vite et l'on s'essouffle moins, dans la meme proportion. Le
       premier reglage rendait un quart sur le goudron, ce qui se sentait
       trop : la route donne un dixieme, la terre battue et les trottoirs la
       moitie de cela. Le trottoir a donc quitte le goudron pour rejoindre le
       chemin de terre, c'est une allee de bourg et non une nationale. */
    ROAD_SOFT: 0.05, ROAD_PAVED: 0.10,
    /* Le PNJ qui fuit court a NPC_FLEE_SPD tant qu'il a du souffle, puis
       retombe a NPC_TIRED_SPD sans cesser de fuir : c'est la que le zombi
       rattrape. Les zombis, eux, n'ont pas d'endurance. */
    NPC_STA_FLEE: 11, NPC_STA_REG: 6, NPC_FLEE_SPD: 62, NPC_TIRED_SPD: 34,
    /* un zombi ne peut pas te reperer hors du cadre visible : demi-hauteur
       de vue 180, donc SIGHT_MAX plafonne apres le coefficient de mode */
    /* on voit a 37,5 m en plein jour, 17,5 la nuit, 28,75 sous un lampadaire */
    SIGHT_DAY: 37.5*M, SIGHT_NIGHT: 17.5*M, SIGHT_LIT: 28.75*M, SIGHT_MAX: 42.5*M,
    DARK_DAY: 0.00, DARK_NIGHT: 0.82,
    BUDGET: {
        GROVES:[16,26], RIVERS:[2,4], LAKES:[3,5], HUTS:[1,3],
        FARMS:[4,7],
        VILLAGES:[2,4], HOUSES:[5,20], CITY:[50,80], CITY_ISO:[1,2],
        SHELTERS:[5,20],
        CAVES:[4,6], ARMY:[1,1], TROOPS:[10,20], HANGARS:[1,2], STATIONS:[1,2],
        HILLS:[1,2], GRASS:[10,18], PORTS:[1,3],
        HERDS:[2,4], DEERS:[5,10], CAMPS:[2,5], SCOUTS:[5,10],
        ROAD_EXTRA:[1,3], FIELDS:[2,5], FARM_TOWER:[0,1], FARM_HANGAR:[0,1]
    }
};

