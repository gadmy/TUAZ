"use strict";
/* ================================================================
   TUAZ - 09-menace.js
   Le prologue, se terrer, la riposte des uniformes, l'assaut, la
   defense de la base et le combat des compagnons.
   (lignes 9605 a 11691 du mono-fichier d'origine)
   ================================================================ */
/* ================= LE PROLOGUE =================
   Le pays allait mal des la premiere seconde : le laboratoire crachait avant
   meme qu'on ait fait trois pas, et l'on n'avait rien vu du monde d'avant.
   Desormais RIEN NE COMMENCE TANT QUE LE JOUEUR N'A PAS DEMANDE. Poser la
   question de la rumeur a un habitant, c'est ouvrir la porte du laboratoire.

   ANCRE SUR UN GESTE, PAS SUR LE DEBUT DE PARTIE. G.pro0 retient l'instant de
   cette question, et les trois etapes se comptent a partir de la. Un joueur
   qui ne demande jamais rien vit dans un pays qui ne tombe jamais : c'est
   voulu, il n'y a pas de filet.

   TROIS DECALAGES, ET RIEN D'AUTRE A REGLER :
   PRO_SORTIE  les zombis sont dehors. Avant cela on ne recrute pas et l'on
               ne fouille pas - il n'y a aucune raison de forcer une porte
               dans un pays qui va bien.
   PRO_FLIC    l'ordre de quarantaine. Un uniforme vient le dire en face, et
               c'est a partir de ce moment que les habitants FUIENT les
               zombis. Avant, ils ne savent pas ce que c'est.
   PRO_ANNEAU  le laboratoire se tait et l'anneau prend le relais. Les deux
               sources ne travaillent jamais ensemble. */
var PRO_SORTIE=180, PRO_FLIC=300, PRO_ANNEAU=420;
/* PRO_AUTO : l'invasion ne depend plus d'aucun geste. Deux minutes apres le
   depart, le laboratoire cede - c'est le seul declencheur. MORAL_FAIL : le
   coup au moral quand la breche surprend une course du jour inachevee (defaut,
   quand la course n'a pas de gain propre). */
var PRO_AUTO=120, MORAL_FAIL=25;
/* Le temps ecoule depuis la question, ou -1 si elle n'a pas ete posee. */
function proT(){ return (G&&G.pro0>=0)?(G.t-G.pro0):-1; }
function proOpen(){ return proT()>=PRO_SORTIE; }
function proFear(){ return proT()>=PRO_FLIC; }
function proRing(){ return proT()>=PRO_ANNEAU; }
/* La question a ete posee. Une seule fois : rouvrir la meme conversation ne
   remet pas la pendule a zero. */
function proStart(){
    /* LA QUESTION N'OUVRE PLUS LE LABORATOIRE. L'invasion part au compte a
       rebours (updPro) et de nulle part ailleurs. Poser la question de la
       rumeur reste un echange comme un autre : on garde la ligne d'ambiance,
       mais la pendule ne bouge pas. */
    if(!G||G.pro0>=0) return false;
    logMsg("Il parle d'un bruit du cote du laboratoire. Vous n'y pensez "+
           "plus tout de suite.","jday");
    return false;
}
function updLab(dt){
    var Math=DMATH, p=G.p, i, a, d, x, y, z, ok;
    /* Rien avant la question, et rien apres que l'anneau ait pris le relais
       n'est plus produit PAR LE LABORATOIRE : les deux sources ne se
       chevauchent pas. */
    if(proT()<0) return;
    /* L'ARMEE ARRIVEE, PLUS RIEN NE NAIT. Sans cette clause l'anneau
       continuait de poser des zombis autour du joueur pendant que les soldats
       nettoyaient : la carte redescendait a vingt-sept puis remontait a
       trente-sept, et la partie ne se gagnait jamais. */
    if(G.quarArmy) return;
    LABT+=dt; LABC-=dt;
    if(LABC>0) return;
    LABC=ZCFG.labEvery;
    if(zAlive()>=ZCFG.cap) return;
    if(!proRing()){
        /* la source est le batiment : ils sortent par la porte sud */
        if(!LAB) return;
        ok=false;
        for(i=0;i<20&&!ok;i++){
            x=LAB.x+rr(-24,24); y=LAB.y+rr(98,132);
            if(hitObstacle(x,y,8)||inSea(x,y)) continue;
            ok=true;
        }
        if(!ok){ x=LAB.x; y=LAB.y+112; }
        z=zSpawn(x,y);
        /* il sort par le sud : un cap tire au hasard sur tout le tour le
           renverrait une fois sur deux dans sa propre cloture, ou il raserait
           le grillage sans s'eloigner. On ne lui laisse que le demi-tour
           oppose au batiment. */
        zMarch(z,rr(0.38,2.76),ZCFG.labWalk);
        LABN++;
        return;
    }
    /* la source a change de place : elle suit le joueur, a bonne distance.
       RING_IN depasse la demi-diagonale du plus large plan de vue, recul de
       visee compris, donc rien ne parait jamais dans le champ. */
    ok=false;
    for(i=0;i<40&&!ok;i++){
        a=rr(0,6.283); d=rr(RING_IN,RING_OUT);
        x=clamp(p.x+Math.cos(a)*d,120,CFG.WORLD-120);
        y=clamp(p.y+Math.sin(a)*d,120,CFG.WORLD-120);
        if(dist2(x,y,p.x,p.y)<RING_IN*RING_IN) continue;
        if(hitObstacle(x,y,10)||inSea(x,y)||inSwamp(x,y)) continue;
        ok=true;
    }
    if(!ok) return;
    z=zSpawn(x,y);
    /* il part vers le joueur sans le savoir : la marche de trente secondes
       le pose dans les parages, apres quoi il erre comme les autres */
    zMarch(z,datan2(p.y-y,p.x-x)+rr(-0.6,0.6),ZCFG.labWalk);
    LABN++;
}
/* ---- L'UNIFORME QUI PORTE L'ORDRE ----
   A PRO_FLIC, un policier quitte son poste et vient le dire en face. Il n'y a
   pas d'annonce a l'ecran : quelqu'un marche jusqu'a vous et parle.

   ON PREND LE PLUS PROCHE, DANS L'ORDRE DE WORKERS, et l'ordre de ce tableau
   est reproductible - deux rejeux depechent donc le meme homme. S'il n'y en a
   aucun de vivant sur la carte, l'etape passe sans bruit : le pays n'avait
   plus personne pour porter l'ordre, ce qui se raconte tout seul.

   IL MARCHE, IL NE PARAIT PAS. Sa cible est le joueur, rafraichie a chaque
   tour ; arrive a portee de parole il ouvre le dialogue lui-meme. */
var PRO_FLICD=52;
function proCop(){
    var best=null, bd=1e9, i, n, d;
    for(i=0;i<WORKERS.length;i++){
        n=WORKERS[i];
        if(n.dead||n.job!=="policier") continue;
        d=dist2(n.x,n.y,G.p.x,G.p.y);
        if(d<bd){ bd=d; best=n; }
    }
    return best;
}
function updPro(dt){
    var f, d;
    if(!G) return;
    /* LA BRECHE. L'invasion ne se declenche plus par aucune conversation :
       deux minutes apres le depart, le laboratoire cede, un point c'est
       tout. Une seule fois. */
    if(G.pro0<0&&G.t>=PRO_AUTO){
        G.pro0=G.t; LABT=0; LABC=0;
        logMsg("Une detonation sourde, du cote du laboratoire. Puis le "+
               "silence. Quelque chose vient de ceder.","jday");
        G.shake=Math.max(G.shake,14);
        G.boom=0.6;
        spawnClouds();
    }
    /* LE COUP AU MORAL. Quand les zombis sortent sans que la course du jour
       soit finie, le personnage encaisse : il n'aura pas eu le temps de faire
       ce qui comptait, et le monde bascule. Une seule fois. */
    if(!G.moralHit&&proOpen()){
        G.moralHit=1;
        if(G.quest&&!G.quest.done){
            var pen=(G.quest.reward!==undefined)?G.quest.reward:MORAL_FAIL;
            moralAdd(-pen);
            notice("MORAL EN BERNE");
            logMsg("Vous n'avez pas eu le temps de finir votre journee, et "+
                   "deja tout bascule. Quelque chose se brise en vous.","jsay");
        }
    }
    if(G.proDit) return;
    if(!proFear()) return;
    if(!G.proFlic){
        G.proFlic=proCop();
        if(!G.proFlic){
            /* personne pour le dire : l'etape est passee, on ne la rejoue pas */
            G.proDit=1;
            logMsg("Une sirene tourne quelque part et s'arrete. Personne ne "+
                   "vient rien vous dire.","jday");
            return;
        }
        G.proFlic.pro=1;
        logMsg("Un uniforme se detache et vient droit sur vous.","jday");
        notice("ON VOUS CHERCHE");
    }
    f=G.proFlic;
    if(f.dead){ G.proFlic=null; return; }
    /* il marche sur vous, et rien d'autre ne le detourne */
    f.tx=G.p.x; f.ty=G.p.y; f.wt=1; f.stop=0;
    d=dist2(f.x,f.y,G.p.x,G.p.y);
    if(d<PRO_FLICD*PRO_FLICD&&!G.talk&&!G.inside){
        G.proDit=1;
        f.pro=0;
        /* IL LE DIT EN BULLES, PAS EN PANNEAU. Deux repliques au-dessus des
           tetes ; forcees, car la crise couperait un echange ordinaire. On
           l'immobilise le temps de l'echange pour que la bulle tienne. */
        f.stop=2*CHAT_LINE+1; f.face=(G.p.x<f.x)?-1:1;
        var pch={people:[G.p,f], li:0, forced:1, t:CHAT_LINE,
            lines:[[1,"Rentrez chez vous. Ordre de quarantaine, tout de suite, "+
                      "et n'ouvrez a personne."],
                   [0,"Me terrer ? Je ferais mieux de me trouver des armes et "+
                      "des compagnons."]]};
        pch.spk=pch.lines[0][0]; f.chat=pch;
        CHATS.push(pch);
        logMsg("Ordre de quarantaine. Les gens commencent a comprendre ce "+
               "qu'ils voient - et vous n'avez plus de scrupules devant "+
               "leurs portes.","jsay");
        notice("QUARANTAINE");
    }
}
/* ================= SE TERRER, ET GAGNER =================
   Le flic dit de rentrer chez soi. Le personnage repond qu'il ferait mieux
   de se trouver des armes, et c'est ce que fera le joueur neuf fois sur dix.
   Mais OBEIR EST UNE VRAIE FIN, et c'est la seule du jeu.

   ON RENTRE CHEZ SOI - sa maison, pas n'importe quel toit - et l'on attend
   une demi-heure. Passe la premiere minute les zombis commencent a s'agglomerer
   autour de la maison, de plus en plus nombreux, trois cents au bout des
   trente minutes. Alors la caserne se reveille : des militaires paraissent,
   FAMAS a la main, munitions infinies et pas de rechargement, et il en vient
   sans fin jusqu'a ce que plus rien ne bouge. Le dernier zombi abattu, la
   partie est gagnee.

   SORTIR ANNULE TOUT, ET DEFINITIVEMENT. Ce n'est pas une pause : on a
   choisi l'autre vie. C'est ce qui donne son poids a la demi-heure - trente
   minutes ou l'on ne peut rien faire d'autre que regarder la fenetre se
   remplir, contre une partie entiere a chercher des armes et des gens.

   LE SIEGE EST LA MISE EN SCENE. Il n'y a pas de cinematique dans ce jeu :
   ce que l'on voit par la fenetre, ce sont de vrais zombis qui arrivent
   vraiment, et l'on peut leur tirer dessus si l'on veut. */
var QUAR_DELAI=60, QUAR_WIN=1800, QUAR_MAX=300;
var QUAR_R0=170, QUAR_R1=430, QUAR_RATE=6;
/* Ils tiennent une ligne, ils ne chargent pas. MIL_APP est la distance a
   laquelle ils s'arretent d'avancer, MIL_POR celle a laquelle ils tirent -
   au-dela de la portee des balles de PNJ, trois cents pixels, ils tireraient
   dans le vide. MIL_CAD est leur cadence propre : un FAMAS en automatique ne
   lache pas un coup toutes les secondes et demie comme un gendarme au
   pistolet. Et ils sont plus durs que le tout-venant - equipes, casques, et
   surtout ils ne doivent pas fondre avant d'avoir tire. */
var MIL_EVERY=1.1, MIL_VIVANTS=20, MIL_POR=280;
var MIL_CAD=0.30, MIL_HP=220, MIL_LIGNE=560, MIL_LIBRE=1200, MIL_MASSE=40;
var MIL_PATIENCE=12;
function quarOn(){ return !!(G&&G.quarT>=0); }
/* Rentrer chez soi apres l'ordre : le compte part. */
function quarEnter(b){
    if(!G||!G.p||b!==G.p.homeB) return;
    if(!proFear()||G.quarOut||G.quarT>=0) return;
    G.quarT=0;
    logMsg("Vous refermez la porte derriere vous. Si vous tenez une "+
           "demi-heure sans ressortir, l'armee finira par venir.","jsay");
    notice("CONFINEMENT");
}
/* En ressortir avant la releve : la porte se referme sur cette fin-la. */
function quarLeave(){
    if(!G||G.quarT<0||G.quarArmy) return;
    G.quarT=-1; G.quarOut=1;
    logMsg("Vous ressortez. L'armee ne viendra pas vous chercher : cette "+
           "porte-la est fermee pour de bon.","jsay");
    notice("CONFINEMENT ROMPU");
}
/* Combien de zombis devraient etre au pied de la maison a cet instant. */
function quarCible(){
    if(!quarOn()) return 0;
    var f=(G.quarT-QUAR_DELAI)/(QUAR_WIN-QUAR_DELAI);
    return Math.round(QUAR_MAX*Math.max(0,Math.min(1,f)));
}
function quarCount(){
    var n=0, i, z;
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(z.qsg&&!z.dead&&!z.gone) n++;
    }
    return n;
}
/* Poser un assiegeant autour de la maison. */
function quarSpawn(hx,hy){
    var Math9=DMATH, q, a, d, x, y, z, ok=false;
    for(q=0;q<12&&!ok;q++){
        a=rr(0,6.283); d=rr(QUAR_R0,QUAR_R1);
        x=hx+Math9.cos(a)*d; y=hy+Math9.sin(a)*d;
        if(x<80||y<80||x>CFG.WORLD-80||y>CFG.WORLD-80) continue;
        if(hitObstacle(x,y,9)||inSea(x,y)) continue;
        ok=true;
    }
    if(!ok) return null;
    z=zSpawn(x,y);
    z.qsg=1;
    return z;
}
/* ---- LA RELEVE ----
   Ils naissent au bord de la carte du cote de la maison et marchent sur le
   zombi le plus proche. FAMAS, munitions infinies, pas de rechargement : ce
   ne sont pas des personnages, c'est la fin du monde qui se retire.
   Ils rejoignent WORKERS pour etre dessines, comptes parmi les vivants et
   mordus comme tout le monde ; updWorkers les laisse tranquilles. */
