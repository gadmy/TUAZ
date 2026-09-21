"use strict";
/* ================================================================
   TUAZ - 18-objets.js
   La valeur d'echange et LA TABLE : le catalogue unique des objets.
   (lignes 20664 a 21747 du mono-fichier d'origine)
   ================================================================ */
/* ================= LA VALEUR D'ECHANGE =================
   Il n'y a pas de monnaie : il y a du troc. Chaque chose porte une valeur,
   et deux choses ne s'echangent que si leurs valeurs se tiennent.

   La tolerance est une part et non un montant : on compare le rapport, pas
   l'ecart. Deux choses s'echangent si la plus chere ne vaut pas plus d'un
   quart de plus que la plus modeste - une conserve a 12 contre une autre a
   19 passe, un fusil a 1 200 va de 960 a 1 500. Le meilleur coup possible est
   donc le meme a tous les niveaux, et l'aptitude Troc est seule a le
   deplacer.

   Les valeurs ne sont pas ecrites une a une : elles se deduisent de ce que
   chaque chose est deja. Le materiel vaut sa matiere premiere, le vivre vaut
   ce qu'il rend de sante, l'arme vaut ce qu'elle envoie par minute. Ainsi
   toute chose ajoutee au registre recoit sa valeur sans qu'on y pense, et
   aucune ne peut etre oubliee. */
var AMVAL={a22:0.5, a9:1.1, a12:1.6, a357:1.9, a556:2.2, a762:2.8,
           a8lb:4.2, a75:4.0, a338:7.5, a127:16};
function itemValue(o){
    if(!o) return 0;
    if(o.k==="sac")  return 10+o.cap*14;
    /* le souffle vaut un peu moins cher que la vie : il revient tout seul */
    if(o.k==="viv")  return Math.round(4+(o.hp||0)*0.9+(o.st||0)*0.55);
    if(o.k==="med")  return Math.round(14+(o.hp||0)*2.4+(o.st||0)*1.5);
    if(o.k==="mun")  return Math.round((o.nb||0)*(AMVAL[o.am]||1));
    /* une arme de jet vaut ce qu'elle fait sauter : degats, rayon, duree */
    if(o.k==="jet")  return Math.round(30+(o.dmg||0)*1.6+(o.rad||0)*1.1+
                                       (o.dur||0)*7);
    /* Un vetement vaut ce qu'il apporte : la somme de ses points d'aptitude,
       la protection valant plus cher que le confort. Le poids ne le
       decote pas - un gilet pare-balles est lourd et cher, et c'est
       precisement ce qui en fait un objet de troc. */
    if(o.k==="vet"){
        var vb=o.bon||{}, vs=0, vk;
        for(vk in vb) vs+=vb[vk]||0;
        return Math.max(6,Math.round(8+vs*4.5+
            ((vb.vigueur||0)+(vb.sante||0))*2.5));
    }
    /* le materiel vaut sa matiere premiere, qui est deja notee au registre */
    return Math.max(4,Math.round((o.mat||0)*5));
}
/* Une arme vaut ce qu'elle envoie : les degats par minute d'abord, la portee
   ensuite, et le chargeur qui evite de recharger. Le corps a corps ne tire
   pas, mais il ne coute pas de munitions : sa cadence compte pour lui. */
function wValue(w){
    if(!w) return 0;
    var dpm=(w.dmg||0)*(w.cad||60)/60;
    if(w.cat===3) return Math.round(40+dpm*3+(w.por||0)*1.5);
    return Math.round(90+dpm*2.6+(w.por||0)*2.2+(w.mag||0)*4);
}
/* La valeur d'une case, pile comprise. */
function cellValue(c){
    if(!c) return 0;
    if(cellIsW(c)) return wValue(WEAPONS[c.w]);
    /* la ceinture part avec ses boites quand la case entiere change de mains :
       elle doit donc compter dans le prix, sinon on la donnerait pour rien */
    var vb=cellBelt(c);
    return itemValue(itemById(c.i))*(c.q||1)+(vb?itemValue(vb):0);
}
/* ---- LA PART QUE VAUT LE MARCHANDAGE ----
   La part se lit sur l'ecart entre le Troc du joueur et celui d'en face : a
   egalite elle vaut CFG.TRADE_PCT, et le battement CFG.TRADE_SWING l'ouvre ou
   la referme selon qui marchande le mieux. Un bon marchandeur ne gagne donc
   rien dans l'absolu : il gagne sur son interlocuteur.
   Le plancher CFG.TRADE_FLOOR couvre le bas de l'echelle : sous une
   quarantaine de points, la part vaudrait si peu que rien ne s'echangerait
   plus contre rien. */
function tradePct(npc){
    var e=statEff(G&&G.p,"astuce","troc");
    var n=(npc&&(npc.stats||npc.sec))?statEff(npc,"astuce","troc"):50;
    var p=CFG.TRADE_PCT+((e-n)/100)*CFG.TRADE_SWING;
    return Math.max(0.02,p);
}
function valTol(v,pct){
    if(pct===undefined) pct=CFG.TRADE_PCT;
    return Math.max(CFG.TRADE_FLOOR,Math.abs(v)*pct);
}
/* Deux valeurs s'echangent-elles ? La tolerance est celle de la plus faible
   des deux, et non de la plus forte : une chose est liee par sa propre
   fourchette, pas par celle d'en face. Celui qui pose un objet de 150 ne va
   pas repartir avec un objet de 50, ce serait ridicule. */
function valFits(a,b,pct){
    return Math.abs(a-b)<=valTol(Math.min(Math.abs(a),Math.abs(b)),pct);
}
/* Pour CONCLURE un troc : a est ce QUE JE DONNE, b ce que je recois. On
   accepte des que je ne sous-paie pas au-dela de la tolerance - donc une
   offre EGALE OU SUPERIEURE passe toujours (donner plus n'est jamais refuse). */
function xchgOK(a,b,pct){
    return (b-a)<=valTol(Math.min(Math.abs(a),Math.abs(b)),pct);
}
/* Ce que l'on peut donner en echange, et pourquoi non le cas echeant. */
function tradeWhy(a,b,pct){
    if(!a||!b) return "Choisissez une chose de chaque cote.";
    var va=cellValue(a), vb=cellValue(b), t=valTol(Math.min(va,vb),pct);
    if(valFits(va,vb,pct)) return "";
    return "Ecart de "+Math.abs(va-vb)+" pour une tolerance de "+
           (Math.round(t*10)/10)+".";
}
/* ================= LA TABLE, UNE SEULE =================
   Trois endroits montraient un sac face a un autre - la fenetre ECHANGE,
   l'onglet du dialogue et la table a deux - et chacun avait sa grille, sa
   facon de designer une case et son style. La MECANIQUE avait ete ramenee a
   une des la v20 ; depuis le lot E, LA SURFACE aussi : quand on parle a
   quelqu'un, il n'y a plus que l'onglet du dialogue, et il montre en outre ce
   que l'autre porte sur lui. La table a deux du groupe demeure, mais elle
   n'est pas une porte du dialogue - on y equipe les siens depuis chez soi.

   UN SEUL GESTE, DEUX REGLES. On clique une case, toujours de la meme
   maniere. Ce qui suit depend de qui est en face : un inconnu marchande, et
   l'on empile de part et d'autre jusqu'a ce que les deux comptes se
   tiennent ; un des notres ne marchande pas, et la case passe au clic.
   VALEURS POUR LES INCONNUS, GRATUIT POUR LES SIENS. */
/* La grille : des cases .slot dans une .gridbag, la designee marquee. Elle
   rend la main aussitot - ce qu'un clic declenche ne la regarde pas. */
/* pick vaut un rang, ou une LISTE de rangs depuis que l'on pose plusieurs
   choses a la fois sur la table. */
function cellPicked(pick,i){
    if(pick===undefined||pick===null) return false;
    if(pick.indexOf) return pick.indexOf(i)>=0;
    return pick===i;
}
function cellGrid(host,inv,pick,val,onPick){
    var gr=(typeof host==="string")?document.getElementById(host):host;
    var h="", i, c, o, cs, rk=[], W, x, y, gw, gh;
    if(!gr) return;
    if(!inv){ gr.innerHTML=""; return; }
    W=invGW(inv);
    gr.style.setProperty("--gn",W);
    for(i=0;i<inv.length;i++){
        c=inv[i];
        /* un renvoi n'a pas de case a lui : la sienne est deja peinte par
           l'ancre qui deborde dessus */
        if(cellIsRef(c)) continue;
        o=cellObj(c);
        var bl=cellBelt(c);
        gw=c?cellGW(c):1; gh=c?cellGH(c):1;
        x=i%W; y=(i/W)|0;
        rk.push(i);
        h+="<div class='slot"+(o?" ifull":"")+(bl?" ibelt":"")+
           ((cellPicked(pick,i)&&o)?" itrpick":"")+
           "' data-c='"+i+"' style='grid-column:"+(x+1)+"/span "+gw+
           ";grid-row:"+(y+1)+"/span "+gh+"'>";
        if(o) h+="<canvas class='iic' width='96' height='96'></canvas>"+
                 (bl?("<span class='iq ibq'>"+c.q+"/"+bl.blt+"</span>")
                    :((c.q>1&&!cellIsW(c))?("<span class='iq'>"+c.q+"</span>"):""));
        h+="</div>";
    }
    gr.innerHTML=h;
    cs=gr.querySelectorAll(".slot");
    for(i=0;i<cs.length;i++){
        c=inv[rk[i]]; o=cellObj(c);
        if(o){
            var cv=cs[i].querySelector("canvas");
            if(cv&&cv.getContext){
                var g2=cv.getContext("2d");
                g2.clearRect(0,0,96,96);
                if(cellIsW(c)) iconDraw(g2,o,0,27,0.5,IWHITE);
                else itIconDraw(g2,o.ic,0,0,4,IWHITE);
            }
            cs[i].title=o.n+(cellIsW(c)?(" - "+o.fam):(" - "+itemLine(o)))+
                        (cellBelt(c)?(" - "+cellBelt(c).n.toLowerCase()):"")+
                        (val?(" - valeur "+cellValue(c)):"");
        }
        (function(k,ob){ cs[k].onclick=function(ev){
            if(!ob) return;
            /* la touche Maj passe au geste : c'est elle qui distingue une
               boite de la case entiere, et rien d'autre ne la porte */
            sClick(); onPick(rk[k],!!(ev&&ev.shiftKey));
        }; })(i,o);
    }
}
/* ---- CE QUI EST POSE SUR LA TABLE ----
   C'etait UNE case de chaque cote, et le marche se concluait tout seul des
   que les deux valeurs se tenaient. On ne pouvait donc jamais donner deux
   conserves contre un couteau, ni completer une offre un peu courte : il
   fallait qu'un seul objet tombe dans la fourchette d'un seul autre, ce qui
   rendait les trois quarts du registre introquables faute de vis-a-vis.

   Deux LISTES desormais, et le marche ne part plus seul : on empile de part
   et d'autre, les deux totaux se lisent sous les grilles, et l'on CONCLUT
   quand on veut. C'est la meme tolerance qu'avant, appliquee aux totaux.

   Une seule paire de listes pour toutes les surfaces : deux tables ne
   peuvent pas etre ouvertes en meme temps. */
var XSL=[], XSR=[], XMSG="";
/* Poser ou retirer une case de son cote de la table. */
function xselHas(L,i){ return L.indexOf(i)>=0; }
function xselFlip(L,i){
    var k=L.indexOf(i);
    if(k>=0) L.splice(k,1); else L.push(i);
}
/* Le total d'un cote. Une case designee qui a disparu ne compte pas. */
function xselVal(L,iv){
    var s=0, q, c;
    if(!iv) return 0;
    for(q=0;q<L.length;q++){ c=iv[L[q]]; if(c) s+=cellValue(c); }
    return s;
}
/* On nettoie ce qui n'existe plus : une case peut se vider entre deux
   peintures, et un rang qui pointe dans le vide fausserait le total. */
function xselClean(L,iv){
    var q;
    for(q=L.length-1;q>=0;q--) if(!iv||!iv[L[q]]) L.splice(q,1);
}
/* Qui est en face. La fenetre ECHANGE l'emporte sur le dialogue, qui
   l'emporte sur la table a deux : c'est l'ordre ou elles s'ouvrent. */
function xchgWho(){
    if(!G) return null;
    if(G.trade) return G.trade;
    if(G.talk&&G.talk.n) return G.talk.n;
    return G.eqn||null;
}
/* Un des notres ne marchande pas. */
function xchgFree(n){ return !!(n&&n.recruited); }
/* Notre cote de la table : les rayonnages quand on equipe les siens chez
   soi, notre sac partout ailleurs - on ne troque pas ses reserves avec un
   inconnu de passage. */
function xchgSrcIsBase(n){ return !!(xchgFree(n)&&BASE&&baseHere()); }
function xchgSrc(n){
    return xchgSrcIsBase(n)?BASE.inv:((G&&G.p)?G.p.inv:null);
}
function xchgSrcName(n){ return xchgSrcIsBase(n)?"Rayonnages":"Votre sac"; }
/* Le verdict se dit une fois et s'affiche la ou l'on est. */
function xchgSay(t){
    XMSG=t||"";
    if(t&&G&&G.talk) dsay(t,"dnote");
}
function xchgReset(){ XSL=[]; XSR=[]; XMSG=""; }
/* Repeindre la surface ouverte, quelle qu'elle soit. */
function xchgFill(){
    if(!G) return;
    if(G.trade) tradeFill();
    else if(G.talk&&DTAB) dTradeFill();
    else if(G.eqn) eqFill();
}
/* ---- LE GESTE UNIQUE ----
   mine vaut 1 pour notre cote, 0 pour le sien. Rien d'autre ne designe une
   case dans tout le jeu. */
function xchgPick(mine,i,all){
    var n=xchgWho(), src, iv;
    if(!n||!G||!G.p) return;
    invFit();
    ownFit(n);
    if(!n.inv) n.inv=[];
    src=xchgSrc(n);
    iv=mine?src:n.inv;
    if(!iv||i<0||i>=iv.length||!iv[i]) return;
    if(xchgFree(n)){
        if(mine) xGive(n,src,i,!!all); else xTake(n,src,i,!!all);
        xchgReset();
        xchgFill();
        return;
    }
    /* on empile, on ne conclut pas : c'est le bouton qui conclut */
    xselFlip(mine?XSL:XSR,i);
    XMSG="";
    xchgFill();
}
/* ---- CONCLURE ----
   Le marche ne part plus seul : on le demande. La tolerance s'applique aux
   TOTAUX, et rien d'autre n'a change - la meme fourchette, le meme plancher,
   la meme aptitude Troc en face de la sienne.

   L'ECHANGE SE FAIT EN DEUX TEMPS, ET DANS CET ORDRE : on releve d'abord ce
   qui part de chaque cote, on vide ensuite les cases, on repose enfin. Sans
   cela, deux listes qui se croisent - la case 3 donnee et la case 3 recue -
   s'ecraseraient l'une l'autre, et le compte des places libres serait faux
   au milieu du geste. */
