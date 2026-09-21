"use strict";
/* ================================================================
   TUAZ - 12-groupe.js
   Le groupe : le recrutement, le suivi, les blesses, les six consignes
   et les coupures de scenario.
   (lignes 13211 a 14366 du mono-fichier d'origine)
   ================================================================ */
/* ================= LE GROUPE =================
   Ceux qui ont dit oui marchent derriere. Le groupe n'est pas une liste a
   part : chacun reste dans son bourg d'origine, avec son nom, son metier et
   son sac. Seul le drapeau recruted change ce qu'il fait de ses journees -
   et ce meme drapeau est celui que lit la montee des aptitudes, de sorte
   qu'un compagnon progresse comme vous.

   L'ATTACHEMENT. On ne devient pas ami en un jour. Chacun porte un compteur
   qui monte de quatre facons : le temps passe ensemble, les zombis tombes a
   portee de lui, ce qu'on lui donne, et les conversations. Les paliers
   changent le nom qu'on lui donne - et rien d'autre pour l'instant : ce que
   l'amitie vaudra reste a ecrire. */
/* Les paliers sont volontairement loin. Un jour de jeu dure cinq minutes et
   ne rapporte qu'une trentaine de points au simple fait de marcher ensemble :
   on ne devient pas l'ami de quelqu'un parce qu'on a passe l'apres-midi a
   cote de lui. Ce qui compte vraiment, c'est ce qu'on traverse ensemble et
   ce qu'on se dit - et se raconter ne vaut qu'une fois par jour, sinon il
   suffirait de marteler la meme question pour gagner un rang. */
var GRP_RANKS=[{s:0,    n:"recrue"},
               {s:250,  n:"copain"},
               {s:700,  n:"compagnon"},
               {s:1600, n:"ami"},
               {s:3200, n:"ami de confiance"}];
var GRP_SLOT=22;
/* ---- LE GROUPE ET L'EQUIPE ----
   Deux choses differentes. Le GROUPE est le registre : tous ceux qui ont dit
   oui, qu'ils soient a la base, en course ou avec vous. L'EQUIPE est ceux qui
   sortent, et elle se refait a chaque depart.
   Recruter quelqu'un dans la nature, c'est le mettre dans les deux d'un coup :
   il n'y a pas de base ou le deposer, il suit. Rentrer chez soi dissout
   l'equipe sans toucher au registre - on repart en choisissant. */
function eqList(){
    var L=grpList(), R=[], i;
    for(i=0;i<L.length;i++) if(L[i].out&&!L[i].miss) R.push(L[i]);
    return R;
}
function eqClear(){
    var L=grpList(), i;
    for(i=0;i<L.length;i++) L[i].out=0;
}
/* On part avec qui l'on veut, blesses compris : c'est au joueur de decider
   s'il risque la vie d'un homme mal en point, pas au jeu de le lui interdire.
   Si tout le monde boite, il faudra bien sortir quand meme. Le seul qu'on ne
   peut pas emmener est celui qui n'est pas la - parti en course. */
function eqSet(sel){
    var L=grpList(), i, n=0;
    for(i=0;i<L.length;i++){
        L[i].out=(sel&&sel.indexOf(L[i])>=0&&!L[i].miss)?1:0;
        if(L[i].out) n++;
    }
    return n;
}
/* ---- QUI LE REGISTRE SAIT TENIR ----
   grpList ne lit que les habitants des bourgs et les gens de metier. Le
   recrutement, lui, se proposait a tout le monde : un pecheur, un fermier,
   un soldat ou une troupe acceptaient, le journal l'annoncait, et il ne se
   passait rien - ils ne rejoignaient aucune liste et ne suivaient personne.
   On ne le leur propose donc plus, faute de pouvoir les tenir. */
function grpJoinable(n){
    var i, j, v;
    if(!n||n.dead) return false;
    if(WORKERS.indexOf(n)>=0) return true;
    for(i=0;i<VILLAGES.length;i++){
        v=VILLAGES[i];
        for(j=0;j<v.villagers.length;j++) if(v.villagers[j]===n) return true;
    }
    return false;
}
function grpList(){
    var L=[], i, j, v;
    for(i=0;i<VILLAGES.length;i++){
        v=VILLAGES[i];
        for(j=0;j<v.villagers.length;j++)
            if(v.villagers[j].recruited&&!v.villagers[j].dead) L.push(v.villagers[j]);
    }
    for(i=0;i<WORKERS.length;i++)
        if(WORKERS[i].recruited&&!WORKERS[i].dead) L.push(WORKERS[i]);
    L.sort(function(a,b){ return (b.aff||0)-(a.aff||0); });
    return L;
}
/* Le rang par son numero, de 0 a 4 : c'est lui que les missions lisent. */
function grpRankI(n){
    var s=(n&&n.aff)||0, r=0, i;
    for(i=0;i<GRP_RANKS.length;i++) if(s>=GRP_RANKS[i].s) r=i;
    return r;
}
function grpRank(n){ return GRP_RANKS[grpRankI(n)].n; }
/* Ce qui manque pour le palier suivant, pour que la fiche puisse le dire. */
function grpNext(n){
    var s=(n&&n.aff)||0, i;
    for(i=0;i<GRP_RANKS.length;i++) if(s<GRP_RANKS[i].s) return GRP_RANKS[i];
    return null;
}
function grpBump(n,v){
    if(!n||!n.recruited) return;
    n.aff=(n.aff||0)+v;
}
/* Le temps passe ensemble, compte a la seconde. */
function grpTime(dt){
    var L=grpList(), i;
    if(!L.length) return;
    GRPT=(GRPT||0)+dt;
    if(GRPT<10) return;
    GRPT-=10;
    /* dix secondes cote a cote valent un point : un jour entier en vaut
       trente, et il en faut deux cent cinquante pour cesser d'etre une recrue */
    /* on ne se rapproche pas de quelqu'un qu'on a perdu de vue */
    for(i=0;i<L.length;i++) if(!L[i].lst) grpBump(L[i],1);
}
var GRPT=0;
/* Un zombi tombe pres d'un compagnon : il y etait, ca compte. */
function grpKill(x,y){
    var L=grpList(), i;
    for(i=0;i<L.length;i++)
        if(dist2(L[i].x,L[i].y,x,y)<220*220) grpBump(L[i],8);
}
/* La place de chacun dans le sillage : deux colonnes, en quinconce. */
function grpSpot(n,k){
    var p=G.p, a=Math.atan2(p.fy||0,p.fx||1)+Math.PI;
    var rang=1+((k/2)|0), cote=(k%2)?1:-1;
    var d=GRP_SLOT*rang;
    return {x:p.x+Math.cos(a)*d+Math.cos(a+1.5708)*cote*14,
            y:p.y+Math.sin(a)*d*0.7+Math.sin(a+1.5708)*cote*10};
}
/* ---- LE POINT DE RALLIEMENT DOIT EXISTER ----
   grpSpot pose une place en quinconce derriere le joueur. Quand celui-ci
   longe une facade, cette place tombe DANS le batiment : mesure sur quatre
   cents positions le long de vrais murs, une fois sur neuf. Le compagnon
   poussait alors contre la pierre jusqu'a ce qu'on bouge, sans que rien ne
   le signale. On cherche donc le point degage le plus proche, en spirale
   autour de la place theorique. Rien n'est tire : le rejeu retrouve le meme
   point. */
function grpFree(x,y){
    var Math=DMATH, d, k, a, px, py;
    if(!hitObstacle(x,y,5)) return {x:x,y:y};
    for(d=9;d<=54;d+=9)
        for(k=0;k<12;k++){
            a=k*0.5235987755982988;
            px=x+Math.cos(a)*d; py=y+Math.sin(a)*d;
            if(!hitObstacle(px,py,5)) return {x:px,y:py};
        }
    return {x:x,y:y};
}
/* ---- LE COTE QU'IL CHOISIT POUR CONTOURNER ----
   Le meme principe que zSteer, qui sert aux zombis depuis la v12 : on ouvre
   un eventail autour du cap voulu et l'on prend le premier ecart degage. Le
   cote se decide une seule fois, au debut du detour, et se garde tant qu'on
   longe : en le retirant a chaque pas, on hesitait devant chaque angle et
   l'on pietinait. Il se libere des que la voie redevient franche. */
/* Un cap est degage si TOUT le segment l'est, et non son seul bout : une
   sonde qui ne regarde que son extremite saute par-dessus le mur et atterrit
   de l'autre cote, ou c'est libre. Elle rendait alors un cap qui rentrait
   droit dans la pierre - le contournement etait pire que le glissement qu'il
   remplacait. On echantillonne donc trois points le long du rayon. */
