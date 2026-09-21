"use strict";
/* ================================================================
   TUAZ - 02-sprites.js
   Les corps : fabrique de silhouettes, les cinq vues, la couleur de
   clan, les habits cuits dans le corps, et toutes les vignettes.
   (lignes 1906 a 3263 du mono-fichier d'origine)
   ================================================================ */
/* ================= SPRITES ================= */
function mkspr(rows,map,scale){
    scale=scale||1;
    var h=rows.length, w=rows[0].length;
    var c=document.createElement("canvas"); c.width=w*scale; c.height=h*scale;
    var g=c.getContext("2d");
    for(var y=0;y<h;y++) for(var x=0;x<w;x++){
        var ch=rows[y][x];
        if(ch!=="."&&ch!==" "){ g.fillStyle=map[ch]; g.fillRect(x*scale,y*scale,scale,scale); }
    }
    return c;
}
/* contour sombre automatique + ombrage du bas */
function finish(c){
    var w=c.width, h=c.height;
    var o=document.createElement("canvas"); o.width=w+2; o.height=h+2;
    var g=o.getContext("2d");
    var src=c.getContext("2d").getImageData(0,0,w,h).data;
    function op(x,y){ if(x<0||y<0||x>=w||y>=h) return false; return src[(y*w+x)*4+3]>0; }
    g.fillStyle="#101216";
    for(var y=-1;y<=h;y++) for(var x=-1;x<=w;x++){
        if(!op(x,y)&&(op(x-1,y)||op(x+1,y)||op(x,y-1)||op(x,y+1))) g.fillRect(x+1,y+1,1,1);
    }
    g.drawImage(c,1,1);
    var id=g.getImageData(0,0,w+2,h+2), d=id.data, W2=w+2;
    function dk(i){ return d[i+3]>0&&d[i]<=16&&d[i+1]<=18&&d[i+2]<=22; }
    var ysh=Math.floor((h+2)*0.6);
    for(y=0;y<h+2;y++) for(x=0;x<W2;x++){
        var i=(y*W2+x)*4;
        if(d[i+3]===0||dk(i)) continue;
        if(y>=ysh){ d[i]*=0.84; d[i+1]*=0.84; d[i+2]*=0.84; }
        var up=i-W2*4;
        if(y===0||d[up+3]===0||dk(up)){
            d[i]=Math.min(255,d[i]*1.35+14);
            d[i+1]=Math.min(255,d[i+1]*1.35+14);
            d[i+2]=Math.min(255,d[i+2]*1.35+14);
        }
    }
    g.putImageData(id,0,0);
    return o;
}
var K="#14161c", W="#f2f2e8";

var HMAP={H:"#3a2210",h:"#5a3a1e",F:"#f2c79a",f:"#d9a071",K:K,
    t:"#6aa6f0",T:"#3f7fd4",D:"#2b5aa0",G:"#f0b840",
    g:"#5a3a22",p:"#3a4258",b:"#8a5c34",B:"#4a3220",
    s:"#c8ccd4",S:"#8a90a0",w:"#eef2f8",u:"#3f7fd4",v:"#3a4258"};
var HDTOP=[
"........HHHHHHHH........",
".......HHHHHHHHHH.......",
"......HHHHHHHHHHHH......",
"......HHhhhhhhhhHH....s.",
"......Hhhhhhhhhhhh....s.",
"......FFFFFFFFFFFF....s.",
"......FFKKFFFFKKFF....s.",
"......FFKKFFFFKKFF....s.",
"......FffFFFFFFffF....s.",
"......FfFFFFFFFFfF....s.",
".......FFffffffFF.....s.",
"........FFFFFFFF......s.",
"....SSsttTTTTTTttsS...s.",
"....SSstTTTTTTTTtsS...s.",
".....ttstTTTTTTtst....s.",
".....ttstTTGGTTtstt...s.",
".....ttstTTGGTTtstt...s.",
".....ggstTTTTTTtstg...w.",
".....gg.tTTTTTTt..ggGGGG",
"......F.tGGGGGGt...FFsB.",
"........tTTTTTTt...FFsB.",
"........tTTTTTTt......G.",
"......DDTTTTTTTTDD......"
];
/* Les deux poses de marche ont exactement la meme silhouette : seules les
   chaussures avancent tour a tour. Les jambes ne s'ouvrent plus et ne se
   referment plus, ce qui donnait au personnage l'air de sautiller. */
/* Le heros n'est plus fabrique ici : sa silhouette est celle de tout le
   monde, l'epee en plus, et elle a besoin des cinq vues et des jambes qui ne
   sont declarees que plus bas. On garde les deux noms, ils sont attendus
   partout ; ils sont remplis juste apres le registre des habitants. */
var heroA, heroB;

/* ---- CORPS DES PNJ ----
   Tous les PNJ reprennent la silhouette de l'ancien sprite du joueur, l'epee
   en moins, et ses deux poses de jambes. Seules les couleurs les separent.
   Le sprite A porte .alt vers le sprite B : l'alternance suffit a la marche. */
var NPCTOP_M=[
"........HHHHHHHH........",
".......HHHHHHHHHH.......",
"......HHHHHHHHHHHH......",
"......HHhhhhhhhhHH......",
"......Hhhhhhhhhhhh......",
"......FFFFFFFFFFFF......",
"......FFKKFFFFKKFF......",
"......FFKKFFFFKKFF......",
"......FffFFFFFFffF......",
"......FfFFFFFFFFfF......",
".......FFffffffFF.......",
"........FFFFFFFF........",
"....SSsttTTTTTTttsS.....",
"....SSstTTTTTTTTtsS.....",
".....ttstTTTTTTtst......",
".....ttstTTGGTTtstt.....",
".....ttstTTGGTTtstt.....",
".....ggstTTTTTTtsgg.....",
".....gg.tTTTTTTt.gg.....",
"......F.tGGGGGGt.F......",
"........tTTTTTTt........",
"........tTTTTTTt........",
"......DDTTTTTTTTDD......"
];
/* silhouette feminine : cheveux longs qui encadrent le visage, et jupe */
var NPCTOP_F=[
"........HHHHHHHH........",
".......HHHHHHHHHH.......",
"......HHHHHHHHHHHH......",
"......HHhhhhhhhhHH......",
"....HHHhhhhhhhhhhhHH....",
"....HHFFFFFFFFFFFFHH....",
"....HHFFKKFFFFKKFFHH....",
"....HHFFKKFFFFKKFFHH....",
"....HHFffFFFFFFffFHH....",
"....HHFfFFFFFFFFfFHH....",
"....hh.FFffffffFF.hh....",
"....hh..FFFFFFFF..hh....",
"....SSsttTTTTTTttsS.....",
"....SSstTTTTTTTTtsS.....",
".....ttstTTTTTTtst......",
".....ttstTTGGTTtstt.....",
".....ttstTTGGTTtstt.....",
".....ggstTTTTTTtsgg.....",
".....gg.tTTTTTTt.gg.....",
"......F.tGGGGGGt.F......",
"........tTTTTTTt........",
"........tTTTTTTt........",
"......DDTTTTTTTTDD......"
];
/* les deux poses : meme silhouette, seules les chaussures avancent */
var NPCLEG_A=[
"......vvvvvvvvvv........",
".......ppp...ppp........",
".......ppp...ppp........",
".......ppp...ppp........",
"......bbb....bbb........",
"......bb.....bbb........",
".....BBB.....BB........."
];
var NPCLEG_B=[
"......vvvvvvvvvv........",
".......ppp...ppp........",
".......ppp...ppp........",
".......ppp...ppp........",
"......bbb....bbb........",
"......bbb....bb.........",
"......BB.....BBB........"
];
var NPCLEG_FA=[
"......DDDDDDDDDDDD......",
".....DDDDDDDDDDDDDD.....",
".......ppp...ppp........",
".......ppp...ppp........",
"......bbb....bbb........",
"......bb.....bbb........",
".....BBB.....BB........."
];
var NPCLEG_FB=[
"......DDDDDDDDDDDD......",
".....DDDDDDDDDDDDDD.....",
".......ppp...ppp........",
".......ppp...ppp........",
"......bbb....bbb........",
"......bbb....bb.........",
"......BB.....BBB........"
];
/* ================= LES CINQ VUES =================
   On ne voyait les gens que de face, retournes a gauche ou a droite : ils
   marchaient vers le haut de l'ecran en vous regardant dans les yeux. Il y a
   maintenant CINQ SILHOUETTES par corps - de face, de trois quarts face, de
   profil, de trois quarts dos, de dos - et le miroir en donne huit, une par
   direction. La vue se choisit au dessin d'apres le deplacement reel des
   dernieres images, pas d'apres une consigne posee quelque part : personne
   n'a eu a apprendre a annoncer sa direction.
   ELLES SONT TOUTES BATIES SUR LA MEME GRILLE, vingt-quatre colonnes et le
   cou toujours a la rangee 11 : c'est ce qui permet aux marques de clan de
   se poser toutes seules, sans table de coordonnees par vue.
   Les vues tournees regardent A DROITE ; drawSpr les retourne pour la gauche. */
