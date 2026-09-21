"use strict";
/* ================================================================
   TUAZ - 08-faune.js
   La faune (grenouilles, poissons, oiseaux, biches, pecheurs) et la
   routine qui decoince un corps bloque dans un obstacle.
   (lignes 8613 a 9604 du mono-fichier d'origine)
   ================================================================ */
/* ================= FAUNE ================= */
/* Les biches paissent en harde et detalent des que le joueur approche, sans
   jamais mettre le sabot dans une zone habitee. */
/* La garnison patrouille dans l'enceinte et sur son pourtour. */
/* ---- UN PAS DE RONDE ----
   Troupes, scouts, gens de metier : tous tournaient autour d'un point en
   foncant tout droit, et c'est collide qui les repoussait du mur - d'ou les
   corps qui vibrent contre une facade. Ils contournent maintenant comme les
   villageois (stepAround, cote fixe). Et si un corps n'approche plus de son
   but depuis deux secondes, il change de cote et se choisit une autre
   destination : de quoi sortir d'une poche SANS garder tout un trajet en
   memoire. Deterministe. */
function roamStep(o,spd,dt,wet){
    var Math=DMATH, l=Math.hypot(o.tx-o.x,o.ty-o.y);
    if(l>3){
        stepAround(o,o.tx-o.x,o.ty-o.y,spd*dt,5,wet);
        o.face=(o.tx<o.x)?-1:1; o.anim+=dt*6;
        if(o.stkL===undefined||l<o.stkL-1){ o.stkL=l; o.stk=0; }
        else { o.stk=(o.stk||0)+dt;
            if(o.stk>2){ o.dsg=-(o.dsg||1); o.wt=0; o.stk=0; o.stkL=undefined; } }
    }
    collide(o,5);
}
function updTroops(dt){
    var Math=DMATH;
    var p=G.p, i, j, a, s, l, spd;
    for(i=0;i<ARMYBASES.length;i++){
        a=ARMYBASES[i];
        if(dist2(a.x,a.y,p.x,p.y)>1000*1000) continue;
        for(j=0;j<a.troops.length;j++){
            s=a.troops[j];
            if(s.dead) continue;
            if(s.stop>0){ s.stop-=dt; collide(s,5); continue; }
            s.wt-=dt;
            if(s.wt<=0){
                s.wt=rr(2,6);
                /* l'enceinte est close : nul ne franchit le grillage */
                if(s.inb){
                    /* ronde interieure, dans le terre-plein */
                    s.tx=a.fx+rr(14,a.fw-14); s.ty=a.fy+rr(14,a.fh-14);
                } else {
                    /* tour du proprietaire, autour de l'enceinte */
                    var an=rr(0,6.283), dd=rr(a.fw*0.62,a.fw*0.86);
                    s.tx=a.x+Math.cos(an)*dd; s.ty=a.y+Math.sin(an)*dd*0.86;
                }
            }
            roamStep(s,32*npcSlow(s.x,s.y),dt,true);
        }
    }
}
/* ---- CE QUI FAIT FUIR UNE BICHE ----
   Elle ne craignait que vous. Une horde pouvait lui passer au travers sans
   qu'elle leve la tete, et un paysan traverser son pre sans la deranger :
   c'etait le seul animal de la carte qui ignorait tout ce qui n'etait pas le
   joueur.

   TROIS EPOUVANTAILS DESORMAIS, a trois distances. Le zombi porte le plus
   loin - une biche sent la mort venir avant de voir un homme - puis le
   joueur, puis le passant ordinaire, qui n'inquiete pas grand-monde.

   LE COUT EST TENU PAR DEUX MOYENS. Les passants se lisent dans HGRID, les
   neuf cases voisines, exactement comme les zombis lisent leurs proies. Les
   zombis, eux, n'ont pas de grille : on les cherche UNE FOIS PAR HARDE et
   non par bete, tous les DEER_SCAN tours, et l'on garde le plus proche. Une
   harde ne se deplace pas de trois cents pixels en dix tours : la reponse
   gardee reste juste. */
var DEER_SCAN=10, DEER_FZ=240, DEER_FP=190, DEER_FN=160;
function deerScan(h){
    var i, z, d, bd=1e9, bz=null;
    var por=(h.r+DEER_FZ+120)*(h.r+DEER_FZ+120);
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(z.dead||z.gone) continue;
        d=dist2(z.x,z.y,h.x,h.y);
        if(d>por||d>=bd) continue;
        bd=d; bz=z;
    }
    h.zs=bz?{x:bz.x,y:bz.y}:null;
}
/* Le plus pressant des trois, ou rien. On rend l'objet dont il faut
   s'eloigner, pas la distance : la fuite vise l'oppose. */
function deerThreat(d,h,p){
    var best=null, bd=1e9, q, hn, dd, gx, gy, cell;
    if(h.zs){
        dd=dist2(d.x,d.y,h.zs.x,h.zs.y);
        if(dd<DEER_FZ*DEER_FZ){ bd=dd*0.5; best=h.zs; }   /* il pese double */
    }
    if(!G.inside){
        dd=dist2(d.x,d.y,p.x,p.y);
        if(dd<DEER_FP*DEER_FP&&dd<bd){ bd=dd; best=p; }
    }
    gx=(d.x/HCELL)|0; gy=(d.y/HCELL)|0;
    var ax, ay;
    for(ax=gx-1;ax<=gx+1;ax++) for(ay=gy-1;ay<=gy+1;ay++){
        cell=HGRID[ax+","+ay]; if(!cell) continue;
        for(q=0;q<cell.length;q++){
            hn=HUM[cell[q]];
            if(!hn||hn.dead) continue;
            dd=dist2(d.x,d.y,hn.x,hn.y);
            if(dd<DEER_FN*DEER_FN&&dd*1.4<bd){ bd=dd*1.4; best=hn; }
        }
    }
    return best;
}
function updDeer(dt){
    var Math=DMATH;
    var p=G.p, i, j, h, d, l, spd;
    for(i=0;i<DEER.length;i++){
        h=DEER[i];
        if(dist2(h.x,h.y,p.x,p.y)>1100*1100) continue;
        /* le balayage des zombis, une fois par harde et rarement. Le rythme
           ne depend que du numero de tour et du rang de la harde, donc le
           rejeu retrouve les memes reponses. */
        if(h.zs===undefined||((G.tick+i)%DEER_SCAN)===0) deerScan(h);
        for(j=0;j<h.list.length;j++){
            d=h.list[j];
            var th=deerThreat(d,h,p);
            if(th){
                /* fuite : on vise l'oppose de ce qui fait peur, en restant
                   hors des bourgs */
                d.run=Math.min(2.6,d.run+dt*3);
                var fa=datan2(d.y-th.y,d.x-th.x)+rr(-0.3,0.3), k3;
                for(k3=0;k3<8;k3++){
                    var cx2=d.x+Math.cos(fa)*200, cy2=d.y+Math.sin(fa)*200;
                    if(!inSettle(cx2,cy2,90)&&!inSea(cx2,cy2)){ d.tx=cx2; d.ty=cy2; break; }
                    fa+=0.79;
                }
            } else {
                d.run=Math.max(0,d.run-dt*1.4);
                d.wt-=dt;
                if(d.wt<=0){ d.wt=rr(1.6,4.2);
                    var ga2=rr(0,6.283), gd2=rr(0,h.r), k4;
                    for(k4=0;k4<6;k4++){
                        var nx3=h.x+Math.cos(ga2)*gd2, ny3=h.y+Math.sin(ga2)*gd2;
                        if(!inSettle(nx3,ny3,80)&&!inSea(nx3,ny3)){ d.tx=nx3; d.ty=ny3; break; }
                        ga2+=1.05;
                    }
                }
            }
            spd=((d.run>0.1)?150:38)*npcSlow(d.x,d.y);
            l=Math.hypot(d.tx-d.x,d.ty-d.y);
            if(l>4){
                d.x+=(d.tx-d.x)/l*spd*dt; d.y+=(d.ty-d.y)/l*spd*dt;
                d.face=(d.tx<d.x)?-1:1; d.anim+=dt*(spd>80?15:6);
            }
            collide(d,4);
        }
    }
}
/* Passer trop pres d'un arbre en fait jaillir une volee d'oiseaux. */
function updBirds(dt){
    var Math=DMATH;
    var p=G.p, cell=obstAt(p.x,p.y), i, c, n, k;
    for(i=0;i<cell.c.length;i++){
        c=cell.c[i];
        if(!c.tree||!c.nest||c.bird>0) continue;
        if(dist2(c.x,c.y,p.x,p.y)>44*44) continue;
        c.bird=9;
        n=1+((rng()*5)|0);
        for(k=0;k<n;k++){
            var ba=rr(0,6.283), bs=rr(38,72);
            G.birds.push({x:c.x+rr(-6,6), y:c.y-10+rr(-4,4),
                vx:Math.cos(ba)*bs, vy:Math.sin(ba)*bs-30,
                t:rr(1.6,2.6), ph:rr(0,6.283), f:(Math.cos(ba)<0)?-1:1});
        }
    }
    for(i=0;i<cell.c.length;i++){ c=cell.c[i]; if(c.tree&&c.bird>0) c.bird-=dt; }
    for(i=G.birds.length-1;i>=0;i--){
        var b=G.birds[i];
        b.x+=b.vx*dt; b.y+=b.vy*dt;
        b.vy-=26*dt; b.vx*=Math.pow(0.55,dt); b.ph+=dt*17;
        b.t-=dt;
        if(b.t<=0) G.birds.splice(i,1);
    }
}

