"use strict";
/* ================================================================
   TUAZ - 22-rejeu-boucle.js
   Le journal d'inputs, l'empreinte d'etat et la boucle de jeu a pas
   fixe, qui se termine par boot().
   (lignes 25755 a 26282 du mono-fichier d'origine)
   ================================================================ */
/* ================= JOURNAL D'INPUTS ================= */
/* Trame canonique par tick : un masque de touches + des actions discretes.
   La sim ne lit plus "keys" directement, elle lit INP. */
var KMAP=[["KeyW","ArrowUp"],["KeyS","ArrowDown"],["KeyA","ArrowLeft"],["KeyD","ArrowRight"],["KeyE","Space"],
          ["ControlLeft","ControlRight"],["ShiftLeft","ShiftRight"]];
var INP={m:0,a:[]}, PACTS=[];
var JREC=[], JMOD=[], JRECORD=true;   /* journal enregistre */
var JPLAY=null, JMODP=null, JPI=0, JMI=0; /* journal rejoue */
function inp(i){ return (INP.m>>i)&1; }
/* 0 silencieux (Ctrl), 1 normal, 2 sprint (Maj). Ctrl l'emporte si les deux
   touches sont enfoncees : on ne part jamais en sprint par accident. */
function inpMode(){ return inp(5)?0:(inp(6)?2:1); }
/* Les jambes ne se verrouillent plus. Il y avait ici un retrait de A et de D
   du masque quand plusieurs actions s'offraient, pour que ces deux lettres
   servent a choisir : c'etait la cause des blocages de deplacement devant une
   porte et un passant. Le choix se fait maintenant a la molette, au clic ou a
   Tab, et rien de tout cela n'a besoin des touches de marche. */
function liveMask(){
    var m=0, i, a, b;
    for(i=0;i<KMAP.length;i++){
        a=keys[KMAP[i][0]]; b=keys[KMAP[i][1]];
        if(a||b) m|=(1<<i);
    }
    return m;
}
function jreset(){ JREC=[]; JMOD=[]; PACTS=[]; INP={m:0,a:[]}; JPI=0; JMI=0; HLOG=[]; }
/* actions differees d'un tick : appliquees au debut du simStep suivant */
function pushAct(n,a){ if(JPLAY) return; PACTS.push([n,a|0]); }
/* TAB : on prend le corps du compagnon suivant. grpTakeOver glisse son
   identite dans le siege du joueur ; le compteur tourne pour visiter toute
   l'equipe, puis revenir a soi. */
var teamRot=0;
function teamCycle(){
    /* on ne change pas de corps en pleine table d'equipement, en troc ou en
       dialogue ; en revanche on PEUT feuilleter l'equipe depuis son sac (I),
       et l'inventaire suit alors le nouveau corps. */
    if(G&&(G.eqn||G.trade||G.talk||G.inside||G.pick||G.loot)) return;
    var L=grpList(); if(!L||!L.length) return;
    var n=L[teamRot%L.length]; teamRot++;
    /* on retient les deux positions : la notre et la sienne */
    var pPx=G.p.x, pPy=G.p.y, pCx=n.x, pCy=n.y;
    grpTakeOver(n);
    /* grpTakeOver a glisse son identite dans notre siege (reste a NOTRE place)
       et a pose l'ancien nous a SA place. On echange donc les deux corps pour
       de bon : on prend physiquement la place du coequipier, il prend la
       notre - la camera suit. */
    var L2=grpList(), i, me=null;
    for(i=0;i<L2.length;i++){ if(L2[i].x===pCx&&L2[i].y===pCy){ me=L2[i]; break; } }
    if(me){ me.x=pPx; me.y=pPy; me.tx=pPx; me.ty=pPy; me.hx=pPx; me.hy=pPy; }
    G.p.x=pCx; G.p.y=pCy;
    G.cam.x=clamp(G.p.x-CFG.VIEW_W/2,0,CFG.WORLD-CFG.VIEW_W);
    G.cam.y=clamp(G.p.y-CFG.VIEW_H/2,0,CFG.WORLD-CFG.VIEW_H);
    if(typeof fogReveal==="function") fogReveal(G.p.x,G.p.y);
    if(pnameEl) pnameEl.textContent=G.p.name||"Heros";
    drawPortraits();
    invSync();
}
/* Apres un geste d'inventaire, on redessine le panneau ouvert - grille ET
   silhouettes (bagFill et eqFill appellent tous deux drawPortraits) - pour
   que l'allure suive sans qu'on ait a fermer et rouvrir. */
