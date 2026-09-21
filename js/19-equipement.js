"use strict";
/* ================================================================
   TUAZ - 19-equipement.js
   Les vetements, le porteur quel qu'il soit, equiper les siens, les
   formes de l'inventaire, la maladie et le ravitaillement par calibre.
   (lignes 21748 a 23134 du mono-fichier d'origine)
   ================================================================ */
/* ================= LES VETEMENTS =================
   Les quatre emplacements du panneau - tete, torse, jambes, pieds - etaient
   des coquilles vides depuis la v8. Ils se remplissent enfin.

   UN VETEMENT NE FAIT QU'AJOUTER DES POINTS D'APTITUDE. Pas de mecanique
   neuve, pas de reduction de degats a part, pas de durabilite : les sept
   aptitudes concernees existent deja et sont branchees depuis la v16, donc
   un treillis qui donne cinq de Vigueur agit par le meme chemin qu'un point
   gagne a la sueur. C'est la regle et elle ne souffre pas d'exception.

   CES POINTS NE COMPTENT PAS DANS LES PLAFONDS. Un boulanger en gilet
   pare-balles encaisse comme un pompier tant qu'il le porte, et redevient
   boulanger des qu'il le pose. C'est de l'equipement, pas de la progression :
   rien de tout cela ne se garde, ne monte ni ne s'apprend.

   LE PRIX EST EN KILOS, ET RIEN D'AUTRE. Aucun vetement n'a de malus. Ce qui
   protege pese, et le poids porte ralentit depuis la v15 : le gilet
   pare-balles vaut huit kilos et demi, soit un tiers de ce qu'un homme
   ordinaire peut porter sans le sentir. Le choix se fait la, pas dans une
   table de contreparties.

   PAS DE PRIME A L'ASSORTIMENT. Porter les quatre pieces d'une meme famille
   ne donne rien de plus que la somme des quatre : on assemble ce qu'on
   trouve, et le casque de pompier sur le treillis vaut exactement ce qu'il
   annonce. Decision explicite.

   sl : 0 tete, 1 torse, 2 jambes, 3 pieds.
   bon : les points ajoutes, par cle d'aptitude. */
var VETSLOT=["Tete","Torse","Jambes","Pieds"];
var VET=[
 /* --- TETE --- */
 {n:"Casque militaire",     ic:"vcasqm", sl:0, pds:1.30, col:"#5c6a48", bon:{vigueur:6}},
 {n:"Casque de pompier",    ic:"vcasqp", sl:0, pds:1.50, col:"#d64828", bon:{vigueur:4, sante:3}},
 {n:"Casquette de police",  ic:"vcasqt", sl:0, pds:0.15, col:"#26324f", bon:{vigueur:2}},
 {n:"Masque a gaz",         ic:"vmasq",  sl:0, pds:0.90, col:"#3a4038", bon:{immunite:12}},
 {n:"Bonnet de laine",      ic:"vbonn",  sl:0, pds:0.12, col:"#8a3a4a", bon:{souffle:3}},
 {n:"Cagoule de chasse",    ic:"vcago",  sl:0, pds:0.10, col:"#4a4a2c", bon:{discretion:8}},
 /* --- TORSE --- */
 {n:"Veste de treillis",    ic:"vtreil", sl:1, pds:1.10, col:"#4a5a30", bon:{vigueur:5, portage:4}},
 {n:"Gilet pare-balles",    ic:"vgilet", sl:1, pds:8.50, col:"#2f332b", bon:{vigueur:14}},
 {n:"Veste de pompier",     ic:"vvestp", sl:1, pds:3.60, col:"#c88a2a", bon:{sante:8, vigueur:4}},
 {n:"Blouse de soignant",   ic:"vblous", sl:1, pds:0.50, col:"#e6e8e0", bon:{sante:7, immunite:5}},
 {n:"Blouson de cuir",      ic:"vcuir",  sl:1, pds:1.90, col:"#5a3824", bon:{vigueur:6}},
 {n:"Cire de pecheur",      ic:"vcire",  sl:1, pds:1.20, col:"#d8b830", bon:{immunite:9}},
 /* --- JAMBES --- */
 {n:"Pantalon de treillis", ic:"vpantm", sl:2, pds:0.80, col:"#4a5a30", bon:{portage:5, vigueur:3}},
 {n:"Surpantalon de feu",   ic:"vpantp", sl:2, pds:2.40, col:"#9a7a34", bon:{sante:5, vigueur:3}},
 {n:"Pantalon de service",  ic:"vpantt", sl:2, pds:0.70, col:"#26324f", bon:{vigueur:3, souffle:2}},
 {n:"Pantalon de chasse",   ic:"vpantc", sl:2, pds:0.60, col:"#5a5030", bon:{discretion:7}},
 {n:"Bas de jogging",       ic:"vjog",   sl:2, pds:0.40, col:"#6a6a72", bon:{vitesse:6, souffle:4}},
 {n:"Jean de travail",      ic:"vjean",  sl:2, pds:0.90, col:"#37486a", bon:{portage:4}},
 /* --- PIEDS --- */
 {n:"Rangers",              ic:"vrang",  sl:3, pds:1.80, col:"#26241f", bon:{portage:5, vigueur:3}},
 {n:"Bottes de pompier",    ic:"vbottp", sl:3, pds:2.60, col:"#3a201a", bon:{sante:4, vigueur:3}},
 {n:"Chaussures de securite",ic:"vsecu", sl:3, pds:2.00, col:"#3a3a34", bon:{portage:6}},
 {n:"Baskets",              ic:"vbask",  sl:3, pds:0.50, col:"#d8d8cc", bon:{vitesse:8, souffle:3}},
 {n:"Mocassins de chasse",  ic:"vmoca",  sl:3, pds:0.40, col:"#6a4a2a", bon:{discretion:6, vitesse:2}},
 {n:"Bottes de peche",      ic:"vbottc", sl:3, pds:1.60, col:"#37583a", bon:{immunite:6}},
 /* --- VETEMENTS CIVILS (ordinaires, sans bonus) ---
    Les habits de tous les jours : de vrais objets, qui recolorent la zone
    du corps quand on les porte. Ils reprennent une vignette existante par
    emplacement - c'est le nom qui les distingue. */
 {n:"Chemise bleue",        ic:"vblous", sl:1, pds:0.30, col:"#3f5f8f", civ:1},
 {n:"Chemise blanche",      ic:"vblous", sl:1, pds:0.30, col:"#e2e2da", civ:1},
 {n:"Chemise a carreaux",   ic:"vblous", sl:1, pds:0.35, col:"#9a5a44", civ:1},
 {n:"T-shirt vert",         ic:"vtreil", sl:1, pds:0.20, col:"#4a8a48", civ:1},
 {n:"T-shirt gris",         ic:"vtreil", sl:1, pds:0.20, col:"#8a8a86", civ:1},
 {n:"Polo rouge",           ic:"vcuir",  sl:1, pds:0.25, col:"#b83a34", civ:1},
 {n:"Polo bleu",            ic:"vcuir",  sl:1, pds:0.25, col:"#3a6a9a", civ:1},
 {n:"Pull marine",          ic:"vgilet", sl:1, pds:0.45, col:"#2a3550", civ:1},
 {n:"Pull moutarde",        ic:"vgilet", sl:1, pds:0.45, col:"#c8a030", civ:1},
 {n:"Sweat gris",           ic:"vgilet", sl:1, pds:0.50, col:"#6a6a6e", civ:1},
 {n:"Jean bleu",            ic:"vjean",  sl:2, pds:0.60, col:"#37486a", civ:1},
 {n:"Jean noir",            ic:"vjean",  sl:2, pds:0.60, col:"#2a2a30", civ:1},
 {n:"Pantalon vert",        ic:"vpantt", sl:2, pds:0.55, col:"#4a5a34", civ:1},
 {n:"Pantalon beige",       ic:"vpantt", sl:2, pds:0.55, col:"#b0a078", civ:1},
 {n:"Pantalon noir",        ic:"vpantt", sl:2, pds:0.55, col:"#2a2a2e", civ:1},
 {n:"Short en jean",        ic:"vjog",   sl:2, pds:0.35, col:"#4a6a90", civ:1},
 {n:"Jupe",                 ic:"vpantt", sl:2, pds:0.40, col:"#7a4a6a", civ:1},
 {n:"Chaussures de ville",  ic:"vmoca",  sl:3, pds:0.70, col:"#2a2620", civ:1},
 {n:"Sandales",             ic:"vmoca",  sl:3, pds:0.30, col:"#a07850", civ:1},
 {n:"Bottines",             ic:"vrang",  sl:3, pds:0.90, col:"#4a3020", civ:1},
 {n:"Tennis blanches",      ic:"vbask",  sl:3, pds:0.50, col:"#dcdcd0", civ:1},
 {n:"Casquette",            ic:"vcasqt", sl:0, pds:0.12, col:"#4a5a44", civ:1},
 {n:"Chapeau de paille",    ic:"vbonn",  sl:0, pds:0.10, col:"#c8a850", civ:1}
];
/* --- LE REGISTRE ---
   Les quatre tables se rangent bout a bout dans ITEMS. L'indice sert de nom
   propre a l'objet : c'est lui qui passe par le journal d'entrees, donc le
   rejeu retrouve exactement le meme objet. */
var ITEMS=[], ITEMKIND={sac:"Sac a dos", viv:"Vivres", med:"Medicament",
                        jet:"Arme de jet", mun:"Munitions", obj:"Materiel",
                        vet:"Vetement"};
