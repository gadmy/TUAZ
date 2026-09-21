"use strict";
/* ================================================================
   TUAZ - 07-etat.js
   L'etat de partie (G), l'objectif du jour, l'apparition du joueur
   et la lecture des touches.
   (lignes 7810 a 8612 du mono-fichier d'origine)
   ================================================================ */
/* ================= ETAT ================= */
/* Reliquat du panneau debug retire : seul le verrou de cycle survit ([M]).
   0 = cycle automatique, 1 = jour fixe, 2 = nuit fixe. */
var DBG={dayLock:0};
/* Niveaux de zoom ([T]). Au-dessus de 1 on se rapproche, en dessous on prend
   du champ : 1.7x en avant, puis le plan normal, puis deux reculs. */
var ZOOMS=[1,1.7,0.6,0.35], zoomI=0;
var cv=document.getElementById("cv"), ctx=cv.getContext("2d");
ctx.imageSmoothingEnabled=false;
ctx.setTransform(2,0,0,2,0,0); /* repere logique 640x360, backing 1280x720 */
var keys={};
var G=null;
var state="menu"; /* menu | play | levelup | debug | pause | dead | win */

function newGame(){
    /* D2 : le flux sim repart de zero a chaque partie. Tout ce qui suit
       (villageois, dragons, arme de depart) est donc reproductible. */
    rng=mulberry32(SIMSEED);
    /* BUDGET nul = seeds changees sans regen(). On refait la carte, sinon la
       partie tourne sur une carte qui ne correspond plus aux seeds. */
    if(!BUDGET) regen();
    G={
        t:0, tick:0, waveNoticed:0, frame:0, _j:jreset(),
        /* l'instant de la question qui ouvre le laboratoire, -1 tant
           qu'elle n'a pas ete posee ; l'uniforme charge de l'ordre de
           quarantaine, et le fait qu'il l'ait dit */
        pro0:-1, proFlic:null, proDit:0, moralHit:0, boom:0,
        /* le confinement : -1 tant qu'on n'est pas rentre, quarOut une
           fois qu'on en est ressorti et pour toujours */
        quarT:-1, quarOut:0, quarArmy:0, quarDit:0, milC:0,
        p:{x:CFG.WORLD/2, y:CFG.WORLD/2, hp:CFG.PLAYER_HP, maxhp:CFG.PLAYER_HP,
           fx:1, fy:0, kx:0, ky:0, flash:0, anim:0, mode:1, sta:100,
           staD:0, winded:0, mov:0, inf:0, moral:MOR_START,
           /* la maison ou l'on habite, la seule ou l'on entre au debut */
           homeB:null,
           stats:baseStats(), sec:baseSec(),
           slots:[null,null,null,null], hand:-1, cd:0, eqT:0,
           fm:[0,0,0,0], trig:0, burst:0, aimQ:0, ads:0,
           mag:[0,0,0,0], rl:0, rlT:1, loose:{}, under:0, inBr:0,
           bag:-1, inv:[null,null], heal:0, healR:0, sto:0, stoR:0,
           qa:-1, qe:-1, thrT:0, vet:vetInit()},
        fx:[], texts:[], birds:[], bul:[],
        cam:{x:CFG.WORLD/2-320, y:CFG.WORLD/2-180},
        shake:0, turbo:false, zads:1,
        darkNow:0, darkTgt:0, exitT:0,
        inside:null, pick:null, talk:null, stopped:null, showInv:false, place:null, quest:null,
        fill:null, loot:null,
        showBag:false, invNpc:null, trade:null, armed:false, eqn:null, clan:0,
        /* La reputation d'ennemi appartient a la partie, pas a la carte : sans
           cette remise a zero, on rejouerait deja recherche. Elle ne tombera
           qu'au changement de carte, quand celui-ci existera. */
        outlaw:0,
        /* les consignes de groupe : hold = tenir la position (pas suivre),
           noFire = ne pas ouvrir le feu (corps a corps de defense conserve).
           Elles se posent par le journal d'entrees, comme le reste. */
        grp:{hold:0, noFire:0},
        day:1, night:false, acts:[], actI:0, actK:""
    };
    CAMPS.forEach(function(cp,ci){
        cp.scouts=[];
        var ns=BUDGET.scouts[ci]||0, k5, a5, d5;
        for(k5=0;k5<ns;k5++){
            a5=rr(0,6.283); d5=rr(12,58);
            cp.scouts.push({x:cp.x+dcos(a5)*d5, y:cp.y+dsin(a5)*d5,
                tx:cp.x, ty:cp.y, wt:rr(0,3), face:1, anim:rr(0,6),
                stop:0, dead:0, fear:0, fdx:0, fdy:0,
                name:pickName(rng()<0.4), maxhp:100, hp:100, sta:100,
                stats:baseStats(), sec:baseSec()});
            npcLoot(cp.scouts[cp.scouts.length-1],"scout");
        }
    });
    /* ---- LES GENS DE METIER ----
       Chaque caserne, commissariat, hopital, cabinet et centre de soins
       peuple ses abords. Ils tournent dans un rayon serre autour de leur
       batiment et n'en sortent pas : c'est ce qui les distingue du
       villageois, qui arpente tout le bourg. */
    WORKERS=[];
    (function(){
        function born(x,y,job,rad,n){
            var q, a7, d7;
            for(q=0;q<n;q++){
                a7=rr(0,6.283); d7=rr(10,rad);
                WORKERS.push({x:x+dcos(a7)*d7, y:y+dsin(a7)*d7,
                    hx:x, hy:y, rad:rad, job:job,
                    tx:x, ty:y, wt:rr(0,3), face:1, anim:rr(0,6),
                    stop:0, dead:0, fear:0, fdx:0, fdy:0,
                    name:pickName(rng()<0.4), maxhp:100, hp:100, sta:100,
                    bio:(rng()*10)|0, foi:ri(0,10)}); 
                (function(w9){ var j9=jobRoll(job);
                    w9.stats=j9.stats; w9.sec=j9.sec;
                    w9.sec0=j9.sec0; w9.spec=j9.spec;
                    w9.maxhp=hpMax(w9); w9.hp=w9.maxhp; })(WORKERS[WORKERS.length-1]);
                npcLoot(WORKERS[WORKERS.length-1],job);
            }
        }
        var i7, v7, h7;
        FIREHOUSES.forEach(function(o){ born(o.x,o.y+34,"pompier",46,ri(2,4)); });
        HOSPITALS.forEach(function(o){ born(o.x,o.y+42,"soignant",52,ri(3,5)); });
        for(i7=0;i7<VILLAGES.length;i7++){
            v7=VILLAGES[i7];
            for(h7=0;h7<v7.houses.length;h7++){
                var b7=v7.houses[h7], cxb=b7.x+b7.w/2, cyb=b7.y+b7.h+14;
                if(b7.k==="police")   born(cxb,cyb,"policier",42,ri(2,3));
                else if(b7.k==="medecin") born(cxb,cyb,"soignant",34,ri(1,2));
                else if(b7.k==="soins")   born(cxb,cyb,"soignant",40,ri(2,3));
            }
        }
    })();
    HUM=[]; HGRID={};
    /* la source et les corps en attente sont de l'etat de partie, pas de
       l'etat de carte : sans cette remise a zero, la partie suivante herite
       du compteur de la precedente et le flux sim derive */
    LABT=0; LABC=ZCFG.labEvery; LABN=0; RISERS=[];
    /* La carte s'ouvre desormais vide de zombis. Les soixante errants poses
       d'entree rendaient le laboratoire inutile : la menace etait deja
       partout avant qu'il ait produit quoi que ce soit, et il ne restait de
       lui qu'un batiment de decor. Tout ce qui marche vient maintenant de
       lui, un toutes les vingt secondes. Le premier jour se joue donc au
       calme, et la pression monte d'elle-meme.
       zPopulate() n'est pas supprimee pour autant : le bouton de [F2] la
       garde, pour peupler la carte d'un coup a l'essai. */
    ZOMBIES=[];
    CHATS=[];
    CLOUDS.length=0;
    /* l'or vient du budget a la generation : ne jamais le re-tirer ici */
    VEGGIES.forEach(function(v){ v.respT=0; });
    CAVES.forEach(function(c){ c.slots=undefined; c.lootT=undefined; });
    DUNGEONS.forEach(function(c){ c.slots=undefined; c.lootT=undefined; });
    /* Les emprises de batiment traversent les parties : elles appartiennent
       a la carte, pas a la partie. Sans cette remise a zero, un batiment
       fouille resterait vide, une porte crochetee resterait ouverte, et le
       flux SIM deriverait des la premiere entree - le meme piege que le
       minuteur des fermiers, en plus visible. */
    BLDRECTS.forEach(function(b){
        b.rooms=0; b.done=0; b.inv=null;
        if(b.lock0!==undefined) b.lock=b.lock0;
    });
    G.srch=null;
    /* ce qui trainait par terre appartenait a la partie precedente */
    GND=[]; GNDN=0; BASE=null; GRPT=0; MAPN=1;
    /* les jumeaux marques se refabriquent a chaque partie : la couleur du
       clan repart au rouge, et les silhouettes avec elle */
    clanBuild(0);
    /* le souvenir du dernier geste appartient a la partie : sans cette remise
       a zero, on repartait avec quatre secondes d'engagement et six de tir
       heritees de la precedente, et les compagnons ouvraient le feu d'entree */
    ENGAG=0; GUN=0;
    CORPSE.forEach(function(o){ if(o) o.ct=undefined; });
    CORPSE=[];
    fogReset(); fogReveal(G.p.x,G.p.y);
    G.darkNow=darkTarget(); G.darkTgt=G.darkNow;
    THR.length=0; ZONE.length=0; SWING.length=0; IMP.length=0;
    FLASH.length=0;
    /* les pecheurs et les fermiers traversent les parties : sans remise a
       zero de leur mort et de leur peur, le rejeu repartait d'un monde deja
       entame. Meme piege que le minuteur des fermiers. */
    /* ---- LE GUIDE DU CHATEAU ----
       Un seul par carte, poste devant la porte. Il est refait a chaque
       partie comme les pecheurs : sans cela, le rejeu retrouverait un guide
       deja mort. Sa fiche est celle d'un metier ordinaire - c'est la table
       des metiers qui lui donne son Combat, ses repliques et son nom sous le
       nom - et il porte la silhouette du heros, epee comprise : elle ne
       servait plus qu'a boucher un trou.
       Il tient la PORTE, pas le pays : au-dela de GUIDE_LAISSE pas du seuil
       il fait demi-tour, meme si le zombi qu'il poursuivait s'enfuit. */
    GUIDES=[];
    DUNGEONS.forEach(function(dg){
        var g={x:dg.x, y:dg.y+26, hx:dg.x, hy:dg.y+26,
            face:1, anim:0, wt:0, stop:0, hidden:false, inb:false,
            dead:0, gone:0, rise:0, fear:0, cd:0,
            job:"guide", bio:(rng()*10)|0, foi:ri(0,10),
            name:pickName(rng()<0.25), maxhp:100, hp:100, sta:100};
        var jg=jobRoll("guide");
        g.stats=jg.stats; g.sec=jg.sec; g.sec0=jg.sec0; g.spec=jg.spec;
        g.maxhp=hpMax(g); g.hp=g.maxhp;
        npcLoot(g,"guide");
        GUIDES.push(g);
    });
    FISHERS.forEach(function(fs){ fs.hidden=false; fs.x=fs.hx; fs.y=fs.hy; fs.rod=0;
        fs.dead=0; fs.fear=0; fs.fdx=0; fs.fdy=0; fs.rise=0; fs.gone=0;
        fs.stop=0; fs.name=pickName(rng()<0.4); npcVitals(fs,"pecheur");
        npcLoot(fs,"pecheur"); });
    ARMYBASES.forEach(function(ab){
        ab.troops=[];
        for(var k9=0;k9<ab.n;k9++){
            var inb=rng()<0.6;
            var a9=rr(0,6.283), d9=inb?rr(0,90):rr(120,190);
            ab.troops.push({x:ab.x+Math.cos(a9)*d9,y:ab.y+Math.sin(a9)*d9,
                tx:ab.x,ty:ab.y,face:1,anim:rr(0,6),wt:rr(0,3),inb:inb,stop:0,
                name:pickName(rng()<0.25),maxhp:100,hp:100,sta:100,
                job:"militaire", bio:(rng()*10)|0, foi:ri(0,10),
                kit:(rng()*SOLSPR.length)|0});
            (function(t9){ var j9=jobRoll("militaire");
                t9.stats=j9.stats; t9.sec=j9.sec;
                t9.sec0=j9.sec0; t9.spec=j9.spec;
                t9.maxhp=hpMax(t9); t9.hp=t9.maxhp;
            })(ab.troops[ab.troops.length-1]);
            npcLoot(ab.troops[ab.troops.length-1],"militaire");
        }
    });
    DEER.forEach(function(h){
        h.list=[];
        for(var k2=0;k2<h.n;k2++){
            var aa2=rr(0,6.283), dd2=rr(0,h.r*0.5);
            h.list.push({x:h.x+Math.cos(aa2)*dd2, y:h.y+Math.sin(aa2)*dd2,
                tx:h.x, ty:h.y, face:1, anim:rr(0,6), wt:rr(0,3), run:0});
        }
    });
    /* Meme fuite que les fermiers : les grenouilles tirent sur le flux SIM et
       gardaient leur minuteur d'une partie a l'autre. */
    FROGS.forEach(function(f){
        f.x=f.hx; f.y=f.hy; f.tx=f.px; f.ty=f.py;
        f.wt=f.hw; f.hop=0; f.face=1; });
    OC.forEach(function(c){ if(c.tree) c.bird=0; });
    SIGNS.forEach(function(s){ s.cd=0; });
    JLOG=[]; if(jlogEl) jlogEl.innerHTML="";
    logMsg("Debut du journal.","jday");
    /* Le fermier retrouvait sa place mais gardait son minuteur d'errance et sa
       cible de la partie precedente. Comme updFarms tire de 3 a 4 valeurs des
       que ce minuteur atteint zero, le flux SIM se decalait d'une partie a
       l'autre et le rejeu n'etait plus reproductible. Rien ne le montrait tant
       qu'aucune entite suivie par l'empreinte ne dependait de ce flux. */
    FARMS.forEach(function(f){ f.farmers.forEach(function(fm){
        fm.hidden=false; fm.x=fm.hx; fm.y=fm.hy; fm.hoe=0;
        fm.wt=0; fm.tx=fm.hx; fm.ty=fm.hy; fm.anim=0; fm.face=1;
        fm.dead=0; fm.fear=0; fm.fdx=0; fm.fdy=0; fm.rise=0; fm.gone=0;
        fm.stop=0; fm.name=pickName(rng()<0.45); npcVitals(fm,"fermier");
        npcLoot(fm,"fermier"); }); });
    /* Chaque harde garde l'epouvantail le plus proche entre deux balayages.
       C'est un etat pose sur un objet de carte : sans remise a plat, une
       seconde partie sur la meme carte partirait avec les zombis de la
       precedente en memoire, et deux rejeus divergeraient. */
    DEER.forEach(function(h){ h.zs=undefined; });
    /* le betail des patures : chaque bete broute dans son enclos */
    FARMS.forEach(function(f){ f.fields.forEach(function(fd){
        if(fd.t!=="pature"||!fd.herd) return;
        fd.herd=[];
        for(var kb=0;kb<fd.nb;kb++){
            fd.herd.push({x:fd.x+rr(9,fd.w-9), y:fd.y+rr(9,fd.h-9),
                tx:0, ty:0, wt:rr(0,4), face:1, anim:rr(0,6)});
        }
    }); });
    VILLAGES.forEach(function(vg,vi){
        if(vg.soldier){ vg.soldier.recruited=false; vg.soldier.dead=false; vg.soldier.hp=vg.soldier.maxhp; vg.soldier.near=0;
            vg.soldier.rise=0; vg.soldier.gone=0; vg.soldier.fear=0;
            vg.soldier.kit=BUDGET.kits[vi];
            vg.soldier.stop=0; vg.soldier.name=pickName(rng()<0.3);
            npcVitals(vg.soldier,"soldat");
            npcLoot(vg.soldier,"soldat");
            vg.soldier.x=vg.x+40; vg.soldier.y=vg.y+20; }
        vg.villagers=[];
        var k;
        vg.doors=[];
        for(k=0;k<vg.houses.length;k++){
            var hs=vg.houses[k];
            /* On poussait une COPIE des quatre nombres. Le villageois ne
               savait donc pas dans quel batiment il rentrait, seulement a
               quel endroit - et le heros, qui herite de ce champ, ne
               pouvait pas designer sa propre maison. On pousse le
               batiment. Tout ce qui lisait x, y, w et h continue de les
               trouver. */
            if(hs.k==="maison"||hs.k.indexOf("immeuble")===0)
                vg.doors.push(hs);
        }
        if(!vg.doors.length&&vg.houses.length) vg.doors.push(vg.houses[0]);
        var nv=vg.nvil, jpool=jobPool(vg);
        for(k=0;k<nv;k++){
            var sa=rr(0,6.283), sd=rr(0,vg.r*0.98);
            var si2=(rng()*VILSPR.length)|0;
            var fem2=VILSPR[si2].fem;
            /* le metier, son lieu de travail et son histoire, tires une fois
               pour toutes : on peut revenir le voir, il dira la meme chose */
            var jb=jpool[(rng()*jpool.length)|0];
            var js=jobRoll(jb.k);
            vg.villagers.push({x:vg.x+Math.cos(sa)*sd,y:vg.y+Math.sin(sa)*sd,
                tx:vg.x,ty:vg.y,hidden:false,face:1,anim:rr(0,6),wt:rr(0,4),hx:0,hy:0,
                s:si2, fem:fem2, stop:0, inb:false, go:0, night:false,
                clad:1,
                job:jb.k, work:jb.b||null, bio:(rng()*10)|0, foi:ri(0,10),
                home:vg.doors.length?vg.doors[(rng()*vg.doors.length)|0]:null,
                name:(fem2?PRENOM_F[(rng()*PRENOM_F.length)|0]
                          :PRENOM_M[(rng()*PRENOM_M.length)|0])+" "+
                     NOMFAM[(rng()*NOMFAM.length)|0],
                maxhp:100, hp:100, sta:100,
                stats:js.stats, sec:js.sec, sec0:js.sec0, spec:js.spec});
            (function(v9){ v9.maxhp=hpMax(v9); v9.hp=v9.maxhp;
            })(vg.villagers[vg.villagers.length-1]);
            npcLoot(vg.villagers[vg.villagers.length-1],"habitant");
            /* la tenue civile se pose APRES npcLoot : vetWear y remet vet a
               zero, elle serait sinon effacee. Tiree de l'indice de silhouette,
               donc sans le moindre appel a rng. */
            (function(v9){ v9.vet=vilOutfit(v9.s); })(vg.villagers[vg.villagers.length-1]);
        }
    });
    /* ---- L'INDEX DES HUMAINS ----
       On le batit tout de suite parce qu'updShots passe avant updZombies dans
       le tour : sans lui, les balles du premier tour ne trouveraient
       personne. Mais il se batissait trop tot, avant meme que les villageois
       existent : il n'en contenait alors que les gens de metier, et
       l'empreinte du premier tour comptait 82 humains la premiere partie
       contre 228 la suivante, qui heritait de l'index complet de la
       precedente. Deux parties de meme graine ne rendaient pas la meme
       signature. Il se batit donc ici, quand tout le monde est ne. */
    zHumans();

    /* ---- ON INCARNE UN HABITANT ----
       Pas de pseudo : la partie commence dans la peau d'un habitant tire au
       sort sur la carte. On reprend sa place, son nom et sa silhouette, et il
       quitte la foule du bourg. */
    (function(){
        var pool=[], vi9, k9;
        for(vi9=0;vi9<VILLAGES.length;vi9++)
            for(k9=0;k9<VILLAGES[vi9].villagers.length;k9++)
                pool.push({v:VILLAGES[vi9],i:k9});
        if(!pool.length){
            G.p.name=pickName(rng()<0.5); G.p.spr=null;
            return;
        }
        var pk=pool[(rng()*pool.length)|0];
        var me=pk.v.villagers.splice(pk.i,1)[0];
        /* ON COMMENCE TOUJOURS AVEC AU MOINS UN SAC. Meme si le tirage ne lui
           en avait donne aucun, on lui glisse une sacoche : partir les poches
           vides, sans rien ou ranger ce qu'on trouve, n'a pas de sens pour le
           personnage qu'on incarne. */
        if(me.bag===undefined||me.bag<0){
            var gb0=BAGS[0]; me.bag=gb0.id;
            var old0=me.inv||[], ci0=0; me.inv=[];
            while(me.inv.length<gb0.cap){ me.inv.push(old0[ci0]||null); ci0++; }
            me.inv.gw=gb0.bw;
        }
        /* ---- ON COMMENCE DEVANT CHEZ SOI ----
           On demarrait la ou l'habitant se tenait par hasard, souvent au
           milieu d'un pre. On demarre devant sa porte : c'est le seul
           logement du jeu ou l'on ait quelque chose a faire, et il faut
           l'avoir vu pour savoir le retrouver. */
        /* On relie la description de sa maison au RECTANGLE ou l'on entre,
           par les coordonnees : ce sont deux objets distincts et seul le
           second est ce que la porte de [F] designe. Parcours ordonne,
           donc reproductible. */
        G.p.homeB=null;
        if(me.home){
            var br9;
            for(br9=0;br9<BLDRECTS.length;br9++)
                if(Math.abs(BLDRECTS[br9].x-me.home.x)<2&&
                   Math.abs(BLDRECTS[br9].y-me.home.y)<2){
                    G.p.homeB=BLDRECTS[br9]; break; }
        }
        if(!G.p.homeB) G.p.homeB=me.home||null;
        /* ---- ON A LA CLE DE CHEZ SOI ----
           Toutes les maisons de la carte sont fermees, et la sienne l'etait
           avec les autres : il fallait crocheter sa propre porte, et un
           habitant qui ne sait pas ouvrir une serrure - c'est le cas de la
           plupart - restait dehors chez lui. L'ordre de quarantaine devenait
           alors impossible a suivre.
           On enleve la serrure et non le verrou d'entree : bldCanEnter
           laissait deja passer chez soi, le crochetage venait apres. lock est
           remis a lock0 au debut de chaque partie, donc rien ne fuit d'une
           partie sur l'autre. On ne touche PAS a pick, qui n'a pas de valeur
           d'origine a restaurer : sans verrou il n'est jamais lu, et le
           remettre a zero aurait fuit sur la maison d'une autre partie. */
        if(G.p.homeB) G.p.homeB.lock=false;
        G.p.x=me.x; G.p.y=me.y;
        if(G.p.homeB){
            var hb=G.p.homeB, q9, px9, py9, ok9=false;
            for(q9=0;q9<12&&!ok9;q9++){
                px9=hb.x+hb.w/2+rr(-14,14);
                py9=hb.y+hb.h+16+q9*6;
                if(hitObstacle(px9,py9,7)||inSea(px9,py9)) continue;
                ok9=true;
            }
            if(ok9){ G.p.x=px9; G.p.y=py9; }
        }
        G.p.name=me.name;
        G.p.spr=VILSPR[me.s||0];
        G.p.home=pk.v;
        /* ---- ON REPREND SA VIE, PAS SEULEMENT SA PLACE ----
           On heritait de son nom et de sa silhouette, mais on repartait avec
           les competences de tout le monde. On herite maintenant aussi de son
           metier et de ce qu'il savait faire : le fermier commence robuste et
           porteur, l'instituteur fin et sans force, le moniteur de tir avec
           une main sure et rien d'autre. C'est le premier trait de caractere
           que la partie donne, et il n'est pas choisi. */
        G.p.job=me.job||"habitant";
        G.p.bio=me.bio||0;
        G.p.stats=me.stats; G.p.sec=me.sec;
        G.p.sec0=me.sec0||null; G.p.spec=me.spec||null;
        /* on herite aussi de ce qu'il avait sur le dos */
        G.p.vet=me.vet?me.vet.slice():vetInit();
        G.p.clad=me.clad||1;
        /* le corps nu est desormais la base : sans habits on serait en
           sous-vetements. On donne donc une tenue civile de depart, fixe et
           sans tirage, pour tout emplacement encore vide. */
        (function(){
            var st=[[1,"T-shirt gris"],[2,"Jean bleu"],[3,"Tennis blanches"]], q, d;
            for(q=0;q<st.length;q++) if(G.p.vet[st[q][0]]<0){
                d=itemFind(st[q][1]); if(d) vetSet(G.p,d.id);
            }
        })();
        if(!G.p.sec0) statBirth(G.p,0);
        /* vie et souffle se recalculent sur les nouvelles aptitudes */
        G.p.sta=staMax(G.p);
        G.p.maxhp=hpMax(G.p);
        G.p.hp=G.p.maxhp;
        G.cam.x=clamp(G.p.x-CFG.VIEW_W/2,0,CFG.WORLD-CFG.VIEW_W);
        G.cam.y=clamp(G.p.y-CFG.VIEW_H/2,0,CFG.WORLD-CFG.VIEW_H);
        fogReset(); fogReveal(G.p.x,G.p.y);
        logMsg("Vous etes "+me.name+", "+jobName(G.p.job)+" de "+
               (pk.v.name||"ce bourg")+".","jday");
        /* la course ordinaire du jour, tiree sur la carte du moment */
        questGen();
        /* LE MORAL DE DEPART TIENT AU PERSONNAGE : 50 au neutre, plus ou moins
           quinze selon qui l'on est. Tire ici, en toute fin, pour ne pas
           decaler la generation du monde et du bourg qui precede. */
        G.p.moral=50+((rng()*31)|0)-15;
        G.p.maxhp=hpMax(G.p); G.p.hp=G.p.maxhp;
        G.p.sta=staMax(G.p);
    })();
}
function pick(a){ return a[(rng()*a.length)|0]; }
/* ================= L'OBJECTIF DU JOUR =================
   Avant que tout bascule, on avait une vie et une course a faire. La quete du
   jour est cette course : une ou deux etapes ordinaires - passer a la
   superette, retrouver un proche, monter au camp - tirees sur la graine et
   remplies avec de vrais lieux et de vraies gens de la carte du moment. Elle
   n'a aucune portee mecanique : c'est un fil a suivre, qui perd son sens quand
   l'invasion commence. Deterministe (rng a la generation, distances au suivi,
   rien au dessin) ; G.quest repart de zero a chaque partie avec le reste de G. */