function invSync(){
    if(!G) return;
    if(G.showBag) bagFill();
    if(G.eqn) eqFill();
}
function doAct(n,a){
    if(n==="act") actKey();
    else if(n==="arme"){
        if(handWeapon()){ G.armed=!G.armed; }
        else { G.armed=!G.armed; notice(G.armed?"MAIN VIDE LEVEE":"BRAS BAISSES"); }
    }
    else if(n==="main") selectHand(a);
    else if(n==="wsel"){ setSlot((a/100)|0,(a%100)-1); invSync(); }
    else if(n==="bsel"){ setBag(a-1); invSync(); }
    else if(n==="isel"){ setCell((a/1000)|0,(a%1000)-1); invSync(); }
    else if(n==="iuse") useCell(a);
    else if(n==="idrop") gndPut(a);
    /* le glisser-deposer : une seule action pour toutes les zones */
    else if(n==="idnd"){ if(dndDo((a/10000)|0,a%10000)) invSync(); }
    else if(n==="trocgo") xchgDo();
    else if(n==="bput"){ if(basePut(a)) baseFill(); }
    else if(n==="btake"){ if(baseTake(a)) baseFill(); }
    /* b\u00e2tir et defaire : le geste passe par le plan, qui se repeint
       ensuite, et l'onglet BASE avec lui */
    else if(n==="bup"){ if(planPut(a)){ planRefresh(); baseFill(); } }
    else if(n==="bdown"){ if(planTake(a)){ planRefresh(); baseFill(); } }
    else if(n==="brep"){ if(BUILDS[a]&&buildFix(BUILDS[a].k)){ planRefresh(); baseFill(); } }
    else if(n==="depgo") depGo();
    else if(n==="miss"){
        var L9=grpList(), i9=(a/16)|0, k9=a%16;
        if(L9[i9]&&MISS_KINDS[k9]&&missSend(L9[i9],MISS_KINDS[k9].k)) missFill();
    }
    else if(n==="mrec"){
        var Lr=grpList();
        if(Lr[a]&&missRecall(Lr[a])) missFill();
    }
    else if(n==="qsel") setQuick((a/1000)|0,(a%1000)-1);
    else if(n==="vsel") vetWearFrom((a/1000)|0,(a%1000)-2);
    /* la table a deux : ses deux sacs passent par "troc" comme partout
       ailleurs, il ne lui reste en propre que le desequipement */
    /* le geste se repeint la ou il a ete fait : xchgFill rend la main a la
       table a deux, au dialogue ou a la colonne, selon celle qui est ouverte */
    else if(n==="eqw"){ if(eqStripW(a)) xchgFill(); }
    else if(n==="eqv"){ if(eqStripV(a)) xchgFill(); }
    else if(n==="eqb"){ if(eqStripBag()) xchgFill(); }
    else if(n==="clan"){
        G.clan=((a|0)%CLANCOL.length+CLANCOL.length)%CLANCOL.length;
        clanBuild(G.clan);
        DRESSCACHE={};
        logMsg("Le clan porte desormais le "+CLANCOL[G.clan].n.toLowerCase()+".","jday");
        grpFill();
    }
    else if(n==="cyc") actCycle(a<0?-1:1);
    /* le clic designe une ligne, il ne fait pas defiler : un rang absolu ne
       peut pas se decaler entre le clic et le tour ou il s'applique */
    else if(n==="asel") actPick(a);
    else if(n==="jet") throwQuick(a);
    else if(n==="soin") useQuick();
    else if(n==="mode"){
        /* Dedans, [B] declare le batiment ; dehors, il change le mode de tir.
           Les deux gestes ne peuvent pas se rencontrer : on ne regle pas une
           arme en fouillant un grenier. */
        if(G.inside) baseDeclare(G.inside); else cycleMode();
    }
    else if(n==="ads") G.p.ads=a?1:0;
    else if(n==="rech") reloadStart();
    else if(n==="vise") G.p.aimQ=a&511;
    else if(n==="tiroff") G.p.trig=0;
    else if(n==="tir"){
        var p9=G.p, m9=handMode();
        p9.aimQ=a&511; p9.trig=1;
        if(m9===1) p9.burst=3;
        else if(m9===0) fireShot(a*6.283185307/512);
    }
    else if(n==="out") outKey();
    else if(n==="bye") talkEnd();
    else if(n==="troc") xchgPick((a&4096)?1:0,a&4095,!!(a&8192));
    else if(n==="choice") talkChoice(a);
    else if(n==="team") teamCycle();
    else if(n==="gcmd") grpCmd(a);
}
/* actions de modale : la sim est a l'arret, on applique tout de suite */
function readInput(){
    var i;
    if(JPLAY){
        INP.a=[];
        while(JPI<JPLAY.length&&JPLAY[JPI][0]<=G.tick){
            INP.m=JPLAY[JPI][1];
            var ac=JPLAY[JPI][2]||[];
            for(i=0;i<ac.length;i++) INP.a.push(ac[i]);
            JPI++;
        }
    } else {
        var m=liveMask(), a=PACTS; PACTS=[];
        if(JRECORD&&(m!==INP.m||a.length)) JREC.push([G.tick,m,a]);
        INP.m=m; INP.a=a;
    }
    for(i=0;i<INP.a.length;i++) doAct(INP.a[i][0],INP.a[i][1]);
    INP.a=[];
}
function jdump(){ return JSON.stringify({bseed:BUDGET_SEED,mseed:MAPSEED,sseed:SIMSEED,rec:JREC,mod:JMOD,log:HLOG}); }
/* ----- rejeu ----- */
var REPLAY_SPEED=240, JEND=0, JREF=null;
function jreplay(dump){
    var D=(typeof dump==="string")?JSON.parse(dump):dump;
    if(!D||!D.rec) return "dump invalide";
    setSeeds(D.bseed,D.mseed,D.sseed);
    regen();                          /* la carte doit correspondre au dump */
    JREF={bseed:D.bseed,mseed:D.mseed,log:D.log||[]};
    /* le rejeu ne passe pas par l'ecran de chargement : il lui faut la partie
       tout de suite, et newGame -> jreset remet JPI/JMI a 0 */
    newGame(); enterPlay();
    JPLAY=D.rec||[]; JMODP=D.mod||[];
    var lastIn=JPLAY.length?JPLAY[JPLAY.length-1][0]:0;
    var lastHash=JREF.log.length?JREF.log[JREF.log.length-1][0]:0;
    /* on rejoue jusqu'au dernier releve de hash, meme sans input : c'est lui
       qui sert de reference de comparaison. */
    JEND=Math.max(lastIn,lastHash);
    return "rejeu lance, cible tick "+JEND;
}
function jstop(){ JPLAY=null; JMODP=null; return "rejeu arrete au tick "+(G?G.tick:0); }
function jfinish(){
    var t=G.tick, h=hx(stateHash());
    JPLAY=null; JMODP=null;
    var out="REJEU TERMINE  tick="+t+"  hash final="+h;
    if(JREF) out+="\n"+hashDiff(JREF,{bseed:BUDGET_SEED,mseed:MAPSEED,log:HLOG});
    console.log(out);
    return out;
}