var grpAvoidWet=true;
function grpClear(n,a,r,st){
    var Math=DMATH, cx=Math.cos(a), cy=Math.sin(a), d;
    /* Une voie est barree par un mur, et par l'eau quand on cherche a
       l'eviter (grpAvoidWet) : un compagnon ne patauge pas pour nous suivre,
       a moins que nous y soyons deja. */
    function bad(x,y){ return hitObstacle(x,y,5)||(grpAvoidWet&&inSea(x,y)); }
    if(st>0&&bad(n.x+cx*st,n.y+cy*st)) return false;
    for(d=2;d<=r;d+=3) if(bad(n.x+cx*d,n.y+cy*d)) return false;
    return !bad(n.x+cx*r,n.y+cy*r);
}
function grpSide(n,ang,st){
    var k, g, d;
    for(k=1;k<=8;k++){
        g=grpClear(n,ang+k*0.42,22,st);
        d=grpClear(n,ang-k*0.42,22,st);
        if(g&&!d) return 1;
        if(d&&!g) return -1;
        if(g&&d) return 1;
    }
    return 1;
}
/* ---- LE SUIVI DE PAROI ----
   L'eventail ouvert autour du cap du BUT ne suffit pas. Il prend toujours le
   plus petit ecart degage, si bien qu'au fond d'une poche concave - une
   cloture d'enclos, un angle de deux murs - il oscille entre deux caps
   opposes et fait du surplace : mesure, trente-cinq pixels en cinq secondes.
   Aucune regle locale calee sur le but n'en sort, parce qu'il faudrait
   accepter de s'eloigner maintenant pour se rapprocher apres.

   D'ou le suivi de paroi, qui est l'algorithme de Bug2. Une fois engage, la
   reference n'est plus la direction du but mais SON PROPRE CAP : il balaie
   depuis le cote de la paroi et prend le premier ecart degage, ce qui le
   fait longer au lieu de la regarder. Il ne lache la paroi que lorsque deux
   conditions sont reunies : la route vers le but est franche, ET il est plus
   pres du but qu'au moment ou il a bute. Sans la seconde, il relache au
   premier trou et retombe dans la meme poche.

   Rien n'est tire au sort : le rejeu retrouve exactement le meme detour. */
function angWrap(a){
    while(a>3.141592653589793) a-=6.283185307179586;
    while(a<-3.141592653589793) a+=6.283185307179586;
    return a;
}
/* Trois envies, dans cet ordre. Revenir vers le but, un petit cran a la
   fois : c'est ce qui le decolle de la paroi des qu'elle finit. Sinon garder
   son cap, ce qui le fait longer. Sinon seulement s'ecarter du cote choisi.
   Partir d'emblee a quatre-vingt-dix degres, comme le fait la regle de la
   main gauche, le faisait pivoter d'un quart de tour par image en terrain
   ouvert : il tournait sur lui-meme au lieu de longer quoi que ce soit. */
function grpTrace(n,hd,sg,ang,st){
    var k, a, d=angWrap(ang-hd);
    a=hd+((d>0)?0.13:-0.13);
    if(grpClear(n,a,20,st)) return a;
    if(grpClear(n,hd,20,st)) return hd;
    for(k=1;k<=16;k++){
        a=hd+sg*k*0.2617993877991494;
        if(grpClear(n,a,20,st)) return a;
    }
    /* tout est bouche des deux cotes : on rouvre l'eventail complet en
       n'exigeant plus que le pas suivant, pour ne jamais rester plante */
    for(k=1;k<=16;k++){
        a=hd+sg*k*0.2617993877991494;
        if(grpClear(n,a,6,st)) return a;
        a=hd-sg*k*0.2617993877991494;
        if(grpClear(n,a,6,st)) return a;
    }
    return null;
}
/* ---- UN PAS VERS UN POINT, EN CONTOURNANT ----
   Le corps de grpFollow, sorti pour servir deux fois : suivre le joueur, et
   marcher vers l'abri quand on l'a perdu. Rend la distance restante, pour
   que l'appelant sache s'il est arrive. */
function grpStep(n,dt,tx,ty,vmax){
    var dx=tx-n.x, dy=ty-n.y, l=Math.hypot(dx,dy), spd, a2;
    if(l<4){ n.wall=0; n.dsg=0; return l; }
    spd=Math.min(vmax||96,26+l*0.9)*ownSpeedMul(n);
    dx/=l; dy/=l;
    var step=spd*dt, ang=DMATH.atan2(dy,dx);
    /* La voie se juge sur vingt-six pixels, pas sur le pas suivant : au ras
       d'un angle ce pixel-la est souvent libre alors que la route ne l'est
       pas, et il repartait vers le but en annulant son detour. */
    var franc=grpClear(n,ang,Math.min(l,26),step);
    /* on lache la paroi quand la route est franche ET qu'on a gagne du
       terrain depuis la butee - la seconde condition est ce qui empeche de
       retomber dans la poche dont on sort */
    if(n.wall&&franc&&l<(n.wd0||0)-2){ n.wall=0; n.dsg=0; }
    if(!n.wall&&!franc){
        n.wall=1; n.wd0=l; n.dsg=grpSide(n,ang,step); n.whd=ang;
    }
    if(n.wall){
        a2=grpTrace(n,(n.whd===undefined)?ang:n.whd,n.dsg||1,ang,step);
        /* tout est bouche de ce cote : il change de main plutot que de rester
           plante, et repart de sa distance actuelle */
        if(a2===null){ n.dsg=-(n.dsg||1); n.wd0=l;
            a2=grpTrace(n,(n.whd===undefined)?ang:n.whd,n.dsg,ang,step); }
        if(a2!==null){
            n.whd=a2;
            var wx=n.x+DMATH.cos(a2)*step, wy=n.y+DMATH.sin(a2)*step;
            if(!hitObstacle(wx,wy,5)&&!(grpAvoidWet&&inSea(wx,wy))){ n.x=wx; n.y=wy; }
            n.face=(DMATH.cos(a2)<0)?-1:1;
            n.anim+=dt*10;
            return l;
        }
    }
    var nx=n.x+dx*step, ny=n.y+dy*step;
    if(!hitObstacle(nx,ny,5)&&!(grpAvoidWet&&inSea(nx,ny))){ n.x=nx; n.y=ny; }
    n.face=(dx<0)?-1:1;
    n.anim+=dt*10;
    return l;
}
function grpFollow(n,dt,rank){
    /* le rang dans le sillage se passe quand l'appelant le connait deja :
       le rebatir par compagnon faisait relire tous les bourgs a chaque pas */
    var k=(rank===undefined)?eqList().indexOf(n):rank, s;
    if(k<0) k=0;
    n.inb=false; n.night=false; n.go=0;
    s=grpSpot(n,k); s=grpFree(s.x,s.y);
    /* on evite l'eau, sauf si le joueur y est deja : alors il faut bien le
       suivre dedans */
    grpAvoidWet=!inSea(G.p.x,G.p.y);
    grpStep(n,dt,s.x,s.y,96);
    grpAvoidWet=true;
}
/* ================= PERDU DE VUE =================
   Le rattrapage d'un coup au-dela de 420 px a disparu avec cette section :
   c'etait un pansement pose faute de mieux, qui garantissait qu'on ne perde
   jamais personne et rendait donc toute cette question invisible. Un
   compagnon peut desormais vraiment se perdre, et ce qu'il fait alors est
   son affaire.

   IL ATTEND, PUIS IL SE MET A L'ABRI. Une minute sur place, immobile : c'est
   le temps qu'on laisse a quelqu'un pour reapparaitre au coin d'une rue. Au
   terme, il ne reste pas plante au milieu du chemin - il gagne le batiment
   le plus proche et y entre. On ne le voit plus, et rien ne le voit non plus.

   IL REVIENT DES QU'ON REVIENT. Repasser dans sa zone suffit : il ressort et
   reprend sa place dans le sillage, sans qu'on ait rien a lui dire.

   UN JOUR ET UNE NUIT, ET IL RENTRE. Passe un cycle complet sans vous
   revoir, il cesse de vous attendre : il quitte l'equipe et regagne la base.
   Il reste du groupe - c'est le registre, on ne perd pas quelqu'un parce
   qu'on s'est perdus de vue - et l'on repartira avec lui au prochain depart.
   Sans base ou rentrer, il n'a nulle part ou aller : celui-la quitte
   vraiment, et c'est le prix de courir le pays sans toit.

   lst : 0 il suit, 1 il attend, 2 il gagne l'abri, 3 il y est. */
var GRP_LOSE_D=620, GRP_STUCK=15, GRP_HOLD=60, GRP_BACK=300;
var GRP_QUIT=CFG.CYCLE;
/* Le batiment le plus proche, et le pas de sa porte : on entre par le sud,
   comme partout ailleurs dans le jeu. */