function xchgCan(n,src){
    var a=xselVal(XSL,src), b=xselVal(XSR,n&&n.inv);
    if(!XSL.length||!XSR.length) return false;
    return xchgOK(a,b,tradePct(n));
}
function xchgDo(){
    var n=xchgWho(), src, a, b, mine=[], sien=[], q, c;
    if(!n||!G||!G.p) return false;
    src=xchgSrc(n);
    if(!src||!n.inv) return false;
    xselClean(XSL,src); xselClean(XSR,n.inv);
    if(!XSL.length||!XSR.length){
        xchgSay(XSL.length?"Il manque ce que vous demandez."
                          :"Il manque votre offre.");
        xchgFill(); return false;
    }
    a=xselVal(XSL,src); b=xselVal(XSR,n.inv);
    if(!xchgOK(a,b,tradePct(n))){
        xchgSay("Non. Votre offre vaut "+a+", la sienne "+b+". Il manque "+
                Math.max(0,b-a)+" pour une tolerance de "+
                (Math.round(valTol(Math.min(a,b),tradePct(n))*10)/10)+".");
        xchgFill(); return false;
    }
    /* 1. on releve */
    for(q=0;q<XSL.length;q++) mine.push(src[XSL[q]]);
    for(q=0;q<XSR.length;q++) sien.push(n.inv[XSR[q]]);
    /* 2. on vide */
    for(q=0;q<XSL.length;q++) src[XSL[q]]=null;
    for(q=0;q<XSR.length;q++) n.inv[XSR[q]]=null;
    /* 3. on repose, chacun chez l'autre, a la premiere place libre */
    var toBase=xchgSrcIsBase(n);
    for(q=0;q<sien.length;q++){
        c=sien[q];
        /* ce que l'on recoit : sur les rayonnages de la base tel quel, ou sur
           soi si c'est le sac du joueur (equipement d'abord, puis poches) */
        if(toBase){ if(!xchgPut(src,c)) gndDrop(c,G.p.x,G.p.y); }
        else xchgTakePlayer(c);
    }
    for(q=0;q<mine.length;q++){
        c=mine[q];
        if(!xchgPut(n.inv,c)) gndDrop(c,G.p.x,G.p.y);
    }
    secBump(G.p,"troc",3);
    xchgSay("Marche conclu : "+mine.length+" contre "+sien.length+
            ", "+a+" contre "+b+".");
    logMsg("Vous troquez "+mine.length+" chose"+(mine.length>1?"s":"")+
           " contre "+sien.length+" avec "+(n.name||"cet habitant")+".","jday");
    XSL=[]; XSR=[];
    xchgFill();
    return true;
}
/* Poser une case dans le premier trou venu. Rend faux si tout est plein -
   l'appelant lache alors a terre plutot que de faire disparaitre la chose. */
function xchgPut(iv,c){
    if(!iv||!c) return false;
    return gridAdd(iv,c);
}
/* Ce que LE JOUEUR recoit rejoint d'abord la case de son equipement si elle
   est libre : une arme dans l'emplacement de sa categorie, un vetement ou un
   sac directement sur soi. Sinon il descend dans le sac, et il ne tombe a
   terre que si vraiment rien ne peut l'accueillir - jamais il ne disparait. */
function xchgTakePlayer(c){
    var p=G&&G.p, o, sl;
    if(!c||!p) return;
    if(c.w!==undefined){
        o=WEAPONS[c.w]; sl=o?wSlot(o):-1;
        if(o&&p.slots&&sl>=0&&sl<4&&!p.slots[sl]){ setSlot(sl,c.w); return; }
        if(xchgPut(p.inv,c)) return;
        gndDrop(c,p.x,p.y); return;
    }
    o=itemById(c.i);
    if(o&&autoWearOne(o)){
        c.q=(c.q||1)-1;
        if(c.q<=0) return;
    }
    if(xchgPut(p.inv,c)) return;
    gndDrop(c,p.x,p.y);
}
/* Ce que dit le bandeau sous la grille, selon qui est en face. */
/* Elle ne dit plus la regle - le seuil de tolerance, le plancher de points,
   l'aptitude qui joue contre l'autre : tout cela est dans la bibliotheque et
   n'a pas a etre recite a chaque ouverture. Elle dit l'etat, et les messages
   du marchandage passent toujours par XMSG. */
function xchgNote(n){
    if(XMSG) return XMSG;
    if(xchgFree(n))
        return xchgSrcIsBase(n)
            ? "Entre les votres : une case passe au clic, depuis les rayonnages."
            : "Entre les votres : une case passe au clic, de sac a sac.";
    if(!XSL.length&&!XSR.length) return "Posez ce que vous offrez, et ce que vous voulez.";
    if(!XSL.length) return "Il manque votre offre.";
    if(!XSR.length) return "Il manque ce que vous demandez.";
    return "Concluez quand les deux comptes se tiennent.";
}
/* Une case portee, peinte et intitulee. c vaut null pour un emplacement
   vide : on efface alors la vignette au lieu de laisser la precedente. */
function trSlot(el,c,titre){
    var o=c?cellObj(c):null, cv, g;
    if(!el) return;
    el.className="slot"+(o?" ifull":"");
    el.innerHTML=o?"<canvas class='iic' width='96' height='96'></canvas>":"";
    el.title=titre||"";
    if(!o) return;
    cv=el.querySelector("canvas");
    if(!cv||!cv.getContext) return;
    g=cv.getContext("2d");
    g.clearRect(0,0,96,96);
    if(cellIsW(c)) iconDraw(g,o,0,27,0.5,IWHITE);
    else itIconDraw(g,o.ic,0,0,4,IWHITE);
}
/* Les quatre armes, la tenue et le sac d'une personne, d'un cote ou de
   l'autre. cl vaut "L" pour vous, "R" pour lui. */
function trWorn(cl,n){
    var i, w, d, b, el;
    for(i=0;i<4;i++){
        el=document.querySelector("[data-tw='"+cl+i+"']");
        w=(n&&n.slots&&n.slots[i])||null;
        trSlot(el,w?{w:WEAPONS.indexOf(w),q:1}:null,
            w?(w.n+" - "+w.fam+
               (w.am?(" - chargeur "+((n.mag?(n.mag[i]|0):0))+"/"+(w.mag||1)+
                      ", reserve "+ammoStock(n,w.am)):"")):
              (SLOTN[i]+" - vide"));
    }
    for(i=0;i<4;i++){
        el=document.querySelector("[data-tv='"+cl+i+"']");
        d=vetAt(n,i);
        trSlot(el,d?{i:d.id,q:1}:null,d?(d.n+" - "+vetLine(d)):(VETSLOT[i]+" - vide"));
    }
    b=ownBag(n);
    el=document.querySelector("[data-tb='"+cl+"']");
    trSlot(el,b?{i:b.id,q:1}:null,b?(b.n+" - "+b.cap+" cases"):"Sans sac - poches seules");
}
function tradeFill(){
    var n=(G&&G.trade)?G.trade:null;
    var l=document.getElementById("trwhoL"), r=document.getElementById("trwhoR");
    if(l) l.textContent=(G&&G.p&&G.p.name)||"";
    if(r) r.textContent=n?((n.name||"")+(n.role?" - "+n.role:"")):"";
    tradeSide("pbodyL",(G&&G.p&&G.p.spr)?dressSpr(G.p,G.p.spr):heroA);
    tradeSide("pbodyR",(n&&n.spr)?n.spr:heroA);
    if(!n) return;
    invFit(); ownFit(n);
    if(!n.inv) n.inv=[];
    var fr=xchgFree(n), src=xchgSrc(n)||[], ib=n.inv;
    xselClean(XSL,src); xselClean(XSR,ib);
    var hL=document.getElementById("trsrcL");
    if(hL) hL.textContent=xchgSrcName(n);
    cellGrid("trbagL",src,XSL,!fr,function(k,al){ pushAct("troc",(al?8192:0)|4096|(k&4095)); });
    cellGrid("trbagR",ib,XSR,!fr,function(k,al){ pushAct("troc",(al?8192:0)|(k&4095)); });
    /* les deux panoplies, et les deux acces rapides de votre cote */
    trWorn("L",G.p); trWorn("R",n);
    var i, el, qi;
    for(i=0;i<2;i++){
        el=document.querySelector("[data-tq='L"+i+"']");
        qi=quickId(i);
        trSlot(el,(qi>=0)?{i:qi,q:1}:null,
            (i?"E":"A")+" - "+((qi>=0&&itemById(qi))?itemById(qi).n:"acces rapide, vide"));
    }
    /* CE QU'IL EN EST DE LUI. Un etranger ne se laisse pas deshabiller ; un
       des votres, si, et c'est ici et nulle part ailleurs qu'on le fait
       desormais - plus besoin de rentrer a la base pour reprendre un fusil
       a quelqu'un. On le dit plutot que de laisser deviner pourquoi les
       cases ne repondent pas. */
    var st=document.getElementById("trstateR");
    if(st) st.textContent=fr
        ? "Un des votres. Cliquez sur ce qu'il porte pour le lui reprendre."
        : "Il ne se laissera pas deshabiller.";
    var L3=document.querySelectorAll("[data-tw^='R'],[data-tv^='R'],[data-tb='R']"), q3;
    for(q3=0;q3<L3.length;q3++){ L3[q3].onclick=null; L3[q3].classList.remove("trhot"); }
    if(fr){
        function wire(sel,fn){
            var L=document.querySelectorAll(sel), q;
            for(q=0;q<L.length;q++)(function(e2,k2){
                e2.classList.add("trhot");
                e2.onclick=function(){ sClick(); fn(k2); };
            })(L[q],q);
        }
        wire("[data-tw^='R']",function(k){ pushAct("eqw",k); });
        wire("[data-tv^='R']",function(k){ pushAct("eqv",k); });
        var bl=document.querySelector("[data-tb='R']");
        if(bl){ bl.classList.add("trhot");
            bl.onclick=function(){ sClick(); pushAct("eqb",0); }; }
    }
    /* les valeurs ne s'affichent que la ou elles comptent : entre les siens,
       il n'y a pas de prix a lire */
    var eL=document.getElementById("trvalL"), eR=document.getElementById("trvalR");
    if(eL) eL.textContent=fr?"":("Votre offre : "+xselVal(XSL,src));
    if(eR) eR.textContent=fr?"":("La sienne : "+xselVal(XSR,ib));
    var gb=document.getElementById("trgo");
    if(gb){
        gb.style.display=fr?"none":"inline-block";
        gb.disabled=!xchgCan(n,src);
        gb.textContent="CONCLURE "+xselVal(XSL,src)+" / "+xselVal(XSR,ib);
        gb.onclick=function(){ sClick(); pushAct("trocgo",0); };
    }
    var nt=document.getElementById("trnote");
    if(nt) nt.textContent=xchgNote(n);
}
function tradeSide(id,spr){
    var c=document.getElementById(id);
    if(!c||!c.getContext||!spr) return;
    var g=c.getContext("2d");
    g.imageSmoothingEnabled=false;
    g.clearRect(0,0,c.width,c.height);
    var d=spr.hd||1, w=spr.width/d, h=spr.height/d;
    var sc=Math.min(c.width/w,c.height/h)*0.9;
    g.drawImage(spr,0,0,spr.width,spr.height,
        Math.round((c.width-w*sc)/2),Math.round((c.height-h*sc)/2),
        Math.round(w*sc),Math.round(h*sc));
}
/* ---- LA TABLE A DEUX, REVENUE ----
   Elle avait ete debranchee a l'unification de la logique : xchgWho, xchgFree
   et xchgPick reglaient deja le troc et l'echange libre pour trois surfaces,
   et l'on avait garde la plus etroite - l'onglet du dialogue. C'etait choisir
   le mauvais survivant. Celle-ci est la seule qui montre LES DEUX PERSONNES
   FACE A FACE, chacune avec sa panoplie, et c'est justement ce qu'on venait
   voir : ce que l'autre porte SUR LUI, pas seulement ce qu'il a dans son sac.
   ELLE REDEVIENT LA SEULE. L'onglet du dialogue et la colonne de l'onglet
   GROUPE n'echangent plus : ils ouvrent celle-ci. Leur code n'a pas ete
   supprime - il peint encore des sacs et des fiches ailleurs - mais aucun
   des deux n'est plus un lieu d'echange.
   LA REGLE NE CHANGE PAS D'UN MOT, elle ne fait que se voir mieux : avec un
   etranger on marchande, les deux totaux s'affichent et le bouton CONCLURE
   tranche ; avec un des votres une case passe au clic, sans prix ni compte.
   xchgFree decide, comme avant. */
function tradeOpen(n){
    if(!G) return;
    var q=n||xchgWho();
    if(!q) return;
    G.showBag=false; G.invNpc=null;
    if(ipanEl) ipanEl.style.display="none";
    G.trade=q;
    xchgReset();
    if(trpanEl) trpanEl.style.display="block";
    tradeFill();
}
function tradeClose(){
    if(!G) return;
    G.trade=null; xchgReset();
    if(trpanEl) trpanEl.style.display="none";
}
/* L'onglet Statistiques : les quatre competences en cases, et le survol de
   l'une d'elles ouvre a droite la colonne de ses quatre aptitudes. */