(function(){
    var i;
    function join(tab,k,fam){
        for(i=0;i<tab.length;i++){
            var o=tab[i];
            o.k=k; o.id=ITEMS.length;
            if(fam&&!o.fam) o.fam=fam;
            /* UNE BOITE PAR CASE. Une case en tenait dix, ce qui faisait
               trois mille cartouches dans la moitie d'un sac militaire : le
               poids etait la seule limite, et il ne mordait que sur les gros
               calibres. Desormais ce sont les cases qui bornent, partout et
               pour tout le monde.
               C'est un facteur DIX sur ce qu'on emporte. Les ceintures de
               munitions - un contenant d'une case qui tient plusieurs boites
               - sont ce qui doit rendre la chose tenable, et elles n'existent
               pas encore : d'ici la, on tire beaucoup moins loin de chez soi.
               A affiner, decision prise en connaissance du chiffre. */
            o.mx=(k==="sac"||k==="vet"||k==="mun")?1:STACK;
            /* une ceinture est un contenant : elle occupe la case entiere,
               elle ne s'empile pas avec ses semblables */
            if(o.blt) o.mx=1;
            if(o.mat===undefined) o.mat=0;
            ITEMS.push(o);
        }
    }
    join(BAGS,"sac","Sac a dos");
    join(FOOD,"viv","Vivres");
    join(MEDS,"med","Medicament");
    join(THROWN,"jet",null);
    join(ROUNDS,"mun","Munitions");
    join(GOODS,"obj",null);
    /* les vetements portent leur emplacement comme famille : c'est ce qui se
       lit dans la fiche, et c'est aussi ce qui les trie dans le panneau */
    for(i=0;i<VET.length;i++) VET[i].fam=VETSLOT[VET[i].sl];
    join(VET,"vet",null);
    /* Les ceintures se versent EN DERNIER, apres tout le reste : l'indice
       dans ITEMS sert de nom propre a l'objet et passe par le journal
       d'entrees. Les glisser au milieu aurait decale tous les identifiants
       posterieurs, et un dump de la v23 n'aurait plus rendu les memes objets
       au rejeu. */
    join(BELTS,"obj","Ceinture");
    /* ---- LA FORME DE CHAQUE OBJET ----
       Toute case en valait une autre : un fusil long occupait autant qu'une
       boite de conserve. gw sur gh dit maintenant la place qu'une chose prend
       dans la grille. PAS DE ROTATION - chaque objet a une orientation fixe :
       tourner double le nombre d'etats a peindre et a tester pour un gain que
       la largeur constante rend deja faible.
       La forme se DEDUIT, elle ne se saisit pas : cent quatre-vingt-sept
       lignes de table a la main auraient diverge du poids au premier ajout.
       Le poids est le bon juge - ce qui pese encombre. */
    for(i=0;i<ITEMS.length;i++){
        var s=ITEMS[i];
        s.gw=1; s.gh=1;
        /* UN SAC NE FAIT JAMAIS DEUX SUR DEUX. Les poches sont une ligne : un
           sac carre ne pourrait plus jamais s'oter, puisqu'il devrait
           redescendre dans ce qu'il libere. Deux cases en long au plus. */
        if(s.k==="sac"){ if(s.cap>10) s.gw=2; }
        else if(s.k==="vet"){ if(s.pds>=3){ s.gw=2; s.gh=2; } else if(s.pds>=1) s.gw=2; }
        else if(s.k==="obj"&&!s.blt){ if(s.pds>=8){ s.gw=2; s.gh=2; } else if(s.pds>=2) s.gw=2; }
    }
})();
function itemById(i){ return (i>=0&&i<ITEMS.length)?ITEMS[i]:null; }
function itemFind(n){ for(var i=0;i<ITEMS.length;i++) if(ITEMS[i].n===n) return ITEMS[i]; return null; }
/* La fiche d'un objet, telle qu'elle se lit dans l'emplacement. */
function itemLine(o){
    if(!o) return "";
    if(o.k==="sac") return o.cap+" cases, "+o.pds.toFixed(1)+" kg";
    if(o.k==="viv"||o.k==="med"){
        var L9=[];
        if(o.hp) L9.push("+"+o.hp+" pv");
        if(o.st) L9.push("+"+o.st+" souffle");
        if(!L9.length) L9.push("sans effet");
        return L9.join(", ")+((o.k==="viv")?(" en "+o.dur+" s"):" aussitot");
    }
    if(o.k==="jet") return o.pmin+"-"+o.por+" px, rayon "+o.rad+
        (o.dmg?(", "+o.dmg+" degats"):", sans degats")+(o.dur?(" sur "+o.dur+" s"):"");
    if(o.k==="mun") return o.nb+" cartouches, "+o.pds.toFixed(2)+" kg";
    if(o.k==="vet") return vetLine(o)+", "+o.pds.toFixed(2)+" kg";
    /* une ceinture s'annonce par ce qu'elle tient : c'est la seule chose
       qu'on regarde avant de la ramasser */
    if(o.blt) return o.blt+" boites de munitions, "+o.pds.toFixed(2)+" kg";
    return o.pds.toFixed(2)+" kg, matiere "+o.mat;
}
/* Ce qu'un vetement donne, en clair : "+5 Vigueur, +4 Portage". */
function vetLine(o){
    var L=[], k, d, q, S;
    if(!o||!o.bon) return "sans effet";
    for(d=0;d<STATDEF.length;d++)
        for(q=0;q<STATDEF[d].sec.length;q++){
            S=STATDEF[d].sec[q]; k=o.bon[S.k];
            if(k) L.push("+"+k+" "+S.n);
        }
    return L.length?L.join(", "):"sans effet";
}
/* ---- VIGNETTES D'OBJET ----
   Meme facon que les armes, en plus petit : des rectangles dans une boite de
   24 sur 24, peints a plat d'un seul blanc, et des decoupes a cinq valeurs
   qui percent des trous. Le contour et les trous font tout le travail. Rien
   n'est retourne : un objet n'a pas de bouche a placer a gauche. */