/* ---- ZOMBIS ----
   Chaque zombi porte les memes competences et le meme inventaire qu'un
   vivant, plus un ou deux traits qui deplacent sa vie, sa vitesse et son
   endurance. Les reglages d'espece vivent dans ZCFG, que [F2] ouvre.
   Les distances ne sont pas tirees au hasard, elles se lisent sur l'armement
   qui existe deja : il voit a la portee moyenne d'un pistolet (87 px), il
   entend un pas a la portee moyenne d'une arme blanche (28 px), et son
   gemissement porte deux fois la vue. */
var ZCFG={hp:120, spdDay:26, spdNight:44, hear:100, sight:88, n:60,
          moan:175, dmgMin:25, dmgMax:35, bite:1.1, reach:15,
          grp:140, push:11, flowPc:200, fallPc:30, far:700,
          labEvery:20, labStop:1200, labWalk:30, rise:60, cap:260};
/* ---- LA SOURCE ----
   Vingt minutes durant, le laboratoire lache un zombi toutes les vingt
   secondes, et chacun s'en va tout droit devant lui pendant trente secondes
   avant de s'arreter la ou il se trouve : c'est ce qui essaime la carte
   depuis un point unique au lieu de la peupler d'un bloc.
   Passe la vingtieme minute, le batiment se tait et la source se deplace sur
   le joueur : les nouveaux venus paraissent en couronne autour de lui, au-dela
   du plus large de ses plans de vue, de sorte que rien n'apparaisse jamais
   sous ses yeux. Le plafond ZCFG.cap borne l'ensemble : sans lui la partie
   s'ensable d'elle-meme au bout d'une heure. */
var LABT=0, LABC=0, LABN=0, RING_IN=1260, RING_OUT=1720;
/* La carte ou l'on est. Elle vaut un et ne bouge pas tant que le
   changement de carte n'est pas branche ; c'est elle qui pese le plus
   lourd dans la taille des hordes, de sorte que le lot suivant n'ait rien
   a modifier ici pour que la pression monte. */
var MAPN=1;
/* ---- LE BRUIT ----
   Un bruit est un evenement : un point, un rayon, rien de plus. Les pas n'en
   sont pas, ils sont continus et se mesurent sur l'allure : rien en marche
   silencieuse, 28 px en marche normale, le double au sprint. Un coup de feu
   porte le rayon de sa munition, deja chiffre, de 220 px pour du .22 a 1200
   pour du 12,7 ; une lame porte le sien.
   La competence Discretion resserre tout ce que l'on emet : x1,35 a zero,
   x1 a cinquante, x0,65 a cent.
   Les evenements du tour sont preleves d'un bloc au debut de updZombies, si
   bien qu'un gemissement pousse pendant la boucle n'est entendu qu'au tour
   suivant : aucun zombi n'est avantage par son rang dans la liste. */
var NOISE_WALK=28, NOISE_RUN=56, NOISE=[];
function noiseAt(x,y,r){ if(r>0) NOISE.push({x:x,y:y,r:r}); }
function stealth(o){ return 1.35-0.7*statEff(o,"astuce","discretion")/100; }
function footNoise(p){
    if(!p.mov||p.mode===0) return 0;
    return ((p.mode===2)?NOISE_RUN:NOISE_WALK)*stealth(p);
}
var ZTRAIT=[
 {k:"coriace",  n:"Coriace",   hp:1.45, spd:0.85, sta:1.15},
 {k:"vif",      n:"Vif",       hp:0.80, spd:1.55, sta:1.25},
 {k:"enfle",    n:"Enfle",     hp:1.80, spd:0.60, sta:0.70},
 {k:"efflanque",n:"Efflanque", hp:0.65, spd:1.25, sta:1.40},
 {k:"sourd",    n:"Sourd",     hp:1.00, spd:0.95, sta:1.00},
 {k:"frais",    n:"Frais",     hp:1.15, spd:1.20, sta:1.10}
];
var ZOMBIES=[];
function zSpawn(x,y){
    var t1=ZTRAIT[(rng()*ZTRAIT.length)|0];
    var t2=(rng()<0.35)?ZTRAIT[(rng()*ZTRAIT.length)|0]:null;
    var hm=t1.hp*(t2?t2.hp:1), sm=t1.spd*(t2?t2.spd:1), em=t1.sta*(t2?t2.sta:1);
    var z={x:x, y:y, face:(rng()<0.5)?-1:1, anim:rr(0,6), dead:0, hitT:0,
        maxhp:Math.round(ZCFG.hp*hm), spdm:sm, stam:em,
        traits:t2?[t1.k,t2.k]:[t1.k],
        stats:baseStats(), sec:baseSec(),
        slots:[null,null,null,null], name:"Zombi"};
    z.hp=z.maxhp; z.sta=Math.round(100*em);
    /* son etat : 0 inerte, 1 alerte par un bruit, 2 en chasse, 3 il a perdu.
       Son ancrage est le centre de la zone dont il ne sort pas tant qu'il
       n'a rien vu ni entendu. */
    z.st=0; z.a=rr(0,6.283);
    z.tx=x; z.ty=y; z.ax=x; z.ay=y; z.zr=rr(34,78);
    z.wt=rr(0,4); z.lost=0; z.cd=0; z.moan=0; z.mar=0; z.ma=0; z.dfl=0;
    /* ---- PLUS D'ARME DECORATIVE ----
       Un zombi sur cinq portait une arme tiree au hasard, purement peinte :
       elle ne se ramassait pas et contredisait le "rien" decide pour les
       zombis de laboratoire. Celui-ci ne porte donc plus rien du tout. Seul
       le zombi releve d'un mort garde une arme en main, et c'est alors la
       sienne, celle qu'on lui prendra sur son corps : ce qu'on voit est ce
       qu'on aura. */
    /* son sac est vide : celui-la sort du laboratoire, il n'a jamais eu
       de vie. Seul le zombi releve d'un mort herite d'un sac, et c'est
       updRise qui le lui passe. */
    z.inv=[null,null,null,null];
    ZOMBIES.push(z);
    return z;
}
function zSpeed(z){
    return (G.night?ZCFG.spdNight:ZCFG.spdDay)*z.spdm;
}
/* Voir : un cone de 180 degres devant lui, ZCFG.sight de portee, et un mur
   suffit a couper. Rien dans le dos, jamais. */