function statBar(n2){
    return "<div class='statbar'><div style='width:"+n2+"%;'></div></div>";
}
function statRows(o){
    var v=(o&&o.stats)||baseStats(), h="", i, d, n2;
    for(i=0;i<STATDEF.length;i++){
        d=STATDEF[i]; n2=Math.round(v[d.k]||0);
        h+="<div class='statbox'>"+
           "<div class='statname'><span>"+d.n+
           "</span><span class='statnum'>"+n2+" / 100</span></div>"+
           statBar(n2)+"</div>";
    }
    return h;
}
function statSecRows(o,i){
    var d=STATDEF[i], sv=(o&&o.sec)||baseSec(), h="", q, a, v2, ef;
    for(q=0;q<d.sec.length;q++){
        a=d.sec[q]; v2=Math.round(sv[a.k]||0);
        ef=Math.round(statEff(o,d.k,a.k));
        h+="<div class='statrow'><div class='statname'><span>"+a.n+
           "</span><span class='statnum'>"+v2+" / 100</span></div>"+
           statBar(v2)+
           "<div class='statsub'>"+a.d+" - categorie a "+ef+" %</div></div>";
    }
    return h;
}
/* Le proprietaire du panneau : le PNJ dont on regarde les affaires, ou soi. */
function statOwner(){
    var n=(G&&G.invNpc)?G.invNpc:null;
    return n?(n.n||n):(G&&G.p);
}
function statHover(i){
    var col=document.getElementById("isec");
    if(!col) return;
    col.style.display="flex";
    document.getElementById("isectitle").textContent="Aptitudes - "+STATDEF[i].n;
    document.getElementById("isecbody").innerHTML=statSecRows(statOwner(),i);
    document.getElementById("istatdesc").innerHTML=
        "<p>"+STATDEF[i].d+"</p>"+
        "<p>Une aptitude ne vaut jamais seule : elle compte pour moitie et "+
        STATDEF[i].n+" pour l'autre moitie. Et "+STATDEF[i].n+" n'est que la "+
        "moyenne de ses quatre aptitudes : faire monter l'une fait monter la "+
        "competence au quart de la vitesse.</p>"+
        "<p>Chacun nait avec ses chiffres, et sa meilleure aptitude de "+
        "naissance est sa specialite : elle seule peut monter jusqu'a 100. Les "+
        "quinze autres ne depassent jamais leur valeur de depart de plus de "+
        CFG.STAT_GAIN+" points. Un boulanger qui court tous les jours finira "+
        "meilleur qu'au depart, jamais athlete comme un pompier.</p>"+
        "<p>Rien ne s'emousse avec le temps : ce qui vous limite n'est pas "+
        "l'oubli, c'est ce que vous etiez a votre naissance.</p>"+
        "<h2>Monter</h2>"+
        "<p>Un geste ne donne pas un point : il donne un usage, et il en faut "+
        "d'autant plus qu'on est deja bon. Trois usages pour un point a cinq, "+
        "douze a cinquante, quarante a quatre-vingt-dix, cinquante-quatre a "+
        "cent. Un debutant progresse a vue d'oeil, un maitre s'use a gagner un "+
        "point.</p>"+
        "<p>Chaque aptitude a son geste. Fouiller un emplacement nourrit la "+
        "Fouille ; forcer une serrure nourrit le Crochetage, et d'autant plus "+
        "qu'elle etait dure. Courir nourrit le Souffle et la Vitesse, et le "+
        "Portage si le sac est lourd - se promener les mains vides ne muscle "+
        "rien. Tirer nourrit la Stabilite, recharger le Chargement, changer "+
        "d'arme le Maniement, jeter une grenade le Lancer. Frapper nourrit la "+
        "Frappe, encaisser un coup la Vigueur et la Sante, esquiver une "+
        "morsure la Parade. Conclure un marche nourrit le Troc. Repousser la "+
        "maladie nourrit l'Immunite. Et la Discretion se gagne a rester une "+
        "seconde entiere a portee de vue d'un zombi sans qu'il vous ait "+
        "repere : le seul apprentissage qui se fait a ne rien faire, ou plutot "+
        "a bien le faire.</p>"+
        "<p>La competence n'a pas de geste a elle : elle est la moyenne de ses "+
        "quatre aptitudes et suit toute seule.</p>"+
        "<p>La Sante fait exception : quand l'aptitude touche son plafond, ce "+
        "qu'on ne peut plus y mettre passe en points de vie bruts. C'est la "+
        "seule chose du jeu qui depasse cent. Un ne a 30 sans specialite "+
        "plafonne a 60 points de vie ; un ne a 30 dont la Sante est la "+
        "specialite monte a 100 ; un ne a 100 monte a 130. La carcasse "+
        "deborde, l'aptitude non.</p>"+
        "<p class='note'>Seuls vous et ceux qui vous ont suivi montez. Un "+
        "habitant croise dans la rue reste ce qu'il est, sans quoi la carte "+
        "entiere progresserait sans que personne ne la regarde. Ce que porte "+
        "un vetement s'ajoute par-dessus, hors des plafonds, et repart avec "+
        "lui : c'est de l'equipement, pas de la progression.</p>"+
        "<p>Les seize aptitudes agissent toutes. Vitesse commande le pas de "+
        "course, Souffle la reserve, Portage la charge, Immunite la resistance "+
        "a la maladie. Fouille la vitesse, le silence et le rendement des "+
        "fouilles ; Crochetage le niveau de serrure que l'on sait ouvrir, de 1 "+
        "a 10, et en dessous c'est un refus et non une lenteur ; Discretion la "+
        "portee du bruit ; Troc la fourchette des echanges. Vigueur reduit les "+
        "degats recus, Sante donne les points de vie, Frappe les degats au "+
        "corps a corps, Parade la chance d'esquiver une morsure - une sur "+
        "vingt les bras ballants, une sur trois a cent. Chargement raccourcit "+
        "le rechargement, Maniement la prise en main, Stabilite resserre le "+
        "tir, Lancer porte le jet plus loin et plus juste.</p>"+
        "<h2>La maladie</h2>"+
        "<p>Une seule, et septique : la morsure d'un zombi infecte comme celle "+
        "d'un varan, par ce qu'elle charrie et non par ce qu'elle transforme. "+
        "On ne devient pas zombi, on pourrit. L'autre source est l'eau qui "+
        "dort : chaque seconde passee dans un marecage est un jet. Immunite "+
        "reduit la chance de la prendre, et rien d'autre : une fois prise, "+
        "elle ne protege plus.</p>"+
        "<p class='note'>La maladie ronge la vie point par point, les "+
        "medicaments suspendent la perte, et la vraie guerison demande "+
        "plusieurs journees de repos a la base. Immunite en espace la "+
        "contraction ; une fois prise, elle ne protege plus de rien.</p>";
    var bx=document.querySelectorAll("#istats .statbox"), q;
    for(q=0;q<bx.length;q++) bx[q].className="statbox"+(q===i?" on":"");
}
function statWire(){
    var bx=document.querySelectorAll("#istats .statbox"), q;
    for(q=0;q<bx.length;q++)(function(k){
        bx[k].onmouseenter=function(){ statHover(k); };
    })(q);
    var col=document.getElementById("isec");
    if(col) col.style.display="none";
}
/* Le panneau sert aux deux : le sien, ou celui du PNJ dont on regarde les
   affaires. Meme mise en page, autre silhouette et autres chiffres. */
function bagFill(){
    var own=document.getElementById("iowner"), st=document.getElementById("istats");
    var n=(G&&G.invNpc)?G.invNpc:null;
    /* le bouton d'echange n'a de sens que devant les affaires d'un autre */
    /* Le bouton ECHANGER ouvrait la fenetre ECHANGE, troisieme surface pour
       la meme table. Il ne s'affiche plus : on echange dans le dialogue. */
    var tb=document.getElementById("itrade");
    if(tb) tb.style.display="none";
    /* le bandeau porte toujours un nom : celui du PNJ, ou le sien */
    if(own) own.textContent=n?(n.name||""):((G&&G.p&&G.p.name)||"");
    /* les competences de celui a qui appartient le panneau */
    if(st) st.innerHTML=statRows(statOwner());
    statWire();
    if(!n){ wSlotFill(); BPICK=false; IPICK=-1; iBagFill(); }
    drawPortraits();
    /* le monde a pu basculer pendant que le panneau etait ferme */
    tabGate();
}
/* ---- SILHOUETTES D'ARMES ----
   Un dessin par famille, en rectangles, dans une boite de 30 sur 14. Il sert
   deux fois : en vignette dans l'emplacement, et en petit sur le personnage
   qui la porte. Chaque forme est une liste de [x,y,l,h,teinte], la teinte
   valant 0 pour le metal sombre, 1 pour le metal clair, 2 pour le bois. */
var WSHAPE={
 "Lame":       [[6,6,13,2,1],[19,4,1,6,0],[20,6,6,2,2]],
 "Contondant": [[3,7,16,2,2],[19,5,8,6,2],[19,5,8,1,1]],
 "Tranchant":  [[4,7,16,2,2],[19,3,3,9,0],[22,4,4,7,1]],
 "Pistolet":   [[4,4,13,4,1],[4,4,13,1,0],[6,8,5,6,0],[11,8,4,1,0]],
 "Mitraillette":[[4,5,15,4,0],[4,5,15,1,1],[7,9,4,5,0],[12,9,3,6,0],[19,6,7,2,0]],
 "Fusil d'assaut":[[1,6,21,3,0],[1,6,21,1,1],[10,9,4,6,0],[15,9,3,5,0],[22,5,7,4,2]],
 "Mitrailleuse":[[1,5,24,5,0],[1,5,24,1,1],[13,10,8,4,0],[6,10,2,5,0],[9,10,2,5,0],[25,5,4,5,2]],
 "Fusil a pompe":[[1,6,20,3,0],[1,6,20,1,1],[8,9,6,2,2],[21,5,8,4,2]],
 "Coup par coup":[[1,7,20,2,0],[1,7,20,1,1],[14,5,2,2,0],[21,5,8,4,2]],
 "DMR":        [[1,7,20,2,0],[10,3,9,2,0],[11,5,1,2,0],[17,5,1,2,0],[21,5,8,4,2],[12,9,3,5,0]],
 "Sniper":     [[0,7,22,2,0],[8,2,12,3,0],[10,5,1,2,0],[18,5,1,2,0],[22,4,8,5,2],[5,9,2,5,0],[8,9,2,5,0]]
};
var WTINT=["#4a4e58","#9aa0ac","#6a4a26"];
function wDraw(g,w,ox,oy,sc,face){
    var sh=WSHAPE[w.fam]||WSHAPE["Pistolet"], q, r;
    for(q=0;q<sh.length;q++){
        r=sh[q];
        g.fillStyle=WTINT[r[4]];
        if(face<0) g.fillRect(ox+(30-r[0]-r[2])*sc,oy+r[1]*sc,r[2]*sc,r[3]*sc);
        else g.fillRect(ox+r[0]*sc,oy+r[1]*sc,r[2]*sc,r[3]*sc);
    }
}
/* ---- ICONES D'ARMES ----
   Autre chose que la silhouette portee : une vignette detaillee, d'une seule
   couleur, pour l'emplacement et plus tard pour le bandeau.
   Chaque arme a son dessin, ecrit a la main en rectangles dans une boite de
   192 sur 84, bouche a droite, axe du canon a la quarante-deuxieme ligne. Un
   rectangle a cinq valeurs est une decoupe : elle efface au lieu de peindre,
   et c'est elle qui ouvre le pontet, les fentes du garde-main, les colliers
   de lunette et l'allegement des crosses. On y reconnait la poignee de
   transport du FAMAS, le chargeur en demi-lune du Chauchat et celui du
   FM 24/29 plante sur le dessus, le barillet cannele des revolvers, les deux
   canons superposes du Browning B525, le trepied de la Hotchkiss de 1914, le
   bipied des mitrailleuses, le tube sous canon et la pompe des fusils a pompe,
   la lame longue et etroite de la baionnette Rosalie.
   Les formes se partagent : deux armes de meme architecture partent du meme
   dessin et ne different que par ce qui se voit vraiment - le chargeur, la
   crosse, la lunette. C'est ce qui rend tenable une table de cinquante-six
   vignettes ecrites a la main. */
