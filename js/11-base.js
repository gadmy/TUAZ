"use strict";
/* ================================================================
   TUAZ - 11-base.js
   La base : son installation, les missions, le moral du groupe et ce
   qu'on y batit.
   (lignes 12364 a 13210 du mono-fichier d'origine)
   ================================================================ */
/* ================= LA BASE =================
   Un toit a soi. Tant que le pays tient, personne n'en veut : on ne
   s'installe pas quand on peut encore rentrer chez soi. Ce n'est qu'au
   dernier etat du monde, quand plus personne ne doute, que l'on peut entrer
   dans un batiment et le declarer sien avec [B].

   Ce qu'elle apporte tient en quatre choses, et une seule est ecrite ici :
   le stock. Le soin, le tir depuis les fenetres et les ameliorations
   viendront chacun a leur tour.

   LA CAPACITE suit la surface au sol : une tour de guet garde huit places,
   une maison vingt, un depot cinquante. C'est la seule facon d'avoir une
   raison de preferer un batiment a un autre. */
var BASE=null, BASE_MIN=8, BASE_MAX=60;
function baseCap(b){
    if(!b) return 0;
    return Math.max(BASE_MIN,Math.min(BASE_MAX,Math.round(b.w*b.h/85)));
}
function baseCan(){ return plagueTier()>=2; }
function baseDeclare(b){
    if(!b) return false;
    if(!baseCan()){
        notice("PAS ENCORE");
        logMsg("S'installer ? Pas tant qu'il reste un endroit ou rentrer. "+
               "Quand le pays aura vraiment bascule, peut-etre.","jday");
        return false;
    }
    if(BASE&&BASE.b===b){
        logMsg("C'est deja chez vous.","jday");
        return false;
    }
    var anc=BASE, cap=Math.ceil(baseCap(b)/5)*5, inv=[], i;
    inv.gw=5;
    for(i=0;i<cap;i++) inv.push(null);
    /* on demenage : ce qui etait entrepose suit, dans la limite du nouveau
       toit. Ce qui ne rentre pas reste sur place - on ne perd rien sans le
       savoir, on le retrouvera en revenant. */
    if(anc&&anc.inv){
        /* ce n'est plus une recopie case a case : chaque chose doit retrouver
           un endroit ou sa FORME rentre, et ce qui ne rentre pas reste sur
           place au lieu d'etre ecrase */
        for(i=0;i<anc.inv.length;i++){
            var mc=anc.inv[i];
            if(!mc||cellIsRef(mc)) continue;
            if(gridAdd(inv,mc)) gridTake(anc.inv,i);
        }
    }
    /* jauge, alerte, assaut et nb : tout ce que l'assaut ecrit naît ici a
       zero. Un champ pose en cours de partie et non remis a plat rendrait
       deux rejeus divergents des le premier demenagement. */
    BASE={b:b, inv:inv, cap:cap, cap0:cap, day:dayNum(),
          jauge:0, dit:0, alerte:0, assaut:0, nb:0,
          hord0:0, hordIn:0, cacK:0, cacHit:0, cacDit:0,
          dette:0, casse:""};
    logMsg("Vous vous installez : "+(bldLabel(b)||"ce batiment")+" est votre base. "+
           cap+" places de rangement.","jsay");
    notice("BASE ETABLIE");
    return true;
}
function baseHere(){ return !!(BASE&&G.inside&&G.inside===BASE.b); }
/* ================= LES MISSIONS =================
   Quand on est cinq a tenir un toit, on cesse de sortir tous ensemble : on
   envoie. Un compagnon part seul pour vingt-quatre heures chercher une chose
   precise et revient la deposer sur les rayonnages.

   Il ne se joue pas, il se raconte. Toutes les MISS_TICK secondes il lui
   arrive quelque chose ou non : sa Discretion decide s'il passe inapercu, son
   Combat s'il s'en sort quand il ne passe pas. Deux motifs le font rentrer
   avant l'heure, et deux seulement : etre blesse a plus de la moitie, ou
   avoir ete mordu. Dans les deux cas il revient avec ce qu'il avait deja.

   MISS_MIN est le nombre qu'il faut etre pour que l'onglet s'ouvre : a
   quatre on est une bande, a cinq on est une maison. */
var MISS_MIN=5, MISS_DUR=300, MISS_TICK=10;
/* ---- CE QU'ON OSE DEMANDER A QUI ----
   Le rang d'attachement se gagnait et ne servait a rien. Il commande
   desormais la seule chose qui compte : ce qu'on peut envoyer chercher.
   On confie des planches a n'importe qui. On n'envoie pas une recrue de la
   veille chercher des armes - elle ne reviendrait pas, ou pas avec.
   Un cran par rang, dans l'ordre de ce que ca coute de confiance. */
