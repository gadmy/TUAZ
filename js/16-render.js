"use strict";
/* ================================================================
   TUAZ - 16-render.js
   Le rendu d'une image : le monde, les corps, les effets.
   (lignes 17296 a 18829 du mono-fichier d'origine)
   ================================================================ */
/* ================= RENDER ================= */
function drawSpr(spr,x,y,face,alpha){
    var d=spr.hd||1, w=spr.width/d, h=spr.height/d;
    ctx.save();
    if(alpha!==undefined) ctx.globalAlpha=alpha;
    ctx.translate(Math.round(x),Math.round(y));
    if(face<0) ctx.scale(-1,1);
    if(d!==1){ ctx.scale(1/d,1/d); ctx.drawImage(spr,Math.round(-w/2)*d,Math.round(-h+3)*d); }
    else ctx.drawImage(spr,Math.round(-w/2),Math.round(-h+3));
    ctx.restore();
}
/* Un PNJ subit le terrain comme le joueur : il s'enfonce dans l'eau, les
   herbes hautes lui montent a la taille, et il y ralentit d'autant. */
function npcSlow(x,y){
    var m=1;
    if(inSwamp(x,y)) m*=CFG.SWAMP_SLOW;
    if(inGrassFoot(x,y)) m*=CFG.GRASS_SLOW;
    /* la pente ne penalise que hors des voies, exactement comme pour le joueur */
    if(onSlope(x,y)&&!onRoad(x,y,0)) m*=CFG.SLOPE_SLOW;
    /* et la voie porte les habitants comme elle porte le joueur */
    var b=wayBonus(x,y);
    if(b) m*=1+b;
    return m;
}
/* ---- POISSONS SAUTEURS ----
   Dans les mares, les lacs et la mer, un poisson jaillit de temps a autre,
   pique et retombe dans un remous. Les rivieres, elles, courent trop vite.
   Pur decor : tout est tire sur le flux visuel, rien n'entre dans
   l'empreinte d'etat et le rejeu ne s'en trouve pas change. */
function stillWater(x,y){
    if(onCrossing(x,y)) return false;
    if(inSea(x,y)) return true;
    for(var i=0;i<SWAMPS.length;i++){ var b=SWAMPS[i];
        if(b.flow) continue;
        if(x<b.x0||x>b.x1||y<b.y0||y>b.y1) continue;
        for(var j=0;j<b.length;j++) if(inBlob(b[j],x,y)) return true; }
    return false;
}
function updFish(dt,cx,cy){
    var i, k;
    for(i=FISH.length-1;i>=0;i--){
        FISH[i].t+=dt;
        if(FISH[i].t>=FISH[i].dur) FISH.splice(i,1);
    }
    FISHT-=dt;
    if(FISHT>0) return;
    FISHT=vr(0.4,1.9);
    if(FISH.length>=6) return;
    /* on tente quelques points au hasard dans le champ de vision, et le
       premier qui tombe en pleine eau recoit son poisson */
    for(k=0;k<10;k++){
        var px=cx+vr(-40,680), py=cy+vr(-40,400);
        if(!stillWater(px,py)) continue;
        if(!stillWater(px+8,py)||!stillWater(px-8,py)) continue;
        if(!stillWater(px,py+8)||!stillWater(px,py-8)) continue;
        FISH.push({x:px, y:py, t:0, dur:vr(0.6,1),
            h:vr(9,18), vx:vr(-22,22), f:(vr(0,1)<0.5)?-1:1, sz:vr(0.75,1.3)});
        return;
    }
}
function drawFish(cx,cy){
    var i, f;
    for(i=0;i<FISH.length;i++){
        f=FISH[i];
        var u=f.t/f.dur, arc=Math.sin(u*Math.PI);
        var fx=f.x+f.vx*(u-0.5)*f.dur, fy=f.y-arc*f.h;
        var sx=Math.round(fx-cx), sy=Math.round(fy-cy);
        if(sx<-40||sx>690||sy<-40||sy>410) continue;
        /* remous : au depart, puis a la retombee */
        var ring=(u<0.24)?(u/0.24):((u>0.78)?((1-u)/0.22):-1);
        if(ring>=0){
            ctx.save();
            ctx.translate(Math.round(f.x-cx),Math.round(f.y-cy));
            ctx.scale(1,0.42);
            ctx.strokeStyle="rgba(176,218,240,"+(0.55*(1-ring)).toFixed(3)+")";
            ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(0,0,2+ring*8,0,6.283); ctx.stroke();
            ctx.restore();
        }
        if(arc<0.07) continue;
        ctx.save();
        ctx.translate(sx,sy);
        ctx.scale(f.f,1);
        ctx.rotate(Math.atan(-Math.cos(u*Math.PI)*1.5));
        ctx.scale(f.sz,f.sz);
        ctx.fillStyle="#6d94ab"; ctx.fillRect(-8,-3,3,6);
        ctx.fillStyle="#9cc0d4"; ctx.fillRect(-5,-2,9,4);
        ctx.fillRect(-4,-3,6,1); ctx.fillRect(-4,2,6,1);
        ctx.fillStyle="#d8ecf6"; ctx.fillRect(-4,-3,5,1);
        ctx.fillStyle="#5b7f95"; ctx.fillRect(-3,2,5,1);
        ctx.fillStyle="#1a1e24"; ctx.fillRect(2,-1,1,1);
        ctx.restore();
    }
}
/* Debout ou a terre : meme silhouette, couchee et un peu effacee quand la
   personne est morte. Les zombis suivaient deja cette regle. */
function drawBody(spr,n,cx,cy){
    /* un corps qui s'est releve n'est plus la : le zombi qui porte son nom
       marche a sa place */
    if(n.gone) return;
    if(!n.dead){
        drawNpc(sprDir(spr,n),n.x,n.y,cx,cy,n.face,(Math.sin(n.anim)>0)?0:-1);
        return;
    }
    ctx.save();
    ctx.globalAlpha=0.85;
    ctx.translate(Math.round(n.x-cx),Math.round(n.y-cy));
    ctx.rotate(1.5708);
    drawSpr(spr,0,0,n.face);
    ctx.restore();
}
function drawNpc(spr,wx,wy,cx,cy,face,dy){
    /* deux poses de jambes : le decalage d'un pixel devient un changement de
       sprite des lors que la silhouette en possede une seconde */
    if(dy&&spr.alt){ spr=spr.alt; dy=0; }
    var sx=Math.round(wx-cx), sy=Math.round(wy-cy);
    var wet=inSwamp(wx,wy), grs=(!wet&&inGrass(wx,wy)), q, hh;
    if(!wet) shadow(wx-cx,wy-cy,5);
    if(wet){
        hh=spr.height/(spr.hd||1);
        ctx.save();
        ctx.beginPath(); ctx.rect(sx-12,sy-hh+3,24,hh*0.52); ctx.clip();
        drawSpr(spr,wx-cx,wy-cy+(dy||0),face);
        ctx.restore();
        ctx.fillStyle="rgba(120,180,205,0.32)";
        ctx.fillRect(sx-6,Math.round(sy-hh*0.46),12,2);
        return;
    }
    drawSpr(spr,wx-cx,wy-cy+(dy||0),face);
    if(grs){
        for(q=0;q<6;q++){
            var gx9=sx-8+((q*5+((sx*3+q*7)%4))%17);
            var gh9=6+((sx+sy+q*5)%5);
            ctx.fillStyle=(q&1)?"#5c7028":"#46561f";
            ctx.fillRect(gx9,sy-gh9+3,1,gh9);
        }
        ctx.fillStyle="rgba(50,64,26,0.5)";
        ctx.fillRect(sx-9,sy-1,18,4);
    }
}
/* Une bete de pature, dessinee au trait comme les biches : mouton laineux,
   cochon rose ou poule brune. */
function drawBeast(kind,b,cx,cy){
    var sx=Math.round(b.x-cx), sy=Math.round(b.y-cy), f=b.face<0?-1:1;
    var lg=Math.sin(b.anim)*1.6;
    ctx.fillStyle="rgba(0,0,0,0.24)";
    if(kind==="poule"){
        ctx.fillRect(sx-4,sy+1,9,2);
        ctx.fillStyle="#8a5a2e";
        ctx.fillRect(sx-3*f,sy-4,2,4+lg*0.3);
        ctx.fillRect(sx+1*f,sy-4,2,4-lg*0.3);
        ctx.fillStyle="#a8703a";
        ctx.fillRect(sx-4,sy-10,9,6);
        ctx.fillStyle="#c08a4c"; ctx.fillRect(sx-4,sy-10,9,2);
        ctx.fillStyle="#a8703a"; ctx.fillRect(sx+3*f,sy-13,4*f,4);
        ctx.fillStyle="#d03830"; ctx.fillRect(sx+4*f,sy-15,2*f,2);
        ctx.fillStyle="#e8b038"; ctx.fillRect(sx+6*f,sy-12,2*f,2);
        ctx.fillStyle="#1a120c"; ctx.fillRect(sx+4*f,sy-12,1,1);
        return;
    }
    if(kind==="cochon"){
        ctx.fillRect(sx-7,sy+1,15,2);
        ctx.fillStyle="#b06a68";
        ctx.fillRect(sx-5*f,sy-5,2,5+lg*0.4);
        ctx.fillRect(sx-1*f,sy-5,2,5-lg*0.4);
        ctx.fillRect(sx+4*f,sy-5,2,5+lg*0.4);
        ctx.fillStyle="#e0a0a0";
        ctx.fillRect(sx-7,sy-13,15,8);
        ctx.fillStyle="#f0b8b8"; ctx.fillRect(sx-7,sy-13,15,3);
        ctx.fillStyle="#e0a0a0"; ctx.fillRect(sx+6*f,sy-14,4*f,5);
        ctx.fillStyle="#c08484"; ctx.fillRect(sx+9*f,sy-12,2*f,2);
        ctx.fillStyle="#1a120c"; ctx.fillRect(sx+7*f,sy-13,1,1);
        return;
    }
    /* mouton */
    ctx.fillRect(sx-7,sy+1,15,2);
    ctx.fillStyle="#4a4038";
    ctx.fillRect(sx-5*f,sy-5,2,5+lg*0.4);
    ctx.fillRect(sx-1*f,sy-5,2,5-lg*0.4);
    ctx.fillRect(sx+4*f,sy-5,2,5+lg*0.4);
    ctx.fillStyle="#e4e0d4";
    ctx.fillRect(sx-7,sy-14,14,9);
    ctx.fillStyle="#f4f0e6";
    ctx.fillRect(sx-6,sy-15,5,3); ctx.fillRect(sx-1,sy-16,6,3); ctx.fillRect(sx+4,sy-14,3,3);
    ctx.fillStyle="#3e3a34"; ctx.fillRect(sx+6*f,sy-15,4*f,5);
    ctx.fillStyle="#1a120c"; ctx.fillRect(sx+8*f,sy-14,1,1);
}
function shadow(x,y,w){
    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.fillRect(Math.round(x-w/2),Math.round(y+1),w,2);
}
/* ---- VISEE A LA SOURIS ----
   Arme en main, un cercle entoure le personnage et le reticule court dessus.
   Il reste toujours a la meme distance, quelle que soit la position du
   pointeur : on ne vise pas un point, on vise une direction. Le rayon est le
   meme pour toutes les categories d'armes qui tirent. La lunette, l'arc de
   dispersion et le tir lui-meme viendront ensuite.
   Le pointeur est purement visuel pour l'instant : rien de tout cela n'entre
   dans le journal d'entrees. Le jour ou l'on tirera, l'angle de visee devra y
   entrer comme le reste, sinon le rejeu ne reproduira pas la scene. */
var MOUSE={x:640,y:360,seen:false};
/* Le reticule ne saute pas d'un bord a l'autre : il rattrape la souris a la
   vitesse que permet l'arme. AIMA est l'angle affiche, purement visuel ;
   c'est lui qui part dans le journal au moment du coup, quantifie. */
var AIMA=0, AIMOX=CFG.AIM_R, AIMOY=0, AIMD=0;
function aimQuant(){ return Math.round(AIMA*512/6.283185307)&511; }
/* Une ligne de la liste des actions attrape le clic : les deux ecouteurs
   sont poses sur la fenetre et se declencheraient quand meme, on tirerait
   donc en choisissant sa porte. */
function onHUD(e){
    var t=e&&e.target;
    return !!(t&&t.closest&&t.closest("#achoice"));
}
addEventListener("mousedown",function(e){
    if(state!=="play"||!G||!G.armed||G.inside) return;
    if(e.button!==0) return;
    /* un panneau ouvert mange le clic : on ne tire pas en choisissant une arme */
    if(AIMDBG.on||G.showBag||G.trade||G.talk) return;
    if(onHUD(e)) return;
    pushAct("tir",aimQuant());
});
addEventListener("mousedown",function(e){
    if(state!=="play"||!G||!G.armed||G.inside) return;
    if(e.button!==2) return;
    if(AIMDBG.on||G.showBag||G.trade||G.talk) return;
    if(onHUD(e)) return;
    pushAct("ads",1);
});
addEventListener("mouseup",function(e){
    if(e.button===0&&G&&G.p&&G.p.trig) pushAct("tiroff",0);
    if(e.button===2&&G&&G.p&&G.p.ads) pushAct("ads",0);
});
addEventListener("blur",function(){ if(G&&G.p&&G.p.trig) pushAct("tiroff",0); });
/* la molette choisit dans la liste des actions, quand il y a de quoi choisir */
addEventListener("wheel",function(e){
    if(state!=="play"||!G) return;
    if(G.showBag||G.trade||G.inside||G.pick||G.talk) return;
    if(!G.acts||G.acts.length<2) return;
    pushAct("cyc",e.deltaY>0?1:-1);
},{passive:true});
addEventListener("contextmenu",function(e){ if(state==="play"&&G&&G.armed) e.preventDefault(); });
addEventListener("mousemove",function(e){
    var r=cv.getBoundingClientRect();
    if(!r.width||!r.height) return;
    MOUSE.x=(e.clientX-r.left)*(cv.width/r.width);
    MOUSE.y=(e.clientY-r.top)*(cv.height/r.height);
    MOUSE.seen=true;
});
/* le zoom effectif : celui de reglage [T], multiplie par le recul de vue que
   demande la visee a l'epaule */