var WICON={
 "Poignard Le Vengeur":[[90,39,42,12],[132,30,6,30],[138,36,36,18],[174,39,12,9]],
 /* pommeau, fusee, garde en croix, lame longue avec sa gouttiere, pointe */
 "Epee de cour du chateau":[[18,34,10,18],[28,38,26,10],[54,20,7,46],[54,14,7,8],[57,16,2,4,1],[61,37,112,10],[70,40,92,4,1],[173,39,15,6],[186,41,4,2]],
 "Baionnette Rosalie":[[44,36,8,14],[52,38,30,10],[80,28,6,30],[80,22,6,8],[83,24,2,4,1],[86,39,96,6],[182,40,8,4]],
 "Tonfa PR-24":[[36,38,148,9],[180,37,6,11],[66,18,11,21],[64,14,15,6]],
 "Beche-pioche 1916":[[22,39,12,9],[34,40,84,7],[118,30,10,27],[128,22,44,42],[172,30,8,26],[136,32,26,6,1]],
 "Hache de sapeur":[[24,39,132,9],[138,33,12,15],[150,9,15,66],[165,18,21,48]],
 "Hache de pompier":[[20,39,126,9],[134,31,12,19],[148,6,16,72],[164,15,22,54],[128,22,20,7],[122,19,7,12]],
 "MAC Mle 1950":[[84,30,72,21],[156,36,22,12],[177,34,6,16],[169,31,4,5],[108,51,30,6],[90,60,21,1],[90,61,21,1],[90,62,21,1],[90,63,21,1],[89,64,21,1],[89,65,21,1],[89,66,21,1],[88,67,21,1],[88,68,21,1],[88,69,21,1],[87,70,21,1],[87,71,21,1],[87,72,21,1],[87,73,21,1],[86,74,21,1],[86,75,21,1],[86,76,21,1],[85,77,21,1],[85,78,21,1],[85,79,21,1],[84,80,21,1],[84,81,21,1],[84,82,21,1],[84,83,21,1],[111,56,13,5],[123,56,4,14],[109,68,15,4],[114,61,9,8,1],[171,26,5,9],[90,23,6,12],[92,25,2,6,1]],
 "MAB PA-15":[[90,30,66,21],[90,51,24,6],[156,36,16,12],[171,34,6,16],[163,31,4,5],[96,60,21,1],[96,61,21,1],[96,62,21,1],[96,63,21,1],[95,64,21,1],[95,65,21,1],[95,66,21,1],[94,67,21,1],[94,68,21,1],[94,69,21,1],[93,70,21,1],[93,71,21,1],[93,72,21,1],[93,73,21,1],[92,74,21,1],[92,75,21,1],[92,76,21,1],[91,77,21,1],[91,78,21,1],[91,79,21,1],[90,80,21,1],[90,81,21,1],[90,82,21,1],[90,83,21,1],[117,56,13,5],[129,56,4,14],[115,68,15,4],[120,61,9,8,1],[165,26,5,9],[96,23,6,12],[98,25,2,6,1]],
 "PAMAS G1":[[84,30,72,21],[156,36,22,12],[177,34,6,16],[169,31,4,5],[108,51,30,6],[90,60,21,1],[90,61,21,1],[90,62,21,1],[90,63,21,1],[89,64,21,1],[89,65,21,1],[89,66,21,1],[88,67,21,1],[88,68,21,1],[88,69,21,1],[87,70,21,1],[87,71,21,1],[87,72,21,1],[87,73,21,1],[86,74,21,1],[86,75,21,1],[86,76,21,1],[85,77,21,1],[85,78,21,1],[85,79,21,1],[84,80,21,1],[84,81,21,1],[84,82,21,1],[84,83,21,1],[111,56,13,5],[123,56,4,14],[109,68,15,4],[114,61,9,8,1],[171,26,5,9],[90,23,6,12],[92,25,2,6,1]],
 "SIG SP 2022":[[90,30,66,24],[156,36,19,12],[174,34,6,16],[166,31,4,5],[96,60,21,1],[96,61,21,1],[96,62,21,1],[96,63,21,1],[95,64,21,1],[95,65,21,1],[95,66,21,1],[94,67,21,1],[94,68,21,1],[94,69,21,1],[93,70,21,1],[93,71,21,1],[93,72,21,1],[93,73,21,1],[92,74,21,1],[92,75,21,1],[92,76,21,1],[91,77,21,1],[91,78,21,1],[91,79,21,1],[90,80,21,1],[90,81,21,1],[90,82,21,1],[90,83,21,1],[117,56,13,5],[129,56,4,14],[115,68,15,4],[120,61,9,8,1],[99,54,18,12],[103,60,10,2,1],[168,26,5,9],[96,23,6,12],[98,25,2,6,1]],
 "Glock 17":[[90,30,66,24],[156,36,19,12],[174,34,6,16],[166,31,4,5],[96,60,21,1],[96,61,21,1],[96,62,21,1],[96,63,21,1],[95,64,21,1],[95,65,21,1],[95,66,21,1],[94,67,21,1],[94,68,21,1],[94,69,21,1],[93,70,21,1],[93,71,21,1],[93,72,21,1],[93,73,21,1],[92,74,21,1],[92,75,21,1],[92,76,21,1],[91,77,21,1],[91,78,21,1],[91,79,21,1],[90,80,21,1],[90,81,21,1],[90,82,21,1],[90,83,21,1],[117,56,13,5],[129,56,4,14],[115,68,15,4],[120,61,9,8,1],[99,54,18,12],[103,60,10,2,1],[168,26,5,9],[96,23,6,12],[98,25,2,6,1]],
 "Unique DES 69":[[90,33,48,18],[138,36,43,12],[180,34,6,16],[172,31,4,5],[90,30,60,6],[93,60,18,1],[93,61,18,1],[93,62,18,1],[93,63,18,1],[92,64,18,1],[92,65,18,1],[92,66,18,1],[91,67,18,1],[91,68,18,1],[91,69,18,1],[90,70,18,1],[90,71,18,1],[90,72,18,1],[90,73,18,1],[89,74,18,1],[89,75,18,1],[89,76,18,1],[88,77,18,1],[88,78,18,1],[88,79,18,1],[87,80,18,1],[87,81,18,1],[87,82,18,1],[87,83,18,1],[111,56,13,5],[123,56,4,14],[109,68,15,4],[114,61,9,8,1],[99,27,6,6],[174,26,5,9],[132,23,6,12],[134,25,2,6,1],[138,48,40,6],[96,54,26,16],[100,58,18,8,1]],
 "Ruger Mk IV":[[90,33,48,18],[138,36,43,12],[180,34,6,16],[172,31,4,5],[90,30,60,6],[93,60,18,1],[93,61,18,1],[93,62,18,1],[93,63,18,1],[92,64,18,1],[92,65,18,1],[92,66,18,1],[91,67,18,1],[91,68,18,1],[91,69,18,1],[90,70,18,1],[90,71,18,1],[90,72,18,1],[90,73,18,1],[89,74,18,1],[89,75,18,1],[89,76,18,1],[88,77,18,1],[88,78,18,1],[88,79,18,1],[87,80,18,1],[87,81,18,1],[87,82,18,1],[87,83,18,1],[111,56,13,5],[123,56,4,14],[109,68,15,4],[114,61,9,8,1],[99,27,6,6],[174,26,5,9],[132,23,6,12],[134,25,2,6,1]],
 "Revolver Mle 1892":[[126,36,42,9],[168,34,6,13],[160,32,4,5],[96,31,32,11],[104,33,22,22],[107,37,3,14,1],[113,37,3,14,1],[119,37,3,14,1],[88,30,16,20],[86,26,5,9],[92,56,18,1],[91,57,18,1],[91,58,18,1],[90,59,18,1],[90,60,18,1],[89,61,18,1],[89,62,18,1],[88,63,18,1],[88,64,18,1],[87,65,18,1],[86,66,18,1],[86,67,18,1],[85,68,18,1],[85,69,18,1],[84,70,18,1],[84,71,18,1],[83,72,18,1],[83,73,18,1],[82,74,18,1],[82,75,18,1],[81,76,18,1],[80,77,18,1],[80,78,18,1],[79,79,18,1],[79,80,18,1],[78,81,18,1],[78,82,18,1],[77,83,18,1],[104,56,13,5],[116,56,4,14],[102,68,15,4],[107,61,9,8,1]],
 "Manurhin MR73":[[126,36,52,9],[178,34,6,13],[170,32,4,5],[96,31,32,11],[104,33,22,22],[107,37,3,14,1],[113,37,3,14,1],[119,37,3,14,1],[88,30,16,20],[86,26,5,9],[126,49,34,4],[92,56,18,1],[91,57,18,1],[91,58,18,1],[90,59,18,1],[90,60,18,1],[89,61,18,1],[89,62,18,1],[88,63,18,1],[88,64,18,1],[87,65,18,1],[86,66,18,1],[86,67,18,1],[85,68,18,1],[85,69,18,1],[84,70,18,1],[84,71,18,1],[83,72,18,1],[83,73,18,1],[82,74,18,1],[82,75,18,1],[81,76,18,1],[80,77,18,1],[80,78,18,1],[79,79,18,1],[79,80,18,1],[78,81,18,1],[78,82,18,1],[77,83,18,1],[104,56,13,5],[116,56,4,14],[102,68,15,4],[107,61,9,8,1]],
 "S&W 686":[[126,36,60,9],[186,34,6,13],[178,32,4,5],[96,31,32,11],[104,33,22,22],[107,37,3,14,1],[113,37,3,14,1],[119,37,3,14,1],[88,30,16,20],[86,26,5,9],[126,49,34,4],[92,56,18,1],[91,57,18,1],[91,58,18,1],[90,59,18,1],[90,60,18,1],[89,61,18,1],[89,62,18,1],[88,63,18,1],[88,64,18,1],[87,65,18,1],[86,66,18,1],[86,67,18,1],[85,68,18,1],[85,69,18,1],[84,70,18,1],[84,71,18,1],[83,72,18,1],[83,73,18,1],[82,74,18,1],[82,75,18,1],[81,76,18,1],[80,77,18,1],[80,78,18,1],[79,79,18,1],[79,80,18,1],[78,81,18,1],[78,82,18,1],[77,83,18,1],[104,56,13,5],[116,56,4,14],[102,68,15,4],[107,61,9,8,1]],
 "MAS-38":[[54,33,66,21],[120,38,43,9],[162,36,6,13],[154,33,4,5],[10,28,46,26],[18,54,32,12],[8,30,4,22],[20,34,15,7,1],[84,54,15,26],[88,59,7,17,1],[72,56,15,1],[72,57,15,1],[71,58,15,1],[71,59,15,1],[71,60,15,1],[70,61,15,1],[70,62,15,1],[70,63,15,1],[69,64,15,1],[69,65,15,1],[68,66,15,1],[68,67,15,1],[68,68,15,1],[67,69,15,1],[67,70,15,1],[67,71,15,1],[66,72,15,1],[66,73,15,1],[66,74,15,1],[65,75,15,1],[65,76,15,1],[65,77,15,1],[64,78,15,1],[88,56,13,5],[100,56,4,14],[86,68,15,4],[91,61,9,8,1]],
 "MAT-49":[[60,33,60,21],[120,38,49,9],[168,36,6,13],[160,33,4,5],[18,30,8,26],[24,32,42,5],[24,48,42,5],[48,51,12,14],[84,54,18,30],[88,60,10,22,1],[66,56,15,1],[66,57,15,1],[65,58,15,1],[65,59,15,1],[65,60,15,1],[64,61,15,1],[64,62,15,1],[64,63,15,1],[64,64,15,1],[63,65,15,1],[63,66,15,1],[63,67,15,1],[62,68,15,1],[62,69,15,1],[62,70,15,1],[62,71,15,1],[61,72,15,1],[61,73,15,1],[61,74,15,1],[60,75,15,1],[60,76,15,1],[60,77,15,1],[59,78,15,1],[59,79,15,1],[59,80,15,1],[82,56,13,5],[94,56,4,14],[80,68,15,4],[85,61,9,8,1]],
 "Hotchkiss Universal":[[66,33,54,21],[120,39,37,7],[156,37,6,10],[148,34,4,5],[24,30,8,26],[30,32,42,5],[30,48,42,5],[52,51,12,14],[90,54,15,24],[94,59,7,15,1],[76,56,15,1],[76,57,15,1],[75,58,15,1],[75,59,15,1],[75,60,15,1],[74,61,15,1],[74,62,15,1],[74,63,15,1],[74,64,15,1],[73,65,15,1],[73,66,15,1],[73,67,15,1],[72,68,15,1],[72,69,15,1],[72,70,15,1],[72,71,15,1],[71,72,15,1],[71,73,15,1],[71,74,15,1],[70,75,15,1],[70,76,15,1],[70,77,15,1],[69,78,15,1],[69,79,15,1],[90,56,13,5],[102,56,4,14],[88,68,15,4],[93,61,9,8,1]],
 "MP5":[[60,33,60,21],[120,36,42,15],[127,41,6,5,1],[141,41,6,5,1],[155,41,6,5,1],[162,38,19,9],[180,36,6,13],[172,33,4,5],[60,30,42,6],[12,32,8,22],[18,36,48,13],[24,40,34,5,1],[90,54,15,1],[90,55,15,1],[90,56,15,1],[90,57,15,1],[90,58,15,1],[90,59,15,1],[90,60,15,1],[91,61,15,1],[91,62,15,1],[91,63,15,1],[92,64,15,1],[92,65,15,1],[93,66,15,1],[93,67,15,1],[94,68,15,1],[94,69,15,1],[95,70,15,1],[96,71,15,1],[97,72,15,1],[97,73,15,1],[98,74,15,1],[99,75,15,1],[100,76,15,1],[101,77,15,1],[102,78,15,1],[103,79,15,1],[104,80,15,1],[106,81,15,1],[107,82,15,1],[108,83,15,1],[78,60,15,1],[78,61,15,1],[78,62,15,1],[78,63,15,1],[78,64,15,1],[77,65,15,1],[77,66,15,1],[77,67,15,1],[77,68,15,1],[76,69,15,1],[76,70,15,1],[76,71,15,1],[76,72,15,1],[76,73,15,1],[75,74,15,1],[75,75,15,1],[75,76,15,1],[75,77,15,1],[74,78,15,1],[74,79,15,1],[74,80,15,1],[74,81,15,1],[74,82,15,1],[73,83,15,1],[93,56,13,5],[105,56,4,14],[91,68,15,4],[96,61,9,8,1],[102,18,36,8],[102,26,7,10],[131,26,7,10]],
 "HK UMP9":[[60,33,60,21],[120,36,42,15],[127,41,6,5,1],[141,41,6,5,1],[155,41,6,5,1],[162,38,19,9],[180,36,6,13],[172,33,4,5],[60,30,42,6],[12,32,8,22],[18,36,48,13],[24,40,34,5,1],[90,54,15,1],[90,55,15,1],[90,56,15,1],[90,57,15,1],[90,58,15,1],[90,59,15,1],[90,60,15,1],[91,61,15,1],[91,62,15,1],[91,63,15,1],[92,64,15,1],[92,65,15,1],[93,66,15,1],[93,67,15,1],[94,68,15,1],[94,69,15,1],[95,70,15,1],[96,71,15,1],[97,72,15,1],[97,73,15,1],[98,74,15,1],[99,75,15,1],[100,76,15,1],[101,77,15,1],[102,78,15,1],[103,79,15,1],[104,80,15,1],[106,81,15,1],[107,82,15,1],[108,83,15,1],[78,60,15,1],[78,61,15,1],[78,62,15,1],[78,63,15,1],[78,64,15,1],[77,65,15,1],[77,66,15,1],[77,67,15,1],[77,68,15,1],[76,69,15,1],[76,70,15,1],[76,71,15,1],[76,72,15,1],[76,73,15,1],[75,74,15,1],[75,75,15,1],[75,76,15,1],[75,77,15,1],[74,78,15,1],[74,79,15,1],[74,80,15,1],[74,81,15,1],[74,82,15,1],[73,83,15,1],[93,56,13,5],[105,56,4,14],[91,68,15,4],[96,61,9,8,1],[102,26,7,10],[131,26,7,10]],
 "FAMAS F1":[[30,33,108,21],[138,38,43,9],[180,36,6,13],[172,33,4,5],[42,15,90,9],[48,24,9,9],[120,24,9,9],[48,54,24,15],[96,60,15,1],[96,61,15,1],[96,62,15,1],[96,63,15,1],[95,64,15,1],[95,65,15,1],[95,66,15,1],[95,67,15,1],[94,68,15,1],[94,69,15,1],[94,70,15,1],[94,71,15,1],[93,72,15,1],[93,73,15,1],[93,74,15,1],[93,75,15,1],[92,76,15,1],[92,77,15,1],[92,78,15,1],[92,79,15,1],[91,80,15,1],[91,81,15,1],[91,82,15,1],[91,83,15,1],[111,56,13,5],[123,56,4,14],[109,68,15,4],[114,61,9,8,1],[132,48,12,15]],
 "FAMAS G2":[[30,33,108,21],[138,38,43,9],[180,36,6,13],[172,33,4,5],[42,15,90,9],[48,24,9,9],[120,24,9,9],[96,60,15,1],[96,61,15,1],[96,62,15,1],[96,63,15,1],[95,64,15,1],[95,65,15,1],[95,66,15,1],[95,67,15,1],[94,68,15,1],[94,69,15,1],[94,70,15,1],[94,71,15,1],[93,72,15,1],[93,73,15,1],[93,74,15,1],[93,75,15,1],[92,76,15,1],[92,77,15,1],[92,78,15,1],[92,79,15,1],[91,80,15,1],[91,81,15,1],[91,82,15,1],[91,83,15,1],[111,56,13,5],[123,56,4,14],[109,68,15,4],[114,61,9,8,1],[132,48,12,15],[48,54,24,21],[52,59,16,11,1]],
 "HK416F":[[60,33,54,21],[114,36,42,15],[121,41,6,5,1],[135,41,6,5,1],[149,41,6,5,1],[156,38,25,9],[180,36,6,13],[172,33,4,5],[12,32,8,22],[18,36,48,13],[24,40,34,5,1],[60,29,60,5],[64,30,4,3,1],[74,30,4,3,1],[84,30,4,3,1],[94,30,4,3,1],[104,30,4,3,1],[114,30,4,3,1],[90,54,15,1],[90,55,15,1],[90,56,15,1],[90,57,15,1],[90,58,15,1],[90,59,15,1],[90,60,15,1],[91,61,15,1],[91,62,15,1],[91,63,15,1],[92,64,15,1],[92,65,15,1],[93,66,15,1],[93,67,15,1],[94,68,15,1],[94,69,15,1],[95,70,15,1],[96,71,15,1],[97,72,15,1],[97,73,15,1],[98,74,15,1],[99,75,15,1],[100,76,15,1],[101,77,15,1],[102,78,15,1],[103,79,15,1],[104,80,15,1],[106,81,15,1],[107,82,15,1],[108,83,15,1],[72,60,15,1],[72,61,15,1],[72,62,15,1],[71,63,15,1],[71,64,15,1],[71,65,15,1],[70,66,15,1],[70,67,15,1],[70,68,15,1],[69,69,15,1],[69,70,15,1],[69,71,15,1],[68,72,15,1],[68,73,15,1],[68,74,15,1],[67,75,15,1],[67,76,15,1],[67,77,15,1],[66,78,15,1],[66,79,15,1],[66,80,15,1],[65,81,15,1],[65,82,15,1],[65,83,15,1],[87,56,13,5],[99,56,4,14],[85,68,15,4],[90,61,9,8,1],[120,51,12,12],[168,26,5,9],[66,23,6,12],[68,25,2,6,1]],
 "Kalachnikov WBP Jack":[[60,33,60,21],[114,26,42,7],[120,28,28,3,1],[156,38,25,9],[180,36,6,13],[172,33,4,5],[114,33,30,18],[12,28,54,26],[20,54,40,12],[10,30,4,22],[22,34,18,7,1],[72,60,15,1],[72,61,15,1],[72,62,15,1],[71,63,15,1],[71,64,15,1],[71,65,15,1],[70,66,15,1],[70,67,15,1],[70,68,15,1],[69,69,15,1],[69,70,15,1],[69,71,15,1],[68,72,15,1],[68,73,15,1],[68,74,15,1],[67,75,15,1],[67,76,15,1],[67,77,15,1],[66,78,15,1],[66,79,15,1],[66,80,15,1],[65,81,15,1],[65,82,15,1],[65,83,15,1],[87,56,13,5],[99,56,4,14],[85,68,15,4],[90,61,9,8,1],[150,24,9,12],[60,27,12,6],[90,54,16,15],[94,58,8,8,1]],
 "Ruger Mini-14":[[48,33,60,18],[108,38,61,9],[168,36,6,13],[160,33,4,5],[0,28,50,26],[8,54,36,12],[0,30,4,22],[10,34,16,7,1],[78,51,18,16],[82,55,10,8,1],[54,51,48,6],[96,30,9,9]],
 "Chiappa M1-22":[[54,36,54,15],[108,39,55,6],[162,37,6,10],[154,34,4,5],[6,28,48,26],[14,54,34,12],[4,30,4,22],[16,34,16,7,1],[78,51,15,18],[82,55,7,10,1],[60,51,42,5],[96,33,8,8]],
 "Verney-Carron Impact":[[42,33,60,18],[102,38,67,9],[168,36,6,13],[160,33,4,5],[0,28,44,26],[8,54,30,12],[0,30,4,22],[10,34,14,7,1],[72,51,18,9],[48,51,48,6],[90,30,9,9]],
 "Chauchat CSRG 1915":[[42,30,78,24],[120,38,49,9],[168,36,6,13],[160,33,4,5],[0,28,48,26],[8,54,34,12],[0,30,4,22],[10,34,16,7,1],[96,24,24,6],[72,54,42,9],[66,60,48,9],[62,66,44,8],[70,63,32,6,1],[56,60,15,1],[56,61,15,1],[56,62,15,1],[55,63,15,1],[55,64,15,1],[55,65,15,1],[55,66,15,1],[55,67,15,1],[54,68,15,1],[54,69,15,1],[54,70,15,1],[54,71,15,1],[54,72,15,1],[53,73,15,1],[53,74,15,1],[53,75,15,1],[53,76,15,1],[53,77,15,1],[52,78,15,1],[52,79,15,1],[52,80,15,1],[52,81,15,1],[52,82,15,1],[51,83,15,1],[70,56,13,5],[82,56,4,14],[68,68,15,4],[73,61,9,8,1],[126,51,12,12]],
 "Hotchkiss Mle 1914":[[24,33,120,24],[144,36,25,12],[168,34,6,16],[160,31,4,5],[120,30,4,3,1],[127,30,4,3,1],[134,30,4,3,1],[141,30,4,3,1],[148,30,4,3,1],[155,30,4,3,1],[162,30,4,3,1],[6,33,18,24],[24,60,30,9],[60,54,48,27],[65,59,38,17,1],[104,56,10,6],[90,24,42,6],[96,26,30,2,1],[126,54,5,1],[138,54,5,1],[126,55,5,1],[138,55,5,1],[125,56,5,1],[139,56,5,1],[124,57,5,1],[140,57,5,1],[124,58,5,1],[140,58,5,1],[124,59,5,1],[140,59,5,1],[123,60,5,1],[141,60,5,1],[122,61,5,1],[142,61,5,1],[122,62,5,1],[142,62,5,1],[122,63,5,1],[142,63,5,1],[121,64,5,1],[143,64,5,1],[120,65,5,1],[144,65,5,1],[120,66,5,1],[144,66,5,1],[120,67,5,1],[144,67,5,1],[119,68,5,1],[145,68,5,1],[118,69,5,1],[146,69,5,1],[118,70,5,1],[146,70,5,1],[118,71,5,1],[146,71,5,1],[117,72,5,1],[147,72,5,1],[116,73,5,1],[148,73,5,1],[116,74,5,1],[148,74,5,1],[116,75,5,1],[148,75,5,1],[115,76,5,1],[149,76,5,1],[114,77,5,1],[150,77,5,1],[112,78,12,4],[148,78,12,4],[174,33,18,21]],
 "FM 24/29":[[42,33,78,21],[120,38,49,9],[168,36,6,13],[160,33,4,5],[0,28,48,26],[8,54,34,12],[0,30,4,22],[10,34,16,7,1],[78,15,21,18],[82,19,13,10,1],[60,56,15,1],[60,57,15,1],[60,58,15,1],[59,59,15,1],[59,60,15,1],[59,61,15,1],[58,62,15,1],[58,63,15,1],[58,64,15,1],[58,65,15,1],[58,66,15,1],[57,67,15,1],[57,68,15,1],[57,69,15,1],[56,70,15,1],[56,71,15,1],[56,72,15,1],[56,73,15,1],[56,74,15,1],[55,75,15,1],[55,76,15,1],[55,77,15,1],[54,78,15,1],[54,79,15,1],[54,80,15,1],[54,81,15,1],[54,82,15,1],[53,83,15,1],[74,56,13,5],[86,56,4,14],[72,68,15,4],[77,61,9,8,1],[126,51,12,12]],
 "AA-52":[[36,30,84,24],[132,38,49,9],[180,36,6,13],[172,33,4,5],[120,26,42,7],[126,28,28,3,1],[0,28,42,26],[8,54,28,12],[0,30,4,22],[10,34,14,7,1],[66,54,42,24],[71,59,32,14,1],[104,56,10,6],[48,60,15,1],[48,61,15,1],[48,62,15,1],[48,63,15,1],[47,64,15,1],[47,65,15,1],[47,66,15,1],[47,67,15,1],[46,68,15,1],[46,69,15,1],[46,70,15,1],[46,71,15,1],[45,72,15,1],[45,73,15,1],[45,74,15,1],[45,75,15,1],[44,76,15,1],[44,77,15,1],[44,78,15,1],[44,79,15,1],[43,80,15,1],[43,81,15,1],[43,82,15,1],[43,83,15,1],[63,56,13,5],[75,56,4,14],[61,68,15,4],[66,61,9,8,1],[84,18,36,8],[84,26,7,10],[113,26,7,10],[150,54,5,1],[162,54,5,1],[150,55,5,1],[162,55,5,1],[149,56,5,1],[163,56,5,1],[149,57,5,1],[163,57,5,1],[148,58,5,1],[164,58,5,1],[148,59,5,1],[164,59,5,1],[147,60,5,1],[165,60,5,1],[147,61,5,1],[165,61,5,1],[146,62,5,1],[166,62,5,1],[146,63,5,1],[166,63,5,1],[145,64,5,1],[167,64,5,1],[144,65,5,1],[168,65,5,1],[144,66,5,1],[168,66,5,1],[143,67,5,1],[169,67,5,1],[143,68,5,1],[169,68,5,1],[142,69,5,1],[170,69,5,1],[142,70,5,1],[170,70,5,1],[141,71,5,1],[171,71,5,1],[141,72,5,1],[171,72,5,1],[140,73,5,1],[172,73,5,1],[139,74,5,1],[173,74,5,1],[139,75,5,1],[173,75,5,1],[138,76,5,1],[174,76,5,1],[138,77,5,1],[174,77,5,1],[136,78,12,4],[172,78,12,4]],
 "Minimi 5,56":[[42,30,72,24],[138,38,43,9],[180,36,6,13],[172,33,4,5],[114,33,24,18],[114,26,36,7],[120,28,22,3,1],[6,32,8,22],[12,36,36,13],[18,40,22,5,1],[72,54,42,27],[77,59,32,17,1],[110,56,10,6],[54,60,15,1],[54,61,15,1],[54,62,15,1],[54,63,15,1],[53,64,15,1],[53,65,15,1],[53,66,15,1],[53,67,15,1],[52,68,15,1],[52,69,15,1],[52,70,15,1],[52,71,15,1],[51,72,15,1],[51,73,15,1],[51,74,15,1],[51,75,15,1],[50,76,15,1],[50,77,15,1],[50,78,15,1],[50,79,15,1],[49,80,15,1],[49,81,15,1],[49,82,15,1],[49,83,15,1],[69,56,13,5],[81,56,4,14],[67,68,15,4],[72,61,9,8,1],[90,18,36,8],[90,26,7,10],[119,26,7,10],[144,54,5,1],[156,54,5,1],[144,55,5,1],[156,55,5,1],[143,56,5,1],[157,56,5,1],[143,57,5,1],[157,57,5,1],[142,58,5,1],[158,58,5,1],[142,59,5,1],[158,59,5,1],[141,60,5,1],[159,60,5,1],[141,61,5,1],[159,61,5,1],[140,62,5,1],[160,62,5,1],[140,63,5,1],[160,63,5,1],[139,64,5,1],[161,64,5,1],[138,65,5,1],[162,65,5,1],[138,66,5,1],[162,66,5,1],[137,67,5,1],[163,67,5,1],[137,68,5,1],[163,68,5,1],[136,69,5,1],[164,69,5,1],[136,70,5,1],[164,70,5,1],[135,71,5,1],[165,71,5,1],[135,72,5,1],[165,72,5,1],[134,73,5,1],[166,73,5,1],[133,74,5,1],[167,74,5,1],[133,75,5,1],[167,75,5,1],[132,76,5,1],[168,76,5,1],[132,77,5,1],[168,77,5,1],[130,78,12,4],[166,78,12,4]],
 "Browning M2":[[18,33,126,24],[144,36,25,12],[168,34,6,16],[160,31,4,5],[144,36,12,15],[60,54,48,27],[65,59,38,17,1],[104,56,10,6],[6,33,18,24],[24,60,30,9],[174,33,18,21],[132,54,5,1],[144,54,5,1],[132,55,5,1],[144,55,5,1],[131,56,5,1],[145,56,5,1],[131,57,5,1],[145,57,5,1],[130,58,5,1],[146,58,5,1],[130,59,5,1],[146,59,5,1],[129,60,5,1],[147,60,5,1],[129,61,5,1],[147,61,5,1],[128,62,5,1],[148,62,5,1],[128,63,5,1],[148,63,5,1],[127,64,5,1],[149,64,5,1],[126,65,5,1],[150,65,5,1],[126,66,5,1],[150,66,5,1],[125,67,5,1],[151,67,5,1],[125,68,5,1],[151,68,5,1],[124,69,5,1],[152,69,5,1],[124,70,5,1],[152,70,5,1],[123,71,5,1],[153,71,5,1],[123,72,5,1],[153,72,5,1],[122,73,5,1],[154,73,5,1],[121,74,5,1],[155,74,5,1],[121,75,5,1],[155,75,5,1],[120,76,5,1],[156,76,5,1],[120,77,5,1],[156,77,5,1],[118,78,12,4],[154,78,12,4]],
 "Manufrance Falcor":[[54,33,48,21],[102,38,73,9],[174,36,6,13],[166,33,4,5],[6,28,54,26],[14,54,40,12],[4,30,4,22],[16,34,18,7,1],[114,51,36,13],[119,54,4,7,1],[130,54,4,7,1],[141,54,4,7,1],[102,51,66,9],[78,27,12,6]],
 "Manufrance Robust":[[6,28,54,26],[14,54,40,12],[4,30,4,22],[16,34,18,7,1],[60,33,42,21],[102,36,80,13],[180,34,6,17],[102,41,80,3,1],[96,30,12,6],[84,56,13,5],[96,56,4,14],[82,68,15,4],[87,61,9,8,1]],
 "Verney-Carron Veloce":[[54,33,48,21],[102,38,79,9],[180,36,6,13],[172,33,4,5],[6,28,54,26],[14,54,40,12],[4,30,4,22],[16,34,18,7,1],[114,51,36,13],[119,54,4,7,1],[130,54,4,7,1],[141,54,4,7,1],[102,51,72,9],[174,26,5,9],[96,23,6,12],[98,25,2,6,1]],
 "Verney-Carron VCD10":[[54,33,54,21],[108,38,73,9],[180,36,6,13],[172,33,4,5],[6,32,8,22],[12,36,48,13],[18,40,34,5,1],[108,51,66,9],[66,60,15,1],[66,61,15,1],[66,62,15,1],[66,63,15,1],[66,64,15,1],[65,65,15,1],[65,66,15,1],[65,67,15,1],[65,68,15,1],[64,69,15,1],[64,70,15,1],[64,71,15,1],[64,72,15,1],[64,73,15,1],[63,74,15,1],[63,75,15,1],[63,76,15,1],[63,77,15,1],[62,78,15,1],[62,79,15,1],[62,80,15,1],[62,81,15,1],[62,82,15,1],[61,83,15,1],[81,56,13,5],[93,56,4,14],[79,68,15,4],[84,61,9,8,1],[60,29,42,5],[64,30,4,3,1],[74,30,4,3,1],[84,30,4,3,1],[94,30,4,3,1],[174,26,5,9],[66,23,6,12],[68,25,2,6,1]],
 "Remington 870":[[54,33,48,21],[102,38,79,9],[180,36,6,13],[172,33,4,5],[6,28,54,26],[14,54,40,12],[4,30,4,22],[16,34,18,7,1],[114,51,36,13],[119,54,4,7,1],[130,54,4,7,1],[141,54,4,7,1],[102,51,72,9],[174,26,5,9],[96,23,6,12],[98,25,2,6,1]],
 "Browning B525":[[6,28,54,26],[14,54,40,12],[4,30,4,22],[16,34,18,7,1],[60,33,42,21],[102,34,80,8],[102,44,80,8],[180,32,6,22],[96,30,12,6],[84,56,13,5],[96,56,4,14],[82,68,15,4],[87,61,9,8,1]],
 "Lebel Mle 1886":[[42,33,54,18],[96,38,85,9],[180,36,6,13],[172,33,4,5],[0,28,48,26],[8,54,34,12],[0,30,4,22],[10,34,16,7,1],[60,54,21,12],[90,30,9,9],[48,51,60,9],[174,26,5,9],[90,23,6,12],[92,25,2,6,1]],
 "Berthier 1907/15":[[42,33,54,18],[96,38,85,9],[180,36,6,13],[172,33,4,5],[0,28,48,26],[8,54,34,12],[0,30,4,22],[10,34,16,7,1],[66,54,18,9],[90,30,9,9],[48,51,66,9],[174,26,5,9],[90,23,6,12],[92,25,2,6,1]],
 "MAS-36":[[42,33,54,18],[96,38,73,9],[168,36,6,13],[160,33,4,5],[0,28,48,26],[8,54,34,12],[0,30,4,22],[10,34,16,7,1],[66,54,21,18],[70,60,13,8,1],[90,30,9,9],[48,51,54,9],[162,26,5,9],[90,23,6,12],[92,25,2,6,1]],
 "FR-F1":[[42,33,54,18],[96,39,79,6],[174,37,6,10],[166,34,4,5],[0,28,48,26],[8,54,34,12],[0,30,4,22],[10,34,16,7,1],[66,54,18,15],[70,60,10,5,1],[74,21,44,10],[66,18,12,16],[114,18,12,16],[93,14,10,6],[80,31,7,8],[105,31,7,8],[66,54,18,18],[70,59,10,9,1],[134,54,5,1],[146,54,5,1],[134,55,5,1],[146,55,5,1],[133,56,5,1],[147,56,5,1],[132,57,5,1],[148,57,5,1],[132,58,5,1],[148,58,5,1],[132,59,5,1],[148,59,5,1],[131,60,5,1],[149,60,5,1],[130,61,5,1],[150,61,5,1],[130,62,5,1],[150,62,5,1],[130,63,5,1],[150,63,5,1],[129,64,5,1],[151,64,5,1],[128,65,5,1],[152,65,5,1],[128,66,5,1],[152,66,5,1],[128,67,5,1],[152,67,5,1],[127,68,5,1],[153,68,5,1],[126,69,5,1],[154,69,5,1],[126,70,5,1],[154,70,5,1],[126,71,5,1],[154,71,5,1],[125,72,5,1],[155,72,5,1],[124,73,5,1],[156,73,5,1],[122,74,12,4],[154,74,12,4]],
 "Chapuis ROLS":[[42,33,54,18],[96,39,79,6],[174,37,6,10],[166,34,4,5],[0,28,48,26],[8,54,34,12],[0,30,4,22],[10,34,16,7,1],[66,54,18,15],[70,60,10,5,1],[74,21,44,10],[66,18,12,16],[114,18,12,16],[93,14,10,6],[80,31,7,8],[105,31,7,8]],
 "CZ 457":[[48,36,54,15],[102,39,67,6],[168,37,6,10],[160,34,4,5],[6,28,48,26],[14,54,34,12],[4,30,4,22],[16,34,16,7,1],[78,54,15,15],[82,60,7,5,1],[86,24,32,10],[78,21,12,16],[114,21,12,16],[99,17,10,6],[92,34,7,8],[105,34,7,8]],
 "Unique T66":[[48,36,54,15],[102,39,67,6],[168,37,6,10],[160,34,4,5],[6,28,48,26],[14,54,34,12],[4,30,4,22],[16,34,16,7,1],[78,54,15,15],[82,60,7,5,1],[86,24,32,10],[78,21,12,16],[114,21,12,16],[99,17,10,6],[92,34,7,8],[105,34,7,8],[6,22,30,8],[42,24,18,6],[150,42,24,5]],
 "Ruger 10/22":[[48,36,54,15],[102,39,67,6],[168,37,6,10],[160,34,4,5],[6,28,48,26],[14,54,34,12],[4,30,4,22],[16,34,16,7,1],[78,54,15,15],[82,60,7,5,1],[86,24,32,10],[78,21,12,16],[114,21,12,16],[99,17,10,6],[92,34,7,8],[105,34,7,8],[72,51,16,8]],
 "RSC Mle 1917":[[42,33,54,18],[96,38,85,9],[180,36,6,13],[172,33,4,5],[0,28,48,26],[8,54,34,12],[0,30,4,22],[10,34,16,7,1],[66,54,18,9],[90,30,9,9],[48,51,66,9],[174,26,5,9],[90,23,6,12],[92,25,2,6,1],[66,54,20,14],[70,58,12,7,1],[108,48,36,5]],
 "MAS-49/56":[[42,33,66,21],[108,38,67,9],[174,36,6,13],[166,33,4,5],[0,28,48,26],[8,54,34,12],[0,30,4,22],[10,34,16,7,1],[78,54,18,27],[82,60,10,17,1],[80,21,32,10],[72,18,12,16],[108,18,12,16],[93,14,10,6],[86,31,7,8],[99,31,7,8],[48,51,54,6]],
 "FR-F2":[[42,33,72,21],[114,38,67,9],[180,36,6,13],[172,33,4,5],[0,30,18,27],[12,33,36,6],[12,48,36,6],[42,30,12,27],[78,54,21,18],[82,60,13,8,1],[60,60,15,1],[60,61,15,1],[60,62,15,1],[60,63,15,1],[60,64,15,1],[59,65,15,1],[59,66,15,1],[59,67,15,1],[59,68,15,1],[58,69,15,1],[58,70,15,1],[58,71,15,1],[58,72,15,1],[58,73,15,1],[57,74,15,1],[57,75,15,1],[57,76,15,1],[57,77,15,1],[56,78,15,1],[56,79,15,1],[56,80,15,1],[56,81,15,1],[56,82,15,1],[55,83,15,1],[75,56,13,5],[87,56,4,14],[73,68,15,4],[78,61,9,8,1],[80,18,50,10],[72,15,12,16],[126,15,12,16],[101,11,10,6],[86,28,7,8],[117,28,7,8],[150,54,5,1],[162,54,5,1],[150,55,5,1],[162,55,5,1],[149,56,5,1],[163,56,5,1],[149,57,5,1],[163,57,5,1],[148,58,5,1],[164,58,5,1],[148,59,5,1],[164,59,5,1],[147,60,5,1],[165,60,5,1],[147,61,5,1],[165,61,5,1],[146,62,5,1],[166,62,5,1],[146,63,5,1],[166,63,5,1],[145,64,5,1],[167,64,5,1],[144,65,5,1],[168,65,5,1],[144,66,5,1],[168,66,5,1],[143,67,5,1],[169,67,5,1],[143,68,5,1],[169,68,5,1],[142,69,5,1],[170,69,5,1],[142,70,5,1],[170,70,5,1],[141,71,5,1],[171,71,5,1],[141,72,5,1],[171,72,5,1],[140,73,5,1],[172,73,5,1],[139,74,5,1],[173,74,5,1],[139,75,5,1],[173,75,5,1],[138,76,5,1],[174,76,5,1],[138,77,5,1],[174,77,5,1],[136,78,12,4],[172,78,12,4]],
 "HK417":[[54,33,60,21],[114,36,42,15],[121,41,6,5,1],[135,41,6,5,1],[149,41,6,5,1],[156,39,25,6],[180,37,6,10],[172,34,4,5],[6,32,8,22],[12,36,48,13],[18,40,34,5,1],[54,29,66,5],[58,30,4,3,1],[68,30,4,3,1],[78,30,4,3,1],[88,30,4,3,1],[98,30,4,3,1],[108,30,4,3,1],[90,54,18,1],[90,55,18,1],[90,56,18,1],[90,57,18,1],[90,58,18,1],[90,59,18,1],[90,60,18,1],[91,61,18,1],[91,62,18,1],[91,63,18,1],[92,64,18,1],[92,65,18,1],[93,66,18,1],[93,67,18,1],[94,68,18,1],[94,69,18,1],[95,70,18,1],[96,71,18,1],[97,72,18,1],[97,73,18,1],[98,74,18,1],[99,75,18,1],[100,76,18,1],[101,77,18,1],[102,78,18,1],[103,79,18,1],[104,80,18,1],[106,81,18,1],[107,82,18,1],[108,83,18,1],[72,60,15,1],[72,61,15,1],[72,62,15,1],[71,63,15,1],[71,64,15,1],[71,65,15,1],[70,66,15,1],[70,67,15,1],[70,68,15,1],[69,69,15,1],[69,70,15,1],[69,71,15,1],[68,72,15,1],[68,73,15,1],[68,74,15,1],[67,75,15,1],[67,76,15,1],[67,77,15,1],[66,78,15,1],[66,79,15,1],[66,80,15,1],[65,81,15,1],[65,82,15,1],[65,83,15,1],[87,56,13,5],[99,56,4,14],[85,68,15,4],[90,61,9,8,1],[92,18,32,10],[84,15,12,16],[120,15,12,16],[105,11,10,6],[98,28,7,8],[111,28,7,8],[126,51,12,12]],
 "FN SCAR-H PR":[[48,33,66,21],[114,36,42,15],[121,41,6,5,1],[135,41,6,5,1],[149,41,6,5,1],[156,39,25,6],[180,37,6,10],[172,34,4,5],[6,32,8,22],[12,36,42,13],[18,40,28,5,1],[48,29,72,5],[52,30,4,3,1],[62,30,4,3,1],[72,30,4,3,1],[82,30,4,3,1],[92,30,4,3,1],[102,30,4,3,1],[112,30,4,3,1],[84,54,18,30],[88,60,10,20,1],[66,60,15,1],[66,61,15,1],[66,62,15,1],[65,63,15,1],[65,64,15,1],[65,65,15,1],[64,66,15,1],[64,67,15,1],[64,68,15,1],[63,69,15,1],[63,70,15,1],[63,71,15,1],[62,72,15,1],[62,73,15,1],[62,74,15,1],[61,75,15,1],[61,76,15,1],[61,77,15,1],[60,78,15,1],[60,79,15,1],[60,80,15,1],[59,81,15,1],[59,82,15,1],[59,83,15,1],[81,56,13,5],[93,56,4,14],[79,68,15,4],[84,61,9,8,1],[86,18,38,10],[78,15,12,16],[120,15,12,16],[102,11,10,6],[92,28,7,8],[111,28,7,8]],
 "PGM Ultima Ratio":[[42,33,72,21],[114,38,67,9],[180,36,6,13],[172,33,4,5],[0,30,18,27],[12,33,36,6],[12,48,36,6],[42,30,12,27],[78,54,21,18],[82,60,13,8,1],[60,60,15,1],[60,61,15,1],[60,62,15,1],[60,63,15,1],[60,64,15,1],[59,65,15,1],[59,66,15,1],[59,67,15,1],[59,68,15,1],[58,69,15,1],[58,70,15,1],[58,71,15,1],[58,72,15,1],[58,73,15,1],[57,74,15,1],[57,75,15,1],[57,76,15,1],[57,77,15,1],[56,78,15,1],[56,79,15,1],[56,80,15,1],[56,81,15,1],[56,82,15,1],[55,83,15,1],[75,56,13,5],[87,56,4,14],[73,68,15,4],[78,61,9,8,1],[80,18,50,10],[72,15,12,16],[126,15,12,16],[101,11,10,6],[86,28,7,8],[117,28,7,8],[150,54,5,1],[162,54,5,1],[150,55,5,1],[162,55,5,1],[149,56,5,1],[163,56,5,1],[149,57,5,1],[163,57,5,1],[148,58,5,1],[164,58,5,1],[148,59,5,1],[164,59,5,1],[147,60,5,1],[165,60,5,1],[147,61,5,1],[165,61,5,1],[146,62,5,1],[166,62,5,1],[146,63,5,1],[166,63,5,1],[145,64,5,1],[167,64,5,1],[144,65,5,1],[168,65,5,1],[144,66,5,1],[168,66,5,1],[143,67,5,1],[169,67,5,1],[143,68,5,1],[169,68,5,1],[142,69,5,1],[170,69,5,1],[142,70,5,1],[170,70,5,1],[141,71,5,1],[171,71,5,1],[141,72,5,1],[171,72,5,1],[140,73,5,1],[172,73,5,1],[139,74,5,1],[173,74,5,1],[139,75,5,1],[173,75,5,1],[138,76,5,1],[174,76,5,1],[138,77,5,1],[174,77,5,1],[136,78,12,4],[172,78,12,4]],
 "PGM Mini-Hecate":[[30,33,108,24],[138,38,28,9],[165,36,6,13],[157,33,4,5],[0,36,36,18],[12,54,30,9],[78,54,24,21],[82,60,16,11,1],[60,60,18,1],[60,61,18,1],[60,62,18,1],[60,63,18,1],[59,64,18,1],[59,65,18,1],[59,66,18,1],[59,67,18,1],[58,68,18,1],[58,69,18,1],[58,70,18,1],[58,71,18,1],[57,72,18,1],[57,73,18,1],[57,74,18,1],[57,75,18,1],[56,76,18,1],[56,77,18,1],[56,78,18,1],[56,79,18,1],[55,80,18,1],[55,81,18,1],[55,82,18,1],[55,83,18,1],[78,56,13,5],[90,56,4,14],[76,68,15,4],[81,61,9,8,1],[80,18,50,10],[72,15,12,16],[126,15,12,16],[101,11,10,6],[86,28,7,8],[117,28,7,8],[120,54,5,1],[132,54,5,1],[120,55,5,1],[132,55,5,1],[119,56,5,1],[133,56,5,1],[119,57,5,1],[133,57,5,1],[118,58,5,1],[134,58,5,1],[118,59,5,1],[134,59,5,1],[117,60,5,1],[135,60,5,1],[117,61,5,1],[135,61,5,1],[116,62,5,1],[136,62,5,1],[116,63,5,1],[136,63,5,1],[115,64,5,1],[137,64,5,1],[114,65,5,1],[138,65,5,1],[114,66,5,1],[138,66,5,1],[113,67,5,1],[139,67,5,1],[113,68,5,1],[139,68,5,1],[112,69,5,1],[140,69,5,1],[112,70,5,1],[140,70,5,1],[111,71,5,1],[141,71,5,1],[111,72,5,1],[141,72,5,1],[110,73,5,1],[142,73,5,1],[109,74,5,1],[143,74,5,1],[109,75,5,1],[143,75,5,1],[108,76,5,1],[144,76,5,1],[108,77,5,1],[144,77,5,1],[106,78,12,4],[142,78,12,4],[174,33,18,21]],
 "PGM Hecate II":[[24,33,120,24],[144,36,22,12],[165,34,6,16],[157,31,4,5],[0,36,30,21],[6,57,30,9],[72,54,24,30],[76,60,16,23,1],[54,60,18,1],[54,61,18,1],[54,62,18,1],[54,63,18,1],[53,64,18,1],[53,65,18,1],[53,66,18,1],[53,67,18,1],[52,68,18,1],[52,69,18,1],[52,70,18,1],[52,71,18,1],[51,72,18,1],[51,73,18,1],[51,74,18,1],[51,75,18,1],[50,76,18,1],[50,77,18,1],[50,78,18,1],[50,79,18,1],[49,80,18,1],[49,81,18,1],[49,82,18,1],[49,83,18,1],[72,56,13,5],[84,56,4,14],[70,68,15,4],[75,61,9,8,1],[74,18,50,10],[66,15,12,16],[120,15,12,16],[95,11,10,6],[80,28,7,8],[111,28,7,8],[126,54,5,1],[138,54,5,1],[126,55,5,1],[138,55,5,1],[125,56,5,1],[139,56,5,1],[125,57,5,1],[139,57,5,1],[124,58,5,1],[140,58,5,1],[124,59,5,1],[140,59,5,1],[123,60,5,1],[141,60,5,1],[123,61,5,1],[141,61,5,1],[122,62,5,1],[142,62,5,1],[122,63,5,1],[142,63,5,1],[121,64,5,1],[143,64,5,1],[120,65,5,1],[144,65,5,1],[120,66,5,1],[144,66,5,1],[119,67,5,1],[145,67,5,1],[119,68,5,1],[145,68,5,1],[118,69,5,1],[146,69,5,1],[118,70,5,1],[146,70,5,1],[117,71,5,1],[147,71,5,1],[117,72,5,1],[147,72,5,1],[116,73,5,1],[148,73,5,1],[115,74,5,1],[149,74,5,1],[115,75,5,1],[149,75,5,1],[114,76,5,1],[150,76,5,1],[114,77,5,1],[150,77,5,1],[112,78,12,4],[148,78,12,4],[174,33,18,21],[177,27,6,6]]
};
function iconRects(w){ return WICON[w.n]||[]; }
/* L'encombrement : la longueur que l'arme occupe dans sa vignette, ramenee
   entre 0 et 1. Un fusil de precision tient toute la boite, un couteau non. */