var NPCTOP_DOS=[
"........HHHHHHHH........",
".......HHHHHHHHHH.......",
"......HHHHHHHHHHHH......",
"......HHHHHHHHHHHH......",
"......HHhhhhhhhhHH......",
"......HHhhhhhhhhHH......",
"......HHhhhhhhhhHH......",
"......HHhhhhhhhhHH......",
"......HHhhhhhhhhHH......",
"......HHhhhhhhhhHH......",
".......HhhhhhhhhH.......",
"........FFFFFFFF........",
"....SSsttTTTTTTttsS.....",
"....SSstTTTTTTTTtsS.....",
".....ttstTTTTTTtst......",
".....ttstTTTTTTtstt.....",
".....ttstTTTTTTtstt.....",
".....ggstTTTTTTtsgg.....",
".....gg.tTTTTTTt.gg.....",
"......F.tGGGGGGt.F......",
"........tTTTTTTt........",
"........tTTTTTTt........",
"......DDTTTTTTTTDD......"
];
var NPCTOP_COTE=[
"........HHHHHHH.........",
".......HHHHHHHHH........",
"......HHHHHHHHHHH.......",
"......HHhhhhhhhFFF......",
"......Hhhhhhhhhffff.....",
"......HhhhhhFFFFFFf.....",
"......HhhhhFFKKFFFFf....",
"......HhhhhFFKKFFFFf....",
"......HhhhhhFFFFFFf.....",
"......HhhhhhFffffF......",
".......HhhhhhFFFF.......",
"........FFFFFFF.........",
"......SSSttTTTTts.......",
"......SSSttTTTTts.......",
".......sttTTTTTts.......",
".......sttTTGGTts.......",
".......sttTTGGTts.......",
".......gttTTTTTts.......",
".......gg.TTTTTts.......",
".......FF.GGGGGGs.......",
"........tTTTTTTs........",
"........tTTTTTTs........",
"........DTTTTTTD........"
];
var NPCTOP_DIAGB=[
".........HHHHHHHH.......",
"........HHHHHHHHHH......",
".......HHHHHHHHHHHH.....",
".......HHhhhhhhhhhH.....",
".......Hhhhhhhhhhhhh....",
".......HhhFFFFFFFFF.....",
".......HhhFFKKFFKKFF....",
".......HhhFFKKFFKKFF....",
".......HhhFffFFFFffF....",
".......HhhFfFFFFFFf.....",
"........HhFFffffff......",
".........FFFFFFFF.......",
".....SSsttTTTTTTtts.....",
".....SSstTTTTTTTTts.....",
"......ttstTTTTTTtst.....",
"......ttstTTGGTTtst.....",
"......ttstTTGGTTtst.....",
"......ggstTTTTTTtsg.....",
"......gg.tTTTTTTt.g.....",
".......F.tGGGGGGt.F.....",
".........tTTTTTTt.......",
".........tTTTTTTt.......",
".......DDTTTTTTTDD......"
];
var NPCTOP_DIAGH=[
".......HHHHHHHH.........",
"......HHHHHHHHHH........",
".....HHHHHHHHHHHH.......",
".....HHhhhhhhhhHHH......",
".....HHhhhhhhhhhhFF.....",
".....HHhhhhhhhhhhFFf....",
".....HHhhhhhhhhhhFff....",
".....HHhhhhhhhhhhFff....",
".....HHhhhhhhhhhhFf.....",
".....HHhhhhhhhhhhf......",
"......HhhhhhhhhhF.......",
".......FFFFFFFF.........",
".....SSsttTTTTTTtts.....",
".....SSstTTTTTTTTts.....",
"......ttstTTTTTTtst.....",
"......ttstTTTTTTtst.....",
"......ttstTTTTTTtst.....",
"......ggstTTTTTTtsg.....",
"......gg.tTTTTTTt.g.....",
".......F.tGGGGGGt.F.....",
".........tTTTTTTt.......",
".........tTTTTTTt.......",
".......DDTTTTTTTDD......"
];
/* De profil les deux jambes se recouvrent : l'une devant, l'autre derriere,
   et ce sont elles qui portent toute l'alternance de la marche. */
var NPCLEG_CA=[
"........vvvvvv..........",
"........pppppp..........",
"........pppppp..........",
"........pppppp..........",
".......bbbbb............",
".......bbbbbb...........",
"......BBBBB............."
];
var NPCLEG_CB=[
"........vvvvvv..........",
"........pppppp..........",
"........pppppp..........",
"........pppppp..........",
"..........bbbbb.........",
".........bbbbbb.........",
"..........BBBBB........."
];
var NPCLEG_FCA=[
".......DDDDDDDD.........",
"......DDDDDDDDDD........",
"........pppppp..........",
"........pppppp..........",
".......bbbbb............",
".......bbbbbb...........",
"......BBBBB............."
];
var NPCLEG_FCB=[
".......DDDDDDDD.........",
"......DDDDDDDDDD........",
"........pppppp..........",
"........pppppp..........",
"..........bbbbb.........",
".........bbbbbb.........",
"..........BBBBB........."
];
/* La chevelure longue qui distingue les femmes tombe de la meme facon sur
   toutes les vues : deux colonnes de cheveux collees de part et d'autre du
   crane, la ou il n'y a rien. On la pose donc par transformation plutot que
   de redessiner quatre silhouettes qui ne differeraient que par la. */
function femTop(rws){
    var R=rws.slice(), y, x, L, a, b;
    for(y=3;y<=11;y++){
        L=R[y].split("");
        a=-1; b=-1;
        for(x=0;x<L.length;x++) if(L[x]!=="."){ if(a<0) a=x; b=x; }
        if(a<2||b>21) continue;
        L[a-1]=(y<10)?"H":"h"; L[a-2]=(y<10)?"H":"h";
        L[b+1]=(y<10)?"H":"h"; L[b+2]=(y<10)?"H":"h";
        R[y]=L.join("");
    }
    return R;
}
/* Le soutien-gorge des silhouettes feminines : une bande a la poitrine,
   posee par transformation comme les cheveux longs. Elle emprunte la cle 'u'
   qui, sur un corps habille, vaut la couleur du haut (donc invisible) et ne
   se decouvre qu'a torse nu. */
function braTop(rws){
    var R=rws.slice(), x, L=R[16]?R[16].split(""):null;
    if(L){ for(x=0;x<L.length;x++) if(L[x]==="T") L[x]="u"; R[16]=L.join(""); }
    return R;
}
/* L'epee du heros pend a droite quelle que soit la vue : c'est une colonne
   posee par-dessus, reprise telle quelle de la silhouette de face. */
function heroTop(rws){
    var R=rws.slice(), y;
    for(y=0;y<R.length&&y<HDTOP.length;y++){
        if(HDTOP[y].length<24) continue;
        R[y]=R[y].substr(0,20)+HDTOP[y].substr(20,4);
    }
    return R;
}
function npcPal(hair,skin,coat,pant,shoe,belt){
    return {H:hair, h:shade(hair,0.72), F:skin, f:shade(skin,0.85), K:K,
        T:coat, t:shade(coat,1.35), S:shade(coat,0.6), s:shade(coat,0.85),
        D:shade(coat,0.62), G:belt||"#6a4a24", g:shade(coat,0.5),
        p:pant, b:shoe, B:shade(shoe,0.65), u:coat, v:pant};
}
/* ================= LA COULEUR DU CLAN =================
   On ne reconnait pas les siens dans une rue. Ils portent donc un brassard
   au haut des deux bras et un foulard au cou - deux marques, parce qu'une
   seule se perd : le brassard fait deux carres de deux pixels, invisible des
   qu'il y a du monde, et le foulard seul disparait de dos comme de profil.
   Ensemble ils tiennent, et le cou est justement la zone qu'on regarde en
   premier sur une silhouette.

   LES MARQUES SONT CUITES DANS LE SPRITE, PAS PEINTES PAR-DESSUS. Un
   habillage au moment du rendu aurait fallu suivre le retournement de face,
   la seconde pose de jambes, le decoupage dans l'eau et la rotation des
   morts : quatre pieges pour un resultat moins net. On fabrique donc un
   jumeau marque de chaque silhouette, une fois, et l'on dessine l'un ou
   l'autre. Changer de couleur refait les jumeaux - une trentaine de petits
   canevas, le temps d'un battement de cil.

   POSITIONS. LES MARQUES SE TROUVENT ELLES-MEMES, ELLES NE SONT PLUS
   ECRITES EN DUR. Le foulard prend la rangee du cou - la 11, la meme sur les
   cinq vues. Les brassards prennent les deux pixels de chaque bord du corps
   aux rangees 14 et 15. Sur la silhouette de face cela retombe exactement sur
   les colonnes d'avant, 5-6 et 17-18 ; sur les vues tournees, les marques
   suivent le corps sans qu'on ait a tenir une table par vue. */
var CLANCOL=[
 {n:"Rouge",   c:"#e04828"},
 {n:"Or",      c:"#f0c030"},
 {n:"Azur",    c:"#3c9ce0"},
 {n:"Vert",    c:"#5cc040"},
 {n:"Violet",  c:"#a860d8"},
 {n:"Blanc",   c:"#e8e4d8"},
 {n:"Orange",  c:"#f08828"},
 {n:"Turquoise",c:"#30c8b0"}
];
/* Le registre des silhouettes, pour pouvoir toutes les remarquer d'un coup
   quand la couleur change. */