function questNear(list){
    var h=G.p.homeB, hx=h?h.x:G.p.x, hy=h?h.y:G.p.y, best=null, bd=1e18, i, o, d;
    for(i=0;i<list.length;i++){ o=list[i]; d=dist2(hx,hy,o.x,o.y); if(d<bd){ bd=d; best=o; } }
    return best;
}
function questBld(kinds){
    var h=G.p.homeB, hx=h?h.x:G.p.x, hy=h?h.y:G.p.y, best=null, bd=1e18, i, b, d;
    for(i=0;i<BLDRECTS.length;i++){ b=BLDRECTS[i];
        if(kinds.indexOf(b.k)<0) continue;
        d=dist2(hx,hy,b.x+b.w/2,b.y+b.h/2);
        if(d<bd){ bd=d; best=b; } }
    return best;
}
function questPerson(){
    var h=G.p.homeB, hx=h?h.x:G.p.x, hy=h?h.y:G.p.y, pool=[], i, v, j, n;
    for(i=0;i<VILLAGES.length;i++){ v=VILLAGES[i];
        if(dist2(v.x,v.y,hx,hy)>1300*1300) continue;
        for(j=0;j<v.villagers.length;j++){ n=v.villagers[j];
            if(n&&!n.dead&&!n.recruited) pool.push(n); } }
    return pool.length?pool[(rng()*pool.length)|0]:null;
}
function placeWord(b){
    if(!b) return "en ville";
    if(b.ens) return b.ens;
    var K={superette:"la superette",droguerie:"la droguerie",medecin:"le cabinet du medecin",
           resto:"le restaurant",bar:"le bar",depot:"le depot",mairie:"la mairie",ecole:"l'ecole"};
    return K[b.k]||("le "+(b.adr||"batiment du bourg"));
}
/* ---- LE LIEN QU'ON RETROUVE ----
   Un ami ou un proche de la famille (enfant, cousin, frere, soeur) reste avec
   vous ; un collegue ou un voisin reprend sa route. C'est ce que dit relKind. */