function wBulk(w){
    var r=iconRects(w), x0=192, x1=0, i;
    for(i=0;i<r.length;i++){
        if(r[i][4]) continue;
        if(r[i][0]<x0) x0=r[i][0];
        if(r[i][0]+r[i][2]>x1) x1=r[i][0]+r[i][2];
    }
    return (x1<=x0)?0.5:(x1-x0)/192;
}
/* Les rectangles a cinq valeurs sont des decoupes : on les efface au lieu de
   les peindre. Ce sont elles qui ouvrent le pontet, fendent le garde-main,
   posent les colliers de lunette et ajourent les crosses.
   La vignette est plate et d'un seul blanc, sans ombre ni modele : c'est le
   contour et les trous qui font tout le travail. Elle est retournee au
   passage, bouche a gauche, comme le veut l'usage des vignettes d'inventaire. */
var IWHITE="#f6f4ee";
function iconDraw(g,w,ox,oy,sc,col){
    var r=iconRects(w), q, a, x;
    g.fillStyle=col||IWHITE;
    for(q=0;q<r.length;q++){
        a=r[q];
        x=192-a[0]-a[2];
        if(a[4]) g.clearRect(ox+x*sc, oy+a[1]*sc, Math.max(1,a[2]*sc), Math.max(1,a[3]*sc));
        else g.fillRect(ox+x*sc, oy+a[1]*sc, Math.max(1,a[2]*sc), Math.max(1,a[3]*sc));
    }
}
/* Les quatre emplacements d'arme : un par categorie. Cliquer ouvre la liste
   de la categorie, cliquer une arme la met dans l'emplacement. Le quatrieme
   n'a pas encore de categorie, il attend. */