var IICON={
 /* --- sacs a dos --- */
 "sac1":[[8,3,8,2],[8,4,2,5],[14,4,2,5],[6,8,12,4],[7,12,10,7],[11,11,2,3,1]],
 "sac2":[[10,4,4,3],[11,5,2,2,1],[6,7,12,13],[8,12,8,1,1],[9,15,6,3,1]],
 "sac3":[[7,5,10,4],[6,8,12,12],[5,10,1,7],[18,10,1,7],[7,10,10,1,1],[9,13,6,4,1],[8,20,8,1]],
 "sac4":[[8,4,8,2],[5,6,14,14],[4,9,1,6],[19,9,1,6],[7,8,4,4,1],[13,8,4,4,1],[7,14,10,1,1],[9,17,6,2,1]],
 "sac5":[[6,4,12,3],[5,7,14,13],[4,8,1,9],[19,8,1,9],[7,7,10,1,1],[7,10,10,1,1],[8,13,8,5,1],[9,20,6,2]],
 /* --- vivres --- */
 "bouteille":[[10,2,4,3],[9,5,6,2],[8,7,8,13],[10,10,4,4,1]],
 "boutvide":[[10,2,4,3],[9,5,6,2],[8,7,8,13],[10,9,4,10,1]],
 "gourde":[[10,2,4,2],[7,4,10,16],[9,8,6,5,1],[6,7,1,8]],
 "bidon":[[6,5,12,15],[8,2,3,3],[8,9,8,8,1],[9,10,6,6]],
 "canette":[[8,4,8,16],[9,3,6,1],[10,7,4,7,1]],
 "brikjus":[[7,5,10,15],[15,1,1,5],[9,8,6,6,1]],
 "pomme":[[8,5,8,2],[7,7,10,10],[8,17,8,2],[11,2,1,3],[12,3,3,2]],
 "carotte":[[11,2,2,4],[8,3,2,3],[14,3,2,3],[10,6,4,4],[10,10,4,4],[11,14,2,4],[11,18,1,2]],
 "patate":[[7,8,10,8],[8,6,8,2],[8,16,8,2],[9,10,2,2,1],[13,13,2,2,1]],
 "chou":[[6,6,12,12],[8,4,8,2],[8,18,8,2],[11,7,1,10,1],[8,11,8,1,1]],
 "pain":[[4,9,16,7],[6,7,12,2],[6,16,12,2],[8,9,2,2,1],[12,9,2,2,1],[16,9,2,2,1]],
 "paquet":[[6,5,12,15],[8,3,2,2],[14,3,2,2],[8,8,8,6,1],[9,9,6,4]],
 "barre":[[4,9,16,6],[3,10,1,4],[20,10,1,4],[7,10,2,4,1],[12,10,2,4,1]],
 "conserve":[[7,5,10,15],[8,3,8,2],[8,9,8,6,1],[9,10,6,4]],
 "cartouches":[[4,10,16,10],[4,8,16,3],[6,3,3,7],[10,3,3,7],[14,3,3,7],[6,13,12,4,1]],
 /* --- ceintures de munitions : une sangle et ce qu'on y accroche --- */
 "cei1":[[2,10,20,5],[4,6,2,4],[7,6,2,4],[15,6,2,4],[18,6,2,4],[10,8,4,9],[11,10,2,5,1]],
 "cei2":[[3,10,18,4],[5,7,2,3],[16,7,2,3],[8,13,8,7],[8,12,8,2],[10,15,4,4,1]],
 "cei3":[[2,9,20,6],[9,6,6,11],[11,8,2,7,1],[4,15,5,5],[15,15,5,5],[5,17,3,2,1],[16,17,3,2,1]],
 "cei4":[[8,2,3,18],[13,2,3,18],[3,12,18,4],[9,4,1,7,1],[14,4,1,7,1],[10,13,4,2,1]],
 "cei5":[[3,3,18,3],[3,6,18,14],[5,8,4,4,1],[10,8,4,4,1],[15,8,4,4,1],[5,14,4,4,1],[10,14,4,4,1],[15,14,4,4,1]],
 "viande":[[6,4,5,16],[13,4,5,16],[6,9,5,2,1],[13,13,5,2,1],[6,15,5,2,1]],
 "ration":[[5,5,14,15],[6,3,12,2],[7,9,10,6,1],[8,10,8,4],[9,11,6,2,1]],
 /* --- medicaments --- */
 "pansement":[[4,9,16,6],[8,10,8,4,1],[9,11,6,2],[5,10,1,1,1],[5,13,1,1,1],[18,10,1,1,1],[18,13,1,1,1]],
 "bande":[[6,6,12,12],[10,10,4,4,1],[16,14,5,3],[16,17,3,2]],
 "flacon":[[10,2,4,3],[8,5,8,2],[7,7,10,13],[9,11,6,5,1]],
 "plaquette":[[5,6,14,12],[7,8,3,3,1],[11,8,3,3,1],[15,8,3,3,1],[7,13,3,3,1],[11,13,3,3,1],[15,13,3,3,1]],
 "kit":[[4,11,16,8],[6,13,12,4,1],[9,4,6,6],[11,6,2,2,1],[13,3,4,2]],
 "poche":[[7,3,10,3],[6,6,12,12],[8,9,8,6,1],[11,18,2,3],[10,20,4,2]],
 "seringue":[[3,10,3,4],[6,11,2,2],[8,9,9,6],[9,10,7,4,1],[17,10,2,4],[19,11,2,2]],
 "trousse":[[4,7,16,12],[9,4,6,3],[10,5,4,2,1],[11,10,2,6,1],[8,12,8,2,1]],
 /* --- armes de jet --- */
 "grenade":[[7,8,10,12],[9,11,2,2,1],[13,11,2,2,1],[9,15,2,2,1],[13,15,2,2,1],[9,5,6,3],[15,4,2,7],[17,3,4,4],[18,4,2,2,1]],
 "molotov":[[9,0,6,3],[11,2,2,4],[10,6,4,4],[7,10,10,11],[9,13,6,5,1]],
 "fumigene":[[9,2,6,2],[8,4,8,16],[10,7,4,2,1],[10,11,4,2,1],[10,15,4,2,1],[7,20,10,2]],
 "dynamite":[[6,8,12,12],[8,11,8,2,1],[8,16,8,2,1],[12,3,2,5],[14,1,3,3]],
 "cjet":[[3,11,6,2],[9,10,7,4],[16,8,2,8],[18,10,4,4],[19,11,2,2,1]],
 /* --- appareils --- */
 "appareil":[[3,6,18,13],[5,8,9,9,1],[16,9,3,2,1],[16,13,3,2,1]],
 "ecran":[[3,4,18,12],[5,6,14,8,1],[10,16,4,3],[7,19,10,2]],
 "boitier":[[4,7,16,11],[6,9,2,7,1],[9,9,2,7,1],[16,9,2,2],[16,13,2,2]],
 "ventilo":[[5,3,14,14],[7,5,10,10,1],[11,3,2,14],[5,9,14,2],[11,17,2,3],[8,20,8,2]],
 "moteur":[[3,8,18,10],[5,5,8,3],[6,10,6,6,1],[17,6,3,3],[4,18,3,3],[17,18,3,3]],
 /* --- outils --- */
 "marteau":[[13,3,7,8],[13,5,2,4,1],[3,6,11,3]],
 "tournevis":[[15,8,6,8],[17,10,1,4,1],[19,10,1,4,1],[10,11,5,2],[3,11,7,2]],
 "cleplate":[[2,7,7,10],[2,10,4,4,1],[9,10,6,4],[15,7,7,10],[18,10,4,4,1]],
 "pince":[[6,3,3,9],[12,3,3,9],[5,12,11,4],[7,16,3,5],[12,16,3,5]],
 "scie":[[3,6,16,4],[19,5,3,7],[3,10,2,2],[6,10,2,2],[9,10,2,2],[12,10,2,2],[15,10,2,2]],
 "perceuse":[[5,5,11,7],[7,7,6,3,1],[16,7,5,3],[8,12,5,8],[9,14,3,5,1],[7,19,7,3]],
 "barrefer":[[3,10,18,4],[3,8,2,8],[19,8,2,8]],
 "rouleau":[[5,5,14,14],[9,9,6,6,1],[19,10,3,4],[17,14,4,3]],
 /* --- materiaux --- */
 "planche":[[2,7,20,9],[4,9,16,1,1],[4,13,16,1,1],[6,10,2,3,1]],
 "palette":[[2,5,20,3],[2,10,20,3],[2,15,20,3],[3,8,3,7],[10,8,3,7],[17,8,3,7]],
 "tole":[[2,6,20,12],[4,6,2,12,1],[8,6,2,12,1],[12,6,2,12,1],[16,6,2,12,1]],
 "grillage":[[3,4,18,16],[5,6,3,3,1],[10,6,3,3,1],[15,6,3,3,1],[5,11,3,3,1],[10,11,3,3,1],[15,11,3,3,1],[5,16,3,3,1],[10,16,3,3,1],[15,16,3,3,1]],
 "brique":[[3,7,18,10],[5,9,6,2,1],[13,9,6,2,1],[5,13,6,2,1],[13,13,6,2,1]],
 "sacciment":[[6,4,12,3],[4,7,16,13],[6,10,12,7,1],[8,12,8,3]],
 "vitre":[[3,4,18,16],[5,6,14,12,1],[11,6,1,12],[5,11,14,1]],
 "porte":[[5,2,14,20],[7,4,10,7,1],[7,13,10,7,1],[16,11,2,2]],
 "tuyau":[[3,9,18,6],[5,8,2,8],[17,8,2,8],[8,11,8,2,1]],
 /* --- quincaillerie --- */
 "visserie":[[4,11,16,8],[6,13,12,4,1],[7,4,2,7],[6,3,4,2],[14,5,2,6],[13,4,4,2]],
 "charniere":[[4,4,7,16],[13,4,7,16],[6,7,3,3,1],[6,14,3,3,1],[15,7,3,3,1],[15,14,3,3,1],[11,3,2,18]],
 "cadenas":[[8,3,8,7],[10,5,4,5,1],[5,10,14,10],[10,13,4,4,1]],
 "chaine":[[3,9,6,6],[5,11,2,2,1],[9,9,6,6],[11,11,2,2,1],[15,9,6,6],[17,11,2,2,1]],
 "corde":[[4,5,16,4],[4,10,16,4],[4,15,16,4],[6,6,2,2,1],[12,6,2,2,1],[9,11,2,2,1],[15,11,2,2,1],[6,16,2,2,1],[12,16,2,2,1]],
 "ressort":[[4,5,16,3],[4,10,16,3],[4,15,16,3],[4,5,3,13],[17,5,3,13]],
 /* --- electricite --- */
 "cable":[[3,4,4,16],[17,4,4,16],[7,7,10,10],[9,9,6,6,1],[7,3,10,2],[7,19,10,2]],
 "batterie":[[3,7,18,12],[6,4,4,3],[14,4,4,3],[6,10,5,6,1],[13,10,5,6,1]],
 "pile":[[6,4,5,16],[13,4,5,16],[7,2,3,2],[14,2,3,2],[7,8,3,3,1],[14,12,3,3,1]],
 "solaire":[[2,5,20,14],[4,7,7,4,1],[13,7,7,4,1],[4,13,7,4,1],[13,13,7,4,1],[10,19,4,3]],
 "ampoule":[[8,3,8,9],[10,5,4,4,1],[9,12,6,3],[9,15,6,5],[10,16,4,1,1],[10,18,4,1,1]],
 "prise":[[4,4,16,16],[8,8,3,3,1],[13,8,3,3,1],[9,14,6,3,1]],
 /* --- chimie --- */
 "jerrican":[[4,5,14,15],[6,8,10,9,1],[8,10,6,5],[7,3,5,2],[18,7,3,3]],
 "bonbonne":[[7,5,10,16],[9,2,6,3],[10,0,4,2],[9,10,6,4,1]],
 "bidonchim":[[9,2,6,3],[7,5,10,15],[9,9,6,7,1],[11,10,2,4],[10,15,4,1]],
 "pot":[[5,3,14,2],[4,4,2,4],[18,4,2,4],[4,7,16,13],[6,10,12,7,1]],
 "tube":[[9,2,6,3],[7,5,10,10],[7,15,10,5],[8,17,8,1,1],[9,7,6,5,1]],
 /* --- cuisine --- */
 "assiette":[[4,6,16,12],[6,8,12,8,1],[8,10,8,4],[4,6,2,2,1],[18,6,2,2,1],[4,16,2,2,1],[18,16,2,2,1]],
 "couvert":[[6,4,2,16],[4,4,2,5],[9,4,2,5],[4,8,7,2],[14,4,4,9],[15,13,2,7]],
 "casserole":[[4,8,13,10],[6,10,9,6,1],[17,9,5,2],[6,6,9,2]],
 "verre":[[7,4,10,3],[8,7,8,11],[10,9,4,7,1],[7,18,10,2]],
 "rechaud":[[6,8,12,9],[8,10,8,5,1],[4,17,16,3],[10,4,4,4],[11,5,2,2,1],[18,9,3,2]],
 "alcool":[[10,1,4,4],[9,5,6,3],[7,8,10,12],[9,12,6,5,1],[10,13,4,3]],
 /* --- mobilier --- */
 "chaise":[[6,2,3,13],[6,12,13,3],[7,15,2,7],[16,15,2,7],[8,5,9,2]],
 "table":[[3,7,18,3],[5,10,2,10],[17,10,2,10],[6,17,12,2]],
 "matelas":[[2,7,20,10],[4,9,4,6,1],[10,9,4,6,1],[16,9,4,6,1]],
 "tissu":[[3,6,18,4],[3,10,18,4],[3,14,18,4],[5,7,3,2,1],[13,11,3,2,1],[8,15,3,2,1]],
 "vetement":[[7,4,10,4],[3,5,5,5],[16,5,5,5],[6,8,12,12],[9,4,6,3,1],[8,12,8,1,1]],
 "bache":[[3,5,18,14],[5,7,2,2,1],[17,7,2,2,1],[5,15,2,2,1],[17,15,2,2,1],[10,10,4,4,1]],
 "sacplast":[[8,3,8,4],[5,7,14,13],[7,10,10,7,1],[9,12,6,4]],
 "miroir":[[5,2,14,20],[7,4,10,16,1],[9,6,3,10],[13,7,2,6]],
 /* --- divers --- */
 "velo":[[2,10,7,7],[4,12,3,3,1],[15,10,7,7],[17,12,3,3,1],[6,8,12,2],[9,5,2,6],[8,3,5,2],[12,8,2,6]],
 "pneu":[[4,3,16,18],[7,6,10,12,1],[9,8,6,8]],
 "seau":[[4,3,16,2],[3,3,2,5],[19,3,2,5],[5,6,14,14],[7,9,10,9,1]],
 "caisse":[[3,5,18,14],[5,7,14,10,1],[3,10,18,2],[11,5,2,14]],
 "extincteur":[[7,6,10,15],[9,9,6,8,1],[9,2,6,4],[13,3,7,2],[5,8,3,2]],
 "talkie":[[7,5,10,16],[9,8,6,4,1],[9,13,2,2,1],[13,13,2,2,1],[14,1,2,5],[7,5,10,2]],
 "torche":[[3,8,6,8],[9,10,10,4],[19,9,2,6],[5,10,2,4,1],[11,11,6,2,1]],
 "jumelles":[[3,5,8,14],[13,5,8,14],[5,7,4,10,1],[15,7,4,10,1],[11,8,2,4]],
 /* --- vetements : tete ---
    Le casque est une calotte posee sur une nuque ; la casquette a sa
    visiere ; le masque a ses deux yeux perces et sa cartouche. */
 "vcasqm":[[5,7,14,8],[3,13,18,3],[7,4,10,4],[7,15,10,4],[6,9,12,4,1],[9,17,6,2,1]],
 "vcasqp":[[5,6,14,9],[3,12,18,3],[8,3,8,4],[2,15,20,3],[6,8,12,4,1],[10,4,4,2,1]],
 "vcasqt":[[6,6,12,8],[4,13,16,3],[3,15,18,2],[8,4,8,3],[7,8,10,3,1]],
 "vmasq":[[5,4,14,14],[7,7,4,4,1],[13,7,4,4,1],[9,13,6,4],[10,18,4,3],[3,6,2,6],[19,6,2,6]],
 "vbonn":[[5,8,14,10],[7,5,10,4],[4,16,16,3],[7,10,10,3,1],[10,3,4,3]],
 "vcago":[[5,4,14,16],[7,8,4,3,1],[13,8,4,3,1],[9,14,6,2,1],[3,9,2,7],[19,9,2,7]],
 /* --- vetements : torse ---
    Un buste vu de face : deux epaules, deux manches, une ouverture au
    milieu. Ce qui les distingue tient aux poches et au col. */
 "vtreil":[[6,4,12,17],[2,6,5,11],[17,6,5,11],[11,4,2,10,1],[7,14,4,4,1],[13,14,4,4,1],[9,3,6,3]],
 "vgilet":[[5,5,14,15],[3,7,3,9],[18,7,3,9],[11,5,2,9,1],[7,8,4,3,1],[13,8,4,3,1],[7,16,10,2,1],[8,3,8,3]],
 "vvestp":[[6,4,12,17],[2,6,5,12],[17,6,5,12],[4,10,16,3,1],[11,4,2,6,1],[8,15,8,3,1],[9,3,6,3]],
 "vblous":[[6,3,12,18],[3,5,4,11],[17,5,4,11],[11,3,2,12,1],[13,16,4,4,1],[8,3,3,4,1]],
 "vcuir":[[6,4,12,17],[3,6,4,10],[17,6,4,10],[11,4,2,11,1],[7,4,3,4],[14,4,3,4],[8,17,8,2,1]],
 "vcire":[[5,4,14,17],[2,6,4,12],[18,6,4,12],[8,3,8,4],[10,8,4,10,1],[6,18,12,2,1]],
 /* --- vetements : jambes ---
    Deux jambes separees par une fente, une ceinture en haut. Les poches
    laterales font le treillis, la bande verticale le jogging. */
 "vpantm":[[5,3,14,3],[5,6,6,15],[13,6,6,15],[3,9,3,5],[18,9,3,5],[6,10,4,3,1],[14,10,4,3,1]],
 "vpantp":[[5,3,14,3],[5,6,6,15],[13,6,6,15],[4,11,16,3,1],[6,17,4,3,1],[14,17,4,3,1]],
 "vpantt":[[5,3,14,3],[5,6,6,15],[13,6,6,15],[6,7,2,12,1],[16,7,2,12,1]],
 "vpantc":[[5,3,14,3],[5,6,6,15],[13,6,6,15],[6,8,4,4,1],[14,8,4,4,1],[7,15,2,5,1],[15,15,2,5,1]],
 "vjog":[[5,3,14,4],[5,7,6,14],[13,7,6,14],[7,8,2,12,1],[15,8,2,12,1],[5,18,6,2,1],[13,18,6,2,1]],
 "vjean":[[4,3,16,3],[5,6,6,15],[13,6,6,15],[6,7,3,4,1],[15,7,3,4,1],[11,4,2,2,1]],
 /* --- vetements : pieds ---
    Vus de profil : une semelle, une tige, un lacage. La botte monte, la
    basket file, le mocassin est bas et lisse. */
 "vrang":[[3,16,18,5],[5,6,11,11],[7,9,7,3,1],[7,13,7,2,1],[16,13,4,4],[4,18,16,2,1]],
 "vbottp":[[3,15,18,6],[5,3,11,14],[16,11,5,5],[7,6,7,3,1],[7,11,7,3,1],[4,17,16,2,1]],
 "vsecu":[[3,15,18,6],[5,8,12,9],[17,11,4,5],[7,10,8,3,1],[4,17,16,2,1],[5,6,10,3]],
 "vbask":[[3,16,18,5],[4,10,12,7],[16,12,5,5],[6,12,8,3,1],[3,18,18,2,1],[5,8,8,3],[9,13,2,3]],
 "vmoca":[[4,15,17,5],[6,11,11,5],[17,13,4,3],[8,12,7,3,1],[5,17,15,2,1]],
 "vbottc":[[3,16,18,5],[5,2,11,15],[16,12,5,4],[7,5,7,10,1],[4,18,16,2,1]],
 /* --- stimulants ---
    un tube a bouchon, et une ampoule de verre a col etroit */
 "tube":[[8,5,8,17],[10,8,4,11,1],[7,2,10,4],[9,3,6,2,1],[9,19,6,2,1]],
 "ampoule":[[9,8,6,13],[11,11,2,8,1],[10,4,4,5],[9,2,6,3],[11,5,2,3,1],[8,19,8,2]]
};
/* La boite fait 24 sur 24, rendue en 96 : quatre pixels par carreau. */
function itIconDraw(g,key,ox,oy,sc,col){
    var r=IICON[key], q, a;
    if(!r) return;
    g.fillStyle=col||IWHITE;
    for(q=0;q<r.length;q++){
        a=r[q];
        if(a[4]) g.clearRect(ox+a[0]*sc, oy+a[1]*sc, Math.max(1,a[2]*sc), Math.max(1,a[3]*sc));
        else g.fillRect(ox+a[0]*sc, oy+a[1]*sc, Math.max(1,a[2]*sc), Math.max(1,a[3]*sc));
    }
}
/* Un objet manque-t-il de vignette ? Le banc s'en sert pour le verifier. */
function iconAudit(){
    var m=[], i;
    for(i=0;i<ITEMS.length;i++) if(!IICON[ITEMS[i].ic]) m.push(ITEMS[i].n);
    return m;
}
/* ---- LE SAC ET SON CONTENU ----
   p.bag porte l'indice du sac dans ITEMS, -1 quand on n'en a pas. p.inv est
   la suite des cases : null, ou {i:indice de l'objet, q:combien}. Une case ne
   tient qu'une sorte, dix exemplaires au plus ; une arme prendra une case
   entiere a elle seule quand elle descendra dans le sac. */