function relKind(rel){
    if(!rel) return "autre";
    if(rel.indexOf("ami")>=0) return "ami";        /* ami, amie */
    if(rel.indexOf("enfant")>=0||rel.indexOf("cousin")>=0||
       rel.indexOf("frere")>=0||rel.indexOf("soeur")>=0) return "famille";
    return "autre";                                 /* collegue, voisin */
}
/* ---- LES RETROUVAILLES ----
   Composees au moment ou l'on arrive, pour que le ton colle a l'etat du pays
   du moment. Un ami ou un proche finit par "on reste ensemble" : le groupe se
   forme ensuite tout seul (voir questFinishStep). Aucun tirage : pur texte. */
function dReunionLines(n,rel,tier){
    var pn=(G&&G.p&&G.p.name)?String(G.p.name).split(" ")[0]:"toi";
    var fn=(n&&n.name)?String(n.name).split(" ")[0]:"quelqu'un";
    if(relKind(rel)!=="autre"){
        if(tier>=1) return [
            [1,"Ah, "+pn+" ! Tu es la... j'avais tellement peur."],
            [0,"Je ne t'aurais laisse pour rien au monde, "+fn+". Tu n'as rien ?"],
            [1,"Ca va. Mais dehors c'est la panique. On dit que les morts se relevent."],
            [0,"J'ai entendu ces bruits, moi aussi. On reste ensemble, quoi qu'il arrive."],
            [1,"Ensemble. Ou tu vas, je vais."]];
        return [
            [1,"Tiens, "+pn+" ! Ca me fait plaisir de te voir."],
            [0,"Salut "+fn+". Je voulais m'assurer que tu allais bien."],
            [1,"Ca va. Mais il se passe des choses etranges en ville, ces temps-ci."],
            [0,"J'ai entendu des trucs bizarres, moi aussi. On reste ensemble."],
            [1,"D'accord. On ne se quitte plus."]];
    }
    if(tier>=1) return [
        [1,"Oh, "+pn+"... tu as vu ce qui se passe dehors ?"],
        [0,"J'ai vu, "+fn+". Mets-toi a l'abri, ne traine pas."],
        [1,"Toi aussi, fais attention a toi."]];
    return [
        [1,"Tiens, "+pn+" ! Qu'est-ce qui t'amene par ici ?"],
        [0,"Je passais dans le coin, "+fn+". Je prenais de tes nouvelles."],
        [1,"C'est gentil. On se serre les coudes, par les temps qui courent."],
        [0,"Prends soin de toi, "+fn+"."]];
}
function questGen(){
    var p=G.p, steps=[], title="Votre journee";
    var pn=(p.name||"").split(" ")[0]||"toi";
    var RELS=["votre enfant","votre ami","votre amie","votre collegue","votre voisin","votre cousin","votre frere","votre soeur"];
    function rel(){ return RELS[(rng()*RELS.length)|0]; }
    function sBld(b,t,d2,d1){ if(!b) return false; steps.push({kind:"lieu",target:b,x:b.x+b.w/2,y:b.y+b.h+12,label:t,dlg2:d2,dlg1:d1}); return true; }
    function sNear(o,t,d2,d1){ if(!o) return false; steps.push({kind:"lieu",x:o.x,y:o.y,label:t,dlg2:d2,dlg1:d1}); return true; }
    function sPos(x,y,t,d1){ steps.push({kind:"lieu",x:x,y:y,label:t,dlg1:d1}); return true; }
    function sPer(n,t,rl){ if(!n) return false;
        n.qtgt=1; n.qax=n.x; n.qay=n.y; n.qr=64;
        var rk=relKind(rl);
        steps.push({kind:"gens",target:n,label:t,reunion:1,rel:rl,rkind:rk,
                    join:(rk!=="autre")}); return true; }
    /* les dialogues declenches a l'arrivee - anodins, la vie d'avant */
    function dShop(){ return [[1,"Tiens, salut "+pn+" !"],[0,"Bonjour. Je passais dans le coin."],[1,"Fais comme chez toi. On se serre les coudes, ces temps-ci."],[0,"Merci. Prends soin de toi."]]; }
    function dShopSolo(){ return [[0,"Personne a la caisse."],[0,"Je prends ce qu'il me faut, je repasserai payer."],[0,"Voila qui est fait."]]; }
    function dFarm(){ return [[1,"Salut "+pn+" ! Qu'est-ce qui t'amene ?"],[0,"Je faisais un tour par ici."],[1,"Tu tombes bien, il me reste du lait frais."],[0,"Avec plaisir. Merci a toi."]]; }
    function dFarmSolo(){ return [[0,"La ferme est calme, ce matin."],[0,"L'odeur du foin, le vent dans les arbres..."],[0,"Bon. Je ne vais pas trainer toute la journee."]]; }
    function dCampSolo(){ return [[0,"Voila le camp, au bord du bourg."],[0,"D'ici, on voit tout le pays."],[0,"Un endroit ou l'on se sent a l'abri. Pour l'instant."]]; }
    function dRepos(){ return [[0,"Ca fait du bien, ce coin tranquille."],[0,"On oublie, un instant, tout le reste."],[0,"Je repense a des visages, a des gens qui ne sont plus la."],[0,"Allez. La journee n'est pas encore finie."]]; }
    var shop=questBld(["superette","droguerie"]);
    var med=questBld(["medecin","droguerie"]);
    var per=questPerson();
    var farm=(typeof FARMS!=="undefined"&&FARMS.length)?questNear(FARMS):null;
    var camp=(typeof CAMPS!=="undefined"&&CAMPS.length)?questNear(CAMPS):null;
    var pk=(rng()*6)|0;
    if(pk===0&&shop){ title="Les courses du jour"; sBld(shop,"Faire les courses a "+placeWord(shop),dShop(),dShopSolo()); }
    else if(pk===1&&per){ title="Une visite"; var rl1=rel(); sPer(per,"Retrouver "+rl1+" "+per.name,rl1); }
    else if(pk===2&&shop&&per){ title="Une course pour un proche";
        sBld(shop,"Passer a "+placeWord(shop),dShop(),dShopSolo());
        var rl2=rel(); sPer(per,"Puis retrouver "+rl2+" "+per.name,rl2); }
    else if(pk===3&&farm){ title="Un tour a la ferme"; sNear(farm,"Passer a "+(farm.label||"la ferme"),dFarm(),dFarmSolo()); }
    else if(pk===4&&camp){ title="Au camp"; sPos(camp.x,camp.y,"Monter au camp, au bord du bourg",dCampSolo()); }
    else if(pk===5&&med){ title="Un remede"; sBld(med,"Passer prendre un remede a "+placeWord(med),dShop(),dShopSolo()); }
    if(!steps.length){
        if(per){ title="Une visite"; var rl3=rel(); sPer(per,"Retrouver "+rl3+" "+per.name,rl3); }
        else if(shop){ title="Les courses du jour"; sBld(shop,"Faire les courses a "+placeWord(shop),dShop(),dShopSolo()); }
        else { var hh=p.homeB; title="Une journee tranquille";
            if(hh) sPos(hh.x+hh.w/2,hh.y+hh.h+12,"Flaner un peu, puis rentrer chez vous",dRepos());
            else sPos(p.x,p.y,"Profiter de votre journee",dRepos()); } }
    /* LA RECOMPENSE SUIT LA DISTANCE : plus la course mene loin, plus elle
       rapporte (et plus elle coute si la breche la surprend). On mesure le
       chemin depuis chez soi jusqu'au dernier point, et on le ramene entre 5
       et 20 pour cette premiere mission. Reglable par le diviseur. */
    var hb=p.homeB, rcx=hb?hb.x:p.x, rcy=hb?hb.y:p.y, rtot=0, rsi, rst, rsx, rsy;
    for(rsi=0;rsi<steps.length;rsi++){
        rst=steps[rsi];
        rsx=(rst.kind==="gens")?rst.target.x:rst.x;
        rsy=(rst.kind==="gens")?rst.target.y:rst.y;
        rtot+=Math.hypot(rsx-rcx,rsy-rcy); rcx=rsx; rcy=rsy;
    }
    var rew=clamp(Math.round(rtot/60),5,20);
    G.quest={title:title, steps:steps, i:0, done:false, reward:rew};
}
function questIntroText(){
    var q=G.quest, i, h, s, tx, ty, cap, p=G&&G.p;
    if(!q||!q.steps.length) return "Une journee comme les autres commence.";
    h="<b>"+q.title+"</b>";
    if(q.reward!==undefined)
        h+=" <span style='color:#7fbf7f'>(+"+q.reward+" moral si reussie, -"+
            q.reward+" sinon)</span>";
    /* le cap de chaque etape - un cap, jamais une coordonnee - enchaine
       depuis chez soi comme le calcul de la recompense */
    var hb=p&&p.homeB, cx=hb?hb.x:(p?p.x:0), cy=hb?hb.y:(p?p.y:0);
    for(i=0;i<q.steps.length;i++){ s=q.steps[i];
        tx=(s.x!==undefined)?s.x:(s.target?s.target.x:cx);
        ty=(s.y!==undefined)?s.y:(s.target?s.target.y:cy);
        cap=dirWord(cx,cy,tx,ty);
        h+="<br>- "+s.label+" <span style='color:#c8a860'>("+cap+")</span>";
        cx=tx; cy=ty;
    }
    return h;
}
/* DEMANDER SON CHEMIN. On ne pose pas de boussole a l'ecran : on demande la
   route a quelqu'un. questAsk regarde l'etape en cours de l'objectif du jour
   et en tire la question a poser - une personne par son prenom, un commerce
   par son enseigne, ou a defaut un lieu sans nom - avec le point a viser.
   Rend null quand il n'y a plus d'objectif : la question disparait alors du
   menu. */