function milWeapon(){
    var q;
    for(q=0;q<WEAPONS.length;q++) if(WEAPONS[q].n==="FAMAS G2") return WEAPONS[q];
    for(q=0;q<WEAPONS.length;q++) if(String(WEAPONS[q].n).indexOf("FAMAS")===0) return WEAPONS[q];
    return null;
}
/* Un zombi vivant tire au hasard, pour savoir ou envoyer du monde. */
function milAncre(hx,hy){
    var L=[], i, z;
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(!z.dead&&!z.gone) L.push(z);
    }
    if(!L.length) return null;
    return L[Math.min(L.length-1,Math.floor(rng()*L.length))];
}
function milSpawn(hx,hy){
    var Math9=DMATH, q, a, d, x, y, ok=false, w=milWeapon();
    /* TANT QUE LE SIEGE TIENT, ils debarquent autour de la maison et s'y
       postent. UNE FOIS LA MASSE DEFAITE, ils debarquent la ou il reste
       quelqu'un : sans cela les derniers trainards, disperses aux quatre
       coins et proteges par les murs que les soldats ne savent pas
       contourner, tenaient la partie en echec indefiniment. C'est aussi ce
       que dit la fiction - il en vient sans fin, et ils vont ou il faut. */
    if(!milSiege(hx,hy)){
        var an=milAncre(hx,hy);
        if(an){ hx=an.x; hy=an.y; }
    }
    for(q=0;q<16&&!ok;q++){
        a=rr(0,6.283); d=rr(300,520);
        x=hx+Math9.cos(a)*d; y=hy+Math9.sin(a)*d;
        if(x<80||y<80||x>CFG.WORLD-80||y>CFG.WORLD-80) continue;
        if(hitObstacle(x,y,9)||inSea(x,y)) continue;
        ok=true;
    }
    if(!ok) return null;
    /* Son poste sur la ligne : le cap ou il est ne, a MIL_LIGNE de la maison.
       Il y va et il y reste. */
    var pa=datan2(y-hy,x-hx);
    var s={x:x, y:y, hx:x, hy:y, rad:60, job:"militaire",
           px:hx+Math9.cos(pa)*MIL_LIGNE, py:hy+Math9.sin(pa)*MIL_LIGNE,
           tx:x, ty:y, wt:0, face:1, anim:rr(0,6), stop:0, dead:0,
           fear:0, fdx:0, fdy:0, name:pickName(rng()<0.2),
           bio:0, foi:10, kit:(rng()*SOLSPR.length)|0,
           rel:1, inf:1, fcd:rr(0,1),
           maxhp:100, hp:100, sta:100};
    var j=jobRoll("militaire");
    s.stats=j.stats; s.sec=j.sec; s.sec0=j.sec0; s.spec=j.spec;
    s.maxhp=Math.max(MIL_HP,hpMax(s)); s.hp=s.maxhp;
    s.slots=[null,null,null,null]; s.mag=[0,0,0,0];
    if(w) s.slots[wSlot(w)]=w;
    WORKERS.push(s);
    return s;
}
function milAlive(){
    var n=0, i;
    for(i=0;i<WORKERS.length;i++) if(WORKERS[i].rel&&!WORKERS[i].dead) n++;
    return n;
}
/* Le zombi le plus proche d'un soldat. Sans grille et sans portee : ils sont
   peu nombreux, et il faut qu'ils aillent chercher le dernier. */
function milTarget(s){
    var best=null, bd=1e9, i, z, d;
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(z.dead||z.gone) continue;
        d=dist2(s.x,s.y,z.x,z.y);
        if(d<bd){ bd=d; best=z; }
    }
    return best;
}
/* Reste-t-il du monde au pied de la maison ? Tant qu'il y en a, les soldats
   tiennent leur ligne ; quand il n'y en a plus, ils partent chercher les
   trainards ou qu'ils soient. */
/* On tient la ligne tant qu'ils sont NOMBREUX, pas tant qu'il en reste un.
   Avec la seconde regle, une trentaine de trainards coinces derriere un mur -
   hors de vue, donc jamais tires - gardaient vingt hommes plantes a leur
   poste pour toujours : la carte se figeait a trente et un et la partie ne se
   gagnait jamais. Sous MIL_MASSE, la ligne se defait et chacun va chercher le
   sien. */
function milSiege(hx,hy){
    var i, z, n=0;
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(z.dead||z.gone) continue;
        if(dist2(z.x,z.y,hx,hy)<MIL_LIBRE*MIL_LIBRE&&(++n)>=MIL_MASSE) return true;
    }
    return false;
}
/* ---- ILS TIENNENT UNE LIGNE, ILS NE CHARGENT PAS ----
   Un premier jet les envoyait sur le zombi le plus proche : chacun arrivait
   seul au milieu de trois cents et mourait avant d'avoir tire. Deux cent
   soixante hommes tombes pour quarante-six zombis. Ils se postent maintenant
   en cercle a MIL_LIGNE de la maison et tirent ce qui vient - et ce qui vient
   vient par grappes, puisque les assiegeants se detournent des qu'ils voient
   quelqu'un. Le siege se defait par la peripherie au lieu de se defendre en
   masse. Une fois les abords vides, ils vont chercher les trainards. */
function updRelief(dt,hx,hy){
    var Math9=DMATH, i, s, t, dx, dy, l, w, nx, ny, gx, gy, gl;
    var siege=milSiege(hx,hy);
    for(i=0;i<WORKERS.length;i++){
        s=WORKERS[i];
        if(!s.rel||s.dead) continue;
        t=milTarget(s);
        s.fcd=(s.fcd||0)-dt;
        /* ou il veut aller : son poste tant que le siege tient, le zombi le
           plus proche ensuite */
        if(siege){ gx=s.px; gy=s.py; }
        else if(t){ gx=t.x; gy=t.y; }
        else { gx=s.x; gy=s.y; }
        dx=gx-s.x; dy=gy-s.y; gl=Math9.hypot(dx,dy)||1;
        if(gl>18){
            /* ---- ILS SAVENT CONTOURNER ----
               Un premier jet avancait en ligne droite et s'arretait au premier
               mur : les derniers trainards, tapis derriere une facade, tenaient
               la partie en echec - elle se figeait a huit zombis. grpStep est
               le suivi de paroi des compagnons, ecrit pour exactement ce
               probleme, et il ne demande qu'un objet qui ait x, y, face et
               anim. On le leur prete tel quel. */
            grpStep(s,dt,gx,gy,34);
        }
        if(t){
            l=Math9.hypot(t.x-s.x,t.y-s.y)||1;
            /* ---- LA PATIENCE A UNE FIN ----
               Celui qu'on n'arrive pas a atteindre depuis MIL_PATIENCE
               secondes est acheve au corps a corps, sans ligne de vue : vingt
               hommes agglutines devant une facade sans jamais lacher un coup,
               cela s'est vu au banc et cela tenait la partie ouverte
               indefiniment.
               La clause hitObstacle qui l'accompagne est un FILET, plus une
               necessite : depuis que zUnstick pousse les zombis hors de la
               pierre, il ne devrait plus s'en trouver un seul dedans. On la
               garde parce qu'une partie qui ne peut pas se terminer est le
               pire des defauts, et qu'elle ne coute rien. */
            s.stall=(s.stall||0)+dt;
            var mure=hitObstacle(t.x,t.y,5)||s.stall>MIL_PATIENCE;
            if(l<=MIL_POR&&s.fcd<=0&&mure){
                hurt(t,26,1,0,1);
                s.fcd=MIL_CAD*3; s.stall=0;
                s.face=(t.x<s.x)?-1:1;
            } else if(l<=MIL_POR&&s.fcd<=0&&los(s.x,s.y,t.x,t.y)){
                w=milWeapon();
                if(w){
                    npcFire(s,w,t);
                    /* npcFire pose la cadence du gendarme au pistolet : on
                       remet la leur par-dessus, sans quoi le FAMAS tirerait
                       moins vite qu'un revolver */
                    s.fcd=MIL_CAD; s.stall=0;
                    s.face=(t.x<s.x)?-1:1;
                }
            }
        }
        collide(s,5);
    }
}
function updQuar(dt){
    var hb=G&&G.p&&G.p.homeB, hx, hy, i, q, manque;
    if(!hb) return;
    hx=hb.x+hb.w/2; hy=hb.y+hb.h/2;
    /* ---- LE COMPTE ---- */
    if(G.quarT>=0&&!G.quarArmy){
        if(G.inside!==hb){ quarLeave(); return; }
        G.quarT+=dt;
        /* les annonces de palier, une seule fois chacune */
        var pal=[300,600,900,1200,1500];
        for(q=0;q<pal.length;q++)
            if(G.quarT>=pal[q]&&!(G.quarDit&(1<<q))){
                G.quarDit=(G.quarDit|0)|(1<<q);
                logMsg("Ils sont "+quarCount()+" autour de la maison. Encore "+
                       Math.round((QUAR_WIN-G.quarT)/60)+" minutes.","jday");
            }
    } else if(G.quarArmy) G.quarT+=dt;
    if(G.quarT<0) return;
    /* ---- LE SIEGE ----
       ON NE LE REAPPROVISIONNE PLUS UNE FOIS L'ARMEE LA. Sans cette clause il
       se remplissait a mesure qu'on le vidait : les soldats abattaient trois
       cents zombis pour en retrouver trois cents, et la partie ne se gagnait
       jamais. Le siege monte pendant la demi-heure, puis il est ce qu'il
       est. */
    manque=G.quarArmy?0:(quarCible()-quarCount());
    if(manque>0){
        q=Math.min(manque,QUAR_RATE);
        for(i=0;i<q;i++) quarSpawn(hx,hy);
    }
    /* ils ne s'en vont pas : la maison est leur seul but */
    for(i=0;i<ZOMBIES.length;i++){
        var z=ZOMBIES[i];
        if(!z.qsg||z.dead||z.gone) continue;
        if(z.st===0){ z.tx=hx; z.ty=hy; z.wt=1; }
    }
    /* ---- LA RELEVE ---- */
    if(!G.quarArmy&&G.quarT>=QUAR_WIN){
        G.quarArmy=1;
        /* ON LES DETACHE DE LA MAISON. Tant qu'ils y sont cloues, ceux qui se
           pressent contre le mur du fond ne voient jamais un soldat et
           aucun soldat ne les voit : la carte se figeait a trente. Rendus a
           eux-memes, ils entendent les coups de feu - npcFire fait du bruit
           et zHears le porte - et ils y vont. */
        for(i=0;i<ZOMBIES.length;i++) ZOMBIES[i].qsg=0;
        logMsg("Des moteurs, au loin, puis des ordres criés. L'armee est la.",
               "jsay");
        notice("L'ARMEE ARRIVE");
    }
    if(G.quarArmy){
        G.milC=(G.milC||0)-dt;
        if(G.milC<=0){
            G.milC=MIL_EVERY;
            if(milAlive()<MIL_VIVANTS) milSpawn(hx,hy);
        }
        updRelief(dt,hx,hy);
        /* ---- LA FIN ---- */
        if(zAlive()<=0){
            logMsg("Plus un seul debout. C'est fini.","jsay");
            endGame(true);
        }
    }
}
/* Une balle qui touche : on retire la vie, on marque le coup, et le corps
   reste sur place avec ce qu'il portait. */
function hurt(o,d,isZ,byZ,byNpc,force){
    if(!o||o.dead) return;
    var isP=(o===G.p);
    /* LA MEME CARCASSE POUR TOUS. Un vivant encaisse selon sa Vigueur - un
       quart de degats en plus a zero, un quart en moins a cent. Les zombis
       ne l'ont pas : ils ne sont plus des vivants.
       IL N'Y A AUCUN REPIT APRES UN COUP, POUR PERSONNE. Le joueur avait six
       dixiemes de seconde d'invulnerabilite et les autres rien : c'etait le
       reste des deux jeux d'equilibrage. Tout coup qui part et qui touche
       compte, quelle que soit la cadence - une rafale entiere entre, une
       horde qui se referme mord autant de fois qu'elle a de bouches.
       force saute la Vigueur elle-meme : c'est la maladie, la faim, le sang
       qui coule - ce qui vient du dedans ne se pare pas. */
    if(!isZ&&!o.traits){
        d*=1.25-0.5*statEff(o,"combat","vigueur")/100;
        if(!force){
            /* le corps apprend a encaisser, et la carcasse a tenir */
            secBump(o,"vigueur",1);
            secBump(o,"sante",1);
        }
    }
    o.hp-=d; o.hitT=0.18;
    /* Les chiffres de combat montent au-dessus des zombis et de leurs cibles.
       Pas au-dessus du joueur : pour lui, ce sont ses barres qui parlent. */
    if(o!==G.p&&(o.traits||byZ)&&Math.round(d)>=1)
        G.texts.push({v:"-"+Math.round(d),x:o.x,y:o.y-14,t:0.85,c:"#e0705a"});
    /* ce qui ne regarde que celui qu'on joue : l'ecran et le son */
    if(isP){ o.flash=0.25; G.shake=Math.max(G.shake,3); sHurt(); }
    if(o.hp<=0&&isP){ o.hp=0; playerFall(byZ); return; }
    if(o.hp<=0){
        o.hp=0; o.dead=1;
        /* les corps ne partaient jamais : ils s'entassaient jusqu'a la fin de
           la partie. Ils suivent maintenant la regle des objets au sol. */
        corpseNote(o);
        if(isZ){ logMsg("Un zombi s'effondre.","jday"); grpKill(o.x,o.y); return; }
        logMsg((o.name||"Un habitant")+" s'effondre.","jsay");
        /* seule la morsure transmet : un habitant fauche par une balle ou par
           un souffle reste un mort ordinaire, celui que les dents ont eu se
           releve au bout d'une minute */
        if(byZ){ o.rise=ZCFG.rise; RISERS.push(o); }
        /* mort de la main du joueur : on compte les temoins. Un zombi qui tue
           n'engage que lui, et la balle perdue d'un uniforme non plus : ce
           serait injuste de nous imputer sa maladresse. */
        else if(!byNpc&&!o.traits) witnessKill(o);
    }
}
/* ---- LA RELEVE ----
   Les corps mordus attendent leur minute dans une liste a part : les listes
   de vivants ne gardent pas les morts, et parcourir tous les habitants de la
   carte a chaque tour pour trouver trois cadavres serait absurde. Au terme,
   le corps disparait et un zombi se leve a sa place, sous le nom du defunt. */