function zoomNow(){ return ZOOMS[zoomI]*((G&&G.zads)||1); }
/* du pixel de la toile au repere logique 640x360, zoom compris */
function aimPoint(){
    var Z=zoomNow();
    return {x:(MOUSE.x-640*(1-Z))/(2*Z), y:(MOUSE.y-360*(1-Z))/(2*Z)};
}
/* ---- OUTIL DE REGLAGE DE LA VISEE (F1) ----
   Trois categories d'armes qui tirent, deux manieres de viser : au juge, et
   au clic droit. Pour chaque croisement, quatre valeurs a regler : le rayon
   du reticule, mini et maxi, et l'ouverture du cone de dispersion, mini et
   maxi. Les cinq armes de chaque categorie tiendront ensuite dans ces bornes.
   Le panneau ne touche a rien dans le jeu : il ne sert qu'a voir et a copier. */
var AIMCAT=["Arme legere","Arme lourde","Fusil sniper","Corps a corps"];
/* les deux manieres de s'en servir changent de nom selon la categorie */
var AIMMODE=["Tir au juge","Tir a l'epaule"];
var AIMMODES=[["Tir au juge","Tir a l'epaule"],["Tir au juge","Tir a l'epaule"],
              ["Tir au juge","Tir a l'epaule"],["Coup rapide","Coup lourd"]];
function aimModes(c){ return AIMMODES[c===undefined?AIMDBG.cat:c]; }
/* une couleur par categorie, pour les comparer d'un coup d'oeil */
var AIMCOL=[[240,184,64],[88,192,232],[120,224,160],[232,140,180]];
function acol(c,a){ var k=AIMCOL[c]; return "rgba("+k[0]+","+k[1]+","+k[2]+","+a.toFixed(2)+")"; }
var AIMDIR=[{n:"Nord", x:0, y:-1},{n:"Ouest", x:-1, y:0}];
/* La portee appartient a l'arme : elle ne depend ni du tireur ni de la
   maniere de viser. Le cone, lui, depend des deux : il s'ouvre au juge, se
   resserre a l'epaule, et va du plus mauvais tireur au meilleur. D'ou, par
   categorie, une seule fourchette de portee et deux fourchettes de cone. */
var AIMDBG={on:false, cat:0, dir:0, show:[true,true,true,true,true,true],
  showCat:[true,false,false,false], showArms:false, v:[
  {dmin:50,  dmax:117, cone:[[48,23],[22,10.5]]},
  {dmin:95,  dmax:225, cone:[[33,13],[17,4.5]]},
  {dmin:225, dmax:517, cone:[[30,17],[6,1.4]]},
  {dmin:14,  dmax:38,  cone:[[110,20],[180,48]]}
]};
/* ---- MUNITIONS ----
   Cinq calibres reels, plus la cartouche de chasse sans laquelle aucun fusil a
   pompe ne tiendrait debout. Vitesse et energie sont les chiffres du monde
   reel ; les degats en decoulent par la racine de l'energie, ramenee a une
   echelle ou un homme vaut 100 points de vie.
     .22 LR    2,6 g a 376 m/s  ->   183 J
     9 mm      8,0 g a 350 m/s  ->   480 J
     cal. 12   9 grains de plomb, 400 m/s, environ 2600 J en tout
     .357 Mag 10,2 g a 440 m/s  ->   990 J
     5,56 mm   4,0 g a 930 m/s  ->  1730 J
     8 mm Leb 12,8 g a 700 m/s  ->  3140 J
     7,5 mm    9,0 g a 840 m/s  ->  3180 J
     7,62 mm   9,5 g a 830 m/s  ->  3270 J
     .338 LM  16,2 g a 900 m/s  ->  6560 J
     12,7 mm  42,0 g a 884 m/s  -> 17000 J
   La vitesse du jeu vaut 2,2 px par metre-seconde : le 5,56 file donc plus
   vite que le 12,7, comme dans la realite.
   Deux calibres francais disparus s'ajoutent aux calibres courants : le 8 mm
   Lebel de 1886, celui du Lebel, du Berthier, du Chauchat et de la Hotchkiss,
   et le 7,5 mm MAS de 1929, celui du FM 24/29, du MAS-36, du MAS-49/56 et du
   FR-F1. Ils frappent comme du 7,62 mais on ne les trouve pas sur un soldat
   d'aujourd'hui : c'est la ou l'arme historique se paie. Le .357 du MR73 et
   le .338 du Mini-Hecate completent les deux bouts de l'echelle. */
var AMMO={
  a22:  {n:".22 LR",  v:830,  j:183,   d:11,  p:1, pen:0.15, pds:0.004, br:220},
  a9:   {n:"9 mm",    v:770,  j:480,   d:18,  p:1, pen:0.25, pds:0.012, br:380},
  a12:  {n:"cal. 12", v:880,  j:2600,  d:11,  p:9, pen:0.20, pds:0.045, br:620},
  a357: {n:".357 Mag", v:970,  j:990,   d:26,  p:1, pen:0.34, pds:0.016, br:520},
  a556: {n:"5,56 mm", v:2050, j:1730,  d:34,  p:1, pen:0.60, pds:0.012, br:700},
  a8lb: {n:"8 mm Lebel", v:1540, j:3140, d:46, p:1, pen:0.74, pds:0.028, br:840},
  a75:  {n:"7,5 mm MAS", v:1850, j:3180, d:46, p:1, pen:0.75, pds:0.026, br:830},
  a762: {n:"7,62 mm", v:1830, j:3270,  d:47,  p:1, pen:0.75, pds:0.024, br:820},
  a338: {n:".338 LM",  v:1980, j:6560,  d:66,  p:1, pen:0.88, pds:0.045, br:980},
  a127: {n:"12,7 mm", v:1910, j:17000, d:107, p:1, pen:1.00, pds:0.115, br:1200}
};
/* ---- ARMES ----
   Cinquante-six armes, toutes francaises d'origine ou en dotation dans
   l'armee et la police francaises, de 1914 a nos jours. Les familles n'ont
   plus le meme effectif : la France n'a que deux fusils d'assaut, elle a en
   revanche quantite de fusils a verrou. S'y ajoutent douze armes de stand de
   tir - carabines .22, semi-automatiques a chargeur de dix, revolvers de tir,
   fusil de ball-trap - volontairement faibles : peu de coups, jamais
   d'automatique, de quoi tenir les premiers jours sans valoir un FAMAS.
   Aucune ne porte ses cones en propre : ils se
   deduisent des bornes de sa categorie et de sa finesse (prec, de 0 a 1),
   de sorte qu'aucune arme ne peut sortir de sa categorie, quoi qu'on regle.
   por : portee en px.   cad : coups par minute.   mag : capacite.
   rec : rechargement en secondes.   pds : poids en kg.
   auto : 0 coup par coup, 1 rafale, 2 automatique. */
/* Quatre emplacements : corps a corps, legere, lourde, sniper. Les trois
   categories qui tirent gardent leurs numeros 0 a 2, dont l'outil de reglage
   se sert, et le corps a corps prend le numero 3 ; wSlot() fait la traduction
   vers l'emplacement, ou le corps a corps vient en tete. */
var SLOTN=["Corps a corps","Arme legere","Arme lourde","Fusil sniper"];
function wSlot(w){ return w.cat===3?0:w.cat+1; }
/* Modes de tir : 0 coup par coup, 1 rafale de trois, 2 automatique. */
var FIREMODE=["coup par coup","rafale","automatique"];
var MELEEMODE=["coup rapide","coup lourd"];
function modeName(w,m){ return (w&&w.cat===3)?MELEEMODE[m]:FIREMODE[m]; }
/* Le bruit que fait l'arme : celui de sa munition, ou le sien pour une lame.
   Rien ne l'entend encore, mais les zombis ont deja leur rayon d'ouie. */
function wNoise(w){ var a=wAmmo(w); return a?a.br:(w.br||50); }
/* L'arc d'une arme blanche lui appartient : un couteau pique, une batte
   balaie. Le coup lourd l'ouvre encore. Les bornes de la categorie, reglees
   dans F1, restent la limite : rien ne sort de sa famille. */