/* ================= HASH D'ETAT ================= */
/* FNV-1a 32 bits sur les bits bruts IEEE754 des champs canoniques.
   Sert a detecter une divergence entre deux executions (rejeu, serveur). */
var HBUF=new DataView(new ArrayBuffer(8));
function hNum(h,v){
    v=+v; if(!(v===v)) v=0; if(v===0) v=0;
    HBUF.setFloat64(0,v);
    for(var i=0;i<8;i++){ h=(h^HBUF.getUint8(i))>>>0; h=Math.imul(h,16777619)>>>0; }
    return h;
}
function stateHash(){
    if(!G) return 0;
    var h=0x811c9dc5, p=G.p;
    h=hNum(h,G.tick);
    h=hNum(h,p.x); h=hNum(h,p.y); h=hNum(h,p.hp);
    h=hNum(h,p.fx); h=hNum(h,p.fy); h=hNum(h,p.kx); h=hNum(h,p.ky);
    h=hNum(h,p.mode); h=hNum(h,G.exitT); h=hNum(h,G.armed?1:0); h=hNum(h,p.hand); h=hNum(h,G.bul.length); h=hNum(h,p.ads);
    /* le souffle commande la vitesse : sans lui, deux rejeus qui ne se sont
       pas essouffles au meme moment rendraient la meme empreinte */
    h=hNum(h,p.sta); h=hNum(h,p.winded?1:0);
    h=hNum(h,G.day); h=hNum(h,G.darkNow);
    /* le prologue : deux rejeus dont l'un a pose la question et l'autre
       non ne vivent pas dans le meme pays */
    h=hNum(h,G.pro0); h=hNum(h,G.proDit|0); h=hNum(h,G.proFlic?1:0);
    h=hNum(h,G.quarT); h=hNum(h,G.quarOut|0); h=hNum(h,G.quarArmy|0);
    /* le sac et ce qu'il porte : sans quoi le rejeu ne verrait pas la
       difference entre deux parties ou l'on n'a pas ramasse la meme chose */
    h=hNum(h,p.bag); h=hNum(h,p.heal||0); h=hNum(h,p.sto||0);
    h=hNum(h,p.under?1:0);
    h=hNum(h,p.mal?1:0);
    /* la base appartient a la partie : deux rejeus dont l'un s'est installe
       et l'autre non ne rendent pas la meme empreinte */
    if(BASE){
        var bq9=0, bi9, bk9;
        for(bi9=0;bi9<BASE.inv.length;bi9++) if(BASE.inv[bi9]) bq9++;
        h=hNum(h,BASE.cap); h=hNum(h,bq9);
        /* ce qui est b\u00e2ti, sa taille et son emplacement : deux rejeus dont
           l'un a pose une cantine au premier et l'autre un coin cuisine au
           rez rendaient la meme empreinte */
        for(bi9=0;bi9<BUILDS.length;bi9++){
            bk9=BASE.built&&BASE.built[BUILDS[bi9].k];
            h=hNum(h,bk9?(bk9.n|0):0);
            h=hNum(h,bk9?((bk9.fl|0)*16+(bk9.ri|0)):-1);
            /* hors service ou non : deux rejeus dont l'un a laisse lacher sa
               cuisine rendaient jusqu'ici la meme empreinte, alors qu'ils ne
               mangeront plus la meme chose demain */
            h=hNum(h,(bk9&&bk9.hs)?1:0);
        }
        h=hNum(h,BASE.aucoin|0);
        h=hNum(h,BASE.dette|0);
        /* l'assaut appartient a la simulation : deux rejeus dont l'un a la
           horde a ses portes et l'autre non ne rendent pas la meme empreinte */
        h=hNum(h,BASE.jauge||0); h=hNum(h,BASE.alerte||0);
        h=hNum(h,BASE.assaut||0); h=hNum(h,BASE.nb|0); h=hNum(h,BASE.dit|0);
    } else h=hNum(h,0);
    /* les munitions se comptent maintenant : le chargeur, le vrac et les
       boites. Sans eux, deux rejeus dont l'un a vide sa reserve et l'autre
       non rendraient la meme empreinte. */
    var mi2, mk2, ml2=0;
    for(mi2=0;mi2<4;mi2++) h=hNum(h,p.mag[mi2]|0);
    if(p.loose) for(mk2 in p.loose) ml2+=p.loose[mk2]|0;
    h=hNum(h,ml2);
    h=hNum(h,p.qa); h=hNum(h,p.qe);
    h=hNum(h,G.actI|0); h=hNum(h,(G.acts?G.acts.length:0));
    h=hNum(h,THR.length); h=hNum(h,ZONE.length);
    /* ce qui git par terre appartient a la simulation : deux rejeus dont l'un
       a pose son sac et l'autre non ne rendent pas la meme empreinte */
    var gq2=0, gi2;
    for(gi2=0;gi2<GND.length;gi2++) gq2+=(GND[gi2].q||1);
    h=hNum(h,GND.length); h=hNum(h,gq2); h=hNum(h,GNDN);
    h=hNum(h,CORPSE.length);
    /* sans les zombis dans l'empreinte, le rejeu ne verrait pas la difference
       entre une chasse et une promenade */
    h=hNum(h,ZOMBIES.length);
    /* la source et les corps en attente tirent tous deux sur le flux sim :
       sans eux, deux parties qui n'ont pas lache les memes zombis rendraient
       la meme empreinte pendant les vingt premieres secondes */
    h=hNum(h,LABN); h=hNum(h,RISERS.length);
    /* les habitants meurent desormais : sans eux dans l'empreinte, le rejeu
       ne verrait pas la difference entre un bourg intact et un bourg vide */
    var hdead=0, hsum=0, hfear=0, hsta=0, hknow=0, hi2;
    for(hi2=0;hi2<HUM.length;hi2++){
        var hh2=HUM[hi2];
        if(hh2.dead) hdead++;
        hsum+=hh2.hp||0;
        hsta+=hh2.sta||0;
        if(hh2.fear>0) hfear++;
        if(hh2.knows) hknow++;
    }
    h=hNum(h,HUM.length); h=hNum(h,hdead); h=hNum(h,hsum); h=hNum(h,hfear);
    h=hNum(h,hsta);
    /* ce que le monde sait du joueur change son comportement : sans cela,
       deux rejeux dont l'un a tue un civil rendraient la meme empreinte */
    h=hNum(h,hknow); h=hNum(h,G.outlaw?1:0);
    for(var zi=0;zi<ZOMBIES.length;zi++){
        var zz=ZOMBIES[zi];
        h=hNum(h,zz.x); h=hNum(h,zz.y); h=hNum(h,zz.hp);
        h=hNum(h,zz.st); h=hNum(h,zz.dead?1:0);
    }
    for(qi=0;qi<ZONE.length;qi++) h=hNum(h,ZONE[qi].t);
    var qi, qc;
    for(qi=0;qi<(p.inv?p.inv.length:0);qi++){
        qc=p.inv[qi];
        h=hNum(h,qc?(cellIsW(qc)?(1000+qc.w):qc.i):-1); h=hNum(h,qc?qc.q:0);
    }
    /* La fouille tire sur le flux SIM a chaque piece : sans elle dans
       l'empreinte, deux rejeux dont l'un a retourne une superette et
       l'autre non rendraient la meme signature. */
    var sdone=0, sleft=0, si2, sb2, sc2;
    for(si2=0;si2<BLDRECTS.length;si2++){
        sb2=BLDRECTS[si2];
        if(sb2.done) sdone+=sb2.done;
        if(!sb2.inv) continue;
        for(sc2=0;sc2<sb2.inv.length;sc2++)
            if(sb2.inv[sc2]) sleft+=sb2.inv[sc2].q||1;
    }
    h=hNum(h,sdone); h=hNum(h,sleft);
    h=hNum(h,G.srch?G.srch.t:-1); h=hNum(h,G.srch?G.srch.dur:-1);
    h=hNum(h,G.inside?1:0); h=hNum(h,G.loot?1:0);
    /* ---- CE QUE LA v16 A AJOUTE ----
       L'empreinte s'etait arretee a la v15 : le groupe, les aptitudes qui
       montent, la maladie et l'interieur de la base n'y entraient pas. Deux
       rejeux qui divergeaient sur un recrutement, sur une aptitude gagnee ou
       sur trois pieces baties rendaient donc la meme signature, et l'outil
       ne protegeait plus rien de ce qui avait ete construit. */
    var GL=grpList(), gi9, gn9, gaff=0, gout=0, gmis=0, ghp=0, gvet=0, gv9;
    for(gi9=0;gi9<GL.length;gi9++){
        gn9=GL[gi9];
        h=hNum(h,gn9.x); h=hNum(h,gn9.y);
        gaff+=gn9.aff||0; ghp+=gn9.hp||0;
        if(gn9.vet) for(gv9=0;gv9<4;gv9++) gvet=hNum(gvet,gn9.vet[gv9]);
        /* ce qu'ils ont dans le chargeur et dans le sac : sans cela, deux
           rejeux dont l'un a ravitaille son equipe rendraient la meme
           empreinte jusqu'a la premiere fusillade */
        if(gn9.mag) for(gv9=0;gv9<4;gv9++) gvet=hNum(gvet,gn9.mag[gv9]|0);
        if(gn9.slots) for(gv9=0;gv9<4;gv9++)
            gvet=hNum(gvet,gn9.slots[gv9]?WEAPONS.indexOf(gn9.slots[gv9]):-1);
        if(gn9.inv) for(gv9=0;gv9<gn9.inv.length;gv9++){
            var gc9=gn9.inv[gv9];
            gvet=hNum(gvet,gc9?(cellIsW(gc9)?(1000+gc9.w):gc9.i):-1);
            gvet=hNum(gvet,gc9?(gc9.q||1):0);
        }
        if(gn9.out) gout++;
        if(gn9.miss) gmis++;
        /* perdu, abrite, et depuis combien de temps : deux rejeux dont l'un
           a seme son equipe ne rendent pas la meme empreinte */
        gvet=hNum(gvet,gn9.lst|0); gvet=hNum(gvet,gn9.ltot||0);
        /* ce qu'il digere et son delai avant le prochain geste : deux rejeus
           dont l'un a mange ne rendent pas la meme empreinte */
        gvet=hNum(gvet,gn9.heal||0); gvet=hNum(gvet,gn9.careT||0);
        gvet=hNum(gvet,gn9.sto||0); gvet=hNum(gvet,gn9.sta||0);
    }
    h=hNum(h,G.clan|0);
    h=hNum(h,GL.length); h=hNum(h,gaff); h=hNum(h,gout); h=hNum(h,gmis);
    h=hNum(h,ghp); h=hNum(h,GRPT); h=hNum(h,gvet);
    /* les seize aptitudes du joueur, et le compte d'usages qui les fait
       monter : sans lui, deux rejeux dont l'un a fouille toute la journee se
       ressemblent tant que le point n'est pas encore tombe */
    var sd9, sq9, sky, ssum=0, suse=0;
    for(sd9=0;sd9<STATDEF.length;sd9++)
        for(sq9=0;sq9<STATDEF[sd9].sec.length;sq9++){
            sky=STATDEF[sd9].sec[sq9].k;
            ssum=hNum(ssum,(p.sec&&p.sec[sky])||0);
            suse+=(p.use&&p.use[sky])|0;
        }
    h=hNum(h,ssum); h=hNum(h,suse); h=hNum(h,p.hpGain||0);
    /* ce qu'on porte change les aptitudes, la vie et le poids : deux rejeux
       dont l'un a enfile un gilet pare-balles et l'autre non ne rendent pas
       la meme empreinte. La tenue des compagnons compte avec eux. */
    var vi9;
    for(vi9=0;vi9<4;vi9++) h=hNum(h,(p.vet&&p.vet[vi9]!==undefined)?p.vet[vi9]:-1);
    h=hNum(h,p.maxhp);
    /* la maladie ronge un point toutes les douze secondes : son minuteur
       appartient a la simulation autant que les points de vie */
    h=hNum(h,p.mal?1:0); h=hNum(h,p.malT||0);
    h=hNum(h,p.malPause||0); h=hNum(h,p.rest||0);
    /* la base : ce qui est bati, le moral, et ce que le jour lui a coute */
    if(BASE){
        h=hNum(h,BASE.mor||0);
        var bb9;
        if(BASE.built) for(bb9 in BASE.built)
            h=hNum(h,BASE.built[bb9]?(BASE.built[bb9].hs?2:1):0);
    }
    return h>>>0;
}
function hx(h){ var s=(h>>>0).toString(16); while(s.length<8) s="0"+s; return s; }
/* journal de hash : un releve tous les HASH_EVERY ticks */
var HASH_EVERY=60, HLOG=[], HLOG_MAX=7200;
function hashTick(){
    if((G.tick%HASH_EVERY)!==0) return;
    HLOG.push([G.tick, stateHash()]);
    if(HLOG.length>HLOG_MAX) HLOG.shift();
}
function hashDump(){ return JSON.stringify({bseed:BUDGET_SEED,mseed:MAPSEED,sseed:SIMSEED,log:HLOG}); }
function hashDiff(dumpA,dumpB){
    var A=(typeof dumpA==="string")?JSON.parse(dumpA):dumpA;
    var B=(typeof dumpB==="string")?JSON.parse(dumpB):dumpB;
    var L=[], n=Math.min(A.log.length,B.log.length), i;
    if(A.bseed!==B.bseed||A.mseed!==B.mseed) L.push("XX seeds differentes");
    for(i=0;i<n;i++){
        if(A.log[i][0]!==B.log[i][0]){ L.push("XX ticks desynchronises a l'index "+i); break; }
        if(A.log[i][1]!==B.log[i][1]){
            L.push("XX divergence au tick "+A.log[i][0]+"  "+hx(A.log[i][1])+" != "+hx(B.log[i][1]));
            break;
        }
    }
    if(L.length===0) L.push("HASH IDENTIQUES sur "+n+" releves");
    return L.join("\n");
}