/* Le maniement, de 0 a 1 : ce qui pese et ce qui encombre le font tomber. Il
   commande le temps de sortir l'arme, la vitesse a laquelle le reticule
   rattrape la souris, et la duree du rechargement. */
(function(){
    var i, w, h;
    for(i=0;i<WEAPONS.length;i++){
        w=WEAPONS[i];
        h=1-0.052*Math.min(20,w.pds)-0.62*Math.max(0,wBulk(w)-0.25);
        w.man=Math.max(0.05,Math.min(1,Math.round(h*100)/100));
    }
})();
/* ---- LA FORME D'UNE ARME ----
   Une arme prenait une case, comme une boite de conserve. Elle prend
   maintenant la place de sa famille - c'est la famille et non le poids qui
   juge ici, parce qu'une Hotchkiss de vingt-trois kilos et un Minimi de sept
   se rangent de la meme facon : en travers, sur deux rangs.
   TROIS CASES AU PLUS EN LARGEUR, pour que l'arme longue rentre dans les cinq
   sacs. Une poche de deux ou trois cases n'en prend donc aucune, et c'est
   voulu : un fusil ne tient pas dans une poche. */
var WSHAPE={
 "Lame":[1,1], "Contondant":[1,1], "Tranchant":[2,1],
 "Pistolet":[2,1], "Revolver":[2,1], "Mitraillette":[3,1],
 "Fusil d'assaut":[3,1], "Carabine":[3,1], "Fusil a pompe":[3,1],
 "Coup par coup":[3,1], "DMR":[3,1], "Sniper":[3,1],
 "Mitrailleuse":[3,2]
};
(function(){
    var i, w, s;
    for(i=0;i<WEAPONS.length;i++){
        w=WEAPONS[i]; s=WSHAPE[w.fam]||[2,1];
        w.gw=s[0]; w.gh=s[1];
    }
})();
/* ---- OBJETS ----
   Quatre familles : les sacs a dos, les vivres, les medicaments et le
   materiel. Tout ce qui n'est pas une arme se range dans le sac, une sorte
   par case, dix exemplaires au plus ; une arme prend une case a elle seule.
   pds : poids en kg.        mat : matiere premiere, pour batir la base.
   hp  : vie rendue.         dur : en secondes, 0 pour un effet immediat.
   cap : cases ouvertes par un sac.
   ic  : la vignette, dessinee dans une boite de 24 sur 24. Deux objets
   voisins peuvent partager la meme : c'est le nom et la fiche qui les
   separent. */
