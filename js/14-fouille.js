"use strict";
/* ================================================================
   TUAZ - 14-fouille.js
   Les objets au sol, la fouille des batiments, leur plan interieur,
   la fenetre de fouille et les sorties de carte.
   (lignes 16068 a 17164 du mono-fichier d'origine)
   ================================================================ */
/* ================= LES OBJETS AU SOL =================
   Jusqu'ici rien ne trainait par terre : ce qu'on ne prenait pas restait
   dans un corps ou dans un batiment. On peut desormais poser, et ce qu'on
   pose se voit.

   Une chose au sol vit trois minutes. Passe ce terme elle s'efface, mais
   seulement hors de l'ecran : il serait absurde de voir un sac s'evaporer
   sous ses yeux. La meme regle vaut pour les corps, qui ne disparaissaient
   jamais et encombraient la carte jusqu'a la fin de la partie.

   Reste le cas de celui qui pose tout au meme endroit et ne detourne pas le
   regard : rien ne partirait jamais. D'ou le plafond. Au-dela de GND_MAX
   choses visibles a la fois, la plus anciennement posee est mangee par les
   rats - ce sont eux qui font le menage quand le joueur refuse de le
   laisser faire. */
var GND=[], GND_LIFE=180, GND_MAX=24, GNDN=0;
function gndVisible(x,y){
    var cx=G.cam.x, cy=G.cam.y;
    return x>cx-24&&x<cx+CFG.VIEW_W+24&&y>cy-24&&y<cy+CFG.VIEW_H+24;
}
/* Poser une chose. Le numero d'ordre GNDN dit qui est arrive le premier :
   c'est lui, et non l'age, qui designe la proie des rats. */
function gndDrop(cell,x,y){
    if(!cell) return null;
    var g={x:x, y:y, t:0, n:++GNDN};
    if(cell.w!==undefined){ g.w=cell.w; g.q=1; }
    else { g.i=cell.i; g.q=cell.q||1;
        /* la ceinture voyage avec sa case : posee au sol elle reste sur les
           boites, et gndTake la remet dans le sac avant elles */
        if(cell.b!==undefined) g.b=cell.b; }
    GND.push(g);
    return g;
}
function gndObj(g){
    if(!g) return null;
    return (g.w!==undefined)?WEAPONS[g.w]:itemById(g.i);
}
function gndName(g){
    var o=gndObj(g);
    if(!o) return "quelque chose";
    return o.n+((g.q>1&&g.w===undefined)?(" x"+g.q):"");
}
/* Ce qui est a portee de main, le plus proche d'abord. */
function nearestGnd(mr){
    var best=null, bd=mr*mr, i, d;
    for(i=0;i<GND.length;i++){
        d=dist2(GND[i].x,GND[i].y,G.p.x,G.p.y);
        if(d<bd){ bd=d; best=GND[i]; }
    }
    return best;
}
/* Ramasser : une arme prend son emplacement de categorie s'il est libre,
   sinon elle occupe une case entiere du sac. Le reste s'empile. Ce qui ne
   tient pas reste par terre, comme dans la fenetre de fouille : rien ne se
   perd jamais. */
function gndTake(g){
    var p=G.p, i=GND.indexOf(g), o=gndObj(g), sl, k;
    if(i<0||!o) return false;
    if(g.w!==undefined){
        sl=wSlot(o);
        if(p.slots&&!p.slots[sl]){ setSlot(sl,g.w); notice(o.n.toUpperCase()); }
        else {
            invFit();
            if(!gridAdd(p.inv,{w:g.w,q:1})){ notice("SAC PLEIN"); return false; }
        }
        GND.splice(i,1);
        logMsg("Vous ramassez "+o.n+".","jday");
        sClick();
        return true;
    }
    var left=g.q, pris;
    /* une armure ou un sac qu'on n'a pas encore : on l'enfile directement */
    if(autoWearOne(o)){
        g.q--;
        if(g.q<=0) GND.splice(i,1);
        sClick();
        return true;
    }
    /* UNE CASE CEINTUREE POSEE AU SOL GARDE SA CEINTURE - on repose donc le
       contenant AVANT les boites : invPush le trouve vide et le garnit tout
       seul au passage. Sans cela, poser puis reprendre aurait fait
       disparaitre la ceinture, ce que rien a l'ecran n'aurait explique. */
    if(g.b!==undefined){
        if(!invPush(g.b,1)){ notice("SAC PLEIN"); return false; }
        g.b=undefined;
    }
    while(left>0&&invPush(g.i,1)===true) left--;
    pris=g.q-left;
    if(pris<=0){ notice("SAC PLEIN"); return false; }
    if(left>0){ g.q=left; notice("SAC PLEIN"); }
    else GND.splice(i,1);
    logMsg("Vous ramassez "+o.n+((pris>1)?(" x"+pris):"")+".","jday");
    sClick();
    return true;
}
/* Poser une case du sac par terre, un pas devant soi. */
function gndPut(k){
    var p=G.p, an=gridAnchor(p.inv,k), c=(an>=0)?p.inv[an]:null, o;
    if(!c) return false;
    o=cellObj(c);
    gndDrop(c,p.x+(p.fx||0)*12,p.y+(p.fy||0)*12+2);
    gridTake(p.inv,an);
    logMsg("Vous posez "+(o?o.n:"quelque chose")+" au sol.","jday");
    sClick();
    return true;
}
/* Le menage. Trois minutes, puis l'effacement des que le regard se detourne ;
   et le plafond des choses visibles, que les rats font respecter. */
function updGnd(dt){
    var i, g, vis=0, old=null;
    for(i=GND.length-1;i>=0;i--){
        g=GND[i];
        g.t+=dt;
        if(g.t>=GND_LIFE&&!gndVisible(g.x,g.y)){ GND.splice(i,1); continue; }
    }
    for(i=0;i<GND.length;i++){
        g=GND[i];
        if(!gndVisible(g.x,g.y)) continue;
        vis++;
        if(!old||g.n<old.n) old=g;
    }
    if(vis>GND_MAX&&old){
        GND.splice(GND.indexOf(old),1);
        logMsg("Des rats emportent "+gndName(old)+".","jday");
    }
    /* les corps suivent la meme regle : trois minutes, puis l'oubli des que
       l'on regarde ailleurs. Un corps fouille part comme les autres. */
    corpseSweep(dt);
}
var CORPSE=[];
function corpseNote(o){
    if(!o||o.ct!==undefined) return;
    o.ct=0; CORPSE.push(o);
}
function corpseSweep(dt){
    var i, o;
    for(i=CORPSE.length-1;i>=0;i--){
        o=CORPSE[i];
        if(!o||o.gone||!o.dead){ CORPSE.splice(i,1); if(o) o.ct=undefined; continue; }
        o.ct+=dt;
        if(o.ct>=GND_LIFE&&!gndVisible(o.x,o.y)){
            o.gone=1; o.gone_by="temps";
            CORPSE.splice(i,1);
        }
    }
}
/* ---- [F3] : TOUT FAIRE APPARAITRE ----
   Outil de reglage, comme [F1] et [F2]. Il pose au sol un exemplaire de tout
   ce qui existe - le registre entier puis les cinquante-six armes - en
   spirale autour du joueur, pour voir d'un coup ce que le jeu contient et
   pouvoir tout prendre en main. Il ne passe pas par le journal d'entrees :
   c'est un outil de mise au point, pas un geste de partie. */