function meleeArc(w,m){
    var b=AIMDBG.v[3].cone[m], lo=Math.min(b[0],b[1]), hi=Math.max(b[0],b[1]);
    var a=(w.arc||60)*(m?1.75:1);
    return Math.max(lo,Math.min(hi,a));
}
var WEAPONS=[
 /* --- CORPS A CORPS --- */
 {n:"Poignard Le Vengeur",cat:3,fam:"Lame",  am:null, por:17, prec:0.86, cad:150, mag:0, rec:0, pds:0.3, auto:0, man:0.96, md:[0,1], br:40, arc:26, dmg:22, ic:[13,9,2,0,0,0,32]},
 {n:"Baionnette Rosalie",cat:3, fam:"Lame",  am:null, por:34, prec:0.78, cad:100, mag:0, rec:0, pds:0.6, auto:0, man:0.80, md:[0,1], br:50, arc:30, dmg:30, ic:[19,14,2,0,0,0,32]},
 {n:"Tonfa PR-24",     cat:3, fam:"Contondant",am:null,por:28, prec:0.64, cad:105, mag:0, rec:0, pds:0.6, auto:0, man:0.86, md:[0,1], br:65, arc:92, dmg:26, ic:[24,16,4,0,0,0,0]},
 {n:"Beche-pioche 1916",cat:3,fam:"Tranchant",am:null, por:27, prec:0.52, cad:62,  mag:0, rec:0, pds:1.9, auto:0, man:0.60, md:[0,1], br:80, arc:84, dmg:38, ic:[22,15,2,0,0,0,32]},
 {n:"Hache de sapeur", cat:3, fam:"Tranchant",am:null, por:30, prec:0.46, cad:50,  mag:0, rec:0, pds:2.9, auto:0, man:0.50, md:[0,1], br:88, arc:60, dmg:46, ic:[28,26,2,0,0,0,0]},
 /* La meilleure arme de contact du jeu, et la plus lente : le sac la sent
    passer, et l'on ne s'en sert pas deux fois de suite sans le vouloir. */
 {n:"Hache de pompier",cat:3, fam:"Tranchant",am:null, por:32, prec:0.44, cad:46,  mag:0, rec:0, pds:3.3, auto:0, man:0.46, md:[0,1], br:92, arc:66, dmg:54, ic:[30,28,2,0,0,0,0]},
 /* LA PIECE UNIQUE DE LA CARTE, ET LA SEULE ARME QU'UN SEUL HOMME PORTE.
    Elle ne figure dans aucune table de provenance : on ne la trouve pas en
    fouillant, on ne la ramene pas d'une mission, elle ne sort pas du musee du
    chateau. Elle est sur le guide, et il n'y a qu'une facon de l'avoir.
    Ce n'est PAS la meilleure arme de contact - la hache de pompier frappe
    deux fois et demie plus fort - c'est la plus RAPIDE : une lame de cour ne
    fend pas, elle touche souvent. Le plancher de cadence du corps a corps la
    bride a trente-cinq centiemes entre deux coups, et le souffle fait le
    reste : six points par coup, une reserve pleine tient six secondes de
    moulinet. C'est une arme de duelliste, pas de bucheron.
    uniq la tient hors du tirage des missions. */
 {n:"Epee de cour du chateau",cat:3,fam:"Lame",am:null, por:30, prec:0.90, cad:260, mag:0, rec:0, pds:0.7, auto:0, man:0.97, md:[0,1], br:34, arc:38, dmg:22, uniq:1, ic:[16,11,2,0,0,0,32]},
 /* --- LEGERES : pistolets --- */
 {n:"MAC Mle 1950",    cat:0, fam:"Pistolet", am:"a9",   por:88,  prec:0.62, cad:120,  mag:9,   rec:2.0, pds:0.86, auto:0, man:0.93, md:[0], ic:[19,8,3,1,1,0,0]},
 {n:"MAB PA-15",       cat:0, fam:"Pistolet", am:"a9",   por:95,  prec:0.66, cad:115,  mag:15,  rec:2.0, pds:1.07, auto:0, man:0.90, md:[0], ic:[19,8,3,1,1,0,0]},
 {n:"PAMAS G1",        cat:0, fam:"Pistolet", am:"a9",   por:95,  prec:0.66, cad:120,  mag:15,  rec:2.0, pds:0.98, auto:0, man:0.90, md:[0], ic:[19,8,3,1,1,0,0]},
 {n:"SIG SP 2022",     cat:0, fam:"Pistolet", am:"a9",   por:92,  prec:0.68, cad:130,  mag:15,  rec:1.9, pds:0.76, auto:0, man:0.94, md:[0], ic:[18,7,3,1,1,0,0]},
 {n:"Glock 17",        cat:0, fam:"Pistolet", am:"a9",   por:92,  prec:0.62, cad:130,  mag:17,  rec:1.9, pds:0.9,  auto:0, man:0.95, md:[0], ic:[17,6,3,1,1,0,0]},
 {n:"Unique DES 69",   cat:0, fam:"Pistolet", am:"a22",  por:82,  prec:0.80, cad:70,   mag:5,   rec:2.4, pds:1.26, auto:0, man:0.88, md:[0], ic:[20,10,2,1,1,0,0]},
 {n:"Ruger Mk IV",     cat:0, fam:"Pistolet", am:"a22",  por:78,  prec:0.72, cad:90,   mag:10,  rec:2.1, pds:1.1,  auto:0, man:0.92, md:[0], ic:[20,10,2,1,1,0,0]},
 /* --- LEGERES : revolvers --- */
 {n:"Revolver Mle 1892",cat:0,fam:"Revolver", am:"a9",   por:74,  prec:0.60, cad:90,   mag:6,   rec:3.4, pds:0.84, auto:0, man:0.90, md:[0], ic:[18,9,3,1,1,0,0]},
 {n:"Manurhin MR73",   cat:0, fam:"Revolver", am:"a357", por:104, prec:0.74, cad:80,   mag:6,   rec:3.2, pds:0.98, auto:0, man:0.86, md:[0], ic:[19,9,3,1,1,0,0]},
 {n:"S&W 686",         cat:0, fam:"Revolver", am:"a357", por:100, prec:0.72, cad:85,   mag:6,   rec:3.3, pds:1.19, auto:0, man:0.85, md:[0], ic:[19,9,3,1,1,0,0]},
 /* --- LEGERES : mitraillettes --- */
 {n:"MAS-38",          cat:0, fam:"Mitraillette", am:"a9",  por:84,  prec:0.52, cad:700,  mag:32,  rec:2.8, pds:2.9, auto:2, man:0.72, md:[0,2], ic:[22,5,3,3,2,0,0]},
 {n:"MAT-49",          cat:0, fam:"Mitraillette", am:"a9",  por:90,  prec:0.56, cad:600,  mag:32,  rec:2.6, pds:3.5, auto:2, man:0.74, md:[0,2], ic:[22,5,3,3,2,0,0]},
 {n:"Hotchkiss Universal",cat:0,fam:"Mitraillette",am:"a9", por:82,  prec:0.50, cad:650,  mag:32,  rec:2.9, pds:3.4, auto:2, man:0.70, md:[0,2], ic:[20,6,2,3,1,0,0]},
 {n:"MP5",             cat:0, fam:"Mitraillette", am:"a9",  por:112, prec:0.74, cad:800,  mag:30,  rec:2.5, pds:3.0, auto:2, man:0.76, md:[0,1,2], ic:[28,8,3,3,3,0,8]},
 {n:"HK UMP9",         cat:0, fam:"Mitraillette", am:"a9",  por:100, prec:0.70, cad:600,  mag:30,  rec:2.6, pds:2.3, auto:2, man:0.80, md:[0,1,2], ic:[26,7,2,4,7,3,0]},
 /* --- LOURDES : fusils d'assaut --- */
 {n:"FAMAS F1",        cat:1, fam:"Fusil d'assaut", am:"a556", por:178, prec:0.66, cad:1000, mag:25, rec:2.7, pds:3.6, auto:2, man:0.66, md:[0,1,2], ic:[30,12,2,4,3,0,8]},
 {n:"FAMAS G2",        cat:1, fam:"Fusil d'assaut", am:"a556", por:180, prec:0.68, cad:1100, mag:30, rec:2.6, pds:3.8, auto:2, man:0.65, md:[0,1,2], ic:[30,12,2,4,3,0,8]},
 {n:"HK416F",          cat:1, fam:"Fusil d'assaut", am:"a556", por:190, prec:0.75, cad:850,  mag:30, rec:2.5, pds:3.6, auto:2, man:0.68, md:[0,1,2], ic:[32,11,2,3,3,3,8]},
 /* --- LOURDES : carabines de stand --- */
 {n:"Kalachnikov WBP Jack",cat:1,fam:"Carabine", am:"a762", por:160, prec:0.58, cad:90,  mag:10, rec:2.8, pds:3.6, auto:0, man:0.60, md:[0], ic:[33,13,3,2,3,0,0]},
 {n:"Ruger Mini-14",   cat:1, fam:"Carabine", am:"a556", por:172, prec:0.66, cad:95,  mag:10, rec:2.6, pds:3.0, auto:0, man:0.70, md:[0], ic:[31,13,2,4,3,1,8]},
 {n:"Chiappa M1-22",   cat:1, fam:"Carabine", am:"a22",  por:120, prec:0.62, cad:130, mag:15, rec:2.4, pds:2.4, auto:0, man:0.78, md:[0], ic:[28,10,2,2,2,0,0]},
 {n:"Verney-Carron Impact",cat:1,fam:"Carabine", am:"a762", por:168, prec:0.64, cad:100, mag:4, rec:3.0, pds:3.2, auto:0, man:0.64, md:[0], ic:[32,14,3,2,2,0,0]},
 /* --- LOURDES : mitrailleuses --- */
 {n:"Chauchat CSRG 1915",cat:1,fam:"Mitrailleuse", am:"a8lb", por:172, prec:0.28, cad:240,  mag:20,  rec:5.4, pds:9.1,  auto:2, man:0.36, md:[0,2], ic:[35,15,3,2,4,0,1]},
 {n:"Hotchkiss Mle 1914",cat:1,fam:"Mitrailleuse", am:"a8lb", por:212, prec:0.48, cad:450,  mag:24,  rec:6.2, pds:23.6, auto:2, man:0.10, md:[2], ic:[38,19,4,0,5,0,3]},
 {n:"FM 24/29",        cat:1, fam:"Mitrailleuse", am:"a75",  por:196, prec:0.52, cad:500,  mag:25,  rec:4.6, pds:9.2,  auto:2, man:0.40, md:[0,2], ic:[36,15,3,2,4,0,1]},
 {n:"AA-52",           cat:1, fam:"Mitrailleuse", am:"a75",  por:214, prec:0.44, cad:700,  mag:100, rec:6.8, pds:9.9,  auto:2, man:0.30, md:[2], ic:[37,16,3,2,5,0,1]},
 {n:"Minimi 5,56",     cat:1, fam:"Mitrailleuse", am:"a556", por:210, prec:0.44, cad:850,  mag:200, rec:6.5, pds:7.1,  auto:2, man:0.34, md:[2], ic:[36,15,3,3,5,0,1]},
 {n:"Browning M2",     cat:1, fam:"Mitrailleuse", am:"a127", por:225, prec:0.50, cad:500,  mag:100, rec:9.5, pds:38.0, auto:2, man:0.06, md:[2], ic:[39,20,4,0,5,0,3]},
 /* --- LOURDES : fusils a pompe --- */
 {n:"Manufrance Falcor",cat:1,fam:"Fusil a pompe", am:"a12", por:104, prec:0.48, cad:65,  mag:6,  rec:4.2, pds:3.3, auto:0, man:0.62, md:[0], ic:[32,16,3,2,6,0,4]},
 {n:"Manufrance Robust",cat:1,fam:"Fusil a pompe", am:"a12", por:96,  prec:0.54, cad:110, mag:2,  rec:2.8, pds:3.1, auto:0, man:0.68, md:[0], ic:[34,19,3,2,6,0,4]},
 {n:"Verney-Carron Veloce",cat:1,fam:"Fusil a pompe",am:"a12",por:112,prec:0.52, cad:75,  mag:5,  rec:4.0, pds:3.2, auto:0, man:0.63, md:[0], ic:[33,17,3,2,6,0,4]},
 {n:"Verney-Carron VCD10",cat:1,fam:"Fusil a pompe",am:"a12", por:118, prec:0.56, cad:230, mag:7,  rec:3.6, pds:3.4, auto:0, man:0.60, md:[0], ic:[33,15,3,5,6,3,0]},
 {n:"Remington 870",   cat:1, fam:"Fusil a pompe", am:"a12", por:108, prec:0.50, cad:70,  mag:6,  rec:4.0, pds:3.6, auto:0, man:0.6, md:[0], ic:[33,17,3,2,6,0,4]},
 {n:"Browning B525",   cat:1, fam:"Fusil a pompe", am:"a12", por:100, prec:0.58, cad:120, mag:2,  rec:2.6, pds:3.4, auto:0, man:0.70, md:[0], ic:[32,15,3,2,6,0,4]},
 /* --- SNIPERS : coup par coup --- */
 {n:"Lebel Mle 1886",  cat:2, fam:"Coup par coup", am:"a8lb", por:296, prec:0.52, cad:18, mag:8,  rec:5.2, pds:4.4, auto:0, man:0.44, md:[0], ic:[38,21,2,2,1,0,0]},
 {n:"Berthier 1907/15",cat:2, fam:"Coup par coup", am:"a8lb", por:292, prec:0.54, cad:20, mag:5,  rec:4.4, pds:3.8, auto:0, man:0.50, md:[0], ic:[37,20,2,2,1,0,0]},
 {n:"MAS-36",          cat:2, fam:"Coup par coup", am:"a75",  por:300, prec:0.58, cad:22, mag:5,  rec:4.2, pds:3.7, auto:0, man:0.52, md:[0], ic:[36,18,2,2,2,0,0]},
 {n:"FR-F1",           cat:2, fam:"Coup par coup", am:"a75",  por:342, prec:0.70, cad:20, mag:10, rec:3.8, pds:5.2, auto:0, man:0.46, md:[0], ic:[36,19,2,2,1,1,0]},
 {n:"Chapuis ROLS",    cat:2, fam:"Coup par coup", am:"a762", por:318, prec:0.68, cad:24, mag:4,  rec:3.8, pds:3.3, auto:0, man:0.58, md:[0], ic:[36,19,2,2,1,1,0]},
 {n:"CZ 457",          cat:2, fam:"Coup par coup", am:"a22",  por:236, prec:0.64, cad:22, mag:5,  rec:3.4, pds:2.7, auto:0, man:0.66, md:[0], ic:[33,17,1,2,1,1,0]},
 {n:"Unique T66",      cat:2, fam:"Coup par coup", am:"a22",  por:248, prec:0.78, cad:18, mag:5,  rec:3.6, pds:4.8, auto:0, man:0.54, md:[0], ic:[33,17,1,2,1,1,0]},
 {n:"Ruger 10/22",     cat:2, fam:"Coup par coup", am:"a22",  por:228, prec:0.60, cad:120,mag:10, rec:2.8, pds:2.3, auto:0, man:0.72, md:[0], ic:[33,17,1,2,1,1,0]},
 /* --- SNIPERS : DMR --- */
 {n:"RSC Mle 1917",    cat:2, fam:"DMR", am:"a8lb", por:312, prec:0.58, cad:100, mag:5,  rec:4.6, pds:5.3, auto:0, man:0.38, md:[0], ic:[37,20,2,2,1,0,0]},
 {n:"MAS-49/56",       cat:2, fam:"DMR", am:"a75",  por:336, prec:0.64, cad:150, mag:10, rec:3.6, pds:3.9, auto:0, man:0.50, md:[0], ic:[36,17,2,2,2,1,0]},
 {n:"FR-F2",           cat:2, fam:"DMR", am:"a762", por:392, prec:0.76, cad:22,  mag:10, rec:3.6, pds:5.3, auto:0, man:0.42, md:[0], ic:[38,20,2,3,3,1,0]},
 {n:"HK417",           cat:2, fam:"DMR", am:"a762", por:366, prec:0.71, cad:210, mag:20, rec:3.2, pds:4.4, auto:0, man:0.45, md:[0], ic:[35,15,2,3,2,2,8]},
 {n:"FN SCAR-H PR",    cat:2, fam:"DMR", am:"a762", por:390, prec:0.74, cad:190, mag:20, rec:3.3, pds:4.9, auto:0, man:0.42, md:[0], ic:[36,16,2,3,2,2,0]},
 /* --- SNIPERS : fusils de precision --- */
 {n:"PGM Ultima Ratio",cat:2, fam:"Sniper", am:"a762", por:452, prec:0.88, cad:18, mag:10, rec:4.2, pds:5.5,  auto:0, man:0.32, md:[0], ic:[38,19,2,5,1,2,1]},
 {n:"PGM Mini-Hecate", cat:2, fam:"Sniper", am:"a338", por:486, prec:0.90, cad:16, mag:5,  rec:4.8, pds:7.6,  auto:0, man:0.24, md:[0], ic:[38,23,4,5,0,2,3]},
 {n:"PGM Hecate II",   cat:2, fam:"Sniper", am:"a127", por:517, prec:0.86, cad:16, mag:7,  rec:5.4, pds:13.8, auto:0, man:0.14, md:[0], ic:[39,21,4,5,2,2,3]}
];
/* Le cone d'une arme se deduit des bornes de sa categorie et de sa finesse :
   une arme fine resserre le pire tireur, une arme grossiere empeche le
   meilleur d'atteindre le plancher. Rien ne sort donc jamais des bornes. */
function wCone(w,mode){
    var b=AIMDBG.v[w.cat].cone[mode], W=b[0], B=b[1], sp=W-B;
    return {pire: W-sp*0.45*w.prec, best: B+sp*0.25*(1-w.prec)};
}
function wAmmo(w){ return w.am?AMMO[w.am]:null; }
/* La maniabilite (man, de 0 a 1) commande deux choses : le temps qu'il faut
   pour sortir l'arme, et la vitesse a laquelle le reticule rattrape la souris.
   Un pistolet colle au pointeur, une mitrailleuse le suit de loin. */
function wEquip(w){ return 0.25+(1-w.man)*1.15; }
function wFollow(w){ return 3.2+w.man*14; }
/* L'ouverture reelle du cone : entre le pire tireur et le meilleur, selon la
   competence Tir et l'aptitude Stabilite de celui qui tient l'arme. */