var STACK=10;
/* --- SACS A DOS ---
   Cinq tailles. Sans sac, deux cases seulement ; le sac remplace ce fond.
   UN SAC N'A PLUS UNE CAPACITE, IL A DES DIMENSIONS. gw sur gh, et cap n'est
   plus qu'un raccourci pour gw fois gh - on le garde parce que la moitie du
   jeu le lit, mais rien ne le pose a la main.
   LARGEUR CINQ PARTOUT, decision arretee d'avance : une seule largeur rend le
   rangement lisible d'un sac a l'autre, une arme longue de trois cases rentre
   dans tous, et la progression ne se lit que sur la hauteur. */
var BAGS=[
 {n:"Sacoche de toile",    ic:"sac1", bw:5, bh:1, pds:0.4},
 {n:"Sac d'ecolier",       ic:"sac2", bw:5, bh:2, pds:0.8},
 {n:"Sac de randonnee",    ic:"sac3", bw:5, bh:3, pds:1.3},
 {n:"Sac militaire",       ic:"sac4", bw:5, bh:4, pds:2.1},
 {n:"Sac d'expedition",    ic:"sac5", bw:5, bh:5, pds:2.9}
];
/* bw et bh, PAS gw et gh : un sac a deux formes, celle du dedans et celle
   qu'il occupe lui-meme quand on le range dans une case. Les confondre
   revenait a ce qu'un sac d'expedition tienne deux cases sur deux au lieu de
   cinq sur cinq - c'est arrive, et rien ne le disait a l'ecran. */
(function(){ var i; for(i=0;i<BAGS.length;i++) BAGS[i].cap=BAGS[i].bw*BAGS[i].bh; })();
/* --- VIVRES ---
   Vingt sortes, de l'eau a la ration. Elles rendent 10 a 50 points, mais
   lentement : dur est le temps que met la remise en forme. */
/* ---- BOIRE ET MANGER NE SONT PAS LA MEME CHOSE ----
   Les vingt vivres rendaient tous de la vie, l'eau comme la conserve : une
   bouteille n'etait qu'un aliment avec une autre vignette, et deux conserves
   valaient mieux qu'un bidon dans tous les cas. La moitie du tableau etait
   vide - rien, dans tout le jeu, ne rendait de l'endurance.

   LES SIX BOISSONS PASSENT AU SOUFFLE. st = endurance rendue, etalee sur dur
   comme le reste. La reserve va de 60 a 140 : un bidon en rend 45, une
   canette 14, ce qui remet debout sans annuler le prix d'une course.
   ET UN PEU DE VIE QUAND MEME. Boire ne soigne pas, mais un jeu qui refuse
   net parait mesquin : elles gardent trois a huit points, de quoi ne pas
   jeter une gourde parce qu'on saigne. */
var FOOD=[
 {n:"Bouteille d'eau",     ic:"bouteille", hp:5,  st:26, dur:12, pds:0.55},
 {n:"Gourde pleine",       ic:"gourde",    hp:5,  st:30, dur:13, pds:0.70},
 {n:"Bidon d'eau",         ic:"bidon",     hp:8,  st:45, dur:19, pds:2.10},
 {n:"Canette de soda",     ic:"canette",   hp:3,  st:14, dur:6,  pds:0.34},
 {n:"Brique de jus",       ic:"brikjus",   hp:6,  st:24, dur:11, pds:1.05},
 {n:"Brique de lait",      ic:"brikjus",   hp:8,  st:18, dur:12, pds:1.05},
 {n:"Pomme",               ic:"pomme",     hp:10, dur:9,  pds:0.18},
 {n:"Poire",               ic:"pomme",     hp:10, dur:9,  pds:0.20},
 {n:"Tomate",              ic:"pomme",     hp:10, dur:8,  pds:0.13},
 {n:"Carotte",             ic:"carotte",   hp:10, dur:10, pds:0.09},
 {n:"Pomme de terre",      ic:"patate",    hp:20, dur:18, pds:0.22},
 {n:"Chou",                ic:"chou",      hp:20, dur:17, pds:0.90},
 {n:"Pain rassis",         ic:"pain",      hp:20, dur:16, pds:0.40},
 {n:"Biscuits secs",       ic:"paquet",    hp:20, dur:14, pds:0.30},
 {n:"Barre de cereales",   ic:"barre",     hp:10, dur:7,  pds:0.06},
 {n:"Conserve de haricots",ic:"conserve",  hp:30, dur:22, pds:0.45},
 {n:"Conserve de thon",    ic:"conserve",  hp:30, dur:20, pds:0.16},
 {n:"Ragout en boite",     ic:"conserve",  hp:40, dur:26, pds:0.52},
 {n:"Viande sechee",       ic:"viande",    hp:40, dur:24, pds:0.15},
 {n:"Ration militaire",    ic:"ration",    hp:50, dur:32, pds:0.75}
];
/* --- MEDICAMENTS ---
   Douze soins rendus d'un coup. Dix pour la vie, de 10 a 50 points.
   ET DEUX POUR LE SOUFFLE, qui remplissent la derniere case du tableau : ce
   qui rend de l'endurance d'un coup. On les trouve la ou l'on trouve les
   medicaments, ils pesent trois fois rien, et ils ne soignent aucune plaie -
   un stimulant ne referme pas une entaille. */
var MEDS=[
 {n:"Pansement",           ic:"pansement", hp:10, pds:0.03},
 {n:"Compresse sterile",   ic:"pansement", hp:10, pds:0.04},
 {n:"Bande de gaze",       ic:"bande",     hp:20, pds:0.08},
 {n:"Antiseptique",        ic:"flacon",    hp:20, pds:0.22},
 {n:"Antidouleur",         ic:"plaquette", hp:20, pds:0.02},
 {n:"Antibiotiques",       ic:"plaquette", hp:30, pds:0.03},
 {n:"Kit de suture",       ic:"kit",       hp:30, pds:0.12},
 {n:"Poche de sang",       ic:"poche",     hp:40, pds:0.55},
 {n:"Morphine",            ic:"seringue",  hp:40, pds:0.05},
 {n:"Trousse de secours",  ic:"trousse",   hp:50, pds:1.40},
 {n:"Comprimes de cafeine",ic:"tube",      hp:0, st:35, pds:0.02},
 {n:"Ampoule stimulante",  ic:"ampoule",   hp:0, st:60, pds:0.04}
];
/* --- ARMES DE JET ---
   Dix pieces qui se lancent et ne se tiennent pas en main : elles vivent dans
   le sac et se posent sur l'acces rapide [E].
   pmin : en deca, on ne peut pas armer le bras.   por : portee franche.
   prec : la finesse du lancer, de 0 a 1, comme pour une arme a feu.
   rad  : rayon de l'effet.   dmg : degats au centre.
   dur  : combien de temps l'effet dure ; 0 pour un coup unique. */
var THROWN=[
 {n:"Grenade a fragmentation", fam:"Grenade",  ic:"grenade",  pmin:40, por:210, prec:0.62, rad:58, dmg:95,  dur:0,  pds:0.40},
 {n:"Grenade offensive",       fam:"Grenade",  ic:"grenade",  pmin:35, por:190, prec:0.66, rad:40, dmg:70,  dur:0,  pds:0.32},
 {n:"Grenade incendiaire",     fam:"Grenade",  ic:"grenade",  pmin:40, por:185, prec:0.60, rad:52, dmg:22,  dur:9,  pds:0.45},
 {n:"Cocktail Molotov",        fam:"Bouteille",ic:"molotov",  pmin:30, por:150, prec:0.48, rad:64, dmg:18,  dur:12, pds:0.70},
 {n:"Bouteille d'acide",       fam:"Bouteille",ic:"molotov",  pmin:28, por:140, prec:0.46, rad:44, dmg:26,  dur:7,  pds:0.65},
 {n:"Fumigene",                fam:"Grenade",  ic:"fumigene", pmin:35, por:175, prec:0.64, rad:90, dmg:0,   dur:18, pds:0.55},
 {n:"Grenade assourdissante",  fam:"Grenade",  ic:"fumigene", pmin:35, por:180, prec:0.68, rad:72, dmg:6,   dur:4,  pds:0.38},
 {n:"Baton de dynamite",       fam:"Charge",   ic:"dynamite", pmin:45, por:160, prec:0.44, rad:76, dmg:120, dur:0,  pds:0.60},
 {n:"Charge artisanale",       fam:"Charge",   ic:"dynamite", pmin:45, por:130, prec:0.36, rad:88, dmg:140, dur:0,  pds:1.60},
 {n:"Couteau de lancer",       fam:"Lame",     ic:"cjet",     pmin:12, por:120, prec:0.80, rad:6,  dmg:34,  dur:0,  pds:0.18}
];
/* --- MATERIEL ---
   Cent objets qui ne se mangent ni ne se tirent : ils pesent et ils valent
   de la matiere premiere. Rien n'en fait encore usage ; la construction de
   la base viendra les chercher. */