function questAsk(){
    var q=G&&G.quest; if(!q||q.done) return null;
    var s=q.steps&&q.steps[q.i]; if(!s) return null;
    var r={x:0,y:0,place:null,who:null,qtxt:""};
    if(s.kind==="gens"){
        var n=s.target;
        if(!n||n.dead||n.gone) return null;
        var nm=(n.name?n.name.split(" ")[0]:"quelqu'un");
        r.x=n.x; r.y=n.y; r.place=nm; r.who=n;
        r.qtxt="Savez-vous ou est "+nm+" ?";
    } else {
        r.x=s.x; r.y=s.y;
        if(s.target){ r.place=placeWord(s.target); r.qtxt="Ou est "+r.place+", savez-vous ?"; }
        else { r.qtxt="Ou je dois aller ? Vous connaissez la direction ?"; }
    }
    return r;
}
function capPhrase(s){ return s?(s.charAt(0).toUpperCase()+s.slice(1)):s; }
/* l'interlocuteur sur place : le plus proche vivant libre a portee */
function nearestTalk(x,y,rad){
    var best=null, bd=rad*rad, i, v, j, n, d;
    for(i=0;i<VILLAGES.length;i++){ v=VILLAGES[i];
        for(j=0;j<v.villagers.length;j++){ n=v.villagers[j];
            if(!n||n.dead||n.gone||n.recruited||n.inb||n.hidden||n.chat) continue;
            d=dist2(x,y,n.x,n.y); if(d<bd){ bd=d; best=n; } } }
    return best;
}
/* on ouvre le dialogue de l'etape : le joueur en est le premier interlocuteur
   (index 0), l'habitant sur place le second (index 1), ou personne pour un
   monologue. La bulle sort au-dessus de celui qui parle, une a la fois. */