function wSpread(w,o,mode){
    var c=wCone(w,mode), k=statEff(o,"tir","stabilite")/100;
    if(k<0) k=0; if(k>1) k=1;
    return c.pire+(c.best-c.pire)*k;
}
/* degats d'un coup au but, tous projectiles confondus */
function wDmg(w){ var a=wAmmo(w); return a?a.d*a.p:(w.dmg||0); }
var AIMFLD=[
  {n:"Portee mini",     k:"dmin", min:20, max:1600, step:1,   u:" px"},
  {n:"Portee maxi",     k:"dmax", min:20, max:1600, step:1,   u:" px"},
  {m:0, i:0, min:0,  max:180,  step:0.2, u:" deg"},
  {m:0, i:1, min:0,  max:180,  step:0.2, u:" deg"},
  {m:1, i:0, min:0,  max:180,  step:0.2, u:" deg"},
  {m:1, i:1, min:0,  max:180,  step:0.2, u:" deg"}
];
/* l'intitule d'une jauge : les deux premieres sont fixes, les quatre autres
   prennent le nom de la maniere de s'en servir dans la categorie en cours */
function aimFldName(k){
    var f=AIMFLD[k];
    if(f.n) return f.n;
    var nm=aimModes()[f.m].split(" ");
    return nm[nm.length-1].charAt(0).toUpperCase()+nm[nm.length-1].slice(1)+
           (f.i?" - meilleur":" - pire");
}
function aimDbgCur(){ return AIMDBG.v[AIMDBG.cat]; }
function aimFldGet(k){
    var f=AIMFLD[k], d=aimDbgCur();
    return f.k?d[f.k]:d.cone[f.m][f.i];
}
function aimFldSet(k,v){
    var f=AIMFLD[k], d=aimDbgCur();
    if(f.k) d[f.k]=v; else d.cone[f.m][f.i]=v;
}
/* pose une valeur, bornee, et remet a jour la jauge et son affichage */
function aimDbgSet(i,val){
    var f=AIMFLD[i];
    val=Math.round(val*10)/10;
    if(val<f.min) val=f.min;
    if(val>f.max) val=f.max;
    aimFldSet(i,val);
    var el=document.getElementById("dbgf"+i);
    if(el) el.value=val;
    var sp=document.getElementById("dbgv"+i);
    if(sp) sp.textContent=val+f.u;
    aimDbgNote();
}
/* On ne copie que la categorie sur laquelle on travaille. */
var NL=String.fromCharCode(10);
function aimDbgText(){
    var c=AIMDBG.cat, d=AIMDBG.v[c], m;
    var t="REGLAGE DE LA VISEE - "+AIMCAT[c]+NL;
    t+="portee : "+d.dmin+" a "+d.dmax+" px"+NL;
    for(m=0;m<2;m++)
        t+=(c<3?"cone ":"arc ")+aimModes(c)[m].toLowerCase()+" : "+d.cone[m][0]+
           " deg au plus mauvais, "+d.cone[m][1]+" deg au meilleur"+NL;
    if(c<3) t+="rayon du tir au juge : "+CFG.AIM_R+" px, constant pour toutes les armes"+NL;
    t+="champ de vision : demi-largeur 320 px, demi-hauteur 180 px";
    return t;
}
/* La liste des armes de la categorie, cones deduits des bornes en cours :
   regler les bornes deplace toute la famille d'un bloc. */
function aimDbgArms(){
    var c=AIMDBG.cat, t="ARMES - "+AIMCAT[c]+NL, i, w, cj, ce, a;
    for(i=0;i<WEAPONS.length;i++){
        w=WEAPONS[i];
        if(w.cat!==c) continue;
        cj=wCone(w,0); ce=wCone(w,1); a=wAmmo(w);
        t+=w.n+" ("+w.fam+", "+a.n+") portee "+w.por+
           " px, juge "+cj.pire.toFixed(1)+"-"+cj.best.toFixed(1)+
           " deg, epaule "+ce.pire.toFixed(1)+"-"+ce.best.toFixed(1)+
           " deg, degats "+wDmg(w)+", "+w.cad+" coups/min, chargeur "+w.mag+
           ", recharge "+w.rec+" s, "+w.pds+" kg"+NL;
    }
    return t;
}
function aimDbgOut(){ return AIMDBG.showArms?aimDbgArms():aimDbgText(); }
function aimDbgFill(){
    var i, h="";
    for(i=0;i<AIMFLD.length;i++){
        var f=AIMFLD[i], sh=AIMDBG.show[i], v=aimFldGet(i);
        h+="<div class='dbgsl'>"+
           "<button class='dbgck"+(sh?" on":"")+"' id='dbgc"+i+"'>"+(sh?"X":"")+"</button>"+
           "<label>"+aimFldName(i)+"</label>"+
           "<button class='dbgpm' id='dbgm"+i+"'>-</button>"+
           "<input type='range' id='dbgf"+i+"' min='"+f.min+"' max='"+f.max+
           "' step='"+f.step+"' value='"+v+"'>"+
           "<button class='dbgpm' id='dbgp"+i+"'>+</button>"+
           "<span id='dbgv"+i+"'>"+v+f.u+"</span></div>";
    }
    document.getElementById("dbgsliders").innerHTML=h;
    for(i=0;i<AIMFLD.length;i++)(function(k){
        var el=document.getElementById("dbgf"+k);
        if(el) el.oninput=function(){ aimDbgSet(k,parseFloat(this.value)); };
        /* un pas de un, de part et d'autre de la jauge */
        var mn=document.getElementById("dbgm"+k);
        if(mn) mn.onclick=function(){ aimDbgSet(k,aimFldGet(k)-1); sClick(); };
        var pl=document.getElementById("dbgp"+k);
        if(pl) pl.onclick=function(){ aimDbgSet(k,aimFldGet(k)+1); sClick(); };
        /* la croix decide de ce qui se dessine, sans toucher aux valeurs */
        var ck=document.getElementById("dbgc"+k);
        if(ck) ck.onclick=function(){
            AIMDBG.show[k]=!AIMDBG.show[k];
            this.className="dbgck"+(AIMDBG.show[k]?" on":"");
            this.textContent=AIMDBG.show[k]?"X":"";
            sClick();
        };
    })(i);
    aimDbgTabs();
    aimDbgNote();
}
function aimDbgNote(){
    var d=aimDbgCur(), n=document.getElementById("dbgnote");
    if(!n) return;
    n.innerHTML="La portee est celle de l'arme, la meme au juge et a l'epaule ; "+
        "seul le cone change. Les cones se tracent jusqu'a la portee maxi, "+
        "l'epaule en trait franc et le juge en trait faible."+
        (d.dmax>320?" Ici la portee maxi sort du champ de vision : il faudra deporter la vue.":"");
    var o=document.getElementById("dbgout");
    if(o) o.value=aimDbgOut();
    var ab=document.getElementById("dbgarms");
    if(ab) ab.className="dbgtab"+(AIMDBG.showArms?" on":"");
}
function aimDbgTabs(){
    var i, h="", q;
    h="<label style='color:#c8a860;font-size:8px;width:44px;'>Regler</label>";
    for(i=0;i<AIMCAT.length;i++)
        h+="<button class='dbgtab"+(i===AIMDBG.cat?" on":"")+"'>"+
           AIMCAT[i].toUpperCase()+"</button>";
    document.getElementById("dbgcat").innerHTML=h;
    var bc=document.querySelectorAll("#dbgcat .dbgtab");
    for(q=0;q<bc.length;q++)(function(k){
        bc[k].onclick=function(){
            AIMDBG.cat=k; AIMDBG.showCat[k]=true; sClick(); aimDbgFill(); };
    })(q);
    /* ce que l'on affiche : plusieurs categories a la fois, chacune dans sa
       couleur, pour comparer sur la meme image */
    h="<label style='color:#c8a860;font-size:8px;width:44px;'>Afficher</label>";
    for(i=0;i<AIMCAT.length;i++)
        h+="<button class='dbgtab"+(AIMDBG.showCat[i]?" on":"")+
           "' style='color:"+acol(i,1)+";border-color:"+
           (AIMDBG.showCat[i]?acol(i,1):"#4a3a20")+";'>"+
           (AIMDBG.showCat[i]?"X ":"&nbsp; ")+AIMCAT[i].toUpperCase()+"</button>";
    document.getElementById("dbgshowcat").innerHTML=h;
    var sc=document.querySelectorAll("#dbgshowcat .dbgtab");
    for(q=0;q<sc.length;q++)(function(k){
        sc[k].onclick=function(){
            AIMDBG.showCat[k]=!AIMDBG.showCat[k]; sClick(); aimDbgTabs(); };
    })(q);
    /* l'orientation : panneau ouvert, le viseur ne suit plus la souris */
    h="<label style='color:#c8a860;font-size:8px;width:44px;'>Viseur</label>";
    for(i=0;i<AIMDIR.length;i++)
        h+="<button class='dbgtab"+(i===AIMDBG.dir?" on":"")+"'>"+
           AIMDIR[i].n.toUpperCase()+"</button>";
    document.getElementById("dbgdir").innerHTML=h;
    var bd=document.querySelectorAll("#dbgdir .dbgtab");
    for(q=0;q<bd.length;q++)(function(k){
        bd[k].onclick=function(){ AIMDBG.dir=k; sClick(); aimDbgTabs(); };
    })(q);
}
function aimDbgToggle(){
    AIMDBG.on=!AIMDBG.on;
    var el=document.getElementById("dbgaim");
    if(el) el.style.display=AIMDBG.on?"block":"none";
    if(AIMDBG.on) aimDbgFill();
}
function aimDbgCopy(){
    var t=aimDbgOut(), ok=document.getElementById("dbgok");
    var ta=document.getElementById("dbgout");
    if(ta){ ta.value=t; ta.select(); }
    function done(){ if(ok){ ok.textContent="copie"; setTimeout(function(){ ok.textContent=""; },1600); } }
    try{
        if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(t).then(done,function(){ done(); });
            return;
        }
    }catch(e){}
    try{ document.execCommand("copy"); }catch(e2){}
    done();
}
/* Le trace de reglage : les deux portees et les quatre cones, a l'echelle du
   monde, autour du personnage et dans la direction figee. */
function aimDbgDraw(px,py,dx,dy){
    var a0=Math.atan2(dy,dx), c, k;
    function cone(ang,r,st){
        var h=ang*Math.PI/360, c1=Math.cos(h), s1=Math.sin(h);
        var ax=dx*c1-dy*s1, ay=dx*s1+dy*c1;
        var bx=dx*c1+dy*s1, by=-dx*s1+dy*c1;
        ctx.strokeStyle=st; ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(px,py); ctx.lineTo(px+ax*r,py+ay*r);
        ctx.moveTo(px,py); ctx.lineTo(px+bx*r,py+by*r);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(px,py,r,a0-h,a0+h); ctx.stroke();
    }
    function retic(r,st){
        var rx=Math.round(px+dx*r), ry=Math.round(py+dy*r);
        ctx.strokeStyle="rgba(16,14,10,0.65)"; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(rx,ry,5,0,6.283); ctx.stroke();
        ctx.strokeStyle=st; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(rx,ry,5,0,6.283); ctx.stroke();
    }
    for(c=0;c<AIMCAT.length;c++){
        if(!AIMDBG.showCat[c]) continue;
        var d=AIMDBG.v[c];
        if(AIMDBG.show[0]) retic(d.dmin,acol(c,0.5));
        if(AIMDBG.show[1]) retic(d.dmax,acol(c,0.95));
        for(k=2;k<AIMFLD.length;k++){
            if(!AIMDBG.show[k]) continue;
            var f=AIMFLD[k], al=f.m?0.95:0.5;
            cone(d.cone[f.m][f.i],d.dmax,acol(c,f.i?al:al*0.6));
        }
    }
    /* la limite du champ de vision, pour voir quand la portee en sort */
    ctx.strokeStyle="rgba(216,120,80,0.35)"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(px,py,320,0,6.283); ctx.stroke();
}
function drawAim(cx,cy){
    var dbg=(typeof AIMDBG!=="undefined")&&AIMDBG.on;
    if(!G||G.inside||(!G.armed&&!dbg)) return;
    var p=G.p, px=Math.round(p.x-cx), py=Math.round(p.y-cy)-11;
    var a=aimPoint(), dx=a.x-px, dy=a.y-py, l=Math.hypot(dx,dy);
    if(l<0.001){ dx=1; dy=0; l=1; }
    dx/=l; dy/=l;
    if(dbg){
        /* panneau ouvert, le viseur quitte la souris et se fige au nord ou a
           l'ouest : on regle sur une image stable */
        var fd=AIMDIR[AIMDBG.dir];
        aimDbgDraw(px,py,fd.x,fd.y); return;
    }
    /* Au juge le reticule reste colle au cercle : on ne vise qu'une direction.
       A l'epaule il devient un vrai point que l'on pose ou l'on veut, tant que
       l'on reste dans la portee de l'arme ; au-dela il se plaque sur le bord.
       Dans les deux cas il court derriere la souris a la vitesse que le
       maniement autorise, jamais plus vite. */
    var w=handWeapon(), R2=aimRadius();
    var md=Math.hypot(a.x-px,a.y-py)||1, tx, ty;
    AIMD=md;   /* le lancer vise un point, pas seulement une direction */
    if(G.p.ads&&w&&w.cat!==3){
        var cl=Math.min(1,R2/md);
        tx=(a.x-px)*cl; ty=(a.y-py)*cl;
    } else { tx=(a.x-px)/md*R2; ty=(a.y-py)/md*R2; }
    var rate=w?wFollow(w):17, k2=Math.min(1,vdt*rate);
    AIMOX+=(tx-AIMOX)*k2; AIMOY+=(ty-AIMOY)*k2;
    var ol=Math.hypot(AIMOX,AIMOY);
    if(ol>R2){ AIMOX=AIMOX/ol*R2; AIMOY=AIMOY/ol*R2; }
    AIMA=Math.atan2(AIMOY,AIMOX);
    /* gachette maintenue : on tient l'angle a jour dans le journal, mais
       seulement quand il a vraiment bouge, pour ne pas le gonfler */
    if(G.p.trig&&(G.frame&3)===0){
        var qn=aimQuant();
        if(((qn-G.p.aimQ+768)&511)-256!==0) pushAct("vise",qn);
    }
    var rx=Math.round(px+AIMOX), ry=Math.round(py+AIMOY);
    ctx.strokeStyle="rgba(16,14,10,0.65)"; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(rx,ry,5,0,6.283); ctx.stroke();
    ctx.strokeStyle=(G.p.eqT>0)?"rgba(240,216,144,0.35)":"#f0d890"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(rx,ry,5,0,6.283); ctx.stroke();
}
/* ---- IMPACTS ----
   Au point de chute on preleve la couleur du decor et l'on jette trois sortes
   de choses : de la poussiere qui monte et s'etale, des etincelles orange qui
   retombent, et des eclats de la matiere touchee, de sa propre couleur. Le
   tout est purement visuel, tire sur le flux d'image, hors empreinte. */