var RISERS=[];
function updRise(dt){
    var i, o, z;
    for(i=RISERS.length-1;i>=0;i--){
        o=RISERS[i];
        if(!o||o.gone||!o.dead){ RISERS.splice(i,1); continue; }
        o.rise-=dt;
        if(o.rise>0) continue;
        RISERS.splice(i,1);
        o.gone=1;
        if(zAlive()>=ZCFG.cap) continue;
        z=zSpawn(o.x,o.y);
        z.name=o.name||"Zombi";
        z.face=o.face||1;
        /* IL GARDE SES VETEMENTS. Ce n'est pas un zombi de laboratoire : il
           portait ces habits il y a une minute et les porte encore. On fige
           sa silhouette d'habitant, celle qu'il avait vivant, et drawZombies
           la couvre de sang au lieu de poser le skin commun. */
        z.turned=1; z.hspr=bodySpr(o);
        /* il etait cette personne il y a une minute : il porte encore ce
           qu'elle portait. Le corps disparait, le sac passe au zombi, et la
           premiere arme du sac lui reste au poing - ce qu'on lui voit en
           main est exactement ce qu'on lui prendra. */
        if(o.inv){
            z.inv=o.inv; o.inv=null;
            var q9, c9, w9;
            for(q9=0;q9<z.inv.length;q9++){
                c9=z.inv[q9];
                if(c9&&cellIsW(c9)){ w9=WEAPONS[c9.w];
                    if(w9) z.slots[wSlot(w9)]=w9;
                    break; }
            }
        }
        if(dist2(o.x,o.y,G.p.x,G.p.y)<520*520)
            logMsg((o.name||"Un mort")+" se releve.","jsay");
    }
}
/* ---- ARMES EN MAIN ET TIR ----
   Quatre emplacements, un par categorie ; les touches 1 a 4 en changent.
   Le tir part de l'angle vise, ecarte au hasard dans le cone que la
   competence Tir et l'aptitude Stabilite laissent ouvert. Les munitions se
   comptent : voir le ravitaillement par calibre, plus bas.
   Tout passe par le journal d'entrees : l'angle y est quantifie sur 512 pas,
   de sorte que le rejeu reproduit la scene au projectile pres. */
function handWeapon(){
    var p=G.p;
    if(!p||p.hand<0) return null;
    return p.slots[p.hand]||null;
}
function selectHand(i){
    var p=G.p;
    if(i<0||i>3) return;
    if(p.hand===i){ p.hand=-1; G.armed=false; return; }
    if(!p.slots[i]){ notice("EMPLACEMENT VIDE"); return; }
    p.hand=i; G.armed=true;
    /* Maniement raccourcit la prise en main, dans la meme proportion */
    p.eqT=wEquip(p.slots[i])*(1.25-0.5*statEff(p,"tir","maniement")/100);
    secBump(p,"maniement",1);
    notice(p.slots[i].n.toUpperCase());
}
function setSlot(sl,wi){
    var p=G.p;
    if(sl<0||sl>3) return;
    /* un emplacement par categorie : rien d'autre n'y entre */
    var w=(wi>=0&&wi<WEAPONS.length)?WEAPONS[wi]:null;
    if(w&&wSlot(w)!==sl) return;
    p.slots[sl]=w;
    /* LE CHARGEUR ARRIVE PLEIN. L'arme est prete des qu'on la prend en main.
       Contrepartie assumee : reequiper refait le plein pour rien - c'est le
       prix de "toujours prete". Le corps a corps n'a pas de chargeur. */
    p.mag[sl]=(w&&w.mag)?w.mag:0;
    if(p.hand===sl&&!p.slots[sl]){ p.hand=-1; G.armed=false; }
}
/* Le mode de tir en cours pour l'arme en main, et le passage au suivant. */
function handMode(){
    var p=G.p, w=handWeapon();
    if(!w) return 0;
    var l=w.md||[0];
    return l[(p.fm[p.hand]||0)%l.length];
}
function cycleMode(){
    var p=G.p, w=handWeapon();
    if(!w){ notice("MAIN VIDE"); return; }
    var l=w.md||[0];
    if(l.length<2){ notice("UN SEUL MODE"); return; }
    p.fm[p.hand]=((p.fm[p.hand]||0)+1)%l.length;
    notice(modeName(w,handMode()).toUpperCase());
}
/* Le rayon du reticule : au juge il ne bouge pas, a l'epaule il va jusqu'a la
   portee reelle de l'arme. */
function aimRadius(){
    var w=handWeapon();
    if(!w) return CFG.AIM_R;
    return (G.p.ads&&w.cat!==3)?w.por:Math.min(CFG.AIM_R,w.por);
}
/* Le recul de vue : quand la portee depasse ce que l'ecran montre, on prend
   du champ juste assez pour que le reticule reste visible. */
function adsZoom(){
    var w=handWeapon();
    if(!G.p.ads||!w) return 1;
    var r=aimRadius();
    return (r<=150)?1:Math.max(0.4,150/r);
}
/* ---- COUP DE CORPS A CORPS ----
   Ce qui separe une arme blanche d'une autre : sa portee, ses degats, et
   l'angle sur lequel elle porte. Une batte qui balaie large touche tout ce
   qui se trouve dans son arc ; un couteau ne pique qu'un homme a la fois.
   Le coup lourd elargit l'arc et frappe plus fort, mais deux fois plus lent. */
var SWING=[];
function meleeSwing(ang){
    var p=G.p, w=handWeapon(), m=handMode();
    var arc=meleeArc(w,m)*Math.PI/180;
    /* Frappe donne du bras : de trois quarts a cinq quarts des degats de
       l'arme. La lame reste la lame ; c'est la main qui change. */
    var reach=w.por,
        dmg=(w.dmg||0)*(m?1.55:1)*(0.75+0.5*statEff(p,"combat","frappe")/100)
            *(1+morBonus());
    p.cd=(60/Math.max(1,w.cad))*(m?1.9:1);
    /* frapper coute du souffle, et le coup lourd en coute une fois et demie */
    p.sta=Math.max(0,p.sta-CFG.STA_MELEE*(m?1.5:1)*staDrain());
    p.staD=CFG.STA_DELAY;
    if(p.sta<=0) p.winded=1;
    SWING.push({x:p.x, y:p.y-11, a:ang, arc:arc, r:reach, t:0.16, m:m});
    /* un coup porte engage l'equipe, mais aux mains seulement */
    engage(0);
    /* une lame siffle moins fort qu'un canon, mais elle s'entend */
    noiseAt(p.x,p.y,wNoise(w)*stealth(p));
    /* tout ce qui tient dans le secteur prend le coup */
    var hit=0, i, j, o, v, d, da;
    function tryHit(o2,isZ){
        if(!o2||o2.dead) return;
        d=Math.hypot(o2.x-p.x,(o2.y-11)-(p.y-11));
        if(d>reach+7) return;
        da=Math.atan2((o2.y-11)-(p.y-11),o2.x-p.x)-ang;
        while(da>Math.PI) da-=6.283185307;
        while(da<-Math.PI) da+=6.283185307;
        if(Math.abs(da)>arc/2+0.12) return;
        hurt(o2,dmg,isZ); hit++;
        secBump(p,"frappe",1);
    }
    for(i=0;i<ZOMBIES.length;i++) tryHit(ZOMBIES[i],1);
    for(i=0;i<VILLAGES.length;i++){
        v=VILLAGES[i];
        for(j=0;j<v.villagers.length;j++) tryHit(v.villagers[j],0);
    }
    G.shake=Math.min(6,G.shake+(m?1.4:0.7));
    sShot();
    return hit;
}
/* Les vignettes d'objet se peignent avec des decoupes, qui effacent au lieu
   de peindre : les poser directement sur le decor y ferait des trous. On les
   grave donc une fois pour toutes sur un petit calque, garde en cache, puis
   on se contente de le tamponner. */
var GNDCV={};
function gndIcon(g){
    var k=(g.w!==undefined)?("w"+g.w):("i"+g.i), c=GNDCV[k], o=gndObj(g), g2;
    if(c) return c;
    if(!o) return null;
    c=document.createElement("canvas");
    if(g.w!==undefined){
        c.width=26; c.height=12;
        g2=c.getContext("2d");
        iconDraw(g2,o,0,-4,0.135,"#e8e2cc");
    } else {
        c.width=14; c.height=14;
        g2=c.getContext("2d");
        itIconDraw(g2,o.ic,1,1,0.5,"#e8e2cc");
    }
    GNDCV[k]=c;
    return c;
}
function drawGnd(cx,cy){
    var i, g, c, px, py;
    for(i=0;i<GND.length;i++){
        g=GND[i];
        px=Math.round(g.x-cx); py=Math.round(g.y-cy);
        if(px<-30||px>680||py<-30||py>400) continue;
        c=gndIcon(g);
        if(!c) continue;
        /* l'ombre portee, qui pose la chose sur le sol */
        ctx.fillStyle="rgba(10,8,6,0.30)";
        ctx.fillRect(px-Math.round(c.width/2)+1,py+1,c.width-2,3);
        /* Rien ne clignote. Le clignotement annoncait la fin des trois
           minutes, mais une chose sous les yeux ne s'efface jamais par le
           temps : l'avertissement ne portait que sur ce qui ne peut pas
           arriver tant qu'on regarde. Ce qui menace une chose dans le champ
           de vision, ce n'est pas l'horloge, ce sont les rats - et les rats
           ne previennent pas. */
        ctx.drawImage(c,px-Math.round(c.width/2),py-c.height+2);
    }
}
function drawSwing(cx,cy){
    var i, sw, al;
    for(i=SWING.length-1;i>=0;i--){
        sw=SWING[i]; sw.t-=vdt;
        if(sw.t<=0){ SWING.splice(i,1); continue; }
        al=Math.min(0.5,sw.t*3);
        ctx.fillStyle="rgba(240,232,200,"+al.toFixed(2)+")";
        ctx.beginPath();
        ctx.moveTo(sw.x-cx,sw.y-cy);
        ctx.arc(sw.x-cx,sw.y-cy,sw.r,sw.a-sw.arc/2,sw.a+sw.arc/2);
        ctx.closePath(); ctx.fill();
    }
}
/* ================= LA RIPOSTE =================
   Aucun habitant ne savait tirer : le monde etait desarme face au joueur.
   Les porteurs d'uniforme le peuvent maintenant, mais eux seuls, et
   seulement sur un joueur qu'ils tiennent pour un ennemi. Ils tirent au coup
   par coup, avec la meme dispersion et les memes munitions que le joueur, et
   leurs balles vivent dans la meme liste : un pion qui passe devant eux
   ramasse ce qui lui etait destine, exactement comme pour nous.
   Ils ne poursuivent pas : ils tirent de la ou ils sont. Fuir hors de leur
   vue suffit a s'en tirer, ce qui laisse au joueur une porte de sortie. */
var NPCFIRE={por:300, cd:1.4, cdv:0.8, aim:0.09};
/* L'arme qu'un uniforme porte a la main. Ses emplacements d'abord, son sac
   ensuite - dans cet ordre precis. La table a deux permet de poser une arme
   dans l'emplacement d'un compagnon ; tant que cette fonction ne regardait
   que le sac, il ne s'en servait jamais et l'on armait des gens pour rien.
   Les uniformes de la carte naissent avec leur arme dans le sac, d'ou le
   second passage : les deux cohabitent. */
function npcWeapon(n){
    var q, c, w;
    /* Le filtre etait w.cat!==0, cense ecarter le corps a corps. Mais la
       categorie 0 est l'arme LEGERE - le corps a corps est la 3. Depuis la
       v15, aucun uniforme ne s'etait donc jamais servi d'un pistolet ni d'un
       fusil d'assaut : ils ne tiraient qu'a l'arme lourde ou au sniper, et
       les trois quarts des armes qu'on leur donnait dormaient. Le seul test
       qui vaille est w.am : ce qui n'a pas de munition ne tire pas. */
    if(n.slots) for(q=1;q<4;q++){
        w=n.slots[q];
        if(w&&w.am) return w;
    }
    if(!n.inv) return null;
    for(q=0;q<n.inv.length;q++){
        c=n.inv[q];
        if(!c||c.w===undefined) continue;
        w=WEAPONS[c.w];
        if(w&&w.am) return w;
    }
    return null;
}
/* ---- LES MUNITIONS D'UN COMPAGNON ----
   La v16 avait tranche : les PNJ tirent sans compter, et c'etait voulu - un
   uniforme a court au milieu d'une riposte serait devenu une cible immobile,
   et l'on n'avait aucun moyen de le ravitailler. La table a deux a change
   cela : on peut desormais donner un fusil et des boites a quelqu'un, donc
   il n'y a plus de raison qu'il tire du vent.

   LA REGLE NE VAUT QUE POUR LES SIENS. Un uniforme croise dans la rue tire
   toujours sans compter : la decision de la v16 tient pour lui, on ne peut
   toujours pas le ravitailler et rien ne serait gagne a le voir s'arreter.
   Seul un recrute puise dans son propre sac - c'est le prix de pouvoir le
   choisir, l'armer et l'envoyer.

   Il puise dans SA reserve, pas dans la votre : ammoStock et ammoTake
   prennent deja leur porteur en parametre depuis la v16, ils marchent tels
   quels. Le vrac d'une boite entamee pese chez lui comme chez vous. */