function questChatStart(s,interloc){
    /* les retrouvailles se composent ici, au moment ou l'on arrive, pour que
       le ton colle a l'etat du pays du moment - et non a celui du matin */
    var lines=(s.reunion&&interloc)?dReunionLines(interloc,s.rel,plagueTier())
                                   :(interloc?s.dlg2:s.dlg1);
    if(!lines||!lines.length){ questFinishStep(s); return; }
    var people=interloc?[G.p,interloc]:[G.p];
    var ch={people:people, lines:lines, li:0, spk:lines[0][0], t:CHAT_LINE, quest:1, qstep:s};
    if(interloc){ interloc.chat=ch; interloc.face=(G.p.x<interloc.x)?-1:1; }
    s.dlgOn=1;
    CHATS.push(ch);
}
function questFinishStep(s){
    s.done=1; s.dlgOn=0;
    var q=G.quest; if(!q) return;
    /* UN AMI OU UN PROCHE RETROUVE RESTE AVEC VOUS. La scene s'acheve sur "on
       reste ensemble", et le groupe se forme de lui-meme - sans avoir a le lui
       demander. Meme init que le recrutement ordinaire. */
    if(s.join&&s.target&&!s.target.dead&&!s.target.recruited){
        var jn=s.target;
        jn.recruited=1; jn.out=BASE?(baseHere()?0:1):1;
        jn.qtgt=0; jn.chat=null;
        logMsg((jn.name||"Un proche")+" reste avec vous desormais.","jsay");
        notice(String(jn.name||"UN PROCHE").toUpperCase()+" VOUS REJOINT");
    }
    q.i++;
    if(q.i>=q.steps.length){ q.done=true;
        var rew=q.reward||10;
        moralAdd(rew);
        notice("OBJECTIF DU JOUR ATTEINT");
        logMsg("Vous avez fait ce que vous aviez a faire aujourd'hui.","jday"); }
    else notice("ETAPE SUIVANTE");
}
function questTick(dt){
    var q=G&&G.quest; if(!q||q.done) return;
    var s=q.steps[q.i]; if(!s||s.dlgOn) return;   /* pendant le dialogue, on attend */
    var tx, ty, r, interloc=null;
    if(s.kind==="gens"){
        var n=s.target;
        if(!n||n.dead||n.gone){ q.done=true; return; }
        if(n.chat) return;                 /* il parle deja : on attend qu'il soit libre */
        tx=n.x; ty=n.y; r=44; interloc=n;
    } else { tx=s.x; ty=s.y; r=52; }
    if(dist2(G.p.x,G.p.y,tx,ty)<r*r){
        if(s.kind!=="gens") interloc=nearestTalk(tx,ty,74);
        questChatStart(s,interloc);
    }
}