var IMP=[], impG=worldCv.getContext("2d");
function groundColor(x,y){
    var c=[150,140,120];
    if(x<0||y<0||x>=CFG.WORLD||y>=CFG.WORLD) return c;
    try{
        var d=impG.getImageData(x|0,y|0,1,1).data;
        if(d[3]) c=[d[0],d[1],d[2]];
    }catch(e){}
    return c;
}
function impact(x,y,b){
    var col=groundColor(x,y), k, a, sp, big=b&&b.d>40;
    for(k=0;k<(big?7:4);k++){
        a=vr(0,6.283); sp=vr(4,22);
        IMP.push({k:0, x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-vr(6,20),
            t:vr(0.35,0.75), r:vr(1.5,3.4), c:[200,192,176]});
    }
    for(k=0;k<(big?9:5);k++){
        a=vr(0,6.283); sp=vr(40,150);
        IMP.push({k:1, x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-vr(10,60),
            t:vr(0.12,0.34), r:1, c:[255,vr(150,205)|0,vr(40,80)|0]});
    }
    for(k=0;k<(big?7:4);k++){
        a=vr(0,6.283); sp=vr(25,110);
        IMP.push({k:2, x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-vr(10,50),
            t:vr(0.2,0.5), r:1, c:col});
    }
}
/* Une douille par coup : elle saute de la culasse, tourne et retombe. Les
   armes de corps a corps et les fusils a pompe a pompe n'en jettent pas. */
function ejectCase(){
    var w=handWeapon();
    if(!w||!wAmmo(w)) return;
    var m=muzzlePos();
    IMP.push({k:3, x:m.x-m.f*9, y:m.y-2,
        vx:-m.f*vr(20,50)+vr(-8,8), vy:-vr(45,85),
        t:vr(0.5,0.85), r:1, sp:vr(-14,14), a:vr(0,6.28),
        c:[214,172,72]});
}
function updImp(dt){
    var i, f;
    for(i=IMP.length-1;i>=0;i--){
        f=IMP[i]; f.t-=dt;
        if(f.t<=0){ IMP.splice(i,1); continue; }
        f.x+=f.vx*dt; f.y+=f.vy*dt;
        if(f.k===0){ f.vy-=14*dt; f.vx*=0.94; f.vy*=0.94; f.r+=dt*5; }
        else if(f.k===3){ f.vy+=240*dt; f.vx*=0.99; f.a+=f.sp*dt; }
        else { f.vy+=190*dt; f.vx*=0.97; }
    }
}
function drawImp(cx,cy){
    var i, f, sx, sy, al;
    for(i=0;i<IMP.length;i++){
        f=IMP[i];
        sx=Math.round(f.x-cx); sy=Math.round(f.y-cy);
        if(sx<-20||sx>660||sy<-20||sy>380) continue;
        al=Math.min(1,f.t*(f.k===0?2.2:4));
        ctx.fillStyle="rgba("+f.c[0]+","+f.c[1]+","+f.c[2]+","+al.toFixed(2)+")";
        if(f.k===0) ctx.fillRect(sx-(f.r|0),sy-(f.r|0),(f.r|0)*2+1,(f.r|0)*2+1);
        else if(f.k===3){
            ctx.save(); ctx.translate(sx,sy); ctx.rotate(f.a);
            ctx.fillRect(-2,-1,4,2);
            ctx.restore();
        }
        else ctx.fillRect(sx,sy,f.k===1?2:1,f.k===1?2:1);
    }
}
/* Les zombis : debout ils reprennent la silhouette commune, teintee de vert
   sale ; tombes ils restent au sol, couches. */
/* ---- LE MORT QUI SE RELEVE, ET NON LE ZOMBI DE LABORATOIRE ----
   Il garde ses habits ; on ajoute par-dessus ce qui a change en une minute :
   le sang au visage et sur les vetements, quelques jets qui sourdent du corps,
   et les bras tendus dans le sens de la marche. Tout est visuel - dessine hors
   du flux de simulation, invisible au rejeu. */
function turnedFx(z,sx,sy){
    /* la direction suivie, lue sur la vue courante (0 face .. 4 dos) et le
       miroir face : c'est vers la que les bras se tendent */
    var hx, hy, f=z.face||1;
    switch(z.vw|0){
        case 4: hx=0;     hy=-1;   break;
        case 3: hx=0.7*f; hy=-0.7; break;
        case 2: hx=f;     hy=0;    break;
        case 1: hx=0.7*f; hy=0.7;  break;
        default: hx=0;    hy=1;    break;
    }
    ctx.save();
    /* les bras : deux moignons courts, partant du milieu du torse, tendus dans
       le sens de la marche. L'allongement vertical est ecrase (0.45) car un
       bras qui pointe vers la camera ou a l'oppose est vu en raccourci - sans
       cela, en vue de dos, il montait par-dessus la tete. */
    var shy=sy-9, px=-hy, py=hx, L=5;
    var ex=hx*L, ey=hy*L*0.45;
    var a0x=sx+px*2, a0y=shy+py*2, b0x=sx-px*2, b0y=shy-py*2;
    ctx.strokeStyle="#a98c72"; ctx.lineWidth=2; ctx.lineCap="round";
    ctx.beginPath();
    ctx.moveTo(a0x,a0y); ctx.lineTo(a0x+ex,a0y+ey);
    ctx.moveTo(b0x,b0y); ctx.lineTo(b0x+ex,b0y+ey);
    ctx.stroke();
    ctx.fillStyle="#7a1414";
    ctx.fillRect(Math.round(a0x+ex)-1,Math.round(a0y+ey)-1,2,2);
    ctx.fillRect(Math.round(b0x+ex)-1,Math.round(b0y+ey)-1,2,2);
    /* les taches de sang, fixes : visage et torse. Les jets qui giclaient ont
       ete retires - il reste toujours du sang, il ne jaillit plus. */
    turnedBlood(sx,sy);
    ctx.restore();
}
/* Les taches de sang d'un releve : on les garde debout comme au sol. */
function turnedBlood(x,y){
    ctx.fillStyle="rgba(120,18,16,0.85)";
    ctx.fillRect(x-2,y-12,2,2); ctx.fillRect(x+1,y-13,1,1);
    ctx.fillRect(x-3,y-7,3,2);  ctx.fillRect(x+1,y-6,2,2);
    ctx.fillStyle="rgba(150,26,20,0.7)"; ctx.fillRect(x-1,y-9,2,1);
}
function drawZombies(cx,cy){
    var i, z, sx, sy, spr;
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        /* un corps efface par le temps ne se dessine plus */
        if(z.gone) continue;
        sx=Math.round(z.x-cx); sy=Math.round(z.y-cy);
        if(sx<-30||sx>670||sy<-40||sy>390) continue;
        if(z.hitT>0) z.hitT-=vdt;
        /* le releve d'un mort garde sa silhouette d'habitant ; celui du
           laboratoire porte le skin commun */
        spr=(z.turned&&z.hspr)?z.hspr:zombSpr;
        if(z.dead){
            ctx.save();
            ctx.globalAlpha=0.85;
            ctx.translate(sx,sy);
            ctx.rotate(1.5708);
            drawSpr(spr,0,0,z.face);
            if(z.turned&&z.hspr) turnedBlood(0,0);
            ctx.restore();
            continue;
        }
        drawNpc(sprDir(spr,z),z.x,z.y,cx,cy,z.face,(DMATH.sin(z.anim)>0)?0:-1);
        if(z.turned&&z.hspr) turnedFx(z,sx,sy);
        if(z.hitT>0){
            ctx.fillStyle="rgba(255,64,48,"+(z.hitT*3).toFixed(2)+")";
            ctx.fillRect(sx-7,sy-26,14,26);
        }
        /* jauge de vie des blesses */
        if(z.hp<z.maxhp){
            ctx.fillStyle="rgba(10,8,6,0.7)"; ctx.fillRect(sx-8,sy-30,16,3);
            ctx.fillStyle="#c04838";
            ctx.fillRect(sx-8,sy-30,Math.round(16*z.hp/z.maxhp),3);
        }
    }
}
/* L'arme dans les mains du personnage : la meme silhouette, en petit, posee
   a l'epaule et tournee dans l'axe de visee. */
function drawHeld(cx,cy){
    var p=G.p, w=handWeapon();
    if(!w||!G.armed||G.inside) return;
    /* L'arme ne tourne pas autour du personnage : elle reste dans ses bras.
       Six tenues seulement, gauche et droite pour trois inclinaisons, choisies
       au plus pres de la souris. Peu importe qu'elle ne soit pas exactement
       dans l'axe du reticule : ce qui compte est qu'elle parte des mains. */
    var fc=(Math.cos(AIMA)<0)?-1:1;
    var sn=Math.sin(AIMA), tilt=(sn<-0.45)?-1:((sn>0.45)?1:0);
    var ang=tilt*0.62, ox=fc*5, oy=-9+tilt*2;
    ctx.save();
    ctx.translate(Math.round(p.x-cx)+ox, Math.round(p.y-cy)+oy);
    ctx.scale(fc,1);
    ctx.rotate(ang*fc*fc);
    wDraw(ctx,w,-4,-3.5,0.45,-1);
    ctx.restore();
}
/* La position de la bouche, d'ou sortent la douille et la lueur. */
function muzzlePos(){
    var p=G.p, fc=(Math.cos(AIMA)<0)?-1:1;
    var sn=Math.sin(AIMA), tilt=(sn<-0.45)?-1:((sn>0.45)?1:0);
    return {x:p.x+fc*13, y:p.y-9+tilt*4, f:fc};
}
/* Les balles : un trait dans l'axe du tir, et une etincelle a l'impact. */
function drawBullets(cx,cy){
    var i, b, sx, sy, l;
    ctx.lineWidth=1;
    for(i=0;i<G.bul.length;i++){
        b=G.bul[i];
        sx=b.x-cx; sy=b.y-cy;
        if(sx<-40||sx>680||sy<-40||sy>400) continue;
        l=Math.hypot(b.vx,b.vy)||1;
        ctx.strokeStyle="rgba(255,232,168,0.85)";
        ctx.beginPath();
        ctx.moveTo(sx,sy);
        ctx.lineTo(sx-b.vx/l*7,sy-b.vy/l*7);
        ctx.stroke();
    }
    for(i=G.fx.length-1;i>=0;i--){
        var f=G.fx[i];
        if(f.k!=="i") continue;
        f.t-=vdt;
        if(f.t<=0){ G.fx.splice(i,1); continue; }
        sx=Math.round(f.x-cx); sy=Math.round(f.y-cy);
        ctx.fillStyle="rgba(255,224,150,"+(f.t*4).toFixed(2)+")";
        ctx.fillRect(sx-1,sy-1,3,3);
    }
}
/* ---- LES NUAGES DE L'EXPLOSION ----
   Au moment ou le laboratoire cede, de gros nuages sombres viennent de sa
   direction et traversent le champ de vision. Purement visuel (repere CARTE,
   temps visuel), invisible au rejeu : une fois nes, ils sont poses dans le
   monde et c'est la camera qui glisse devant eux, non l'inverse. */