var MISS_KINDS=[
 {k:"arme", n:"Des armes",       rk:4, d:"armurerie, caserne, ce qui se trouve encore"},
 {k:"med",  n:"Des medicaments", rk:3, d:"pharmacies et cabinets, ce qu'il en reste"},
 {k:"mun",  n:"Des munitions",   rk:2, d:"stands, armureries, poches de soldats"},
 {k:"viv",  n:"Des vivres",      rk:1, d:"superettes, cuisines, reserves oubliees"},
 {k:"obj",  n:"Des materiaux",   rk:0, d:"hangars, ateliers, maisons vides"}
];
function missOpen(){ return !!BASE&&grpList().length>=MISS_MIN; }
function missAway(){
    var L=grpList(), R=[], i;
    for(i=0;i<L.length;i++) if(L[i].miss) R.push(L[i]);
    return R;
}
function missSend(n,k){
    if(!n||!n.recruited||n.miss) return false;
    if(!missOpen()){ notice("PAS ENCORE"); return false; }
    /* Seul, on ne part pas diminue. La difference avec le depart en equipe
       n'est pas un caprice : avec vous, un blesse est couvert, et c'est votre
       affaire de le risquer. Seul dans la nature, personne ne le releve - il
       ferait demi-tour au premier incident. Le jeu refuse donc de l'envoyer
       plutot que de faire semblant. */
    if(n.hp<n.maxhp*0.5){ notice("TROP MAL EN POINT POUR PARTIR SEUL"); return false; }
    /* Le rang commande ce qu'on ose lui confier. */
    if(!missAllowed(n,k)){ notice("PAS ASSEZ PROCHE POUR CA"); return false; }
    n.miss={k:k, t:0, tick:0, sac:0, mordu:0};
    n.away=1;
    logMsg(n.name+" part chercher "+
           (missKind(k)?missKind(k).n.toLowerCase():"quelque chose")+".","jsay");
    return true;
}
/* ---- LE RAPPEL ----
   Une fois parti, on le regardait partir : rien ne le faisait rentrer que le
   sang ou la morsure, et les deux etaient decides par le jeu. Le cas qui
   manquait est celui-la - la jauge de bruit monte, un assaut se prepare, et
   vos deux meilleurs fusils sont en course pour la journee.
   IL FAUT LES DEUX BOUTS. Une radio a un seul bout n'en est pas une : le
   POSTE RADIO doit etre b\u00e2ti a la base - dixieme amelioration, une case, une
   seule, on parle ou l'on ne parle pas - et le TALKIE-WALKIE doit etre sur
   lui. L'objet existait depuis la v14 comme matiere premiere a fondre, neuf
   de materiau et rien d'autre ; il devient la condition d'une prise sur les
   absents. Sans l'un ou sans l'autre on ne le joint pas, et le panneau le
   dit avant le depart, pas apres - c'est le meme principe que missArm, qui
   montre s'il part arme plutot que de l'apprendre en le voyant rentrer en
   sang.
   LE POSTE HORS SERVICE SE TAIT, sans qu'on ait rien eu a ecrire : builtN
   rend zero pour une amelioration degradee, donc laisser la base tomber en
   ruine coupe la radio comme elle eteint tout le reste.
   IL NE SE TELEPORTE PAS. Le rappel pose un drapeau ; c'est updMiss qui le
   ramene, au prochain battement de MISS_TICK et pas avant, incident du
   chemin compris. On peut donc le rappeler trop tard, et c'est bien ainsi.
   ET LE RAPPEL N'EST PAS UN ECHEC : missBack retire quatre points de moral
   quand on rentre blesse ou mordu, il n'en retire aucun quand on rentre sur
   ordre. Obeir n'a pas a couter. */
function baseRadio(){ return builtN("radio")>0; }
function missRadio(n){
    var it=itemFind("Talkie-walkie"), i, c;
    if(!it||!n||!n.inv) return false;
    for(i=0;i<n.inv.length;i++){
        c=n.inv[i];
        if(c&&c.i===it.id&&(c.q|0)>0) return true;
    }
    return false;
}
function missRecall(n){
    if(!n||!n.miss) return false;
    if(n.miss.rec) return false;
    if(!baseRadio()){ notice("PAS DE POSTE RADIO A LA BASE"); return false; }
    if(!missRadio(n)){ notice("VOUS NE POUVEZ PAS LE JOINDRE"); return false; }
    n.miss.rec=1;
    logMsg("Vous appelez "+n.name+" a la radio. Il fait demi-tour.","jsay");
    return true;
}
function missKind(k){
    var i;
    for(i=0;i<MISS_KINDS.length;i++) if(MISS_KINDS[i].k===k) return MISS_KINDS[i];
    return null;
}
/* Ce qu'un compagnon a le droit d'aller chercher, selon ce qu'il vous doit. */
function missAllowed(n,k){
    var K=(typeof k==="string")?missKind(k):k;
    if(!K) return false;
    return grpRankI(n)>=(K.rk||0);
}
/* ---- CE QU'IL EMPORTE ----
   Le rang disait ce qu'on ose lui demander, et rien d'autre ne parlait :
   un compagnon arme jusqu'aux dents partait exactement comme un compagnon
   nu. Ses aptitudes decidaient de tout et son equipement de rien, ce qui
   rendait la table a deux decorative des qu'on l'employait a autre chose
   qu'a s'habiller.

   ATTENTION, LE RANG RESTE UN ACCES ET NON UNE PRIME. Rien de ce qui suit
   ne le touche : missAllowed est la seule porte, et elle ne s'ouvre qu'au
   rang. Ce qui suit ne change que la facon dont la course se passe une fois
   qu'elle est autorisee.

   TROIS CANAUX, ET AUCUN N'EST NEUF. Ce qu'il porte pese sur son bras -
   arme a feu ravitaillee, arme a feu a sec, corps a corps, rien du tout -
   ce qui le protege des mauvaises rencontres ; ce qu'il porte sur le dos
   borne ce qu'il peut rapporter, par ownCarry qui existe depuis la v18 ; et
   ce qu'il porte sur lui donne deja des points d'aptitude, donc joue par
   statEff sans qu'on ait rien a ecrire. Pas de quatrieme voie. */
function missArm(n){
    var w=npcWeapon(n), sl, q, c, m;
    if(w){
        /* a-t-il de quoi s'en servir ? une arme sans cartouche est un baton
           qu'on a paye cher */
        if(!w.mag) return 1;
        sl=wSlot(w);
        m=(n.mag&&n.mag[sl])|0;
        if(!m&&n.loose) m=n.loose[w.am]|0;
        if(m>0) return 1;
        return 0.45;
    }
    /* le corps a corps : mieux que les mains nues, moins qu'un fusil */
    if(n.slots) for(q=1;q<4;q++) if(n.slots[q]) return 0.45;
    if(n.inv) for(q=0;q<n.inv.length;q++){
        c=n.inv[q];
        if(c&&c.w!==undefined) return 0.45;
    }
    return 0;
}
/* La place qu'il lui reste sur le dos, en parts de sa propre capacite. Un
   compagnon deja charge a ras bord ne rapportera pas grand-chose de plus :
   c'est ce qui donne une raison de le decharger avant de l'envoyer. */