/* force : la nappe qui brule ronge par demi-secondes et passe outre la
   Vigueur, qui n'est la que pour les coups portes. */
/* LE JOUEUR EST UN PNJ COMME UN AUTRE, ET QU'ON JOUE. Il n'a plus sa propre
   fonction de blessure : celle-ci n'est qu'une porte d'entree gardee pour les
   appelants d'avant, et tout se passe dans hurt. Deux fonctions de degats,
   c'etaient deux jeux d'equilibrage : l'un avec la Vigueur, l'autre sans. */
function hurtPlayer(raw,force,byZ,byNpc){
    hurt(G.p,raw,0,byZ,byNpc,force);
}


/* ================= SPAWN ================= */
/* --- Horloge du monde : un cycle = CFG.CYCLE s, jour puis nuit.
   Le cycle demarre en plein jour ; le compteur de jours s'incremente
   a la fin de l'aube, donc au debut du cycle suivant. --- */
function dayNum(){ return Math.floor(G.t/CFG.CYCLE)+1; }
function cycleT(){ return G.t-Math.floor(G.t/CFG.CYCLE)*CFG.CYCLE; }
/* dayLock : 0 = cycle normal, 1 = jour fixe, 2 = nuit fixe (debug) */
function isNight(){
    if(DBG.dayLock===1) return false;
    if(DBG.dayLock===2) return true;
    return cycleT()>=CFG.DAY_LEN;
}
/* Force de la lumiere orangee : nulle en plein jour et en pleine nuit,
   maximale au milieu du crepuscule et de l'aube. */