function gndSpawnAll(){
    var p=G.p, i, k=0, a, r;
    GND=[]; GNDN=0;
    function pose(cell){
        a=k*0.61803398875*6.283185307; r=26+k*3.1;
        gndDrop(cell,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r);
        k++;
    }
    for(i=0;i<ITEMS.length;i++) pose({i:ITEMS[i].id,q:ITEMS[i].mx>1?5:1});
    for(i=0;i<WEAPONS.length;i++) pose({w:i});
    logMsg("F3 : "+GND.length+" choses posees au sol.","jday");
    notice("TOUT AU SOL");
}

/* ================= LA FOUILLE DES BATIMENTS =================
   Specification arretee en v13, batie ici. Chaque batiment se decoupe en
   pieces. La fouille se declenche une fois, en entrant, puis se deroule
   seule, piece apres piece, avec le decompte a l'ecran. Chaque piece tire sa
   propre duree : deux fouilles du meme batiment ne durent jamais le meme
   temps. On prend ou on laisse, et ce qu'on laisse reste dans le batiment.
   [S] interrompt et fait sortir ; les pieces non fouillees le restent et le
   decompte reprend ou il s'est arrete. Un batiment fouille ne se repeuple
   pas : la carte est un stock fini.

   Chaque nature de lieu porte :
     r    le nombre de pieces, tire une fois pour toutes
     d    la duree d'une piece, avant l'aptitude Fouille
     ri   la chance qu'une piece donne quelque chose - c'est elle, et non la
          table, qui fait la difference entre la superette et la maison
     p    le profil, en pour cent : arme / munition / vivre / medicament /
          jet / materiel
     w    la provenance des armes, dans WSRC
     am   les calibres qu'on y trouve
     jt   ce qui s'y lance
     fm   les familles de materiel : un lieu ne voit jamais les cent objets
     fs   la table de vivres, quand le lieu en a une
     bg   le sac du lieu et sa chance, tiree une seule fois par batiment */
var SRCHDEF={
 maison:   {r:[2,4], d:[2,5], ri:0.42, p:[4,4,29,8,3,52],
            w:"grenier", am:["a22","a12"], jt:["Couteau de lancer"],
            fm:["Mobilier","Cuisine","Divers"], bg:[0,0.22],
            vt:["Bonnet de laine","Blouson de cuir","Bas de jogging",
                "Jean de travail","Baskets","Mocassins de chasse"], vc:0.16},
 immeuble: {r:[3,6], d:[2,5], ri:0.40, p:[2,2,28,8,3,57],
            w:"grenier", am:["a22"], jt:["Couteau de lancer"],
            fm:["Appareil","Electricite","Mobilier"],
            vt:["Bonnet de laine","Blouson de cuir","Bas de jogging",
                "Jean de travail","Baskets"], vc:0.14},
 mairie:   {r:[2,4], d:[2,5], ri:0.44, p:[0,0,10,5,0,85],
            fm:["Mobilier","Appareil","Divers"]},
 medecin:  {r:[2,4], d:[2,5], ri:0.52, p:[0,0,8,70,0,22],
            fm:["Divers","Appareil"],
            vt:["Blouse de soignant","Pantalon de service","Baskets"], vc:0.22},
 soins:    {r:[3,5], d:[2,5], ri:0.56, p:[0,0,10,62,0,28],
            fm:["Divers","Appareil"],
            vt:["Blouse de soignant","Masque a gaz","Pantalon de service",
                "Baskets"], vc:0.26},
 hopital:  {r:[6,12],d:[2,5], ri:0.60, p:[0,0,12,65,0,23],
            fm:["Divers","Appareil","Electricite"],
            vt:["Blouse de soignant","Masque a gaz","Pantalon de service",
                "Baskets"], vc:0.28},
 police:   {r:[3,5], d:[2,5], ri:0.62, p:[18,30,5,10,12,25], ce:["Ceinture de police"], cc:0.40,
            w:"police", am:["a9","a9","a357","a12"],
            jt:["Fumigene","Grenade assourdissante"],
            fm:["Divers","Quincaillerie","Appareil"],
            vt:["Casquette de police","Gilet pare-balles","Blouson de cuir",
                "Pantalon de service","Rangers"], vc:0.30},
 armurerie:{r:[4,6], d:[2,5], ri:0.78, p:[30,45,0,0,0,25],
            ce:["Cartouchiere de chasse","Musette de tireur"], cc:0.55,
            w:"armurerie", am:["a22","a22","a12","a12","a357","a762"],
            fm:["Outil","Quincaillerie"]},
 stand:    {r:[4,6], d:[2,5], ri:0.76, p:[28,55,4,2,0,11],
            ce:["Cartouchiere de chasse","Musette de tireur"], cc:0.50,
            w:"stand", am:["a22","a22","a12","a12","a9","a357"],
            fm:["Outil","Divers"],
            vt:["Cagoule de chasse","Pantalon de chasse","Mocassins de chasse"],
            vc:0.24},
 armee:    {r:[6,12],d:[4,9], ri:0.70, p:[22,40,12,8,10,8],
            ce:["Brelage militaire","Porte-chargeurs de combat",
                "Musette de tireur"], cc:0.60,
            w:"militaire", am:["a556","a556","a556","a762","a762","a9",
                               "a357","a338","a127"],
            jt:["Grenade a fragmentation","Grenade offensive",
                "Grenade incendiaire","Fumigene","Grenade assourdissante"],
            fm:["Outil","Materiau","Divers"], fs:"militaire", bg:[3,0.34],
            vt:["Casque militaire","Veste de treillis","Gilet pare-balles",
                "Pantalon de treillis","Rangers","Masque a gaz"], vc:0.34},
 pompiers: {r:[6,12],d:[2,5], ri:0.50, p:[0,0,12,25,4,59],
            w:"pompier", jt:["Couteau de lancer"],
            fm:["Outil","Quincaillerie","Materiau"],
            vt:["Casque de pompier","Veste de pompier","Surpantalon de feu",
                "Bottes de pompier","Masque a gaz"], vc:0.34},
 resto:    {r:[3,5], d:[2,5], ri:0.58, p:[0,0,55,2,3,40],
            jt:["Couteau de lancer"], fm:["Cuisine"]},
 bar:      {r:[2,4], d:[2,5], ri:0.54, p:[0,0,45,0,6,49],
            jt:["Cocktail Molotov","Bouteille d'acide"],
            fm:["Cuisine","Divers"], bg:[0,0.18]},
 superette:{r:[4,7], d:[2,5], ri:0.74, p:[0,0,68,6,0,26],
            fm:["Cuisine","Divers"]},
 droguerie:{r:[3,5], d:[2,5], ri:0.66, p:[0,0,6,14,8,72],
            jt:["Cocktail Molotov","Bouteille d'acide"],
            fm:["Chimie","Quincaillerie"],
            vt:["Masque a gaz","Blouse de soignant"], vc:0.14},
 ecole:    {r:[3,5], d:[2,5], ri:0.48, p:[0,0,22,8,0,70],
            fm:["Appareil","Electricite"], bg:[1,0.30]},
 depot:    {r:[4,7], d:[4,9], ri:0.62, p:[1,2,18,3,2,74],
            w:"cac", am:["a12"], jt:["Baton de dynamite"], fm:["Materiau"],
            vt:["Chaussures de securite","Jean de travail","Bonnet de laine"],
            vc:0.20},
 hangar:   {r:[2,4], d:[4,9], ri:0.48, p:[1,1,8,2,3,85],
            w:"cac", am:["a12"], jt:["Baton de dynamite"],
            fm:["Materiau","Outil","Quincaillerie"],
            vt:["Chaussures de securite","Jean de travail"], vc:0.20},
 ferme:    {r:[3,5], d:[2,5], ri:0.56, p:[7,8,36,4,2,43],
            ce:["Cartouchiere de chasse"], cc:0.28,
            w:"gferme", am:["a22","a12","a12","a8lb","a75"],
            jt:["Baton de dynamite"], fm:["Outil","Materiau","Cuisine"],
            fs:"paysan",
            vt:["Jean de travail","Chaussures de securite","Bottes de peche",
                "Cire de pecheur","Bonnet de laine"], vc:0.24},
 /* La vitrine : sans elle le musee ne s'ouvrait jamais. Huit pieces a 6
    pour cent d'arme, un seul chateau par carte - deux cartes sur trois
    n'auraient rendu aucune arme historique, et l'on aurait trouve le
    8 mm Lebel sans jamais trouver le Lebel. Une piece de musee est donc
    posee d'office, le reste suit la table. */
 chateau:  {r:[6,12],d:[4,9], ri:0.52, p:[6,8,12,4,0,70],
            w:"musee", am:["a8lb","a8lb","a75","a9"], vit:"musee",
            fm:["Mobilier","Divers"], bg:[4,0.20]},
 guet:     {r:[1,2], d:[2,5], ri:0.40, p:[6,20,30,6,4,34],
            ce:["Cartouchiere de chasse"], cc:0.25,
            w:"cac", am:["a12","a9"], jt:["Couteau de lancer"],
            fm:["Divers","Outil"]},
 abri:     {r:[1,2], d:[2,5], ri:0.40, p:[3,4,42,12,0,39],
            w:"cac", am:["a22","a12"], fm:["Divers","Outil","Cuisine"],
            fs:"scout", bg:[2,0.26]},
 /* La station-service n'etait pas dans la table de la v13 : elle est neuve
    depuis. Sa boutique tient de la superette, avec ce qu'un garage laisse
    trainer derriere le comptoir. */
 station:  {r:[1,2], d:[2,5], ri:0.58, p:[0,0,45,4,2,49],
            jt:["Cocktail Molotov"], fm:["Chimie","Outil","Divers"]},
 /* Le laboratoire ne se fouille pas comme les autres : une piece unique,
    mais qui rend deux ou trois fois plus que les autres. */
 labo:     {r:[1,1], d:[6,10], ri:1, n:[2,3], p:[0,0,6,20,14,60],
            jt:["Charge artisanale"], fm:["Chimie","Electricite","Appareil"],
            bg:[4,0.30]}
};
/* ---- L'ARRIERE-BOUTIQUE ----
   Une enseigne n'est pas qu'un nom sur une facade : elle dit ce qu'on trouve
   derriere. Un emplacement sur trois d'un lieu a enseigne tire sur la table
   du commerce plutot que sur celle du logement, et cette table-la donne par
   poignees : c'est un stock, pas un placard. Trouver la reserve de la
   boulangerie, c'est repartir avec du pain pour trois jours.
   st  ce qu'on y trouve en quantite, avec la fourchette
   fm  les familles de materiel propres au commerce */