function zSees(z,x,y){
    var Math=DMATH;
    var s=ZCFG.sight;
    /* sous un tablier, le joueur n'est plus dans le monde qu'ils voient */
    if(pHidden()&&G.p.x===x&&G.p.y===y) return false;
    if(dist2(z.x,z.y,x,y)>s*s) return false;
    var a=datan2(y-z.y,x-z.x)-z.a;
    while(a>3.14159) a-=6.28318;
    while(a<-3.14159) a+=6.28318;
    if(Math.abs(a)>1.5708) return false;
    return los(z.x,z.y,x,y);
}
/* Entendre : le rayon du bruit, module par la finesse d'oreille de l'espece.
   Un mur n'arrete pas un son. */
function zHears(z,x,y,r){
    r*=ZCFG.hear/100;
    return r>0&&dist2(z.x,z.y,x,y)<r*r;
}
/* ---- LES BANDES ----
   Un zombi seul et une bande : deux manieres d'errer depuis le lot C, la ou
   il y en avait trois - le palier intermediaire, ou une bande de dix tournait
   autour de son propre centre sans jamais quitter son coin, a disparu. Les bandes se recomposent tous les ZGRP_T ticks par agregation de
   proche en proche : deux zombis a moins de ZCFG.grp sont du meme groupe, et
   la relation se propage. Le resultat ne depend que des positions et de
   l'ordre du tableau, donc le rejeu retrouve les memes bandes. */
var ZGRP_T=45;
function zRegroup(){
    var n=ZOMBIES.length, par=new Array(n), i, j, z, o, r2=ZCFG.grp*ZCFG.grp;
    for(i=0;i<n;i++) par[i]=i;
    function find(a){ while(par[a]!==a){ par[a]=par[par[a]]; a=par[a]; } return a; }
    for(i=0;i<n;i++){
        z=ZOMBIES[i]; if(z.dead) continue;
        for(j=i+1;j<n;j++){
            o=ZOMBIES[j]; if(o.dead) continue;
            if(dist2(z.x,z.y,o.x,o.y)<r2){
                var ra=find(i), rb=find(j); if(ra!==rb) par[ra]=rb;
            }
        }
    }
    var cnt={}, sx={}, sy={}, k;
    for(i=0;i<n;i++){
        z=ZOMBIES[i]; if(z.dead) continue;
        k=find(i);
        cnt[k]=(cnt[k]||0)+1; sx[k]=(sx[k]||0)+z.x; sy[k]=(sy[k]||0)+z.y;
    }
    for(i=0;i<n;i++){
        z=ZOMBIES[i]; if(z.dead) continue;
        k=find(i);
        z.gn=cnt[k]; z.gx=sx[k]/cnt[k]; z.gy=sy[k]/cnt[k];
    }
}
/* Devaler : le pied part sur la pente et le corps roule jusqu'en bas. On le
   repose juste au-dela de la base de la colline, sonne le temps d'un souffle. */
function zTumble(z){
    var Math=DMATH, q, h, a, r;
    for(q=0;q<HILLS.length;q++){
        h=HILLS[q];
        a=datan2(z.y-h.y,z.x-h.x);
        r=hillRad(h,a,h.rBase);
        if(dist2(z.x,z.y,h.x,h.y)>r*r) continue;
        z.x=clamp(h.x+Math.cos(a)*(r+9),16,CFG.WORLD-16);
        z.y=clamp(h.y+Math.sin(a)*(r+9),16,CFG.WORLD-16);
        z.cd=Math.max(z.cd,0.9); z.wt=0;
        return true;
    }
    return false;
}
/* Les corps se poussent. C'est ce qui fait qu'une riviere finit par etre
   franchie quand ils sont cinquante a s'y presser : celui de devant est
   pousse par ceux de derriere, meme si le courant l'emporte. Grille de
   voisinage pour ne pas comparer tout le monde a tout le monde. */
function zShove(){
    var n=ZOMBIES.length, r=ZCFG.push, r2=r*r, cs=r*2, i, j, q, z, o;
    if(n<2||r<=0) return;
    var grid={}, cx, cy, gx, gy, cell;
    for(i=0;i<n;i++){
        z=ZOMBIES[i]; if(z.dead) continue;
        cell=((z.x/cs)|0)+","+((z.y/cs)|0);
        (grid[cell]||(grid[cell]=[])).push(i);
    }
    for(i=0;i<n;i++){
        z=ZOMBIES[i]; if(z.dead) continue;
        cx=(z.x/cs)|0; cy=(z.y/cs)|0;
        for(gx=cx-1;gx<=cx+1;gx++) for(gy=cy-1;gy<=cy+1;gy++){
            cell=grid[gx+","+gy]; if(!cell) continue;
            for(q=0;q<cell.length;q++){
                j=cell[q]; if(j<=i) continue;
                o=ZOMBIES[j]; if(o.dead) continue;
                var dx=o.x-z.x, dy=o.y-z.y, d2=dx*dx+dy*dy;
                if(d2>=r2||d2<0.000001) continue;
                var d=DMATH.sqrt(d2), sh=(r-d)*0.5;
                dx/=d; dy/=d;
                var ax=z.x-dx*sh, ay=z.y-dy*sh, bx=o.x+dx*sh, by=o.y+dy*sh;
                if(!hitObstacle(ax,ay,6)){ z.x=ax; z.y=ay; }
                if(!hitObstacle(bx,by,6)){ o.x=bx; o.y=by; }
            }
        }
    }
}
/* Les scouts : ils vont et viennent autour de leur foyer sans jamais le
   quitter. */