function twilight(){
    if(DBG.dayLock) return 0;
    var c=cycleT(), f;
    if(c>=CFG.DAY_LEN-CFG.DUSK&&c<CFG.DAY_LEN){
        f=(c-(CFG.DAY_LEN-CFG.DUSK))/CFG.DUSK;
        return 1-Math.abs(f-0.5)*2;
    }
    if(c>=CFG.CYCLE-CFG.DAWN){
        f=(c-(CFG.CYCLE-CFG.DAWN))/CFG.DAWN;
        return 1-Math.abs(f-0.5)*2;
    }
    return 0;
}
/* alias conserve : les modules encore indexes sur la vague suivent le jour */
function waveNum(){ return dayNum(); }
/* Noirceur visee de l'ecran : nulle le jour, pleine la nuit, interpolee sur
   le crepuscule et sur l'aube. */
function darkTarget(){
    var c=cycleT(), a=CFG.DARK_DAY, b=CFG.DARK_NIGHT;
    if(DBG.dayLock===1) return a;
    if(DBG.dayLock===2) return b;
    if(c<CFG.DAY_LEN-CFG.DUSK) return a;
    if(c<CFG.DAY_LEN) return a+(b-a)*((c-(CFG.DAY_LEN-CFG.DUSK))/CFG.DUSK);
    if(c<CFG.CYCLE-CFG.DAWN) return b;
    return b+(a-b)*((c-(CFG.CYCLE-CFG.DAWN))/CFG.DAWN);
}
function notice(msg){
    /* on empile : chaque message se pose sous les precedents encore a l'ecran,
       puis l'ensemble remonte doucement en s'effacant */
    var n=0, q;
    if(G&&G.fx) for(q=0;q<G.fx.length;q++) if(G.fx[q].k==="notice") n++;
    G.fx.push({k:"notice",msg:msg,t:2.5,slot:n});
}