function npcMagOf(n,w){
    if(!n.mag) n.mag=[0,0,0,0];
    return n.mag[wSlot(w)]|0;
}
function npcReload(n,w){
    var sl=wSlot(w), cap=w.mag||1, got;
    if(!n.mag) n.mag=[0,0,0,0];
    got=ammoTake(n,w.am,cap-(n.mag[sl]|0));
    if(got<=0) return false;
    n.mag[sl]=(n.mag[sl]|0)+got;
    /* recharger prend du temps, et d'autant moins qu'il s'y entend */
    n.fcd=wReload(w)*(1.25-0.5*statEff(n,"tir","chargement")/100);
    return true;
}
/* A-t-il de quoi lacher un coup ? Sinon il recharge, et le rechargement lui
   prend son tour - c'est ce qui rend la reserve sensible. */
function npcAmmoOk(n,w){
    var sl;
    if(n.inf) return true;             /* la releve ne compte pas ses coups */
    if(!n.recruited) return true;      /* l'uniforme de la rue ne compte pas */
    if(!w.mag) return true;            /* une arme sans chargeur ne se compte pas */
    sl=wSlot(w);
    if(!n.mag) n.mag=[0,0,0,0];
    if(n.mag[sl]>0) return true;
    if(npcReload(n,w)) return false;   /* il recharge : pas de coup ce tour-ci */
    /* a sec. On le dit une fois, pas a chaque tour. */
    if(!n.dry){
        n.dry=1;
        logMsg(n.name+" n'a plus de "+(AMMO[w.am]?AMMO[w.am].n:"munitions")+".","jsay");
    }
    return false;
}
function npcFire(n,w,tg,civ){
    var a=wAmmo(w);
    if(!a) return;
    if(!npcAmmoOk(n,w)) return;
    if(n.recruited&&w.mag){ n.mag[wSlot(w)]--; n.dry=0; }
    var t=tg||G.p;
    var ang=datan2((t.y-11)-(n.y-11),t.x-n.x);
    /* sa main tremble d'autant moins qu'il est bon tireur */
    var sp=NPCFIRE.aim*(1.4-statEff(n,"tir","stabilite")/140);
    var k, dv, an;
    for(k=0;k<a.p;k++){
        dv=(rng()+rng()+rng()-1.5)/1.5;
        an=ang+dv*sp;
        /* la balle sait qui l'a tiree : la releve tient une ligne en cercle
           autour de la maison et se tirait dessus d'un bord a l'autre */
        G.bul.push({x:n.x, y:n.y-11, vx:Math.cos(an)*a.v, vy:Math.sin(an)*a.v,
            t:NPCFIRE.por/a.v, d:a.d, npc:1, rel:n.rel?1:0, civ:civ?1:0});
    }
    noiseAt(n.x,n.y,wNoise(w));
    n.fcd=(NPCFIRE.cd+rr(0,NPCFIRE.cdv))/(1+0.15*builtN("armurerie"));
}
/* ================= L'ASSAUT =================
   Une base est un bruit permanent. Elle ne se cache pas : elle a un toit,
   des gens dedans, des choses qui tournent, et cela s'entend de loin. C'est
   la contrepartie du confort - et la seule raison pour laquelle une grande
   base n'est pas gratuitement meilleure qu'une petite.

   LA JAUGE se remplit toute seule, a la vitesse du bruit qu'on fait. Elle ne
   se vide qu'en debordant : arrivee au seuil, une horde a repere l'endroit
   et se met en route. Trente secondes de preavis, puis elle est la.

   CE QUI FAIT DU BRUIT : la taille de ce qu'on a b\u00e2ti, et le nombre de gens
   qui vivent dedans. Une amelioration pourra plus tard porter son propre
   bruit - un atelier tape, un poste de guet ne fait que regarder - et c'est
   le champ br du registre BUILDS qui le portera : il est lu ici et n'existe
   nulle part encore, de sorte qu'y ajouter une valeur soit une ligne et rien
   de plus. Pas de canal parallele.

   Le compagnon parti en mission ne compte pas : il n'est pas la.

   ASS_DIV est le seul reglage de vitesse. Au seuil de cent, une base de
   vingt-cinq cases a six habitants met une journee et demie a se faire
   reperer ; un coin de deux cases ou l'on dort seul, six jours. */
var ASS_SEUIL=100, ASS_DIV=600, ASS_PREV=30;
function baseHeads(){
    var L=grpList(), n=0, i;
    for(i=0;i<L.length;i++) if(!L[i].miss&&!L[i].dead) n++;
    return n+(baseHere()?1:0);
}
function baseNoise(){
    var n, k, e, B;
    if(!BASE) return 0;
    /* le socle : le seul fait d'occuper un batiment */
    n=6;
    n+=builtCases();
    n+=baseHeads()*2.5;
    /* le bruit propre de chaque amelioration, par case. Rien n'en porte
       encore : le canal existe, les valeurs viendront. */
    if(BASE.built) for(k in BASE.built){
        e=BASE.built[k];
        if(!e||e.hs) continue;
        B=buildDef(k);
        if(B&&B.br) n+=B.br*(e.n|0);
    }
    return Math.max(0,n);
}
/* ---- LE CHIFFRE ----
   Entre dix et quatre cents. Le tirage est plat, la PRESSION le penche : a
   pression nulle il rase le bas, a pression pleine il colle au haut. Trois
   choses la font monter, dans cet ordre d'importance : la carte ou l'on est,
   le temps passe, et le nombre de bouches a nourrir. Sur la cinquieme carte
   d'une longue partie, une horde de dix ne se verra plus jamais.

   MAPN vaut un tant que le changement de carte n'est pas branche. Le jour ou
   il le sera, il n'y aura rien a toucher ici. */
var ASS_MIN=10, ASS_MAX=400, ASS_CARTES=5;
function assPress(){
    var c=(MAPN-1)/Math.max(1,ASS_CARTES-1);
    var j=Math.min(1,dayNum()/40);
    var g=Math.min(1,baseHeads()/8);
    return Math.max(0,Math.min(1,0.45*c+0.35*j+0.20*g));
}
/* L'exposant du tirage : quatre a pression nulle - la loi ecrase tout vers
   dix, mediane a trente-quatre, deux tirages sur trois sous cent - un
   cinquieme a pression pleine, ou elle colle a quatre cents. */
function assExp(){ return 4-3.8*assPress(); }
function assSize(){
    return ASS_MIN+Math.round(Math.pow(rng(),assExp())*(ASS_MAX-ASS_MIN));
}
/* ---- LA MONTEE ----
   Appelee a chaque tour tant qu'on a un toit. Elle ne fait que trois
   choses : remplir, annoncer, et lacher. */
function updAssault(dt){
    if(!BASE){ return; }
    if(BASE.assaut>0){
        BASE.assaut-=dt;
        assWall();
        /* Le minuteur seul aurait declare l'assaut termine avec deux cents
           zombis encore aux murs. On ne le lache que quand il ne reste plus
           rien debout aux abords, ou quand le temps est vraiment ecoule -
           auquel cas ceux qui restent restent, ils sont devenus des zombis
           comme les autres. */
        var rest=assLeft();
        if(rest<=0||BASE.assaut<=0){
            BASE.assaut=0;
            /* LE COMPTE SE FAIT ICI ET NULLE PART AILLEURS. C'est la part de
               la horde qui a touche le mur, pas une force opposee a un
               nombre : ce qui a ete tue dans l'anneau n'a rien coute. */
            var b2=BASE.b, cx2=b2.x+b2.w/2, cy2=b2.y+b2.h/2;
            var loin=!(baseHere()||
                dist2(G.p.x,G.p.y,cx2,cy2)<ASS_PORTEE*ASS_PORTEE);
            assDamage(BASE.hordIn/Math.max(1,BASE.hord0),loin);
            /* LA PRIME DE LA SORTIE. Etre alle aux mains et n'y avoir rien
               laisse est l'autre facon de bien s'en tirer : la premiere -
               rien n'a touche les murs - est dans assDamage et se compte en
               zombis abattus de loin ; celle-ci se compte en zombis abattus
               a bout de bras sans qu'un seul des sortants soit touche. Une
               seule egratignure la fait tomber, c'est ce qui la rend rare. */
            if((BASE.cacK|0)>0&&!BASE.cacHit){
                logMsg("Ils sont sortis a decouvert, les ont tous eus, et pas "+
                       "un n'a ete touche. Cela se sait.","jsay");
                morMove(4);
            }
            BASE.cacK=0; BASE.cacHit=0; BASE.cacDit=0;
            /* le repli ne vaut que pour l'assaut qui l'a cause */
            var LC=grpList();
            for(var qc=0;qc<LC.length;qc++) LC[qc].crep=0;
            if(rest<=0){
                logMsg("Plus rien ne bouge aux abords.","jsay");
                notice(BASE.hordIn?"LA BASE A TENU":"PAS UN N'EST PASSE");
            } else {
                logMsg("Ce qui reste de la horde s'est disperse dans le "+
                       "quartier. Ils ne partent pas, ils rodent.","jday");
                notice("ILS SE DISPERSENT");
            }
            BASE.hord0=0; BASE.hordIn=0;
        }
        return;
    }
    if(BASE.alerte>0){
        var av=Math.ceil(BASE.alerte);
        BASE.alerte-=dt;
        if(Math.ceil(BASE.alerte)!==av&&Math.ceil(BASE.alerte)%10===0&&BASE.alerte>0)
            notice(Math.ceil(BASE.alerte)+" SECONDES");
        if(BASE.alerte<=0){ BASE.alerte=0; assLaunch(); }
        return;
    }
    BASE.jauge=(BASE.jauge||0)+baseNoise()*dt/ASS_DIV;
    /* deux paliers d'avertissement : on ne se fait pas surprendre sans avoir
       eu de quoi comprendre */
    if(BASE.jauge>=50&&!(BASE.dit&1)){
        BASE.dit=(BASE.dit|0)|1;
        logMsg("On entend des choses tourner autour du quartier. Rien de "+
               "precis, mais rien de rassurant non plus.","jday");
    }
    if(BASE.jauge>=80&&!(BASE.dit&2)){
        BASE.dit=(BASE.dit|0)|2;
        logMsg("Ils sont plus nombreux chaque nuit aux abords. La base "+
               "s'entend de trop loin.","jsay");
        notice("ILS APPROCHENT");
    }
    if(BASE.jauge>=ASS_SEUIL){
        BASE.jauge=0; BASE.dit=0;
        BASE.alerte=ASS_PREV;
        BASE.nb=assSize();
        logMsg("ILS ARRIVENT. On en voit "+
               ((BASE.nb<60)?"une bande":((BASE.nb<200)?"beaucoup":"une maree"))+
               " remonter vers la base. Trente secondes.","jsay");
        notice("ASSAUT DANS 30 SECONDES");
    }
}
/* ---- L'ARRIVEE ----
   Ils viennent d'un cote, pas de partout : une horde a une provenance. On
   tire un cap, on les pose en arc au-dela du plus large plan de vue, et
   chacun marche sur la base. Le bruit du lieu fait le reste - ils
   l'entendent par zHears comme ils entendent tout. */
/* ---- L'ARRIVEE, ET LES DEUX RESOLUTIONS ----
   Trente secondes suffisent a traverser la carte : rentrer est toujours
   possible, cela se merite et rien de plus. Le choix n'en est un que parce
   que ne pas venir reste supportable.

   SI L'ON EST LA, elle se joue. Ils viennent d'un cote - une horde a une
   provenance - on les pose en arc au-dela du plus large plan de vue et
   chacun marche sur la base. Le groupe tient les murs par baseDefend, comme
   il le fait depuis la v16, et l'on tire de la fenetre en payant ses
   cartouches.

   IL EST TOUJOURS JOUE, ET IL N'Y A PLUS DE SECONDE RESOLUTION. Il s'est
   raconte pendant deux versions quand on etait loin : quatre cents zombis a
   l'autre bout de la carte pour que personne ne les voie, disait la note,
   couteraient le budget d'un tour sans rien donner a regarder. L'argument
   etait faux sur les deux points. Sur le cout d'abord - le regime des
   lointains fait deja marcher les zombis hors du regard a un tour sur trois,
   c'etait ecrit vingt lignes plus haut. Sur le reste surtout : DEFENDRE SA
   BASE N'EST PAS UN RECIT. Le calcul decidait tout a la seconde du
   declenchement, si bien qu'apprendre qu'on attaquait chez soi et se mettre
   a courir n'avait aucun sens - c'etait deja fini, butin vole et blesses
   compris, avant le premier pas.
   MAINTENANT ON PEUT REVENIR. La horde met le temps qu'il faut pour
   traverser l'anneau, les compagnons tiennent les murs pendant ce temps, et
   ce qu'on perd depend de ce qui a vraiment touche le mur - assDamage n'est
   plus appelee avec une fraction calculee mais avec une fraction constatee.
   Tuer la horde avant qu'elle arrive ne coute donc plus rien du tout, ce
   qu'aucune formule n'accordait.
   ASS_PORTEE ne decide plus de la resolution : elle ne sert qu'a savoir si
   l'on vous previent de pres ou de loin. */