function missRoom(n){
    var c=ownCarry(n);
    if(c<=0) return 0;
    return Math.max(0,Math.min(1,1-ownWeight(n)/c));
}
/* Ce qu'il rapporte : sa Fouille commande le rendement, comme partout, et
   la place qu'il a sur le dos le borne. Parti le sac plein, il revient le
   sac plein. */
function missYield(n){
    return (0.5+statEff(n,"astuce","fouille")/100)*(0.35+0.65*missRoom(n));
}
/* Le retour : on verse sur les rayonnages ce qu'il a ramasse. Ce qui ne
   rentre pas reste dans son sac, et il le garde sur lui. */
function missBack(n,cause){
    var M=n.miss, i, id, mis=0;
    if(!M) return;
    n.miss=null; n.away=0;
    var q=Math.max(0,Math.round(M.sac));
    for(i=0;i<q;i++){
        id=missPick(M.k);
        /* Attention au codage : une arme se note par un nombre NEGATIF, et
           -1 seul veut dire "rien trouve". Tester id<0 renvoyait donc toute
           course aux armes les mains vides. */
        if(id===-1||id===undefined) break;
        if(!baseStore(id)) { mis++; }
    }
    if(M.mordu&&!n.mal){ n.mal=1; }
    logMsg(n.name+" est rentre"+
        ((cause==="blesse")?" en sang, avant l'heure":
         ((cause==="mordu")?" mordu, avant l'heure":
          ((cause==="rappel")?" sur votre appel, avant l'heure":"")))+
        " avec "+q+" chose"+(q>1?"s":"")+
        (mis?(" - "+mis+" n'ont pas trouve de place"):"")+".","jsay");
    if(cause==="rappel") return;
    if(cause) morMove(-4); else morMove(2);
}
/* Les armes qu'une mission peut rapporter : toutes, SAUF les pieces uniques.
   Il n'y en a qu'une par carte et elle est deja sur quelqu'un - la voir
   revenir dans le sac d'un compagnon la rendrait ordinaire. La liste se
   calcule AU PREMIER BESOIN et non au chargement : WEAPONS est declaree
   quatre mille lignes plus bas, et la lire ici tuait le script entier.
   Le tirage consomme toujours exactement un nombre du flux : filtrer a la
   volee aurait decale la simulation. */
var WMISS=null;
function missPool(){
    var i;
    if(!WMISS){
        WMISS=[];
        for(i=0;i<WEAPONS.length;i++) if(!WEAPONS[i].uniq) WMISS.push(i);
    }
    return WMISS;
}
function missPick(k){
    if(k==="arme"){
        var P=missPool(), w=P[(rng()*P.length)|0];
        return -2-w;   /* code negatif : c'est une arme */
    }
    return pickKindId(k,null);
}
function baseStore(id){
    var i;
    if(!BASE) return false;
    for(i=0;i<BASE.inv.length;i++) if(!BASE.inv[i]) break;
    if(i>=BASE.inv.length) return false;
    if(id<=-2) BASE.inv[i]={w:(-2-id),q:1};
    else if(id>=0) BASE.inv[i]={i:id,q:1};
    else return false;
    return true;
}
/* Le tour des absents. */
function updMiss(dt){
    var L=missAway(), i, n, M, e, r;
    for(i=0;i<L.length;i++){
        n=L[i]; M=n.miss;
        M.t+=dt; M.tick+=dt;
        if(M.tick<MISS_TICK){
            if(M.t>=MISS_DUR) missBack(n,null);
            continue;
        }
        M.tick-=MISS_TICK;
        /* il fouille : ce qu'il ramasse tombe a chaque tour */
        M.sac+=missYield(n)*(0.5+rng()*0.7);
        /* et il lui arrive quelque chose, ou non */
        var arm=missArm(n);
        e=statEff(n,"astuce","discretion");
        if(rng()<0.30*(1.4-e/100)){
            /* Il est tombe dessus : son Combat decide de ce qu'il prend, et
               ce qu'il a dans les mains aussi. Nu, il encaisse moitie plus ;
               arme et ravitaille, un tiers de moins. */
            var c=statEff(n,"combat","vigueur");
            var dg=rr(4,18)*(1.3-c/140)*(1.5-0.5*arm);
            n.hp=Math.max(1,n.hp-dg);
            if(rng()<0.18*(1.4-statEff(n,"combat","parade")/100)*(1.4-0.6*arm))
                M.mordu=1;
        }
        if(M.mordu){ missBack(n,"mordu"); continue; }
        if(n.hp<n.maxhp*0.5){ missBack(n,"blesse"); continue; }
        if(M.rec){ missBack(n,"rappel"); continue; }
        if(M.t>=MISS_DUR) missBack(n,null);
    }
}
/* ================= LE MORAL =================
   Il est global : il n'y a pas dix humeurs, il y en a une, celle de la base,
   et tout le monde la partage. Cinq crans. Le cran du milieu ne donne rien
   ni ne retire rien - c'est l'ordinaire, et c'est la que l'on commence.
   Au-dessus on va mieux, en dessous on va moins bien.

   Il monte avec ce qu'on batit et descend avec ce qui manque. Une journee
   sans manger coute cher, une journee sans soigner les blesses aussi. */
var MOR_MAX=100, MOR_START=50;
var MOR_TIERS=[{s:0, n:"desespere", b:-0.16},
               {s:20,n:"morose",    b:-0.08},
               {s:40,n:"ordinaire", b:0},
               {s:65,n:"bon",       b:0.08},
               {s:85,n:"excellent", b:0.16}];