var BODYREG=[];
function clanPut(R,y,x,ch){ R[y]=R[y].substr(0,x)+ch+R[y].substr(x+1); }
function clanEdge(R,y,ch){
    var a=-1, b=-1, x, L=R[y];
    for(x=0;x<L.length;x++) if(L.charAt(x)!=="."){ if(a<0) a=x; b=x; }
    if(a<0||b-a<5) return;
    clanPut(R,y,a,ch); clanPut(R,y,a+1,ch);
    clanPut(R,y,b,ch); clanPut(R,y,b-1,ch);
}
function clanRows(top,legs){
    var R=top.concat(legs).slice(), x;
    /* brassard, haut des deux bras */
    clanEdge(R,14,"C");
    clanEdge(R,15,"c");
    /* foulard, au cou : toute la rangee de peau qui separe la tete du torse */
    for(x=0;x<R[11].length;x++) if(R[11].charAt(x)==="F") clanPut(R,11,x,"C");
    for(x=0;x<R[12].length;x++) if(R[12].charAt(x)==="T"&&x>=11&&x<=12) clanPut(R,12,x,"c");
    return R;
}
/* Les cinq vues d'un corps, chacune avec ses deux poses de jambes. L'ordre
   est celui de dirView : 0 face, 1 trois quarts face, 2 profil, 3 trois
   quarts dos, 4 dos. */
function bodyViews(fem){
    var m=fem?function(r){ return braTop(femTop(r)); }:function(r){ return r; };
    var lg=NPCLEG_A, lgb=NPCLEG_B, lc=NPCLEG_CA, lcb=NPCLEG_CB;
    return [
        {t:m(fem?NPCTOP_F:NPCTOP_M), a:lg,  b:lgb},
        {t:m(NPCTOP_DIAGB),          a:lg,  b:lgb},
        {t:m(NPCTOP_COTE),           a:lc,  b:lcb},
        {t:m(NPCTOP_DIAGH),          a:lg,  b:lgb},
        {t:m(NPCTOP_DOS),            a:lg,  b:lgb}
    ];
}
function npcBody(pal,fem,hero){
    var V=bodyViews(fem), i, v, a, b, out=null, vs=[];
    for(i=0;i<V.length;i++){
        v=V[i];
        if(hero) v={t:heroTop(v.t), a:v.a, b:v.b};
        a=finish(mkspr(v.t.concat(v.a),pal));
        b=finish(mkspr(v.t.concat(v.b),pal));
        a.hd=2; b.hd=2; a.fem=!!fem; b.fem=!!fem; a.alt=b;
        vs.push(a);
        if(!out) out=a;
    }
    /* chaque vue porte la liste complete : d'ou qu'on parte, on retrouve la
       bonne silhouette sans remonter a un original */
    for(i=0;i<vs.length;i++) vs[i].v=vs;
    var reg={vs:vs, pal:pal, views:V, hero:!!hero, rid:BODYREG.length};
    for(i=0;i<vs.length;i++) vs[i].reg=reg;
    BODYREG.push(reg);
    return out;
}
/* La silhouette qui convient a la direction suivie. Sans direction connue -
   quelqu'un a l'arret, un portrait, un panneau - c'est la face, comme avant.
   ELLE NE S'APPELLE PAS bodySpr : ce nom est deja pris plus bas, par la
   fonction qui dit QUEL corps porte un habitant. Celle-ci dit SOUS QUEL
   ANGLE on le voit ; les confondre coutait tous les corps du jeu. */
function sprDir(spr,o){
    var i=(o&&o.vw)|0;
    if(!spr||!spr.v||i<=0||i>=spr.v.length) return spr;
    return spr.v[i];
}
/* Refabriquer tous les jumeaux marques dans la couleur demandee. */
function clanBuild(ci){
    var col=CLANCOL[((ci|0)%CLANCOL.length+CLANCOL.length)%CLANCOL.length];
    var i, j, r, p, k, v, ca, cb, cs;
    for(i=0;i<BODYREG.length;i++){
        r=BODYREG[i];
        p={}; for(k in r.pal) p[k]=r.pal[k];
        p.C=col.c; p.c=shade(col.c,0.66);
        cs=[];
        for(j=0;j<r.views.length;j++){
            v=r.views[j];
            ca=finish(mkspr(clanRows(r.hero?heroTop(v.t):v.t,v.a),p));
            cb=finish(mkspr(clanRows(r.hero?heroTop(v.t):v.t,v.b),p));
            /* asHero ajuste hd apres coup pour caler toutes les silhouettes sur
               la meme hauteur : le jumeau doit heriter du sien, sans quoi un
               compagnon serait dessine a une autre echelle que les autres */
            ca.hd=r.vs[j].hd; cb.hd=r.vs[j].hd;
            ca.fem=r.vs[j].fem; cb.fem=r.vs[j].fem; ca.alt=cb;
            cs.push(ca);
        }
        for(j=0;j<cs.length;j++){ cs[j].v=cs; r.vs[j].clan=cs[j]; }
    }
}
/* La silhouette a dessiner : marquee pour les siens, nue pour les autres. */
function clanSpr(n,spr){
    return (n&&n.recruited&&spr&&spr.clan)?spr.clan:spr;
}

/* ================= LES HABITS SUR LE CORPS =================
   Un vetement porte se voit : il recolore la region de palette de son
   emplacement - la tete, le torse, les jambes ou les pieds. Comme le clan,
   la tenue est CUITE dans un jumeau de silhouette, jamais peinte au rendu :
   on evite ainsi les quatre pieges du retournement, de la seconde pose de
   jambes, du decoupage dans l'eau et de la rotation des morts.
   On refabrique un corps complet a partir des rangees d'origine (portees par
   le registre du sprite) et d'une palette surchargee, avec son propre jumeau
   de clan. Le tout est garde en cache sur le personnage, et ne se refait que
   si la tenue ou la couleur du clan change - jamais a chaque image. Seuls le
   joueur et ses recrues sont habilles, pour borner le cout. */
var UNDIE="#e2ddd2";
function vetPaint(pal,sl,col){
    if(sl===0){ pal.H=col; pal.h=shade(col,0.72); }
    else if(sl===1){ pal.T=col; pal.t=shade(col,1.35); pal.S=shade(col,0.6);
                     pal.s=shade(col,0.85); pal.D=shade(col,0.62); pal.g=shade(col,0.5);
                     pal.u=col; }
    else if(sl===2){ pal.p=col; pal.v=col; }
    else if(sl===3){ pal.b=col; pal.B=shade(col,0.65); }
}
/* Case vide : la region revient a la peau, avec le sous-vetement qui reste -
   slip pour le bas, soutien-gorge pour la poitrine des silhouettes qui en
   portent la marque. La tete nue montre les cheveux : on ne la touche pas. */
function vetNude(pal,sl){
    var sk=pal.F, sh=pal.f;
    if(sl===1){ pal.T=sk; pal.t=sk; pal.S=sh; pal.s=sh; pal.D=sh; pal.g=sh; pal.G=sk; pal.u=UNDIE; }
    else if(sl===2){ pal.p=sk; pal.v=UNDIE; }
    else if(sl===3){ pal.b=sk; pal.B=sh; }
}
function dressViews(reg,pal,marked){
    var col=CLANCOL[((G&&G.clan||0)%CLANCOL.length+CLANCOL.length)%CLANCOL.length];
    var p=pal;
    if(marked){ p={}; for(var kk in pal) p[kk]=pal[kk]; p.C=col.c; p.c=shade(col.c,0.66); }
    var vs=[], j, v, top, a, b;
    for(j=0;j<reg.views.length;j++){
        v=reg.views[j];
        top=reg.hero?heroTop(v.t):v.t;
        a=finish(mkspr(marked?clanRows(top,v.a):top.concat(v.a),p));
        b=finish(mkspr(marked?clanRows(top,v.b):top.concat(v.b),p));
        a.hd=reg.vs[j].hd; b.hd=reg.vs[j].hd;
        a.fem=reg.vs[j].fem; b.fem=reg.vs[j].fem; a.alt=b;
        vs.push(a);
    }
    for(j=0;j<vs.length;j++) vs[j].v=vs;
    return vs;
}
var DRESSCACHE={};
function dressSpr(o,base){
    if(!base) return base;
    var isP=(o===(G&&G.p));
    var reg=base.reg;
    if(!reg||!reg.pal) return base;
    var v=o.vet||[-1,-1,-1,-1];
    var worn=(v[0]>=0||v[1]>=0||v[2]>=0||v[3]>=0);
    /* un corps "habillable" (le joueur, ou quelqu'un ne pour porter des
       habits-objets) montre sa vraie tenue : une case vide devient peau +
       sous-vetement. Un corps qui n'a jamais eu d'objet et n'en porte aucun
       garde sa silhouette de base - on ne deshabille pas un role par surprise. */
    var clad=(isP||o.clad)?1:0;
    if(!clad&&!worn) return base;
    var sig=reg.rid+"|"+v[0]+","+v[1]+","+v[2]+","+v[3]+"|"+(clad?"N":"B")+"|"+(G&&G.clan||0);
    var hit=DRESSCACHE[sig]; if(hit) return hit;
    var k, pal={}; for(k in reg.pal) pal[k]=reg.pal[k];
    var i, d;
    for(i=0;i<4;i++){
        d=vetAt(o,i);
        if(d&&d.col) vetPaint(pal,i,d.col);
        else if(clad) vetNude(pal,i);
    }
    var plain=dressViews(reg,pal,false), clan=dressViews(reg,pal,true), j;
    for(j=0;j<plain.length;j++) plain[j].clan=clan[j];
    DRESSCACHE[sig]=plain[0];
    return plain[0];
}
/* La garde-robe civile, rangee par emplacement, calculee une fois. */
var _CIVBY=null;
function civIds(){
    if(_CIVBY) return _CIVBY;
    _CIVBY={1:[],2:[],3:[]};
    for(var i=0;i<ITEMS.length;i++){
        var o=ITEMS[i];
        if(o&&o.k==="vet"&&o.civ&&_CIVBY[o.sl]) _CIVBY[o.sl].push(o.id);
    }
    return _CIVBY;
}
/* La tenue d'un habitant, tiree de son indice de silhouette : DETERMINISTE,
   sans le moindre appel a rng - deux parties de meme graine habillent donc
   tout le monde a l'identique, et le flux du hasard n'est pas touche. */