var ASS_PORTEE=900, ASS_DUR=180;
function assLaunch(){
    var b=BASE&&BASE.b, n=BASE?(BASE.nb|0):0;
    if(!b||n<=0){ if(BASE) BASE.nb=0; return; }
    var cx=b.x+b.w/2, cy=b.y+b.h/2;
    BASE.nb=0;
    assPlay(cx,cy,n);
}
/* ---- JOUEE ---- */
function assPlay(cx,cy,n){
    var Math9=DMATH, i, q, a, d, x, y, z, ok;
    var arc=1.5, mid=(RING_IN+RING_OUT)/2;
    /* Le cap se choisit une fois pour toute la horde, et il doit ouvrir sur
       de la carte : une base plantee dans un coin n'a pas de secteur libre
       partout. ON NE ROGNE PAS LA POSITION SUR LES BORDS - c'etait le defaut
       du premier jet : un cap qui sortait de la carte ramenait le zombi a
       cent vingt pixels du bord, donc parfois a portee de vue de la base
       elle-meme. On rejette et on retire. */
    var a0=rng()*6.283, bon=false;
    for(q=0;q<48&&!bon;q++){
        a0=rng()*6.283;
        x=cx+Math9.cos(a0)*mid; y=cy+Math9.sin(a0)*mid;
        if(x<120||y<120||x>CFG.WORLD-120||y>CFG.WORLD-120) continue;
        bon=true;
    }
    for(i=0;i<n;i++){
        ok=false;
        for(q=0;q<14&&!ok;q++){
            /* les six premiers essais dans le secteur choisi, les suivants
               sur tout le tour : mieux vaut un zombi qui arrive d'ailleurs
               qu'un zombi qui n'arrive pas */
            a=(q<6)?(a0+rr(-arc,arc)):rr(0,6.283);
            d=rr(RING_IN,RING_OUT);
            x=cx+Math9.cos(a)*d; y=cy+Math9.sin(a)*d;
            if(x<120||y<120||x>CFG.WORLD-120||y>CFG.WORLD-120) continue;
            if(hitObstacle(x,y,10)||inSea(x,y)) continue;
            ok=true;
        }
        if(!ok) continue;
        z=zSpawn(x,y);
        z.hord=1;
        zMarch(z,datan2(cy-y,cx-x)+rr(-0.25,0.25),240);
    }
    BASE.assaut=ASS_DUR;
    BASE.hord0=n; BASE.hordIn=0;
    BASE.cacK=0; BASE.cacHit=0; BASE.cacDit=0;
    /* Loin, on l'apprend ; pres, on le voit. Le texte n'est plus le meme
       parce que la situation ne l'est pas : dans un cas il faut courir. */
    if(baseHere()||dist2(G.p.x,G.p.y,cx,cy)<ASS_PORTEE*ASS_PORTEE){
        logMsg("La horde est sur vous.","jsay");
        notice("ASSAUT");
    } else {
        logMsg("Ils marchent sur votre base. Vous n'y etes pas.","jred");
        notice("ASSAUT SUR LA BASE");
    }
}
/* Ce qui reste debout de la horde. Sert a savoir quand c'est fini : un
   minuteur seul aurait declare l'assaut termine avec deux cents zombis
   encore aux murs. */
function assLeft(){
    var b=BASE&&BASE.b, n=0, i, z;
    if(!b) return 0;
    /* Le rayon doit DEPASSER RING_OUT, sinon la horde qui vient de paraitre
       n'est pas comptee et l'assaut se declare termine dans la seconde. */
    var cx=b.x+b.w/2, cy=b.y+b.h/2, po=(RING_OUT+400)*(RING_OUT+400);
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(!z.hord||z.dead||z.gone) continue;
        if(dist2(z.x,z.y,cx,cy)<po) n++;
    }
    return n;
}
/* ---- RACONTEE ----
   La meme arithmetique qu'une mission : une force en face d'un nombre, et
   la part qui passe. Ce qui defend, ce sont les compagnons restes au toit,
   leur Combat, la cadence que donne l'armurerie, la vue que donne le poste
   de guet, et le moral de la maison.

   CE QU'ON PERD EST TOUJOURS REPARABLE. Du stock emporte, des blesses, des
   pieces mises hors service - buildFix sait les relever - et du moral. La
   base elle-meme ne se perd jamais et personne n'y meurt : une punition
   qu'on ne peut pas defaire, infligee pendant qu'on regardait ailleurs,
   fermerait la partie au lieu de la couter. C'est la decision, elle est
   ecrite ici pour qu'on ne la reprenne pas par distraction. */
/* CE QUI A VRAIMENT TOUCHE LE MUR. On marque le zombi, pas le compteur : un
   assaillant qui fait trois allers-retours contre la facade ne doit compter
   qu'une fois. Le drapeau z.mur tient ce role et ne se leve jamais deux
   fois. Balaye avec le meme decalage qu'ailleurs - un zombi qui met une
   seconde de plus a etre compte ne change rien, et la horde entiere a chaque
   tour serait du gachis. */
var ASS_MUR=90;
function assWall(){
    var b=BASE&&BASE.b, i, z;
    if(!b||!(BASE.assaut>0)) return;
    var cx=b.x+b.w/2, cy=b.y+b.h/2;
    var rx=b.w/2+ASS_MUR, ry=b.h/2+ASS_MUR, r2=(rx>ry?rx:ry);
    r2=r2*r2;
    for(i=0;i<ZOMBIES.length;i++){
        if(((i+G.tick)%4)!==0) continue;
        z=ZOMBIES[i];
        if(!z.hord||z.mur||z.dead||z.gone) continue;
        if(dist2(z.x,z.y,cx,cy)>r2) continue;
        z.mur=1; BASE.hordIn++;
    }
}
function assForce(){
    /* Le socle : la porte, les murs, les fenetres etroites. Une base vide se
       defend un peu toute seule, sinon la moindre bande de dix la retournerait
       entierement et l'armurerie ne servirait a rien faute de quelqu'un a
       multiplier. */
    var L=grpList(), f=4, i, c;
    for(i=0;i<L.length;i++){
        c=L[i];
        if(c.miss||c.dead) continue;
        f+=8+statEff(c,"corps","combat")/6;
    }
    f*=1+0.15*builtN("armurerie");
    f*=1+0.05*builtN("guet");
    f*=1+morBonus();
    return f;
}
/* ---- CE QUE COUTE CE QUI EST PASSE ----
   Le corps de l'ancienne resolution racontee, garde entier : ce qu'ils
   emportent, qui est blesse, ce qui casse, ce que le moral encaisse. Seule
   l'entree a change. perte ne se calcule plus d'une formule opposant une
   force a un nombre - elle SE CONSTATE, c'est la part de la horde qui a
   touche le mur. Une horde tuee dans l'anneau donne zero, et zero ne coute
   rien : la formule, elle, ne descendait jamais sous cinq pour cent.
   CE QU'ON PERD EST TOUJOURS REPARABLE. Du stock emporte, des blesses, des
   pieces mises hors service - buildFix sait les relever - et du moral. La
   base elle-meme ne se perd jamais et personne n'y meurt : une punition
   qu'on ne peut pas defaire fermerait la partie au lieu de la couter. C'est
   la decision, elle est ecrite ici pour qu'on ne la reprenne pas par
   distraction. */
function assDamage(perte,loin){
    var i, L=grpList(), def=[], q;
    if(!BASE) return;
    perte=Math.max(0,Math.min(0.95,perte));
    for(i=0;i<L.length;i++) if(!L[i].miss&&!L[i].dead) def.push(L[i]);
    if(perte<=0){
        logMsg("Rien n'a touche les murs. "+
            ((def.length===0)?"Et il n'y avait personne."
                            :(def.length+" des votres les ont tenus a distance.")),
            "jsay");
        morMove(6);
        return;
    }
    /* ---- CE QU'ILS EMPORTENT ----
       Jusqu'a la moitie des rayonnages au pire. On prend au hasard, sans
       trier : ils n'ont pas fait le tri. */
    var plein=0;
    for(i=0;i<BASE.inv.length;i++) if(BASE.inv[i]) plein++;
    var vol=Math.round(plein*perte*0.5), pris=0, tir;
    for(q=0;q<BASE.inv.length*3&&pris<vol;q++){
        tir=(rng()*BASE.inv.length)|0;
        if(BASE.inv[tir]){ BASE.inv[tir]=null; pris++; }
    }
    /* ---- LES BLESSES ----
       Qui tient les murs le paie. Mordu au-dela de trois quarts, jamais tue :
       on ne perd pas quelqu'un pendant qu'on regardait ailleurs. */
    var bl=0, mo=0, dg;
    for(i=0;i<def.length;i++){
        dg=Math.round((def[i].maxhp||100)*perte*0.55);
        tir=rng();
        if(dg>0){
            def[i].hp=Math.max(1,def[i].hp-dg);
            bl++;
            if(perte>0.75&&tir<0.5&&!def[i].mal){ def[i].mal=1; mo++; }
        }
    }
    /* ---- CE QU'ILS CASSENT ----
       Une piece par tiers de penetration, prise dans le registre pour que
       deux rejeus cassent la meme. */
    var nc=Math.floor(perte*3), cass=[], LV;
    for(q=0;q<nc;q++){
        LV=maintLive();
        tir=rng();
        if(!LV.length) continue;
        var kk=LV[Math.min(LV.length-1,Math.floor(tir*LV.length))];
        BASE.built[kk].hs=1;
        cass.push(buildName(buildDef(kk),BASE.built[kk].n).toLowerCase());
    }
    morMove(-Math.round(perte*25));
    /* ---- LE RECIT ---- */
    var t=(loin?"Ils sont venus pendant que vous etiez ailleurs. "
               :"Ils ont touche les murs. ")+
          ((def.length===0)
            ?"Il n'y avait personne pour tenir la porte."
            :(def.length+" des votres ont tenu la porte."))+" ";
    t+=(perte<0.3)?"Ils ont repousse le gros et l'on s'en tire bien."
       :((perte<0.6)?"Ils ont cede du terrain, et l'interieur a ete visite."
       :"Ils ont ete debordes. La maison a ete retournee.");
    logMsg(t,"jsay");
    if(pris>0) logMsg("Il manque "+pris+" case"+(pris>1?"s":"")+
        " sur les rayonnages.","jday");
    if(bl>0) logMsg(bl+((bl>1)?" compagnons sont blesses":" compagnon est blesse")+
        (mo?(", dont "+mo+" mordu"+(mo>1?"s":"")):"")+".","jsay");
    if(cass.length) logMsg("Hors service : "+cass.join(", ")+
        ". Il faudra les remettre en etat.","jday");
    notice((perte<0.3)?"LA BASE A TENU":"LA BASE A ETE PILLEE");
}
/* ================= LA DEFENSE DE LA BASE =================
   Chez soi, on ne se promene plus : on gere. Le personnage n'obeit plus aux
   touches - c'est deja le cas de tout batiment - mais ici l'onglet BASE
   s'ouvre de lui-meme et devient le vrai jeu.

   Pendant ce temps le groupe se defend seul. Chacun tire sur ce qui approche
   des murs, sans qu'on ait a le dire : ils sont armes, ils voient, ils
   tirent. Le joueur en fait autant, depuis l'interieur, et lui paie ses
   cartouches - les autres non, comme partout ailleurs.

   BASE_DEF est le rayon des murs : au-dela, on regarde passer. */
var BASE_DEF=250;
function baseTarget(x,y){
    var por=BASE_DEF+(builtN("guet")?50:0);
    var best=null, bd=por*por, i, z, dd;
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(z.dead||z.gone) continue;
        dd=dist2(z.x,z.y,x,y);
        if(dd<bd&&los(x,y,z.x,z.y)){ bd=dd; best=z; }
    }
    return best;
}
/* ================= LES COMPAGNONS AU COMBAT =================
   Ils se defendent quand ils sont MENACES - un mort dans le rayon de defense
   (baseTarget), en vue - et ils vous imitent quand vous TIREZ. Le corps a
   corps au contact est toujours permis, c'est de la defense, pas une salve.
   La consigne du groupe commande le reste : "ne pas tirer" (grp.noFire) leur
   fait garder l'arme a feu au fourreau, ils n'usent alors que de leurs mains.
   Les zombis n'apparaissant qu'apres la breche, cela ne vide aucun bourg :
   baseTarget ne vise jamais un vivant.

   ENGAG est le souvenir de votre dernier geste ; GUN dit s'il s'agissait d'un
   coup de feu - grpCare s'en sert pour ne pas manger sous le feu. */
var ENGAG=0, ENGAG_DUR=4, GUN=0, GUN_DUR=6;
function engage(gun){
    ENGAG=ENGAG_DUR;
    if(gun) GUN=GUN_DUR;
}
function grpFight(dt){
    if(G.inside) return;
    ENGAG=Math.max(0,ENGAG-dt);
    GUN=Math.max(0,GUN-dt);
    var L=eqList(), i, n, w, t, d2;
    for(i=0;i<L.length;i++){
        n=L[i];
        if(n.dead) continue;
        /* celui qui vous a perdu de vue ne se bat pas a vos cotes : il n'est
           plus la, et un abri qui tire depuis l'interieur serait absurde */
        if(n.lst) continue;
        /* ni celui qui s'est planque sur ordre : un abri qui tire depuis
           l'interieur serait aussi absurde que pour le perdu de vue */
        if(n.duck||n.inb||n.hidden) continue;
        if(n.fcd>0){ n.fcd-=dt; if(n.fcd<0) n.fcd=0; }
        if(n.mcd>0){ n.mcd-=dt; if(n.mcd<0) n.mcd=0; }
        /* CE QUI LES FAIT AGIR A CHANGE. Ils ne restent plus les bras
           ballants tant que vous n'avez rien fait : ils se defendent quand ils
           sont MENACES - baseTarget ne rend qu'un mort dans le rayon de
           defense (250 px) et en vue - et ils vous imitent quand vous tirez. */
        t=baseTarget(n.x,n.y);
        if(!t) continue;
        n.face=(t.x<n.x)?-1:1;
        d2=dist2(n.x,n.y,t.x,t.y);
        /* a bout portant, les mains d'abord - meme sous la consigne "ne pas
           tirer" : c'est de la defense au contact, pas une salve qui ameute */
        if(d2<30*30){
            if(n.mcd>0) continue;
            hurt(t,rr(6,16)*(0.7+statEff(n,"combat","frappe")/100),1);
            n.mcd=0.9;
            continue;
        }
        /* de loin, l'arme a feu - JAMAIS sous la consigne "ne pas tirer" */
        if(G.grp&&G.grp.noFire) continue;
        /* sinon : la menace suffit (t existe), et votre coup de feu aussi */
        if(n.fcd>0) continue;
        w=npcWeapon(n);
        if(!w||!wAmmo(w)) continue;
        if(!fireLaneClear(n.x,n.y-11,t)) continue;
        npcFire(n,w,t);
    }
}
/* ---- LES ARMES NE DORMENT PLUS DANS LES POCHES ----
   Un policier, un militaire, un chasseur porte une arme : il s'en sert.
   L'ennemi d'un civil, c'est LE MORT QUI S'EST RELEVE - toujours, meme avant
   l'ordre de quarantaine, parce qu'il porte les habits de quelqu'un qu'on
   connaissait et qu'on voit bien ce qui lui est arrive. Le zombi de
   laboratoire, lui, n'est un ennemi qu'une fois la quarantaine declaree :
   avant, personne ne sait ce que c'est. Les compagnons recrutes ont deja
   grpFight ; ceci ne vaut que pour les habitants livres a eux-memes.
   Decale par le rang, comme zHunt et npcUnstick : chacun tous les CIV_T tours,
   donc quelques dizaines d'examens par tour et non des milliers. */