/* ================= BOUCLE ================= */
/* Pas fixe : G.tick est la seule horloge canonique, G.t en derive.
   Aucune accumulation flottante, le rejeu serveur peut reproduire la suite. */
var FIXED_DT=1/60, MAX_STEPS=5, acc=0;
var RANKED=/[?&]ranked=1/.test(location.search||"");
function setTick(n){ G.tick=n|0; G.t=G.tick*FIXED_DT; }
function simStep(){
    var dt=FIXED_DT;
    readInput();
    G.frame=(G.frame|0)+1;
    G.tick=(G.tick|0)+1;
    G.t=G.tick*FIXED_DT;
        updPlayer(dt);
        updInteract(dt);
        updExits(dt);
        if((G.frame&7)===0) fogReveal(G.p.x,G.p.y);
        updFrogs(dt); updFishers(dt); updGuides(dt);
        updDeer(dt); updTroops(dt); updBirds(dt); updShots(dt);
        updThrow(dt);
        updCamps(dt);
        updWorkers(dt);
        updLab(dt);
        updPro(dt);
        updQuar(dt);
        updAssault(dt);
        updZombies(dt);
        updReturn(dt);
        updFlee(dt);
        civFight(dt);
        npcUnstick();
        updRise(dt);
        grpTick(dt);
        grpBody(dt);
        fireFlee(dt);
        dirSweep();
        updChats(dt);
        questTick(dt);
        updVillages(dt);
        updFill(dt);
        updFarms(dt);
        updVeg(dt);
        updJournal(dt);
        var v=dayNum();
        if(v!==G.day){ G.day=v; notice("JOUR "+v); logMsg("Un nouveau jour se leve.","jday");
            /* la base nourrit son monde au lever du jour */
            baseDay();
        }
        /* Un seul basculement. Il y en avait deux a la suite : le premier
           ecrivait G.night, si bien que le second - celui qui portait
           l'annonce a l'ecran - ne pouvait plus jamais se declencher. */
        var nn=isNight();
        if(nn!==G.night){ G.night=nn;
            logMsg(nn?"La nuit tombe, les lampadaires s'allument.":
                      "Le jour se leve, les lampadaires s'eteignent.","jday");
            notice(nn?"LA NUIT TOMBE":"L'AUBE SE LEVE"); }
        G.darkTgt=darkTarget();
        G.darkNow+=(G.darkTgt-G.darkNow)*Math.min(1,dt*1.5);
        hashTick();
}
var last=performance.now();
/* LA BOUSSOLE SUIT LE PORTEUR. Le panneau est une photographie : il se
   remplit a l'ouverture et ne bouge plus. Une fleche qui montre le chemin
   n'aurait aucun sens ainsi - on marche en la regardant. Elle seule se
   redessine a chaque image, et seulement quand elle est visible. */