function vilOutfit(s){
    var c=civIds(), q=((s|0)%1000+1000)%1000;
    function pick(a){ return a.length?a[q%a.length]:-1; }
    return [-1, pick(c[1]), pick(c[2]), pick(c[3])];
}

/* fermier : chapeau de paille, blouse verte */
var farmerSpr=npcBody(npcPal("#c0a038","#e8b088","#5a7a3a","#4a3a24","#4a3a24","#8a6a44"),false);
/* soldat : casque clair, tunique bleue */
var soldierSpr=npcBody(npcPal("#b0b4bc","#e8b088","#3a4a6a","#2a3346","#2a3346","#d0d4dc"),false);
/* LA TENUE MILITAIRE, UNE SEULE POUR TOUS. Les militaires et soldats prenaient
   au hasard l'une des cinq livrees de SOLKITS - bleu, rouge, orange, vert... -
   et l'armee ressemblait a un carnaval. Ils portent desormais tous le meme
   treillis olive. Le kit garde son role de combat ; seule l'apparence
   s'uniformise. */
var armySpr=npcBody(npcPal("#8a9a6a","#e8b088","#4a5a30","#2e3a1e","#2e3a1e","#c8d0b0"),false);
/* 5 recrues : livree propre a chacune */
var SOLKITS=[
    {n:"Arbaletrier", N:"#3a4a6a",r:"#2a3346",M:"#b0b4bc",c:"#d8e0f0",cd:1.5,spd:420,d:26,sz:4,shots:1,spread:0,pierce:1},
    {n:"Frondeur",    N:"#6a5a2a",r:"#4a3c18",M:"#c0b48a",c:"#f0d890",cd:0.55,spd:300,d:9,sz:3,shots:3,spread:0.34,pierce:0},
    {n:"Lancier",     N:"#7a2a2a",r:"#521a1a",M:"#c8a0a0",c:"#f08850",cd:0.95,spd:340,d:16,sz:4,shots:1,spread:0,pierce:3},
    {n:"Pyromane",    N:"#7a4a10",r:"#502e08",M:"#d8a860",c:"#f8b040",cd:1.7,spd:210,d:14,sz:5,shots:1,spread:0,pierce:0,boom:34},
    {n:"Archer",      N:"#2a5a3a",r:"#183c24",M:"#a0c8b0",c:"#c8f0a0",cd:0.75,spd:400,d:12,sz:3,shots:2,spread:0.13,pierce:1}
];
var SOLSPR=SOLKITS.map(function(kt){
    return npcBody(npcPal(kt.M,"#e8b088",kt.N,kt.r,kt.r,"#d0d4dc"),false);
});

/* Les habitants ne sortent plus tous du meme moule : memes silhouettes, mais
   cheveux, veste et bas varient, et une passe sur deux est une silhouette
   feminine, cheveux longs et jupe. */
function shade(hex,f){
    var n=parseInt(hex.slice(1),16);
    var r=Math.max(0,Math.min(255,((n>>16)&255)*f|0));
    var g2=Math.max(0,Math.min(255,((n>>8)&255)*f|0));
    var b=Math.max(0,Math.min(255,(n&255)*f|0));
    return "#"+((1<<24)+(r<<16)+(g2<<8)+b).toString(16).slice(1);
}
var PRENOM_M=["Marc","Yann","Bastien","Gaspard","Elias","Nils","Aurel","Tibo",
  "Romain","Silas","Anselme","Jonas","Vasco","Merlin","Octave","Rene"];
var PRENOM_F=["Anouk","Livia","Sarah","Maud","Zoe","Elsa","Nina","Camille",
  "Iris","Roxane","Louise","Alma","Nora","Jade","Suzanne","Faustine"];
var NOMFAM=["Vasseur","Berthier","Ostri","Kellen","Marot","Duvals","Nerac","Corbin",
  "Auberte","Sylvain","Rimbal","Toussaint","Perec","Vannier","Deleau","Marchand"];
/* ---- LES RUES ----
   Elles ne dessinent aucun plan et n'en cherchent pas. Un immeuble s'annonce
   par un numero et un nom de rue parce qu'"un immeuble" ne dit rien a
   personne : le joueur retient "le 47 rue de l'Egouttepaille" la ou il
   oubliait aussitot un immeuble parmi vingt-sept. */
var RUES=["rue de l'Egouttepaille","rue Basse","rue du Four","rue des Tanneurs",
  "rue Vieille-Corde","rue du Pressoir","rue de la Herse","impasse Molard",
  "rue des Deux-Puits","rue du Cadran","rue Sainte-Barbe","rue de l'Abreuvoir",
  "rue des Charrons","rue du Colombier","rue Pavee","rue de la Poudriere",
  "rue des Trois-Bornes","rue du Guet","rue de l'Ancre","rue Mal-Assise",
  "quai des Lavoirs","rue de la Boucle","rue Torse","rue du Bief",
  "rue des Aiguilles","rue de la Cendre","allee des Ormes","rue Chaude"];
/* ---- LES ENSEIGNES ----
   Les metiers qui n'ont pas de batiment dans la table des lieux ont tout de
   meme une adresse : une maison sur quatre, le bas d'un immeuble sur deux.
   L'enseigne se compose d'un prefixe de metier et d'un nom de famille -
   "Plomberie Vasseur", "Boulangerie Corbin". C'est ce qui permet au plombier
   d'exister quelque part. */
var BIZ=[
 /* L'article fait partie du prefixe : sans lui on lisait "la Electricite
    Marchand" et "la Barbier Marot". Le francais ne se rattrape pas apres
    coup, il se pose des l'ecriture. */
 {k:"plombier",    p:["la Plomberie","les Sanitaires","le Chauffage"]},
 {k:"boulanger",   p:["la Boulangerie","le Fournil","la Panification"]},
 {k:"charcutier",  p:["la Charcuterie","la Boucherie","les Salaisons"]},
 {k:"electricien", p:["l'Electricite","les Installations","le Depannage"]},
 {k:"couvreur",    p:["la Couverture","la Zinguerie","les Toitures"]},
 {k:"coiffeur",    p:["la Coiffure","le Salon","le Barbier"]},
 {k:"cordonnier",  p:["la Cordonnerie","les Chaussures","le Ressemelage"]},
 {k:"horloger",    p:["l'Horlogerie","les Reparations","la Bijouterie"]},
 {k:"couturiere",  p:["la Couture","les Retouches","la Confection"]},
 {k:"maconnerie",  p:["la Maconnerie","l'Entreprise","les Travaux"]},
 {k:"veterinaire", p:["le Cabinet veterinaire","les Soins animaliers","la Clinique"]},
 {k:"imprimeur",   p:["l'Imprimerie","la Papeterie","la Reprographie"]}
];
/* les huit couleurs de manteau - le "haut" d'un habitant - avec leur nom en
   clair, pour pouvoir decrire de vive voix quelqu'un qu'on cherche. */
var COATS=["#8a6a3a","#4a6488","#84465e","#3e7a5a","#8a8446","#645a80","#a05a34","#4a5a5e"];
var COATNAME=["brun","bleu","prune","vert","kaki","mauve","roux","gris-bleu"];
function topColorName(n){
    if(!n||n.s===undefined||n.s===null) return "";
    return COATNAME[((n.s|0)*5)%COATS.length]||"";
}
var VILSPR=[];
(function(){
    var hair=["#c8a858","#7a4a22","#2e2018","#b0aca2","#8a3a1e","#5a3a58","#141014"];
    var coat=COATS;
    var skin=["#e8b088","#d69a72","#b57a52","#8c5c3c","#6a4630","#4e3524","#e8c9a0","#d6b98a"];
    var pant=["#5a4426","#38404e","#4a3a3a","#2e4030","#6a5a44"];
    var shoe=["#3a2c1c","#2a2620","#432f22"];
    for(var q=0;q<20;q++){
        var fem=(q%2)===1;
        VILSPR.push(npcBody(npcPal(hair[q%hair.length],skin[(q*3)%skin.length],
            coat[(q*5)%coat.length],pant[(q*7)%pant.length],
            shoe[q%shoe.length],"#6a4a24"),fem));
    }
})();
/* Le heros : le corps commun, l'epee au cote. */
heroA=npcBody(HMAP,false,true); heroB=heroA.alt;
var vilSpr=VILSPR[0];