var CIV_POR=340, CIV_T=6;
function npcHasArm(n){
    var q, c;
    if(n.slots) for(q=0;q<4;q++) if(n.slots[q]) return true;
    if(n.inv) for(q=0;q<n.inv.length;q++){ c=n.inv[q]; if(c&&c.w!==undefined) return true; }
    return false;
}
/* ---- LA LIGNE DE TIR EST-ELLE DEGAGEE ? ----
   On ne tire pas si un vivant - habitant, compagnon ou joueur - se trouve
   entre le tireur et sa cible : on retient son coup plutot que de faucher un
   des siens. On projette chaque corps sur l'axe du tir ; s'il tombe entre le
   canon et la cible, a moins d'une demi-largeur de corps de la trajectoire,
   la voie est barree. La cible et les gens a l'abri ne comptent pas. */
function fireLaneClear(sx,sy,tg){
    var dx=tg.x-sx, dy=(tg.y-11)-sy, len=Math.hypot(dx,dy), i, o, t, px, py, p=G&&G.p;
    if(len<1e-4) return true;
    dx/=len; dy/=len;
    if(p&&!p.dead&&p!==tg&&!G.inside){
        t=(p.x-sx)*dx+(p.y-11-sy)*dy;
        if(t>6&&t<len-6){ px=sx+dx*t; py=sy+dy*t;
            if(Math.abs(px-p.x)<7&&Math.abs(py-(p.y-11))<11) return false; }
    }
    for(i=0;i<HUM.length;i++){
        o=HUM[i];
        if(!o||o.dead||o.gone||o.hidden||o.inb||o===tg) continue;
        t=(o.x-sx)*dx+(o.y-11-sy)*dy;
        if(t<=6||t>=len-6) continue;
        px=sx+dx*t; py=sy+dy*t;
        if(Math.abs(px-o.x)<7&&Math.abs(py-(o.y-11))<11) return false;
    }
    return true;
}
function civTarget(n){
    var bd=CIV_POR*CIV_POR, best=null, i, z, d, pf=proFear();
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(z.dead||z.gone||!(z.turned||pf)) continue;
        d=dist2(n.x,n.y,z.x,z.y);
        if(d<bd){ bd=d; best=z; }
    }
    return (best&&los(n.x,n.y,best.x,best.y))?best:null;
}
function civFight(dt){
    var i, n, w, t, d2;
    for(i=0;i<HUM.length;i++){
        if(((i+G.tick)%CIV_T)!==0) continue;
        n=HUM[i];
        if(!n||n.dead||n.gone||n.hidden||n.inb||n.recruited||n.sortie||!n.armed) continue;
        if(n.fcd>0){ n.fcd-=dt*CIV_T; if(n.fcd<0) n.fcd=0; }
        if(n.mcd>0){ n.mcd-=dt*CIV_T; if(n.mcd<0) n.mcd=0; }
        t=civTarget(n);
        if(!t) continue;
        n.fear=0;                       /* il tient sa position, il ne fuit pas */
        n.face=(t.x<n.x)?-1:1;
        d2=dist2(n.x,n.y,t.x,t.y);
        /* a bout portant, les mains ou la lame */
        if(d2<30*30){
            if(n.mcd>0) continue;
            hurt(t,rr(6,16)*(0.7+statEff(n,"combat","frappe")/100),1);
            n.mcd=0.9;
            continue;
        }
        /* de loin, l'arme a feu */
        if(n.fcd>0) continue;
        w=npcWeapon(n);
        if(!w||!wAmmo(w)) continue;
        if(!fireLaneClear(n.x,n.y-11,t)) continue;
        npcFire(n,w,t,true);
    }
}
/* ---- ON SE PENCHE A LA FENETRE ----
   baseTarget demandait une ligne de vue depuis la place exacte de celui qui
   tire. Depuis l'interieur, le mur la coupe toujours : les compagnons
   visaient donc dans le vide, et les balles qui partaient mouraient sur leur
   propre facade au premier pas. Une base ne se defend pas comme un champ.
   ON REGARDE DONC AUTOUR DU BATIMENT, PAS AUTOUR DE LA PERSONNE. Le cercle
   est centre sur la maison, il fait tout le tour, et rien ne le coupe : ils
   sont aux fenetres, il y en a de tous les cotes, et celui qui n'a pas la
   sienne passe a l'etage. */
function wallTarget(){
    var b=BASE&&BASE.b;
    if(!b) return null;
    var cx=b.x+b.w/2, cy=b.y+b.h/2;
    var por=BASE_DEF+(builtN("guet")?50:0), bd=por*por;
    var best=null, i, z, dd;
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(z.dead||z.gone) continue;
        dd=dist2(z.x,z.y,cx,cy);
        if(dd<bd){ bd=dd; best=z; }
    }
    return best;
}
/* LE POSTE DE TIR EST SUR LA FACADE, PAS AU MILIEU DE LA MAISON. Une balle
   partie du salon traverse son propre mur et s'y arrete - c'est ce qui se
   passait. On la fait partir du bord, du cote ou l'on vise, un peu dehors :
   la fenetre par laquelle on se penche.
   LA MARGE N'EST PAS DECORATIVE. npcFire fait partir la balle a onze pixels
   AU-DESSUS des pieds - la hauteur du torse - de sorte qu'un poste colle a
   trois pixels sous la facade sud tirait encore depuis l'interieur du
   rectangle, et la balle mourait sur le mur au premier pas. MUR_MARGE couvre
   ces onze pixels et davantage. */
var MUR_MARGE=16;
function wallPost(tx,ty){
    var b=BASE&&BASE.b;
    if(!b) return null;
    var cx=b.x+b.w/2, cy=b.y+b.h/2;
    var dx=tx-cx, dy=ty-cy, ax=Math.abs(dx), ay=Math.abs(dy);
    var hx=b.w/2+MUR_MARGE, hy=b.h/2+MUR_MARGE, k;
    if(ax<0.001&&ay<0.001) return {x:cx, y:b.y+b.h+MUR_MARGE};
    k=Math.min((ax>0.001)?(hx/ax):1e9,(ay>0.001)?(hy/ay):1e9);
    return {x:cx+dx*k, y:cy+dy*k};
}
/* ---- LA MAISON TIRE, ET ON NE VOIT QUE CELA ----
   DECISION : PAS DE CORPS AUX FENETRES. Le dedans n'a pas de coordonnees,
   personne n'y est place, et poser une silhouette sur la facade reviendrait
   a inventer un poste qui n'existe pas. Ce qu'on montre, c'est le DEPART DU
   COUP : une lueur de bouche au bord du mur, un peu de fumee qui monte, et
   la balle qui part - elle partait deja, mais rien ne disait d'ou.
   C'EST UNE LISTE PUREMENT VISUELLE, comme SWING : elle s'use a vdt et non a
   dt, ne tire aucun nombre et n'entre dans aucun calcul. Le rejeu ne la
   regarde pas. Remise a plat dans newGame avec les autres. */
var FLASH=[];
function wallFlash(px,py,tx,ty){
    var a=DMATH.atan2(ty-py,tx-px);
    FLASH.push({x:px, y:py-11, a:a, t:0.09, r:7+(FLASH.length&3)});
    if(FLASH.length>60) FLASH.shift();
}
function drawFlash(cx,cy){
    var i, f, sx, sy, al, c, s;
    for(i=FLASH.length-1;i>=0;i--){
        f=FLASH[i]; f.t-=vdt;
        if(f.t<=0){ FLASH.splice(i,1); continue; }
        sx=f.x-cx; sy=f.y-cy;
        if(sx<-40||sx>680||sy<-40||sy>400) continue;
        al=Math.min(1,f.t*11);
        c=DMATH.cos(f.a); s=DMATH.sin(f.a);
        /* la langue de feu dans l'axe du coup */
        ctx.fillStyle="rgba(255,226,150,"+(0.85*al).toFixed(2)+")";
        ctx.beginPath();
        ctx.moveTo(sx-s*2,sy+c*2);
        ctx.lineTo(sx+s*2,sy-c*2);
        ctx.lineTo(sx+c*f.r,sy+s*f.r);
        ctx.closePath(); ctx.fill();
        /* et le halo qui la porte, plus large que la langue */
        ctx.fillStyle="rgba(255,180,80,"+(0.30*al).toFixed(2)+")";
        ctx.fillRect(Math.round(sx)-2,Math.round(sy)-2,5,5);
    }
}
/* ---- A SEC, ON SORT ----
   IL N'Y A PAS D'INTERIEUR. Un batiment ne se visite pas, personne n'y est
   place, aucun compagnon n'y a de coordonnees qui veuillent dire quelque
   chose : le dedans n'existe que dans le plan de la touche B. C'est donc LE
   BATIMENT qui tire, pas des gens postes a des fenetres - il n'y a ni
   fenetre, ni porte, ni angle de tir a calculer. Le coup part du bord parce
   qu'une balle doit bien partir d'un point, et pour aucune autre raison :
   celui qui tire ne bouge pas, on lui emprunte sa place le temps d'un coup
   et on la lui rend.
   CE QUI SE JOUE VRAIMENT, C'EST LA SORTIE. Plus d'arme a feu ou plus de
   munitions, et l'on ne peut plus rien faire de l'interieur : alors on sort
   nettoyer autour, et l'on rentre. La ils sont dehors pour de bon, a leur
   place sur la carte, et ce qui leur arrive se voit.
   UN CONTRE UN. On ne sort pas a six pour un zombi. Autant de sortants que
   d'assaillants a portee, pas un de plus, chacun le sien - et s'il n'y en a
   qu'un dehors, un seul passe la porte. Les couples se font dans l'ordre des
   deux listes, qui sont reproductibles l'une comme l'autre.
   ON Y LAISSE DE LA PEAU, ET ON PEUT Y RESTER. La Parade decide du coup qui
   passe, et la blessure va jusqu'au bout : le plancher a un point de vie est
   la regle du DEDANS - on ne perd personne pendant qu'on regardait ailleurs -
   et elle ne suit pas celui qui a passe la porte.
   BASE_CAC est la ou l'on accepte d'aller : le tour de la maison et guere
   plus, bien plus court que la portee d'un fusil. */
var BASE_CAC=140, BASE_CAC_CD=0.9;
/* CE QUI EST A PORTEE DE BRAS, ET CE QUI ARRIVE DERRIERE. Les deux se
   comptent dans la MEME passe : la liste parcourt deja tous les zombis a
   chaque tour d'assaut, en faire une seconde pour un simple nombre serait du
   gachis. out.large est ce qui se presse dans l'anneau du fusil - c'est lui
   qui dit s'il est raisonnable d'ouvrir la porte, pas les trois qui sont
   deja contre le mur. */
function cacList(){
    var b=BASE&&BASE.b, out=[], i, z, d;
    out.large=0;
    if(!b) return out;
    var cx=b.x+b.w/2, cy=b.y+b.h/2, r2=BASE_CAC*BASE_CAC, R2=BASE_DEF*BASE_DEF;
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(z.dead||z.gone) continue;
        d=dist2(z.x,z.y,cx,cy);
        if(d<=R2) out.large++;
        if(d<=r2) out.push(z);
    }
    return out;
}
/* Il rentre : sa place ne veut plus rien dire, on la remet au batiment pour
   qu'il ne reste pas plante sur le trottoir une fois l'affaire finie. */
/* Il rentre - ET IL Y MARCHE. La porte est au sud, c'est par la qu'on entre
   et qu'on sort ; une fois sur le seuil il disparait dedans, et sa place
   revient au milieu du batiment ou elle ne veut plus rien dire.
   L'APPEL SANS dt EST LE RETOUR SEC, et il ne sert qu'a la cloture : quand
   l'assaut est fini, plus rien ne fera marcher celui qui serait reste
   dehors, et le laisser plante sur le trottoir serait pire. */
function baseRentre(n,dt){
    var b=BASE&&BASE.b, l;
    if(!n||!n.sortie) return;
    if(!b||!dt){
        n.sortie=0;
        if(b){ n.x=b.x+b.w/2; n.y=b.y+b.h/2; }
        return;
    }
    l=grpStep(n,dt,b.x+b.w/2,b.y+b.h+8,86);
    if(l<12){ n.sortie=0; n.x=b.x+b.w/2; n.y=b.y+b.h/2; }
}
/* Faire rentrer ceux qui trainent dehors alors qu'il n'y a plus rien a
   defendre : c'est ce qui suit la fin de l'assaut, et c'est la seule raison
   pour laquelle baseDefend continue de tourner apres. */
function baseHome(dt){
    var L=grpList(), i;
    for(i=0;i<L.length;i++) if(L[i].sortie) baseRentre(L[i],dt);
}
/* ---- L'ARME QU'IL A DANS LES MAINS QUAND IL N'A PLUS DE CARTOUCHES ----
   npcWeapon ne rend que ce qui tire - le seul test qui vaille y est w.am. Ici
   c'est l'inverse : la categorie 3, celle du corps a corps, et la plus lourde
   de celles qu'il porte. Une hache de pompier et les mains nues ne faisaient
   aucune difference, ce qui otait toute raison d'armer quelqu'un d'une batte.
   Les emplacements d'abord, le sac ensuite, comme partout. */
function npcMelee(n){
    var q, c, w, best=null;
    if(n.slots) for(q=1;q<4;q++){
        w=n.slots[q];
        if(w&&w.cat===3&&(!best||(w.dmg||0)>(best.dmg||0))) best=w;
    }
    if(!best&&n.inv) for(q=0;q<n.inv.length;q++){
        c=n.inv[q];
        if(!c||c.w===undefined) continue;
        w=WEAPONS[c.w];
        if(w&&w.cat===3&&(!best||(w.dmg||0)>(best.dmg||0))) best=w;
    }
    return best;
}
/* Sous ce reste de vie, il rentre : dehors on meurt, et l'on ne tient pas un
   trottoir jusqu'au dernier point. Il ne ressort pas de l'assaut - crep le
   retient jusqu'a la cloture, sans quoi il repasserait la porte au tour
   suivant, toujours a sec et toujours en sang. */