function grpShelter(x,y){
    var best=null, bd=1e18, i, b, d;
    for(i=0;i<BLDRECTS.length;i++){
        b=BLDRECTS[i];
        d=dist2(x,y,b.x+b.w/2,b.y+b.h/2);
        if(d<bd){ bd=d; best=b; }
    }
    return best;
}
function grpLose(n,pourquoi){
    if(n.lst) return;
    n.lst=1; n.lt=0; n.ltot=0; n.shl=null;
    n.wall=0; n.dsg=0; n.whd=undefined;
    logMsg(n.name+" vous a perdu de vue"+(pourquoi?(" ("+pourquoi+")"):"")+
           ". Il attend.","jsay");
}
function grpFound(n){
    if(!n.lst) return;
    if(n.inb){ n.x=n.hx; n.y=n.hy+16; }
    n.lst=0; n.lt=0; n.ltot=0; n.shl=null;
    n.inb=false; n.hidden=false;
    n.wall=0; n.dsg=0; n.whd=undefined;
    n.pbd=undefined; n.pbt=0;
    logMsg(n.name+" vous rejoint.","jsay");
}
/* Il cesse d'attendre. Il quitte l'equipe, pas le registre - sauf s'il n'y a
   pas de toit ou rentrer, auquel cas il n'a plus de raison de rester. */
function grpGoHome(n){
    n.lst=0; n.lt=0; n.ltot=0; n.shl=null;
    n.inb=false; n.hidden=false;
    n.out=0; n.sortie=0;
    n.pbd=undefined; n.pbt=0;
    if(BASE&&BASE.b){
        /* Il rentre seul. On ne joue pas ce trajet : il est hors de vue, il
           dure des heures, et le simuler pas a pas sur toute la carte
           couterait plus qu'il ne raconte. Il est chez lui au jour suivant,
           et l'on repart avec lui quand on veut. */
        n.x=BASE.b.x+BASE.b.w/2; n.y=BASE.b.y+BASE.b.h+18;
        logMsg(n.name+" a cesse de vous attendre et est rentre a la base.","jday");
    } else {
        n.recruited=0;
        logMsg(n.name+" a cesse de vous attendre. Sans toit ou rentrer, "+
               "il ne vous suit plus.","jday");
    }
}
/* On surveille deux choses : la distance, et le fait d'avancer. Un compagnon
   qui ne se rapproche plus pendant quinze secondes est bloque, meme s'il
   n'est qu'a cent pixels - c'est le cas du fond de cour, ou le contournement
   reactif ne suffit pas. */
function grpWatch(n,dt,d){
    if(n.lst) return;
    if(d>GRP_LOSE_D){ grpLose(n,"trop loin"); return; }
    if(n.pbd===undefined||d<n.pbd-2){ n.pbd=d; n.pbt=0; return; }
    n.pbt=(n.pbt||0)+dt;
    if(n.pbt>GRP_STUCK&&d>60) grpLose(n,"bloque");
}
/* Ce qu'il fait pendant qu'il vous cherche. Rend true tant qu'il est perdu :
   l'appelant sait alors qu'il n'y a pas de sillage a tenir. */
/* Etre pres ne suffit pas : il faut pouvoir vous atteindre. Un compagnon
   coince au fond d'une cour est a cent cinquante pixels de vous et n'a
   aucun moyen d'y arriver - le declarer retrouve parce qu'il est proche le
   renvoyait aussitot buter contre le meme mur. On exige donc la vue : proche
   ET la voie franche. C'est aussi ce qui rend la chose lisible - il vous
   rejoint quand vous tournez le coin, pas quand vous passez derriere. */
function grpSees(n,d){
    if(d>=GRP_BACK) return false;
    /* Celui qui est deja dedans n'a pas de ligne de vue a faire valoir : il
       vous entend passer et il sort. Exiger la vue depuis l'interieur d'un
       batiment le condamnait a ne jamais ressortir. */
    if(n.lst===3) return true;
    var a=DMATH.atan2(G.p.y-n.y,G.p.x-n.x);
    return grpClear(n,a,Math.min(d,GRP_BACK),0);
}
function grpLostTick(n,dt,d){
    if(!n.lst) return false;
    n.ltot=(n.ltot||0)+dt;
    if(grpSees(n,d)){ grpFound(n); return false; }
    if(n.ltot>=GRP_QUIT){ grpGoHome(n); return true; }
    n.lt=(n.lt||0)+dt;
    if(n.lst===1){
        /* une minute sur place, sans bouger d'un pouce */
        if(n.lt>=GRP_HOLD){
            n.shl=grpShelter(n.x,n.y);
            if(n.shl){ n.lst=2; n.lt=0;
                logMsg(n.name+" se met a l'abri.","jsay"); }
            else n.lt=0;   /* pas un mur a la ronde : il attend encore */
        }
        return true;
    }
    if(n.lst===2){
        var b=n.shl, tx=b.x+b.w/2, ty=b.y+b.h+12;
        var l=grpStep(n,dt,tx,ty,52);
        /* meme garde-fou que l'habitant qui rentre chez lui : au bout d'un
           moment il entre quand meme, plutot que de rester contre la facade */
        if(l<14||n.lt>40){
            n.lst=3; n.lt=0;
            n.hx=tx; n.hy=ty; n.x=tx; n.y=ty;
            n.inb=true; n.hidden=true;
        }
        return true;
    }
    /* abrite : il ne bouge plus, rien ne le voit */
    n.inb=true; n.hidden=true;
    return true;
}
/* ================= ILS SE SOIGNENT =================
   On pouvait leur donner dix medicaments : ils restaient blesses jusqu'au
   lever du jour a la base. Remplir le sac de quelqu'un avant de partir ne
   servait donc a rien, ce qui vidait la table a deux d'une bonne part de son
   sens. Ils y puisent desormais tout seuls.

   DEUX SEUILS, DEUX GESTES. Sous 45 pour cent de sa vie, il ouvre un
   medicament : c'est immediat, c'est ce qu'on fait quand ca presse. Sous 75
   pour cent et hors du danger, il mange : c'est lent, et l'on n'avale pas un
   sandwich au milieu d'une fusillade. Un compagnon a couvert se refait donc
   entre deux rues, et l'on retrouve une equipe entiere en revenant.

   IL NE GACHE PAS. Entre plusieurs medicaments, il prend le plus petit qui
   suffit a le remettre d'aplomb : garder la trousse complete pour une
   egratignure serait absurde, et la lui faire choisir au hasard le serait
   autant. A defaut, le plus petit qu'il ait - un point rendu vaut mieux que
   rien.

   IL SE SOIGNE MEME PERDU. Celui qui vous attend a l'abri continue de panser
   ses plaies : c'est meme la qu'il en a le plus besoin. */
var CARE_MED=0.45, CARE_VIV=0.75, CARE_STIM=0.25, CARE_BOIS=0.60, CARE_CD=2.5;
/* La case du soin le mieux adapte, ou -1. manque = points a rendre. */
function carePick(n,kind,manque){
    var best=-1, bv=0, i, c, o;
    if(!n.inv) return -1;
    for(i=0;i<n.inv.length;i++){
        c=n.inv[i];
        if(!c||cellIsW(c)) continue;
        o=itemById(c.i);
        if(!o||o.k!==kind||!o.hp) continue;
        /* un stimulant est range avec les medicaments et ne soigne rien :
           il n'a rien a faire dans le choix d'un soin */
        if(o.st&&!o.hp) continue;
        /* on cherche le plus petit qui couvre le manque ; si aucun ne le
           couvre, le plus gros dont on dispose */
        if(best<0){ best=i; bv=o.hp; continue; }
        if(bv<manque){ if(o.hp>bv){ best=i; bv=o.hp; } }
        else if(o.hp>=manque&&o.hp<bv){ best=i; bv=o.hp; }
    }
    return best;
}
function careUse(n,ci){
    var c=n.inv[ci], o=itemById(c.i), pres, verbe;
    if(!o) return false;
    if(o.k==="med"){
        var hb2=n.hp;
        if(o.hp) n.hp=Math.min(n.maxhp,n.hp+o.hp);
        if(o.st) n.sta=Math.min(staMax(n),(n.sta||0)+o.st);
        if(n!==G.p){ var hg2=Math.round(n.hp-hb2);
            if(hg2>=1) G.texts.push({v:"+"+hg2,x:n.x,y:n.y-14,t:0.85,c:"#5fbf5f"}); }
    } else {
        if(o.hp){ n.heal=(n.heal||0)+o.hp; n.healR=o.hp/Math.max(1,o.dur); }
        if(o.st){ n.sto=(n.sto||0)+o.st; n.stoR=o.st/Math.max(1,o.dur); }
    }
    c.q--; if(c.q<=0) n.inv[ci]=null;
    n.careT=CARE_CD;
    /* on ne raconte que ce qui se passe sous vos yeux : le journal serait
       illisible si toute l'equipe s'annoncait a chaque bouchee */
    pres=dist2(n.x,n.y,G.p.x,G.p.y)<420*420;
    verbe=(o.k==="med")?" se soigne : ":(o.st?" boit : ":" mange : ");
    if(pres) logMsg(n.name+verbe+o.n.toLowerCase()+".","jsay");
    return true;
}
/* La case de la boisson la mieux adaptee au souffle qui manque. Meme regle
   que pour les soins : le plus petit qui couvre, sinon le plus gros. */