var miniSpr=finish(mkspr([
".vvvv.",
"vVVkVv",
"vVVVVv",
".vddv.",
"..d.d."
],{v:"#b8d848",V:"#d8f070",d:"#88a030",k:K}));
var golemSpr=finish(mkspr([
".........gggggggggggggggggg.........",
"......ggggGGGGGGGGGGGGGGgggg........",
"....ggGGGGGGGGGGGGGGGGGGGGGGgg......",
"...gGGGGmmGGGGGGGGGGGGGGGGGGGg......",
"..gGGGGmmmmGGGGGGGGGGGGGGGGGGGg.....",
"..gGGrrrrGGGGGGGGGGGGrrrrGGGGGg.....",
"..gGGrRRrGGGGGGGGGGGGrRRrGGGGGg.....",
"..gGGrrrrGGGGGGGGGGGGrrrrGGGGGg.....",
"..gGGGGGGGGGGGGGGGGGGGGGGGGGGGg.....",
"..ggGGGGGGGGGGGGGGGGGGGGGGGGGgg.....",
".ggGGGGGGGGGGGGGGGGGGGGGGGGGGGgg....",
"ggGGGGddGGGGGGGGGGGGGGGGddGGGGGGgg..",
"gGGGGGddGGGGGGGGGGGGGGGGddGGGGGGGg..",
"gGGGgddGGGGGRRrrRRGGGGGGddgGGGGGGg..",
"gGGGgddGGGGRRrrrrRRGGGGGddgGGGGGGg..",
"gGGGg.ddGGGRrrrrrrRGGGGdd.gGGGGGGg..",
"gGGGg..ddGGRrrrrrrRGGGdd..gGGGGGGg..",
"dGGGd...ddGGRRrrRRGGGdd....dGGGGGd..",
"dGGGd....ddGGGGGGGGGdd.....dGGGGd...",
".dddd.....ddGGGGGGGdd.......dddd....",
"...........dGGGGGGGd................",
"...........dGGGGGGGd................",
"..........ddGGGGGGGdd...............",
"..........dGGGGGGGGGd...............",
".........dGGGd...dGGGd..............",
"........dGGGd.....dGGGd.............",
".......dddddd.....dddddd............",
".......ddddd.......ddddd............"
],{g:"#8a8a92",G:"#aab0b8",d:"#5a5e66",m:"#5a8a3a",r:"#e05030",R:"#f08858"}));
var reineSpr=finish(mkspr([
"........c.....cc.....c......................",
"........cc....cc....cc......................",
".......ccc....cc....ccc.....................",
"......pppppppppppppppppp....................",
".....pPPPPPPPPPPPPPPPPPPp...................",
"....pPPPPPPPPPPPPPPPPPPPPp..................",
"...pPPrrrrPPPPPPPPrrrrPPPPp.................",
"...pPPrrrrPPPPPPPPrrrrPPPPp.................",
"...pPPrrrrPPPPPPPPrrrrPPPPp.................",
"..pPPPPPPPPPPPPPPPPPPPPPPPPp................",
"..pPPPwwPPPPPPPPPPPPwwPPPPPp................",
"..pPPPwwPPPPPPPPPPPPwwPPPPPp................",
"..ppppppppppppppppppppppppppaa..............",
"..ppppppppppppppppppppppppaaaaaa............",
".pLLLpppppppppppppppppppLaaaaaaaa...........",
".pLLLpppppppppppppppppppLaaaaaaaaa..........",
"pLLpppddppddppddppddpppLLaaaaaaaaa..........",
"pLLpppddppddppddppddpppLLaaaaaaaa...........",
"pLpppppddppddppddppdppppLpaaaaaa............",
"pLpppppddppddppddppdppppLppaaaa.............",
".pppppppppppppppppppppppp...................",
".pppppppppppppppppppppppp...................",
".ddpppppppppppppppppppppd...................",
"d..pp..pp..pp..pp..pp..pd...................",
"d..pp..pp..pp..pp..pp..pd...................",
".d.pp..pp..pp..pp..pp.d.....................",
"...pp..pp..pp..pp..pp.......................",
"...dd..dd..dd..dd..dd.......................",
"...dd..dd..dd..dd..dd.......................",
"..ddd..dd..dd..dd..ddd......................"
],{p:"#7a3898",P:"#9a58b8",L:"#c088d8",d:"#4e2062",c:"#f0b840",C:"#f8e090",k:K,w:W,r:"#f05070",a:"#d8c8ec"}));
var dragonSpr=finish(mkspr([
"..................................hhhh..........",
"..................................hhhh..........",
"...............................hhrrrrhh.........",
"...............................hrrrrrrh.........",
"................aaaaaa........hrrrrrrrr.........",
"...............aAAAAaaa......hrrrrkkrrrrww......",
"..............aAAAAAAaaa....rrrrrkkkrrrrww......",
".............aAAAAAAAAaa...rrrrrrrrrrrrff.......",
"............aAAAAAAAAAAaarrrrrrrrrrrrrf.........",
"..........rraAAAAAAAAAArrrrrrrrrrrrrd...........",
".........rrraAAAAAAAAAArrrrrrrrrrrrd............",
"........rrrrraaaaaaaaaarrrrrrrrrrrd.............",
".......rrrrrrraaaaaaaarrrrrrrrrrrd..............",
"......rrrrrrryyyyyyyyyyrrrrrrrrrd...............",
".....rrrrrrryyyyyyyyyyyyrrrrrrrrd...............",
"....rrrrrrrYYyyyyyyyyyyyyrrrrrrd................",
"...rrrrrrrrYyyyyyyyyyyyyyyrrrrrd................",
"..drrrrrrrryyyyyyyyyyyyyyyyrrrrd................",
"..drrrrrrrryyyyyyyyyyyyyyyyrrrrrd...............",
".drrr..rrrrryyyyyyyyyyyyyyrrrrrrd...............",
".drr....rrrrryyyyyyyyyyyyrrrrrrrd...............",
"..d.....rrrrrrryyyyyyyyrrrrrrrrd................",
"..d......rrrrrrrrrrrrrrrrrrrrrd.................",
".........rrrrrrrrrrrrrrrrrrrrd..................",
".........drrrrrrr....rrrrrrrd...................",
"........drrrrrrd......drrrrrrd..................",
"........drrrrd..........drrrrd..................",
".......drrrrd............drrrrd.................",
".......ddrrd..............drrdd.................",
"......dddrd................drddd................",
"......ddd....................ddd................",
".....dddd....................dddd...............",
".....ddd......................ddd...............",
"......dd......................dd................"
],{r:"#c04838",R:"#e06848",d:"#802820",a:"#8a2828",A:"#a83838",y:"#f0c060",Y:"#f8e090",h:"#e8d890",k:K,w:W,f:"#f0a030"}));
dragonSpr.hd=2;