function bagItem(){ var p=G&&G.p; return (p&&p.bag>=0)?itemById(p.bag):null; }
/* Les poches du joueur, sans sac : DEUX, et non les POCKETS=3 de tout le
   monde. L'ecart est ancien et volontaire - le joueur commence plus demuni
   que ceux qu'il croise. Il porte un nom parce que bagDropOk doit connaitre
   exactement la capacite qui s'appliquera apres qu'on ait ote le sac, et que
   deux copies du meme chiffre finiraient par diverger. */
var PPOCKETS=2;
function bagCap(){ var b=bagItem(); return b?b.cap:PPOCKETS; }
/* ================= LE PORTEUR, QUEL QU'IL SOIT =================
   Tout ce qui suit existait pour le joueur seul, cable en dur sur G.p : la
   capacite du sac, le poids porte, le rangement d'un objet. Un compagnon
   qu'on habille et qu'on charge a besoin exactement des memes regles - et
   des memes limites, sinon il deviendrait une charrette sans fond.
   Les anciennes fonctions du joueur restent, elles appellent celles-ci. */
function ownBag(o){ return (o&&o.bag>=0)?itemById(o.bag):null; }
function ownCap(o){ var b=ownBag(o); return b?b.cap:POCKETS; }
/* Ses dimensions : celles de son sac, ou ses poches en une seule ligne. */
function ownGW(o){ var b=ownBag(o); return b?b.bw:POCKETS; }
function ownGH(o){ var b=ownBag(o); return b?b.bh:1; }
function ownFit(o){
    if(!o) return;
    var c=ownGW(o)*ownGH(o);
    if(!o.inv) o.inv=[];
    while(o.inv.length<c) o.inv.push(null);
    if(o.inv.length>c) o.inv.length=c;
    /* la largeur voyage avec le tableau : les fonctions generiques n'ont pas
       de porteur a qui la demander */
    o.inv.gw=ownGW(o);
}
/* Ce qu'il porte en tout : le sac lui-meme, ses armes, sa tenue, son contenu
   et le vrac d'une boite entamee. La meme addition que pour le joueur. */
function ownWeight(o){
    var s=0, i, c, d;
    if(!o) return 0;
    d=ownBag(o); if(d) s+=d.pds;
    if(o.slots) for(i=0;i<o.slots.length;i++)
        if(o.slots[i]&&o.slots[i].pds) s+=o.slots[i].pds;
    s+=vetWeight(o);
    if(o.inv) for(i=0;i<o.inv.length;i++){
        c=o.inv[i]; if(!c) continue;
        s+=cellWeight(c);
    }
    if(o.loose) s+=looseWeight(o);
    return s;
}
/* Sa charge autorisee, indexee sur son Portage comme la votre. Un compagnon
   costaud porte quarante kilos, un instituteur bien moins - c'est ce qui
   rend le choix de qui emporte quoi interessant. */
function ownCarry(o){
    return CFG.CARRY_BASE+CFG.CARRY_PER*statEff(o,"cardio","portage");
}
/* On ne charge personne au-dela du double de ce qu'il peut porter : le
   joueur peut se surcharger parce qu'il en subit les consequences a chaque
   pas ; un compagnon ne les subit pas, on ne lui en fait donc pas porter. */
function ownRoom(o,add){
    return (ownWeight(o)+(add||0))<=ownCarry(o)*2;
}
/* ---- CE QUE LA CHARGE COUTE A CELUI QUI LA PORTE ----
   La limite de portage n'etait qu'un plafond arbitraire : on refusait le
   kilo de trop, mais les kilos acceptes ne coutaient rien. Un compagnon
   charge a ras bord marchait aussi vite qu'un compagnon nu, et choisir qui
   emportait quoi ne voulait rien dire.
   Meme regle que pour le joueur : jusqu'a la moitie de sa capacite on ne
   sent rien, puis l'allure descend jusqu'a CARRY_SLOW a pleine charge, et
   au-dela on tombe au pas. */
function ownLoad(o){
    var c=ownCarry(o), r;
    if(c<=0) return 1;
    r=ownWeight(o)/c;
    return (r<=CFG.CARRY_FREE)?0:Math.min(1,(r-CFG.CARRY_FREE)/(1-CFG.CARRY_FREE));
}
function ownSpeedMul(o){
    var r=ownWeight(o)/Math.max(1,ownCarry(o)), lo=CFG.CARRY_SLOW*0.5;
    /* Au-dela du poids autorise l'allure continue de descendre, jusqu'a la
       moitie de CARRY_SLOW au double de la charge - c'est le plancher, on ne
       s'arrete jamais tout a fait. Sans cette seconde pente, charger
       quelqu'un a une fois et demie ou a deux fois revenait au meme. */
    if(r>1) return Math.max(lo,CFG.CARRY_SLOW-(CFG.CARRY_SLOW-lo)*Math.min(1,r-1));
    return 1-(1-CFG.CARRY_SLOW)*ownLoad(o);
}
function ownFree(o){
    var n=0, i;
    if(!o||!o.inv) return 0;
    for(i=0;i<o.inv.length;i++) if(!o.inv[i]) n++;
    return n;
}
/* Ranger un objet chez quelqu'un : on complete les piles entamees avant
   d'ouvrir une case neuve, exactement comme pour le joueur. */
function ownPush(o,id,q){
    var d=itemById(id), i, c;
    if(!o||!d) return false;
    ownFit(o);
    q=q||1;
    if(!ownRoom(o,d.pds*q)) return false;
    for(i=0;i<o.inv.length&&q>0;i++){
        c=o.inv[i];
        if(c&&!cellIsW(c)&&c.i===id) while(q>0&&c.q<cellMax(c)){ c.q++; q--; }
    }
    /* un compagnon garnit ses ceintures comme vous les votres : sans cela
       une ceinture confiee ne servirait a rien tant qu'il la porte */
    if(d.k==="mun") for(i=0;i<o.inv.length&&q>0;i++){
        var ob=cellBareBelt(o.inv[i]);
        if(!ob) continue;
        c={i:id,q:0,b:ob.id}; o.inv[i]=c;
        while(q>0&&c.q<ob.blt){ c.q++; q--; }
    }
    while(q>0){
        var at=gridFind(o.inv,d.gw||1,d.gh||1);
        if(at<0) break;
        c={i:id,q:0};
        gridPut(o.inv,at,c);
        while(q>0&&c.q<d.mx){ c.q++; q--; }
    }
    return q<=0;
}
/* Une arme prend une case entiere, chez lui comme chez vous. */
function ownPushW(o,wi){
    var w=WEAPONS[wi], i;
    if(!o||!w) return false;
    ownFit(o);
    if(!ownRoom(o,w.pds||0)) return false;
    return gridAdd(o.inv,{w:wi,q:1});
}
/* Une case ceinturee se pose ENTIERE ou pas du tout : la ceinture et ses
   boites ne se separent pas en chemin. ownPush ne saurait pas la porter - il
   ne connait qu'un identifiant et un nombre - il faut donc une case libre et
   le poids de l'ensemble. */
function ownPushWhole(o,c){
    var i;
    if(!o||!c||c.b===undefined) return false;
    ownFit(o);
    if(!ownRoom(o,cellWeight(c))) return false;
    return gridAdd(o.inv,{i:c.i,q:c.q||1,b:c.b});
}
/* Ranger une case entiere telle quelle - c'est ce que font les transferts. */
function ownPushCell(o,c){
    if(!c) return false;
    if(c.b!==undefined) return ownPushWhole(o,c);
    return cellIsW(c)?ownPushW(o,c.w):ownPush(o,c.i,c.q||1);
}
/* Poser une arme dans l'emplacement de sa categorie. Elle arrive vide : la
   meme regle que pour le joueur, sans quoi armer un compagnon serait un
   stock de munitions infini. */