function carePickSt(n,kind,manque){
    var best=-1, bv=0, i, c, o;
    if(!n.inv) return -1;
    for(i=0;i<n.inv.length;i++){
        c=n.inv[i];
        if(!c||cellIsW(c)) continue;
        o=itemById(c.i);
        if(!o||o.k!==kind||!o.st) continue;
        if(best<0){ best=i; bv=o.st; continue; }
        if(bv<manque){ if(o.st>bv){ best=i; bv=o.st; } }
        else if(o.st>=manque&&o.st<bv){ best=i; bv=o.st; }
    }
    return best;
}
function grpCare(n,dt){
    var manque, ci;
    if(!n||n.dead||!n.maxhp) return;
    /* la remise en forme lente d'un vivre deja avale */
    if(n.heal>0){
        var gp=Math.min(n.heal,(n.healR||1)*dt);
        n.hp=Math.min(n.maxhp,n.hp+gp);
        n.heal-=gp;
        if(n.heal<=0.001){ n.heal=0; n.healR=0; }
    }
    /* la gorgee qui descend : le souffle revient comme la vie */
    if(n.sto>0){
        var gs=Math.min(n.sto,(n.stoR||1)*dt);
        n.sta=Math.min(staMax(n),(n.sta||0)+gs);
        n.sto-=gs;
        if(n.sto<=0.001){ n.sto=0; n.stoR=0; }
    }
    if(n.careT>0){ n.careT-=dt; return; }
    manque=n.maxhp-n.hp;
    if(manque>0&&n.hp<n.maxhp*CARE_MED){
        ci=carePick(n,"med",manque);
        if(ci>=0){ careUse(n,ci); return; }
    }
    /* le souffle a sec, on avale un stimulant : c'est la seule chose qui le
       rend d'un coup, et c'est fait pour ce moment-la */
    var sm=staMax(n), sman=sm-(n.sta===undefined?sm:n.sta);
    if(sman>0&&n.sta<sm*CARE_STIM){
        ci=carePickSt(n,"med",sman);
        if(ci>=0){ careUse(n,ci); return; }
    }
    /* on ne mange ni ne boit sous le feu : ENGAG retombe quelques secondes
       apres le dernier coup, c'est exactement la fenetre qu'il faut */
    if(ENGAG>0) return;
    if(manque>0&&n.hp<n.maxhp*CARE_VIV&&!n.heal){
        ci=carePick(n,"viv",manque);
        if(ci>=0){ careUse(n,ci); return; }
    }
    if(sman>0&&n.sta<sm*CARE_BOIS&&!n.sto){
        ci=carePickSt(n,"viv",sman);
        if(ci>=0) careUse(n,ci);
    }
}
/* ---- LE SILLAGE SE TIENT PARTOUT ----
   Le suivi etait pris dans la boucle des bourgs, elle-meme coupee au-dela de
   900 px du centre du village : l'equipe se figeait des qu'on s'eloignait de
   chez elle, et les gens de metier ne suivaient nulle part, updWorkers
   n'ayant jamais eu de branche de recrue. Le groupe se met donc a jour pour
   lui-meme, avant les bourgs, quelle que soit la distance a leur clocher. */
/* ================= LES CONSIGNES DE GROUPE =================
   Six ordres donnes a l'equipe qui vous suit dehors, passes par le journal
   d'entrees comme toute action du joueur : Suivre / Pas suivre (grp.hold),
   Tirer / Pas tirer (grp.noFire, lu dans grpFight), Rentrer a la base,
   Planquez-vous. Aucun tirage : le rejeu retrouve les memes gestes. */

/* La planque : rejoindre l'abri vise (n.dtar) et y entrer, puis n'en plus
   bouger. Meme marche que la mise a l'abri du perdu de vue, mais l'ordre
   vient de vous, et il n'en ressort que sur "Suivre". */
function grpDuck(n,dt){
    if(n.duck===2){ n.inb=true; n.hidden=true; return; }
    var b=n.dtar;
    if(!b){ n.duck=0; return; }
    var tx=b.x+b.w/2, ty=b.y+b.h+12;
    var l=grpStep(n,dt,tx,ty,60);
    n.dt2=(n.dt2||0)+dt;
    /* meme garde-fou que l'habitant qui rentre chez lui : au bout d'un moment
       il entre quand meme plutot que de rester colle a la facade */
    if(l<14||n.dt2>40){
        n.duck=2; n.dt2=0;
        n.hx=tx; n.hy=ty; n.x=tx; n.y=ty;
        n.inb=true; n.hidden=true;
        if(b.lock) b.lock=false;   /* ils ont crochete pour entrer */
    }
}
/* Le meilleur crocheteur du groupe, vous compris : c'est son niveau qui dit
   quelles serrures l'equipe sait forcer pour se mettre a couvert. */
function grpPickBest(){
    var L=eqList(), best=pickLevel(G.p), i, v;
    for(i=0;i<L.length;i++){ v=pickLevel(L[i]); if(v>best) best=v; }
    return best;
}
/* Un abri est accessible si ce n'est pas un logement (sauf apres l'ordre de
   quarantaine) et si sa serrure est a la portee du groupe - sauf une fois la
   breche passee, ou tout cede. */
function grpCanHide(b,lvl,libre){
    if(bldPrivate(b)&&!bldMine(b)&&!proFear()) return false;
    if(b.lock&&!libre&&(b.pick|0)>lvl) return false;
    return true;
}
function grpHideTarget(x,y,lvl,libre){
    var best=null, bd=1e18, i, b, d;
    for(i=0;i<BLDRECTS.length;i++){
        b=BLDRECTS[i];
        if(!grpCanHide(b,lvl,libre)) continue;
        d=dist2(x,y,b.x+b.w/2,b.y+b.h/2);
        if(d<bd){ bd=d; best=b; }
    }
    return best;
}
function grpCmd(c){
    if(!G||!G.grp) return;
    var L=eqList(), i, n;
    if(c===0){                 /* SUIVRE : on rappelle tout le monde */
        G.grp.hold=0;
        for(i=0;i<L.length;i++){ n=L[i];
            if(n.duck){ n.duck=0; n.dt2=0; n.dtar=null;
                n.inb=false; n.hidden=false;
                n.wall=0; n.dsg=0; n.whd=undefined; }
            if(n.lst) grpFound(n);
        }
        logMsg("Le groupe vous suit.","jsay"); notice("SUIVEZ-MOI");
    }
    else if(c===1){            /* PAS SUIVRE : tenir la position */
        G.grp.hold=1;
        logMsg("Le groupe tient sa position.","jsay"); notice("TENEZ POSITION");
    }
    else if(c===2){            /* TIRER */
        G.grp.noFire=0;
        logMsg("Le groupe fera feu s'il est menace.","jsay"); notice("FEU AUTORISE");
    }
    else if(c===3){            /* PAS TIRER */
        G.grp.noFire=1;
        logMsg("Le groupe garde ses armes au fourreau.","jsay"); notice("NE PAS TIRER");
    }
    else if(c===4){            /* RENTRER A LA BASE : l'equipe de terrain se dissout */
        if(!(BASE&&BASE.b)){ notice("PAS DE BASE"); return; }
        var k=0;
        for(i=0;i<L.length;i++){ n=L[i];
            n.out=0; n.sortie=0; n.duck=0; n.dtar=null;
            n.lst=0; n.lt=0; n.ltot=0; n.shl=null;
            n.inb=false; n.hidden=false;
            n.pbd=undefined; n.pbt=0;
            /* On ne joue pas le trajet : ils sont chez eux, on repartira avec
               eux au prochain depart. */
            n.x=BASE.b.x+BASE.b.w/2; n.y=BASE.b.y+BASE.b.h+18;
            k++;
        }
        if(k) logMsg(k+((k>1)?" compagnons rentrent a la base."
                          :" compagnon rentre a la base."),"jday");
        notice("RETOUR A LA BASE");
    }
    else if(c===5){            /* PLANQUEZ-VOUS */
        var lvl=grpPickBest(), libre=(G.pro0>=0), h=0, b;
        for(i=0;i<L.length;i++){ n=L[i];
            b=grpHideTarget(n.x,n.y,lvl,libre);
            if(!b) continue;
            n.duck=1; n.dt2=0; n.dtar=b;
            n.wall=0; n.dsg=0; n.whd=undefined;
            h++;
        }
        if(h) logMsg(h+((h>1)?" compagnons se mettent a l'abri."
                          :" compagnon se met a l'abri."),"jsay");
        else logMsg("Aucun abri accessible a proximite.","jday");
        notice("PLANQUEZ-VOUS");
    }
}