function morale(){ return BASE?(BASE.mor===undefined?MOR_START:BASE.mor):MOR_START; }
function morTier(){
    var m=morale(), r=MOR_TIERS[0], i;
    for(i=0;i<MOR_TIERS.length;i++) if(m>=MOR_TIERS[i].s) r=MOR_TIERS[i];
    return r;
}
/* Le coefficient que le moral applique a ce que le groupe fait de ses mains :
   les degats donnes et le souffle depense. Zero au cran du milieu. */
function morBonus(){ return BASE?morTier().b:0; }
function morMove(v){
    if(!BASE) return;
    BASE.mor=Math.max(0,Math.min(MOR_MAX,(BASE.mor===undefined?MOR_START:BASE.mor)+v));
    /* le moral est partage : les occupants voient leur plafond de vie et de
       souffle bouger avec celui de la base, on reclampe donc leur courant */
    morClampGroup();
}
function morClampGroup(){
    var i, n, h, s;
    if(G&&G.p){ h=hpMax(G.p); if(G.p.hp>h) G.p.hp=h; s=staMax(G.p); if(G.p.sta>s) G.p.sta=s; }
    var L=(typeof grpList==="function")?grpList():null;
    if(L) for(i=0;i<L.length;i++){ n=L[i]; if(!n) continue;
        h=hpMax(n); if(n.hp>h) n.hp=h; s=staMax(n); if(n.sta>s) n.sta=s; }
}
/* ================= CE QU'ON BATIT =================
   Une amelioration n'est plus une chose qu'on a ou qu'on n'a pas : elle
   occupe un nombre de CASES dans une PIECE du plan, et son ampleur suit.
   Un coin cuisine tient sur une case, une cantine pour vingt en demande
   quatre. Plusieurs cohabitent dans une piece s'il reste des cases.

   ELLE NE MANGE PLUS DE RANGEMENT. Le champ pl a disparu : le stock et le
   bati ne se disputent plus la meme ressource. C'est la reserve, neuvieme
   amelioration, qui rend des places - et elle est la seule sans plafond,
   parce qu'elle absorbe les cases en trop d'un grand batiment.

   VINGT-CINQ CASES SUFFISENT A TOUT BATIR AU MAXIMUM, reserve exclue. C'est
   l'echelle a garder en tete : une maison en a onze, une caserne
   trente-huit, un immeuble cent vingt-trois.

   mat : la matiere premiere par case
   mn  : le minimum de cases, mx : le maximum (0 = sans plafond)
   mo  : ce qu'elle rend au moral chaque jour, par case
   br  : ce qu'elle ajoute au bruit de la base, par case, en plus ou en
         moins. Un atelier tape, une salle de sport laisse tomber de la
         fonte ; une bibliotheque tient tout le monde dedans et silencieux,
         et le poste de guet permet d'aller au-devant de ce qui rode avant
         que ca ne s'attroupe. Absent vaut zero : un dortoir, une infirmerie
         et des etageres ne font pas de bruit.
   t   : le nom qu'elle porte selon sa taille */
var BUILDS=[
 {k:"dortoir",     n:"Dortoir",       mat:22, mn:1, mx:5, mo:0.6,
  t:["Deux couchages","Dortoir","Grand dortoir","Dortoir de douze",
     "Dortoir de quinze"],
  d:"Trois couchages par case, et une journee de repos de moins pour guerir "+
    "d'une fievre. Qui dort a meme le sol le paie au moral."},
 {k:"cuisine",     n:"Cuisine",       mat:28, mn:1, mx:4, mo:0.7, br:1,
  t:["Coin cuisine","Cuisine","Grande cuisine","Cantine"],
  d:"Une vraie cuisine tire plus d'une conserve : une ration de moins a "+
    "trouver chaque jour, par case. Elle s'entend un peu."},
 {k:"infirmerie",  mat:42, n:"Infirmerie", mn:1, mx:3, mo:0.7,
  t:["Trousse","Poste de soins","Infirmerie"],
  d:"De quoi soigner proprement : un blesse soigne sans medicament par "+
    "case."},
 {k:"sport",       n:"Salle de sport",mat:26, mn:2, mx:4, mo:0.4, br:2,
  t:["","Salle de sport","Grande salle","Gymnase"],
  d:"De la fonte et un tapis. Un dixieme de progression en plus par case, "+
    "pour tout le monde. Ca tombe et ca resonne : elle s'entend de loin."},
 {k:"biblio",      n:"Bibliotheque",  mat:24, mn:1, mx:2, mo:1.6, br:-1,
  t:["Rayonnage","Bibliotheque"],
  d:"Des livres, du silence, et quelque chose a faire le soir. C'est ce qui "+
    "tient le mieux le moral, et cela tient tout le monde dedans : la base "+
    "s'entend moins."},
 {k:"armurerie",   n:"Armurerie",     mat:48, mn:2, mx:3, mo:0.4, br:1,
  t:["","Armurerie","Grande armurerie"],
  d:"Un etabli et des racks. Ceux qui tiennent les murs tirent d'autant "+
    "plus vite : une fois et demie a trois cases. Elle s'entend un peu."},
 {k:"atelier",     n:"Atelier",       mat:30, mn:1, mx:3, mo:0.4, br:3,
  t:["Etabli","Atelier","Grand atelier"],
  d:"Des outils en ordre. Un dixieme de matiere economisee par case sur "+
    "tout ce qui vient apres, entretien compris. C'est ce qui fait le plus "+
    "de bruit de toute la maison."},
 {k:"guet",        n:"Poste de guet", mat:50, mn:1, mx:1, mo:0.5, br:-4,
  t:["Poste de guet"],
  d:"Une echelle et une lucarne. On voit venir de cinquante pas plus loin, "+
    "et l'on va au-devant de ce qui rode avant que ca ne s'attroupe : c'est "+
    "ce qui ralentit le plus ce qu'on attire. Il ne grandit pas : une "+
    "lucarne est une lucarne."},
 {k:"radio",       n:"Poste radio",   mat:36, mn:1, mx:1, mo:0.5,
  t:["Poste radio"],
  d:"Un emetteur, une antenne sur le toit, et quelqu'un pour ecouter. "+
    "C'est ce qui permet de rappeler un compagnon parti en mission - a "+
    "condition qu'il ait un talkie-walkie sur lui. Il ne grandit pas : on "+
    "parle ou l'on ne parle pas. Hors service, il se tait."},
 {k:"reserve",     n:"Reserve",       mat:18, mn:1, mx:0, mo:0,
  t:["Etagere","Reserve","Grande reserve","Entrepot"],
  d:"Huit places de rangement par case. La seule sans plafond : c'est elle "+
    "qui absorbe les cases en trop d'un grand toit."}
];
/* Le nom d'une amelioration a une taille donnee. */
function buildName(B,n){
    if(!B) return "";
    var i=Math.max(0,Math.min((B.t||[]).length-1,(n|0)-1));
    return (B.t&&B.t[i])||B.n;
}
/* Le plafond reel : zero veut dire sans plafond, borne par la piece. */
function buildMax(B,libre){
    if(!B) return 0;
    return B.mx?Math.min(B.mx,libre):libre;
}
function builtHas(k){ return !!(BASE&&BASE.built&&BASE.built[k]); }
/* Combien de cases une amelioration FAIT TRAVAILLER. Zero si elle n'est pas
   b\u00e2tie, zero aussi si elle est hors service : tout ce qui la lit peut donc
   s'ecrire sans test prealable, et la degradation eteint d'un coup tous ses
   effets sans qu'aucun d'eux ait a la connaitre. Ce qui a besoin des cases
   OCCUPEES - le plan, l'encombrement d'une piece - lit e.n directement. */