function ownSetSlot(o,wi){
    var w=WEAPONS[wi], sl;
    if(!o||!w) return false;
    sl=wSlot(w);
    if(sl<0||sl>3) return false;
    if(!o.slots) o.slots=[null,null,null,null];
    if(!o.mag) o.mag=[0,0,0,0];
    if(o.slots[sl]) return false;
    if(!ownRoom(o,w.pds||0)) return false;
    o.slots[sl]=w; o.mag[sl]=0;
    return true;
}
/* ================= EQUIPER LES SIENS =================
   On ne troque pas avec ses gens : on leur donne, et on reprend. La valeur,
   la tolerance et la fourchette restent pour les inconnus. C'est la branche
   gratuite du socle commun, et elle vaut partout ou l'on croise un des
   siens - dans la table a deux, dans la fenetre ECHANGE et dans l'onglet du
   dialogue.

   DEUX SOURCES, SELON L'ENDROIT. Dehors, c'est votre sac qui fait face au
   sien : ce que vous avez sur le dos, vous pouvez le lui passer. Chez vous,
   ce sont les rayonnages : la base garde ce qu'on a rapporte, et c'est de
   la qu'on habille et qu'on arme ceux qui repartent. La table choisit seule
   selon que l'on est rentre ou non. Un inconnu, lui, n'a jamais les
   rayonnages en face de lui : on ne troque pas ses reserves avec un
   passant.

   IL A SES LIMITES. Son sac a ses cases, son Portage a son poids, et l'on
   ne le charge pas au-dela du double - il ne subit pas la surcharge a chaque
   pas comme vous, alors on ne la lui inflige pas. C'est ce qui fait qu'on
   choisit qui emporte quoi. */
/* CELUI QU'ON DESHABILLE EST CELUI QUI EST EN FACE, quelle que soit la
   surface ouverte. C'etait G.eqn et rien d'autre : on ne pouvait reprendre
   un fusil a quelqu'un que depuis la colonne de l'onglet GROUPE, donc chez
   soi, donc jamais au moment ou l'on en a besoin. xchgWho donne le meme
   ordre de priorite qu'ailleurs - la table a deux, puis le dialogue, puis
   la colonne - et les trois gestes ci-dessous s'en servent maintenant.
   La garde tient toujours : xchgFree decide si l'on a le droit, et un
   etranger ne se laisse pas deshabiller. */
function eqTarget(){ return xchgWho(); }
/* La colonne de l'onglet GROUPE, elle, s'occupe de celui qu'on a designe la
   et de personne d'autre : sans cela, ouvrir un dialogue repeindrait la
   colonne sur l'inconnu de passage. */
function eqCol(){ return (G&&G.eqn)||null; }
/* La source est celle du socle commun : xchgSrc, la meme pour les trois
   surfaces. Ce qui revient d'un emplacement y retourne. */
function eqSrcInv(){ return xchgSrc(eqTarget()); }
/* Retirer une case d'une source, en tenant compte de la pile. */
function eqPull(inv,ci,all){
    var c=(inv&&ci>=0&&ci<inv.length)?inv[ci]:null, out;
    if(!c) return null;
    /* LA CEINTURE NE SUIT PAS SES BOITES AU CLIC ORDINAIRE. On ne tire alors
       de la case que des munitions ; le contenant reste ou il est et la case
       redevient une ceinture vide. C'est ce qui evite de la perdre par
       megarde en prenant une boite.
       AU MAJ+CLIC, TOUT PART - la case entiere, ceinture comprise. Le meme
       geste vaut pour n'importe quelle pile : dix conserves d'un coup au lieu
       d'une, il n'y a donc qu'une regle a retenir. */
    if(!cellIsW(c)&&c.b!==undefined&&!all){
        out={i:c.i,q:1};
        c.q--;
        if(c.q<=0) inv[ci]={i:c.b,q:1};
        return out;
    }
    if(cellIsW(c)||all||(c.q||1)<=1) return gridTake(inv,ci);
    out={i:c.i,q:1}; c.q--;
    return out;
}
/* Rendre une case a une source qui n'a pas voulu du transfert. */
function eqBack(inv,c){
    var i;
    if(!c||!inv) return false;
    if(!cellIsW(c)&&c.b===undefined){
        for(i=0;i<inv.length;i++){
            var e=inv[i];
            if(e&&!cellIsW(e)&&e.i===c.i&&e.q<cellMax(e)){
                var t=Math.min(c.q,cellMax(e)-e.q);
                e.q+=t; c.q-=t;
                if(c.q<=0) return true;
            }
        }
    }
    return gridAdd(inv,c);
}
/* ---- DONNER ----
   Une case de la source part chez lui. Une arme et un vetement vont droit a
   leur emplacement s'il est libre ; sinon, et pour tout le reste, dans son
   sac. Ce qui ne rentre pas revient d'ou il venait : rien ne se perd.
   Qui et d'ou sont passes en clair : le meme geste sert dans la table a
   deux, dans la fenetre ECHANGE et dans l'onglet du dialogue. */
function xGive(n,inv,ci,all){
    var c, o, ok=false;
    if(!n||!inv) return false;
    c=eqPull(inv,ci,all);
    if(!c) return false;
    ownFit(n);
    if(cellIsW(c)) ok=ownSetSlot(n,c.w)||ownPushW(n,c.w);
    else if(c.b!==undefined) ok=ownPushWhole(n,c);
    else {
        o=itemById(c.i);
        if(o&&o.k==="vet"&&n.vet&&!vetAt(n,o.sl)&&ownRoom(n,o.pds)){
            vetSet(n,o.id);
            c.q--; ok=true;
            if(c.q>0) ok=eqBack(inv,c);
        } else if(o&&o.k==="sac"&&n.bag<0&&ownRoom(n,o.pds)){
            n.bag=o.id; ownFit(n);
            c.q--; ok=true;
            if(c.q>0) ok=eqBack(inv,c);
        } else ok=ownPush(n,c.i,c.q||1);
    }
    if(!ok){ eqBack(inv,c); notice("IL NE PEUT PAS EN PORTER PLUS"); return false; }
    return true;
}
/* ---- REPRENDRE ----
   Une case de son sac revient a la source. Chez vous, les rayonnages n'ont
   pas de limite de poids, seulement des cases ; dehors, c'est votre dos qui
   decide, et ce qui ne rentre pas tombe a terre plutot que de s'evaporer. */
function xTakeCell(inv,c){
    if(!c) return false;
    /* les rayonnages n'ont que des cases, votre dos a un poids */
    if(inv&&G&&G.p&&inv!==G.p.inv) return eqBack(inv,c);
    if(cellIsW(c)){ if(invPushW(c.w)) return true; }
    else if(c.b!==undefined){
        /* la ceinture et ses boites ne se separent pas : il faut une case
           libre pour l'ensemble, sinon le tout tombe a terre - et le sol
           sait la porter depuis gndDrop */
        invFit();
        if(gridAdd(G.p.inv,{i:c.i,q:c.q||1,b:c.b})) return true;
    }
    else if(invPush(c.i,c.q||1)) return true;
    gndDrop(c,G.p.x,G.p.y);
    logMsg("Plus de place : "+(cellObj(c)||{n:"quelque chose"}).n+" tombe a terre.","jday");
    return true;
}
function xTake(n,inv,ci,all){
    var c;
    if(!n||!n.inv) return false;
    c=eqPull(n.inv,ci,all);
    if(!c) return false;
    if(!xTakeCell(inv,c)){ eqBack(n.inv,c); notice("PLUS DE PLACE"); return false; }
    return true;
}
/* Lui retirer une arme, une piece de tenue ou son sac : cela revient a la
   source, pas dans ses poches. */
function eqStripW(sl){
    var n=eqTarget(), w;
    if(!n||!xchgFree(n)) return false;
    if(!n.slots||sl<0||sl>3) return false;
    w=n.slots[sl];
    if(!w) return false;
    if(!xTakeCell(eqSrcInv(),{w:WEAPONS.indexOf(w),q:1})) return false;
    n.slots[sl]=null;
    if(n.mag) n.mag[sl]=0;
    return true;
}
function eqStripV(s){
    var n=eqTarget(), id;
    if(!n||!xchgFree(n)) return false;
    if(!n.vet||s<0||s>3) return false;
    id=n.vet[s];
    if(id<0) return false;
    if(!xTakeCell(eqSrcInv(),{i:id,q:1})) return false;
    vetClear(n,s);
    return true;
}
function eqStripBag(){
    var n=eqTarget(), id, i;
    if(!n||!xchgFree(n)) return false;
    if(n.bag<0) return false;
    /* on ne retire pas un sac plein : ce qu'il contient n'aurait plus ou
       aller, et le silence serait pire qu'un refus */
    if(n.inv) for(i=0;i<n.inv.length;i++) if(n.inv[i]){
        notice("VIDEZ SON SAC D'ABORD"); return false; }
    id=n.bag;
    if(!xTakeCell(eqSrcInv(),{i:id,q:1})) return false;
    n.bag=-1; ownFit(n);
    return true;
}
/* Le sac du joueur suit la meme regle, il a seulement son propre nom. */
function bagGW(){ var b=bagItem(); return b?b.bw:PPOCKETS; }
function bagGH(){ var b=bagItem(); return b?b.bh:1; }
function invFit(){
    var p=G.p, c=bagGW()*bagGH();
    if(!p.inv) p.inv=[];
    while(p.inv.length<c) p.inv.push(null);
    if(p.inv.length>c) p.inv.length=c;
    p.inv.gw=bagGW();
}
function setBag(bi){
    var p=G.p, b=(bi>=0&&bi<BAGS.length)?BAGS[bi]:null;
    p.bag=b?b.id:-1;
    invFit();
}
/* Ce que porte une case : un objet du registre, ou une arme. Une arme prend
   la case entiere, elle ne s'empile pas. */
function cellObj(c){
    if(!c) return null;
    /* un renvoi occupe la case mais ne contient rien */
    if(c.r!==undefined) return null;
    if(c.w!==undefined) return WEAPONS[c.w]||null;
    return itemById(c.i);
}
function cellIsW(c){ return !!(c&&c.w!==undefined); }
/* ================= L'INVENTAIRE A DES FORMES =================
   inv reste un TABLEAU PLAT, lu en lignes : la case (x,y) est inv[y*gw+x].
   Ce n'est pas de la paresse - tout le jeu designe une case par son rang, du
   journal d'entrees au glisser-deposer, et passer a deux coordonnees aurait
   demande de reecrire chaque action au lieu du seul rangement.

   UN OBJET QUI DEBORDE POSE DES RENVOIS. La case du coin haut-gauche porte
   l'objet, les autres portent {r:rang de l'ancre}. Un renvoi n'est pas vide -
   il occupe - mais il ne contient rien : cellObj rend null, donc toutes les
   boucles qui cherchent une pile, un poids ou un calibre le sautent d'
   elles-memes, sans qu'on ait eu a les visiter une par une.

   LA LARGEUR VOYAGE AVEC LE TABLEAU, dans inv.gw. Une grille sans largeur
   serait une ligne, et les fonctions generiques - la reserve de la base, le
   butin d'un batiment, le sac d'un inconnu - n'ont pas de porteur a qui la
   demander. ownFit et invFit la reposent a chaque appel. */