function grpTick(dt){
    var L=eqList(), i, n, d, p=G.p, hold=!!(G.grp&&G.grp.hold);
    for(i=0;i<L.length;i++){
        n=L[i];
        if(n.away) continue;
        d=Math.hypot(n.x-p.x,n.y-p.y);
        /* il panse ses plaies ou qu'il soit, et meme surtout quand il vous a
           perdu de vue : c'est la qu'il en a le plus besoin */
        grpCare(n,dt);
        /* PLANQUE : sur ordre, il gagne l'abri vise et n'en bouge plus. Seul
           "Suivre" le rappelle (voir grpCmd), rien d'autre ne l'en fait sortir. */
        if(n.duck){ grpDuck(n,dt); continue; }
        /* TENIR LA POSITION : on ne le declare pas perdu - c'est nous qui
           partons, pas lui - il reste debout la ou il est. Un compagnon deja
           perdu, lui, garde son propre sort et cherche a rentrer. */
        if(hold&&!n.lst){ n.inb=false; n.night=false; n.go=0; continue; }
        /* on regarde d'abord s'il est perdu, ensuite ce qu'il en fait, et
           l'on ne tient le sillage que pour ceux qui vous voient encore */
        grpWatch(n,dt,d);
        if(grpLostTick(n,dt,d)) continue;
        grpFollow(n,dt,i);
    }
}
/* ---- PRENDRE LA TETE ----
   On change de corps, pas de groupe. Celui qu'on incarnait reste avec nous,
   sous son propre nom, et devient a son tour un compagnon ; on herite du sien
   avec ses aptitudes, ses plafonds et son sac. C'est la seule facon de jouer
   un boulanger apres avoir commence militaire - et c'est irreversible dans
   l'instant : le corps qu'on quitte ne se reprend qu'en le redemandant. */
function grpTakeOver(n,fall){
    var p=G.p, i, tmp;
    if(!n||!n.recruited) return false;
    /* l'ancien corps devient un habitant du groupe, a la place du nouveau.
       LA FIEVRE, LE VRAC ET LES CHARGEURS SUIVENT LE CORPS, PAS LE SIEGE :
       sans cela on guerissait en changeant de peau, et les cartouches en
       vrac restaient sur la chaise. */
    var old={x:fall?p.x:n.x, y:fall?p.y:n.y,
             name:p.name, spr:p.spr, job:p.job, bio:p.bio,
             foi:p.foi, stats:p.stats, sec:p.sec, sec0:p.sec0, spec:p.spec,
             use:p.use, hpGain:p.hpGain, maxhp:p.maxhp, hp:fall?0:p.hp,
             sta:p.sta,
             mal:p.mal||0, malT:p.malT||0, malPause:p.malPause||0,
             loose:p.loose||{}, mag:p.mag?p.mag.slice():[0,0,0,0],
             slots:p.slots?p.slots.slice():[null,null,null,null],
             inv:p.inv, bag:p.bag, vet:p.vet?p.vet.slice():vetInit(),
             aff:n.aff, recruited:1, out:fall?0:1, clad:p.clad||1,
             s:n.s, fem:n.fem, dead:fall?1:0, hidden:false, face:1, anim:0,
             wt:0, hx:0, hy:0, stop:0, inb:false, go:0, night:false,
             home:n.home, work:n.work, tx:fall?p.x:n.x, ty:fall?p.y:n.y};
    /* le joueur prend la place et les affaires du suivant */
    p.name=n.name; p.spr=n.spr||((n.s!==undefined&&VILSPR[n.s])?VILSPR[n.s]:p.spr);
    p.job=n.job; p.bio=n.bio; p.foi=n.foi;
    p.stats=n.stats; p.sec=n.sec; p.sec0=n.sec0; p.spec=n.spec;
    p.use=n.use||{}; p.hpGain=n.hpGain||0;
    p.inv=n.inv||[null,null]; p.bag=(n.bag===undefined)?-1:n.bag;
    p.vet=n.vet?n.vet.slice():vetInit();
    p.clad=n.clad||1;
    p.mal=n.mal||0; p.malT=n.malT||0; p.malPause=n.malPause||0;
    p.lowT=0; p.repT=0;
    p.loose=n.loose||{}; p.mag=n.mag?n.mag.slice():[0,0,0,0];
    p.slots=n.slots?n.slots.slice():[null,null,null,null];
    p.hand=-1; p.cd=0; p.eqT=0; p.rl=0; p.ads=0;
    p.maxhp=hpMax(p); p.hp=Math.min(p.maxhp,n.hp||p.maxhp);
    p.sta=staMax(p);
    /* on echange les corps dans la liste du bourg */
    for(i=0;i<VILLAGES.length;i++){
        var q=VILLAGES[i].villagers.indexOf(n);
        if(q>=0){ VILLAGES[i].villagers[q]=old; break; }
    }
    if(i>=VILLAGES.length){
        var w=WORKERS.indexOf(n);
        if(w>=0) WORKERS[w]=old;
    }
    zHumans();
    if(!fall){
        logMsg("Vous prenez la place de "+p.name+". "+old.name+
               " vous suit desormais.","jsay");
        notice("VOUS ETES "+String(p.name).toUpperCase());
    }
    /* une chute rend le corps abandonne : l'appelant doit pouvoir le noter
       et le faire se relever */
    return fall?old:true;
}

/* ---- TOMBER, SANS QUE TOUT S'ARRETE ----
   LE JOUEUR N'EST PLUS LA PARTIE. Tant qu'il reste quelqu'un A LA MAISON, on
   reprend sous un autre nom : le corps tombe la ou il est tombe, avec ses
   affaires dessus - on peut aller le fouiller, et l'on croisera peut-etre ce
   qu'il est devenu, car il se releve comme n'importe qui.
   A LA MAISON, ET PAS AILLEURS. Ceux qui vous suivaient etaient a cote de
   vous quand la horde vous a eu : ils n'ont pas plus de raison de s'en tirer.
   Ceux qui sont en mission sont hors de la carte. Il reste la garde, celle
   qui n'a pas bouge - c'est elle qui apprend la nouvelle et qui continue.
   LE TIRAGE EST DANS LE FLUX : rng et non Math.random, sans quoi deux parties
   de meme graine divergeraient a la premiere mort. */
function fallList(){
    var L=grpList(), R=[], i;
    for(i=0;i<L.length;i++)
        if(!L[i].dead&&!L[i].out&&!L[i].miss) R.push(L[i]);
    return R;
}
function playerFall(byZ){
    var p=G.p, R, n, b;
    if(state==="dead"||state==="win") return;
    R=BASE?fallList():[];
    if(!R.length){ endGame(false); return; }
    n=R[Math.floor(rng()*R.length)|0];
    var mort=p.name, corps;
    /* le corps reste ou il est, mort, avec tout ce qu'il portait */
    corps=grpTakeOver(n,1);
    if(!corps){ endGame(false); return; }
    corpseNote(corps);
    /* les dents transmettent a qui que ce soit, et l'on ne s'est jamais
       exempte : celui qu'on jouait revient sous son nom au bout d'une
       minute, comme tout le monde */
    if(byZ){ corps.rise=ZCFG.rise; RISERS.push(corps); }
    logMsg(mort+" est tombe. "+p.name+" prend la suite.","jred");
    /* ON REPARAIT SUR LE SEUIL DE LA MAISON. Le dedans n'a pas de
       coordonnees ou poser quelqu'un - c'est la meme raison qu'a la sortie
       au corps a corps - donc on ouvre la porte au lieu de se reveiller dans
       un mur. */
    b=BASE&&BASE.b;
    if(b){ p.x=b.x+b.w/2; p.y=b.y+b.h+8; }
    G.inside=null; G.talk=null; G.pick=null; G.trade=null; G.invNpc=null;
    G.showInv=false; G.showBag=false;
    p.winded=0; p.kx=0; p.ky=0;
    G.cam.x=clamp(p.x-CFG.VIEW_W/2,0,CFG.WORLD-CFG.VIEW_W);
    G.cam.y=clamp(p.y-CFG.VIEW_H/2,0,CFG.WORLD-CFG.VIEW_H);
    notice("VOUS ETES "+String(p.name).toUpperCase());
    return true;
}

/* ================= LES COUPURES =================
   La generation bloque plus d'une seconde et la page restait noire : la
   premiere chose que voyait un joueur etait une absence. On lui donne a lire
   a la place, et l'on en profite pour poser ce que personne ne raconte jamais
   dans le jeu - ce qui s'est passe avant.

   DIX COUPURES, DANS L'ORDRE. Elles descendent d'une breve economique de
   rubrique locale jusqu'au dernier communique, et l'on n'y voit jamais le mot
   qu'on attend : les journaux ne l'ont pas eu, ils ont eu des chiffres, des
   dementis et des mesures. C'est plus juste, et plus inquietant.

   CINQ SECONDES AU MINIMUM. La carte se fabrique en une seconde et demie ;
   le reste du temps est du temps de lecture, et c'est voulu. On n'entre pas
   dans ce pays sans savoir de quoi il est mort. */
/* k : "crise" ou "local".  s : la nature du document, qui commande son
   apparence.  m : pour les textos seulement, l'echange lui-meme. */