function builtN(k){
    var e=BASE&&BASE.built&&BASE.built[k];
    return (e&&!e.hs)?(e.n|0):0;
}
/* Ce qui est pose dans une piece donnee, et ce qu'il y reste. */
function roomBuilt(fl,ri){
    var out=[], k;
    if(!BASE||!BASE.built) return out;
    for(k in BASE.built){
        var e=BASE.built[k];
        if(e&&e.fl===fl&&e.ri===ri) out.push({k:k,n:e.n,hs:e.hs?1:0});
    }
    out.sort(function(a,b){ return a.k<b.k?-1:1; });
    return out;
}
function roomCases(fl,ri){
    var PL=BASE?bldPlan(BASE.b):null;
    if(!PL||!PL.fl[fl]||!PL.fl[fl].rooms[ri]) return 0;
    return PL.fl[fl].rooms[ri].cs|0;
}
function roomUsed(fl,ri){
    var L=roomBuilt(fl,ri), s=0, i;
    for(i=0;i<L.length;i++) s+=L[i].n;
    return s;
}
function roomFree(fl,ri){ return Math.max(0,roomCases(fl,ri)-roomUsed(fl,ri)); }
/* Toutes les cases occupees de la base : c'est ce nombre, et non celui des
   pieces disponibles, qui commandera le bruit et l'entretien. Un immeuble de
   cent vingt-trois cases ou l'on n'en a pose que vingt-cinq coutera donc
   exactement ce que coute une caserne. */
function builtCases(){
    var s=0, k;
    if(!BASE||!BASE.built) return 0;
    for(k in BASE.built) if(BASE.built[k]) s+=BASE.built[k].n|0;
    return s;
}
/* ---- L'ENTRETIEN ----
   Une base de cent cases coutait exactement ce que coute une base de dix :
   la taille n'avait pas de prix. Elle en a un desormais, et il se paie en
   matiere premiere au lever de chaque jour, a proportion des cases QUI
   SERVENT.

   LA RESERVE NE COUTE RIEN ET NE SE DEGRADE PAS. Une etagere n'a pas de
   piece mobile : elle tient ce qu'on y pose, entretenue ou non. Sans cette
   exception, un immeuble de cent vingt-trois cases serait ruineux par sa
   seule taille alors qu'il n'a jamais rien fait de plus que porter du stock,
   et la neuvieme amelioration ne pourrait plus absorber les cases en trop -
   ce pour quoi elle a ete faite.

   L'ATELIER COMPTE ICI AUSSI : sa notice l'annonce depuis la v21, un
   dixieme de matiere en moins par case, entretien compris.

   FAUTE DE MATIERE, UNE AMELIORATION SE DEGRADE. Elle reste posee, elle
   occupe toujours ses cases, mais elle cesse de servir - plus de rations
   economisees, plus de couchages, plus de moral. On la remet en etat en
   payant la moitie de ce qu'elle a coute. Le tirage qui la designe se fait
   a chaque lever du jour, qu'il y ait dette ou non : un tirage conditionnel
   decalerait le flux et deux rejeus divergeraient. */
var MAINT_CASE=2;
/* Les cases qui coutent : celles qui servent, hors reserve. */
function maintCases(){
    var s=0, k, e;
    if(!BASE||!BASE.built) return 0;
    for(k in BASE.built){
        e=BASE.built[k];
        if(!e||e.hs||k==="reserve") continue;
        s+=e.n|0;
    }
    return s;
}
function maintCost(){
    return Math.round(maintCases()*MAINT_CASE*
                      Math.max(0.5,1-0.1*builtN("atelier")));
}
/* Ce qui sert encore, DANS L'ORDRE DU REGISTRE : c'est la liste ou l'on
   tire la degradation, et elle doit etre ordonnee pour que deux rejeus
   degradent la meme. Parcourir BASE.built ne le garantirait pas. */