function cellIsRef(c){ return !!(c&&c.r!==undefined); }
function invGW(inv){ return (inv&&inv.gw)||1; }
/* La forme d'une case : celle de l'arme ou de l'objet qu'elle porte. */
function cellGW(c){ var o=cellObj(c); return (o&&o.gw)||1; }
function cellGH(c){ var o=cellObj(c); return (o&&o.gh)||1; }
/* Toutes les cases qu'un objet pose en (at) couvrirait, ou null si la forme
   sort de la grille. On ne replie jamais une ligne sur la suivante : un objet
   de trois cases en (3,0) d'une grille de cinq ne deborde pas sur (0,1). */
function gridSpan(inv,at,gw,gh){
    var W=invGW(inv), H=Math.ceil(inv.length/W), x=at%W, y=(at/W)|0, i, j, L=[];
    if(at<0||at>=inv.length) return null;
    if(x+gw>W||y+gh>H) return null;
    for(j=0;j<gh;j++) for(i=0;i<gw;i++) L.push((y+j)*W+(x+i));
    return L;
}
/* La place est-elle libre ? skip permet d'ignorer une ancre - c'est ce qui
   laisse un objet se reposer sur lui-meme quand on le deplace d'un cran. */
function gridFree(inv,at,gw,gh,skip){
    var L=gridSpan(inv,at,gw,gh), i, c;
    if(!L) return false;
    for(i=0;i<L.length;i++){
        c=inv[L[i]];
        if(!c) continue;
        if(skip!==undefined&&(L[i]===skip||(cellIsRef(c)&&c.r===skip))) continue;
        return false;
    }
    return true;
}
/* Le premier endroit ou la forme rentre, en lisant par lignes. Rend -1 quand
   il reste des cases vides mais aucune de la bonne forme : c'est le refus que
   l'ancien tableau plat ne savait pas prononcer. */
function gridFind(inv,gw,gh){
    var i;
    if(!inv) return -1;
    for(i=0;i<inv.length;i++) if(gridFree(inv,i,gw,gh)) return i;
    return -1;
}
/* ---- L'ECHANGE DE DEUX CASES, ET IL SAIT REFUSER ----
   L'ancien tableau plat permutait a l'aveugle : toutes les cases faisaient
   une case, l'echange etait toujours legal, et c'etait LE geste pour ranger
   ses poches. Les formes l'ont emporte avec elles - lacher sur une case prise
   ne faisait plus rien, sans un mot pour dire pourquoi.
   IL REVIENT, MAIS IL SE SIMULE AU LIEU DE SE SUPPOSER. On ote les deux, on
   pose le tire a l'endroit vise, on cherche une place a l'autre - d'abord
   celle qu'on vient de liberer, la vraie permutation, puis n'importe
   laquelle - et l'on ne valide que si les deux tiennent. Un fusil de trois
   cases contre une conserve d'une seule echoue le plus souvent, et c'est
   juste ; deux conserves permutent toujours, et c'est le cas courant.
   RIEN N'EST LAISSE A MOITIE : si quoi que ce soit manque, chacun retrouve
   exactement sa place. */
function gridClone(inv){
    var o=inv.slice(0);
    o.gw=invGW(inv);
    return o;
}
function gridSwap(inv,si,di){
    var cs=(inv&&si>=0&&si<inv.length)?inv[si]:null, da, cd;
    if(!cs||cellIsRef(cs)) return false;
    if(di<0||di>=inv.length) return false;
    /* lache sur un renvoi : c'est l'objet qui deborde dessus qu'on echange,
       mais c'est bien la case VISEE qui accueille celui qu'on porte */
    da=cellIsRef(inv[di])?inv[di].r:di;
    if(da===si) return false;                 /* c'est lui-meme */
    cd=inv[da];
    if(!cd||cellIsRef(cd)) return false;      /* case vide : ce n'est pas un echange */
    gridTake(inv,si);
    gridTake(inv,da);
    if(gridFree(inv,di,cellGW(cs),cellGH(cs))&&gridPut(inv,di,cs)){
        /* la place qu'on vient de liberer d'abord : c'est la permutation */
        if(gridFree(inv,si,cellGW(cd),cellGH(cd))&&gridPut(inv,si,cd)) return true;
        if(gridAdd(inv,cd)) return true;
        gridTake(inv,di);
    }
    gridPut(inv,si,cs);
    gridPut(inv,da,cd);
    return false;
}
/* Poser une case et semer ses renvois. */
function gridPut(inv,at,c){
    var L=gridSpan(inv,at,cellGW(c),cellGH(c)), i;
    if(!L) return false;
    inv[at]=c;
    for(i=1;i<L.length;i++) inv[L[i]]={r:at};
    return true;
}
/* Poser ou l'on peut, sans dire ou. */
function gridAdd(inv,c){
    var at=gridFind(inv,cellGW(c),cellGH(c));
    if(at<0) return false;
    return gridPut(inv,at,c);
}
/* Le rang de l'ancre pour une case quelconque : un renvoi renvoie a elle,
   une ancre est sa propre ancre. */
function gridAnchor(inv,i){
    var c=(inv&&i>=0&&i<inv.length)?inv[i]:null;
    if(!c) return -1;
    return cellIsRef(c)?c.r:i;
}
/* Oter une ancre et tous ses renvois. */
function gridTake(inv,at){
    var c=(inv&&at>=0&&at<inv.length)?inv[at]:null, L, i;
    if(!c||cellIsRef(c)) return null;
    L=gridSpan(inv,at,cellGW(c),cellGH(c));
    if(L) for(i=0;i<L.length;i++) inv[L[i]]=null; else inv[at]=null;
    return c;
}
/* Combien de cases sont prises - renvois compris, puisqu'ils occupent. */
/* Agrandir d'une LIGNE ENTIERE et jamais d'une case : une grille dont la
   derniere ligne est incomplete aurait des rangs qui ne correspondent a
   aucune case, et gridSpan y placerait des objets hors du tableau. */
function gridGrow(inv){
    var W=invGW(inv), i;
    for(i=0;i<W;i++) inv.push(null);
}
/* Poser coute que coute - c'est ce dont un mort a besoin, lui qui n'a plus
   de capacite a respecter. */
function gridAddGrow(inv,c){
    if(gridAdd(inv,c)) return true;
    gridGrow(inv);
    return gridAdd(inv,c);
}
function gridUsed(inv){
    var n=0, i;
    if(!inv) return 0;
    for(i=0;i<inv.length;i++) if(inv[i]) n++;
    return n;
}
/* ---- LA CEINTURE ATTACHEE A UNE CASE ----
   Une case de munitions peut porter une ceinture : le champ b vaut alors
   l'identifiant de la ceinture, et la case tient blt boites au lieu d'une.
   LA CEINTURE N'EST PAS DANS LA CASE, ELLE EST LA CASE : c'est pourquoi elle
   survit a l'epuisement des boites - la case redevient une ceinture vide au
   lieu de disparaitre, sans quoi tirer sa derniere cartouche ferait perdre
   le contenant. Le meme sort que le sac du mort, pour la meme raison.
   Une ceinture SEULE dans une case est un objet ordinaire, {i:son id} : elle
   ne devient un contenant qu'au moment ou l'on y verse des munitions. */
function cellBelt(c){
    if(!c||c.b===undefined) return null;
    var b=itemById(c.b);
    return (b&&b.blt)?b:null;
}
/* Combien cette case-ci peut tenir. Ce n'est plus une propriete de l'objet
   mais de la case, puisque deux cases du meme calibre n'ont pas la meme
   contenance selon qu'une ceinture y est attachee. */
function cellMax(c){
    var b=cellBelt(c), o;
    if(b) return b.blt;
    o=cellObj(c);
    return o?o.mx:1;
}
/* Une ceinture posee seule, prete a recevoir : c'est ce que cherchent les
   fonctions de rangement avant d'ouvrir une case neuve. */
function cellBareBelt(c){
    var o;
    if(!c||cellIsW(c)||c.b!==undefined) return null;
    o=itemById(c.i);
    return (o&&o.blt)?o:null;
}
/* Ce que pese une case : son contenu, plus la ceinture qui le porte. Une
   ceinture vide pese aussi - c'est ce qui empeche d'en emporter cinq pour
   rien. */
function cellWeight(c){
    var o=cellObj(c), b=cellBelt(c), s=0;
    if(o) s+=o.pds*(c.q||1);
    if(b) s+=b.pds;
    return s;
}
/* Poser dans une case. Le code vaut l'indice de l'objet, ou 200 plus l'indice
   de l'arme. Le meme objet une seconde fois monte la pile d'un cran, jusqu'a
   dix ; autre chose remplace ce qui s'y trouvait. */
function setCell(ci,code){
    var p=G.p;
    invFit();
    if(ci<0||ci>=p.inv.length) return;
    if(code<0){ gridTake(p.inv,gridAnchor(p.inv,ci)); return; }
    if(code>=200){
        var wi=code-200;
        if(wi>=WEAPONS.length) return;
        /* comme un ramassage : l'arme gagne sa case de categorie si elle est
           libre, sinon elle occupe une case entiere du sac */
        var wsl=wSlot(WEAPONS[wi]);
        if(p.slots&&!p.slots[wsl]){ setSlot(wsl,wi); return; }
        gridTake(p.inv,gridAnchor(p.inv,ci));
        if(!gridFree(p.inv,ci,WEAPONS[wi].gw,WEAPONS[wi].gh)) return;
        gridPut(p.inv,ci,{w:wi,q:1});
        return;
    }
    /* Le sac a dos etait interdit de case : un objet de nature "sac" ne
       pouvait pas se poser dans une poche, de sorte qu'on ne pouvait s'en
       munir que par la liste de reglage, qui les cree de rien. Depuis le
       glisser-deposer, il faut qu'un sac puisse tenir dans une case pour
       qu'on puisse le tirer sur son emplacement - et otez-en un, il faut
       bien qu'il aille quelque part. Il pese et il occupe comme le reste. */
    var o=itemById(code);
    if(!o) return;
    /* comme un ramassage : un vetement rejoint sa case, un sac s'enfile si
       l'on n'en porte aucun ; sinon on retombe dans la poche choisie */
    if((o.k==="vet"||o.k==="sac")&&autoWearOne(o)) return;
    var c=p.inv[ci];
    if(c&&!cellIsW(c)&&c.i===code) c.q=Math.min(cellMax(c),c.q+1);
    /* verser des munitions sur une ceinture posee la garnit au lieu de la
       remplacer : c'est le geste qu'on attend d'un contenant */
    else if(c&&cellBareBelt(c)&&o.k==="mun") p.inv[ci]={i:code,q:1,b:c.i};
    else {
        /* la liste de reglage cree de rien : la forme doit rentrer a l'endroit
           designe, sinon on ne pose rien plutot que d'ecraser un voisin */
        gridTake(p.inv,gridAnchor(p.inv,ci));
        if(!gridFree(p.inv,ci,o.gw||1,o.gh||1)) return;
        gridPut(p.inv,ci,{i:code,q:1});
    }
}
/* Glisser un objet dans le sac sans dire ou : on complete une pile entamee,
   sinon on prend la premiere case libre. Rend faux si tout n'a pas tenu. */