function updCamps(dt){
    var Math=DMATH, p=G.p, i, j, cp, s, l, spd, dx, dy;
    for(i=0;i<CAMPS.length;i++){
        cp=CAMPS[i];
        if(dist2(cp.x,cp.y,p.x,p.y)>900*900) continue;
        for(j=0;j<cp.scouts.length;j++){
            s=cp.scouts[j];
            if(s.dead) continue;
            if(s.stop>0){ s.stop-=dt; collide(s,5); continue; }
            s.wt-=dt;
            if(s.wt<=0){ s.wt=rr(1.8,4.6);
                var a6=rr(0,6.283), d6=rr(12,58);
                s.tx=cp.x+Math.cos(a6)*d6; s.ty=cp.y+Math.sin(a6)*d6; }
            roamStep(s,34*npcSlow(s.x,s.y),dt,true);
        }
    }
}
/* ---- LES GENS DE METIER ----
   Meme allure que les scouts, mais chacun tourne autour de son propre
   batiment plutot qu'autour d'un foyer commun. */
function updWorkers(dt){
    var Math=DMATH, p=G.p, i, w, l, spd, dx, dy;
    for(i=0;i<WORKERS.length;i++){
        w=WORKERS[i];
        if(w.dead) continue;
        /* celui qui nous suit ne vaque plus : grpTick s'en occupe */
        if(w.recruited) continue;
        /* la releve a sa propre boucle : elle ne vaque pas, elle nettoie */
        if(w.rel) continue;
        /* Celui qui porte l'ordre de quarantaine est simule ou qu'il
           soit : le filtre des neuf cents pixels regarde son POSTE, et
           il a justement quitte son poste pour venir. */
        if(!w.pro&&dist2(w.hx,w.hy,p.x,p.y)>900*900) continue;
        if(w.stop>0){ w.stop-=dt; collide(w,5); continue; }
        w.wt-=dt;
        if(w.wt<=0){ w.wt=rr(2.0,5.0);
            var a8, d8, wx8, wy8, wt8;
            for(wt8=0;wt8<6;wt8++){
                a8=rr(0,6.283); d8=rr(8,w.rad);
                wx8=w.hx+Math.cos(a8)*d8; wy8=w.hy+Math.sin(a8)*d8;
                if(!inSea(wx8,wy8)) break;
            }
            if(!inSea(wx8,wy8)){ w.tx=wx8; w.ty=wy8; } }
        roamStep(w,30*npcSlow(w.x,w.y),dt,true);
    }
}
/* La silhouette qui va avec le metier. */
function workerSpr(w){
    if(w.job==="militaire") return armySpr;
    return (w.job==="pompier")?fireSpr:((w.job==="policier")?copSpr:medSpr);
}

/* ---- LES VIVANTS ----
   Tous les humains de la carte dans une seule liste, rangee dans une grille
   de HCELL pixels : un zombi n'a ainsi que ses cases voisines a examiner au
   lieu des quelques centaines d'habitants. Refaite tous les ZHUM_T ticks. */
var ZHUM_T=3, HCELL=136, ZFEAR=132, HUM=[], HGRID={};
function zHumans(){
    HUM=[]; HGRID={};
    var i, j, v, ab, fa, n, k;
    function add(o){ if(!o||o.dead||o.hidden) return; HUM.push(o); }
    for(i=0;i<VILLAGES.length;i++){ v=VILLAGES[i];
        for(j=0;j<v.villagers.length;j++) add(v.villagers[j]);
        if(v.soldier) add(v.soldier); }
    for(i=0;i<ARMYBASES.length;i++){ ab=ARMYBASES[i];
        for(j=0;j<ab.troops.length;j++) add(ab.troops[j]); }
    for(i=0;i<FARMS.length;i++){ fa=FARMS[i];
        for(j=0;j<fa.farmers.length;j++) add(fa.farmers[j]); }
    for(i=0;i<FISHERS.length;i++) add(FISHERS[i]);
    for(i=0;i<GUIDES.length;i++) add(GUIDES[i]);
    for(i=0;i<CAMPS.length;i++)
        for(j=0;j<CAMPS[i].scouts.length;j++) add(CAMPS[i].scouts[j]);
    for(i=0;i<WORKERS.length;i++) add(WORKERS[i]);
    for(i=0;i<HUM.length;i++){ n=HUM[i];
        k=((n.x/HCELL)|0)+","+((n.y/HCELL)|0);
        (HGRID[k]||(HGRID[k]=[])).push(i); }
}
/* Fuir : tant qu'un humain a peur, il court dans le dos du zombi qui l'a
   effraye, plus vite qu'il ne deambule, et ne retourne pas a ses affaires.
   Cette fuite-la ne contredit pas la decision de la v9 : ce qui avait ete
   retire, c'est la fuite devant le joueur. */
function updFlee(dt){
    var Math=DMATH, i, n, l, spd, ux, uy, nx, ny, sm;
    for(i=0;i<HUM.length;i++){
        n=HUM[i];
        if(n.dead) continue;
        sm=staMax(n);
        if(n.sta===undefined) n.sta=sm;
        if(!n.fear){
            /* il ne fuit plus : il reprend son souffle sur place */
            if(n.sta<sm) n.sta=Math.min(sm,n.sta+CFG.NPC_STA_REG*dt);
            continue;
        }
        n.fear-=dt;
        if(n.fear<=0){ n.fear=0; continue; }
        l=Math.hypot(n.fdx||0,n.fdy||1); if(l<0.001) l=1;
        ux=(n.fdx||0)/l; uy=(n.fdy||1)/l;
        /* Il court tant qu'il a du souffle, puis il continue de fuir au pas :
           c'est la, et pas avant, que le zombi le rattrape. */
        if(n.sta>0){
            n.sta=Math.max(0,n.sta-CFG.NPC_STA_FLEE*(1-wayBonus(n.x,n.y))*dt);
            spd=CFG.NPC_FLEE_SPD;
        } else spd=CFG.NPC_TIRED_SPD;
        spd*=npcSlow(n.x,n.y);
        nx=n.x+ux*spd*dt; ny=n.y+uy*spd*dt;
        /* Il entre dans l'eau, et c'est le seul cas ou un habitant le fait :
           talonne, il prefere la vase a la morsure. Il y subit les memes
           malus que le joueur, npcSlow s'en charge par inSwamp. */
        if(!hitObstacle(nx,ny,5)){ n.x=nx; n.y=ny; }
        else if(!stepAround(n,ux,uy,spd*dt,5,false)){
            if(!hitObstacle(nx,n.y,5)) n.x=nx;
            else if(!hitObstacle(n.x,ny,5)) n.y=ny;
        }
        n.face=(ux<0)?-1:1;
        n.anim=(n.anim||0)+dt*9;
        /* il ne repart pas vaquer tant qu'il a peur */
        n.tx=n.x+ux*130; n.ty=n.y+uy*130;
        n.wt=Math.max(n.wt||0,n.fear);
        n.stop=0;
    }
}
/* ---- LES VIVANTS AUSSI SE PRENNENT DANS LA PIERRE ----
   MESURE AVANT D'ECRIRE UNE LIGNE, et elle a renverse le diagnostic. On
   soupconnait la meme derive que chez les zombis de la v21 - le recouvrement
   qui s'accumule au fil des tours. C'est le contraire : sur trois graines,
   QUARANTE-DEUX PERSONNES EN MOYENNE SE TIENNENT DEJA DANS UN OBSTACLE AU
   PREMIER TOUR, avant que quiconque ait marche. La pose rate, le deplacement
   n'y est pour rien. Au bout de vingt-cinq minutes il n'en reste que
   vingt-trois par graine : collide() en degage la moitie en chemin - il
   pousse hors du cercle ou du rectangle de la case courante - et les autres
   ne bougeront plus jamais. Tous ceux qui restent dans la pierre sont
   immobiles, sans exception : 70 sur 70 au cumul.
   ON NE TOUCHE PAS A LA POSE. genMap fait deux mille deux cents lignes et
   l'en-tete dit de ne pas y entrer sans y etre force. L'extraction repare
   celle-la et n'importe quelle autre cause a venir, pour vingt lignes.
   LE BALAYAGE PASSE PAR HUM ET NON PAR LES BOUCLES DE DEAMBULATION. Elles
   s'arretent toutes a neuf cents pixels du joueur : un soldat coince a
   l'autre bout de la carte n'y serait jamais examine, et c'est justement la
   qu'ils sont - cinquante-sept troupes sur cinquante-sept hors de portee.
   ET IL EST DECALE, comme l'election de proie de zHunt : chacun tous les
   NSTK_T tours selon son rang, soit huit examens par tour pour deux cent
   quarante vivants. Une chose qui n'arrive qu'a la pose ne merite pas d'etre
   verifiee soixante fois par seconde.
   ON LUI REND SA LIBERTE EN MEME TEMPS QUE SA PLACE : wt a zero le fait
   choisir une nouvelle destination au tour suivant, sans quoi il repartirait
   droit vers un but qui peut se trouver dans le mur d'ou l'on vient de le
   sortir. */