/* ================= INPUT ================= */
/* Ctrl et Maj pilotent l'allure. Un keyup peut se perdre quand le navigateur
   prend le focus sur un raccourci : on resynchronise a chaque evenement. */
function syncMods(e){
    if(!e.ctrlKey){ keys.ControlLeft=false; keys.ControlRight=false; }
    if(!e.shiftKey){ keys.ShiftLeft=false; keys.ShiftRight=false; }
}
addEventListener("blur",function(){ keys={}; });
addEventListener("keydown",function(e){
    keys[e.code]=true;
    syncMods(e);
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","Tab",
        "ControlLeft","ControlRight"].indexOf(e.code)>=0) e.preventDefault();
    audio();
    if(e.code==="KeyI"&&state==="play"){
        if(G&&G.trade) tradeClose(); else bagToggle();
    }
    if(e.code==="Escape"&&state==="play"&&G&&depOn()){ depClose(); return; }
    if(e.code==="Escape"&&state==="play"&&G&&G.trade) tradeClose();
    if(e.code==="Escape"&&state==="play"&&mapOpen) mapToggle();
    if(e.code==="KeyF"&&state==="play") pushAct("act",0);
    if(e.code==="Tab"&&state==="play"&&G&&!G.talk&&!G.inside&&!G.trade&&
       !G.eqn&&!G.pick&&!G.loot) pushAct("team",0);
    /* [A] se sert du soin retenu, [E] lance ce qui est sur l'acces rapide.
       Sur un clavier francais, ce sont bien les touches A et E : le code
       KeyQ designe la touche A, et KeyE la touche E. */
    if(e.code==="KeyQ"&&state==="play"&&!e.repeat) pushAct("soin",0);
    if(e.code==="KeyE"&&state==="play"&&!e.repeat&&G&&!G.showBag&&!G.trade){
        var jo=itemById(quickId(1));
        if(jo){
            var jd=Math.max(jo.pmin,Math.min(jo.por,AIMD||jo.por));
            var jq=Math.round((jd-jo.pmin)/Math.max(1,jo.por-jo.pmin)*255);
            pushAct("jet",(aimQuant()<<8)|(jq&255));
        }
    }
    /* ---- CHOISIR SANS CESSER DE MARCHER ----
       Q et D faisaient defiler la liste, et liveMask() leur retirait pour
       cela le deplacement : des qu'une porte et un passant s'offraient
       ensemble, on ne pouvait plus aller ni a gauche ni a droite. Le remede
       coutait plus cher que le mal. Trois moyens desormais, et aucun ne
       touche aux jambes : la molette, qui faisait deja le travail ; le clic
       sur la ligne voulue ; et Tab, qui n'avait aucun emploi et que la page
       neutralisait deja. */
    if(e.code==="Tab"&&state==="play"&&G&&!e.repeat&&G.acts&&G.acts.length>1&&
       !G.showBag&&!G.trade&&!G.inside&&!G.pick&&!G.talk){
        e.preventDefault();
        pushAct("cyc",e.shiftKey?-1:1);
    }
    /* provisoire : tant qu'aucune arme ne s'equipe, [V] met une arme en main
       pour montrer le cercle de visee. A brancher sur l'equipement reel. */
    if(e.code==="KeyV"&&state==="play") pushAct("arme",0);
    if(e.code==="KeyS"&&state==="play"&&G&&(G.inside||G.pick||G.loot)) pushAct("out",0);
    /* on quitte une conversation comme on quitte un batiment */
    if(e.code==="KeyS"&&state==="play"&&G&&G.talk&&!G.inside&&!G.pick&&!G.loot)
        pushAct("bye",0);
    if(e.code==="Escape"&&state==="play"&&G&&G.talk) pushAct("bye",0);
    if(state==="play"&&G&&e.code.indexOf("Digit")===0){
        var dg=e.code.charCodeAt(5)-48;
        /* en conversation les chiffres repondent, sinon ils changent d'arme */
        if(G.talk){ if(dg>=1&&dg<=3) pushAct("choice",dg); }
        else if(dg>=1&&dg<=4) pushAct("main",dg-1);
    }
    /* Dedans, [M] ouvre le plan du lieu ; dehors, la carte du monde. La
       carte du monde ne dit rien quand on est dans une piece, et [B] a deja
       ce double usage depuis la v16. */
    if(e.code==="KeyM"&&state==="play"){
        if(G&&G.inside) planToggle(); else mapToggle();
    }
    if(state==="play"&&PLANON&&(e.code==="ArrowUp"||e.code==="ArrowDown")){
        e.preventDefault();
        planFlip(e.code==="ArrowUp"?1:-1);
    }
    if(e.code==="KeyK"){
        DBG.dayLock=(DBG.dayLock+1)%3;
        if(G){ G.night=isNight(); G.darkNow=G.darkTgt=darkTarget();
            notice(["CYCLE AUTO","JOUR FIXE","NUIT FIXE"][DBG.dayLock]); }
    }
    if(e.code==="KeyN"){ muted=!muted; }
    if(e.code==="KeyP"){ if(state==="play") showPause(); else if(state==="pause") resumePlay(); }
    if(G&&e.code==="KeyT") zoomI=(zoomI+1)%ZOOMS.length;
    if(G&&e.code==="KeyX"&&!RANKED) G.turbo=!G.turbo;
    if(e.code==="KeyB"&&state==="play") pushAct("mode",0);
    if(e.code==="KeyR"&&state==="play") pushAct("rech",0);
    if(e.code==="KeyL") lightsOn=!lightsOn;
    if(e.code==="F1"){ e.preventDefault(); aimDbgToggle(); }
    if(e.code==="F2"){ e.preventDefault(); zDbgToggle(); }
    if(e.code==="F3"&&state==="play"&&G){ e.preventDefault(); gndSpawnAll(); }
});
addEventListener("keyup",function(e){ keys[e.code]=false; syncMods(e); });