function invPush(id,q){
    var p=G.p, o=itemById(id), i, c;
    if(!o) return false;
    invFit();
    q=q||1;
    /* On complete d'abord les piles entamees, jusqu'a leur plafond, avant
       d'ouvrir une case neuve - et une case neuve se remplit elle aussi
       jusqu'au plafond. Sans cette double boucle, dix conserves d'un coup
       occupaient dix cases au lieu d'une : sans effet tant que rien ne
       versait par poignees, criant des que les batiments se fouillent. */
    for(i=0;i<p.inv.length&&q>0;i++){
        c=p.inv[i];
        if(c&&!cellIsW(c)&&c.i===id) while(q>0&&c.q<cellMax(c)){ c.q++; q--; }
    }
    /* LES CEINTURES AVANT LES CASES NEUVES. Une ceinture posee au fond du sac
       se charge d'elle-meme quand on ramasse des boites : sans cela il
       faudrait la garnir a la main a chaque trouvaille, et l'on ouvrirait une
       case pleine a un dixieme pendant qu'un contenant vide dort a cote. */
    if(o.k==="mun") for(i=0;i<p.inv.length&&q>0;i++){
        var bb=cellBareBelt(p.inv[i]);
        if(!bb) continue;
        c={i:id,q:0,b:bb.id}; p.inv[i]=c;
        while(q>0&&c.q<bb.blt){ c.q++; q--; }
    }
    /* OUVRIR UNE CASE NEUVE EST DEVENU UN PLACEMENT. On ne cherche plus la
       premiere case vide mais le premier endroit ou la FORME rentre, et l'on
       sait refuser alors qu'il reste des cases libres - un pied-de-biche de
       deux sur un ne se glisse pas dans deux trous separes. */
    while(q>0){
        var at=gridFind(p.inv,o.gw||1,o.gh||1);
        if(at<0) break;
        c={i:id,q:0};
        gridPut(p.inv,at,c);
        while(q>0&&c.q<o.mx){ c.q++; q--; }
    }
    return q===0;
}
/* Se servir d'une case : un medicament rend ses points aussitot, un vivre
   ouvre une remise en forme lente. Le reste ne se consomme pas. */
function useCell(ci){
    var p=G.p, c=(p.inv&&ci>=0&&ci<p.inv.length)?p.inv[ci]:null;
    if(!c||cellIsW(c)) return;
    var o=itemById(c.i);
    if(!o) return;
    if(o.k==="med"){
        if(o.hp) p.hp=Math.min(p.maxhp,p.hp+o.hp);
        /* un stimulant rend le souffle d'un coup, et rien d'autre */
        if(o.st){
            p.sta=Math.min(staMax(p),(p.sta||0)+o.st);
            if(p.winded&&p.sta>=staMax(p)*CFG.STA_RESUME) p.winded=0;
        }
        logMsg("Vous utilisez : "+o.n.toLowerCase()+".","jday");
        /* il ne guerit pas la maladie : il la tient a distance un jour */
        if(p.mal){
            p.malPause=MAL_PAUSE;
            logMsg("La fievre retombe. Ce n'est qu'un repit.","jsay");
        }
    } else if(o.k==="viv"){
        if(o.hp){ p.heal=(p.heal||0)+o.hp; p.healR=o.hp/Math.max(1,o.dur); }
        /* une boisson rend le souffle petit a petit, sur la meme duree */
        if(o.st){ p.sto=(p.sto||0)+o.st; p.stoR=o.st/Math.max(1,o.dur); }
        logMsg((o.st?"Vous buvez : ":"Vous consommez : ")+o.n.toLowerCase()+".","jday");
    } else { notice("RIEN A EN TIRER"); return; }
    c.q--;
    if(c.q<=0) p.inv[ci]=null;
}
/* Le poids porte : le sac lui-meme, ce qu'il contient, et les armes que l'on
   tient. Les emplacements pesaient zero, ce qui laissait porter un Minimi et
   trois fusils sans rien sentir : ils comptent maintenant comme le reste. */
/* ================= LA MALADIE =================
   Une seule, et septique : la morsure d'un zombi infecte comme celle d'un
   varan, par ce qu'elle charrie, pas par ce qu'elle transforme. On ne
   devient pas zombi - on pourrit. L'autre source est l'eau qui dort :
   marecages et bras morts, ou l'on patauge.

   L'aptitude Immunite reduit la chance de contracter, et elle seule : une
   fois la maladie prise, elle ne protege plus de rien.

   LES CONSEQUENCES SONT EN SUSPENS (MAL_ON). La maladie devait ronger la vie
   petit a petit, les medicaments suspendre la perte, et la vraie guerison
   demander plusieurs jours de repos a la base. La base n'existe pas : une
   maladie qui ronge sans guerison possible serait une condamnation a
   retardement. On peut donc la contracter et on la voit - le journal
   l'annonce, la fiche la portera - mais elle ne coute rien tant que MAL_ON
   est faux. Le jour ou la base ouvrira, ce booleen l'allumera. */
/* La maladie mord depuis que la base existe : il fallait d'abord qu'il y ait
   un endroit ou en guerir, sinon la contracter aurait ete une condamnation a
   retardement. Un point de vie toutes les douze secondes, soit vingt-cinq par
   jour de jeu : on tient plusieurs jours, on n'y survit pas indefiniment.
   Un medicament suspend la perte pour MAL_PAUSE secondes, un jour entier -
   il soulage, il ne soigne pas. La guerison demande MAL_CURE journees de
   repos a la base, et le repos doit etre continu : partir en course remet le
   compteur a zero. */
var MAL_ON=true, MAL_DPS=1, MAL_TICK=12, MAL_PAUSE=300, MAL_CURE=3;
function malRisk(p,src){
    /* la chance de base par exposition : forte pour une morsure, faible pour
       un pas dans l'eau croupie (mais on y fait beaucoup de pas) */
    var base=(src==="morsure")?0.35:0.004;
    return base*(1.5-statEff(p,"cardio","immunite")/100);
}
function malCatch(p,src){
    if(p.mal) return false;
    if(rng()>=malRisk(p,src)){
        /* le corps s'endurcit a ce qu'il repousse */
        secBump(p,src==="morsure"?"immunite":"immunite",src==="morsure"?3:1);
        return false;
    }
    p.mal=1; p.malT=0;
    if(p===G.p){
        logMsg((src==="morsure")
            ?"La plaie chauffe. Quelque chose est passe dans le sang."
            :"L'eau croupie a eu raison de vous : la fievre monte.","jsay");
        notice("MALADE");
    } else logMsg((p.name||"Quelqu'un")+" a la fievre.","jsay");
    return true;
}
/* Le tic de la maladie : il ne mord que si MAL_ON. Il mord la meme chose a
   tout le monde - c'etait hurtPlayer, donc un compagnon fievreux portait un
   drapeau qui ne lui coutait rien. */
function updMal(p,dt){
    if(!p||p.dead||!p.mal) return;
    /* le medicament tient la fievre a distance, un temps */
    if(p.malPause>0){
        p.malPause-=dt;
        if(p.malPause<=0){
            p.malPause=0;
            if(p===G.p)
                logMsg("Le medicament ne fait plus effet. La fievre revient.","jsay");
        }
        return;
    }
    p.malT=(p.malT||0)+dt;
    if(!MAL_ON) return;
    if(p.malT>=MAL_TICK){
        p.malT=0;
        hurt(p,MAL_DPS,0,0,0,1);
    }
}
/* ---- LE SANG QUI COULE ----
   Sous LOW_HP de sa vie, on perd un point au meme rythme que la fievre,
   et les deux se cumulent : ce sont DEUX CAUSES DISTINCTES, l'une dans le
   sang et l'autre dans la plaie. Un malade exsangue perd donc deux points
   toutes les douze secondes, et chacune se soigne de son cote - la fievre
   par le repos, la plaie par les points rendus.
   Elle a son propre compteur : partager celui de la fievre aurait fait que
   guerir de l'une remettrait l'autre a zero. */
var LOW_HP=0.15;   /* une part, comme SPRINT_HP : voir canSprint */
function updLow(p,dt){
    if(!p||p.dead||p.hp<=0||p.hp>=(p.maxhp||hpMax(p))*LOW_HP){
        if(p) p.lowT=0;
        return;
    }
    p.lowT=(p.lowT||0)+dt;
    if(p.lowT>=MAL_TICK){
        p.lowT=0;
        hurt(p,MAL_DPS,0,0,0,1);
    }
}
/* Chez soi, les plaies se referment : un point toutes les deux secondes,
   ce qui remet une carcasse a neuf en quelques minutes passees a l'abri.
   C'est la seule regeneration du jeu, et elle n'existe que la. */
function baseHeal(p,dt){
    var mx;
    if(!p||p.dead) return;
    mx=p.maxhp||hpMax(p);
    if(p.hp>=mx) return;
    p.repT=(p.repT||0)+dt;
    while(p.repT>=2&&p.hp<mx){ p.repT-=2; p.hp=Math.min(mx,p.hp+1); }
}
/* ---- LE CORPS DE CEUX QU'ON NE JOUE PAS ----
   grpTick ne parcourt que l'equipe qui suit : celui qui garde la maison
   n'avait aucun tour a lui, donc ni fievre, ni plaie, ni repos. Ce passage
   vaut pour TOUT le groupe, ou qu'il soit - c'est le prix de la regle qui
   dit qu'un compagnon est un joueur qu'on ne joue pas.
   CHEZ SOI ON SE REFAIT : la meme regeneration que le joueur, et pour la
   meme raison - c'est le seul endroit du monde ou l'on se repose. Celui qui
   est en mission est ailleurs, et celui qui vous suit est dehors. */
/* ---- QUELLE DIRECTION CHACUN SUIT ----
   Personne n'annonce ou il va : dix-huit endroits du code posent .face a
   partir d'un seul dx, et il aurait fallu les reprendre tous pour y ajouter
   dy. On regarde donc le RESULTAT plutot que l'intention - la position de
   cette image comparee a celle d'avant - et l'on en tire la vue. Un seul
   endroit a tenir, et il attrape tout le monde : ceux qui marchent, ceux
   qu'on pousse, ceux qui derivent dans une riviere.
   Les huit directions se lisent en octants : au-dela de 67,5 degres c'est un
   axe franc, en deca un trois quarts. Sous un demi-pixel de deplacement on ne
   change rien - un homme a l'arret garde la derniere direction qu'il avait,
   sans quoi il pivoterait au moindre tremblement.
   La vue ne va que de 0 a 4 : le miroir de drawSpr fournit l'autre moitie. */