var CAC_REPLI=0.35;
function baseCorps(n,z,dt){
    var b=BASE&&BASE.b, w, esq, dmg, arc, reach, l, mx;
    if(!b) return;
    /* IL SORT PAR LA PORTE. Le dedans n'a pas de coordonnees : le premier
       tour le pose sur le seuil, il faut bien qu'il paraisse quelque part.
       Tout le reste se marche. */
    if(!n.sortie){
        n.sortie=1;
        n.x=b.x+b.w/2; n.y=b.y+b.h+8;
        n.wall=0; n.dsg=0; n.whd=undefined;
        if(!BASE.cacDit){
            BASE.cacDit=1;
            logMsg("Plus une cartouche nulle part. Ils sortent aux mains.","jsay");
            notice("ILS SORTENT");
        }
    }
    if(n.mcd>0){ n.mcd-=dt; if(n.mcd<0) n.mcd=0; }
    w=npcMelee(n);
    reach=(w?w.por:20)+8;
    l=Math.hypot(z.x-n.x,z.y-n.y);
    /* il marche dessus tant qu'il n'est pas a portee de son arme */
    if(l>reach){ grpStep(n,dt,z.x,z.y,74); return; }
    n.face=(z.x<n.x)?-1:1;
    if(n.mcd>0) return;
    dmg=(w?(w.dmg||0):11)*(0.75+0.5*statEff(n,"combat","frappe")/100)
        *(1+morBonus());
    arc=(w?meleeArc(w,0):40)*Math.PI/180;
    SWING.push({x:n.x, y:n.y-11, a:DMATH.atan2((z.y-11)-(n.y-11),z.x-n.x),
                arc:arc, r:(w?w.por:20), t:0.16, m:0});
    hurt(z,dmg,1);
    n.mcd=w?Math.max(0.35,60/Math.max(1,w.cad)):BASE_CAC_CD;
    if(z.dead) BASE.cacK=(BASE.cacK|0)+1;
    /* LE TIRAGE SE FAIT MEME QUAND LE ZOMBI VIENT DE TOMBER : le flux ne
       saute pas un nombre parce qu'un coup a porte. Seul l'effet depend. */
    /* C'ETAIT "esquive", QUI N'EST PAS UNE CLE D'APTITUDE - la table n'en
       connait que quatre au Combat, et la bonne est "parade". La sous-cle
       rendait zero : l'esquive valait la moitie du Combat brut et la Parade
       du compagnon ne comptait jamais. */
    esq=statEff(n,"combat","parade");
    if(rng()>0.35+esq/220&&!z.dead){
        BASE.cacHit=1;
        /* DEHORS, ON MEURT. Le plancher a un point de vie est la regle de
           l'interieur - on ne perd personne pendant qu'on regardait
           ailleurs - et elle ne vaut pas pour celui qui a passe la porte.
           byZ : ce sont des dents, il se releve comme les autres. */
        hurt(n,Math.round(rr(4,13)),0,1);
        if(n.dead){
            logMsg(n.name+" est tombe devant la porte.","jred");
            return;
        }
        if(!n.mal&&rng()<0.12) n.mal=1;
    }
    mx=n.maxhp||100;
    if(n.hp<mx*CAC_REPLI&&!n.crep){
        n.crep=1;
        logMsg(n.name+" decroche et rentre.","jsay");
    }
}
/* ---- ON REFAIT LE PLEIN A LA RESERVE ----
   Un compagnon a sec allait au corps a corps alors qu'il y avait peut-etre
   dix boites sur les rayonnages a deux pas. Il ne cherchait que dans son
   propre sac, comme s'il etait seul en rase campagne : c'est justement ce
   qu'une base n'est pas.
   IL PREND CE QU'IL FAUT, PAS DAVANTAGE. Une boite a la fois, celle de son
   calibre, versee dans son chargeur. Pas de repartition anticipee ni de
   dotation : la reserve se vide au rythme ou l'on tire, et se voit se vider.
   ON NE SORT QUE QUAND IL N'Y A PLUS RIEN. C'est le nouvel ordre : le
   chargeur, puis le sac, puis la reserve, et alors seulement la porte. Une
   base pleine de munitions n'envoie personne aux mains. */
function baseReload(n,w){
    var i, c, o, cap=w.mag||1, sl=wSlot(w), got;
    if(!BASE||!BASE.inv||!w.am) return false;
    if(!n.mag) n.mag=[0,0,0,0];
    if((n.mag[sl]|0)>=cap) return false;
    for(i=0;i<BASE.inv.length;i++){
        c=BASE.inv[i];
        if(!c||cellIsW(c)) continue;
        o=itemById(c.i);
        if(!o||o.k!=="mun"||o.am!==w.am) continue;
        c.q--;
        /* la ceinture reste au rayonnage quand sa derniere boite part */
        if(c.q<=0) BASE.inv[i]=(c.b!==undefined)?{i:c.b,q:1}:null;
        looseOf(n)[w.am]=(looseOf(n)[w.am]||0)+o.nb;
        got=Math.min(looseOf(n)[w.am],cap-(n.mag[sl]|0));
        looseOf(n)[w.am]-=got;
        n.mag[sl]=(n.mag[sl]|0)+got;
        n.fcd=wReload(w)*(1.25-0.5*statEff(n,"tir","chargement")/100);
        n.dry=0;
        return true;
    }
    return false;
}
function baseDefend(dt){
    if(!BASE) return;
    /* ILS TIENNENT LA BASE QUE VOUS SOYEZ LA OU NON. C'etait baseHere() et
       rien d'autre : partir faisait taire quatre fusils d'un coup, et la
       base ne se defendait que sous le regard. Un assaut en cours suffit
       maintenant - c'est le seul moment ou il y a quelque chose a viser. */
    if(!baseHere()&&!(BASE.assaut>0)){
        /* l'affaire est finie et l'on n'est plus la : il reste peut-etre
           quelqu'un dehors, on le fait rentrer avant de tout eteindre */
        baseHome(dt);
        return;
    }
    var b=BASE.b, cx=b.x+b.w/2, cy=b.y+b.h+6;
    var L=grpList(), i, n, w, t, pos, ox, oy;
    var asec=[], zc=cacList(), zi=0;
    /* ---- CEUX QUI ONT DE QUOI TIRER ---- */
    for(i=0;i<L.length;i++){
        n=L[i];
        if(n.dead||n.miss) continue;
        if(n.fcd>0){ n.fcd-=dt; if(n.fcd<0) n.fcd=0; }
        if(n.mcd>0){ n.mcd-=dt; if(n.mcd<0) n.mcd=0; }
        w=npcWeapon(n);
        /* L'ORDRE : le chargeur, puis son sac, puis la reserve, puis la
           porte. npcAmmoOk couvre les deux premiers ; baseReload le
           troisieme. On ne sort qu'apres les avoir epuises tous les trois. */
        if(!w||!wAmmo(w)){ asec.push(n); continue; }
        if(!npcAmmoOk(n,w)){
            if(!baseReload(n,w)){ asec.push(n); continue; }
            baseRentre(n,dt);
            continue;      /* recharger prend son tour */
        }
        /* il a de quoi : il ne sort pas, ou il rentre */
        baseRentre(n,dt);
        if(n.sortie) continue;   /* il est encore dehors : il marche, il ne tire pas */
        if(n.fcd>0) continue;
        t=wallTarget();
        if(!t) continue;
        pos=wallPost(t.x,t.y);
        if(!pos) continue;
        /* on lui emprunte sa place le temps du coup. Il n'est nulle part -
           le dedans n'a pas de coordonnees - et la balle doit bien partir
           d'un point qui ne soit pas au milieu des murs. */
        ox=n.x; oy=n.y;
        n.x=pos.x; n.y=pos.y;
        n.face=(t.x<n.x)?-1:1;
        npcFire(n,w,t);
        /* la lueur APRES le coup, et seulement s'il est parti : npcFire
           renonce quand le chargeur est vide, et une lueur sans balle
           montrerait un tir qui n'a pas eu lieu */
        if(n.fcd>0) wallFlash(pos.x,pos.y,t.x,t.y);
        n.x=ox; n.y=oy;
    }
    /* ---- CEUX QUI N'ONT PLUS RIEN : UN CONTRE UN ---- */
    /* ON NE SORT PAS CONTRE UNE FOULE. La sortie est un nettoyage, pas une
       charge : on n'ouvre la porte que s'il y a moins de monde dans l'anneau
       qu'on ne peut en envoyer dehors. ET C'EST L'ANNEAU QU'ON REGARDE, PAS
       LE MUR - premiere version faite, premiere version fausse : les trois
       qui touchent la facade a la premiere minute laissaient sortir tout le
       monde, et les cent dix-sept qui arrivaient derriere les prenaient a
       revers. Sans cette borne, une base a sec perdait tout son monde en une
       nuit - mesure au banc, quatre sortants, quatre morts sur trois
       graines - et la penurie devenait la fin de la partie au lieu d'en etre
       le prix. */
    var foule=((zc.large|0)>asec.length);
    for(i=0;i<asec.length;i++){
        n=asec[i];
        /* celui qui a decroche ne prend pas d'adversaire : il rentre, et le
           zombi qu'il aurait tenu revient a un autre */
        if(foule||zi>=zc.length||n.crep){ baseRentre(n,dt); continue; }
        baseCorps(n,zc[zi],dt);
        zi++;
    }
    /* et vous, depuis l'interieur. Vos cartouches se comptent. Cette part-la
       demande toujours d'y etre : on ne tire pas d'une maison ou l'on n'est
       pas. */
    if(!baseHere()) return;
    var p=G.p;
    p.bcd=Math.max(0,(p.bcd||0)-dt);
    if(p.bcd>0) return;
    w=handWeapon();
    if(!w||!wAmmo(w)||!w.mag) return;
    t=wallTarget();
    if(!t) return;
    if(p.mag[p.hand]<=0){
        var nd=w.mag-(p.mag[p.hand]|0), gt=ammoTake(p,w.am,nd);
        p.mag[p.hand]+=gt;
        p.bcd=1.4;
        if(!gt) return;
        logMsg("Vous rechargez derriere le mur.","jday");
        return;
    }
    p.mag[p.hand]--;
    secBump(p,"stabilite",1);
    pos=wallPost(t.x,t.y)||{x:cx,y:cy};
    npcFire({x:pos.x, y:pos.y, stats:p.stats, sec:p.sec, fcd:0},w,t);
    wallFlash(pos.x,pos.y,t.x,t.y);
    p.bcd=Math.max(0.18,60/Math.max(1,w.cad));
}
/* Un tour de riposte, pour tous les uniformes de la carte. */
function updReturn(dt){
    var i, n, w;
    for(i=0;i<HUM.length;i++){
        n=HUM[i];
        if(n.dead) continue;
        if(n.fcd>0){ n.fcd-=dt; if(n.fcd<0) n.fcd=0; }
        if(!isUniform(n)||!hostile(n)) continue;
        if(G.inside||G.p.hp<=0) continue;
        if(n.fcd>0) continue;
        if(dist2(n.x,n.y,G.p.x,G.p.y)>NPCFIRE.por*NPCFIRE.por) continue;
        if(!los(n.x,n.y,G.p.x,G.p.y)) continue;
        w=npcWeapon(n);
        if(!w) continue;
        n.face=(G.p.x<n.x)?-1:1;
        npcFire(n,w);
    }
}
function fireShot(ang){
    var p=G.p, w=handWeapon();
    if(!w||p.cd>0||p.eqT>0||p.rl>0||G.inside) return;
    if(!wAmmo(w)){ meleeSwing(ang); return; }
    if(w.mag>0){
        if(p.mag[p.hand]<=0){ reloadStart(); return; }
        p.mag[p.hand]--;
        /* chaque coup part tient la main un peu plus ferme */
        secBump(p,"stabilite",1);
        /* et il dit a l'equipe qu'on ouvre le feu */
        engage(1);
    }
    p.cd=60/Math.max(1,w.cad);
    var a=wAmmo(w), sp=wSpread(w,p,p.ads?1:0)*Math.PI/180, k, dv, an;
    for(k=0;k<a.p;k++){
        dv=(rng()+rng()+rng()-1.5)/1.5;
        an=ang+dv*sp*0.5;
        G.bul.push({x:p.x, y:p.y-11, vx:Math.cos(an)*a.v, vy:Math.sin(an)*a.v,
            t:w.por/a.v, d:a.d});
    }
    G.shake=Math.min(6,G.shake+1.2+a.j/6000);
    /* la detonation porte le rayon de sa munition */
    noiseAt(p.x,p.y,wNoise(w)*stealth(p));
    ejectCase();
    sShot();
}
/* Le rechargement paie l'encombrement : trois quarts du temps nominal pour
   une arme qui tombe bien en main, une fois et demie pour une piece lourde. */
function wReload(w){ return w.rec*(1.5-0.75*w.man); }
function reloadStart(){
    var p=G.p, w=handWeapon();
    if(!w||!w.mag||p.rl>0||p.mag[p.hand]>=w.mag) return;
    /* on ne recharge plus avec du vent : sans une seule cartouche du bon
       calibre en reserve, le geste ne part meme pas */
    if(ammoStock(p,w.am)<=0){
        notice("PLUS DE "+((AMMO[w.am]&&AMMO[w.am].n)||"MUNITIONS").toUpperCase());
        return;
    }
    /* Chargement raccourcit le geste : un quart plus lent a zero, un quart
       plus vif a cent. L'arme garde sa part - un Lebel restera un Lebel. */
    p.rl=wReload(w)*(1.25-0.5*statEff(p,"tir","chargement")/100);
    p.rlT=p.rl; p.burst=0;
}
/* Qui se trouve au point ou passe la balle : un zombi d'abord, un vivant
   ensuite. Le buste fait onze pixels de haut, on vise donc au-dessus du sol. */
/* Qui se trouve sous la balle. Les zombis d'abord, puis les vivants.
   Seuls les villageois etaient touchables : fermiers, pecheurs, soldats,
   garnison, scouts et gens de metier traversaient les balles sans rien
   sentir, alors que les zombis, eux, savaient deja les mordre. On lit
   maintenant la meme liste HUM que les zombis, celle que zHumans tient a
   jour, ce qui garantit qu'on ne peut pas oublier un corps de metier. */