var COUPURES=[
 /* ================= TRENTE PIECES SUR LA CRISE =================
    Elles racontent H-teck et l'effondrement, dans l'ordre. Le mot qu'on
    attend n'y figure jamais : les journaux ne l'ont pas eu, ils ont eu des
    chiffres, des dementis et des mesures. Les voix privees - lettres,
    textos, carnets - disent ce que la presse ne pouvait pas dire. */
 {k:"crise", s:"journal", j:"L'Echo de la Vallee", d:"12 mars",
  t:"H-TECK S'INSTALLE : 240 EMPLOIS",
  c:"Le groupe pharmaceutique confirme l'ouverture de son centre de recherche "+
    "sur l'ancienne friche des Salines. Le maire salue une reconversion "+
    "exemplaire. Les premiers recrutements auront lieu des l'automne."},
 {k:"crise", s:"mail", j:"De : recrutement@h-teck.fr", d:"2 avril",
  t:"VOTRE CANDIDATURE - POSTE DE TECHNICIEN NIVEAU 2",
  c:"Nous avons le plaisir de retenir votre profil. Le poste implique la "+
    "signature d'un accord de confidentialite couvrant l'integralite de vos "+
    "activites, y compris apres la fin du contrat. Merci de vous presenter "+
    "muni d'une piece d'identite et de ne rien publier sur les reseaux."},
 {k:"crise", s:"journal", j:"L'Echo de la Vallee", d:"29 avril",
  t:"UN CHANTIER QUI VA VITE",
  c:"Trois mois pour un batiment de cette taille, les entreprises locales "+
    "n'en reviennent pas. Un macon confie n'avoir jamais vu couler autant de "+
    "beton pour un simple laboratoire. Les plans du sous-sol n'ont pas ete "+
    "affiches en mairie."},
 {k:"crise", s:"journal", j:"L'Echo de la Vallee", d:"3 juin",
  t:"LE LABORATOIRE FERME SES PORTES AU PUBLIC",
  c:"La journee portes ouvertes est annulee sans explication. La direction "+
    "invoque des travaux de mise aux normes. Une riveraine s'etonne du "+
    "grillage de trois metres pose en une nuit."},
 {k:"crise", s:"intime", j:"Carnet de M. B., technicien", d:"17 juin",
  t:"NIVEAU MOINS DEUX",
  c:"Ils ont ajoute un etage sous celui ou je travaille. Je ne devrais pas "+
    "l'ecrire. On y descend par un ascenseur separe et il faut deux badges. "+
    "Marchand y passe ses nuits depuis trois semaines. Il a maigri."},
 {k:"crise", s:"journal", j:"Le Courrier du Departement", d:"28 aout",
  t:"NUISANCES : LES RIVERAINS S'ORGANISENT",
  c:"Vingt-deux familles signent une petition contre les rotations de camions "+
    "nocturnes. La prefecture rappelle que l'etablissement dispose de toutes "+
    "les autorisations requises."},
 {k:"crise", s:"journal", j:"Le Courrier du Departement", d:"6 septembre",
  t:"DEUX CHERCHEURS DEMISSIONNENT",
  c:"Ils avaient signe pour cinq ans. Contactes, tous deux renvoient a une "+
    "clause de confidentialite. L'un d'eux a quitte la region le lendemain de "+
    "sa derniere journee de travail."},
 {k:"crise", s:"lettre", j:"Lettre manuscrite, non postee", d:"9 septembre",
  t:"MA CHERE SOEUR",
  c:"Je pars. Ne me demande pas pourquoi, je ne peux pas te le mettre par "+
    "ecrit et je ne veux pas te le dire au telephone. Si tu as l'occasion de "+
    "venir chez nous cet hiver, remets-la. Si tu y es deja, repars. Je "+
    "t'embrasse. Ne montre cette lettre a personne."},
 {k:"crise", s:"intime", j:"Carnet de M. B., technicien", d:"28 septembre",
  t:"LE PROTOCOLE A CHANGE",
  c:"Double combinaison, masque a cartouche, douche a la sortie. Pour des "+
    "cultures, disent-ils. On ne met pas ca pour des cultures. Delaunay a "+
    "refuse d'entrer ce matin, on l'a raccompagne au vestiaire et il n'est "+
    "pas revenu."},
 {k:"crise", s:"journal", j:"Le Courrier du Departement", d:"14 octobre",
  t:"TROIS SALARIES EN ARRET MALADIE",
  c:"Le comite d'hygiene demande une expertise independante. La direction "+
    "parle d'une gastro-enterite saisonniere et refuse de communiquer les "+
    "resultats des analyses internes."},
 {k:"crise", s:"affiche", j:"Agence de l'eau - avis d'affichage", d:"22 octobre",
  t:"CAPTAGE DES SALINES : CONSOMMATION INTERDITE",
  c:"L'eau du reseau en aval de la zone industrielle est declaree impropre. "+
    "Mares, fosses et eaux stagnantes du secteur sont classes a risque. "+
    "Evitez tout contact prolonge. Un point de distribution est ouvert place "+
    "de la Mairie."},
 {k:"crise", s:"texto", j:"Fil de messages", d:"25 octobre",
  t:"TU AS VU LES CAMIONS ?",
  m:[["eux","tu as vu les camions cette nuit"],
     ["moi","non j'ai rien entendu"],
     ["eux","4h du mat. 6 semis. ils sortaient a vide"],
     ["eux","a vide. tu comprends ? ils ont rien livre"],
     ["moi","ils ont emporte quoi alors"],
     ["eux","..."]]},
 {k:"crise", s:"journal", j:"Le Courrier du Departement", d:"2 novembre",
  t:"LE CHU SIGNALE UNE SERIE INHABITUELLE",
  c:"Onze admissions en quinze jours pour un tableau clinique que les "+
    "praticiens disent n'avoir jamais rencontre. Fievre, agitation, morsures. "+
    "L'agence de sante evoque une coincidence statistique."},
 {k:"crise", s:"note", j:"Note de service - CHU, service des urgences", d:"4 novembre",
  t:"CONDUITE A TENIR - CAS DITS DE TYPE B",
  c:"Chambre seule, porte fermee. Deux soignants minimum, jamais un seul. "+
    "Contention prophylactique des les premiers signes d'agitation. Toute "+
    "morsure de patient est declaree immediatement, sans exception et sans "+
    "attendre la fin du service."},
 {k:"crise", s:"journal", j:"La Depeche du Soir", d:"9 novembre",
  t:"H-TECK DEMENT TOUT LIEN",
  c:"Dans un communique de quatre lignes, le groupe qualifie les rumeurs de "+
    "diffamatoires et annonce des poursuites. Aucun journaliste n'a pu "+
    "franchir le portail depuis le mois de juin."},
 {k:"crise", s:"mail", j:"De : direction@h-teck.fr - a tout le personnel", d:"10 novembre",
  t:"RAPPEL - COMMUNICATION EXTERIEURE",
  c:"Il est rappele qu'aucun salarie n'est habilite a s'exprimer sur nos "+
    "activites. Les demandes de la presse sont a rediriger vers le service "+
    "concerne. Tout manquement fera l'objet de poursuites. Les acces "+
    "individuels seront revus vendredi."},
 {k:"crise", s:"journal", j:"La Depeche du Soir", d:"13 novembre",
  t:"LE SITE PASSE EN SECURITE RENFORCEE",
  c:"Serrures a barillet blinde sur toutes les issues, badges nominatifs, "+
    "vigiles en faction. Un ancien employe assure qu'il faut desormais un "+
    "outillage de serrurier pour ouvrir la moindre porte du batiment."},
 {k:"crise", s:"intime", j:"Carnet de M. B., technicien", d:"14 novembre",
  t:"DERNIERE PAGE",
  c:"Je n'y retourne pas. J'ai laisse mon badge dans le vestiaire et je suis "+
    "sorti par le parking. Si quelqu'un lit ceci un jour : le probleme n'est "+
    "pas ce qu'ils fabriquaient. Le probleme est qu'ils avaient cesse de "+
    "compter les fioles."},
 {k:"crise", s:"texto", j:"Fil de messages", d:"16 novembre",
  t:"MAMAN REPONDS",
  m:[["moi","maman tu es ou"],
     ["moi","reponds stp"],
     ["eux","je suis a la maison. n'ouvre a personne"],
     ["moi","j'arrive"],
     ["eux","NON"],
     ["eux","reste ou tu es. je t'aime"]]},
 {k:"crise", s:"affiche", j:"Prefecture - arrete du 17 novembre", d:"17 novembre",
  t:"QUARANTAINE SUR TROIS COMMUNES",
  c:"Barrages filtrants aux entrees. Les habitants sont invites a rester "+
    "chez eux et a ne pas approcher les personnes presentant des signes "+
    "d'agitation. Les ecoles resteront fermees jusqu'a nouvel ordre."},
 {k:"crise", s:"journal", j:"La Depeche du Soir", d:"21 novembre",
  t:"LE PREFET DEMANDE DES RENFORTS",
  c:"Deux compagnies de gendarmerie mobile sont deployees. Le porte-parole "+
    "refuse de commenter les images tournees au barrage de la nationale. "+
    "Les liaisons telephoniques sont perturbees depuis mardi."},
 {k:"crise", s:"note", j:"Consigne interne - gendarmerie mobile", d:"21 novembre",
  t:"REGLES D'ENGAGEMENT - BARRAGE NORD",
  c:"Sommation d'usage. Si le sujet ne repond a aucune sommation et poursuit "+
    "sa progression, il n'est plus considere comme un civil. Les effectifs "+
    "sont doubles a la tombee du jour. On ne releve plus les identites."},
 {k:"crise", s:"lettre", j:"Lettre laissee sur une table", d:"22 novembre",
  t:"POUR CEUX QUI PASSERONT",
  c:"Nous sommes partis vers l'ouest. La maison est ouverte, servez-vous, il "+
    "reste des conserves dans le cellier et de l'eau dans la buanderie. Le "+
    "fusil de mon pere est dans le grenier avec ce qui va avec. Ne dormez pas "+
    "au rez-de-chaussee."},
 {k:"crise", s:"mail", j:"De : cellule-crise@sante.gouv - non delivre", d:"23 novembre",
  t:"DEMANDE DE MOYENS - URGENT - QUATRIEME RELANCE",
  c:"Nos capacites d'accueil sont saturees depuis six jours. Nous n'avons "+
    "plus de sang, plus de sedatifs et plus de personnel valide pour la garde "+
    "de nuit. Sans reponse d'ici demain nous evacuerons ce qui peut l'etre et "+
    "fermerons le site."},
 {k:"crise", s:"texto", j:"Fil de messages", d:"24 novembre",
  t:"ON TIENT LA MAIRIE",
  m:[["eux","on est 14 dans la mairie. porte barricadee"],
     ["moi","vous avez a manger ?"],
     ["eux","3 jours. l'eau on en a pris a la superette"],
     ["moi","tenez bon les secours vont venir"],
     ["eux","il n'y a plus de secours"],
     ["eux","viens pas. vraiment."]]},
 {k:"crise", s:"affiche", j:"Feuille d'information", d:"26 novembre",
  t:"CONSIGNES A LA POPULATION",
  c:"Verrouillez portes et fenetres. Constituez une reserve d'eau. "+
    "N'ouvrez a personne, meme connu de vous. Les secours ne se deplacent "+
    "plus a domicile. Ce document remplace toute publication anterieure."},
 {k:"crise", s:"note", j:"Mot punaise sur une porte", d:"27 novembre",
  t:"NOUS SOMMES AU SOUS-SOL",
  c:"Trois adultes, un enfant. Nous frappons deux coups puis trois. Si vous "+
    "frappez autrement nous n'ouvrirons pas. Si vous lisez ceci et que "+
    "personne ne repond, c'est que nous sommes partis ou pire. Prenez ce que "+
    "vous voulez en haut."},
 {k:"crise", s:"intime", j:"Cahier d'ecolier, ecriture d'enfant", d:"sans date",
  t:"JOUR JE SAIS PLUS",
  c:"Papa dit qu'on part demain. Il a mis les boites dans le sac et il a "+
    "compte les balles trois fois. Maman ne parle plus depuis la maison des "+
    "voisins. Moi j'ai pris mon chat. Je le laisserai pas."},
 {k:"crise", s:"lettre", j:"Feuille pliee dans une poche", d:"sans date",
  t:"SI VOUS TROUVEZ CE PAPIER SUR MOI",
  c:"Je m'appelle Vernier, Andre. J'ai une fille a Rouen. Si vous pouvez lui "+
    "faire savoir, faites-le. Sinon ce n'est pas grave. J'ai tenu six "+
    "semaines et j'ai aide neuf personnes, je les ai comptees. Ce n'est pas "+
    "rien."},
 {k:"crise", s:"affiche", j:"Feuille d'information", d:"sans date",
  t:"DERNIER TIRAGE",
  c:"Nous imprimons ceci a la main, faute de courant. Il n'y a plus de "+
    "consigne a donner. Ceux qui liront cette feuille sauront quoi faire, ou "+
    "ne le sauront pas. Bonne chance."},
 /* ================= TRENTE PIECES SUR LA VIE LOCALE =================
    Elles ne parlent de rien et disent ou chercher. Chaque indice a ete
    confronte aux tables WSRC et SRCHDEF, et le banc refait la verification a
    chaque passage : une coupure qui promettrait ce qu'on ne trouve pas serait
    pire qu'une page noire.

    A ADAPTER POUR CHAQUE NOUVELLE CARTE. C'est le seul bloc du fichier qui
    parle d'un pays precis - son chateau, son stand de tir, son port, sa
    pharmacie des Tilleuls. Un changement de carte doit s'accompagner de sa
    propre serie : memes categories, memes indices verifies contre les tables,
    mais des noms, des lieux et des voix qui appartiennent a l'endroit. Les
    trente pieces sur la crise, elles, valent partout : le laboratoire est le
    meme pour tout le monde. */
 {k:"local", s:"journal", j:"L'Echo de la Vallee", d:"4 fevrier",
  t:"LE CHATEAU ROUVRE SA SALLE D'ARMES",
  c:"Apres deux ans de restauration, la collection d'armes reglementaires est "+
    "de nouveau visible : Lebel 1886, Berthier, un Chauchat en etat de marche "+
    "et une piece rare, la mitrailleuse Hotchkiss de 1914. Le conservateur "+
    "precise que tout est en ordre de tir mais sous vitrine scellee."},
 {k:"local", s:"journal", j:"L'Echo de la Vallee", d:"18 fevrier",
  t:"LE STAND DE TIR FETE SON CINQUANTENAIRE",
  c:"Le club aligne une armurerie fournie : carabines de vingt-deux, Ruger, "+
    "Unique, une Kalachnikov de sport homologuee et les Verney-Carron du "+
    "groupe chasse. Le president rappelle que les munitions restent "+
    "consignees dans le local du fond."},
 {k:"local", s:"note", j:"Mot agrafe a une ordonnance", d:"11 mars",
  t:"PHARMACIE DES TILLEULS - PALETTE 4471",
  c:"Cent quarante boites de stimulants a destination du service de sante des "+
    "armees, livrees ici par erreur. Reprise demandee le 3, relancee le 9. "+
    "Ne pas mettre en rayon. Reserve du fond, etagere du haut, derriere les "+
    "solutes."},
 {k:"local", s:"journal", j:"L'Echo de la Vallee", d:"25 mars",
  t:"LA CASERNE RENOUVELLE SON PARC",
  c:"Les sections percoivent des FAMAS de seconde generation et des HK416. "+
    "Le materiel lourd - une Browning de douze-sept et un fusil de precision "+
    "Hecate - reste consigne a l'armurerie du quartier, ou seuls deux "+
    "sous-officiers ont acces."},
 {k:"local", s:"journal", j:"L'Echo de la Vallee", d:"2 avril",
  t:"GENDARMERIE : DOTATION COMPLETE",
  c:"Pistolets PAMAS et SIG, revolvers MR73 pour les anciens, deux pistolets "+
    "mitrailleurs MP5 et des fusils a pompe Remington. Les gilets pare-balles "+
    "ont ete renouveles l'an dernier ; les anciens sont restes au vestiaire."},
 {k:"local", s:"journal", j:"L'Echo de la Vallee", d:"14 avril",
  t:"LES POMPIERS RECOIVENT DE NOUVELLES TENUES",
  c:"Casques, vestes de feu, surpantalons et bottes montantes pour l'ensemble "+
    "du centre de secours. Les haches d'intervention, elles, n'ont pas change "+
    "depuis vingt ans : c'est le seul endroit du departement ou l'on en "+
    "trouve encore."},
 {k:"local", s:"journal", j:"L'Echo de la Vallee", d:"30 avril",
  t:"L'ARMURERIE DU CENTRE-VILLE CHANGE DE MAINS",
  c:"Le nouveau proprietaire garde la meme ligne : fusils de chasse "+
    "Manufrance et Verney-Carron, carabines de petit calibre, et les deux "+
    "revolvers de defense que la maison vend depuis quarante ans, le MR73 et "+
    "le S&W 686."},
 {k:"local", s:"journal", j:"Le Courrier du Departement", d:"7 mai",
  t:"CAMBRIOLAGES : LES GRENIERS VISITES",
  c:"Une douzaine de maisons fouillees en un mois, toujours sous les combles. "+
    "Les gendarmes notent que les voleurs ne prennent que les carabines de "+
    "vingt-deux : c'est a peu pres tout ce qu'un particulier detient encore "+
    "legalement chez lui."},
 {k:"local", s:"lettre", j:"Lettre a la chambre d'agriculture", d:"19 mai",
  t:"DECLARATION DE DETENTION - REGULARISATION",
  c:"Je reconnais detenir un fusil de chasse et une carabine de petit "+
    "calibre, comme a peu pres toutes les fermes du plateau. Ils sont contre "+
    "la porte de la souillarde depuis mon pere. Je ne les ai jamais declares "+
    "et j'en suis desole."},
 {k:"local", s:"journal", j:"Le Courrier du Departement", d:"3 juin",
  t:"DEPOTS ET HANGARS : LE VOL D'OUTILLAGE EXPLOSE",
  c:"Beches-pioches, haches de sapeur, poignards de collection : ce sont les "+
    "outils lourds qui partent, pas les machines. Un gerant de hangar resume "+
    "la chose ainsi : ce qui se tient a deux mains a de la valeur."},
 {k:"local", s:"affiche", j:"Affiche - centre de secours", d:"21 juin",
  t:"CANICULE : LES REGLES",
  c:"Boire ne remplace pas manger. L'eau rend les jambes et le souffle, elle "+
    "ne referme aucune plaie ; les rations et les conserves font l'inverse, "+
    "lentement. Emportez les deux. Un homme qui a bu marche ; un homme qui a "+
    "mange guerit."},
 {k:"local", s:"journal", j:"Le Courrier du Departement", d:"8 juillet",
  t:"RANDONNEURS SURPRIS PAR LA NUIT",
  c:"Trois secours en une semaine sur le meme sentier. Passe le crepuscule, "+
    "on ne voit plus qu'a une quinzaine de pas, contre une quarantaine en "+
    "plein jour. Les lampadaires des bourgs restent le seul repere fiable."},
 {k:"local", s:"note", j:"Fiche conseil - magasin de sport", d:"24 juillet",
  t:"CHOISIR SON SAC",
  c:"On achete d'abord des litres, ensuite des kilos. Passe la moitie de ce "+
    "qu'on peut porter, l'allure s'effondre ; au-dela du raisonnable on ne "+
    "court plus du tout. Un sac trop grand mal rempli vaut mieux qu'un sac "+
    "juste trop plein."},
 {k:"local", s:"journal", j:"Le Courrier du Departement", d:"11 aout",
  t:"LE CLUB DE CHASSE PRESENTE SA TENUE",
  c:"Cagoule, pantalon renforce et mocassins souples : l'ensemble est concu "+
    "pour ne pas faire de bruit dans les feuilles. Le president assure qu'un "+
    "homme bien vetu passe a dix metres d'un chevreuil sans le lever."},
 {k:"local", s:"mail", j:"De : gerance@droguerie-du-marche.fr", d:"29 aout",
  t:"COMMANDE 8812 - MASQUES A CARTOUCHE",
  c:"Je passe a trente unites. Un client du laboratoire m'en a pris six d'un "+
    "coup mardi et il est revenu jeudi. Je prends aussi les filtres de "+
    "rechange. Si vous avez des blouses jetables, mettez-en deux cartons."},
 {k:"local", s:"journal", j:"La Depeche du Soir", d:"5 septembre",
  t:"LE CENTRE DE SOINS MANQUE DE PLACE",
  c:"Blouses, compresses, sutures et poches de sang s'entassent dans un "+
    "couloir faute de reserve. La direction cherche un local. En attendant, "+
    "tout est range dans les armoires du rez-de-chaussee, portes ouvertes."},
 {k:"local", s:"journal", j:"La Depeche du Soir", d:"17 septembre",
  t:"LA SUPERETTE FAIT LE PLEIN AVANT L'HIVER",
  c:"Conserves, rations de secours, briques de lait et packs d'eau : les "+
    "reserves de l'arriere-boutique sont pleines a craquer. Le gerant "+
    "plaisante en disant qu'il pourrait tenir un siege."},
 {k:"local", s:"journal", j:"La Depeche du Soir", d:"1 octobre",
  t:"LES TOURS DE GUET DU PLATEAU RESTAUREES",
  c:"Les anciens miradors forestiers sont de nouveau accessibles par leur "+
    "echelle. On y voit loin, et l'on n'y monte pas a deux. Les forestiers y "+
    "laissent parfois une hache et une gourde."},
 {k:"local", s:"note", j:"Carte de visite - serrurerie Vasseur", d:"12 octobre",
  t:"TOUTES LES PORTES NE SE VALENT PAS",
  c:"Une maison cede a la premiere tentative. Une gendarmerie demande de la "+
    "patience et de la main. Certaines installations industrielles ne "+
    "s'ouvrent tout simplement pas sans y passer la journee - et encore, avec "+
    "l'outillage."},
 {k:"local", s:"affiche", j:"Panneau - stand de tir", d:"23 octobre",
  t:"LA BOITE DE CINQUANTE NE FAIT PAS L'ETE",
  c:"Une boite se vide en une seance, les debutants l'oublient tous. Comptez "+
    "vos coups. Ne partez jamais avec un seul calibre en poche. Et verifiez "+
    "votre chargeur avant, pas pendant."},
 {k:"local", s:"journal", j:"La Depeche du Soir", d:"30 octobre",
  t:"LES ANCIENS DU REGIMENT SE SOUVIENNENT",
  c:"Reunion annuelle au monument. Beaucoup ont garde leur poignard de "+
    "dotation, quelques-uns leur beche-pioche de 1916. Un ancien montre sa "+
    "hache de sapeur : elle sert desormais a fendre son bois."},
 {k:"local", s:"journal", j:"L'Echo de la Vallee", d:"4 novembre",
  t:"LE MARCHE HEBDOMADAIRE TIENT BON",
  c:"Malgre les rumeurs, les etals restent garnis. Un maraicher rappelle "+
    "qu'un champ se recolte et se recolte encore : ce qu'on prend aujourd'hui "+
    "repousse pour la semaine suivante, a condition de ne pas arracher le "+
    "pied."},
 {k:"local", s:"journal", j:"L'Echo de la Vallee", d:"6 novembre",
  t:"LE PORT DE PECHE S'EQUIPE",
  c:"Cires, bottes montantes et bonnets pour tout l'equipage. Le patron "+
    "pecheur explique qu'un homme trempe tient une heure, un homme sec tient "+
    "la nuit. La cooperative en a commande pour deux ans."},
 {k:"local", s:"note", j:"Note de service - hopital", d:"10 novembre",
  t:"PLAN BLANC : REGROUPEMENT DES STOCKS",
  c:"Morphine et trousses de secours sont regroupees au bloc. Les masques a "+
    "cartouche du service d'hygiene sont distribues au personnel de nuit. "+
    "Les permissions sont suspendues jusqu'a nouvel ordre."},
 {k:"local", s:"texto", j:"Fil de messages", d:"14 novembre",
  t:"LA STATION EST VIDE",
  m:[["moi","tu es a la station ?"],
     ["eux","oui. il reste rien"],
     ["eux","ni eau ni barres ni bidons"],
     ["moi","et le gasoil"],
     ["eux","file d'attente depuis 5h. j'ai vendu mon dernier jerrican"],
     ["eux","a un type qui avait pas de voiture"]]},
 {k:"local", s:"intime", j:"Carnet d'un garde forestier", d:"16 novembre",
  t:"TOURNEE DU PLATEAU",
  c:"Mirador nord : echelle bonne, j'ai laisse la hache et une gourde pleine. "+
    "Mirador est : la rambarde a lache, ne pas s'appuyer. On voit tout le "+
    "plateau de la-haut, et on entend venir de loin. Si ca tourne mal, c'est "+
    "la que je monterai."},
 {k:"local", s:"affiche", j:"Affiche - mairie", d:"19 novembre",
  t:"CE QU'IL FAUT EMPORTER",
  c:"De quoi boire et de quoi manger, en deux tas separes. Un vetement chaud, "+
    "un vetement solide. De quoi refermer une plaie. Et de la place dans le "+
    "sac : ce qu'on ramasse en route vaut mieux que ce qu'on a prevu."},
 {k:"local", s:"affiche", j:"Affiche - mairie", d:"22 novembre",
  t:"NE PARTEZ PAS SEUL",
  c:"Un homme seul ne tient pas une porte. Les mairies recensent ceux qui "+
    "acceptent de suivre. On ne confie pas une arme a quelqu'un qu'on connait "+
    "depuis la veille, et un compagnon a court de munitions ne sert a rien : "+
    "donnez-lui de quoi tirer, ou ne lui donnez rien."},
 {k:"local", s:"affiche", j:"Affiche - mairie", d:"24 novembre",
  t:"REGROUPEMENTS : CHOISISSEZ UN BATIMENT SOLIDE",
  c:"Quatre murs, une porte qui ferme, et de la place pour ce que vous "+
    "rapportez. Designez un signe visible - un brassard, un foulard - et que "+
    "tout le monde le porte. On tire moins sur ce qu'on reconnait."},
 {k:"local", s:"texto", j:"Fil de messages", d:"25 novembre",
  t:"IL EST BLESSE",
  m:[["eux","Marc s'est fait mordre au bras"],
     ["moi","il a de quoi se soigner ?"],
     ["eux","il a tout dans son sac mais il touche a rien"],
     ["moi","dis lui d'ouvrir. ca sert a ca"],
     ["eux","il dit qu'il garde pour plus tard"],
     ["moi","il n'y aura pas de plus tard s'il attend"]]}
];