function dirOne(o){
    var dx, dy, ax, ay;
    if(!o) return;
    /* vwx/vwy et non lx/ly : le pecheur se sert deja de lx pour retenir le
       centre de son etang, et le lui ecraser chaque image lui faisait
       regarder ailleurs. */
    if(o.vwx===undefined){ o.vwx=o.x; o.vwy=o.y; return; }
    dx=o.x-o.vwx; dy=o.y-o.vwy; o.vwx=o.x; o.vwy=o.y;
    ax=dx<0?-dx:dx; ay=dy<0?-dy:dy;
    if(ax+ay<0.5) return;
    if(ax>ay*2.414) o.vw=2;
    else if(ay>ax*2.414) o.vw=(dy>0)?0:4;
    else o.vw=(dy>0)?1:3;
}
function dirSweep(){
    var i;
    dirOne(G.p);
    for(i=0;i<HUM.length;i++) dirOne(HUM[i]);
    for(i=0;i<ZOMBIES.length;i++) dirOne(ZOMBIES[i]);
}
/* ---- ON NE MARCHE PAS DANS LE FEU ----
   La nappe rongeait deja tout ce qui vit, joueur compris - blastHurt lit la
   liste HUM toutes les demi-secondes. Mais personne ne s'en ecartait : un
   habitant traversait un incendie du meme pas tranquille, et l'on voyait des
   gens cuire debout sans un geste.
   ON NE TOUCHE PAS AUX CHEMINS, ON POUSSE. Reecrire le pas de chacun des
   endroits qui deplacent quelqu'un aurait demande de les reprendre tous ; une
   repulsion posee APRES le mouvement les attrape tous d'un coup, comme le
   balayage des directions. Elle mord un peu AVANT le bord - FIRE_MARGE - donc
   on contourne au lieu de sortir en fumant.
   LES MORTS N'EN ONT RIEN A FAIRE, et c'est tout l'interet : une nappe est un
   mur pour les vivants et un couloir pour les autres. Le joueur non plus
   n'est pas pousse - il decide lui-meme de ce qu'il traverse.
   Rien ici ne tire au sort : la poussee est une fonction des positions. */
var FIRE_MARGE=14, FIRE_FUITE=64;
function fireFlee(dt){
    var Math=DMATH;
    var i, q, o, z, dx, dy, d, R, px, py, nx, ny;
    if(!ZONE.length) return;
    for(i=0;i<HUM.length;i++){
        o=HUM[i];
        if(!o||o.dead||o.hidden||o.inb||o===G.p) continue;
        px=0; py=0;
        for(q=0;q<ZONE.length;q++){
            z=ZONE[q];
            if(!z.f||z.d<=0) continue;
            R=z.r+FIRE_MARGE;
            dx=o.x-z.x; dy=(o.y-11)-z.y;
            d=Math.hypot(dx,dy);
            if(d>R) continue;
            if(d<0.5){ dx=1; dy=0; d=1; }
            /* d'autant plus fort qu'on est pres du coeur */
            px+=dx/d*(1-d/R); py+=dy/d*(1-d/R);
        }
        if(!px&&!py) continue;
        d=Math.hypot(px,py)||1;
        nx=o.x+px/d*FIRE_FUITE*dt;
        ny=o.y+py/d*FIRE_FUITE*dt;
        /* on ne pousse personne dans un mur ni dans l'eau : chaque axe est
           tente a part, ce qui fait glisser le long d'un obstacle au lieu de
           coller dedans */
        if(!hitObstacle(nx,o.y,7)&&!inSea(nx,o.y)) o.x=nx;
        if(!hitObstacle(o.x,ny,7)&&!inSea(o.x,ny)) o.y=ny;
    }
}
function grpBody(dt){
    var L=grpList(), i, n;
    for(i=0;i<L.length;i++){
        n=L[i];
        if(n.dead) continue;
        updMal(n,dt);
        updLow(n,dt);
        if(BASE&&!n.out&&!n.miss) baseHeal(n,dt);
    }
}

/* ================= LE RAVITAILLEMENT PAR CALIBRE =================
   Le rechargement puisait dans un stock infini : les dix boites de munitions
   se ramassaient et se pesaient sans que rien ne les consomme, et l'arme
   historique ne coutait rien a nourrir. C'est fini.

   La reserve d'un calibre se lit en deux endroits : les boites entieres du
   sac, et les cartouches en vrac d'une boite deja entamee. Le vrac est un
   simple compteur par calibre, mais il pese : sans cela, ouvrir une boite de
   12,7 pour en tirer trois cartouches aurait allege le sac de trois kilos et
   demi. C'est la seule facon d'avoir une boite entamee sans casser la regle
   de pile du sac, qui ne connait que des exemplaires entiers. */
function looseOf(p){ return p.loose||(p.loose={}); }
/* Ce que pese le vrac : chaque cartouche a son poids dans AMMO. */
function looseWeight(p){
    var L=p&&p.loose, k, s=0;
    if(!L) return 0;
    for(k in L) if(L[k]>0&&AMMO[k]) s+=L[k]*AMMO[k].pds;
    return s;
}
/* La reserve d'un calibre : le vrac plus le contenu des boites. */
function ammoStock(p,am){
    var n=looseOf(p)[am]||0, i, c, o;
    if(!am||!p.inv) return n;
    for(i=0;i<p.inv.length;i++){
        c=p.inv[i];
        if(!c||cellIsW(c)) continue;
        o=itemById(c.i);
        if(o&&o.k==="mun"&&o.am===am) n+=o.nb*(c.q||1);
    }
    return n;
}
/* Prendre n cartouches : le vrac d'abord, puis on ouvre les boites une a une.
   Rend ce qu'on a reellement obtenu, qui peut etre moins que demande - un
   chargeur incomplet vaut mieux qu'un refus. */
function ammoTake(p,am,n){
    var L=looseOf(p), got=0, k, i, c, o;
    if(!am||n<=0) return 0;
    k=Math.min(L[am]||0,n);
    if(k>0){ L[am]-=k; got+=k; n-=k; }
    while(n>0){
        var found=-1;
        for(i=0;i<p.inv.length;i++){
            c=p.inv[i];
            if(!c||cellIsW(c)||cellIsRef(c)) continue;
            o=itemById(c.i);
            if(o&&o.k==="mun"&&o.am===am){ found=i; break; }
        }
        if(found<0) break;
        c=p.inv[found]; o=itemById(c.i);
        c.q--;
        /* la derniere boite d'une ceinture ne l'emporte pas avec elle */
        if(c.q<=0) p.inv[found]=(c.b!==undefined)?{i:c.b,q:1}:null;
        L[am]=(L[am]||0)+o.nb;
        k=Math.min(L[am],n);
        L[am]-=k; got+=k; n-=k;
    }
    return got;
}
function invWeight(){
    var p=G&&G.p, s=0, i, c, o;
    if(!p) return 0;
    var b=bagItem();
    if(b) s+=b.pds;
    if(p.slots) for(i=0;i<p.slots.length;i++)
        if(p.slots[i]&&p.slots[i].pds) s+=p.slots[i].pds;
    /* ce qu'on a sur le dos pese autant que ce qu'on a dedans */
    s+=vetWeight(p);
    if(p.inv) for(i=0;i<p.inv.length;i++){
        c=p.inv[i]; if(!c) continue;
        s+=cellWeight(c);
    }
    /* le vrac pese comme le reste : une boite entamee ne s'evapore pas */
    s+=looseWeight(p);
    return s;
}
function invUsed(){
    var p=G&&G.p, n=0, i;
    if(!p||!p.inv) return 0;
    for(i=0;i<p.inv.length;i++) if(p.inv[i]) n++;
    return n;
}
/* ---- ACCES RAPIDES ----
   [A] porte un soin, [E] une arme de jet. L'emplacement ne retient qu'une
   sorte d'objet ; le nombre montre ce qu'il en reste dans le sac. */
function invCount(id){
    var p=G&&G.p, n=0, i, c;
    if(!p||!p.inv) return 0;
    for(i=0;i<p.inv.length;i++){
        c=p.inv[i];
        if(c&&!cellIsW(c)&&c.i===id) n+=c.q;
    }
    return n;
}
function qOk(side,o){
    if(!o) return false;
    return side?(o.k==="jet"):(o.k==="med"||o.k==="viv");
}
function quickId(side){ var p=G&&G.p; return p?(side?p.qe:p.qa):-1; }
function setQuick(side,id){
    var p=G.p;
    if(id<0){ if(side) p.qe=-1; else p.qa=-1; return; }
    if(!qOk(side,itemById(id))) return;
    if(side) p.qe=id; else p.qa=id;
}
/* ---- RECOLTE ----
   Les trois cultures des champs portaient deja leur sprite et leur compte a
   rebours de repousse ; il ne leur manquait qu'un panier. Chaque type de
   plant rend l'objet qui lui correspond, la case du sac le recueille, et le
   pied disparait le temps de repousser. */
var VEGITEM=["Carotte","Pomme de terre","Chou"];
function nearestVeg(r){
    var best=null, bd=r*r, i, v, d;
    if(!G||!G.p) return null;
    for(i=0;i<VEGGIES.length;i++){
        v=VEGGIES[i];
        if(v.respT>0) continue;
        d=dist2(v.x,v.y,G.p.x,G.p.y);
        if(d<bd){ bd=d; best=v; }
    }
    return best;
}
function harvest(v){
    var o=itemFind(VEGITEM[v.type]||VEGITEM[0]);
    if(!o) return;
    if(!invPush(o.id,1)){ notice("SAC PLEIN"); return; }
    v.respT=CFG.VEG_RESP;
    logMsg("Vous ramassez : "+o.n.toLowerCase()+".","jday");
    sClick();
}
function updVeg(dt){
    var i;
    for(i=0;i<VEGGIES.length;i++)
        if(VEGGIES[i].respT>0) VEGGIES[i].respT-=dt;
}
/* ---- LE PANNEAU ----
   Deux gestes cohabitent. LE GLISSER-DEPOSER est l'ordinaire : on prend une
   vignette et on la lache ou l'on veut, et c'est ainsi qu'on s'arme, qu'on
   s'habille, qu'on se munit d'un sac et qu'on garnit ses acces rapides. LES
   LISTES DE BOUTONS restent dessous : elles servent de reglage - celle des
   armes les cree de rien - et elles rendent service a qui prefere cliquer.
   Tout passe par le journal d'entrees, donc le rejeu retrouve la meme case
   et le meme objet. */
var BPICK=false, IPICK=-1, iBagSig=null;
function itCanvas(o,cls){
    return "<canvas class='"+(cls||"iic")+"' width='96' height='96'></canvas>";
}
function itPaint(el,o){
    var c=el.querySelector("canvas");
    if(!c||!c.getContext) return;
    var g=c.getContext("2d");
    g.clearRect(0,0,96,96);
    itIconDraw(g,o.ic,0,0,4,IWHITE);
}
function bagSlotFill(){
    var el=document.getElementById("bsl"), b=bagItem();
    if(!el) return;
    el.innerHTML=b?(itCanvas(b)+"<span class='wtag'>"+b.n+"</span>"):"";
    if(b) itPaint(el,b);
    el.className="slot"+(b?" wfull":"");
    el.onclick=function(){ sClick(); BPICK=!BPICK; IPICK=-1; iBagFill(); };
    idragArm(el,DZ_SAC,0,b);
    var pk=document.getElementById("bpick");
    if(!pk) return;
    if(!BPICK){ pk.style.display="none"; pk.innerHTML=""; return; }
    var h="<button data-b='-1'>-- sans sac a dos --</button>", q;
    for(q=0;q<BAGS.length;q++)
        h+="<button data-b='"+q+"'>"+BAGS[q].n+" - "+BAGS[q].cap+" cases</button>";
    pk.innerHTML=h; pk.style.display="flex";
    var bs=pk.querySelectorAll("button");
    for(q=0;q<bs.length;q++)(function(el2){
        el2.onclick=function(){
            sClick(); pushAct("bsel",parseInt(this.getAttribute("data-b"),10)+1);
            BPICK=false;
        };
    })(bs[q]);
}