var BIZLOOT={
 boulanger:  {st:[["Pain rassis",4,9],["Biscuits secs",3,7],["Barre de cereales",3,7]],
              fm:["Cuisine"]},
 charcutier: {st:[["Viande sechee",3,8],["Conserve de haricots",3,7],
                  ["Ragout en boite",2,6]],
              fm:["Cuisine","Outil"]},
 plombier:   {st:[["Tuyau de cuivre",3,8],["Tuyau PVC",3,8],["Cle a molette",1,3]],
              fm:["Quincaillerie","Outil","Materiau"]},
 electricien:{st:[["Rouleau de cable",3,8],["Piles alcalines",4,9],
                  ["Batterie de voiture",1,3]],
              fm:["Electricite","Appareil"]},
 couvreur:   {st:[["Tole ondulee",3,7],["Chevron",3,7],["Corde de chanvre",2,5]],
              fm:["Materiau","Outil"]},
 coiffeur:   {st:[["Miroir",1,3],["Verre",2,5],["Antiseptique",2,5]],
              fm:["Divers","Mobilier"]},
 cordonnier: {st:[["Colle forte",3,7],["Sangle a cliquet",2,5],["Vetements",2,5]],
              fm:["Divers","Outil"]},
 horloger:   {st:[["Piles alcalines",4,9],["Tournevis plat",2,5],["Jumelles",1,2]],
              fm:["Appareil","Electricite","Divers"]},
 couturiere: {st:[["Vetements",3,8],["Drap",3,7],["Couverture",2,5]],
              fm:["Mobilier","Divers"]},
 maconnerie: {st:[["Sac de ciment",2,6],["Parpaing",4,9],["Brique",4,9]],
              fm:["Materiau","Outil"]},
 veterinaire:{st:[["Antibiotiques",2,6],["Kit de suture",2,5],["Bande de gaze",3,7]],
              fm:["Divers","Appareil"]},
 imprimeur:  {st:[["Pot de peinture",2,5],["Ruban adhesif",3,7],["Colle forte",2,5]],
              fm:["Divers","Chimie"]}
};
/* ---- LE DECOUPAGE ----
   Partitionnement binaire : on coupe toujours la piece la plus vaste, le
   long de son cote le plus long, jamais a moins d'un tiers - sinon on
   obtient un placard de six metres a cote d'une salle de cent. */
function planBsp(rect,n,R){
    var L=[rect], i, best, bi, c, t, k, a, b2, ar;
    while(L.length<n){
        bi=0; best=-1;
        for(i=0;i<L.length;i++){ ar=L[i].w*L[i].h; if(ar>best){ best=ar; bi=i; } }
        c=L[bi]; t=0.38+R()*0.24;
        if(c.w>=c.h){ k=c.w*t; a={x:c.x,y:c.y,w:k,h:c.h}; b2={x:c.x+k,y:c.y,w:c.w-k,h:c.h}; }
        else { k=c.h*t; a={x:c.x,y:c.y,w:c.w,h:k}; b2={x:c.x,y:c.y+k,w:c.w,h:c.h-k}; }
        L.splice(bi,1,a,b2);
    }
    return L;
}
/* Une halle : le volume, et le reduit dans un coin. */
function planHalle(wm,hm,R){
    var bw=Math.min(4.2,wm*0.22), bh=Math.min(3.6,hm*0.28);
    var coin=(R()*4)|0;
    var bx=(coin===0||coin===3)?0:wm-bw, by=(coin<2)?0:hm-bh;
    return [{x:bx,y:by,w:bw,h:bh,red:1},
            {x:0,y:0,w:wm,h:hm,halle:1,creux:{x:bx,y:by,w:bw,h:bh}}];
}
/* Un etage. Les cases suivent la surface et rien d'autre : GRANDE PIECE
   n'est pas une classe, c'est le mot qu'on met sur une piece de trois cases
   ou plus. */