function maintLive(){
    var out=[], q, e;
    for(q=0;q<BUILDS.length;q++){
        if(BUILDS[q].k==="reserve") continue;
        e=BASE&&BASE.built&&BASE.built[BUILDS[q].k];
        if(e&&!e.hs) out.push(BUILDS[q].k);
    }
    return out;
}
/* Ce qui ne sert plus, meme ordre. */
function maintDead(){
    var out=[], q, e;
    for(q=0;q<BUILDS.length;q++){
        e=BASE&&BASE.built&&BASE.built[BUILDS[q].k];
        if(e&&e.hs) out.push(BUILDS[q].k);
    }
    return out;
}
/* Remettre en etat : la moitie du prix, arrondie au plus HAUT - on ne
   repare pas pour rien. Le meme geste que b\u00e2tir, sans les cases a trouver,
   puisqu'elle ne les a jamais lachees. */
function buildFix(k){
    var B=buildDef(k), e=BASE&&BASE.built&&BASE.built[k];
    if(!BASE||!B||!e||!e.hs) return false;
    if(!baseHere()){ notice("PAS SUR PLACE"); return false; }
    var cout=Math.ceil(buildCost(B,e.n)/2);
    if(baseStock().mat<cout){ notice("MATIERE INSUFFISANTE"); return false; }
    buildSpend(cout);
    e.hs=0;
    morMove(2);
    logMsg("Vous remettez en etat : "+buildName(B,e.n).toLowerCase()+
           ", "+cout+" de matiere.","jsay");
    notice(buildName(B,e.n).toUpperCase()+" REMISE EN ETAT");
    return true;
}
/* Les couchages : trois par case de dortoir. */
function baseBeds(){ return builtN("dortoir")*3; }
function buildDef(k){
    var i;
    for(i=0;i<BUILDS.length;i++) if(BUILDS[i].k===k) return BUILDS[i];
    return null;
}
/* Le cout reel : l'atelier fait baisser celui de tout ce qui vient apres,
   d'un dixieme par case. Il est proportionnel a la taille : une cantine de
   quatre cases coute quatre fois un coin cuisine. */
function buildCost(B,n){
    if(!B) return 0;
    var at=builtN("atelier");
    /* on arrondit LA CASE et non le total : sans cela deux cases coutaient
       quarante-trois quand une en coutait vingt-deux, et le prix n'etait
       plus proportionnel a ce qu'on annonce */
    return Math.round(B.mat*Math.max(0.5,1-0.1*at))*(n||1);
}
/* Consommer de la matiere premiere dans les rayonnages, objet par objet, en
   commencant par les plus lourds : on demonte le lave-linge avant les
   assiettes. Rend ce qui a ete pris. */
function buildSpend(cout){
    var i, c, o, reste=cout, ord=[];
    if(!BASE||!BASE.inv) return 0;
    for(i=0;i<BASE.inv.length;i++){
        c=BASE.inv[i];
        if(!c||cellIsW(c)) continue;
        o=itemById(c.i);
        if(o&&o.k==="obj"&&o.mat>0) ord.push({i:i,m:o.mat});
    }
    ord.sort(function(a,b){ return b.m-a.m; });
    for(i=0;i<ord.length&&reste>0;i++){
        c=BASE.inv[ord[i].i];
        while(c&&c.q>0&&reste>0){ c.q--; reste-=ord[i].m; }
        if(c&&c.q<=0) BASE.inv[ord[i].i]=null;
    }
    return cout-Math.max(0,reste);
}
/* ---- LES PLACES DE RANGEMENT ----
   La surface au sol en donne le socle, la reserve y ajoute huit par case.
   Le tableau suit : on rallonge en poussant des cases vides, on raccourcit
   seulement si la queue est libre - on ne fait pas disparaitre ce qui est
   range en demontant une etagere. */
var RESERVE_PL=8;
function baseCapTotal(){
    if(!BASE) return 0;
    return (BASE.cap0||BASE.cap||0)+builtN("reserve")*RESERVE_PL;
}
function baseFitInv(){
    var n;
    if(!BASE||!BASE.inv) return;
    n=Math.ceil(baseCapTotal()/5)*5;
    BASE.inv.gw=5;
    while(BASE.inv.length<n) BASE.inv.push(null);
    /* on ne rend que des LIGNES entieres, et seulement si elles sont vides */
    while(BASE.inv.length-5>=n&&BASE.inv.slice(-5).every(function(z){ return !z; }))
        BASE.inv.length-=5;
    /* si la queue n'est pas libre, on garde les cases : rien ne se perd */
    BASE.cap=BASE.inv.length;
}
/* ---- BATIR ----
   On pose une amelioration dans une piece precise, sur un nombre de cases
   choisi. Elle ne se b\u00e2tit qu'une fois : pour l'agrandir, on la retire et
   on la repose. */
function buildPut(k,n,fl,ri){
    var B=buildDef(k), PL, R;
    if(!BASE||!B) return false;
    if(!baseHere()){ notice("PAS SUR PLACE"); return false; }
    if(builtHas(k)){ notice("DEJA BATIE"); return false; }
    PL=bldPlan(BASE.b);
    if(!PL||!PL.fl[fl]||!PL.fl[fl].rooms[ri]){ return false; }
    R=PL.fl[fl].rooms[ri];
    n=n|0;
    if(n<B.mn){ notice("TROP PETIT POUR CELA"); return false; }
    if(B.mx&&n>B.mx) n=B.mx;
    if(n>roomFree(fl,ri)){ notice("PAS ASSEZ DE CASES ICI"); return false; }
    var cout=buildCost(B,n);
    if(baseStock().mat<cout){ notice("MATIERE INSUFFISANTE"); return false; }
    buildSpend(cout);
    if(!BASE.built) BASE.built={};
    BASE.built[k]={n:n, fl:fl, ri:ri};
    if(k==="reserve") baseFitInv();
    morMove(4+n);
    logMsg("Vous batissez : "+buildName(B,n).toLowerCase()+" ("+n+" case"+
           (n>1?"s":"")+").","jsay");
    notice(buildName(B,n).toUpperCase()+" BATIE");
    return true;
}
/* ---- DEFAIRE ----
   On recupere la moitie de la matiere, arrondie au plus bas : demonter
   coute. Une reserve pleine ne se demonte pas - ce qu'elle tient n'aurait
   plus ou aller, et le silence serait pire qu'un refus. */