function compassTick(){
    var pg;
    /* C'ETAIT !BASE, ET LA FLECHE RESTAIT DONC FIGEE TANT QU'ON N'AVAIT PAS
       DE BASE - c'est-a-dire exactement pendant le seul moment ou elle sert
       vraiment, entre l'ordre de quarantaine et l'installation. homeB rend
       la maison a defaut de base ; le rafraichissement doit lire la meme
       chose que le dessin. */
    if(!G||!G.showBag||!homeB()) return;
    pg=document.getElementById("ipg3");
    if(!pg||pg.style.display==="none") return;
    baseFacade();
}
function loop(now){
    requestAnimationFrame(loop);
    var real=Math.min(0.25,(now-last)/1000); last=now;
    vdt=real;
    if(JPLAY&&G){
        var r;
        if(state==="play"){
            for(r=0;r<REPLAY_SPEED&&state==="play";r++){
                simStep();
                if(G.tick>=JEND){ jfinish(); break; }
            }
        } else if(state==="dead"||state==="win") jfinish();
        acc=0;
    } else if(state==="play"){
        acc+=real;
        var steps=0, mul=(G.turbo&&!RANKED)?3:1, q;
        while(acc>=FIXED_DT&&steps<MAX_STEPS){
            for(q=0;q<mul;q++) simStep();
            acc-=FIXED_DT; steps++;
        }
        if(acc>FIXED_DT*MAX_STEPS) acc=FIXED_DT*MAX_STEPS;
    } else acc=0;
    if(JPLAY&&!G) JPLAY=null;
    /* Le HUD est du rendu, pas de la simulation. Il etait appele depuis
       simStep : soixante repeintures DOM par seconde en jeu, trois cents en
       turbo, et deux cent quarante par image en rejeu. Une fois par image
       suffit, et la separation sim/rendu redevient nette. */
    if(state==="play"||state==="pause"){ if(G) updHUD(); render(); compassTick(); }
}

/* mise a l'echelle entiere */
function resize(){
    var s=Math.min(innerWidth/1280,innerHeight/720);
    s=s>=1?Math.floor(s):s;
    cv.style.width=(1280*s)+"px"; cv.style.height=(720*s)+"px";
    var r=cv.getBoundingClientRect(), ui=document.getElementById("ui");
    /* L'INTERFACE SUIT LA TAILLE DU JEU. Le HUD est dessine pour 1280x720 :
       on garde donc #ui a cette taille logique et on le met a la meme echelle
       que le canvas, au lieu de l'etirer aux dimensions affichees. Sans cela,
       des que le canvas retrecit (zoom navigateur, petite fenetre), le HUD
       gardait ses pixels d'origine et paraissait enorme. */
    ui.style.left=r.left+"px"; ui.style.top=r.top+"px";
    ui.style.width="1280px"; ui.style.height="720px";
    ui.style.transformOrigin="0 0";
    ui.style.transform="scale("+s+")";
    /* les menus et l'ecran de presentation (hors #ui) suivent la meme echelle */
    document.documentElement.style.setProperty("--us",s);
}
addEventListener("resize",function(){ requestAnimationFrame(resize); });

boot();
requestAnimationFrame(loop);