var ESPR={};
(function(){
    ESPR.rampant=finish(mkspr([
"..........wwww..............",
".......gggGGGGggg...........",
".....ggGGGGGGGGGGgg.........",
"....gGGwwGGGGGGGGGGg........",
"...gGGwwGGGGGGGGGGGGg.......",
"..gGGwwGGGGGGGGGGGGGGg......",
"..gGGwGGGGnnnnGGGGGGGg......",
".gGGGGGGGnnnnnnGGGGGGGg.....",
".gGGkkGGGnnnnnnGGGkkGGg.....",
".gGGkkGGGnnnnnnGGGkkGGg.....",
".gGGkkGGGGnnnnGGGGkkGGg.....",
".gGGGGGGGGGGGGGGGGGGGGg.....",
".gGGGGGGGGGGGGGGGGGGGGg.....",
".gGgGGGGGGGGGGGGGGgGGGgd....",
".ggGgGGGGGGGGGGGGgGGggd.....",
"..ggdgGGGGGGGGGGgGGggd......",
"..dgggggGGGGGGgggggd........",
"...dgg.ggggggggg.gd.........",
"....d..gg..gg..g.d..........",
".......gg..gg..g............",
".......d...gg...............",
"...........d................"
],{g:"#68a848",G:"#8cc860",d:"#3e6e2c",k:K,w:"#eaf6d0",n:"#2e5424"}));
    ESPR.rampant.hd=2;
    ESPR.rat=finish(mkspr([
"....................bb......",
"...................bBBb.....",
"...................bBBb.....",
"........bbb......bbBBBBb....",
"tt.....bbBBbb..bbBBBBBbk....",
".tt...bbBBBBbbbBBBBBBbkn....",
".tt...bbBBBBbbbBBBBBBbkn....",
"..tt.bbBBBBBBBBBBBBBbbnn....",
"...ttbbBBBBBBBBBBBbbbb......",
"....tbbbBBBBBBBBbbbbb.......",
".....bbbbbbbbbbbbbbb........",
".....bbbbbbbbbbbbbbb........",
"......bbdbbbbbbdbbb.........",
"......db.bbb.db..b..........",
"......db.bbb.db..b..........",
".....d...db......d..........",
"..........d................."
],{b:"#8a7a6a",B:"#a89886",d:"#5e5248",t:"#c9a09a",n:"#e88a9a",k:K}));
    ESPR.rat.hd=2;
    ESPR.zombi=finish(mkspr([
"......ssssss............",
".....ssssssss...........",
".....ssssssss...........",
".....sKKssssKs..........",
".....sKKssssKs..........",
".....ssssSSss...........",
".....ssSSssss...........",
"......ssssss............",
"......ssssss............",
".....RrrrrrrR...........",
"....Rrrrrrrrrssssssssss.",
"...Wrrrrrrrrrssssssssss.",
"...Wrrsrrrrrr...........",
"...Wrrsrrrrrr...........",
"...srrrrrsrrrssssssssss.",
"...srrrrrsrrrsssssssss..",
"...srrrrrrrrr...........",
"...drrsrrrrrd...........",
"....drrrrrsd............",
"....ddddddddd...........",
"....dd....ddd...........",
"....sS.....Ss...........",
"....sS.....Ss...........",
"....sS.....Ss...........",
"....sS.....sS...........",
"....sS.....sS...........",
"...sS.......Ss..........",
"...sS.......Ss..........",
"...SS.......SS..........",
"..SSS......SSS.........."
],{s:"#9fbf7a",S:"#7a9a58",K:K,r:"#5a5468",R:"#736c84",d:"#403c50",W:"#e8e8dc"}));
    ESPR.zombi.hd=2;
    ESPR.chauve=finish(mkspr([
"pp.............PP.............pp",
"ppp...........PPPP...........ppp",
"pPpp.........PPppPP.........ppPp",
"pPPpp.......PPppppPP.......ppPPp",
"pPPPpp.....PPpppeeppPP....ppPPPp",
"pPPPPppp..PPppeeeeeppPP.pppPPPPp",
".ppPPPPppPPpppeeeeepppPPppPPPpp.",
"..pppPPPPPpppppeepppppPPPPPppp..",
"....pppPPpppwppppppwpppPPppp....",
"......ddpppwwpppppwwpppdd.......",
".......ddpppwppppwppppdd........",
".........ddpp.ww..ppdd..........",
"..........dpp.ww..ppd...........",
"...........d..dd...d............",
"...............d................"
],{p:"#7a6898",P:"#9a88b8",d:"#514468",e:"#e05030",w:W}));
    ESPR.chauve.hd=2;
    ESPR.cracheur=finish(mkspr([
"......cccccccccc............",
"....ccCCCCCCCCCCcc..........",
"...cCCCCkkCCCCkkCCc.........",
"..cCCCCkkkkCCkkkkCCc........",
"..cCCCCkkkkCCkkkkCCcd.......",
".cCCCCCCkkCCCCkkCCCCcd......",
".cCCCCCCCCCCCCCCCCCCcd......",
"cCCCooooooooooooooCCCcd.....",
"cCCoommmmmmmmmmmmooCCcd.....",
"cCCommmMMMMMMMMmmmoCCcd.....",
"cCCommmMMMMMMMMmmmoCCcd.....",
"cCCoommmmmmmmmmmmooCCcd.....",
".cCCooooooooooooooCCcd......",
".ccCCCCCCCCCCCCCCCCcd.......",
".dcCCCCCCCCCCCCCCCcd........",
"..dcccccccccccccccd.........",
"...dd.ccd..ccd.dd...........",
"......ccd..ccd..............",
".....dd....dd..............."
],{c:"#48a898",C:"#6cc8b8",d:"#2e7266",k:K,o:"#143830",m:"#a8f0d8",M:"#d8fff0"}));
    ESPR.cracheur.hd=2;
    ESPR.squelette=finish(mkspr([
".......WWWWWW...........",
"......WWWWWWWW..........",
".....WWWWWWWWWW.........",
".....WWWWWWWWWW.........",
".....WWKKWWWKKW.........",
".....WWKKWWWKKW.........",
".....WWKKWWWKKW.........",
".....WWWWkWWWWW.........",
"......WwKwKwKw..........",
"......WwwwwwwW..........",
".........ww.............",
".........ww.............",
"....wwwwwwwwwww.........",
"...Ww..wKKKKw.wW........",
"...dw.wwwwwww.wd........",
"...dw..wKKKKw.wd........",
"...dw.wwwwwww.wd........",
"....d..wKKKKw.d.........",
"......wwwwwww...........",
".......wKKw.............",
"........ww..............",
"......wwwwww............",
"......w....w............",
"......w....w............",
"......w....w............",
"......w....w............",
"......w....w............",
".....ww....ww...........",
"....www....www..........",
"....www....www.........."
],{W:"#f0f0e4",w:"#d4d4c4",d:"#a8a896",K:K}));
    ESPR.squelette.hd=2;
    ESPR.essaim=miniSpr;
    ESPR.brute=finish(mkspr([
"......oooooooooo............",
"....ooOOOOOOOOOOoo..........",
"...oOOOOOOOOOOOOOOo.........",
"...OOkkOOOOOOOOkkOO.........",
"...OOkkOOOOOOOOkkOO.........",
"...OOOOOOOOOOOOOOOO.........",
"...OOwOOOOOOOOOOwOO.........",
"...OOwwOOOOOOOOwwOO.........",
"..ooOOOOOOOOOOOOOOoo........",
".ooOOOooooooooooOOOoo..bBb..",
"oOOOOooooooooooooOOOOo.bBb..",
"oOOOOodddooooddddOOOOoobBb..",
"oOOOOoodddooddddoOOOOoobBb..",
"dOOOOooooooooooooOOOOddbBb..",
"dOOOOooooooooooooOOOOddbBb..",
".ddOOoooooooooooOOdd..oOOo..",
"..ddooooooooooooodd...oOOo..",
"...dd..pppppppp.dd....dood..",
".......ppppppppp.......dd...",
"......ppp....ppp............",
"......ppp....ppp............",
".....ddd......ddd...........",
".....dd........dd...........",
"....ddd........ddd.........."
],{o:"#a85838",O:"#c87850",d:"#703a24",k:K,w:W,p:"#4a3a30",b:"#6a4a2e",B:"#8a6440"}));
    ESPR.loup=finish(mkspr([
".............................dd.....",
"dd..........................dwwd....",
"dwd........................ddwwdd...",
".dwdd.....................ddwwwwdd..",
".dwwwd...................dwwwwwwde..",
"..dwwwd.................dwwwwwwwee..",
"..dwwwwwwwwwwwwwwwwwwwwwwwwwwwwwee..",
"..dwwwwwwwwwwwwwwwwwwwwwwwwwwwwnn...",
"..wwwwwwwwwwwwwwwwwwwwwwwwwwwwnn....",
"..wwwwwwwwwwwwwwwwwwwwwwwwwwwwnn....",
".dwwwwwwwwwwwwwwwwwwwwwwwwwwdWW.....",
".dwwwwwwwwwwwwwwwwwwwwwwwwddWW......",
".dwwwwwwwwwwwwwwwwwwwwwwwdd.W.......",
".dwwwddwwwwwwwwwwwwwwwwwdd..........",
"..wwwdddwwwwwwwwwwwwwwddd...........",
"..wwdd..ddwwwwwwwwwwddd.............",
"..wwd....wwwdd..wwwdd...............",
"..wwd....wwwd...wwwd................",
"..wwd....wwd....wwd.................",
"..wwd....wwd....wwd.................",
"..wdd....wwd....wwd.................",
".ddd.....wdd....wdd.................",
".dd......dd.....dd..................",
".dd......dd.....dd.................."
],{w:"#98a0b0",d:"#5f6674",e:"#e05030",n:K,W:"#f2f2e8"}));
    ESPR.loup.hd=2;
    ESPR.pretre=finish(mkspr([
"........RRRRRRRR........",
"......RRRRRRRRRRRR......",
".....RRRRRRRRRRRRRR.....",
"....RRRRrrrrrrrrRRRR....",
"....RRrrrFFFFFFrrrRR....",
"....RRrFFFFFFFFFFrRR....",
"....RRrFFKKFFKKFFrRR....",
"....RRrFFKKFFKKFFrRR....",
"....RRrFFFFFFFFFFrRR....",
"....RRrrFFFFFFFFrrRR....",
"....RRRRrrrrrrrrRRRR....",
"...RRRRRRRRRRRRRRRRR....",
"..RRRRRRRRGGRRRRRRRR....",
"..RRRRRRRGGGGRRRRRRR....",
"..RRRRRGGGGGGGGRRRRR....",
"..RRRRRRRGGGGRRRRRRR....",
"..RRRRRRRRGGRRRRRRRR....",
".rRRRRRRRRRRRRRRRRRRr...",
".rRRRRRRRRRRRRRRRRRRr...",
".rRRRRRRRRRRRRRRRRRRr...",
".rRRRRRRRRRRRRRRRRRRr...",
".rrRRRRRRRRRRRRRRRRrr...",
".rrRRRRRRRRRRRRRRRRrr...",
"drrrRRRRRRRRRRRRRRrrrd..",
"drrrrRRRRRRRRRRRRrrrrd..",
"drrrrrrrrrrrrrrrrrrrrd..",
"ddrrrrrrrrrrrrrrrrrrdd..",
"dddddddddddddddddddddd..",
"dddddddddddddddddddddd..",
".dddddddddddddddddddd..."
],{R:"#f0e8d4",r:"#d8ccb0",d:"#b0a488",F:"#d8b890",K:K,G:"#f0b840"}));
    ESPR.pretre.hd=2;
    ESPR.kamikaze=finish(mkspr([
"..............FF........",
".............FfF........",
".............ffF........",
"..............mm........",
"..............mm........",
"........kkkkmmkkkk......",
"....kkkkklllllllkkkk....",
"...kkklllllllllllkkkk...",
"..kkllllllllllllllkkkk..",
"..kkwwwwkkkkkwwwwkkkk...",
"..kwwKKwkkkkwwKKwkkkk...",
"..kwwKKwkkkkwwKKwkkkk...",
"..kkwwwwkkkkkwwwwkkkk...",
"..kkkllllllllllllkkkk...",
"..kkkklllllllllllkkkk...",
"..kkkkkllllllllkkkkkk...",
"..kkkkkkkkkkkkkkkkkk....",
"...kkkkkkkkkkkkkkkk.....",
"....kkkkkkkkkkkkkk......",
".....kkkk....kkkk.......",
".....kkkk....kkkk.......",
"....kkkk......kkkk......",
"....kkk........kkk......",
"...kkkk........kkkk....."
],{k:"#262a34",l:"#3a4050",f:"#f0a030",F:"#f8e090",w:W,K:K,m:"#8a6a4a"}));
    ESPR.kamikaze.hd=2;
    ESPR.fantome=finish(mkspr([
"........BBBBBBBB........",
"......BBBBBBBBBBBB......",
".....BBBBBBBBBBBBBB.....",
"....BBBBBBBBBBBBBBBB....",
"....BBBBBBBBBBBBBBBB....",
"....BBKKKBBBBKKKBBBB....",
"....BBKKKBBBBKKKBBBB....",
"....BBBBBBBBBBBBBBBB....",
"....BBBBBBBBBBBBBBBB....",
"....BBbbKKKKKKbbBBBB....",
"....BBbbKKKKKKbbBBBB....",
"...bBBBBBBBBBBBBBBBb....",
"...bBBBBBBBBBBBBBBBb....",
"...bBBBBBBBBBBBBBBBb....",
"...bBBBBBBBBBBBBBBBb....",
"...bbBBBBBBBBBBBBBbb....",
"...bbBBBBBBBBBBBBBbb....",
"...bbbBBBBBBBBBBBbbb....",
"..dbbbbBBBBBBBBbbbbd....",
"..dbbbbbBBBBBBbbbbbd....",
".d.bbbbbbbbbbbbbbbb.d...",
".d..bbbbbbbbbbbbbb..d...",
"....bbbb..bb..bbbb......",
".....dbb..bb..bbd.......",
"......db..dd..bd........",
".......d......d........."
],{B:"#d0e0f0",b:"#a8c0d8",d:"#7890a8",K:K}));
    ESPR.fantome.hd=2;
    ESPR.archer=finish(mkspr([
"..hhhhhhh................",
".hhHHHHHHhh..............",
"hhHHHHHHHHhh.............",
"hHHHHHHHHHHh.............",
"hHHHHHHHHHHh......bb.....",
".hFFFFFFFFh......bbs.....",
".hFFKKFFKKh......bs......",
".hFFKKFFKKh.....bbs......",
".hFFFFFFFFh.....bs.......",
"..hFFffFFh......bs.......",
"...hFFFFh.......bs.......",
"..cCCCCCCc......bs.......",
".cCCCCCCCCc.....bs.......",
"fCCCCCCCCCCf....bs.......",
"fCCCCCCCCCCfffffbs.......",
".cCCCCCCCCc.....bs.......",
".cCCcCCcCCc.....bs.......",
".cCCcCCcCCc.....bs.......",
".ccCCCCCCcc.....bs.......",
"..cCCCCCCc......bs.......",
"...cccccc.......bs.......",
"...cc..cc.......bs.......",
"...cc..cc......bbs.......",
"...cc..cc......bb........",
"...cc..cc................",
"..ccc..ccc...............",
"..dd....dd...............",
".ddd....ddd.............."
],{h:"#5a7a38",H:"#78a050",F:"#e0c8a0",f:"#c0a478",K:K,c:"#8a6a42",C:"#a8865a",b:"#6b4a2e",s:W,d:"#5e4830"}));
    ESPR.archer.hd=2;
    ESPR.scarabee=finish(mkspr([
"h..............aaaa..............h",
".h............aAAAAa............h.",
"..h..........aAAAAAAa..........h..",
"...h........aAAAssAAAa........h...",
"....h......aAAAssssAAAa......h....",
".....h....aAAAsswwssAAAa....h.....",
"......haaaAAAAsswwssAAAAaaah......",
".....aaAAAAAAAssssssAAAAAAAaa.....",
"....aAAAAAAAAAAssssAAAAAAAAAAa....",
"...aAAAAAAAAAAAAAAAAAAAAAAAAAAa...",
"..aAAAAdddAAAAAAAAAAAAdddAAAAAAa..",
"..aAAAAdddAAAAAAAAAAAAdddAAAAAAa..",
"..aAAAAdddAAAAAAAAAAAAdddAAAAAAa..",
"..aAAAAAdAAAAAAAAAAAAAAdAAAAAAAa..",
"...aaAAAAAAAAAAAAAAAAAAAAAAAAaa...",
"....daaaaaaaaaaaaaaaaaaaaaaaad....",
".....d.dd...dd......dd...dd.d.....",
"........dd...dd....dd...dd........",
".........d....d....d.....d........",
"..........d...d....d...d.........."
],{a:"#4868a8",A:"#6a8ecc",s:"#a8ccf0",d:"#2e4470",h:"#d8c090",w:"#e8f4ff"}));
    ESPR.scarabee.hd=2;
    ESPR.traqueur=finish(mkspr([
".............................dd.....",
"dd......ss..................dwwd....",
"dwd....s..s................ddwwdd...",
".dwdd.s....s..............ddwwwwdd..",
".dwwwd.....s.............dwwwwwwde..",
"..dwwwd.s...............dwwwwwwwee..",
"..dwwwwwwwwwwwwwwwwwwwwwwwwwwwwwee..",
"..dwwwwwwwwwwwwwwwwwwwwwwwwwwwwnn...",
"..wwwwwwwwwwwwwwwwwwwwwwwwwwwwnn....",
"..wwwwwwwwwwwwwwwwwwwwwwwwwwwwnn....",
".dwwwwwwwwwwwwwwwwwwwwwwwwwwdWW.....",
".dwwwwwwwwwwwwwwwwwwwwwwwwddWW......",
".dwwwwwwwwwwwwwwwwwwwwwwwdd.W.......",
".dwwwddwwwwwwwwwwwwwwwwwdd..........",
"..wwwdddwwwwwwwwwwwwwwddd...........",
"..wwdd..ddwwwwwwwwwwddd.............",
"..wwd....wwwdd..wwwdd...............",
"..wwd....wwwd...wwwd................",
"..wwd....wwd....wwd.................",
"..wwd....wwd....wwd.................",
"..wdd....wwd....wwd.................",
".ddd.....wdd....wdd.................",
".dd......dd.....dd..................",
".dd......dd.....dd.................."
],{w:"#6a5890",d:"#453a60",e:"#f0d040",n:K,W:W,s:"#c8b8e8"}));
    ESPR.traqueur.hd=2;
    ESPR.necro=finish(mkspr([
"........RRRRRRRR......OOOO..",
"......RRRRRRRRRRRR....OOOO..",
".....RRRRrrrrrrRRRR...oOOo..",
"....RRRrrrrrrrrrrRRR...bb...",
"....RRrrKKKKKKKKrrRR...bb...",
"....RRrKKKKKKKKKKrRR...bb...",
"....RRrKKeeKKeeKKrRR...bb...",
"....RRrKKeeKKeeKKrRR...bb...",
"....RRrKKKKKKKKKKrRR...bb...",
"....RRrrKKKKKKKKrrRR...bb...",
"....RRRRrrrrrrrrRRRR...bb...",
"...RRRrrrrrrrrrrrrRRr..bb...",
"..RRrrrrrrrrrrrrrrrrrrrbb...",
".RRrrrrrrrrrrrrrrrrrrrrbb...",
".Rrrrrrrrrrrrrrrrrrr...bb...",
".rrrrdddrrrrrrdddrrr...bb...",
".rrrrdddrrrrrrdddrrr...bb...",
".rrrrrdrrrrrrrrdrrrr...bb...",
".rrrrrrrrrrrrrrrrrrr...bb...",
".rrrrrrrrrrrrrrrrrrr...bb...",
".rrrrrrrrrrrrrrrrrrr........",
".drrrrrrrrrrrrrrrrrd........",
".drrrrrrrrrrrrrrrrrd........",
"ddrrrrrrrrrrrrrrrrrdd.......",
"ddrrrrrrrrrrrrrrrrrdd.......",
"dddddddddddddddddddddd......",
"dddddddddddddddddddddd......",
".dddddddddddddddddddd.......",
".dddddddddddddddddddd.......",
"..dddddddddddddddddd........"
],{r:"#483858",R:"#645078",d:"#302440",K:K,e:"#78e878",b:"#6b4a2e",o:"#a888c8",O:"#d0b8ec"}));
    ESPR.necro.hd=2;
    ESPR.enrage=finish(mkspr([
"......ssssss............",
".....ssssssss...........",
".....ssssssss...........",
".....sKKssssKs..........",
".....sKKssssKs..........",
".....sddmmdds...........",
".....sddwwdds...........",
".....ssdwwdss...........",
"......ssssss............",
"......ssssss............",
"....dSSSSSSSSd..........",
"...dSSSSSSSSSSd.........",
"..dSSddSSSSddSSd........",
"..dSSddSSSSddSSd........",
".dSSSSSSSSSSSSSSd.......",
".dSSSSSSSSSSSSSSd.......",
"..dSSSSSSSSSSSSd........",
"..dSSSSSSSSSSSSd........",
"ww..dSSSSSSSSd..ww......",
"ww...dSSSSSSd...ww......",
".....dSSSSSSd...........",
"......dSSSSd............",
"......dSSSSd............",
".....dSS..SSd...........",
".....dSS..SSd...........",
".....dd....dd...........",
"....ddd....ddd..........",
"....ddd....ddd.........."
],{s:"#e8a898",S:"#c87868",d:"#a03830",K:K,m:"#701818",w:W}));
    ESPR.enrage.hd=2;
    ESPR.colosse=finish(mkspr([
".........oooooooooooooo.........",
".......ooOOOOOOOOOOOOOOoo.......",
"......oOOOOOOOOOOOOOOOOOOo......",
".....oOOLLLLOOOOOOOOLLLLOOo.....",
".....oOOLLLLOOOOOOOOLLLLOOo.....",
".....oOOkkOOOOOOOOOOkkOOOOo.....",
".....oOOkkOOOOOOOOOOkkOOOOo.....",
".....oOOOOOOwwOOwwOOOOOOOOo.....",
".....oOOOOOOwwOOwwOOOOOOOOo.....",
"....ooOOOOOOOOOOOOOOOOOOOOoo....",
"...ooOOOOOOOOOOOOOOOOOOOOOOoo...",
"..oOOLLoooooooooooooooooLLOOo...",
".oOOOLoooooooooooooooooooLOOOo..",
"oOOOoooooffooooooffoooooooOOOo..",
"oOOOooooofffoooofffooooooooOOo..",
"oOOOoooooffooooooffoooooooOOOo..",
"dOOOoooooooooooooooooooooOOOd...",
"dOOOOoooooooooooooooooooOOOOd...",
"dOOOOooooooooooooooooooOOOOd....",
".ddOOOoooooooooooooooOOOdd......",
"..ddOOOoooooooooooOOOOdd........",
"...dd.oooooooooooooo.dd.........",
"......ooooooooooooo.............",
".....dooooooooooood.............",
"....ddoooo....ooooodd...........",
"...ddoooo......oooodd...........",
"..ddddd..........ddddd..........",
"..dddd............dddd.........."
],{o:"#7a4828",O:"#9a6238",L:"#b87e4c",d:"#4e2c16",k:K,w:W,f:"#f0a030"}));
    ESPR.golem=golemSpr;
    ESPR.reine=reineSpr;
    ESPR.dragon=dragonSpr;
    window.scaleSpr=function(s,f,filt){
        var sc=document.createElement("canvas");
        sc.width=Math.round(s.width*f); sc.height=Math.round(s.height*f);
        var sg=sc.getContext("2d"); sg.imageSmoothingEnabled=false;
        if(filt) sg.filter=filt;
        sg.drawImage(s,0,0,sc.width,sc.height);
        if(s.hd) sc.hd=s.hd;
        return sc;
    };
    /* TUAZ : 4 zombis sur sprites recycles */
    ESPR.runner =scaleSpr(ESPR.traqueur,1,"sepia(1) hue-rotate(55deg) saturate(2.2)");
    ESPR.empois =scaleSpr(ESPR.cracheur,1,"hue-rotate(200deg) saturate(1.8)");
    ESPR.lutteur=scaleSpr(ESPR.brute,1.15,"sepia(0.6) hue-rotate(40deg) saturate(1.6)");
})();
/* zombi : chair verdatre, hardes ternes, meme stature que les vivants */
var zombSpr=npcBody(npcPal("#3e4a32","#8fa06e","#4a4a3e","#3a3a30","#2a241c","#5a5040"),false);
/* scout : chemise kaki, short olive, foulard rouge */
var scoutSpr=npcBody(npcPal("#6a4a2a","#e8b088","#8a8a4a","#5a5a2e","#3a2a1a","#b04030"),false);
/* pecheur : bonnet fauve, vareuse bleu-vert */
var fisherSpr=npcBody(npcPal("#8a7a3a","#e8b088","#3a5a6a","#2a3a44","#4a3524","#7a5a30"),false);
/* pompier : casque clair, veste sombre a bandes, pantalon assorti */
var fireSpr=npcBody(npcPal("#b8b4a8","#e8b088","#2e3238","#24282e","#1a1c20","#c8a030"),false);
/* policier : cheveux sombres, chemise bleu marine, pantalon noir */
var copSpr=npcBody(npcPal("#3a3028","#e8b088","#2a3450","#1c2030","#141418","#8a8e98"),false);
/* soignant : blouse claire, pantalon clair, semelles blanches */
var medSpr=npcBody(npcPal("#6a5030","#e8b088","#e0e4e2","#c8ccca","#dcdcd8","#4aa0a8"),false);
/* Tous les PNJ ont desormais la stature du personnage : on recalcule leur
   diviseur d'affichage pour que leur hauteur a l'ecran egale la sienne. */