function fleshAt(x,y){
    var i, o;
    for(i=0;i<ZOMBIES.length;i++){
        o=ZOMBIES[i];
        if(o.dead) continue;
        if(Math.abs(x-o.x)<6&&y>o.y-24&&y<o.y+3) return {o:o, z:1};
    }
    for(i=0;i<HUM.length;i++){
        o=HUM[i];
        if(o.dead) continue;
        if(Math.abs(x-o.x)<6&&y>o.y-24&&y<o.y+3) return {o:o, z:0};
    }
    return null;
}
/* ---- LANCER ----
   Une arme de jet ne se tient pas en main : elle part du sac, vers un point
   et non vers une direction. Le point vise est borne par la portee minimale
   et maximale de la piece, puis ecarte selon sa finesse. A l'arrivee, un
   souffle d'un rayon donne ; si la piece dure, elle laisse une nappe qui
   ronge tant qu'elle brule. Angle sur 512 pas et distance sur 256 : le
   journal d'entrees reproduit le jet au pixel pres. */
var THR=[], ZONE=[];
function invTake(id,n){
    var p=G.p, i, c, k;
    n=n||1;
    if(!p.inv) return 0;
    for(i=0;i<p.inv.length&&n>0;i++){
        c=p.inv[i];
        if(!c||cellIsW(c)||c.i!==id) continue;
        k=Math.min(c.q,n); c.q-=k; n-=k;
        if(c.q<=0) p.inv[i]=null;
    }
    return n;
}
/* Tout ce qui vit dans le rayon prend sa part, pleine au centre et tiers au
   bord - a condition de voir le point d'impact. Un mur arrete le souffle
   comme il arrete le regard : sans cela la nappe rongeait a travers les
   cloisons et une grenade posee dehors vidait la maison.
   Le balayage ne connaissait que les villageois et les zombis : fermiers,
   pecheurs, soldats, gens de metier et le joueur lui-meme traversaient les
   explosions sans rien sentir. Il lit maintenant la meme liste HUM que les
   balles, ce qui rend l'oubli impossible a refaire.
   force : la nappe ronge par demi-secondes et passe outre la Vigueur, sinon
   un homme robuste brulerait moins vite qu'un autre. */
function blastHurt(x,y,r,d,force){
    var i, o, dd, f, hit=0;
    function tryOne(o2,isZ){
        if(!o2||o2.dead) return;
        dd=Math.hypot(o2.x-x,(o2.y-11)-y);
        if(dd>r) return;
        if(!los(x,y,o2.x,o2.y-11)) return;
        f=1-0.67*(dd/r);
        hurt(o2,d*f,isZ); hit++;
    }
    for(i=0;i<ZOMBIES.length;i++) tryOne(ZOMBIES[i],1);
    for(i=0;i<HUM.length;i++) tryOne(HUM[i],0);
    /* le joueur n'etait pas dans la liste : on ne se brulait pas a son
       propre cocktail, ce qui otait tout risque au jet de pres */
    o=G.p;
    if(!G.inside&&o.hp>0){
        dd=Math.hypot(o.x-x,(o.y-11)-y);
        if(dd<=r&&los(x,y,o.x,o.y-11)){
            f=1-0.67*(dd/r);
            hurtPlayer(d*f,force); hit++;
        }
    }
    return hit;
}
function boom(o,x,y){
    var k, a, sp, big=o.rad>60;
    /* la gerbe : plus le rayon est large, plus il en part */
    for(k=0;k<(big?26:16);k++){
        a=vr(0,6.283); sp=vr(40,40+o.rad*3);
        IMP.push({k:1, x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-vr(20,90),
            t:vr(0.18,0.5), r:1, c:[255,vr(140,215)|0,vr(30,90)|0]});
    }
    for(k=0;k<(big?14:8);k++){
        a=vr(0,6.283); sp=vr(10,50);
        IMP.push({k:0, x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-vr(10,40),
            t:vr(0.4,1.0), r:vr(2,5), c:[190,184,170]});
    }
    G.shake=Math.min(9,G.shake+2+o.rad/26);
    sShot();
    if(o.dur>0) ZONE.push({x:x, y:y, r:o.rad, d:o.dmg, t:o.dur, tt:o.dur,
                           f:(o.dmg>0)?1:0, w:0});
    else if(o.dmg>0) blastHurt(x,y,o.rad,o.dmg);
}
/* Lancer ce que porte [E]. q tient l'angle sur 512 pas et la distance sur
   256, rapportee a la portee de la piece. */
function throwQuick(q){
    var p=G.p, id=quickId(1), o=itemById(id);
    if(!o||o.k!=="jet") return;
    if(p.thrT>0||G.inside||G.pick||G.talk) return;
    if(invCount(id)<=0){ notice("PLUS DE "+o.n.toUpperCase()); return; }
    var ang=(q>>8)*6.283185307/512, dq=q&255;
    var dist=o.pmin+(o.por-o.pmin)*(dq/255);
    /* La finesse du lancer : la precision de la piece d'abord, la main de
       celui qui lance ensuite. Lancer resserre l'ecart de moitie a cent, le
       double a zero - et il porte plus loin : un bon bras ajoute un
       cinquieme a la portee de n'importe quelle piece. */
    var lk=statEff(p,"tir","lancer")/100;
    dist*=0.9+0.3*lk;
    var sl=(1-o.prec)*(1.5-lk);
    ang+=(rng()+rng()-1)*sl*0.34;
    dist*=1+(rng()+rng()-1)*sl*0.30;
    dist=Math.max(o.pmin*0.7,Math.min(o.por*1.1,dist));
    var tx=p.x+Math.cos(ang)*dist, ty=(p.y-11)+Math.sin(ang)*dist;
    var fl=dist/240;   /* le vol dure a peu pres la distance sur 240 px/s */
    THR.push({o:o, x:p.x, y:p.y-11, sx:p.x, sy:p.y-11, tx:tx, ty:ty,
              t:0, tt:Math.max(0.22,fl), sp:0});
    invTake(id,1);
    p.thrT=0.85;
    secBump(p,"lancer",3);
    sClick();
}
function updThrow(dt){
    var Math=DMATH;
    var i, b, u, z, nx, ny, k, n2, px, py, hx2, hy2, blocked;
    if(G.p.thrT>0){ G.p.thrT-=dt; if(G.p.thrT<0) G.p.thrT=0; }
    for(i=THR.length-1;i>=0;i--){
        b=THR[i]; b.t+=dt;
        u=b.t/b.tt;
        if(u>=1){ boom(b.o,b.tx,b.ty); THR.splice(i,1); continue; }
        nx=b.sx+(b.tx-b.sx)*u;
        ny=b.sy+(b.ty-b.sy)*u;
        /* ---- LE MUR ARRETE LE JET ----
           Le lancer etait ecrit mais rien ne l'arretait : on posait une
           grenade a l'interieur d'un batiment ferme en visant a travers son
           mur. Le vol est desormais sous-echantillonne comme une balle, et
           la piece eclate au premier obstacle rencontre. Les vingt premiers
           pixels ne comptent pas : on lance depuis son propre corps, qui
           frole parfois une cloison. */
        n2=Math.max(1,Math.ceil(Math.hypot(nx-b.x,ny-b.y)/4));
        blocked=0;
        for(k=1;k<=n2;k++){
            px=b.x+(nx-b.x)*k/n2; py=b.y+(ny-b.y)*k/n2;
            if(dist2(px,py,b.sx,b.sy)<400) continue;
            if(hitObstacle(px,py,3)){ blocked=1; hx2=px; hy2=py; break; }
        }
        if(blocked){ boom(b.o,hx2,hy2); THR.splice(i,1); continue; }
        b.x=nx; b.y=ny;
        b.sp=Math.sin(u*3.14159)*Math.min(26,b.tt*34);   /* la cloche du jet */
    }
    for(i=ZONE.length-1;i>=0;i--){
        z=ZONE[i]; z.t-=dt; z.w+=dt;
        if(z.d>0&&z.w>=0.5){ blastHurt(z.x,z.y,z.r,z.d*z.w,1); z.w=0; }
        if(z.t<=0) ZONE.splice(i,1);
    }
}
function drawThrow(cx,cy){
    var i, b, z, a, k, px, py;
    for(i=0;i<ZONE.length;i++){
        z=ZONE[i];
        px=Math.round(z.x-cx); py=Math.round(z.y-cy);
        if(px<-140||px>780||py<-140||py>500) continue;
        a=Math.min(1,z.t/Math.max(0.001,z.tt*0.35));
        ctx.save();
        if(z.f){
            ctx.globalCompositeOperation="lighter";
            ctx.globalAlpha=0.22*a;
            ctx.fillStyle=(G.frame&8)?"#e07020":"#c85018";
        } else {
            ctx.globalAlpha=0.34*a;
            ctx.fillStyle="#9aa0a4";
        }
        ctx.beginPath(); ctx.ellipse(px,py,z.r,z.r*0.62,0,0,6.283); ctx.fill();
        ctx.globalAlpha=(z.f?0.30:0.24)*a;
        ctx.beginPath(); ctx.ellipse(px,py,z.r*0.6,z.r*0.38,0,0,6.283); ctx.fill();
        ctx.restore();
        /* quelques langues qui montent */
        if(z.f) for(k=0;k<3;k++){
            var fa=(G.frame*0.11+k*2.1+i)%6.283;
            ctx.fillStyle=(G.frame+k&8)?"#f0a030":"#f8d060";
            ctx.fillRect(px+Math.round(Math.cos(fa)*z.r*0.55)-1,
                         py+Math.round(Math.sin(fa)*z.r*0.34)-3,2,3);
        }
    }
    for(i=0;i<THR.length;i++){
        b=THR[i];
        px=Math.round(b.x-cx); py=Math.round(b.y-cy-b.sp);
        if(px<-20||px>680||py<-20||py>400) continue;
        ctx.fillStyle="#1a1610"; ctx.fillRect(px-2,py-2,5,5);
        ctx.fillStyle="#c8bb98"; ctx.fillRect(px-1,py-1,3,3);
        ctx.fillStyle="#f0e0b0"; ctx.fillRect(px-1,py-1,1,1);
        /* l'ombre au sol, qui dit ou cela va tomber */
        ctx.fillStyle="rgba(10,8,6,0.28)";
        ctx.fillRect(Math.round(b.x-cx)-2,Math.round(b.y-cy)+1,5,2);
    }
}
/* Se servir de ce que porte [A] : on prend la premiere case qui en tient. */
function useQuick(){
    var p=G.p, id=quickId(0), i;
    if(id<0||!p.inv) return;
    for(i=0;i<p.inv.length;i++){
        var c=p.inv[i];
        if(c&&!cellIsW(c)&&c.i===id){ useCell(i); return; }
    }
    notice("PLUS DE "+(itemById(id)?itemById(id).n.toUpperCase():"SOIN"));
}
function updShots(dt){
    var p=G.p, i, b, nx, ny, w=handWeapon();
    if(p.cd>0){ p.cd-=dt; if(p.cd<0) p.cd=0; }
    if(p.eqT>0){ p.eqT-=dt; if(p.eqT<0) p.eqT=0; }
    if(p.rl>0){
        p.rl-=dt;
        if(p.rl<=0){ p.rl=0;
            if(w&&w.mag){
                /* on ne remplit que de ce qu'on a : ce qui restait dans le
                   chargeur y reste, on le complete jusqu'ou la reserve va.
                   Un chargeur incomplet vaut mieux qu'un refus. */
                var nd=w.mag-(p.mag[p.hand]|0);
                var gt=ammoTake(p,w.am,nd);
                p.mag[p.hand]=(p.mag[p.hand]|0)+gt;
                if(gt<nd) notice("CHARGEUR INCOMPLET");
                if(gt>0) secBump(p,"chargement",1);
            }
        }
    }
    /* rafale en cours, ou gachette maintenue en automatique */
    if(w&&p.eqT<=0&&p.cd<=0){
        if(p.burst>0){ p.burst--; fireShot(p.aimQ*6.283185307/512); }
        else if(p.trig&&handMode()===2) fireShot(p.aimQ*6.283185307/512);
    }
    for(i=G.bul.length-1;i>=0;i--){
        b=G.bul[i];
        /* Une balle de 5,56 franchit 34 px en une image : avancer d'un bond
           la ferait passer au travers d'un mur de 20. On marche donc par pas
           de quatre pixels, et l'on s'arrete au premier obstacle. */
        var len=Math.hypot(b.vx,b.vy)*dt, ns=Math.max(1,Math.ceil(len/4)), q, dead=0;
        for(q=0;q<ns&&!dead;q++){
            nx=b.x+b.vx*dt/ns; ny=b.y+b.vy*dt/ns;
            if(hitObstacle(nx,ny,1)){ impact(nx,ny,b); dead=1; break; }
            /* la balle d'un uniforme peut atteindre le joueur ; la notre ne
               nous atteint pas, on ne se tire pas dessus */
            if(b.npc&&!b.civ&&!G.inside&&p.hp>0&&
               Math.abs(nx-p.x)<6&&ny>p.y-24&&ny<p.y+3){
                hurtPlayer(b.d); impact(nx,ny,b); dead=1; break;
            }
            var vic=fleshAt(nx,ny);
            /* entre soldats de la releve, la balle passe : ils tirent tous
               vers le meme centre et se croisaient d'un bord a l'autre du
               cercle. Deux cent soixante hommes tombes en cinq minutes,
               presque tous de la main d'un des leurs. */
            if(vic&&b.rel&&vic.o&&vic.o.rel) vic=null;
            /* le tir d'un habitant qui defend traverse les vivants et ne mord
               que les zombis : sans quoi il se touchait lui-meme des le canon,
               et la balle mourait sur place au lieu de partir vers le zombi. */
            if(vic&&b.civ&&!vic.z) vic=null;
            if(vic){ hurt(vic.o,b.d,vic.z,0,b.npc?1:0); impact(nx,ny,b); dead=1; break; }
            b.x=nx; b.y=ny;
        }
        b.t-=dt;
        if(dead){ G.bul.splice(i,1); continue; }
        if(b.t<=0){ impact(b.x,b.y,b); G.bul.splice(i,1); }
    }
}