function planFloor(b,fl){
    var D=planDef(b), R=planRng(b,fl);
    var wm=b.w/M, hm=b.h/M, rooms, cor=null, n, i, r, ar;
    if(D.pl==="halle") rooms=planHalle(wm,hm,R);
    else if(D.pl==="une") rooms=[{x:0,y:0,w:wm,h:hm}];
    else {
        n=Math.max(1,Math.min(D.mx||PL_MAXR,Math.round(wm*hm/D.gn)));
        if(n>=3){
            /* le couloir traverse dans le sens du plus grand cote, un peu
               en decale : pile au milieu il donne deux rangees jumelles */
            var t=0.42+R()*0.16, zA, zB;
            if(wm>=hm){
                var cx=wm*t;
                cor={x:cx,y:0,w:PL_COR,h:hm};
                zA={x:0,y:0,w:cx,h:hm}; zB={x:cx+PL_COR,y:0,w:wm-cx-PL_COR,h:hm};
            } else {
                var cy=hm*t;
                cor={x:0,y:cy,w:wm,h:PL_COR};
                zA={x:0,y:0,w:wm,h:cy}; zB={x:0,y:cy+PL_COR,w:wm,h:hm-cy-PL_COR};
            }
            var aA=zA.w*zA.h, aB=zB.w*zB.h;
            var nA=Math.max(1,Math.min(n-1,Math.round(n*aA/(aA+aB))));
            rooms=planBsp(zA,nA,R).concat(planBsp(zB,n-nA,R));
        } else rooms=planBsp({x:0,y:0,w:wm,h:hm},n,R);
    }
    for(i=0;i<rooms.length;i++){
        r=rooms[i];
        ar=r.w*r.h;
        if(r.creux) ar-=r.creux.w*r.creux.h;
        r.cs=Math.max(1,Math.round(ar/PL_CASE));
        r.g=r.cs>=3;
    }
    return {rooms:rooms, cor:cor, wm:wm, hm:hm};
}
/* Le plan entier, garde sur le batiment : on ne le refait pas a chaque
   image, et le rejeu retombe dessus a l'identique puisque rien n'est tire
   sur le hasard de la partie. */
function bldPlan(b){
    if(!b) return null;
    if(b.plan) return b.plan;
    var et=planEt(b), fls=[], i, tot=0, q;
    for(i=0;i<et;i++){
        var F=planFloor(b,i);
        for(q=0;q<F.rooms.length;q++) tot+=F.rooms[q].cs;
        fls.push(F);
    }
    b.plan={et:et, fl:fls, cases:tot, def:planDef(b)};
    return b.plan;
}
function srchDef(b){ return SRCHDEF[b&&b.lt]||SRCHDEF.maison; }
/* ================= LE PLAN D'UN BATIMENT =================
   On ne dessine pas l'interieur : on le schematise. [M] a l'interieur ouvre
   le plan du lieu comme il ouvre la carte du monde a l'exterieur - la carte
   du monde ne sert a rien quand on est dans une piece, et [B] a deja ce
   double usage depuis la v16.

   TROIS FORMES, PARCE QU'UN HANGAR N'EST PAS UNE MAIRIE
     cor    couloir : une enfilade de pieces de part et d'autre d'un couloir
     halle  un volume et un reduit dans un coin - celui ou quelqu'un tient
            les registres. Un depot decoupe en six salles de cinquante metres
            carres donnait un plan de bureaux sous un toit de tole.
     une    une seule piece par niveau : la tour, l'abri, la station

   CINQ REGIMES DE FENETRES : tout le pourtour, devanture d'un seul tenant,
   rares, meurtrieres, aucune. Elles n'ont aucun effet - elles sont la pour
   qu'on reconnaisse une superette d'un hangar au premier coup d'oeil.

     et  etages    gn  metres carres par piece (forme cor seulement)
     pl  la forme  fe  le regime de fenetres
     mx  le plafond de pieces par etage, six sauf mention
   pieces par etage = surface / gn, bornee de 1 a mx. Le plafond n'existe que
   pour que le panneau reste lisible ; il ne change pas le total de cases,
   qui suit la surface. Un chateau de huit cents metres carres coupe en six
   rendait six salles de cent trente-cinq : le plafond y monte a douze.
   cases d'une piece = surface / PL_CASE, sans plafond : le plafond etait la
   pour qu'une piece n'ecrase pas les autres, mais dans une halle c'est
   justement ce qu'elle doit faire. */
var PL_CASE=14, PL_COR=1.5, PL_MAXR=6;
var PLANDEF={
 maison:   {et:2, pl:"cor",   gn:30, fe:"nb"},
 immeuble: {et:0, pl:"cor",   gn:30, fe:"nb"},   /* et:0 = on lit b.et */
 mairie:   {et:2, pl:"cor",   gn:34, fe:"nb"},
 ecole:    {et:2, pl:"cor",   gn:34, fe:"nb", mx:8},
 hopital:  {et:2, pl:"cor",   gn:34, fe:"nb", mx:9},
 police:   {et:2, pl:"cor",   gn:34, fe:"nb"},
 armee:    {et:2, pl:"cor",   gn:34, fe:"nb", mx:8},
 pompiers: {et:2, pl:"cor",   gn:34, fe:"nb"},
 medecin:  {et:1, pl:"cor",   gn:32, fe:"vit"},
 soins:    {et:1, pl:"cor",   gn:32, fe:"vit"},
 superette:{et:1, pl:"cor",   gn:32, fe:"vit"},
 droguerie:{et:1, pl:"cor",   gn:32, fe:"vit"},
 resto:    {et:1, pl:"cor",   gn:32, fe:"vit"},
 bar:      {et:1, pl:"cor",   gn:32, fe:"vit"},
 armurerie:{et:1, pl:"cor",   gn:32, fe:"vit"},
 stand:    {et:1, pl:"cor",   gn:32, fe:"vit"},
 depot:    {et:1, pl:"halle", gn:0,  fe:"non"},
 hangar:   {et:1, pl:"halle", gn:0,  fe:"non"},
 ferme:    {et:2, pl:"halle", gn:0,  fe:"rar"},
 chateau:  {et:2, pl:"cor",   gn:45, fe:"rar", mx:12},
 guet:     {et:2, pl:"une",   gn:0,  fe:"meur"},
 abri:     {et:1, pl:"une",   gn:0,  fe:"rar"},
 station:  {et:1, pl:"une",   gn:0,  fe:"vit"},
 labo:     {et:1, pl:"cor",   gn:28, fe:"non"}
};
function planDef(b){ return PLANDEF[b&&b.lt]||PLANDEF.maison; }
/* Les etages : l'immeuble porte les siens depuis la v8, ou ils ne servaient
   qu'a dessiner les rangees de fenetres de la facade. */
function planEt(b){
    var D=planDef(b);
    if(D.et) return D.et;
    return Math.max(1,(b&&b.et)||3);
}
/* ---- LA GRAINE D'UN BATIMENT ----
   Le plan ne doit RIEN tirer sur rng() : ouvrir un panneau ne peut pas
   consommer le hasard de la partie, sinon deux rejeux divergent des qu'on
   regarde un plan. On tire donc sur la position du batiment, qui est fixee
   par la generation de la carte et ne bouge plus. */