(function(){
    var hh=heroA.height/(heroA.hd||1);
    /* les cinq vues d'un corps doivent etre calees ensemble, sans quoi un
       habitant changerait de taille en tournant */
    function one(s){ if(!s) return; s.hd=s.height/hh; if(s.alt) s.alt.hd=s.alt.height/hh; }
    function asHero(s){
        var i;
        if(s&&s.v){ for(i=0;i<s.v.length;i++) one(s.v[i]); }
        else one(s);
    }
    VILSPR.forEach(asHero);
    SOLSPR.forEach(asHero);
    [soldierSpr,farmerSpr,fisherSpr,zombSpr,scoutSpr,
     fireSpr,copSpr,medSpr].forEach(asHero);
})();
var frogSpr=finish(mkspr([
"...gg......gg...",
"..gGGg....gGGg..",
"..gGkGg..gGkGg..",
"..ggGGgggGGGgg..",
".ggGGGGGGGGGGgg.",
"gGGGGGGGGGGGGGGg",
"gGGdGGGGGGGGdGGg",
"gGGGGGyyyyGGGGGg",
".gGGGGGGGGGGGGg.",
"..ggGGGGGGGGgg..",
".gg..gggggg..gg.",
"gg....g..g....gg"
],{g:"#3e7a3a",G:"#5aa04e",d:"#2c5a2c",k:K,y:"#8ac070"}));
frogSpr.hd=2;
var crowSpr=finish(mkspr([
"..kk............",
".kkkk...........",
"kkkkkk......bb..",
"kkkkkkk....bbb..",
".kkkkkkkkbbbb...",
".kkkkkkkkbbb....",
"..kkkkkkkkb.....",
"..kkk..kkk......",
"..kk....kk......",
"..b......b......"
],{k:"#22242c",b:"#f0b840"}));
crowSpr.hd=2;
var vegSpr=[
finish(mkspr(["..g..",".gg..","..o..",".ooo.",".ooo.","..o.."],{g:"#68a848",o:"#e88a3a"})),
finish(mkspr([".gg..","gggg.",".rrr.","rrrrr",".rrr."],{g:"#68a848",r:"#d84848"})),
finish(mkspr([".ggg.","gGGGg","gGGGg",".ggg."],{g:"#4e8838",G:"#88c868"}))
];
function mkCanopy(rad,seed){
    var Math=DMATH;
    var R2=mulberry32(seed), s=rad*2+2;
    var c=document.createElement("canvas"); c.width=s; c.height=s;
    var g=c.getContext("2d");
    for(var y=0;y<s;y++) for(var x=0;x<s;x++){
        var dx=x-s/2, dy=y-s/2, d=Math.sqrt(dx*dx+dy*dy);
        if(d<rad-1+R2()*2){
            var t=R2();
            g.fillStyle = (dx-dy<-rad*0.5&&t<0.5) ? "#5a8a3a" : (t<0.12?"#2e4a22":"#3e6428");
            g.fillRect(x,y,1,1);
        }
    }
    return finish(c);
}
var canopies=[mkCanopy(10,11),mkCanopy(12,22),mkCanopy(14,33)];

/* icones 8x8 */