var NSTK_T=30, NSTK_R=5;
/* QUI EST CHEZ LUI N'EST PAS ENCASTRE. Un compagnon reste a la base se tient
   au milieu du rectangle - c'est la seule place qu'on sache lui donner, le
   dedans n'ayant pas de coordonnees - et ce milieu est evidemment DANS un
   obstacle. L'extraction, devenue generale a la v24, le sortait donc du mur a
   chaque passage : il paraissait dehors, a decouvert, et la horde le mangeait
   pendant que ses camarades tiraient par la fenetre. Mesure avant correction :
   quatre compagnons sur quatre morts en quatre-vingt-dix secondes d'assaut,
   sur trois graines, alors qu'aucun n'avait passe la porte. */
function baseChezSoi(n){
    var b=BASE&&BASE.b;
    if(!b||!n||!n.recruited||n.sortie) return false;
    return n.x>=b.x&&n.x<=b.x+b.w&&n.y>=b.y&&n.y<=b.y+b.h;
}
function npcUnstick(){
    var i, n;
    for(i=0;i<HUM.length;i++){
        if(((i+G.tick)%NSTK_T)!==0) continue;
        n=HUM[i];
        if(!n||n.dead) continue;
        if(!hitObstacle(n.x,n.y,NSTK_R)) continue;
        if(baseChezSoi(n)) continue;
        if(rockOut(n,NSTK_R)){ n.stop=0; n.wt=0; }
    }
}
/* ---- LE PLUS PROCHE VIVANT ----
   Sans grille et sans portee : on veut LE plus proche de toute la carte, et
   non le plus proche des neuf cases voisines. Un zombi isole a du chemin a
   faire et il doit savoir vers ou.

   LE COUT EST TENU PAR LE DECALAGE, pas par une portee. Deux cent trente
   vivants fois deux cent soixante zombis serait insoutenable a chaque tour ;
   reparti sur ZHUNT_T tours, cela fait six zombis par tour et l'on ne le
   sent pas. On garde la REFERENCE et non les coordonnees : la proie bouge, et
   suivre un point ou elle se tenait il y a une seconde donnerait un zombi qui
   marche vers du vide.

   L'ordre de HUM decide des egalites, et il est reproductible. */
var ZHUNT_T=45;
function zHunt(z){
    var bd=1e9, bo=null, i, n, d;
    if(!G.inside){
        bd=dist2(z.x,z.y,G.p.x,G.p.y); bo=G.p;
    }
    for(i=0;i<HUM.length;i++){
        n=HUM[i];
        if(n.dead||n.gone||n.hidden) continue;
        d=dist2(z.x,z.y,n.x,n.y);
        if(d<bd){ bd=d; bo=n; }
    }
    z.hu=bo;
}
/* ================= SE DECOINCER =================
   Un zombi qui errait avancait de sept centiemes de pixel par image. Des que
   son corps chevauchait un mur d'un cheveu, le test "ma prochaine position
   est-elle libre ?" echouait DANS TOUTES LES DIRECTIONS, puisque la prochaine
   position etait a peu pres la sienne. Il ne pouvait plus jamais en sortir.
   Mesure avant correction : a la vingt-cinquieme minute, quatre-vingt-sept
   zombis sur cent quatre-vingt-un ne bougeaient plus, dont soixante-quatre
   pris dans la pierre. Pres de la moitie de la population etait statique.

   DEUX REMEDES, PARCE QU'IL Y A DEUX FACONS D'ETRE COINCE.

   PRIS DANS LA PIERRE : sa propre position est dans un obstacle. Aucune regle
   de deplacement ne l'en sortira, puisqu'elles comparent toutes la position
   d'arrivee a un mur qu'il occupe deja. On le POUSSE dehors, par cercles
   croissants, a la premiere place degagee. C'est le seul endroit du jeu ou
   l'on deplace quelqu'un sans qu'il ait marche, et c'est assume : il n'aurait
   jamais du y etre.

   AU FOND D'UNE POCHE : il avance vraiment, mais vers un but qu'un mur
   concave lui interdit, et il oscille. La regle est celle du joueur : s'il
   n'a pas parcouru ZSTK_MIN pixels en ZSTK_T secondes, il prend un cap de
   cote sur ZSTK_D pixels, a gauche puis a droite alternativement, et
   recommence tant que ca ne passe pas. Rien n'est tire au sort - le cote
   alterne sur un drapeau - donc le rejeu retrouve le meme detour. */
var ZSTK_T=5, ZSTK_MIN=3, ZSTK_D=40, ZSTK_DUR=6;
/* L'EXTRACTION, ECRITE UNE SEULE FOIS. Elle servait aux zombis depuis la
   v21 ; les vivants s'en servent aussi depuis npcUnstick. On pousse par
   cercles croissants, seize caps dans un ordre fixe, a la premiere place
   degagee - rien n'est tire au sort, le rejeu retrouve la meme place. */