function buildTake(k){
    var B=buildDef(k), e=BASE&&BASE.built&&BASE.built[k], i;
    if(!BASE||!B||!e) return false;
    if(!baseHere()){ notice("PAS SUR PLACE"); return false; }
    if(k==="reserve"){
        var reste=(BASE.cap0||BASE.cap)+0, plein=0;
        for(i=0;i<BASE.inv.length;i++) if(BASE.inv[i]) plein++;
        if(plein>reste){ notice("VIDEZ LES RAYONNAGES D'ABORD"); return false; }
    }
    var rendu=Math.floor(buildCost(B,e.n)/2);
    delete BASE.built[k];
    if(k==="reserve") baseFitInv();
    if(rendu>0) baseGiveMat(rendu);
    morMove(-2);
    logMsg("Vous demontez : "+buildName(B,e.n).toLowerCase()+
           (rendu>0?(", "+rendu+" de matiere recuperee."):"."),"jday");
    notice(B.n.toUpperCase()+" DEMONTEE");
    return true;
}
/* Rendre de la matiere premiere : on repose des planches, l'objet le plus
   modeste qui porte de la matiere, tant qu'il y a de la place. */
function baseGiveMat(q){
    var o=itemFind("Planche de bois"), i, mis=0;
    if(!o){ for(i=0;i<ITEMS.length;i++)
        if(ITEMS[i].k==="obj"&&ITEMS[i].mat>0){ o=ITEMS[i]; break; } }
    if(!o||!o.mat) return 0;
    var n=Math.floor(q/o.mat);
    while(n>0){
        if(!bldPushBase(o.id,1)) break;
        n--; mis++;
    }
    return mis;
}
function bldPushBase(id,q){
    var i, o=itemById(id);
    if(!BASE||!BASE.inv||!o) return false;
    for(i=0;i<BASE.inv.length;i++){
        var c=BASE.inv[i];
        if(c&&!cellIsW(c)&&c.i===id&&c.q<cellMax(c)){ c.q+=q; return true; }
    }
    return gridAdd(BASE.inv,{i:id,q:q});
}
/* ---- LES QUATRE RESERVES ----
   Elles ne sont pas comptees a part : elles se lisent dans ce qui est
   entrepose. Un stock n'est pas un chiffre abstrait, c'est un rayonnage.
   La nourriture et l'eau comptent en rations, les munitions en cartouches,
   les soins en pieces, le materiel en matiere premiere. */
function baseStock(){
    var r={viv:0, mun:0, med:0, mat:0}, i, c, o;
    if(!BASE||!BASE.inv) return r;
    for(i=0;i<BASE.inv.length;i++){
        c=BASE.inv[i];
        if(!c||cellIsW(c)) continue;
        o=itemById(c.i);
        if(!o) continue;
        if(o.k==="viv") r.viv+=c.q||1;
        else if(o.k==="med") r.med+=c.q||1;
        else if(o.k==="mun") r.mun+=(o.nb||0)*(c.q||1);
        else if(o.k==="obj") r.mat+=(o.mat||0)*(c.q||1);
    }
    return r;
}
/* Ce que le groupe mange par jour : une ration par tete, deux pour qui est
   blesse - un corps qui se repare mange davantage. La cuisine en fait
   economiser une sur l'ensemble. */
function estBlesse(o){ return !!o&&o.hp<(o.maxhp||100)*0.999; }
function baseNeed(){
    var L=grpList(), n=estBlesse(G.p)?2:1, i;
    for(i=0;i<L.length;i++) n+=estBlesse(L[i])?2:1;
    n=Math.max(1,n-builtN("cuisine"));
    return n;
}
/* Les medicaments : un par jour et par blesse, la moitie avec l'infirmerie. */
function baseMedNeed(){
    var L=grpList(), n=estBlesse(G.p)?1:0, i;
    for(i=0;i<L.length;i++) if(estBlesse(L[i])) n++;
    n=Math.max(0,n-builtN("infirmerie"));
    return n;
}
function baseTakeKind(kind,n){
    var i, c, o, pris=0;
    if(!BASE) return 0;
    for(i=0;i<BASE.inv.length&&pris<n;i++){
        c=BASE.inv[i];
        if(!c||cellIsW(c)) continue;
        o=itemById(c.i);
        if(!o||o.k!==kind) continue;
        while(c.q>0&&pris<n){ c.q--; pris++; }
        if(c.q<=0) BASE.inv[i]=(c.b!==undefined)?{i:c.b,q:1}:null;
    }
    return pris;
}
/* La releve du jour : on retire les rations, et l'on dit ce qui manque.
   Rien d'autre pour l'instant - la faim ne coute encore rien, elle attend le
   moral, qui viendra avec les ameliorations. */