function planRng(b,fl){
    var s=(((b.x|0)*73856093)^((b.y|0)*19349663)^((fl|0)*83492791))&0x7fffffff;
    return function(){ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
}
/* Le tirage d'arriere-boutique. Il ne sort que sur les lieux a enseigne, et
   seulement pour un emplacement sur trois : le reste de la maison reste une
   maison. Ce qui n'existe pas au registre est ignore sans bruit, pour qu'une
   enseigne neuve n'ait jamais a attendre son objet. */
function bizRoll(b){
    var B=BIZLOOT[b&&b.biz], t, o, i;
    if(!B) return false;
    if(B.st&&B.st.length&&rng()<0.7){
        t=B.st[(rng()*B.st.length)|0];
        o=itemFind(t[0]);
        if(o){ bldPushI(b,o.id,ri(t[1],t[2])); return true; }
    }
    if(B.fm){
        i=pickKindId("obj",B.fm);
        if(i>=0){ bldPushI(b,i,1); return true; }
    }
    return false;
}
/* La duree d'une piece. L'aptitude Fouille commande la vitesse autant que le
   silence : x1,25 a zero, x1 a cinquante, x0,75 a cent. */
function srchDur(b){
    var S=srchDef(b);
    return rr(S.d[0],S.d[1])*(1.25-0.5*statEff(G.p,"astuce","fouille")/100);
}
/* Le bruit d'une piece : un tiroir qui tombe, une vitre qui cede. Il est
   emis a la porte et non sur le joueur, cense rester invisible tant qu'il
   est dedans. A 50 de Fouille une piece sur trois s'entend a 120 px, a 100
   une sur douze a 60, a zero plus d'une sur deux a 190. La plus discrete des
   armes a feu s'entend a 220 : une fouille reste toujours plus silencieuse
   qu'un coup de feu, mais l'hopital a douze pieces fait douze jets. */
function srchNoise(b){
    /* Deux aptitudes, et non plus une seule. Fouille dit avec quelle
       maladresse on retourne un tiroir : c'est elle qui decide si quelque
       chose tombe. Discretion dit jusqu'ou le bruit porte, ce qu'elle fait
       deja pour les pas et pour les armes. Un fouilleur soigneux mais lourd
       fait rarement du bruit, et loin ; un fouilleur brouillon mais leger en
       fait souvent, et pres. */
    var e=statEff(G.p,"astuce","fouille"), s=statEff(G.p,"astuce","discretion");
    var pr, rd;
    if(e<50) pr=0.55+(0.333-0.55)*e/50;
    else pr=0.333+(0.083-0.333)*(e-50)/50;
    if(s<50) rd=190+(120-190)*s/50;
    else rd=120+(60-120)*(s-50)/50;
    if(rng()<pr) noiseAt(b.x+b.w/2,b.y+b.h+6,rd);
}
/* Poser une trouvaille dans le batiment. Meme regle de pile que le sac du
   joueur : on complete avant d'ouvrir une case. */
function bldPushI(b,id,q){
    var o=itemById(id), i, c;
    if(!o||!b.inv) return;
    q=q||1;
    for(i=0;i<b.inv.length&&q>0;i++){ c=b.inv[i];
        if(c&&!cellIsW(c)&&c.i===id) while(q>0&&c.q<cellMax(c)){ c.q++; q--; } }
    while(q>0){
        var at=gridFind(b.inv,o.gw||1,o.gh||1);
        if(at<0) break;
        c={i:id,q:0};
        gridPut(b.inv,at,c);
        while(q>0&&c.q<o.mx){ c.q++; q--; }
    }
}
function bldPushW(b,wi){
    if(wi<0||!b.inv) return;
    gridAdd(b.inv,{w:wi,q:1});
}
function ammoItemId(am){
    var i;
    for(i=0;i<ITEMS.length;i++)
        if(ITEMS[i].k==="mun"&&ITEMS[i].am===am) return ITEMS[i].id;
    return -1;
}
function pickKindId(k,fams){
    var pool=[], i, o;
    for(i=0;i<ITEMS.length;i++){
        o=ITEMS[i];
        if(o.k!==k) continue;
        /* une ceinture ne se tire jamais dans le materiel ordinaire : elle a
           son propre tirage, une fois par batiment, dans les lieux armes.
           Sans cette garde, un lieu sans liste de familles en aurait rendu
           comme s'il s'agissait d'un seau. */
        if(o.blt&&(!fams||fams.indexOf("Ceinture")<0)) continue;
        if(fams&&fams.indexOf(o.fam)<0) continue;
        pool.push(o.id);
    }
    if(!pool.length) return -1;
    return pool[(rng()*pool.length)|0];
}
/* Une trouvaille : on tire d'abord la nature dans le profil du lieu, puis
   l'objet dans la table que ce lieu autorise. */
function srchOne(b){
    var S=srchDef(b), r, acc=0, k, id;
    /* ---- LE VETEMENT DU LIEU ----
       Il ne passe pas par la table des six genres, qui est pleine : il se
       tire avant, sur sa propre chance, et seulement dans les lieux qui en
       contiennent. Une caserne rend un casque une fois sur trois, une maison
       un bonnet une fois sur six, et le musee n'en rend jamais. */
    if(S.vt&&rng()<(S.vc||0.16)){
        var ov=itemFind(pickFrom(S.vt));
        if(ov){ bldPushI(b,ov.id,1); return; }
    }
    r=rng()*100;
    for(k=0;k<6;k++){ acc+=S.p[k]; if(r<acc) break; }
    if(k>5) k=5;
    if(k===0){
        if(!S.w) k=5;
        else {
            /* les deux pieces lourdes ne sortent que de la caserne, et une
               fois sur vingt-cinq : c'est le niveau le plus haut du jeu */
            var lst=(S.w==="militaire"&&rng()<0.04)?WSRC.lourd:WSRC[S.w];
            bldPushW(b,wByName(pickFrom(lst)));
            return;
        }
    }
    if(k===1){
        if(!S.am) k=5;
        else { id=ammoItemId(pickFrom(S.am));
            if(id>=0){ bldPushI(b,id,1); return; } k=5; }
    }
    if(k===4){
        if(!S.jt) k=5;
        else { var o4=itemFind(pickFrom(S.jt));
            if(o4){ bldPushI(b,o4.id,1); return; } k=5; }
    }
    if(k===2){
        if(S.fs&&FOODSET[S.fs]){ var o2=itemFind(pickFrom(FOODSET[S.fs]));
            if(o2){ bldPushI(b,o2.id,ri(1,2)); return; } }
        id=pickKindId("viv",null);
        if(id>=0){ bldPushI(b,id,ri(1,2)); return; }
        k=5;
    }
    if(k===3){
        id=pickKindId("med",null);
        if(id>=0){ bldPushI(b,id,1); return; }
        k=5;
    }
    id=pickKindId("obj",S.fm||null);
    if(id>=0) bldPushI(b,id,1);
}
/* Le decoupage en pieces, tire une fois pour toutes : on le retrouve tel
   quel en revenant. */
function srchInit(b){
    var S=srchDef(b), n;
    if(b.rooms) return;
    b.rooms=ri(S.r[0],S.r[1]);
    b.done=0;
    b.inv=[];
    b.inv.gw=5;
    n=Math.ceil((b.rooms*2+6)/5)*5;   /* des lignes entieres, jamais un moignon */
    while(b.inv.length<n) b.inv.push(null);
    /* le sac du lieu, tire une seule fois : c'est la seule facon d'en
       trouver un autre que celui qu'on porte */
    if(S.bg&&rng()<S.bg[1]&&BAGS[S.bg[0]]){
        var ob=itemFind(BAGS[S.bg[0]].n);
        if(ob) bldPushI(b,ob.id,1);
    }
    /* la ceinture du lieu, tiree une seule fois elle aussi. LA FREQUENCE
       COMPTE PLUS QUE LE NOMBRE DE BOITES : c'est elle qui decide si l'on
       tire loin de chez soi ou non. Six lieux seulement en portent, et elles
       ne sortent jamais de la table generale du materiel. */
    if(S.ce&&rng()<(S.cc||0.25)){
        var oc=itemFind(pickFrom(S.ce));
        if(oc) bldPushI(b,oc.id,1);
    }
    /* la vitrine du chateau : une piece de musee, toujours */
    if(S.vit&&WSRC[S.vit]) bldPushW(b,wByName(pickFrom(WSRC[S.vit])));
}
/* Une piece de plus. Elle donne de zero a deux objets - le zero est
   frequent - et tire son jet de bruit. */
/* Ce que la Fouille ajoute a la richesse d'un emplacement : de moitie moins a
   moitie plus. C'est elle qui fait qu'une meme maison, fouillee par deux
   personnes differentes, ne rend pas la meme chose. Le rendement a ete separe
   un temps dans une aptitude Flair, puis rendu a Fouille : c'est la meme
   chose, quelqu'un de tres bon en fouille est plus rapide, plus discret et
   rapporte de meilleures choses. */
function flairMul(){
    return 0.5+statEff(G.p,"astuce","fouille")/100;
}
function srchRoom(b){
    var S=srchDef(b), n, i, r=Math.min(1,S.ri*flairMul());
    if(S.n) n=ri(S.n[0],S.n[1]);
    else { n=(rng()<r)?1:0; if(n&&rng()<r*0.55) n=2; }
    /* l'arriere-boutique : un emplacement sur trois, et il compte pour lui */
    if(b.biz&&BIZLOOT[b.biz]&&rng()<0.34&&bizRoll(b)) n=Math.max(0,n-1);
    for(i=0;i<n;i++) srchOne(b);
    b.done++;
    srchNoise(b);
    /* fouiller apprend a fouiller, que l'on trouve ou non */
    secBump(G.p,"fouille",1);
}
/* Un emplacement, et un seul. Chaque appui sur [F] en ouvre un nouveau, avec
   son propre compte a rebours : deux emplacements du meme lieu ne prennent
   jamais le meme temps. */
function srchGo(b){
    if(!b||!b.lt) return false;
    srchInit(b);
    if(G.srch) return false;
    if(b.done>=b.rooms){
        notice("PLUS RIEN A FOUILLER");
        return false;
    }
    G.srch={b:b,t:0,dur:srchDur(b)};
    return true;
}
function srchLeft(b){
    if(!b||!b.lt) return 0;
    return Math.max(0,(b.rooms|0)-(b.done|0));
}
function updSearch(dt){
    var S=G.srch;
    if(!S) return;
    if(!G.inside||G.inside!==S.b){ G.srch=null; return; }
    S.t+=dt;
    if(S.t>=S.dur){
        var b9=S.b, av=b9.inv.filter(function(c){ return !!c; }).length;
        G.srch=null;
        srchRoom(b9);
        var ap=b9.inv.filter(function(c){ return !!c; }).length;
        if(!G.loot||G.loot.bld!==b9) lootOpenBld(b9); else lootFill();
        logMsg(b9.done+"/"+b9.rooms+" : "+
            ((ap>av)?"vous trouvez quelque chose."
                   :"il n'y a rien la.")+
            ((b9.done>=b9.rooms)?" Tout est retourne ici.":""),"jday");
        return;
    }
    lootProg();
}

/* ================= LA FENETRE DE FOUILLE =================
   Une seule fenetre pour tout ce qui se fouille : un corps aujourd'hui, un
   batiment demain. A gauche la vignette de ce qu'on fouille, a droite ce
   qu'on y trouve, ligne a ligne. On clique une ligne pour la prendre ; ce
   qu'on laisse reste dans la source et s'y retrouve en revenant.
   Pour un batiment, les lignes arriveront au fur et a mesure que les pieces
   se terminent : G.loot.total et G.loot.done portent l'avancement, et la
   fouille continue pendant qu'on choisit. C'est deja cable ici, il ne
   manquera que le decompte des pieces. */
function lootOpen(src,name,kind,spr){
    if(!src||!src.inv) return;
    G.loot={src:src, name:name||"", kind:kind||"", spr:spr||null,
            done:1, total:1, over:true};
    lpanEl.style.display="flex";
    lootFace();
    lootFill();
}
/* La meme fenetre, ouverte sur un batiment : la source est le batiment
   lui-meme, la vignette sa facade, et l'avancement le compte des pieces. */
function lootOpenBld(b){
    if(!b||!b.inv) return;
    G.loot={src:b, name:(bldLabel(b)||"le batiment"), kind:"", spr:null, bld:b,
            done:b.done, total:b.rooms, over:(b.done>=b.rooms)};
    lpanEl.style.display="flex";
    lootFace();
    lootFill();
}
function lootClose(){
    if(!G||!G.loot) return;
    G.loot=null;
    lpanEl.style.display="none";
}
/* Le bandeau d'avancement se redessine seul a chaque tour : la piece en
   cours avance la barre sans qu'on refasse toute la liste. */
function lootProg(){
    var L=G&&G.loot, el, f;
    if(!L||!L.bld) return;
    el=document.getElementById("lprogb");
    if(!el) return;
    f=L.bld.done+((G.srch&&G.srch.b===L.bld&&G.srch.dur>0)?
        Math.min(1,G.srch.t/G.srch.dur):0);
    el.style.width=Math.round(100*Math.min(1,f/Math.max(1,L.bld.rooms)))+"%";
}
/* La vignette : la silhouette du defunt, ou plus tard la facade du lieu. */
function lootFace(){
    var cv=document.getElementById("lface"), g2, s;
    if(!cv||!cv.getContext||!G.loot) return;
    g2=cv.getContext("2d");
    g2.imageSmoothingEnabled=false;
    g2.clearRect(0,0,cv.width,cv.height);
    g2.fillStyle="#241c12"; g2.fillRect(0,0,cv.width,cv.height);
    /* Un batiment n'a pas de silhouette : on lui prend sa facade sur le
       calque de monde, exactement comme le fait la transparence quand on
       passe derriere lui. */
    if(G.loot.bld){
        var br=G.loot.bld, sy=br.y-36, sh=br.h+38;
        var sc2=Math.min((cv.width-2)/br.w,(cv.height-2)/sh);
        g2.drawImage(worldCv,br.x,sy,br.w,sh,
            Math.round((cv.width-br.w*sc2)/2),Math.round((cv.height-sh*sc2)/2),
            Math.round(br.w*sc2),Math.round(sh*sc2));
        return;
    }
    s=G.loot.spr;
    if(s&&s.width){
        var hd=s.hd||1, w2=s.width/hd, h2=s.height/hd;
        var sc=Math.min((cv.width-4)/w2,(cv.height-4)/h2);
        g2.drawImage(s,0,0,s.width,s.height,
            Math.round((cv.width-w2*sc)/2),Math.round((cv.height-h2*sc)/2),
            Math.round(w2*sc),Math.round(h2*sc));
    }
}
/* Le poids et les cases : c'est lui qui dit si l'on peut encore prendre. */
function lootLoad(){
    var el=document.getElementById("lload");
    if(!el) return;
    var u=invUsed(), c=bagCap();
    el.textContent="SAC "+u+"/"+c+"  "+invWeight().toFixed(1)+
        " / "+carryCap().toFixed(1)+" kg"+(overLoaded()?"  SURCHARGE":"");
    el.className=(u>=c||overLoaded())?"lfull":"";
}
function lootFill(){
    var b=document.getElementById("lbody"), L=G&&G.loot, i, c, o, t="", n=0;
    if(!b||!L) return;
    /* la fenetre relit sa source a chaque appel : pour un batiment, le
       decompte des pieces et l'etat d'avancement viennent de lui */
    if(L.bld){
        L.done=L.bld.done; L.total=L.bld.rooms;
        L.over=(L.bld.done>=L.bld.rooms);
        L.kind=L.over?("FOUILLE - "+L.total+" PIECE"+(L.total>1?"S":"")):
            ("PIECE "+Math.min(L.total,L.done+1)+" SUR "+L.total);
    }
    document.getElementById("lname").textContent=L.name||"";
    document.getElementById("lkind").textContent=L.kind||"";
    document.getElementById("lprogb").style.width=
        Math.round(100*L.done/Math.max(1,L.total))+"%";
    for(i=0;i<L.src.inv.length;i++){
        c=L.src.inv[i];
        if(!c) continue;
        o=cellObj(c);
        if(!o) continue;
        n++;
        t+="<button class='lrow' data-i='"+i+"'>"+
           "<canvas width='96' height='96'></canvas>"+
           "<span><span class='lnm'>"+o.n+"</span><br>"+
           "<span class='lds'>"+(cellIsW(c)?wLine(o):itemLine(o))+"</span></span>"+
           "<span class='lq'>"+(cellIsW(c)?"":("x"+c.q))+"</span></button>";
    }
    if(!n) t+="<div class='lnone'>"+(L.over?"PLUS RIEN A PRENDRE":"RIEN POUR L'INSTANT")+"</div>";
    if(!L.over) t+="<div class='lwait'>FOUILLE EN COURS...</div>";
    b.innerHTML=t;
    /* les vignettes se peignent apres coup, comme dans le panneau du sac */
    var rows=b.querySelectorAll(".lrow"), k;
    for(k=0;k<rows.length;k++)(function(el){
        var ix=parseInt(el.getAttribute("data-i"),10);
        var cc=L.src.inv[ix], oo=cc?cellObj(cc):null, cv2, g3;
        if(!oo) return;
        cv2=el.querySelector("canvas");
        if(cv2&&cv2.getContext){
            g3=cv2.getContext("2d");
            g3.clearRect(0,0,96,96);
            /* une arme se peint dans sa boite de 192 sur 84, un objet dans
               la sienne de 24 sur 24 : deux echelles, deux peintres */
            if(cellIsW(cc)) iconDraw(g3,oo,0,18,96/192,IWHITE);
            else itIconDraw(g3,oo.ic,0,0,4,IWHITE);
        }
        el.onclick=function(){ lootTake(ix); };
    })(rows[k]);
    lootLoad();
}
/* Prendre une ligne. Une pile part d'un coup si elle tient, sinon en partie. */
function lootTake(i){
    var L=G&&G.loot, c, o, moved=0, q, sl;
    if(!L) return;
    c=L.src.inv[i];
    if(!c) return;
    if(cellIsW(c)){
        o=WEAPONS[c.w];
        sl=o?wSlot(o):-1;
        /* l'emplacement de sa categorie est libre : elle passe en main.
           Sinon elle descend dans le sac. */
        if(o&&G.p.slots&&sl>=0&&!G.p.slots[sl]){
            setSlot(sl,c.w); L.src.inv[i]=null;
            logMsg("Vous prenez "+o.n.toLowerCase()+" en main.","jday");
        } else {
            if(!invPushW(c.w)){ notice("SAC PLEIN"); lootLoad(); return; }
            L.src.inv[i]=null;
            logMsg("Vous prenez : "+(o?o.n.toLowerCase():"une arme")+".","jday");
        }
    } else {
        o=itemById(c.i);
        /* une armure ou un sac qu'on n'a pas encore se met directement sur soi */
        if(o&&autoWearOne(o)){
            c.q--;
            if(c.q<=0){ L.src.inv[i]=null; sClick(); lootFill(); return; }
        }
        q=c.q;
        while(q>0&&invPush(c.i,1)){ q--; moved++; }
        c.q=q;
        if(!moved){ notice("SAC PLEIN"); lootLoad(); return; }
        o=itemById(c.i);
        if(c.q<=0) L.src.inv[i]=null;
        logMsg("Vous prenez : "+(o?o.n.toLowerCase():"?")+
               (moved>1?(" x"+moved):"")+".","jday");
    }
    sClick();
    lootFill();
}
function lootAll(){
    var L=G&&G.loot, i, before=-1, guard=0;
    if(!L) return;
    /* on repasse tant que quelque chose bouge : une pile peut se vider en
       plusieurs fois selon les cases qui se liberent */
    while(guard++<40){
        before=lootCount();
        for(i=0;i<L.src.inv.length;i++) if(L.src.inv[i]) lootTakeQuiet(i);
        if(lootCount()===before) break;
    }
    lootFill();
}
function lootCount(){
    var L=G&&G.loot, i, n=0;
    if(!L) return 0;
    for(i=0;i<L.src.inv.length;i++) if(L.src.inv[i]) n+=L.src.inv[i].q||1;
    return n;
}
function lootTakeQuiet(i){
    var L=G&&G.loot, c=L.src.inv[i], q, moved=0, o, sl;
    if(!c) return;
    if(cellIsW(c)){
        o=WEAPONS[c.w];
        sl=o?wSlot(o):-1;
        if(o&&G.p.slots&&sl>=0&&!G.p.slots[sl]){
            setSlot(sl,c.w); L.src.inv[i]=null;
            logMsg("Vous prenez "+o.n.toLowerCase()+" en main.","jday");
        } else if(invPushW(c.w)){ L.src.inv[i]=null;
            logMsg("Vous prenez : "+(o?o.n.toLowerCase():"une arme")+".","jday"); }
        return;
    }
    o=itemById(c.i);
    if(o&&autoWearOne(o)){
        c.q--;
        if(c.q<=0){ L.src.inv[i]=null; return; }
    }
    q=c.q;
    while(q>0&&invPush(c.i,1)){ q--; moved++; }
    c.q=q;
    if(moved){ logMsg("Vous prenez : "+(o?o.n.toLowerCase():"?")+
           (moved>1?(" x"+moved):"")+".","jday"); }
    if(c.q<=0) L.src.inv[i]=null;
}
/* La fiche courte d'une arme, pour la ligne de fouille. */
function wLine(w){
    if(!w) return "";
    if(w.cat===3) return w.dmg+" degats, "+w.pds.toFixed(1)+" kg";
    return (w.am?(AMMO[w.am]?AMMO[w.am].n:"")+", ":"")+
           w.dmg+" degats, "+w.pds.toFixed(1)+" kg";
}

function actLabel(a){
    if(a.k==="srch") return "Fouiller  "+((a.b.done|0)+1)+"/"+(a.b.rooms|0);
    if(a.k==="gnd") return "Ramasser "+gndName(a.g);
    if(a.k==="talk") return "Parler a "+((a.t.n&&a.t.n.name)||"cet habitant");
    if(a.k==="door") return bldCanEnter(a.b)
        ?((a.b.lock?"Crocheter ":"Entrer dans ")+(bldLabel(a.b)||"le batiment"))
        :("Chez quelqu'un - "+(bldLabel(a.b)||"un logement"));
    if(a.k==="body"){
        var nm=a.o.name||"";
        if(!nm) return "Fouiller ce corps";
        return "Fouiller le corps "+("aeiouyAEIOUY".indexOf(nm.charAt(0))>=0?"d'":"de ")+nm;
    }
    return "Ramasser : "+(VEGITEM[a.v.type]||VEGITEM[0]).toLowerCase();
}
function actIdOf(a){
    if(a.k==="srch") return "s"+(a.b.done|0);
    if(a.k==="gnd") return "g"+a.g.n;
    if(a.k==="talk") return "t"+((a.t.n&&a.t.n.name)||"?");
    if(a.k==="door") return "b"+Math.round(a.b.x)+","+Math.round(a.b.y);
    if(a.k==="body") return "c"+Math.round(a.o.x)+","+Math.round(a.o.y);
    return "v"+Math.round(a.v.x)+","+Math.round(a.v.y);
}
function buildActs(){
    var p=G.p, L=[], t, b, v, i, at=-1;
    /* Dedans, une seule action existe et elle survit a la fenetre ouverte :
       fouiller l'emplacement suivant. C'est le seul cas ou [F] reste actif
       alors qu'un panneau est affiche - sans cela il faudrait refermer les
       trouvailles entre chaque emplacement. */
    if(G.inside&&!G.pick&&!G.talk){
        /* on ne fouille pas chez soi : on y range */
        if(srchLeft(G.inside)>0&&!G.srch&&!(BASE&&BASE.b===G.inside))
            /* On ne force pas une porte dans un pays qui va bien : tant
               que les zombis ne sont pas dehors, il n'y a rien a piller
               et quelqu'un habite ici. */
            if(proOpen()) L.push({k:"srch",b:G.inside,d:0});
        G.acts=L; G.actI=0;
        G.actK=L.length?actIdOf(L[0]):"";
        return;
    }
    if(G.inside||G.pick||G.talk||G.loot){ G.acts=[]; G.actI=0; G.actK=""; return; }
    t=nearestVillager(42);
    if(t) L.push({k:"talk",t:t,d:dist2(t.n.x,t.n.y,p.x,p.y)});
    b=doorAt(34);
    if(b) L.push({k:"door",b:b,d:dist2(b.x+b.w/2,b.y+b.h+6,p.x,p.y)});
    v=nearestVeg(CFG.VEG_REACH);
    if(v) L.push({k:"veg",v:v,d:dist2(v.x,v.y,p.x,p.y)});
    var co=nearestCorpse(38);
    if(co) L.push({k:"body",o:co,d:dist2(co.x,co.y,p.x,p.y)});
    var gd=nearestGnd(30);
    if(gd) L.push({k:"gnd",g:gd,d:dist2(gd.x,gd.y,p.x,p.y)});
    L.sort(function(a1,a2){ return a1.d-a2.d; });
    G.acts=L;
    /* le choix precedent est conserve tant qu'il reste a portee */
    for(i=0;i<L.length;i++) if(actIdOf(L[i])===G.actK){ at=i; break; }
    G.actI=(at>=0)?at:0;
    G.actK=L.length?actIdOf(L[G.actI]):"";
}
function actCycle(d){
    var L=G.acts||[];
    if(L.length<2) return;
    G.actI=(((G.actI|0)+d)%L.length+L.length)%L.length;
    G.actK=actIdOf(L[G.actI]);
    sClick();
}
/* Designer une ligne par son rang. Le clic passe par la, et non par
   actCycle : un deplacement relatif calcule au moment du clic ne vaudrait
   plus rien au tour ou il s'applique si la liste a change entre-temps. */
function actPick(i){
    var L=G.acts||[];
    if(!L.length) return;
    i=i|0;
    if(i<0||i>=L.length) return;
    if(i===(G.actI|0)) return;
    G.actI=i;
    G.actK=actIdOf(L[i]);
    sClick();
}
function actKey(){
    /* Dedans, [F] fouille l'emplacement suivant, et il le fait meme quand la
       fenetre des trouvailles est ouverte : sans cela il faudrait la refermer
       entre chaque emplacement. Partout ailleurs, un panneau ouvert coupe
       l'action comme avant. */
    if(G.inside&&!G.pick&&!G.talk){
        buildActs();
        var a9=(G.acts||[])[0];
        if(a9&&a9.k==="srch") srchGo(a9.b);
        return;
    }
    if(G.loot) return;
    if(G.pick||G.talk) return;
    /* on refait la liste ici meme : sans cela [F] agirait sur l'etat du tour
       precedent, et une porte tout juste atteinte ne repondrait pas */
    buildActs();
    var L=G.acts||[], a=L[G.actI|0];
    if(!a) return;
    if(a.k==="talk"){ talkStart(a.t); return; }
    if(a.k==="veg"){ harvest(a.v); return; }
    if(a.k==="body"){ bodySearch(a.o); return; }
    if(a.k==="gnd"){ gndTake(a.g); return; }
    if(a.k==="srch"){ srchGo(a.b); return; }
    var b=a.b;
    /* Le refus passe AVANT la serrure : on ne crochete pas non plus la
       porte de quelqu'un tant qu'on n'a pas de raison d'y entrer. */
    if(a.k==="door"&&!bldCanEnter(b)){ bldRefuse(b); sClick(); return; }
    if(b.lock){
        /* ---- CROCHETAGE : ON SAIT, OU ON NE SAIT PAS ----
           AVANT L'EXPLOSION seulement. L'aptitude ne rend pas plus rapide :
           elle decide du niveau de serrure que l'on sait ouvrir, et en dessous
           c'est un refus, pas une lenteur. Les serrures vont de 2 a 10 ;
           l'echelle de 5 a 100 s'y rabat. Le crocheteur mediocre n'entre pas
           au commissariat, a l'armurerie ou au laboratoire, tous a 10.
           PASSE LA BRECHE, plus de niveau qui tienne : le monde a bascule,
           tout le monde crochete tout ; seule la duree propre de la serrure
           reste. (G.pro0>=0 marque l'explosion, et il est deja dans le hash.) */
        var niv=pickLevel(G.p), libre=(G&&G.pro0>=0);
        if((b.pick|0)>niv&&!libre){
            logMsg("Cette serrure vous depasse : il faudrait savoir ouvrir "+
                   "du niveau "+(b.pick|0)+", vous plafonnez a "+niv+".","jday");
            notice("SERRURE NIVEAU "+(b.pick|0));
            return;
        }
        G.pick={b:b,t:0,dur:b.pick};
        logMsg("Porte verrouillee, niveau "+(b.pick|0)+
               ". Vous sortez vos crochets.","jday");
        return;
    }
    enterBld(b);
}
/* force : depGo l'emploie pour franchir la porte une fois l'equipe formee.
   Sans lui, refermer la fenetre avant d'appeler outKey la rouvrait aussitot
   et l'on ne sortait jamais de chez soi. */
function outKey(force){
    /* Chez soi, [S] ne fait pas sortir : il demande d'abord avec qui. */
    if(!force&&baseHere()&&!depOn()){ depOpen(); return; }
    if(G.loot){
        /* Sur un corps, [S] referme et rien de plus. Sur un batiment il
           interrompt aussi la fouille et fait sortir dans le meme geste :
           les pieces non vues le restent, et le decompte reprendra ou il
           s'est arrete. */
        var bl=G.loot.bld;
        lootClose();
        if(!bl){ logMsg("Vous laissez le reste.","jday"); return; }
        if(G.srch&&G.srch.b===bl){
            G.srch=null;
            logMsg("Vous interrompez la fouille : "+(bl.rooms-bl.done)+
                   " piece"+((bl.rooms-bl.done)>1?"s":"")+" en attente.","jday");
        } else logMsg("Vous laissez le reste sur place.","jday");
    }
    if(G.pick){ G.pick=null; logMsg("Vous renoncez a la serrure.","jday"); return; }
    if(G.inside){
        var b=G.inside; G.inside=null;
        planClose();
        G.p.y=b.y+b.h+18;
        G.place={n:"",t:0};
        logMsg("Vous ressortez.","jday");
    }
}

/* ================= SORTIES DE CARTE ================= */
/* Rester sur le point de passage declenche un compte a rebours. A son terme,
   plus tard, la carte changera ; pour l'instant l'annonce suffit. */
function updExits(dt){
    var p=G.p, i, near=false;
    for(i=0;i<EXITS.length;i++)
        if(dist2(p.x,p.y,EXITS[i].x,EXITS[i].y)<(EXITS[i].r||46)*(EXITS[i].r||46)){ near=true; break; }
    if(!near){ G.exitT=0; return; }
    G.exitT+=dt;
    if(G.exitT>=CFG.EXIT_T){ G.exitT=0; notice("CHANGEMENT DE CARTE"); sClick(); }
}