var CLOUDS=[];
function spawnClouds(){
    var lb=labRect();
    var lx=lb?lb.x+lb.w/2:0, ly=lb?lb.y+lb.h/2:0;
    var bx=G.p.x, by=G.p.y;
    var dx=bx-lx, dy=by-ly, m=Math.hypot(dx,dy)||1; dx/=m; dy/=m;
    var perpx=-dy, perpy=dx, i, sp, off;
    for(i=0;i<8;i++){
        sp=26+Math.random()*16; off=(Math.random()-0.5)*440;
        CLOUDS.push({ x:bx-dx*380+perpx*off, y:by-dy*380+perpy*off,
            vx:dx*sp, vy:dy*sp, r:90+Math.random()*110,
            t:0, life:22+Math.random()*8, delay:i*0.9+Math.random()*0.5 });
    }
}
function drawClouds(dt,cx,cy){
    if(!CLOUDS.length) return;
    var i, c, a, g, sx, sy;
    for(i=CLOUDS.length-1;i>=0;i--){ c=CLOUDS[i];
        if(c.delay>0){ c.delay-=dt; continue; }
        c.t+=dt; c.x+=c.vx*dt; c.y+=c.vy*dt;
        if(c.t>=c.life){ CLOUDS.splice(i,1); continue; }
        a=Math.min(1,c.t/1.6)*Math.min(1,(c.life-c.t)/4)*0.72;
        if(a<=0.01) continue;
        sx=c.x-cx; sy=c.y-cy;
        g=ctx.createRadialGradient(sx,sy,c.r*0.12,sx,sy,c.r);
        g.addColorStop(0,"rgba(44,38,32,"+a.toFixed(3)+")");
        g.addColorStop(0.6,"rgba(52,46,40,"+(a*0.7).toFixed(3)+")");
        g.addColorStop(1,"rgba(52,46,40,0)");
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,sy,c.r,0,7); ctx.fill();
    }
}
function render(){
    var cx=Math.round(G.cam.x+(G.shake>0?vr(-G.shake,G.shake):0));
    var cy=Math.round(G.cam.y+(G.shake>0?vr(-G.shake,G.shake):0));
    G.shake=Math.max(0,G.shake-0.4);
    if(state==="play"){ updFish(vdt,cx,cy); updImp(vdt); }
    ctx.clearRect(0,0,640,360);
    var zt=adsZoom();
    G.zads+=(zt-G.zads)*Math.min(1,vdt*6);
    var Z=zoomNow();
    if(Z===1){
        ctx.drawImage(worldCv,cx,cy,640,360,0,0,640,360);
    } else {
        var zsw=640/Z, zsh=360/Z;
        ctx.drawImage(worldCv,cx+320-zsw/2,cy+180-zsh/2,zsw,zsh,0,0,640,360);
        ctx.setTransform(2*Z,0,0,2*Z,640*(1-Z),360*(1-Z));
    }
    var zmx=320*(1/Z-1), zmy=180*(1/Z-1);
    var i,e,q;
    for(i=0;i<DUNGEONS.length;i++){ var dg=DUNGEONS[i];
        var dgx=Math.round(dg.x-cx), dgy=Math.round(dg.y-cy);
        if(dgx<-90||dgx>730||dgy<-160||dgy>420) continue;
        /* torches de part et d'autre de la porte */
        var tf=1;
        ctx.save(); ctx.globalCompositeOperation="lighter"; ctx.globalAlpha=0.45*tf;
        ctx.fillStyle="#f09030";
        ctx.beginPath(); ctx.arc(dgx-22,dgy-26,9,0,7); ctx.fill();
        ctx.beginPath(); ctx.arc(dgx+22,dgy-26,9,0,7); ctx.fill();
        ctx.restore();
        ctx.fillStyle="#f8c060"; ctx.fillRect(dgx-23,dgy-28,3,4); ctx.fillRect(dgx+21,dgy-28,3,4);
    }
    if(waveNum()>=CFG.CAVE_WAVE){
        for(i=0;i<CAVES.length;i++){ var cv=CAVES[i];
            var cvx=Math.round(cv.x-cx), cvy=Math.round(cv.y-cy);
            if(cvx<-24||cvx>664||cvy<-24||cvy>384) continue;
            /* butte rocheuse */
            ctx.fillStyle="#4a4640"; ctx.beginPath(); ctx.ellipse(cvx,cvy-4,20,15,0,0,7); ctx.fill();
            ctx.fillStyle="#5a564e"; ctx.beginPath(); ctx.ellipse(cvx,cvy-9,19,12,0,0,7); ctx.fill();
            ctx.fillStyle="#6a665c"; ctx.beginPath(); ctx.ellipse(cvx-3,cvy-14,13,6,0,0,7); ctx.fill();
            ctx.fillStyle="#38342e"; ctx.beginPath(); ctx.ellipse(cvx-6,cvy-2,4,3,0,0,7); ctx.fill();
            ctx.fillStyle="#38342e"; ctx.beginPath(); ctx.ellipse(cvx+11,cvy-7,4,3,0,0,7); ctx.fill();
            /* mousse sur la roche */
            ctx.fillStyle="#3e5e2c";
            ctx.fillRect(cvx-15,cvy-12,5,2); ctx.fillRect(cvx+9,cvy-15,4,2);
            /* bouche noire */
            ctx.fillStyle="#0a0808"; ctx.beginPath(); ctx.ellipse(cvx,cvy+2,10,9,0,0,7); ctx.fill();
            ctx.fillStyle="#161010"; ctx.beginPath(); ctx.ellipse(cvx,cvy,8,6,0,0,7); ctx.fill();
            /* stalactites */
            ctx.fillStyle="#4a463e";
            ctx.fillRect(cvx-6,cvy-6,2,4); ctx.fillRect(cvx-1,cvy-7,2,5); ctx.fillRect(cvx+4,cvy-6,2,3);
            ctx.fillStyle="#3a362e";
            ctx.fillRect(cvx-5,cvy+7,2,3); ctx.fillRect(cvx+3,cvy+7,2,3);
            /* lueur doree au fond */
            ctx.save(); ctx.globalCompositeOperation="lighter";
            ctx.globalAlpha=0.34;
            ctx.fillStyle="#c89030"; ctx.beginPath(); ctx.ellipse(cvx,cvy+1,6,4,0,0,7); ctx.fill();
            ctx.restore();
            /* eboulis */
            ctx.fillStyle="#4a463e";
            ctx.fillRect(cvx-19,cvy+7,5,3); ctx.fillRect(cvx+15,cvy+5,4,3); ctx.fillRect(cvx+18,cvy+9,3,2);
        }
    }
    for(i=0;i<TORCHES.length;i++){ var to=TORCHES[i];
        var tox=Math.round(to.x-cx), toy=Math.round(to.y-cy);
        if(tox<-10||tox>650||toy<-20||toy>370) continue;
        if(to.st){
            ctx.fillStyle="#23262a"; ctx.fillRect(tox-1,toy-1,3,2);
            ctx.fillStyle="#3c4046"; ctx.fillRect(tox-1,toy-15,2,15);
            ctx.fillStyle="#4a4e56"; ctx.fillRect(tox-3,toy-17,7,3);
            if(G.darkNow>0.06){
                ctx.fillStyle="#f8e8b0"; ctx.fillRect(tox-2,toy-14,5,2);
                ctx.fillStyle="#ffffff"; ctx.fillRect(tox-1,toy-14,2,1); }
            continue;
        }
        ctx.fillStyle="#5a4028"; ctx.fillRect(tox-1,toy-4,2,6);
        if(G.darkNow>0.06){
            ctx.fillStyle=(G.frame&8)?"#f0a030":"#f8d060";
            ctx.fillRect(tox-1,toy-7,2,3);
            ctx.fillStyle="#ffffff"; ctx.fillRect(tox,toy-7,1,1); } }
    for(i=0;i<VEGGIES.length;i++){ var v=VEGGIES[i];
        if(v.respT<=0) drawSpr(vegSpr[v.type],v.x-cx,v.y-cy,1); }
    /* le guide du chateau : la silhouette du heros, et les cinq vues avec */
    for(i=0;i<GUIDES.length;i++){ var gd2=GUIDES[i];
        if(gd2.hidden) continue;
        if(gd2.x<cx-40-zmx||gd2.x>cx+680+zmx||gd2.y<cy-40-zmy||gd2.y>cy+400+zmy) continue;
        drawBody(heroA,gd2,cx,cy);
    }
    for(i=0;i<FISHERS.length;i++){ var fi2=FISHERS[i];
        if(fi2.hidden) continue;
        if(fi2.x<cx-40-zmx||fi2.x>cx+680+zmx||fi2.y<cy-40-zmy||fi2.y>cy+400+zmy) continue;
        if(fi2.dead){ drawBody(fisherSpr,fi2,cx,cy); continue; }
        shadow(fi2.x-cx,fi2.y-cy,5);
        drawSpr((Math.sin(fi2.anim)>0)?fisherSpr:(fisherSpr.alt||fisherSpr),
                fi2.x-cx,fi2.y-cy,fi2.face);
        /* ligne jetee vers le lac + flotteur qui danse */
        var fdl=Math.hypot(fi2.lx-fi2.x,fi2.ly-fi2.y)||1;
        var fbx=fi2.x+(fi2.lx-fi2.x)/fdl*30, fby=fi2.y+(fi2.ly-fi2.y)/fdl*30;
        fby+=Math.sin(fi2.bob)*1.5;
        ctx.strokeStyle="rgba(230,225,200,0.55)"; ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(Math.round(fi2.x-cx)+fi2.face*7,Math.round(fi2.y-cy)-16);
        ctx.lineTo(Math.round(fbx-cx),Math.round(fby-cy)); ctx.stroke();
        ctx.fillStyle="#e04040"; ctx.fillRect(Math.round(fbx-cx)-1,Math.round(fby-cy)-1,2,2);
        ctx.fillStyle="#f0f0e8"; ctx.fillRect(Math.round(fbx-cx)-1,Math.round(fby-cy),2,1);
    }
    for(i=0;i<FARMS.length;i++){ var ff=FARMS[i];
        for(var fj=0;fj<ff.farmers.length;fj++){ var fm=ff.farmers[fj];
            if(fm.hidden) continue;
            if(fm.x<cx-40-zmx||fm.x>cx+680+zmx||fm.y<cy-40-zmy||fm.y>cy+400+zmy) continue;
            drawBody(farmerSpr,fm,cx,cy); }
        /* le cheptel des patures */
        for(var fq=0;fq<ff.fields.length;fq++){
            var pf2=ff.fields[fq];
            if(!pf2.herd||!pf2.herd.length) continue;
            for(var bq=0;bq<pf2.herd.length;bq++){
                var bt2=pf2.herd[bq];
                if(bt2.x<cx-30-zmx||bt2.x>cx+670+zmx||bt2.y<cy-30-zmy||bt2.y>cy+390+zmy) continue;
                drawBeast(pf2.beast,bt2,cx,cy);
            }
        }
    }
    for(i=0;i<VILLAGES.length;i++){ var vg=VILLAGES[i];
        if(vg.x<cx-500-zmx||vg.x>cx+1140+zmx||vg.y<cy-500-zmy||vg.y>cy+860+zmy) continue;
        for(var jn=0;jn<vg.villagers.length;jn++){ var nv=vg.villagers[jn];
            if(nv.inb) continue;
            /* un compagnon sorti vous suit loin de son bourg : on le dessine
               a sa propre position, dans la passe du groupe juste apres, sans
               dependre du cadrage de son village */
            if(nv.recruited&&nv.out&&!nv.miss) continue;
            drawBody(clanSpr(nv,dressSpr(nv,nv.spr||VILSPR[nv.s||0])),nv,cx,cy); }
        var sol=vg.soldier;
        if(sol&&!sol.dead)
            drawBody(armySpr,sol,cx,cy);
        }
    /* LES COMPAGNONS VILLAGEOIS SUIVENT PARTOUT. Recrutes, ils vous suivent
       loin de leur bourg ; on les dessine donc a leur propre position, sans
       dependre du cadrage de leur village d'origine. Les compagnons de metier,
       eux, passent deja par la boucle des metiers plus bas. */
    var _gl=eqList(), _gi, _gn;
    for(_gi=0;_gi<_gl.length;_gi++){ _gn=_gl[_gi];
        if(_gn.s===undefined) continue;           /* un ouvrier : dessine ailleurs */
        if(_gn.inb||_gn.hidden||_gn.dead) continue;
        if(_gn.x<cx-40-zmx||_gn.x>cx+680+zmx||_gn.y<cy-40-zmy||_gn.y>cy+400+zmy) continue;
        drawBody(clanSpr(_gn,dressSpr(_gn,_gn.spr||VILSPR[_gn.s||0])),_gn,cx,cy);
    }
    /* le courant se voit : des tirets d'ecume filent vers l'aval */
    for(i=0;i<SWAMPS.length;i++){
        var fb=SWAMPS[i];
        if(!fb.flow) continue;
        if(fb.x1<cx-zmx||fb.x0>cx+640+zmx||fb.y1<cy-zmy||fb.y0>cy+360+zmy) continue;
        for(q=0;q<fb.length;q+=2){
            var fc=fb[q];
            var fsx=fc.x-cx, fsy=fc.y-cy;
            if(fsx<-40-zmx||fsx>680+zmx||fsy<-40-zmy||fsy>400+zmy) continue;
            for(var fk=0;fk<3;fk++){
                var fph=((G.t*0.42)+(fc.x+fc.y)*0.0021+fk*0.37)%1;
                var fof=((fk*37+((fc.x*7+fc.y*3)|0)%29)/29-0.5)*fc.r*0.62;
                var fwx=fc.x+fc.fx*(fph-0.5)*fc.r*1.1-fc.fy*fof;
                var fwy=fc.y+fc.fy*(fph-0.5)*fc.r*1.1+fc.fx*fof;
                /* le tiret ne sort jamais du lit */
                if(!inBlob(fc,fwx,fwy)) continue;
                if(!inBlob(fc,fwx+fc.fx*4,fwy+fc.fy*4)) continue;
                if(!inBlob(fc,fwx-fc.fx*4,fwy-fc.fy*4)) continue;
                /* sous un pont, un gue ou un quai, on ne voit plus l'eau filer */
                if(onCrossing(fwx,fwy)) continue;
                var fpx=fwx-cx, fpy=fwy-cy;
                var fal=0.42*Math.sin(fph*Math.PI);
                if(fal<0.03) continue;
                ctx.strokeStyle="rgba(186,224,242,"+fal.toFixed(3)+")";
                ctx.lineWidth=1;
                ctx.beginPath();
                ctx.moveTo(fpx-fc.fx*4,fpy-fc.fy*4);
                ctx.lineTo(fpx+fc.fx*4,fpy+fc.fy*4);
                ctx.stroke();
            }
        }
    }
    /* camps scouts : la flamme danse, la troupe va et vient autour */
    for(i=0;i<CAMPS.length;i++){
        var cpd=CAMPS[i];
        if(cpd.x<cx-120-zmx||cpd.x>cx+760+zmx||cpd.y<cy-120-zmy||cpd.y>cy+480+zmy) continue;
        var fsx=Math.round(cpd.x-cx), fsy=Math.round(cpd.y-cy);
        var fph2=performance.now()/120;
        for(q=0;q<3;q++){
            var fh2=6+Math.sin(fph2+q*2.1)*2.4;
            ctx.fillStyle=["rgba(240,150,40,0.85)","rgba(250,200,70,0.80)",
                           "rgba(220,90,30,0.70)"][q];
            ctx.fillRect(fsx-3+q*2,fsy-2-fh2,2,fh2);
        }
        ctx.fillStyle="rgba(255,190,90,0.12)";
        ctx.fillRect(fsx-16,fsy-12,32,20);
        for(q=0;q<cpd.scouts.length;q++){ var sc=cpd.scouts[q];
            if(sc.x<cx-40-zmx||sc.x>cx+680+zmx||sc.y<cy-40-zmy||sc.y>cy+400+zmy) continue;
            drawBody(scoutSpr,sc,cx,cy); }
    }
    /* les gens de metier, chacun devant son batiment */
    for(q=0;q<WORKERS.length;q++){ var wkd=WORKERS[q];
        if(wkd.dead||wkd.inb) continue;
        if(wkd.x<cx-40-zmx||wkd.x>cx+680+zmx||wkd.y<cy-40-zmy||wkd.y>cy+400+zmy) continue;
        drawBody(clanSpr(wkd,dressSpr(wkd,wkd.spr||workerSpr(wkd))),wkd,cx,cy);
    }
    /* Le laboratoire : tant qu'il lache quelque chose, son gyrophare
       tourne. Depuis le prologue, cela veut dire entre la question et
       PRO_ANNEAU - avant, le batiment est eteint et n'a rien a signaler. */
    if(LAB&&proT()>=0&&!proRing()&&
       LAB.x>cx-200-zmx&&LAB.x<cx+840+zmx&&LAB.y>cy-200-zmy&&LAB.y<cy+560+zmy){
        var gxr=Math.round(LAB.x+21-cx), gyr=Math.round(LAB.y-32-cy);
        var gpu=0.45+0.55*Math.abs(Math.sin(performance.now()/430));
        ctx.fillStyle="rgba(220,60,44,"+(0.20*gpu).toFixed(3)+")";
        ctx.fillRect(gxr-7,gyr-6,16,13);
        ctx.fillStyle="rgba(255,90,64,"+(0.55+0.40*gpu).toFixed(3)+")";
        ctx.fillRect(gxr-2,gyr-2,4,4);
        ctx.fillStyle="#5e6460"; ctx.fillRect(gxr-2,gyr+2,4,3);
    }
    /* biches : silhouette dessinee au trait, plus vive quand elles detalent */
    for(i=0;i<ARMYBASES.length;i++){
        var abr=ARMYBASES[i];
        if(abr.x<cx-700-zmx||abr.x>cx+1340+zmx||abr.y<cy-700-zmy||abr.y>cy+1060+zmy) continue;
        for(q=0;q<abr.troops.length;q++){ var so=abr.troops[q];
            if(so.x<cx-40-zmx||so.x>cx+680+zmx||so.y<cy-40-zmy||so.y>cy+400+zmy) continue;
            drawBody(armySpr,so,cx,cy); }
    }
    for(i=0;i<DEER.length;i++){
        var dh=DEER[i];
        for(q=0;q<dh.list.length;q++){
            var dd3=dh.list[q];
            var dsx=Math.round(dd3.x-cx), dsy=Math.round(dd3.y-cy);
            if(dsx<-30-zmx||dsx>670+zmx||dsy<-30-zmy||dsy>390+zmy) continue;
            var dfa=dd3.face, dbo=Math.sin(dd3.anim)*(dd3.run>0.1?2:0.8);
            var dwet=inSwamp(dd3.x,dd3.y), dgrs=(!dwet&&inGrass(dd3.x,dd3.y));
            if(dwet){
                /* a gue : seule l'echine et la tete depassent */
                ctx.save();
                ctx.beginPath(); ctx.rect(dsx-14,dsy-22,28,14); ctx.clip();
            }
            ctx.fillStyle="rgba(0,0,0,0.26)";
            if(!dwet) ctx.fillRect(dsx-7,dsy+1,15,2);
            /* pattes */
            ctx.fillStyle="#4a3624";
            var dlg=Math.sin(dd3.anim)*3;
            ctx.fillRect(dsx-5*dfa,dsy-5,2,6+dlg*0.4);
            ctx.fillRect(dsx-2*dfa,dsy-5,2,6-dlg*0.4);
            ctx.fillRect(dsx+3*dfa,dsy-5,2,6-dlg*0.4);
            ctx.fillRect(dsx+6*dfa,dsy-5,2,6+dlg*0.4);
            /* corps */
            ctx.fillStyle="#8a6440";
            ctx.fillRect(dsx-6,dsy-12-dbo*0.3,13,8);
            ctx.fillStyle="#9c7550";
            ctx.fillRect(dsx-6,dsy-12-dbo*0.3,13,3);
            /* croupe claire et queue */
            ctx.fillStyle="#e0d2b8";
            ctx.fillRect(dsx-6*dfa+(dfa>0?0:5),dsy-10-dbo*0.3,3,4);
            /* encolure et tete */
            ctx.fillStyle="#8a6440";
            ctx.fillRect(dsx+4*dfa,dsy-17-dbo*0.5,3,7);
            ctx.fillRect(dsx+5*dfa,dsy-19-dbo*0.5,5*dfa,3);
            ctx.fillStyle="#6e4e30";
            ctx.fillRect(dsx+8*dfa,dsy-20-dbo*0.5,2,2);
            ctx.fillStyle="#1a120c";
            ctx.fillRect(dsx+7*dfa,dsy-18-dbo*0.5,1,1);
            if(dwet){
                ctx.restore();
                ctx.fillStyle="rgba(120,180,205,0.32)";
                ctx.fillRect(dsx-8,dsy-9,17,2);
            }
            if(dgrs){
                for(var dk=0;dk<6;dk++){
                    ctx.fillStyle=(dk&1)?"#5c7028":"#46561f";
                    ctx.fillRect(dsx-8+dk*3,dsy-6-((dsx+dk)%4),1,7+((dsx+dk)%4));
                }
                ctx.fillStyle="rgba(50,64,26,0.5)";
                ctx.fillRect(dsx-9,dsy-2,19,4);
            }
        }
    }
    var p=G.p, bob=(Math.sin(p.anim)>0);
    /* Le chef porte les couleurs de son clan comme les siens : c'est lui qui
       les distribue, il serait etrange qu'il en soit le seul depourvu. */
    var pbase=clanSpr({recruited:1},sprDir(dressSpr(p,p.spr||heroA),p))||heroA;
    var pspr=bob?pbase:(pbase.alt||pbase), pdy=(!bob&&!pbase.alt)?-1:0;
    var pxr=Math.round(p.x-cx), pyr=Math.round(p.y-cy);
    var phh=pspr.height/(pspr.hd||1);
    var pWet=inSwamp(p.x,p.y,p.under), pGrs=inGrassFoot(p.x,p.y), pq2;
    if(!pWet) shadow(p.x-cx,p.y-cy,8);
    if(G.inside){ /* on est dedans : plus de personnage a l'ecran */ }
    /* IL N'Y A PLUS DE CLIGNOTEMENT : il annoncait le repit d'apres-coup, et
       ce repit n'existe plus pour personne. */
    else {
        if(pWet){
            /* immerge jusqu'a la taille : le bas du corps disparait sous l'eau */
            ctx.save();
            ctx.beginPath();
            ctx.rect(pxr-14,pyr-phh+3,28,phh*0.52);
            ctx.clip();
            drawSpr(pspr,p.x-cx,p.y-cy+pdy,p.fx<0?-1:1);
            ctx.restore();
            /* simple ligne de flottaison, sans remous anime */
            ctx.fillStyle="rgba(120,180,205,0.35)";
            ctx.fillRect(pxr-8,pyr-phh*0.46,16,2);
        } else {
            drawSpr(pspr,p.x-cx,p.y-cy+pdy,p.fx<0?-1:1);
        }
        /* Sous un tablier, le personnage passe derriere le pont : on repasse
           par-dessus lui la portion du calque de monde, a demi transparente.
           C'est le meme geste que pour les batiments qu'on longe, dans
           l'autre sens - ici c'est le decor qui revient au premier plan. */
        if(p.under){
            ctx.globalAlpha=0.62;
            ctx.drawImage(worldCv,p.x-34,p.y-42,68,64,
                          pxr-34,pyr-42,68,64);
            ctx.globalAlpha=1;
        }
    }
    /* oiseaux effarouches : de petits chevrons qui montent et s'eloignent */
    for(i=0;i<G.birds.length;i++){
        var bd2=G.birds[i];
        var bsx=Math.round(bd2.x-cx), bsy=Math.round(bd2.y-cy);
        if(bsx<-20-zmx||bsx>660+zmx||bsy<-40-zmy||bsy>380+zmy) continue;
        var bw2=Math.sin(bd2.ph)*3;
        ctx.globalAlpha=Math.min(1,bd2.t*1.4);
        ctx.strokeStyle="#1e1a16"; ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(bsx-3,bsy-bw2);
        ctx.lineTo(bsx,bsy);
        ctx.lineTo(bsx+3,bsy-bw2);
        ctx.stroke();
        ctx.globalAlpha=1;
    }
    /* herbes hautes : quelques touffes repassent devant le bas du corps */
    if(pGrs&&!pWet){
        for(pq2=0;pq2<9;pq2++){
            var gxo=pxr-11+((pq2*7+((pxr*3+pq2*13)%5))%23);
            var gho=7+((pxr+pyr+pq2*5)%6);
            var gsw=Math.sin(G.t*2.2+pq2*1.3+pxr*0.05)*1.6;
            ctx.fillStyle=(pq2&1)?"#5c7028":"#46561f";
            ctx.fillRect(Math.round(gxo+gsw),pyr-gho+4,1,gho);
            ctx.fillRect(Math.round(gxo+gsw*0.5)+1,pyr-gho+7,1,gho-3);
        }
        ctx.fillStyle="rgba(50,64,26,0.55)";
        ctx.fillRect(pxr-12,pyr-1,24,5);
    }
    drawFish(cx,cy);
    for(i=0;i<FROGS.length;i++){ var fr=FROGS[i];
        if(fr.x<cx-20-zmx||fr.x>cx+660+zmx||fr.y<cy-20-zmy||fr.y>cy+380+zmy) continue;
        var fhop=Math.max(0,Math.sin(fr.hop*Math.PI))*3;
        ctx.fillStyle="rgba(0,0,0,0.25)";
        ctx.fillRect(Math.round(fr.x-cx)-3,Math.round(fr.y-cy)+1,7,2);
        drawSpr(frogSpr,fr.x-cx,fr.y-cy-fhop,fr.face);
        if(fhop<0.4&&(G.frame&63)<3){
            ctx.strokeStyle="rgba(150,200,230,0.4)"; ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(fr.x-cx,fr.y-cy,5,0,7); ctx.stroke(); } }
    for(i=0;i<TREES.length;i++){ var t=TREES[i];
        if(t.x<cx-40-zmx||t.x>cx+680+zmx||t.y<cy-40-zmy||t.y>cy+400+zmy) continue;
        var cn=canopies[t.s];
        var under=dist2(p.x,p.y,t.x,t.y-8)<((cn.width/2+6)*(cn.width/2+6));
        ctx.globalAlpha=under?0.55:0.95;
        ctx.drawImage(cn,Math.round(t.x-cx-cn.width/2),Math.round(t.y-cy-8-cn.height/2));
        ctx.globalAlpha=1;
    }
    for(i=G.fx.length-1;i>=0;i--){ var f=G.fx[i]; f.t-=1/60;
        if(f.t<=0){ G.fx.splice(i,1); continue; }
        if(f.k==="p"){ f.x+=f.vx/60; f.y+=f.vy/60; f.vy+=100/60; f.vx*=0.97;
            ctx.save(); ctx.globalAlpha=Math.min(1,f.t*4);
            var psz=f.t>0.2?3:2;
            ctx.fillStyle=f.c; ctx.fillRect(Math.round(f.x-cx),Math.round(f.y-cy),psz,psz);
            ctx.restore(); }
        else if(f.k==="sp"){ f.x+=f.vx/60; f.y+=f.vy/60;
            f.vx*=0.88; f.vy*=0.88;
            var spa=Math.min(1,f.t*5), sx3=Math.round(f.x-cx), sy3=Math.round(f.y-cy);
            ctx.save(); ctx.globalCompositeOperation="lighter";
            ctx.globalAlpha=spa*0.35;
            ctx.fillStyle=f.c; ctx.beginPath(); ctx.arc(sx3,sy3,3.5,0,7); ctx.fill();
            ctx.globalAlpha=spa;
            ctx.fillRect(sx3,sy3,2,2);
            ctx.globalAlpha=spa*0.9; ctx.fillStyle="#ffffff"; ctx.fillRect(sx3,sy3,1,1);
            ctx.restore(); }
        else if(f.k==="fl"){
            ctx.save(); ctx.globalCompositeOperation="lighter";
            ctx.globalAlpha=Math.min(1,f.t*7)*0.85;
            ctx.fillStyle=f.c; ctx.beginPath();
            ctx.arc(f.x-cx,f.y-cy,f.r*(0.4+0.6*(f.t/0.12)),0,7); ctx.fill();
            ctx.restore(); }
        else if(f.k==="ring"){ var pr2=1-f.t/0.5, ra=Math.min(1,f.t*3);
            ctx.save(); ctx.globalAlpha=ra;
            ctx.strokeStyle=f.c; ctx.lineWidth=1+2*ra; ctx.beginPath();
            ctx.arc(f.x-cx,f.y-cy,f.r+(f.mr-f.r)*Math.min(1,pr2*2),0,7); ctx.stroke();
            ctx.restore(); ctx.lineWidth=1; }
        else if(f.k==="line"){ ctx.strokeStyle=f.c; ctx.beginPath();
            ctx.moveTo(f.x1-cx,f.y1-cy); ctx.lineTo(f.x2-cx,f.y2-cy); ctx.stroke(); }
        else if(f.k==="bolt"){
            var bx2=f.x-cx, by2=f.y-cy;
            ctx.save(); ctx.globalCompositeOperation="lighter";
            ctx.strokeStyle="rgba(240,224,80,0.35)"; ctx.lineWidth=7; ctx.beginPath();
            ctx.moveTo(bx2+6,by2-90); ctx.lineTo(bx2-4,by2-50);
            ctx.lineTo(bx2+5,by2-30); ctx.lineTo(bx2,by2); ctx.stroke();
            ctx.restore();
            ctx.strokeStyle=(f.t>0.09)?"#ffffff":"#f0e050"; ctx.lineWidth=2; ctx.beginPath();
            ctx.moveTo(bx2+6,by2-90); ctx.lineTo(bx2-4,by2-50);
            ctx.lineTo(bx2+5,by2-30); ctx.lineTo(bx2,by2);
            ctx.stroke();
            ctx.lineWidth=1; ctx.beginPath();
            ctx.moveTo(bx2-4,by2-50); ctx.lineTo(bx2-13,by2-38); ctx.lineTo(bx2-9,by2-26);
            ctx.moveTo(bx2+5,by2-30); ctx.lineTo(bx2+13,by2-20);
            ctx.stroke();
            ctx.save(); ctx.globalCompositeOperation="lighter";
            ctx.fillStyle="rgba(240,224,80,0.45)"; ctx.beginPath();
            ctx.arc(bx2,by2,13,0,7); ctx.fill();
            ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.beginPath();
            ctx.arc(bx2,by2,5,0,7); ctx.fill();
            ctx.restore(); }
        else if(f.k==="slash"){ var sla=Math.min(1,f.t*6), slp=1-Math.min(1,f.t/0.18);
            var sa0=f.sx>0?-1:Math.PI-1, sa1=sa0+2*Math.max(0.25,slp);
            var spx=G.p.x-cx, spy=G.p.y-cy;
            ctx.save();
            ctx.globalCompositeOperation="lighter"; ctx.globalAlpha=sla*0.3;
            ctx.strokeStyle="#f0e0c0"; ctx.lineWidth=7; ctx.beginPath();
            ctx.arc(spx,spy,f.r*0.78,sa0,sa1); ctx.stroke();
            ctx.restore();
            ctx.save(); ctx.globalAlpha=sla*0.35;
            ctx.strokeStyle="#8a7a58"; ctx.lineWidth=4; ctx.beginPath();
            ctx.arc(spx,spy,f.r*0.68,sa0,sa1); ctx.stroke();
            ctx.globalAlpha=sla;
            ctx.strokeStyle="#fff8e0"; ctx.lineWidth=2; ctx.beginPath();
            ctx.arc(spx,spy,f.r*0.8,sa0,sa1); ctx.stroke();
            ctx.globalAlpha=sla*0.5; ctx.lineWidth=1; ctx.beginPath();
            ctx.arc(spx,spy,f.r*0.6,sa0,sa1); ctx.stroke();
            ctx.restore(); ctx.lineWidth=1; }
        else if(f.k==="notice"){
            var nAge=2.5-f.t, nY=118-(f.slot||0)*17-nAge*10;
            ctx.globalAlpha=Math.min(1,f.t*1.4);
            ctx.fillStyle="rgba(232,216,176,1)";
            ctx.font="bold 16px monospace"; ctx.textAlign="center";
            ctx.fillText(f.msg,320,nY); ctx.textAlign="left";
            ctx.globalAlpha=1; }
    }
    for(i=G.texts.length-1;i>=0;i--){ var tx2=G.texts[i]; tx2.t-=1/60; tx2.y-=0.5;
        if(tx2.t<=0){ G.texts.splice(i,1); continue; }
        ctx.fillStyle=tx2.c?tx2.c:(tx2.crit?"#f0b840":"rgba(240,240,230,"+Math.min(1,tx2.t*2)+")");
        ctx.font=(tx2.crit?"bold 11px":"bold 9px")+" monospace";
        ctx.fillText(tx2.v,Math.round(tx2.x-cx),Math.round(tx2.y-cy)); }
    drawClouds(vdt,cx,cy);
    if(G.boom>0){
        /* le flash de l'explosion : une nappe orangee qui s'eteint vite */
        var bf=Math.min(1,G.boom/0.6);
        ctx.fillStyle="rgba(255,190,120,"+(bf*0.7).toFixed(3)+")";
        ctx.fillRect(0,0,640,360);
        G.boom-=vdt;
    }
    if(lightsOn){
        lightG.globalCompositeOperation="source-over";
        lightG.globalAlpha=1;
        lightG.clearRect(0,0,640,360);
        var twi=twilight();
        lightG.fillStyle=twi>0.02
            ?"rgba("+Math.round(6+58*twi)+","+Math.round(8+26*twi)+","+Math.round(18+4*twi)+","+
              (G?G.darkNow:CFG.DARK)+")"
            :"rgba(6,8,18,"+(G?G.darkNow:CFG.DARK)+")";
        lightG.fillRect(0,0,640,360);
        lightG.globalCompositeOperation="destination-out";
        /* lumieres fixes : plus aucune oscillation */
        var flick=1;
        stampLight(p.x-cx,p.y-cy,CFG.LIGHT_PLAYER*flick*CFG.MODE_LIGHT[G.p.mode],1);
        var lampOn=Math.max(0,Math.min(1,(G.darkNow/CFG.DARK_NIGHT)*1.6));
        if(lampOn>0.03) for(i=0;i<TORCHES.length;i++){ var lt=TORCHES[i];
            if(lt.x-cx<-100||lt.x-cx>740||lt.y-cy<-100||lt.y-cy>460) continue;
            stampLight(lt.x-cx,lt.y-cy-6,CFG.LIGHT_TORCH*lampOn,0.95*lampOn); }
        for(i=0;i<G.fx.length;i++){ var lf=G.fx[i];
            if(lf.k==="ring") stampLight(lf.x-cx,lf.y-cy,lf.mr*1.5,Math.min(1,lf.t*2.5));
            else if(lf.k==="bolt") stampLight(lf.x-cx,lf.y-cy,70,Math.min(1,lf.t*6));
            else if(lf.k==="fl") stampLight(lf.x-cx,lf.y-cy,lf.r*3,Math.min(1,lf.t*7)); }
        lightG.globalAlpha=1;
        ctx.drawImage(lightCv,0,0);
        /* nappe orangee de l'aube et du crepuscule */
        if(twi>0.02){
            ctx.fillStyle="rgba(214,104,38,"+(0.2*twi).toFixed(3)+")";
            ctx.fillRect(0,0,640,360);
        }
        /* 2e passe : teinte chaude des foyers, froide des portails */
        var amb=G?G.darkNow:CFG.DARK;
        if(amb>0.05){
            ctx.save(); ctx.globalCompositeOperation="lighter";
            ctx.globalAlpha=Math.min(0.5,amb*0.55);
            for(i=0;i<TORCHES.length;i++){ var wt=TORCHES[i];
                if(wt.x-cx<-100||wt.x-cx>740||wt.y-cy<-100||wt.y-cy>460) continue;
                var wr=CFG.LIGHT_TORCH;
                var wg=ctx.createRadialGradient(wt.x-cx,wt.y-cy-6,0,wt.x-cx,wt.y-cy-6,wr);
                wg.addColorStop(0,"rgba(248,150,50,0.55)");
                wg.addColorStop(0.5,"rgba(200,100,30,0.18)");
                wg.addColorStop(1,"rgba(160,70,20,0)");
                ctx.fillStyle=wg; ctx.beginPath();
                ctx.arc(wt.x-cx,wt.y-cy-6,wr,0,7); ctx.fill(); }
            var pr3=CFG.LIGHT_PLAYER*flick*CFG.MODE_LIGHT[G.p.mode];
            var pg=ctx.createRadialGradient(p.x-cx,p.y-cy,0,p.x-cx,p.y-cy,pr3);
            pg.addColorStop(0,"rgba(240,180,90,0.28)");
            pg.addColorStop(1,"rgba(200,120,40,0)");
            ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(p.x-cx,p.y-cy,pr3,0,7); ctx.fill();
            ctx.restore();
        }
    }
    /* Un batiment derriere lequel on passe devient translucide : on repasse
       sa portion du calque de monde par-dessus, a demi transparente. */
    for(i=0;i<BLDRECTS.length;i++){
        var br=BLDRECTS[i];
        if(p.x<br.x-8||p.x>br.x+br.w+8) continue;
        if(p.y<br.y-10||p.y>br.y+br.h+4) continue;
        if(br.x-cx>660+zmx||br.x+br.w-cx<-20-zmx) continue;
        ctx.globalAlpha=0.42;
        ctx.drawImage(worldCv,br.x,br.y-36,br.w,br.h+38,
                              br.x-cx,br.y-cy-36,br.w,br.h+38);
        ctx.globalAlpha=1;
    }
    drawGnd(cx,cy);
    drawSwing(cx,cy);
    drawThrow(cx,cy);
    drawZombies(cx,cy);
    zDbgDraw(cx,cy);
    drawHeld(cx,cy);
    drawImp(cx,cy);
    drawBullets(cx,cy);
    drawFlash(cx,cy);
    drawChats(cx,cy);
    drawAim(cx,cy);
    if(Z!==1) ctx.setTransform(2,0,0,2,0,0);
    ctx.drawImage(vigCv,0,0);
    if(G.pick){
        var pl=Math.max(0,G.pick.dur-G.pick.t), pp=G.pick.t/G.pick.dur;
        ctx.fillStyle="rgba(12,10,6,0.78)"; ctx.fillRect(200,96,240,38);
        ctx.strokeStyle="#8a6a3e"; ctx.lineWidth=2; ctx.strokeRect(200,96,240,38);
        ctx.textAlign="center";
        ctx.fillStyle="#f0d890"; ctx.font="bold 12px monospace";
        ctx.fillText("CROCHETAGE  "+pl.toFixed(1)+" s",320,114);
        ctx.textAlign="left";
        ctx.fillStyle="#2a2016"; ctx.fillRect(210,122,220,4);
        ctx.fillStyle="#c8a860"; ctx.fillRect(210,122,Math.round(220*pp),4);
        ctx.lineWidth=1;
    }
    if(G.fill&&!G.pick){
        var fl=Math.max(0,FILL_S-G.fill.t), fp=G.fill.t/FILL_S;
        var ftx=(G.fill.k==="eau")?"REMPLISSAGE":"COCKTAIL";
        ctx.fillStyle="rgba(12,10,6,0.78)"; ctx.fillRect(220,96,200,32);
        ctx.strokeStyle="#8a6a3e"; ctx.lineWidth=2; ctx.strokeRect(220,96,200,32);
        ctx.textAlign="center";
        ctx.fillStyle="#f0d890"; ctx.font="bold 11px monospace";
        ctx.fillText(ftx+"  "+fl.toFixed(1)+" s",320,112);
        ctx.textAlign="left";
        ctx.fillStyle="#2a2016"; ctx.fillRect(230,118,180,4);
        ctx.fillStyle=(G.fill.k==="eau")?"#78d8f0":"#e8a040";
        ctx.fillRect(230,118,Math.round(180*fp),4);
        ctx.lineWidth=1;
    }
    if(G.exitT>0){
        var el=Math.max(0,CFG.EXIT_T-G.exitT), ep=1-el/CFG.EXIT_T;
        ctx.fillStyle="rgba(12,10,6,0.78)"; ctx.fillRect(180,88,280,42);
        ctx.strokeStyle="#8a6a3e"; ctx.lineWidth=2; ctx.strokeRect(180,88,280,42);
        ctx.textAlign="center";
        ctx.fillStyle="#f0d890"; ctx.font="bold 13px monospace";
        ctx.fillText("CHANGEMENT DE CARTE",320,106);
        ctx.fillStyle="#e8d8b0"; ctx.font="bold 16px monospace";
        ctx.fillText(el.toFixed(1)+" s",320,124);
        ctx.textAlign="left";
        ctx.fillStyle="#2a2016"; ctx.fillRect(190,128,260,3);
        ctx.fillStyle="#c8a860"; ctx.fillRect(190,128,Math.round(260*ep),3);
        ctx.lineWidth=1;
    }
    
    if(p.flash>0){ ctx.fillStyle="rgba(216,72,72,"+p.flash*0.8+")"; ctx.fillRect(0,0,640,360); }
    if(inSwamp(p.x,p.y,p.under)){ ctx.fillStyle="rgba(38,67,58,0.18)"; ctx.fillRect(0,0,640,360); }
    if(G.turbo){ ctx.fillStyle="#f0b840"; ctx.font="bold 10px monospace"; ctx.fillText("TURBO x3",560,352); }
    if(Z!==1){ ctx.fillStyle="#78d8f0"; ctx.font="bold 10px monospace"; ctx.fillText("ZOOM x"+Z,6,352); }
    /* la ligne d'objectif du jour, en haut a gauche */
    if(G.quest&&!G.quest.done){
        var _qs=G.quest.steps[G.quest.i];
        if(_qs){
            ctx.font="bold 11px 'Courier New',monospace";
            var _qt="Objectif : "+_qs.label;
            var _qw=ctx.measureText(_qt).width;
            ctx.fillStyle="rgba(20,17,11,0.82)"; ctx.fillRect(6,6,_qw+18,20);
            ctx.fillStyle="#c8a860"; ctx.fillRect(6,6,3,20);
            ctx.fillStyle="#f0e0c0"; ctx.textAlign="left"; ctx.fillText(_qt,14,20);
        }
    }
    if(state==="pause"){ ctx.fillStyle="rgba(8,6,4,0.55)"; ctx.fillRect(0,0,640,360);
        ctx.fillStyle="#e8d8b0"; ctx.font="bold 22px monospace"; ctx.textAlign="center";
        ctx.fillText("PAUSE",320,180); ctx.textAlign="left"; }
}