function rockOut(e,rad){
    var Math9=DMATH, k, r, a, x, y;
    for(r=8;r<=64;r+=8)
        for(k=0;k<16;k++){
            a=k*0.3926990816987241;
            x=e.x+Math9.cos(a)*r; y=e.y+Math9.sin(a)*r;
            if(x<24||y<24||x>CFG.WORLD-24||y>CFG.WORLD-24) continue;
            if(hitObstacle(x,y,rad)||inSea(x,y)) continue;
            e.x=x; e.y=y;
            return true;
        }
    return false;
}
function zPierre(z){
    if(!rockOut(z,6)) return false;
    z.stt=0; z.sx=z.x; z.sy=z.y; z.dtg=0;
    return true;
}
/* Le detour : un quart de tour par rapport au cap qu'il voulait prendre. */
function zDetour(z){
    var Math9=DMATH;
    var ang=datan2(z.ty-z.y,z.tx-z.x);
    z.dsd=z.dsd?-z.dsd:1;
    var a=ang+z.dsd*1.5707963267948966;
    z.dtx=z.x+Math9.cos(a)*ZSTK_D;
    z.dty=z.y+Math9.sin(a)*ZSTK_D;
    z.dtg=ZSTK_DUR;
}
/* Appele une fois par tour et par zombi, juste avant qu'il avance. */
function zUnstick(z,dt){
    if(z.dtg>0){
        z.dtg-=dt;
        z.tx=z.dtx; z.ty=z.dty;
        if(z.dtg<=0){ z.dtg=0; z.stt=0; z.sx=z.x; z.sy=z.y; }
        return;
    }
    if(z.sx===undefined){ z.sx=z.x; z.sy=z.y; z.stt=0; return; }
    z.stt=(z.stt||0)+dt;
    if(z.stt<ZSTK_T) return;
    var d=DMATH.hypot(z.x-z.sx,z.y-z.sy);
    z.stt=0; z.sx=z.x; z.sy=z.y;
    if(d>=ZSTK_MIN) return;
    /* il n'a pas avance : d'abord la pierre, ensuite la poche */
    if(hitObstacle(z.x,z.y,6)){ zPierre(z); return; }
    zDetour(z);
}
/* Un tour de zombi : percevoir, decider, avancer, mordre. */
function updZombies(dt){
    var Math=DMATH;
    var p=G.p, snap=NOISE, i, k, z, spd, l;
    NOISE=[];
    if((G.tick%ZGRP_T)===0||ZOMBIES.length&&ZOMBIES[0].gn===undefined) zRegroup();
    if((G.tick%ZHUM_T)===0||!HUM.length) zHumans();
    var fr=G.inside?0:footNoise(p);
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(z.dead) continue;
        /* --- le regime des lointains ---
           Un zombi hors de portee du regard n'a pas besoin d'etre suivi
           soixante fois par seconde : il avance par pas de trois tours, d'un
           pas trois fois plus long. Le partage suit la distance au joueur,
           elle-meme reproductible, et le rang dans la liste : le rejeu
           retrouve donc le meme decoupage. C'est ce qui permet d'en tenir
           plusieurs centaines sans sortir du budget d'une image. */
        var far=dist2(z.x,z.y,p.x,p.y)>ZCFG.far*ZCFG.far;
        if(far&&((i+G.tick)%3)!==0) continue;
        var sdt=far?dt*3:dt;
        if(z.cd>0) z.cd-=sdt;
        if(z.moan>0) z.moan-=sdt;
        if(z.dfl>0) z.dfl-=sdt;
        z.wt-=sdt;
        /* --- percevoir ---
           La proie n'est plus le seul joueur : tout ce qui vit compte. On ne
           regarde que les neuf cases voisines de la grille des vivants. */
        var bd=1e9, vic=null;
        if(!G.inside&&zSees(z,p.x,p.y)){ bd=dist2(z.x,z.y,p.x,p.y); vic=p; }
        var hcx=(z.x/HCELL)|0, hcy=(z.y/HCELL)|0, gx, gy, cell, q, hn, hd;
        for(gx=hcx-1;gx<=hcx+1;gx++) for(gy=hcy-1;gy<=hcy+1;gy++){
            cell=HGRID[gx+","+gy]; if(!cell) continue;
            for(q=0;q<cell.length;q++){
                hn=HUM[cell[q]];
                if(hn.dead) continue;
                hd=dist2(z.x,z.y,hn.x,hn.y);
                /* De pres il epouvante, qu'il ait ete vu ou non - MAIS PAS
                   AVANT L'ORDRE DE QUARANTAINE. Les premiers zombis passent
                   au milieu des gens sans les alarmer : personne ne sait
                   encore ce que c'est, et c'est justement ce qui les rend
                   dangereux. */
                /* Le MORT RELEVE epouvante DES qu'il se dresse, meme avant la
                   quarantaine : on reconnait les habits d'un voisin et l'on
                   voit ce qui lui est arrive. Le zombi de laboratoire, lui,
                   n'effraie qu'une fois la quarantaine declaree. Un habitant
                   arme ne fuit pas - il fait face, c'est civFight qui s'en
                   charge. */
                if(hd<ZFEAR*ZFEAR&&(z.turned||proFear())&&!hn.armed){
                    hn.fear=1.6; hn.fdx=hn.x-z.x; hn.fdy=hn.y-z.y; }
                if(hd<bd&&zSees(z,hn.x,hn.y)){ bd=hd; vic=hn; }
            }
        }
        var see=!!vic;
        z.vic=vic;
        var heard=null;
        if(!G.inside&&fr>0&&zHears(z,p.x,p.y,fr)) heard={x:p.x,y:p.y};
        for(k=0;k<snap.length&&!heard;k++)
            if(zHears(z,snap[k].x,snap[k].y,snap[k].r))
                heard={x:snap[k].x,y:snap[k].y};
        /* --- decider --- */
        if(see){
            /* il gemit en decouvrant sa proie, et les siens l'entendent a
               deux portees de pistolet */
            if(z.st!==2&&z.moan<=0){
                noiseAt(z.x,z.y,ZCFG.moan); z.moan=4;
                if(dist2(z.x,z.y,p.x,p.y)<460*460) sBoss();
            }
            z.st=2; z.tx=vic.x; z.ty=vic.y; z.lost=0;
        } else if(z.st===2){
            /* la proie lui echappe : il court au dernier point connu, puis
               fouille les environs de 10 a 30 s avant de se rendormir */
            z.st=3; z.lost=rr(10,30); z.wt=0;
        } else if(heard&&z.st!==3){
            z.st=1; z.tx=heard.x; z.ty=heard.y;
        }
        if(z.st===1&&dist2(z.x,z.y,z.tx,z.ty)<18*18){ z.st=3; z.lost=rr(10,30); z.wt=0; }
        if(z.st===3){
            z.lost-=sdt;
            if(z.wt<=0){
                z.wt=rr(1.2,3.4);
                var wa=rr(0,6.283), wd=rr(18,64);
                z.tx=z.x+Math.cos(wa)*wd; z.ty=z.y+Math.sin(wa)*wd;
            }
            if(z.lost<=0){ z.st=0; z.ax=z.x; z.ay=z.y; z.wt=0; }
        }
        /* --- la marche des nouveaux venus ---
           Trente secondes droit devant, puis l'arret : le point d'arrivee
           devient son ancrage et il erre desormais autour de lui. La moindre
           chose vue ou entendue met fin a la marche. */
        if(z.mar>0){
            if(z.st!==0) z.mar=0;
            else {
                z.mar-=sdt;
                if(z.mar<=0){ z.mar=0; z.ax=z.x; z.ay=z.y; z.wt=0; }
                else {
                    /* le cap devie n'est qu'un detour : des que la voie est
                       degagee devant le cap d'origine, il le reprend. Sans ce
                       retour il tournait autour de l'obstacle au lieu de le
                       contourner, et revenait parfois s'enfermer dans la
                       cloture du laboratoire. */
                    if(z.dfl<=0&&z.ma!==z.ma0&&
                       !hitObstacle(z.x+Math.cos(z.ma0)*26,
                                    z.y+Math.sin(z.ma0)*26,6)) z.ma=z.ma0;
                    z.tx=z.x+Math.cos(z.ma)*4000;
                    z.ty=z.y+Math.sin(z.ma)*4000;
                    z.wt=1;
                }
            }
        }
        if(z.st===0&&z.wt<=0){
            var gn=z.gn||1;
            if(gn>1){
                /* ---- DES QU'ILS SONT DEUX, ILS TRAVERSENT LA CARTE ----
                   Le seuil etait a onze : une bande de dix tournait autour de
                   son propre centre sans jamais quitter son coin, et seule une
                   horde se mettait en route. Deux suffisent desormais. Ce qui
                   les fait se rencontrer sur le chemin les fait grossir, et
                   une bande qui grossit ne se fixe jamais. */
                z.wt=rr(5,11);
                z.tx=rr(120,CFG.WORLD-120); z.ty=rr(120,CFG.WORLD-120);
            } else {
                /* isole et sans personne a rejoindre : il derive tres
                   lentement autour de son ancrage. C'est le repli, pas
                   l'ordinaire - voir juste dessous. */
                z.wt=rr(2.5,6.5);
                var ga=rr(0,6.283), gd=rr(0,z.zr);
                z.tx=z.ax+Math.cos(ga)*gd; z.ty=z.ay+Math.sin(ga)*gd;
            }
        }
        /* ---- SEUL, IL MARCHE SUR LE PLUS PROCHE VIVANT ----
           Celui qui sort du laboratoire ne connait qu'une chose : la personne
           la plus proche, qu'il la voie ou non. Il n'attend pas de l'entendre
           ni de l'apercevoir - c'est ce qui le fait sortir de sa zone et
           descendre vers les bourgs, ou il finira par en rencontrer un autre.

           CELA ECRASE LA DERIVE CI-DESSUS, sans la remplacer : les deux
           branches du bloc precedent tirent chacune trois valeurs, le flux ne
           depend donc pas de qui a une proie et qui n'en a pas. Quand il n'y
           a plus personne de vivant, la derive reprend seule.

           L'election se refait tous les ZHUNT_T tours, decalee par le rang du
           zombi. ZHUNT_T est un multiple de trois : sans cela, un zombi au
           regime des lointains - qui ne joue qu'un tour sur trois - pourrait
           ne jamais tomber sur le tour d'election. */
        if(z.st===0&&(z.gn||1)<=1){
            if(z.hu===undefined||((G.tick+i)%ZHUNT_T)===0||
               (z.hu&&(z.hu.dead||z.hu.gone))) zHunt(z);
            if(z.hu){ z.tx=z.hu.x; z.ty=z.hu.y; }
        }
        /* --- le terrain, une question sur trois ---
           inSwamp, inGrass, onRoad et onSlope parcourent chacun leurs tables.
           Les reposer pour soixante zombis a chaque tick coutait le tiers du
           budget d'une image. La reponse est gardee trois tours : cela ne se
           voit pas, et le rythme ne depend que du numero de tour et du rang
           dans la liste, donc le rejeu retrouve les memes reponses. */
        /* --- le terrain, rarement ---
           inSwamp, inGrass, onRoad, onSlope et flowAt parcourent chacun leurs
           tables : c'etait les deux tiers du cout des zombis. Chaque zombi
           porte son propre compteur, ce qui evite que cet etalement tombe en
           phase avec celui des lointains. A 44 px/s, six tours ne deplacent
           que trois pixels : la reponse gardee reste juste. */
        z.tc=(z.tc||0)+1;
        if(z.ter===undefined||z.tc>=6){
            z.tc=0;
            z.ter=npcSlow(z.x,z.y);
            var fq=flowAt(z.x,z.y);
            z.fl=(fq&&!onCrossing(z.x,z.y))?fq:null;
            z.sl2=(onSlope(z.x,z.y)&&!onRoad(z.x,z.y,0))?1:0;
        }
        /* --- se decoincer, puis avancer ---
           ON LE FAIT ICI ET PAS AILLEURS : apres que tout ce qui pose une
           cible l'ait posee, avant qu'il ne marche. Un detour engage ecrase
           donc la cible du tour, quelle qu'elle soit, et rien ne vient la
           reecrire derriere. */
        zUnstick(z,sdt);
        var base=zSpeed(z);
        /* Une bande avance franchement. Un solitaire qui a quelqu'un a
           rejoindre avance presque autant - il a un but, meme s'il ne court
           pas encore ; sans personne, il vegete comme avant. */
        if(z.st===0&&!z.mar){ var gs=z.gn||1;
            base*=(gs>1)?0.55:(z.hu?0.50:0.22); }
        else if(z.st===3) base*=0.5;
        var ddx=z.tx-z.x, ddy=z.ty-z.y;
        l=Math.hypot(ddx,ddy);
        if(l>1.5){
            spd=base*z.ter;
            ddx/=l; ddy/=l;
            z.a=datan2(ddy,ddx);
            z.face=(ddx<0)?-1:1;
            var nx=z.x+ddx*spd*sdt, ny=z.y+ddy*spd*sdt;
            if(!hitObstacle(nx,ny,6)){ z.x=nx; z.y=ny; }
            else {
                /* en marche il devie son cap (zSteer, qui revient au cap
                   d'origine des que la voie s'ouvre) ; en chasse ou en traque
                   il contourne directement le mur, du meme cote a chaque fois,
                   au lieu de glisser le long de la facade sans jamais tourner. */
                var moved=false;
                if(z.mar>0){ if(z.dfl<=0){ zSteer(z); z.dfl=0.30; } }
                else moved=stepAround(z,ddx,ddy,spd*sdt,6,false);
                if(!moved){
                    if(!hitObstacle(nx,z.y,6)) z.x=nx;
                    else if(!hitObstacle(z.x,ny,6)) z.y=ny;
                    else z.wt=0;
                }
            }
            z.anim+=sdt*(z.st===2?9:3.5);
            z.x=clamp(z.x,16,CFG.WORLD-16);
            z.y=clamp(z.y,16,CFG.WORLD-16);
        }
        /* --- le courant et la pente --- */
        /* une riviere l'emporte deux fois plus vite que nous : il ne la
           traverse pas de son plein gre, il faut que ceux de derriere le
           poussent. Un pont, un gue ou un quai annulent la derive. */
        var fl=z.fl;
        if(fl){
            z.x=clamp(z.x+fl.fx*CFG.FLOW*(ZCFG.flowPc/100)*sdt,16,CFG.WORLD-16);
            z.y=clamp(z.y+fl.fy*CFG.FLOW*(ZCFG.flowPc/100)*sdt,16,CFG.WORLD-16);
        }
        /* en abordant une pente, montante ou descendante, il a une chance sur
           trois de partir a la renverse et de rouler jusqu'en bas */
        if(z.sl2&&!z.sl&&rng()<ZCFG.fallPc/100) zTumble(z);
        z.sl=z.sl2;
        /* --- mordre --- */
        var vc=z.vic;
        if(vc&&!vc.dead&&z.cd<=0&&
           dist2(z.x,z.y,vc.x,vc.y)<ZCFG.reach*ZCFG.reach){
            /* UNE SEULE MORSURE, QUEL QUE SOIT CELUI QUI LA RECOIT. Le joueur
               avait sa Parade et sa contagion, les autres encaissaient a nu :
               c'etait deux jeux. A l'abri - dedans pour le joueur, chez soi
               pour un habitant - les dents n'atteignent personne. */
            var isP=(vc===p), abri=isP?G.inside:(vc.inb||vc.hidden);
            if(!abri){
                z.cd=ZCFG.bite;
                /* Parade : la chance d'esquiver le coup qui part. Une sur
                   vingt les bras ballants, une sur trois a cent - jamais
                   plus, un zombi finit toujours par mordre. Le tirage se
                   fait meme esquive : le flux sim ne saute jamais. */
                var esq=rng()<dodgeChance(vc);
                /* le tirage de degats se fait aussi : esquiver ne doit pas
                   decaler le flux sim d'un seul nombre */
                var dgt=rr(ZCFG.dmgMin,ZCFG.dmgMax);
                if(esq){
                    if(isP) logMsg("Vous esquivez la morsure.","jday");
                    secBump(vc,"parade",2);
                } else {
                    hurt(vc,dgt,0,1);
                    /* chaque morsure qui porte peut passer la maladie ;
                       une morsure esquivee ne transmet rien, les dents
                       n'ont pas touche. Seuls ceux dont on tient la fiche
                       la portent : un passant n'a personne pour la lui
                       compter, et il ne survit pas assez pour la sentir. */
                    if(!vc.dead&&(isP||vc.recruited)) malCatch(vc,"morsure");
                }
            }
        }
    }
    /* Discretion : chaque seconde passee a portee de vue d'un zombi sans
       qu'il nous ait repere vaut un usage. C'est le seul apprentissage qui se
       fait a ne rien faire - ou plutot, a bien le faire. */
    G.p.disT=(G.p.disT||0)+dt;
    if(G.p.disT>=1){
        G.p.disT-=1;
        var zi9, z9, pres9=false;
        for(zi9=0;zi9<ZOMBIES.length;zi9++){
            z9=ZOMBIES[zi9];
            if(z9.dead||z9.vic===G.p) continue;
            if(dist2(z9.x,z9.y,G.p.x,G.p.y)<ZCFG.sight*ZCFG.sight){ pres9=true; break; }
        }
        if(pres9) secBump(G.p,"discretion",1);
    }
    zShove();
}
function zPopulate(){
    ZOMBIES=[];
    var tries=0, placed=0;
    while(placed<ZCFG.n&&tries<4000){
        tries++;
        var x=rr(160,CFG.WORLD-160), y=rr(160,CFG.WORLD-160), i, ok=true;
        if(hitObstacle(x,y,10)||inSwamp(x,y)||inSea(x,y)) continue;
        for(i=0;i<VILLAGES.length&&ok;i++)
            if(dist2(x,y,VILLAGES[i].x,VILLAGES[i].y)<420*420) ok=false;
        for(i=0;i<FARMS.length&&ok;i++)
            if(dist2(x,y,FARMS[i].x,FARMS[i].y)<220*220) ok=false;
        if(!ok) continue;
        if(dist2(x,y,CFG.WORLD/2,CFG.WORLD/2)<300*300) continue;
        zSpawn(x,y); placed++;
    }
}
function zAlive(){
    var n=0, i;
    for(i=0;i<ZOMBIES.length;i++) if(!ZOMBIES[i].dead) n++;
    return n;
}
/* Marcher droit devant : un zombi frais ne cherche rien, il s'eloigne. Tant
   que son compteur tourne il vise un point tres en avant dans sa direction ;
   au bout, il s'arrete et fait de la ou il est son nouvel ancrage. Voir ou
   entendre quelque chose interrompt la marche sur-le-champ. */