var GOODS=[
 /* electromenager et appareils */
 {n:"Micro-ondes",         fam:"Appareil",  ic:"appareil",  pds:12.0, mat:14},
 {n:"Four electrique",     fam:"Appareil",  ic:"appareil",  pds:28.0, mat:26},
 {n:"Lave-linge",          fam:"Appareil",  ic:"appareil",  pds:62.0, mat:48},
 {n:"Refrigerateur",       fam:"Appareil",  ic:"appareil",  pds:55.0, mat:44},
 {n:"Televiseur",          fam:"Appareil",  ic:"ecran",     pds:9.0,  mat:12},
 {n:"Ordinateur",          fam:"Appareil",  ic:"boitier",   pds:8.0,  mat:16},
 {n:"Ecran d'ordinateur",  fam:"Appareil",  ic:"ecran",     pds:4.5,  mat:8},
 {n:"Poste de radio",      fam:"Appareil",  ic:"boitier",   pds:1.8,  mat:6},
 {n:"Ventilateur",         fam:"Appareil",  ic:"ventilo",   pds:3.2,  mat:7},
 {n:"Groupe electrogene",  fam:"Appareil",  ic:"moteur",    pds:34.0, mat:40},
 /* outils */
 {n:"Marteau",             fam:"Outil",     ic:"marteau",   pds:0.70, mat:4},
 {n:"Masse",               fam:"Outil",     ic:"marteau",   pds:4.50, mat:9},
 {n:"Tournevis plat",      fam:"Outil",     ic:"tournevis", pds:0.15, mat:2},
 {n:"Tournevis cruciforme",fam:"Outil",     ic:"tournevis", pds:0.15, mat:2},
 {n:"Cle a molette",       fam:"Outil",     ic:"cleplate",  pds:0.60, mat:4},
 {n:"Jeu de cles plates",  fam:"Outil",     ic:"cleplate",  pds:2.40, mat:8},
 {n:"Pince multiprise",    fam:"Outil",     ic:"pince",     pds:0.50, mat:3},
 {n:"Tenailles",           fam:"Outil",     ic:"pince",     pds:0.45, mat:3},
 {n:"Scie egoine",         fam:"Outil",     ic:"scie",      pds:0.80, mat:5},
 {n:"Scie a metaux",       fam:"Outil",     ic:"scie",      pds:0.60, mat:4},
 {n:"Perceuse sans fil",   fam:"Outil",     ic:"perceuse",  pds:1.90, mat:11},
 {n:"Meuleuse d'angle",    fam:"Outil",     ic:"perceuse",  pds:2.60, mat:13},
 {n:"Niveau a bulle",      fam:"Outil",     ic:"barrefer",  pds:0.40, mat:2},
 {n:"Metre ruban",         fam:"Outil",     ic:"rouleau",   pds:0.20, mat:2},
 {n:"Pied-de-biche",       fam:"Outil",     ic:"barrefer",  pds:2.20, mat:7},
 /* materiaux */
 {n:"Planche de bois",     fam:"Materiau",  ic:"planche",   pds:4.0,  mat:10},
 {n:"Poutre de charpente", fam:"Materiau",  ic:"planche",   pds:14.0, mat:24},
 {n:"Chevron",             fam:"Materiau",  ic:"planche",   pds:6.0,  mat:13},
 {n:"Contreplaque",        fam:"Materiau",  ic:"planche",   pds:9.0,  mat:15},
 {n:"Palette de bois",     fam:"Materiau",  ic:"palette",   pds:12.0, mat:18},
 {n:"Tole ondulee",        fam:"Materiau",  ic:"tole",      pds:7.0,  mat:14},
 {n:"Plaque d'acier",      fam:"Materiau",  ic:"tole",      pds:18.0, mat:30},
 {n:"Grillage",            fam:"Materiau",  ic:"grillage",  pds:5.5,  mat:12},
 {n:"Fil barbele",         fam:"Materiau",  ic:"grillage",  pds:4.0,  mat:10},
 {n:"Brique",              fam:"Materiau",  ic:"brique",    pds:2.6,  mat:3},
 {n:"Parpaing",            fam:"Materiau",  ic:"brique",    pds:14.0, mat:9},
 {n:"Sac de ciment",       fam:"Materiau",  ic:"sacciment", pds:25.0, mat:20},
 {n:"Sac de sable",        fam:"Materiau",  ic:"sacciment", pds:20.0, mat:8},
 {n:"Vitre",               fam:"Materiau",  ic:"vitre",     pds:6.0,  mat:9},
 {n:"Porte pleine",        fam:"Materiau",  ic:"porte",     pds:22.0, mat:20},
 {n:"Tuyau de cuivre",     fam:"Materiau",  ic:"tuyau",     pds:1.4,  mat:9},
 {n:"Tuyau PVC",           fam:"Materiau",  ic:"tuyau",     pds:0.9,  mat:5},
 {n:"Barre de fer",        fam:"Materiau",  ic:"barrefer",  pds:5.0,  mat:12},
 /* quincaillerie */
 {n:"Boite de clous",      fam:"Quincaillerie", ic:"visserie",  pds:1.20, mat:5},
 {n:"Boite de vis",        fam:"Quincaillerie", ic:"visserie",  pds:1.00, mat:5},
 {n:"Boulons et ecrous",   fam:"Quincaillerie", ic:"visserie",  pds:1.50, mat:6},
 {n:"Charnieres",          fam:"Quincaillerie", ic:"charniere", pds:0.60, mat:4},
 {n:"Cadenas",             fam:"Quincaillerie", ic:"cadenas",   pds:0.40, mat:5},
 {n:"Serrure",             fam:"Quincaillerie", ic:"cadenas",   pds:0.90, mat:8},
 {n:"Chaine d'acier",      fam:"Quincaillerie", ic:"chaine",    pds:6.50, mat:14},
 {n:"Corde de chanvre",    fam:"Quincaillerie", ic:"corde",     pds:3.00, mat:9},
 {n:"Sangle a cliquet",    fam:"Quincaillerie", ic:"corde",     pds:1.10, mat:6},
 {n:"Ressorts",            fam:"Quincaillerie", ic:"ressort",   pds:0.80, mat:4},
 /* electricite */
 {n:"Rouleau de cable",    fam:"Electricite", ic:"cable",   pds:5.00, mat:15},
 {n:"Rallonge electrique", fam:"Electricite", ic:"cable",   pds:1.60, mat:7},
 {n:"Batterie de voiture", fam:"Electricite", ic:"batterie",pds:17.0, mat:25},
 {n:"Piles alcalines",     fam:"Electricite", ic:"pile",    pds:0.30, mat:4},
 {n:"Batterie lithium",    fam:"Electricite", ic:"pile",    pds:0.60, mat:12},
 {n:"Panneau solaire",     fam:"Electricite", ic:"solaire", pds:11.0, mat:34},
 {n:"Ampoule",             fam:"Electricite", ic:"ampoule", pds:0.05, mat:2},
 {n:"Prise murale",        fam:"Electricite", ic:"prise",   pds:0.12, mat:2},
 {n:"Interrupteur",        fam:"Electricite", ic:"prise",   pds:0.10, mat:2},
 {n:"Onduleur",            fam:"Electricite", ic:"boitier", pds:4.20, mat:18},
 /* chimie et carburants */
 {n:"Jerrican d'essence",  fam:"Chimie",    ic:"jerrican",  pds:16.0, mat:22},
 {n:"Bidon de gasoil",     fam:"Chimie",    ic:"jerrican",  pds:18.0, mat:22},
 {n:"Bouteille de gaz",    fam:"Chimie",    ic:"bonbonne",  pds:24.0, mat:26},
 {n:"Acide chlorhydrique", fam:"Chimie",    ic:"bidonchim", pds:2.20, mat:12},
 {n:"Soude caustique",     fam:"Chimie",    ic:"bidonchim", pds:1.80, mat:11},
 {n:"Eau de Javel",        fam:"Chimie",    ic:"bidonchim", pds:2.40, mat:6},
 {n:"Pot de peinture",     fam:"Chimie",    ic:"pot",       pds:5.00, mat:7},
 {n:"Colle forte",         fam:"Chimie",    ic:"tube",      pds:0.20, mat:4},
 {n:"Ruban adhesif",       fam:"Chimie",    ic:"rouleau",   pds:0.35, mat:5},
 {n:"Ruban isolant",       fam:"Chimie",    ic:"rouleau",   pds:0.15, mat:4},
 /* cuisine et vaisselle */
 {n:"Assiette",            fam:"Cuisine",   ic:"assiette",  pds:0.40, mat:1},
 {n:"Bol",                 fam:"Cuisine",   ic:"assiette",  pds:0.35, mat:1},
 {n:"Couverts",            fam:"Cuisine",   ic:"couvert",   pds:0.25, mat:2},
 {n:"Casserole",           fam:"Cuisine",   ic:"casserole", pds:1.10, mat:4},
 {n:"Poele",               fam:"Cuisine",   ic:"casserole", pds:1.30, mat:4},
 {n:"Marmite",             fam:"Cuisine",   ic:"casserole", pds:3.20, mat:8},
 {n:"Verre",               fam:"Cuisine",   ic:"verre",     pds:0.20, mat:1},
 {n:"Rechaud a gaz",       fam:"Cuisine",   ic:"rechaud",   pds:2.10, mat:12},
 {n:"Bouteille d'alcool",  fam:"Cuisine",   ic:"alcool",    pds:1.20, mat:8},
 /* mobilier et tissus */
 {n:"Chaise",              fam:"Mobilier",  ic:"chaise",    pds:4.50, mat:6},
 {n:"Table basse",         fam:"Mobilier",  ic:"table",     pds:12.0, mat:12},
 {n:"Matelas",             fam:"Mobilier",  ic:"matelas",   pds:16.0, mat:10},
 {n:"Couverture",          fam:"Mobilier",  ic:"tissu",     pds:1.50, mat:4},
 {n:"Drap",                fam:"Mobilier",  ic:"tissu",     pds:0.70, mat:3},
 {n:"Tapis",               fam:"Mobilier",  ic:"tissu",     pds:6.00, mat:5},
 {n:"Vetements",           fam:"Mobilier",  ic:"vetement",  pds:1.00, mat:3},
 {n:"Bache plastique",     fam:"Mobilier",  ic:"bache",     pds:3.50, mat:11},
 {n:"Sac poubelle",        fam:"Mobilier",  ic:"sacplast",  pds:0.10, mat:1},
 {n:"Miroir",              fam:"Mobilier",  ic:"miroir",    pds:3.00, mat:5},
 /* divers */
 {n:"Velo",                fam:"Divers",    ic:"velo",      pds:13.0, mat:20},
 {n:"Roue de secours",     fam:"Divers",    ic:"pneu",      pds:9.50, mat:12},
 {n:"Seau",                fam:"Divers",    ic:"seau",      pds:0.90, mat:3},
 {n:"Caisse en bois",      fam:"Divers",    ic:"caisse",    pds:5.00, mat:9},
 {n:"Extincteur",          fam:"Divers",    ic:"extincteur",pds:8.00, mat:14},
 {n:"Talkie-walkie",       fam:"Divers",    ic:"talkie",    pds:0.40, mat:9},
 {n:"Lampe torche",        fam:"Divers",    ic:"torche",    pds:0.35, mat:6},
 {n:"Jumelles",            fam:"Divers",    ic:"jumelles",  pds:0.80, mat:10},
 /* La bouteille vide ne vaut rien en elle-meme : elle vaut ce qu'on met
    dedans. Au puits elle se remplit d'eau, a la pompe elle devient un
    cocktail. C'est le seul objet du jeu qui change de nature. */
 {n:"Bouteille vide",      fam:"Divers",    ic:"boutvide",  pds:0.12, mat:2}
];
/* --- MUNITIONS ---
   Une boite par calibre, batie sur la table AMMO qui existe depuis la v10 :
   le poids de la boite est celui de ses cartouches. Cinquante coups pour ce
   qui se tire au pistolet, au .22 et au fusil de chasse, trente pour les
   calibres de fusil - la boite de 12,7 a trente cartouches et pese trois
   kilos et demi, ce qui suffit a decourager de l'emporter.
   Le rechargement y puise depuis la v15 : voir la section du ravitaillement
   par calibre, plus bas. */
var ROUNDS=[];
(function(){
    var order=["a22","a9","a12","a357","a556","a762","a8lb","a75","a338","a127"];
    var gros={a556:1,a762:1,a8lb:1,a75:1,a338:1,a127:1};
    var i, a, nb;
    for(i=0;i<order.length;i++){
        a=AMMO[order[i]]; nb=gros[order[i]]?30:50;
        ROUNDS.push({n:"Boite de "+a.n, ic:"cartouches", am:order[i],
                     nb:nb, pds:Math.round(a.pds*nb*100)/100});
    }
})();
/* --- CEINTURES DE MUNITIONS ---
   LE CONTREPOIDS DE LA BOITE PAR CASE. Depuis la v23 une case ne tient
   qu'une boite : c'etait un facteur dix sur ce qu'on emporte, applique en
   connaissance du chiffre et sans son contrepoids. Le voici.

   UNE CEINTURE EST UN CONTENANT D'UNE CASE. Elle occupe la case comme
   n'importe quoi d'autre, et elle y tient blt boites au lieu d'une. Elle ne
   tient QUE des munitions, et d'un seul calibre - une case n'a jamais tenu
   qu'une sorte, la regle ne change pas. Le gain va de deux a cinq.

   ELLE PESE, ET ELLE PESE MEME VIDE. C'est ce qui l'empeche d'etre un choix
   sans contrepartie : porter cinq ceintures vides coute trois kilos et demi
   pour rien. Son poids s'ajoute a celui des cartouches qu'elle porte.

   CE QUI COMPTE N'EST PAS LE NOMBRE DE BOITES MAIS LA FREQUENCE. Elles ne
   sortent jamais de la table generale du materiel - la famille "Ceinture"
   n'est dans aucun fm - mais d'un tirage a elles, une seule fois par
   batiment, dans les six lieux qui en portent. */
var BELTS=[
 {n:"Cartouchiere de chasse",  fam:"Ceinture", ic:"cei1", blt:2, pds:0.30, mat:3},
 {n:"Musette de tireur",       fam:"Ceinture", ic:"cei2", blt:3, pds:0.45, mat:4},
 {n:"Ceinture de police",      fam:"Ceinture", ic:"cei3", blt:3, pds:0.50, mat:5},
 {n:"Brelage militaire",       fam:"Ceinture", ic:"cei4", blt:4, pds:0.80, mat:7},
 {n:"Porte-chargeurs de combat",fam:"Ceinture",ic:"cei5", blt:5, pds:1.30, mat:10}
];