function baseDay(){
    if(!BASE||!BASE.inv) return;
    var n=baseNeed(), pris=baseTakeKind("viv",n), k;
    BASE.faim=n-pris;
    /* les soins des blesses */
    var nm=baseMedNeed(), prm=baseTakeKind("med",nm);
    BASE.soif=nm-prm;
    /* ---- L'ENTRETIEN ----
       La troisieme ligne du jour, apres les rations et les medicaments : la
       matiere premiere, a proportion des cases qui servent. Le tirage est
       inconditionnel - il doit consommer un flux identique que la dette
       existe ou non, sinon deux rejeus se decaleraient au premier jour de
       disette. */
    var ne=maintCost(), pre=buildSpend(ne), tir=rng();
    BASE.dette=Math.max(0,ne-pre);
    BASE.casse="";
    if(BASE.dette>0){
        var LV=maintLive();
        if(LV.length){
            var kk=LV[Math.min(LV.length-1,Math.floor(tir*LV.length))];
            var Bk=buildDef(kk);
            BASE.built[kk].hs=1;
            BASE.casse=kk;
            logMsg("Faute de matiere, "+buildName(Bk,BASE.built[kk].n).toLowerCase()+
                   " a lache. Elle occupe toujours ses cases et ne sert plus a "+
                   "rien : il faudra la remettre en etat.","jsay");
            notice(Bk.n.toUpperCase()+" HORS SERVICE");
        } else logMsg("Il manque "+BASE.dette+" de matiere pour l'entretien, "+
                      "mais il n'y a plus rien qui puisse lacher.","jday");
    } else if(ne>0)
        logMsg("L'entretien a coute "+ne+" de matiere premiere.","jday");
    /* ---- LE MORAL DU JOUR ----
       Ce qu'on a bati le tire vers le haut, a proportion des cases posees ;
       ce qui a manque le tire vers le bas. Un ventre vide coute plus cher
       qu'une plaie mal pansee, parce qu'il concerne tout le monde. Sans rien
       faire, le moral revient doucement vers l'ordinaire : personne ne reste
       desespere sans raison. */
    var mv=0;
    if(BASE.built) for(k in BASE.built) if(BASE.built[k]&&!BASE.built[k].hs){
        var B9=buildDef(k); if(B9) mv+=B9.mo*(BASE.built[k].n|0);
    }
    if(BASE.faim>0) mv-=6+2*BASE.faim;
    if(BASE.soif>0) mv-=4+BASE.soif;
    /* Vivre dans une maison qui se defait coute, independamment de ce que la
       piece tombee rendait : c'est le manque lui-meme qui se voit. */
    if(BASE.dette>0) mv-=3;
    /* ---- LES COUCHAGES ----
       Trois par case de dortoir. Qui dort a meme le sol le paie, et cela
       vaut aussi quand il n'y a pas de dortoir du tout : c'est la premiere
       raison d'en b\u00e2tir un. */
    var tetes=grpList().length+1;
    BASE.aucoin=Math.max(0,tetes-baseBeds());
    if(BASE.aucoin>0) mv-=2*BASE.aucoin;
    mv=Math.round(mv);
    if(!mv) mv=(morale()<MOR_START)?1:((morale()>MOR_START)?-1:0);
    morMove(mv);
    /* ---- LE REPOS ----
       Etre chez soi au lever du jour compte pour une journee de repos, et
       le repos doit etre continu : une seule nuit dehors remet tout a zero.
       Au bout de MAL_CURE journees, la maladie s'en va pour de bon - c'est
       la seule guerison du jeu. */
    var p=G.p;
    if(baseHere()){
        p.rest=(p.rest||0)+1;
        /* un ventre vide ne repare rien : pas de nourriture, pas de vie
           rendue au lever du jour */
        if(BASE.faim<=0) p.hp=p.maxhp;
        else logMsg("Le ventre vide, on ne se refait pas.","jsay");
        if(p.mal){
            /* et sans medicament, la fievre ne recule pas non plus */
            if(BASE.soif>0){
                p.rest=Math.max(0,p.rest-1);
                logMsg("Faute de medicaments, la fievre n'a pas recule.","jsay");
            } else if(p.rest>=Math.max(1,MAL_CURE-(builtN("dortoir")?1:0))){
                p.mal=0; p.malPause=0; p.malT=0; p.rest=0;
                logMsg("La fievre est tombee pour de bon. Vous etes gueri.","jsay");
                notice("GUERI");
            } else logMsg("Vous vous reposez. Encore "+(MAL_CURE-p.rest)+
                          " jour"+((MAL_CURE-p.rest)>1?"s":"")+" pour en finir "+
                          "avec cette fievre.","jday");
        }
    } else if(p.rest){
        p.rest=0;
        if(p.mal) logMsg("Une nuit dehors, et la fievre reprend le dessus.","jday");
    }
    if(pris>=n)
        logMsg("La base a nourri "+n+" bouche"+(n>1?"s":"")+" aujourd'hui.","jday");
    else
        logMsg("Il a manque "+(n-pris)+" ration"+((n-pris)>1?"s":"")+
               " a la base aujourd'hui.","jsay");
}
/* Poser une case du sac sur les rayonnages, et l'inverse. */
function basePut(k){
    var p=G.p, c=(p.inv&&k>=0&&k<p.inv.length)?p.inv[k]:null, i;
    /* On ne range rien a distance : il faut etre sur place. La regle tient
       ici et non dans le panneau, sinon le journal d'entrees permettrait de
       vider ses rayonnages depuis l'autre bout de la carte. */
    if(!BASE||!c||!baseHere()) return false;
    for(i=0;i<BASE.inv.length;i++) if(!BASE.inv[i]) break;
    if(i>=BASE.inv.length){ notice("RAYONNAGES PLEINS"); return false; }
    BASE.inv[i]=c; p.inv[k]=null;
    sClick();
    return true;
}
function baseTake(k){
    var p=G.p, c=(BASE&&BASE.inv&&k>=0&&k<BASE.inv.length)?BASE.inv[k]:null, i;
    if(!c||!baseHere()) return false;
    invFit();
    for(i=0;i<p.inv.length;i++) if(!p.inv[i]) break;
    if(i>=p.inv.length){ notice("SAC PLEIN"); return false; }
    p.inv[i]=c; BASE.inv[k]=null;
    sClick();
    return true;
}