function zMarch(z,ang,t){
    z.mar=t; z.ma=ang; z.ma0=ang; z.a=ang;
    /* le cote qu'il choisit pour contourner, une fois pour toute la marche :
       en tirant un cap neuf a chaque butee il pietinait sur place */
    z.dsg=(rng()<0.5)?-1:1;
    z.face=(DMATH.cos(ang)<0)?-1:1;
    z.tx=z.x+DMATH.cos(ang)*4000; z.ty=z.y+DMATH.sin(ang)*4000;
}
/* Contourner : bute contre un tronc, il ne tire pas un cap au hasard, il
   ouvre l'eventail autour de son cap d'origine et prend le premier ecart
   degage, en preferant le cote qu'il s'est choisi. Rien n'est tire ici : le
   rejeu retrouve le meme detour. */
function zSteer(z){
    var Math=DMATH, sg=z.dsg||1, k, a;
    for(k=1;k<=8;k++){
        a=z.ma0+sg*k*0.42;
        if(!hitObstacle(z.x+Math.cos(a)*17,z.y+Math.sin(a)*17,6)){ z.ma=a; return; }
        a=z.ma0-sg*k*0.42;
        if(!hitObstacle(z.x+Math.cos(a)*17,z.y+Math.sin(a)*17,6)){ z.ma=a; return; }
    }
    z.ma=z.ma0+3.14159;
}
/* ---- AVANCER EN CONTOURNANT ----
   Le meme geste pour tout le monde. On tente le pas droit vers le but ; s'il
   bute, on ouvre un eventail autour du cap voulu et l'on prend le premier
   ecart degage, en gardant TOUJOURS LE MEME COTE (o.dsg) - c'est ce qui fait
   faire le tour d'un mur au lieu de le raser en glissant. Le cote est fige une
   fois pour toutes a partir d'une valeur stable de position, donc rien n'est
   tire au sort et le rejeu est identique. wet : vrai pour qui n'entre jamais
   dans l'eau (les habitants), faux pour les autres. Renvoie vrai si l'entite
   a bouge. */
function stepClear(x,y,r,wet){ return !hitObstacle(x,y,r)&&!(wet&&inSea(x,y)); }
function stepAround(o,dx,dy,step,r,wet){
    var Math=DMATH, l=Math.hypot(dx,dy);
    if(l<1e-4) return false;
    dx/=l; dy/=l;
    var nx=o.x+dx*step, ny=o.y+dy*step;
    if(stepClear(nx,ny,r,wet)){ o.x=nx; o.y=ny; return true; }
    if(o.dsg===undefined) o.dsg=(((o.x+o.y)|0)&1)?1:-1;
    var base=Math.atan2(dy,dx), sg=o.dsg, k, a, cx, cy;
    for(k=1;k<=6;k++){
        a=base+sg*k*0.42; cx=o.x+Math.cos(a)*step; cy=o.y+Math.sin(a)*step;
        if(stepClear(cx,cy,r,wet)){ o.x=cx; o.y=cy; return true; }
        a=base-sg*k*0.42; cx=o.x+Math.cos(a)*step; cy=o.y+Math.sin(a)*step;
        if(stepClear(cx,cy,r,wet)){ o.x=cx; o.y=cy; return true; }
    }
    /* Dernier recours, et le plus doux : glisser le long de la paroi, un axe a
       la fois. Quand tout l'eventail est bouche, on ne reste plus plante contre
       le mur - on le longe du cote qui reste libre. */
    if(Math.abs(dx)>1e-3&&stepClear(o.x+dx*step,o.y,r,wet)){ o.x+=dx*step; return true; }
    if(Math.abs(dy)>1e-3&&stepClear(o.x,o.y+dy*step,r,wet)){ o.y+=dy*step; return true; }
    return false;
}
