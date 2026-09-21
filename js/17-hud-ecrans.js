"use strict";
/* ================================================================
   TUAZ - 17-hud-ecrans.js
   Le HUD en DOM et tous les ecrans (menu, pause, scores, options,
   presentation, mort, victoire).
   (lignes 18830 a 20663 du mono-fichier d'origine)
   ================================================================ */
/* ================= HUD DOM ================= */
var MODE_N=["SILENCIEUX","NORMAL","SPRINT"];
var hpFill=document.querySelector("#hpbar>.bfill"), hpTxt=document.getElementById("hptxt"),
    hpBand=document.querySelector("#hpbar>.mband"),
    stFill=document.querySelector("#stbar>.bfill"), stTxt=document.getElementById("sttxt"),
    stBand=document.querySelector("#stbar>.mband"),
    hpBarEl=document.getElementById("hpbar"), stBarEl=document.getElementById("stbar"),
    pcardEl=document.getElementById("pcard"),
    moBar=document.getElementById("mobar"),
    moFill=document.querySelector("#mobar>div"), moTxt=document.getElementById("motxt"),
    bcAdrEl=document.getElementById("bcadr"), bcNmEl=document.getElementById("bcnm"),
    bcIcEl=document.getElementById("bcic"),
    pnameEl=document.getElementById("pname"),
    ipanEl=document.getElementById("ipan"),
    lpanEl=document.getElementById("lpan"),
    trpanEl=document.getElementById("trpan"),
    placeEl=document.getElementById("placename"),
    invPanEl=document.getElementById("invpan"),
    tnameEl=document.getElementById("tname"),
    thpFill=document.querySelector("#thpbar>div"),
    thpTxt=document.getElementById("thptxt"),
    tstFill=document.querySelector("#tstbar>div"),
    tstTxt=document.getElementById("tsttxt"),
    jwhoEl=document.getElementById("jwho");
function setBand(el,cur,norm,ref){
    if(!el) return;
    if(ref<=0||Math.abs(cur-norm)<0.5){ el.style.display="none"; return; }
    var lo=Math.min(cur,norm)/ref, hi=Math.max(cur,norm)/ref;
    el.style.display="block";
    el.style.left=(lo*100)+"%"; el.style.right="auto";
    el.style.width=Math.max(0,(hi-lo)*100)+"%";
    /* noir quand le moral a fait FONDRE la reserve, vert quand il l'a GONFLEE */
    el.style.background=(cur<norm)?"#000000":"#4fae55";
}
/* le sprite du batiment de base, dessine dans le carre du panneau haut-droite.
   On prend la meme decoupe que la facade de l'onglet BASE, en plus petit, et
   l'on ne repeint que lorsque le toit change - le decor du monde ne bouge pas. */
var bcLast=null;
function baseCardIcon(){
    var cv=bcIcEl; if(!cv||!cv.getContext) return;
    var b=homeB();
    if(b===bcLast) return;
    bcLast=b;
    var g=cv.getContext("2d");
    g.clearRect(0,0,cv.width,cv.height);
    if(!b) return;
    /* Cadrage serre sur le batiment : peu de marge en haut, sinon on attrape le
       trottoir au-dessus du toit. */
    var mt=20, ms=5, sw=b.w+ms*2, sh=b.h+mt+ms;
    var sc=Math.min(cv.width/sw,cv.height/sh);
    var ox=(cv.width-sw*sc)/2, oy=(cv.height-sh*sc)/2;
    g.imageSmoothingEnabled=false;
    g.drawImage(worldCv,b.x-ms,b.y-mt,sw,sh,ox,oy,sw*sc,sh*sc);
}
/* ---- LES POPS DE BARRE ----
   On surveille vie, endurance et moral d'une image a l'autre. Les trois
   ACCUMULENT desormais : on voit donc aussi les changements PROGRESSIFS, dans
   les deux sens, regroupes pour ne pas cracher un chiffre par image. Pour
   l'endurance, ce regroupement suffit a ce que la course ne pope pas a chaque
   foulee : les grignotages montent par paquets, a droite de la fiche. */
var SP={p:null, hp:{v:0,a:0,idle:0,hold:0}, st:{v:0,a:0,idle:0,hold:0}, mo:{v:0,a:0,idle:0,hold:0}};
var spLast=0;
function hpCol(){ return "#5fbf5f"; }
function stCol(){ return "#e0c060"; }
function moCol(n){ return n>0?"#e0574a":"#000000"; }
function statTrack(o,cur,mode,host,colFn,side,dt){
    if(mode==="jump"){
        var dj=cur-o.v; o.v=cur;
        if(Math.abs(dj)>=3){ var nj=Math.round(dj); if(nj) statPop(host,nj,colFn(nj),side); }
        return;
    }
    var d=cur-o.v; o.v=cur;
    if(d!==0){ o.a+=d; o.idle=0; } else o.idle+=dt;
    o.hold+=dt;
    if(Math.abs(o.a)>=1&&(o.idle>=0.2||Math.abs(o.a)>=8||o.hold>=1.2)){
        var n=Math.round(o.a); if(n) statPop(host,n,colFn(n),side);
        o.a-=n; o.hold=0; o.idle=0;
    }
}
/* ---- LE BANDEAU D'EQUIPE ----
   Une carte par compagnon (portrait, nom, vie, endurance), reconstruite quand
   la composition change, rafraichie chaque image pour les barres. */
var teamCards=[], teamSigLast="";
function teamSig(L){ var s=L.length+"|", i; for(i=0;i<L.length;i++) s+=(L[i].name||"")+","; return s; }
function drawMini(cv,spr){
    if(!cv||!cv.getContext||!spr) return;
    var g=cv.getContext("2d"); g.imageSmoothingEnabled=false;
    g.clearRect(0,0,cv.width,cv.height);
    var d=spr.hd||1, w=spr.width/d, h=spr.height/d;
    var sc=Math.min((cv.width-4)/w,(cv.height-4)/h);
    g.drawImage(spr,0,0,spr.width,spr.height,
        Math.round((cv.width-w*sc)/2),Math.round((cv.height-h*sc)/2),
        Math.round(w*sc),Math.round(h*sc));
}
function buildTeam(L){
    var host=document.getElementById("team"); if(!host) return;
    host.innerHTML=""; teamCards=[];
    var i,n,card,cv,info,nm,hb,hf,sb,sf;
    for(i=0;i<L.length;i++){ n=L[i];
        card=document.createElement("div"); card.className="tmcard";
        cv=document.createElement("canvas"); cv.width=30; cv.height=36; cv.className="tmface";
        info=document.createElement("div"); info.className="tminfo";
        nm=document.createElement("div"); nm.className="tmname"; nm.textContent=n.name||"";
        hb=document.createElement("div"); hb.className="bar tmbar tmhp";
        hf=document.createElement("div"); hf.className="bfill"; hb.appendChild(hf);
        sb=document.createElement("div"); sb.className="bar tmbar tmst";
        sf=document.createElement("div"); sf.className="bfill"; sb.appendChild(sf);
        info.appendChild(nm); info.appendChild(hb); info.appendChild(sb);
        card.appendChild(cv); card.appendChild(info);
        host.appendChild(card);
        drawMini(cv,n.spr||((n.s!==undefined&&VILSPR[n.s])?VILSPR[n.s]:n.spr));
        teamCards.push({n:n,hf:hf,sf:sf});
    }
}
function updTeam(){
    var L=grpList(), sig=teamSig(L), i, c, mh, ms;
    if(sig!==teamSigLast){ teamSigLast=sig; buildTeam(L); }
    for(i=0;i<teamCards.length;i++){ c=teamCards[i];
        mh=hpMax(c.n)||1; ms=Math.max(1,staMax(c.n));
        c.hf.style.transform="scaleX("+Math.max(0,Math.min(1,c.n.hp/mh))+")";
        c.sf.style.transform="scaleX("+Math.max(0,Math.min(1,(c.n.sta||0)/ms))+")";
    }
}
/* ---- L'ETAT DES SIX BOUTONS ----
   Ils ne s'affichent que si l'on a du monde dehors a commander. Dans chaque
   paire, le bouton en vigueur est allume ; "A la base" est grise tant qu'il
   n'y a pas de base ou rentrer. */
var gcmdEl=null, gcBtn={};
function grpCmdUI(){
    if(!gcmdEl){ gcmdEl=document.getElementById("gcmd");
        var q; for(q=0;q<6;q++) gcBtn[q]=document.getElementById("gc"+q); }
    if(!gcmdEl) return;
    var out=eqList().length>0;
    gcmdEl.style.display=out?"grid":"none";
    if(!out) return;
    var g=G.grp||{hold:0,noFire:0};
    function set(el,on,dis){ if(el) el.className="gcbtn"+(dis?" dis":(on?" on":"")); }
    set(gcBtn[0],!g.hold,0);              /* suivre */
    set(gcBtn[1],!!g.hold,0);             /* pas suivre */
    set(gcBtn[2],!g.noFire,0);            /* tirer */
    set(gcBtn[3],!!g.noFire,0);           /* pas tirer */
    set(gcBtn[4],0,!(BASE&&BASE.b));      /* a la base : grise sans base */
    set(gcBtn[5],0,0);                    /* planque */
}
function updHUD(){
    /* Les barres se lisent sur l'echelle du MORAL NEUTRE (le maximum a 50) :
       le remplissage rouge, et par-dessus le vide, une bande qui dit ce que le
       moral retire (gris) ou ajoute (vert) au plafond du moment. */
    var mm=moralMul(G.p);
    var hpCur=G.p.maxhp, hpNorm=(mm>0)?(hpCur/mm):hpCur, hpRef=Math.max(hpCur,hpNorm);
    hpFill.style.transform="scaleX("+(hpRef>0?G.p.hp/hpRef:0)+")";
    hpTxt.textContent=Math.ceil(G.p.hp)+"/"+G.p.maxhp;
    setBand(hpBand,hpCur,hpNorm,hpRef);
    var smx=Math.round(staMax(G.p));
    var stNorm=(mm>0)?(smx/mm):smx, stRef=Math.max(smx,stNorm);
    stFill.style.transform="scaleX("+(stRef>0?G.p.sta/stRef:0)+")";
    stTxt.textContent=Math.ceil(G.p.sta)+"/"+smx;
    setBand(stBand,smx,stNorm,stRef);
    /* a bout de souffle la barre bat : c'est le seul signal que la touche de
       sprint ne repond plus */
    stFill.style.opacity=G.p.winded?(0.45+0.55*Math.abs(Math.sin(performance.now()/160))):1;
    /* Le moral s'affiche sur l'echelle -50..+50, zero au centre : un segment
       vert grandit vers la droite quand il est positif, un segment noir vers la
       gauche quand il est negatif. */
    var mo=Math.round(moralNow())-50; if(mo<-50) mo=-50; else if(mo>50) mo=50;
    var mag=Math.min(1,Math.abs(mo)/50)*50;
    moFill.style.transform="none"; moFill.style.right="auto";
    if(mo>=0){ moFill.style.left="50%"; moFill.style.width=mag+"%";
        moFill.style.background="#4fae55"; }
    else { moFill.style.left=(50-mag)+"%"; moFill.style.width=mag+"%";
        moFill.style.background="#000000"; }
    moTxt.textContent="MORAL "+(mo>0?"+":"")+mo;
    moBar.className="bar mobar";
    /* le carre de base : adresse en clair, nom du toit dessous. Au depart c'est
       la maison ; quand on s'installe ailleurs, c'est la base. */
    var hb=homeB(), ad=hb?baseAddr(hb):"", nmb=hb?(bldLabel(hb)||""):"";
    if(!ad){ ad=nmb||"Sans abri"; nmb=""; }
    bcAdrEl.textContent=ad;
    bcNmEl.textContent=nmb;
    baseCardIcon();
    var now=performance.now(), sdt=spLast?Math.min(0.1,(now-spLast)/1000):0; spLast=now;
    if(SP.p!==G.p){ SP.p=G.p; SP.hp.v=G.p.hp; SP.hp.a=0; SP.hp.idle=0; SP.hp.hold=0;
        SP.st.v=G.p.sta; SP.st.a=0; SP.st.idle=0; SP.st.hold=0;
        SP.mo.v=mo; SP.mo.a=0; SP.mo.idle=0; SP.mo.hold=0; }
    else {
        statTrack(SP.hp,G.p.hp,"acc",pcardEl,hpCol,true,sdt);
        statTrack(SP.st,G.p.sta,"acc",pcardEl,stCol,true,sdt);
        statTrack(SP.mo,mo,"acc",moBar,moCol,false,sdt);
    }
    updTeam();
    grpCmdUI();
    wCardTick();
    qCardTick();
    actListTick();
    /* Le choix d'une arme passe par le journal d'entrees : il n'est applique
       qu'au tour de simulation suivant. On surveille donc l'etat reel des
       emplacements et l'on repeint des qu'il change, au lieu de repeindre au
       moment du clic, ou rien n'a encore bouge. */
    if(G.showBag&&!G.invNpc){
        var sg=G.p.hand+"|"+G.p.slots.map(function(w){ return w?w.n:"-"; }).join(",");
        if(sg!==wSlotSig){ wSlotSig=sg; wSlotFill(); }
        var bg=iBagSigOf();
        if(bg!==iBagSig){ iBagSig=bg; iBagFill(); }
        /* la tenue suit la meme regle : on repeint quand l'etat reel bouge,
           pas au moment du clic, ou le journal n'a encore rien applique */
        var vg=vSlotSigOf();
        if(vg!==vSlotSig){ vSlotSig=vg; vSlotFill(); }
    } else { wSlotSig=null; iBagSig=null; vSlotSig=null; }
    /* la fiche de l'interlocuteur : nom, vie et endurance */
    if(G.talk&&G.talk.n){
        var tn=G.talk.n, tmx=tn.maxhp||100;
        if(tnameEl) tnameEl.textContent=G.talk.name||"";
        if(thpFill) thpFill.style.transform="scaleX("+((tn.hp||0)/tmx)+")";
        if(thpTxt) thpTxt.textContent=Math.ceil(tn.hp||0)+"/"+tmx;
        var tsm=Math.round(staMax(tn));
        if(tstFill) tstFill.style.transform="scaleX("+((tn.sta||0)/Math.max(1,tsm))+")";
        if(tstTxt) tstTxt.textContent=Math.ceil(tn.sta||0)+"/"+tsm;
    }
    /* le nom du lieu approche s'affiche en haut, puis s'efface */
    if(G.place&&G.place.t>0){
        if(placeEl.textContent!==G.place.n) placeEl.textContent=G.place.n;
        placeEl.style.opacity=Math.min(1,G.place.t/0.7);
    } else if(placeEl.style.opacity!=="0") placeEl.style.opacity="0";
    if(jwhoEl.textContent!=="JOURNAL") jwhoEl.textContent="JOURNAL";
    var ivd=G.showInv?"block":"none";
    if(invPanEl.style.display!==ivd) invPanEl.style.display=ivd;
}


/* ================= ECRANS ================= */
var screenEl=document.getElementById("screen");
function esc(t){ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
/* ---- L'ECRAN D'ATTENTE ----
   Il s'affiche AVANT que la generation ne bloque, sans quoi il ne serait
   jamais peint : regen tient le fil d'execution pendant plus d'une seconde,
   et le navigateur ne redessine rien pendant ce temps. D'ou l'ordre : on
   pose la premiere coupure, on rend la main le temps d'une image, et l'on
   fabrique la carte ensuite. Le gel se produit donc sur une page pleine et
   non sur du noir - il devient une pause de lecture.
   Ensuite les coupures defilent d'elles-memes jusqu'au delai plein. */
var LOAD_MIN=5000, LOAD_EVERY=2200, loadT0=0, loadI=0, loadBase=0, loadHold=0, loadTimer=null;
/* ---- CHAQUE NATURE DE DOCUMENT A SON VISAGE ----
   Un texto n'a pas l'air d'une une de journal, et une page de carnet n'a pas
   l'air d'un arrete prefectoral. La classe src-* porte tout : papier, police,
   alignement. Le corps d'un journal se met sur deux colonnes, celui d'un
   carnet reste sur une, un texto devient un echange de bulles. Sans cette
   difference, soixante pieces se ressembleraient toutes. */
var CUTSRC={journal:"Presse", affiche:"Affiche", lettre:"Lettre",
            mail:"Message", texto:"Telephone", note:"Note", intime:"Carnet"};
function loadCard(i){
    var c=COUPURES[i%COUPURES.length], q, b, corps;
    if(c.s==="texto"&&c.m){
        corps="<div class='sms'>";
        for(q=0;q<c.m.length;q++){
            b=c.m[q];
            corps+="<div class='sms"+((b[0]==="moi")?" me":" you")+"'>"+b[1]+"</div>";
        }
        corps+="</div>";
    } else corps="<div class='cutbody'>"+c.c+"</div>";
    return "<div class='cut src-"+c.s+"'>"+
        "<div class='cuthead'><span>"+c.j+"</span><span>"+c.d+"</span></div>"+
        "<div class='cuttitle'>"+c.t+"</div>"+corps+
        "<div class='cutfoot'>"+(CUTSRC[c.s]||"")+" - "+
        ((c.k==="crise")?"la crise":"le pays")+
        " - "+(i+1)+" / "+COUPURES.length+"</div></div>";
}
/* ---- ON NE RELIT PAS TOUJOURS LES MEMES ----
   Quarante coupures et cinq secondes : au rythme automatique on en lit deux.
   Le point de depart avance donc de trois a chaque lancement, garde entre
   deux sessions comme les scores. En une poignee de parties on a tout lu, et
   la serie boucle sans qu'on ait a y penser. Le fil H-teck occupe les
   quatorze premieres et se relit d'un bloc dans la bibliotheque. */
function loadStart(){
    var n=COUPURES.length, k=0;
    try{
        k=parseInt(localStorage.getItem("tuaz_cut")||"0",10)||0;
        localStorage.setItem("tuaz_cut",String((k+3)%n));
    }catch(e){ k=0; }
    return ((k%n)+n)%n;
}
function showLoading(){
    state="load";
    loadT0=Date.now(); loadI=loadStart(); loadHold=0;
    loadBase=loadI;
    screenEl.style.display="flex";
    screenEl.innerHTML="<div id='panel' class='loadpan'>"+
        "<h1>TUAZ</h1><div class='sub'>TeamUpAgainstZombi - v"+VERSION+"</div>"+
        "<div id='cutbox'>"+loadCard(loadI)+"</div>"+
        "<div class='cutnav'>"+
          "<button id='cutp'>&lt;</button>"+
          "<span id='cutmsg'>Le pays se dessine...</span>"+
          "<button id='cutn'>&gt;</button></div>"+
        "<div class='loadbar'><i id='loadi'></i></div></div>";
    var pv=document.getElementById("cutp"), nx=document.getElementById("cutn");
    if(pv) pv.onclick=function(){ sClick(); loadFlip(-1); };
    if(nx) nx.onclick=function(){ sClick(); loadFlip(1); };
}
/* ---- FEUILLETER SOI-MEME ----
   Dix coupures et cinq secondes : au rythme automatique on n'en lit que
   deux. Les fleches permettent de parcourir la serie entiere pendant que la
   carte se termine, et prendre la main suspend le defilement - on ne se fait
   pas arracher une coupure des les yeux. Le reste des dix se relit a tete
   reposee dans la bibliotheque, sous Options. */
function loadFlip(d){
    var el=document.getElementById("cutbox"), n=COUPURES.length;
    loadHold=1;
    loadI=((loadI+d)%n+n)%n;
    if(el) el.innerHTML=loadCard(loadI);
}
/* Une coupure chasse l'autre, et la barre avance. Quand le compte y est et
   que la carte est prete, on passe au menu. */
function loadTick(){
    var el=document.getElementById("cutbox"), bar=document.getElementById("loadi");
    var dt=Date.now()-loadT0, pc=Math.min(100,Math.round(100*dt/LOAD_MIN));
    if(bar) bar.style.width=pc+"%";
    if(!loadHold){
        var want=(loadBase+Math.floor(dt/LOAD_EVERY))%COUPURES.length;
        if(el&&want!==loadI){ loadI=want; el.innerHTML=loadCard(loadI); }
    }
    if(dt>=LOAD_MIN){
        if(loadTimer){ clearInterval(loadTimer); loadTimer=null; }
        /* Celui qui feuillette est en train de lire : on ne lui coupe pas la
           page au nez. On lui pose un bouton et il part quand il veut. */
        if(loadHold){
            var m=document.getElementById("cutmsg");
            if(m){ m.innerHTML="<button id='cutgo' class='cutgo'>CONTINUER</button>";
                var g=document.getElementById("cutgo");
                if(g) g.onclick=function(){ audio(); showIntro(); }; }
            return;
        }
        showIntro();
    }
}
/* ---- QUI SUIS-JE ? ----
   La presentation du personnage qu'on incarne, tiree de ce qu'il est deja :
   son nom, son metier et une bribe de sa vie (l'une de ses dix repliques,
   celle que son index bio a fixee), puis ce qu'il sait faire, deduit de sa
   competence dominante et de ses deux meilleures aptitudes. Aucun tirage, rien
   dans la simulation : c'est de la lecture. */
function introText(){
    var p=G.p, jd=jobDef(p.job)||null;
    var jn=jd?jd.n:"habitant";
    var bio;
    if(jd&&jd.d&&jd.d.length){
        var dd=jd.d, nD=dd.length, bi=(p.bio||0)%nD, offs=[0,3,7], seen={}, parts=[], oi, ix;
        for(oi=0;oi<offs.length;oi++){ ix=(bi+offs[oi])%nD; if(!seen[ix]){ seen[ix]=1; parts.push(dd[ix]); } }
        bio=parts.join(" ");
    } else bio="Vous meniez une vie tranquille dans ce bourg, sans histoires. "+
               "On vous connaissait, on vous saluait au passage. Une vie sans "+
               "surprises, et cela vous convenait tres bien.";
    var st=p.stats||{}, mains=["cardio","astuce","combat","tir"], best="cardio", bv=-1, k;
    for(k=0;k<mains.length;k++) if((st[mains[k]]||0)>bv){ bv=st[mains[k]]; best=mains[k]; }
    var phr={
        cardio:"Vous avez le souffle long et les jambes solides.",
        astuce:"Vous avez l'oeil vif, l'oreille fine et les doigts agiles.",
        combat:"Vous encaissez sans broncher et vous rendez les coups.",
        tir:"Vous avez la main sure des qu'il faut viser."
    }[best];
    var lab={}, i, q, sec=p.sec||{};
    for(i=0;i<STATDEF.length;i++) for(q=0;q<STATDEF[i].sec.length;q++)
        lab[STATDEF[i].sec[q].k]=STATDEF[i].sec[q].n;
    var aps=Object.keys(sec), a1="", a2="", v1=-1, v2=-1, v;
    for(i=0;i<aps.length;i++){ v=sec[aps[i]];
        if(v>v1){ v2=v1; a2=a1; v1=v; a1=aps[i]; }
        else if(v>v2){ v2=v; a2=aps[i]; } }
    var skills=phr;
    if(a1&&lab[a1]) skills+=" Surtout, vous excellez en "+lab[a1].toLowerCase()+
        (a2&&lab[a2]?(" et en "+lab[a2].toLowerCase()):"")+".";
    return {name:p.name||"Inconnu", job:jn, bio:bio, skills:skills};
}
/* L'ECRAN D'INTRO. Il vient apres le chargement, avant la main : on decouvre
   qui l'on est, puis on choisit de commencer. Les blocs se revelent l'un apres
   l'autre. L'objectif du jour occupe deja sa place ; le moteur de quetes le
   remplira au lot suivant. */
function showIntro(){
    var t=introText(), d=0;
    function rev(){ d+=0.16; return "class='introrev' style='animation-delay:"+d.toFixed(2)+"s'"; }
    screenEl.style.display="flex";
    screenEl.innerHTML="<div id='panel' class='intro'>"+
        "<canvas id='introspr' class='por' "+rev()+"></canvas>"+
        "<h1 "+rev()+">"+t.name+"</h1>"+
        "<div class='role' "+rev()+">"+t.job+"</div>"+
        "<h2 "+rev()+">Votre vie</h2>"+
        "<p "+rev()+">"+t.bio+"</p>"+
        "<h2 "+rev()+">Ce que vous savez faire</h2>"+
        "<p "+rev()+">"+t.skills+"</p>"+
        "<h2 "+rev()+">Aujourd'hui</h2>"+
        "<div class='obj' "+rev()+">"+questIntroText()+"</div>"+
        "<div class='go' "+rev()+"><button id='introgo' class='cutgo'>COMMENCER</button></div>"+
        "</div>";
    /* le visage de celui qu'on incarne : sa silhouette de face, agrandie */
    var spr=(G.p&&G.p.spr)?dressSpr(G.p,G.p.spr):null, cvp=document.getElementById("introspr");
    if(cvp&&spr&&spr.width){
        var hd=spr.hd||1, lw=spr.width/hd, lh=spr.height/hd, sc=5;
        cvp.width=Math.round(lw*sc); cvp.height=Math.round(lh*sc);
        var pc=cvp.getContext("2d");
        pc.imageSmoothingEnabled=false;
        pc.drawImage(spr,0,0,spr.width,spr.height,0,0,cvp.width,cvp.height);
    } else if(cvp){ cvp.style.display="none"; }
    var g=document.getElementById("introgo");
    if(g) g.onclick=function(){ audio(); enterPlay(); };
    state="intro";
}
/* L'amorce : on dimensionne, on montre le menu, et l'on n'engendre rien.
   Le pays attend qu'on le demande. */
function boot(){
    resize(); setTimeout(resize,50);
    showMenu();
}
function showMenu(){
    state="menu";
    screenEl.style.display="flex";
    screenEl.innerHTML="<div id='panel'>"+
        "<h1>TUAZ</h1><div class='sub'>TeamUpAgainstZombi - v"+VERSION+"</div>"+
        "<p style='margin-bottom:12px;text-align:center;font-size:12px;color:#b09a6a;'>"+
        "Vous prendrez la place d'un habitant tire au sort sur la carte.</p>"+
        "<button class='big' id='bnew'>NOUVELLE PARTIE</button>"+
        "<br><button class='big' id='bsco' style='margin-top:8px;'>SCORES</button>"+
        "<br><button class='big' id='bopt' style='margin-top:8px;'>OPTIONS</button>"+
        "<div class='sub' style='margin-top:6px;'>bibliotheque du jeu</div></div>";
    document.getElementById("bnew").onclick=function(){ audio(); startRun(); };
    document.getElementById("bsco").onclick=function(){ audio(); showScores(); };
    document.getElementById("bopt").onclick=function(){ audio(); showLib(); };
}
/* ---- LA PAUSE ----
   Un vrai panneau, comme le menu : on reprend, ou l'on revient a l'ecran
   principal. Le jeu reste fige derriere (la boucle ne met a jour qu'en play),
   on le voit sous le voile. */
function showPause(){
    state="pause";
    screenEl.style.display="flex";
    screenEl.innerHTML="<div id='panel'>"+
        "<h1>PAUSE</h1>"+
        "<button class='big' id='presume'>REPRENDRE</button>"+
        "<br><button class='big' id='pmenu' style='margin-top:8px;'>MENU PRINCIPAL</button></div>";
    document.getElementById("presume").onclick=function(){ audio(); resumePlay(); };
    document.getElementById("pmenu").onclick=function(){ audio(); showMenu(); };
}
function resumePlay(){
    screenEl.style.display="none";
    state="play"; sClick();
}

/* ----- scores : tableau local, tri par jours tenus puis par temps ----- */
function getScores(){
    try{ return JSON.parse(localStorage.getItem("tuaz_scores")||"[]"); }catch(e){ return []; }
}
function addScore(name,days,secs){
    var L=getScores();
    L.push({n:String(name).slice(0,16), d:days|0, t:secs|0, q:Date.now()});
    L.sort(function(a,b){ return (b.d-a.d)||(b.t-a.t); });
    L=L.slice(0,20);
    try{ localStorage.setItem("tuaz_scores",JSON.stringify(L)); }catch(e){}
    return L;
}
function showScores(){
    state="menu";
    screenEl.style.display="flex";
    var L=getScores(), h="", i;
    if(!L.length){
        h="<p style='text-align:center;'>Aucune partie terminee pour l'instant.</p>";
    } else {
        h="<table><tr><th>#</th><th>Survivant</th><th>Jours</th><th>Temps</th><th>Date</th></tr>";
        for(i=0;i<L.length;i++){
            var d=new Date(L[i].q);
            h+="<tr><td>"+(i+1)+"</td><td class='nm'>"+esc(L[i].n)+"</td>"+
               "<td>"+L[i].d+"</td><td>"+pad(Math.floor(L[i].t/60))+":"+pad(L[i].t%60)+"</td>"+
               "<td>"+pad(d.getDate())+"/"+pad(d.getMonth()+1)+"</td></tr>";
        }
        h+="</table>";
    }
    screenEl.innerHTML="<div id='panel' class='help'>"+
        "<h1>Scores</h1><div class='sub'>meilleures survies, en local sur cet appareil</div>"+
        "<div class='hscroll'>"+h+"</div>"+
        "<div style='margin-top:12px;'><button id='back' class='big'>RETOUR</button>"+
        (L.length?"<button id='wipe' class='big' style='margin-left:10px;font-size:13px;padding:12px 18px;'>EFFACER</button>":"")+
        "</div></div>";
    document.getElementById("back").onclick=function(){ audio(); showMenu(); };
    if(L.length) document.getElementById("wipe").onclick=function(){
        try{ localStorage.removeItem("tuaz_scores"); }catch(e){}
        sClick(); showScores();
    };
}

/* ----- bibliotheque du jeu : une rubrique par systeme en place ----- */
/* Une page de bibliotheque a partir des pieces d'une categorie. */
function cutPage(kind,intro){
    var s="<p class='note'>"+intro+"</p>", i, c, q;
    for(i=0;i<COUPURES.length;i++){
        c=COUPURES[i];
        if(c.k!==kind) continue;
        s+="<h3>"+c.t+"</h3><p class='note'>"+(CUTSRC[c.s]||"")+" - "+c.j+
           ", "+c.d+"</p>";
        if(c.s==="texto"&&c.m){
            for(q=0;q<c.m.length;q++)
                s+="<p class='note'>"+((c.m[q][0]==="moi")?"&gt; ":"&lt; ")+
                   c.m[q][1]+"</p>";
        } else s+="<p>"+c.c+"</p>";
    }
    return s;
}
var LIB=[
 /* Les dix coupures se relisent ici a tete reposee : l'ecran d'attente n'en
    montre que deux ou trois, et ce serait dommage d'ecrire l'effondrement du
    pays pour qu'il defile trop vite. La page se remplit toute seule depuis
    COUPURES, il n'y a donc rien a tenir a jour. */
 /* Les soixante pieces se relisent ici a tete reposee : l'ecran d'attente
    n'en montre que deux par chargement, et ce serait dommage d'ecrire
    l'effondrement d'un pays pour qu'il defile trop vite. Les deux pages se
    remplissent seules depuis COUPURES, il n'y a rien a tenir a jour. */
 {t:"La crise", h:cutPage("crise",
    "Ce qui a ete publie, envoye, ecrit ou griffonne pendant l'effondrement. "+
    "Dans l'ordre. Le mot qu'on attend n'y figure jamais.")},
 {t:"Le pays", h:cutPage("local",
    "Ce que le pays racontait de lui-meme avant, sans savoir. Presque tout y "+
    "est un indice, et aucun ne ment.")},
 {t:"Qui suis-je", h:
   "<p>Il n'y a pas de pseudo a saisir. Au lancement d'une partie, on prend la place "+
   "d'un habitant tire au sort sur la carte : on demarre a l'endroit ou il se tenait, "+
   "on porte son nom et sa silhouette, et il quitte la foule de son bourg. Le nom "+
   "s'affiche dans le cartouche en haut a gauche, dans le panneau d'equipement et "+
   "sur la table des scores.</p>"+
   "<p>On reprend aussi sa vie, et pas seulement sa place : son metier, ses "+
   "competences et ses aptitudes viennent avec. Le fermier commence robuste et "+
   "porteur, l'instituteur fin et sans force, le moniteur de tir avec une main "+
   "sure et rien d'autre. Le souffle et la sante se recalculent aussitot sur ces "+
   "aptitudes-la. C'est le premier trait de caractere que la partie vous donne, et "+
   "il n'est pas choisi : on fait avec ce qu'on a herite. Vous avez vous aussi une "+
   "histoire, celle de votre metier, meme si personne ne vous la demandera.</p>"},
 {t:"Commandes", h:
   "<table><tr><th>Touche</th><th>Effet</th></tr>"+
   "<tr><td class='nm'>ZQSD / fleches</td><td>marcher</td></tr>"+
   "<tr><td class='nm'>Ctrl (maintenu)</td><td>marche silencieuse</td></tr>"+
   "<tr><td class='nm'>Maj (maintenu)</td><td>sprint</td></tr>"+
   "<tr><td class='nm'>F</td><td>entrer dans un batiment, ou aborder le PNJ le plus proche</td></tr>"+
   "<tr><td class='nm'>S</td><td>ressortir d'un batiment, ou renoncer a une serrure</td></tr>"+
   "<tr><td class='nm'>1 2 3</td><td>repondre pendant une conversation</td></tr>"+
   "<tr><td class='nm'>I</td><td>ouvrir et fermer l'equipement</td></tr>"+
   "<tr><td class='nm'>P</td><td>pause</td></tr>"+
   "<tr><td class='nm'>N</td><td>couper le son</td></tr>"+
   "<tr><td class='nm'>L</td><td>couper le calque de lumiere</td></tr>"+
   "<tr><td class='nm'>M</td><td>ouvrir la carte</td></tr>"+
   "<tr><td class='nm'>K</td><td>cycle auto, jour fixe, nuit fixe</td></tr>"+
   "<tr><td class='nm'>R</td><td>recharger</td></tr>"+
   "<tr><td class='nm'>A</td><td>se soigner : consomme le premier soin du sac que l'acces rapide retient</td></tr>"+
   "<tr><td class='nm'>E</td><td>lancer l'arme de jet de l'acces rapide vers le point vise</td></tr>"+
   "<tr><td class='nm'>Molette / Q D</td><td>changer de ligne dans la liste de choix ouverte sous [F]</td></tr>"+
   "<tr><td class='nm'>Clic droit</td><td>tir a l'epaule : on s'immobilise, le cone se resserre, la vue recule</td></tr>"+
   "<tr><td class='nm'>F2</td><td>outil de reglage des zombis</td></tr>"+
   "<tr><td class='nm'>F3</td><td>outil de reglage : tout le registre pose au sol</td></tr>"+
   "<tr><td class='nm'>T</td><td>zoom : plan normal, avant x1.7, puis deux reculs</td></tr>"+
   "<tr><td class='nm'>X</td><td>turbo x3 (temps accelere)</td></tr>"+
   "<tr><td class='nm'>1 a 4</td><td>prendre en main l'arme de l'emplacement, ou la ranger</td></tr>"+
   "<tr><td class='nm'>B</td><td>changer de mode de tir : coup par coup, rafale, automatique</td></tr>"+
   "<tr><td class='nm'>Clic gauche</td><td>tirer</td></tr>"+
   "<tr><td class='nm'>V</td><td>lever ou baisser les bras, meme sans arme</td></tr>"+
   "<tr><td class='nm'>Souris</td><td>arme en main, le reticule suit le pointeur sur le cercle de visee</td></tr>"+
   "<tr><td class='nm'>F1</td><td>outil de reglage de la visee</td></tr>"+
   "</table>"+
   "<p>La visee ne designe pas un point mais une direction : le reticule, un simple "+
   "rond, reste toujours a la meme distance du personnage, sur un cercle de "+
   CFG.AIM_R+" px qui ne se voit pas, identique pour toutes les categories d'armes "+
   "qui tirent. Le pointeur a beau s'eloigner ou se coller au personnage, le "+
   "reticule ne quitte pas ce cercle.</p>"+
   "<p>[F1] ouvre l'outil de reglage. Il sert a fixer les bornes de chaque categorie "+
   "avant d'y tailler des armes, pour qu'aucune ne sorte de sa categorie.</p>"+
   "<p>La portee appartient a l'arme : elle ne depend ni du tireur ni de la maniere "+
   "de viser. Chaque categorie a donc une seule fourchette de portee, mini et maxi. "+
   "Le cone de dispersion, lui, depend des deux : il s'ouvre au tir au juge, se "+
   "resserre au tir a l'epaule, et va du plus mauvais tireur au meilleur. Chaque "+
   "categorie a donc deux fourchettes de cone, une par maniere de viser. Six valeurs "+
   "par categorie en tout. Le rayon du tir au juge, lui, ne se regle pas : il vaut "+
   CFG.AIM_R+" px pour toutes les armes.</p>"+
   "<p>La croix devant chaque valeur decide si elle se dessine, sans toucher au "+
   "reglage. La rangee Regler choisit la categorie modifiee, la rangee Afficher "+
   "celles que l'on voit : les trois peuvent se superposer, chacune dans sa couleur, "+
   "l'or pour la legere, le bleu pour la lourde, le vert pour le sniper. Les cones "+
   "se tracent jusqu'a la portee maxi, l'epaule en trait franc et le juge en trait "+
   "faible. Panneau ouvert, le viseur quitte la souris et se fige au nord ou a "+
   "l'ouest, pour que l'image reste stable pendant qu'on regle. Le cercle de 320 px "+
   "marque la limite du champ de vision. Le bouton copie ce qu'affiche la zone de "+
   "texte, reglages ou liste d'armes.</p>"+
   "<h2>Munitions et armes</h2>"+
   "<p>Six calibres, dont cinq reels et la cartouche de chasse sans laquelle aucun "+
   "fusil a pompe ne tiendrait debout. Vitesse et energie sont les chiffres du monde "+
   "reel, les degats en decoulent par la racine de l'energie, ramenee a une echelle "+
   "ou un homme vaut 100 points de vie.</p>"+
   "<table><tr><th>Calibre</th><th>Vitesse</th><th>Energie</th><th>Degats</th></tr>"+
   "<tr><td class='nm'>.22 LR</td><td>830 px/s</td><td>183 J</td><td>11</td></tr>"+
   "<tr><td class='nm'>9 mm</td><td>770 px/s</td><td>480 J</td><td>18</td></tr>"+
   "<tr><td class='nm'>.357 Mag</td><td>970 px/s</td><td>990 J</td><td>26</td></tr>"+
   "<tr><td class='nm'>cal. 12</td><td>880 px/s</td><td>2600 J</td><td>9 grains de 11, soit 99 a bout portant</td></tr>"+
   "<tr><td class='nm'>5,56 mm</td><td>2050 px/s</td><td>1730 J</td><td>34</td></tr>"+
   "<tr><td class='nm'>8 mm Lebel</td><td>1540 px/s</td><td>3140 J</td><td>46</td></tr>"+
   "<tr><td class='nm'>7,5 mm MAS</td><td>1850 px/s</td><td>3180 J</td><td>46</td></tr>"+
   "<tr><td class='nm'>7,62 mm</td><td>1830 px/s</td><td>3270 J</td><td>47</td></tr>"+
   "<tr><td class='nm'>.338 LM</td><td>1980 px/s</td><td>6560 J</td><td>66</td></tr>"+
   "<tr><td class='nm'>12,7 mm</td><td>1910 px/s</td><td>17000 J</td><td>107</td></tr></table>"+
   "<p>Le 5,56 file plus vite que le 12,7, comme dans la realite.</p>"+
   "<p>Deux de ces calibres n'existent plus qu'au musee : le 8 mm Lebel de 1886, "+
   "celui du Lebel, du Berthier, du Chauchat et de la Hotchkiss, et le 7,5 mm MAS de "+
   "1929, celui du FM 24/29, du MAS-36, du MAS-49/56 et du FR-F1. Ils frappent comme "+
   "du 7,62, mais on ne les trouve pas sur un soldat d'aujourd'hui : c'est la que "+
   "l'arme historique se paie.</p>"+
   "<p>Cinquante-six armes, toutes francaises d'origine ou en dotation dans l'armee "+
   "et la police francaises, de 1914 a nos jours. Les familles n'ont pas le meme "+
   "effectif : la France n'a que deux fusils d'assaut, le FAMAS et le HK416, elle a "+
   "en revanche quantite de fusils a verrou. Legeres : pistolets, revolvers et "+
   "mitraillettes. Lourdes : fusils d'assaut, carabines, mitrailleuses et fusils a "+
   "pompe. Snipers : coup par coup, DMR et fusils de precision.</p>"+
   "<p>Douze de ces armes viennent du stand de tir plutot que de l'armee : carabines "+
   ".22, semi-automatiques a chargeur de dix, revolvers de tir, fusil de ball-trap. "+
   "Elles sont volontairement faibles - peu de coups, jamais d'automatique - de quoi "+
   "tenir les premiers jours sans valoir un FAMAS. Aucune arme ne porte ses cones en "+
   "propre : ils "+
   "se deduisent des bornes de sa categorie et de sa finesse, de sorte qu'aucune ne "+
   "peut sortir de sa categorie, quoi qu'on regle dans l'outil. Rien ne tire "+
   "encore : ce sont les fiches, pas encore le fusil.</p>"+
   "<p>Quatre emplacements d'arme, un par categorie : corps a corps, legere, lourde "+
   "et sniper. Chacun porte la silhouette de l'arme qui s'y trouve, et le personnage "+
   "la tient a l'epaule, tournee dans l'axe de visee. Cliquer un emplacement ouvre la liste de sa "+
   "categorie, cliquer une arme l'y range ; rien d'autre n'y entre. Les touches 1 a 4 "+
   "prennent l'arme en main, ou la rangent si elle y est deja. Sortir une arme prend "+
   "du temps, de 0,3 s pour un pistolet a 1,3 s pour une M2, et le reticule pali "+
   "tant que l'arme n'est pas sortie.</p>"+
   "<p>La maniabilite commande aussi la vitesse a laquelle le reticule rattrape la "+
   "souris : un pistolet lui colle, une mitrailleuse la suit de loin. Le clic gauche "+
   "tire, a la cadence de l'arme ; l'ecart de chaque balle est tire dans le cone que "+
   "laissent ouvert la competence Tir et l'aptitude Stabilite du tireur, entre le "+
   "pire et le meilleur de la categorie. Un fusil a pompe lache ses neuf grains d'un "+
   "coup. Les balles s'arretent sur un mur, un arbre ou un bloc, et meurent a la "+
   "portee de l'arme.</p>"+
   "<p>Les munitions se comptent. Le bandeau porte le chargeur a gauche et la "+
   "reserve du calibre a droite. Recharger prend dans cette reserve : les boites "+
   "entieres du sac, et les cartouches en vrac d'une boite deja entamee - le vrac "+
   "pese comme le reste, une boite ouverte ne s'evapore pas. On ne complete que "+
   "jusqu'ou la reserve va : un chargeur incomplet vaut mieux qu'un refus, et sans "+
   "une seule cartouche du bon calibre le geste ne part meme pas. Une arme trouvee "+
   "arrive vide : la reposer et la reprendre ne la remplit pas.</p>"+
   "<p class='note'>La reserve n'est comptee que pour vous : les habitants armes "+
   "tirent sans compter leurs cartouches, et c'est voulu. Un uniforme qui tombe a "+
   "court au milieu d'une riposte deviendrait une cible immobile, et la carte se "+
   "viderait de ses defenseurs sans que rien ne se voie. La rarete des munitions "+
   "est un probleme de joueur.</p>"+
   "<p>[B] change de mode de tir parmi ceux que l'arme accepte : coup par coup, "+
   "rafale de trois, automatique. Un MAC Mle 1950 n'a que le coup par coup, un HK416F "+
   "les trois, une mitrailleuse l'automatique seul. En automatique la gachette maintenue "+
   "vide le chargeur a la cadence de l'arme, et le reticule continue de suivre la "+
   "souris.</p>"+
   "<p>Cinq armes de corps a corps : le poignard de tranchee Le Vengeur, la "+
   "baionnette Rosalie du Lebel, le tonfa de la police, la beche-pioche de 1916 et "+
   "la hache de sapeur de la Legion. Elles ne lancent rien : le coup porte a sa "+
   "portee, de 17 a 34 px, "+
   "dans l'arc que l'outil de reglage fixe pour la categorie. Le quatrieme onglet de "+
   "[F1] regle leurs bornes comme celles des armes a feu, le coup rapide et le coup "+
   "lourd remplacant le tir au juge et le tir a l'epaule.</p>"+
   "<p>Deux dessins par arme, qui ne servent pas au meme endroit. Sur le personnage, "+
   "une silhouette large en trois teintes, metal sombre, metal clair et bois, une par "+
   "famille : c'est ce qu'on voit a l'epaule, tournee dans l'axe de visee. Dans "+
   "l'emplacement, une vignette d'une seule couleur, dessinee a la main pour chaque "+
   "arme dans une boite de 192 sur 84 : on y reconnait la poignee de transport du "+
   "FAMAS, le chargeur en demi-lune du Chauchat et celui du FM 24/29 plante sur le "+
   "dessus, le barillet cannele des revolvers, les deux canons superposes du "+
   "Browning B525, le trepied de la Hotchkiss de 1914, le bipied des mitrailleuses, "+
   "le tube sous canon et la pompe des fusils a pompe. Elle servira "+
   "aussi de pictogramme au bandeau.</p>"+
   "<p>La vignette est plate et d'un seul blanc, sans ombre ni modele : c'est le "+
   "contour et les trous qui font tout le travail, comme dans les vignettes "+
   "d'inventaire des jeux de survie. Elle est retournee bouche a gauche, a "+
   "l'inverse de la silhouette portee.</p>"+
   "<p>Le tir, la visee au clic droit qui immobilise le personnage, et le report de "+
   "la vue quand la portee de l'arme depasse le champ de vision restent a ecrire.</p>"},
 {t:"Les trois marches", h:
   "<p>L'allure se choisit en maintenant une touche : rien pour la marche normale, "+
   "Ctrl pour la marche silencieuse, Maj pour le sprint. Ctrl l'emporte si les deux "+
   "sont enfoncees, on ne part donc jamais en sprint par accident.</p>"+
   "<table><tr><th>Allure</th><th>Vitesse</th><th>Halo</th><th>Cadence</th></tr>"+
   "<tr><td class='nm'>Silencieuse</td><td>x0.55</td><td>x0.5</td><td>lente</td></tr>"+
   "<tr><td class='nm'>Normale</td><td>x1</td><td>x1</td><td>normale</td></tr>"+
   "<tr><td class='nm'>Sprint</td><td>x1.65</td><td>x1.15</td><td>rapide</td></tr>"+
   "</table>"+
   "<p class='note'>Le halo est la lumiere que le personnage projette la nuit : plus il est "+
   "large, plus on se voit de loin. Le sprint puise dans l'endurance : 14 points par "+
   "seconde, davantage si le sac est lourd. A bout de souffle la barre bat et la touche "+
   "de course ne repond plus tant qu'on n'a pas repris le cinquieme de sa reserve.</p>"},
 {t:"Le souffle et la charge", h:
   "<p>Deux ressources tiennent au Cardio et se voient tout de suite : le souffle "+
   "commande la course, la charge commande les jambes.</p>"+
   "<p>La reserve d'endurance vaut 60 points plus 0,8 par point de Souffle : 100 aux "+
   "aptitudes de depart, 140 au mieux, 60 au pire. Le sprint la vide de 14 points par "+
   "seconde, un coup de corps a corps en coute 6 et un coup lourd 9. Elle revient de 5 "+
   "points par seconde en marchant, 7 accroupi, 11 a l'arret ou a l'abri d'un batiment, "+
   "mais jamais dans la seconde qui suit l'effort. Tombee a zero, la barre bat et la "+
   "touche de course reste muette tant qu'on n'a pas repris le cinquieme de sa reserve.</p>"+
   "<p>La charge portable vaut 12 kg plus 0,28 par point de Portage : 26 kg au depart, "+
   "40 au mieux. Le sac lui-meme, ce qu'il contient et les armes que l'on tient comptent "+
   "tous. Jusqu'a la moitie de la capacite on ne sent rien ; au-dela la vitesse descend "+
   "jusqu'a moins 30 pour cent a pleine charge et le sprint coute jusqu'a 80 pour cent "+
   "de plus.</p>"+
   "<p>Rien n'interdit de depasser la capacite, mais le prix tombe d'un coup. Des "+
   "que la charge passe le Portage, la course est refusee et l'accroupissement "+
   "aussi : il ne reste que la marche. Et cette marche coute du souffle - six "+
   "points par seconde - la ou marcher en rendait. On peut vider un pillage entier "+
   "dans son sac et rentrer avec, a condition de rentrer a pied.</p>"+
   "<p>Quand le souffle est a sec, les jambes lachent : moins 45 pour cent de "+
   "vitesse jusqu'a ce qu'on s'arrete pour reprendre. On rentre au pas, en pleine "+
   "lumiere, sans pouvoir se cacher ni fuir : c'est le vrai prix de l'avidite.</p>"+
   "<p>La carcasse a son mot aussi : sous trente pour cent de sa vie on ne court "+
   "plus, quelle que soit la reserve d'air. Et sous quinze pour cent on perd un "+
   "point toutes les douze secondes, comme la fievre et en plus d'elle - un malade "+
   "exsangue en perd deux. Seuls le repos a la base et les soins arretent "+
   "l'hemorragie. Ce sont des parts et non des points : un point de vie vaut ici "+
   "la Sante, et tout le monde n'a pas la meme carcasse.</p>"+
   "<p class='note'>Les habitants obeissent a la meme regle : celui qui fuit court "+
   "environ neuf secondes, puis continue de fuir au pas. C'est la, et pas avant, que le "+
   "zombi rattrape. Les zombis n'ont pas d'endurance.</p>"},
 {t:"Jour et nuit", h:
   "<p>Un cycle complet dure 5 minutes : 3 min 30 de jour puis 1 min 30 de nuit, "+
   "avec un crepuscule et une aube de 20 secondes chacun. Le compteur de jours monte "+
   "a la fin de l'aube.</p>"+
   "<table><tr><th>Phase</th><th>Duree</th><th>Obscurite</th></tr>"+
   "<tr><td class='nm'>Jour</td><td>3 min 10</td><td>0.00</td></tr>"+
   "<tr><td class='nm'>Crepuscule</td><td>20 s</td><td>0.00 vers 0.82</td></tr>"+
   "<tr><td class='nm'>Nuit</td><td>1 min 10</td><td>0.82</td></tr>"+
   "<tr><td class='nm'>Aube</td><td>20 s</td><td>0.82 vers 0.00</td></tr>"+
   "</table>"+
   "<p>Les lampadaires s'allument a la tombee de la nuit et s'eteignent au lever du jour. "+
   "Le halo du personnage, celui des portails et celui des lampadaires sont dessines dans "+
   "un calque de lumiere qui perce l'obscurite.</p>"},
 {t:"Le monde", h:
   "<p>La carte fait 3840 x 3840 pixels et se genere a partir de trois graines : une pour "+
   "le budget (combien de chaque chose), une pour le trace, une pour la simulation. Deux "+
   "parties lancees avec les memes graines donnent exactement le meme monde.</p>"+
   "<table><tr><th>Element</th><th>Quantite</th><th>Note</th></tr>"+
   "<tr><td class='nm'>Forets</td><td>16 a 26</td><td>de 4 a 120 arbres, canopee transparente quand on passe dessous</td></tr>"+
   "<tr><td class='nm'>Collines</td><td>1 a 2</td><td>plateau cerne d'une pente, source d'une riviere</td></tr>"+
   "<tr><td class='nm'>Herbes hautes</td><td>10 a 18 nappes</td><td>cachent le bas du corps</td></tr>"+
   "<tr><td class='nm'>Ports</td><td>1 a 3</td><td>quai au bord de l'eau, 1 a 2 bateaux, 5 a 10 batiments dont 2 hangars</td></tr>"+
   "<tr><td class='nm'>Rivieres</td><td>2 a 4</td><td>traversent la carte</td></tr>"+
   "<tr><td class='nm'>Etangs</td><td>3 a 5</td><td>roseaux, nenuphars, grenouilles</td></tr>"+
   "<tr><td class='nm'>Grande ville</td><td>1</td><td>50 a 80 batiments dont des immeubles, 5 tours, 1 a 2 grandes institutions</td></tr>"+
   "<tr><td class='nm'>Villages</td><td>1 a 3</td><td>5 a 20 batiments, 1 a 3 tours, un puits, des habitants</td></tr>"+
   "<tr><td class='nm'>Abris</td><td>5 a 20</td><td>une cabane sur deux, une tente sur deux ; loin de tout, jamais reliees au reseau</td></tr>"+
   "<tr><td class='nm'>Hardes de biches</td><td>2 a 4</td><td>5 a 10 betes, toujours a l'ecart des hommes</td></tr>"+
   "<tr><td class='nm'>Fermes</td><td>4 a 7</td><td>2 a 5 champs, 1 a 4 personnes, parfois une tour ou un hangar</td></tr>"+
   "<tr><td class='nm'>Grottes</td><td>4 a 6</td><td>bouches noires, decor seul pour l'instant</td></tr>"+
   "<tr><td class='nm'>Chateau</td><td>1</td><td>unique, relie au reseau par un chemin depuis sa porte</td></tr>"+
   "<tr><td class='nm'>Caserne militaire</td><td>1</td><td>enceinte grillagee, corps de garde, deux baraquements</td></tr>"+
   "<tr><td class='nm'>Caserne de pompiers</td><td>1</td><td>trois portes de garage, tour a tuyaux</td></tr>"+
   "<tr><td class='nm'>Hopital</td><td>1</td><td>bloc blanc, croix sur le toit, helisurface</td></tr>"+
   "<tr><td class='nm'>Hangars</td><td>1 a 2</td><td>toit courbe, porte coulissante</td></tr>"+
   "<tr><td class='nm'>Stations-service</td><td>1 a 2</td><td>toujours au bord d'une route ; boutique verrouillee, auvent, deux pompes</td></tr>"+
   "</table>"+
   "<h2>Le relief et le couvert</h2>"+
   "<p>Une ou deux collines par carte. Chacune a un plateau cerne d'une pente : "+
   "gravir la pente coute 80 pour cent de la vitesse, mais une voie amenagee qui la "+
   "traverse annule la penalite, et une fois en haut on marche normalement. Le contour "+
   "n'est jamais un disque parfait, deux houles le deforment, et le relief se lit par "+
   "des paliers concentriques, des courbes de niveau et un flanc a l'ombre.</p>"+
   "<p>De chaque colline nait une riviere qui vise la cote la plus eloignee et gagne "+
   "la mer par le plus long chemin, en s'elargissant en chemin. Tant qu'elle devale la "+
   "pente elle cascade : marches rocheuses en travers du lit, bourrelets d'ecume et "+
   "embruns sur les bords. Sur le plateau on trouve "+
   "des bosquets, des blocs de pierre, parfois un etang, parfois une ferme.</p>"+
   "<p>Les nappes d'herbes hautes couvrent les zones libres. En les traversant on perd "+
   "un cinquieme de sa vitesse et le bas du corps disparait dans les tiges. Aucune ne "+
   "subsiste sous les paves d'un bourg, le beton d'un port ou une chaussee : on ne peut "+
   "pas etre freine par une herbe qu'on ne voit pas.</p>"+
   "<p>Dans l'eau, le corps s'enfonce jusqu'a la taille et des anneaux se forment a la "+
   "surface. Une riviere emporte : des tirets d'ecume filent vers l'aval et le courant "+
   "pousse le nageur de 26 px par seconde. Un pont, un gue ou un quai annulent tout cela.</p>"+
   "<p>Aucune tache du monde n'est un disque : le rayon de chaque nappe d'eau, d'herbe "+
   "ou de prairie ondule avec l'angle, ce qui casse la silhouette de rond pose sur rond.</p>"+
   "<h2>Les ports</h2>"+
   "<p>Un a trois ports sur le littoral. Un quai sur pilotis avance dans la mer sans "+
   "jamais depasser le trait de cote : sa longueur s'ajuste a la profondeur disponible. "+
   "Un ou deux bateaux y sont amarres. Autour, 5 a 10 batiments dont toujours deux "+
   "hangars.</p>"+
   "<h2>Dessus ou dessous</h2>"+
   "<p>Le tablier d'un pont et l'eau qui coule dessous occupent la meme case de "+
   "la carte : ce qui decide, c'est par ou l'on est entre. Venu par la terre, on "+
   "marche sur le pont. Venu par l'eau, on reste dessous, et l'on n'en remonte "+
   "pas : la berge se prend a la nage, jamais le tablier. On peut en revanche "+
   "quitter le pont par le cote et se laisser tomber a l'eau - le chemin ne va "+
   "que dans ce sens.</p>"+
   "<p>Sous un tablier, on est hors de vue : les zombis perdent la trace et "+
   "cessent de suivre. C'est la seule cachette de la carte qui coupe la "+
   "poursuite. Le bruit, lui, porte toujours : un coup de feu tire de dessous "+
   "les ramene.</p>"+
   "<p>Quai et ponts de bateau portent : on y marche a pied sec et a vitesse pleine. "+
   "Le compte a rebours de depart ne se declenche qu'une fois monte a bord d'un bateau, "+
   "pas en arrivant sur la place du port.</p>"+
   "<h2>Les fermes</h2>"+
   "<p>Chaque ferme a 2 a 5 champs serres autour du corps de ferme, de deux "+
   "natures. Le champ cultive porte ses rangs de legumes sur de la terre labouree. "+
   "La pature est un enclos d'herbe grasse ceint d'une barriere a deux lisses, "+
   "infranchissable, avec une seule ouverture tournee vers la ferme.</p>"+
   "<p>Une tour de guet et un hangar peuvent accompagner la ferme, tires au sort "+
   "au budget. Un chemin de terre relie l'exploitation au reseau.</p>"+
   "<h2>La grande ville</h2>"+
   "<p>Une agglomeration par carte porte 50 a 80 batiments. Elle seule construit "+
   "des immeubles, de trois a cinq etages, qui occupent pres de la moitie de ses "+
   "constructions ordinaires. Elle abrite aussi une ou deux grandes institutions "+
   "prises parmi la caserne de pompiers et l'hopital ; celle qui n'y est pas reste "+
   "en rase campagne. Cinq tours de guet en gardent le pourtour.</p>"+
   "<h2>Dans les villages</h2>"+
   "<p>Un village compte 5 a 20 batiments. Des maisons, et une poignee d'edifices "+
   "publics tires au sort sans doublon, environ un batiment sur deux : mairie (toujours "+
   "presente), cabinet medical, commissariat, armurerie, centre de soins, restaurant, bar, "+
   "ecole, superette, droguerie, depot. Aucun n'a de fonction pour l'instant, seule leur "+
   "silhouette est dessinee.</p>"+
   "<p>Les tours de guet ont perdu tout pouvoir et rejoignent le decor du village : une "+
   "pour un petit bourg, deux au-dela de neuf batiments, trois au-dela de quinze. Elles se "+
   "posent sur le pourtour, jamais sur la chaussee ni sur un batiment.</p>"+
   "<h2>Trottoirs et ceintures</h2>"+
   "<p>Tout batiment d'un bourg ou d'un port est ceint d'un trottoir de dalles "+
   "claires. Hors des bourgs, un batiment est ceint de la meme matiere que la voie "+
   "qui le dessert : une route s'il est au bout d'une route, un chemin de terre "+
   "sinon. Ces ceintures sont elaguees comme le reste : jamais sous un mur voisin, "+
   "ni sur un arbre, un caillou ou un champ.</p>"+
   "<p>Les batiments d'un bourg sont espaces d'au moins 22 px, de quoi loger deux "+
   "anneaux entre deux murs. Le reseau pieton se calcule ensuite par propagation : "+
   "le bourg est quadrille en cases de 6 px, celles qu'occupent murs, arbres et "+
   "blocs sont marquees, et une distance se diffuse depuis la chaussee. Chaque "+
   "batiment redescend la pente jusqu'a la rue. Les anneaux etant deja des "+
   "trottoirs, le maillage ne les double pas : les batiments sont traites du plus "+
   "proche de la chaussee au plus loin, et chacun ne peut se raccrocher qu'a un "+
   "anneau deja relie, jamais l'inverse. Un dernier passage retire tout troncon "+
   "double par un autre a moins de dix pixels. La ou un trottoir traverse "+
   "vraiment une route goudronnee, c'est-a-dire quand il se poursuit sur l'autre "+
   "rive, un passage pieton est peint : ses bandes courent le long de la chaussee "+
   "et se succedent en travers, et le motif est centre sur l'axe de la route. Deux "+
   "passages ne se posent jamais a moins de 150 px l'un de l'autre, et les chemins "+
   "de terre n'en recoivent pas.</p>"+
   "<h2>Le reseau</h2>"+
   "<p>Les routes ne suivent plus une grille : elles vont de village en village, "+
   "dans n'importe quelle direction, et serpentent au lieu d'aller droit. Le trace "+
   "part d'un arbre couvrant minimal entre les villages, auquel s'ajoutent une a trois "+
   "liaisons courtes qui creent les croisements.</p>"+
   "<p>Une route est une suite de villages traversee d'un bout a l'autre. Un village "+
   "n'a qu'une seule route : les chaines de liaison sont examinees de la plus longue a "+
   "la plus courte, la premiere qui ne touche aucun village deja desservi devient une "+
   "route goudronnee, toutes les autres se rabattent en chemin de terre. Les batiments "+
   "se posent apres la chaussee et la bordent sans jamais s'y installer, et le puits se "+
   "decale si la route passe sur lui.</p>"+
   "<p>Le sol du bourg n'est pas celui de la lande : terre battue au contour irregulier, "+
   "paves autour du puits, lisiere qui s'effiloche dans l'herbe. Il est peint avant les "+
   "voies, la chaussee passe donc par-dessus.</p>"+
   "<p>Les chemins de terre completent le reseau : ils relient les villages que la route "+
   "n'a pas joints, et raccordent au reseau chaque ferme, le chateau, la caserne "+
   "militaire, la caserne de pompiers, l'hopital et les hangars. Aucun batiment ne reste "+
   "orphelin.</p>"+
   "<p>Rien ne se batit sur l'eau, et rien ne s'y croise. L'eau est generee avant le "+
   "reseau : chaque chemin de raccordement est verifie au sec de bout en bout, et une "+
   "voie qui croiserait une autre au-dessus de l'eau est refusee. Un chemin arrive "+
   "toujours par la facade du batiment qu'il dessert.</p>"+
   "<p>Deux chaussees ne se longent pas. Une chaine qui suivrait de trop pres une "+
   "route deja tracee se rabat en chemin, un trace qui revient se coller a lui-meme "+
   "apres un meandre est recousu, et tout troncon de chemin qui double une route a "+
   "moins de 60 px dans la meme direction est supprime.</p>"+
   "<p>La ou une chaussee est franchement coupee par une autre voie, un rond-point "+
   "s'installe : anneau de bitume, marquage blanc pointille et terre-plein plante "+
   "que l'on doit contourner. Jamais dans un bourg, jamais sur l'eau ou sur un "+
   "ouvrage, jamais contre un mur, et six au plus par carte.</p>"+
   "<h2>Le sol</h2>"+
   "<p>La lande n'est plus uniformement brune : trois cents nappes d'herbe verte la "+
   "percent, plus de trois mille buissons y sont semes, et une plage de sable court "+
   "le long de tout le trait de cote, en trois bandes du sable clair du bord a la terre "+
   "de l'interieur, avec ses galets.</p>"+
   "<h2>La cote</h2>"+
   "<p>Le trait de cote n'est pas droit : la profondeur de la mer ondule le long de "+
   "chaque bord, somme de trois houles tirees avec la carte, soit une variation de "+
   "plus ou moins 105 px autour des 150 px de la bande. Baies et avancees de terre "+
   "en decoulent, et le rendu de l'ocean, l'ecume et le sable mouille suivent la "+
   "meme courbe.</p>"+
   "<h2>Ponts et gues</h2>"+
   "<p>Partout ou une voie franchit une riviere, une mare ou l'ocean, un ouvrage est pose. "+
   "La route recoit un pont de bois avec tablier, planches et garde-corps ; le chemin de "+
   "terre recoit un gue, quelques pierres qui affleurent. Sur un ouvrage on marche a "+
   "vitesse pleine, sans la boue du marais, et le requin ne mord pas.</p>"+
   "<h2>Sortir de la carte</h2>"+
   "<p>Chaque route continue au-dela du dernier village jusqu'au cadre du monde, franchit "+
   "l'ocean sur un long pont et s'acheve sur un panneau. Rester sur ce point de passage "+
   "lance un compte a rebours de 10 secondes, annonce a l'ecran. S'en ecarter l'annule. "+
   "Au terme, l'annonce tombe et rien d'autre : le changement de carte viendra plus tard.</p>"+
   "<p>Une bande de mer de 150 px ceinture la carte. Y rester declenche un avertissement "+
   "au bout de 3 secondes et une morsure fatale a 7 secondes : c'est la limite du monde.</p>"},
 {t:"Le decor vivant", h:
   "<table><tr><th>Qui</th><th>Comportement</th></tr>"+
   "<tr><td class='nm'>Villageois</td><td>1 a 3 par maison, 2 a 3 par immeuble ; ils arpentent tout le bourg sans se soucier de personne</td></tr>"+
   "<tr><td class='nm'>Soldat</td><td>plante devant sa maison, le recrutement viendra plus tard</td></tr>"+
   "<tr><td class='nm'>Pecheurs</td><td>pechent au bord de l'eau sans se soucier de personne</td></tr>"+
   "<tr><td class='nm'>Fermiers</td><td>1 a 4 par ferme, binent leurs champs</td></tr>"+
   "<tr><td class='nm'>Pompiers</td><td>2 a 4 autour de leur caserne, qu'ils ne quittent jamais</td></tr>"+
   "<tr><td class='nm'>Policiers</td><td>2 a 3 devant leur commissariat</td></tr>"+
   "<tr><td class='nm'>Soignants</td><td>autour de l'hopital, du cabinet medical et du centre de soins</td></tr>"+
   "<tr><td class='nm'>Betail</td><td>moutons, cochons ou poules, 2 a 6 par pature selon sa taille, jamais hors de l'enclos</td></tr>"+
   "<tr><td class='nm'>Grenouilles</td><td>sautillent autour des etangs</td></tr>"+
   "<tr><td class='nm'>Garnison</td><td>10 a 20 soldats en ronde dans l'enceinte de la caserne et sur son pourtour</td></tr>"+
   "<tr><td class='nm'>Mobilier de bourg</td><td>bacs a fleurs, une fontaine au-dela de 8 batiments, une statue au-dela de 12</td></tr>"+
   "<tr><td class='nm'>Biches</td><td>paissent en harde, detalent des 190 px et ne s'approchent jamais d'une zone habitee</td></tr>"+
   "<tr><td class='nm'>Oiseaux</td><td>1 a 5 s'envolent d'un arbre quand on passe a moins de 44 px</td></tr>"+
   "<tr><td class='nm'>Poissons</td><td>sautent hors des mares, des lacs et de la mer, six au plus a la fois ; les rivieres, trop vives, n'en portent pas</td></tr>"+
   "</table>"+
   "<p>Tous les PNJ ont la silhouette du personnage, l'epee en moins, avec sa demarche "+
   "a deux poses ou seules les chaussures avancent ; cheveux, peau, veste et bas les "+
   "distinguent, et une silhouette sur deux est feminine. Ils subissent le meme terrain que lui : "+
   "ils s'enfoncent dans l'eau, ralentissent dans les herbes hautes et sur les pentes "+
   "hors des voies, et butent sur les murs, les cloture et les barrieres.</p>"},
 {t:"Entrer et parler", h:
   "<p>Chaque porte s'annonce : une maison reste une maison, mais un immeuble "+
   "donne son adresse et un commerce son enseigne. On entre chez la Charcuterie "+
   "Vasseur ou au 12 rue du Four, pas dans un batiment.</p>"+
   "<h2>La rumeur</h2>"+
   "<p>Il court une histoire sur le laboratoire H-teck. Vingt reponses vont du "+
   "complot pur au haussement d'epaules, et chacun a sa place sur cette echelle : "+
   "une foi tiree a sa naissance, qui ne bouge plus. Ce n'est pas la personne qui "+
   "change d'avis au fil de la conversation - c'est le monde qui change autour "+
   "d'elle.</p>"+
   "<p>La question en ouvre trois autres. Aupres de qui se renseigner : a la "+
   "mairie de la plus grande ville, dont il donne le nom et le cap. Ce que vous "+
   "en pensez vous-meme : il repond selon ce qu'il croit, et le convaincu se sent "+
   "moins seul. Ou se trouve le laboratoire : il tend le bras, et le ton varie - "+
   "le sceptique vous dit que vous perdrez votre temps, le convaincu vous demande "+
   "de revenir lui dire ce que vous y avez trouve.</p>"+
   "<h2>Les trois etats du pays</h2>"+
   "<p>Tout le ton du jeu suit la part du monde qui a tourne : les zombis "+
   "rapportes a tout ce qui marche encore.</p>"+
   "<p>Tant que moins d'un cinquieme a tourne, on salue comme avant, on rit de "+
   "ceux qui croient a la rumeur, et personne ne quitte son bourg pour vous "+
   "suivre : chacun a une vie a defendre.</p>"+
   "<p>Passe le cinquieme, la peur monte. Les saluts changent - on demande si "+
   "vous avez croise quelqu'un sur la route, on ferme tot. Les convaincus se "+
   "multiplient : le meme homme, a la meme foi de naissance, penche desormais du "+
   "cote de ceux qui y croient. Et un sur trois environ accepte de vous suivre, "+
   "les autres ajoutant qu'on ne sait jamais, repassez me voir.</p>"+
   "<p>Au-dela de la moitie, il n'y a plus de sceptique : il n'y a que des gens "+
   "qui ont vu. On salue en survivant, on parle bas parce qu'ils viennent au "+
   "bruit, et plus personne ne refuse de partir. Il n'y a plus rien a garder.</p>"+
   "<h2>La base</h2>"+
   "<p>Tant que le pays tient, personne ne s'installe : on ne prend pas un "+
   "toit quand on peut encore rentrer chez soi. Ce n'est qu'au dernier etat du "+
   "monde, quand plus personne ne doute, qu'on peut entrer dans un batiment et "+
   "le declarer sien avec [B]. Dehors, [B] change toujours le mode de tir - les "+
   "deux gestes ne peuvent pas se rencontrer.</p>"+
   "<p>La capacite suit la surface au sol : huit places dans un abri ou une "+
   "tour de guet, dix-sept dans une maison, quarante dans un depot, soixante "+
   "dans un hangar, un chateau ou un immeuble. C'est la seule raison de "+
   "preferer un batiment a un autre. On peut demenager : le stock suit, dans la "+
   "limite du nouveau toit, et ce qui ne rentre pas reste sur place.</p>"+
   "<p>On ne range rien a distance : il faut etre sur place. Les cases se "+
   "posent depuis le bouton <i>ranger a la base</i> de l'onglet EQUIPEMENT, et "+
   "se reprennent d'un clic sur les rayonnages.</p>"+
   "<h2>Les quatre reserves</h2>"+
   "<p>Elles ne sont pas comptees a part : elles se lisent dans ce qui est "+
   "entrepose. Un stock n'est pas un chiffre abstrait, c'est un rayonnage. Les "+
   "vivres comptent en rations, les munitions en cartouches, les soins en "+
   "pieces, le materiel en matiere premiere.</p>"+
   "<p>Au lever de chaque jour, la base prend trois choses sur ses "+
   "rayonnages : les rations, les medicaments des blesses, et la matiere "+
   "premiere de l'entretien. Ce qui manque est compte, annonce, et se paie - "+
   "au moral d'abord, puis chacun a sa facon propre.</p>"+
   "<h2>Chez soi, on gere</h2>"+
   "<p>Rentrer chez soi n'est pas entrer dans un batiment. Le personnage cesse "+
   "d'obeir aux touches, on n'y fouille rien, et l'onglet BASE s'ouvre de "+
   "lui-meme : c'est lui qui devient le jeu. Plus tard s'y ajoutera l'onglet "+
   "des missions.</p>"+
   "<p>Pendant ce temps le groupe tient les murs. Chacun tire sur ce qui "+
   "approche a moins de 250 pas, sans qu'on ait a le dire : ils sont armes, ils "+
   "voient, ils tirent. Vous en faites autant depuis la fenetre - et vous seul "+
   "payez vos cartouches, comme partout ailleurs. A sec, vous rechargez ; sans "+
   "reserve, vous regardez.</p>"+
   "<h2>Se refaire</h2>"+
   "<p>Chez soi, les plaies se referment : un point de vie toutes les deux "+
   "secondes, et la carcasse est a neuf en quelques minutes a l'abri. C'est la "+
   "seule regeneration du jeu, et elle n'existe que la. Au lever du jour, une "+
   "nuit passee chez soi rend tout le reste.</p>"+
   "<p>La maladie, elle, ne se soigne pas si vite. Elle ronge desormais pour de "+
   "bon - un point de vie toutes les douze secondes, vingt-cinq par jour de jeu "+
   "- parce qu'il existe enfin un endroit ou en guerir. Un medicament fait "+
   "retomber la fievre pour une journee entiere, mais ce n'est qu'un repit : il "+
   "soulage, il ne soigne pas.</p>"+
   "<p>La guerison demande trois journees de repos a la base, et le repos doit "+
   "etre continu : une seule nuit dehors remet le compteur a zero. C'est long, "+
   "c'est immobile, et c'est le prix.</p>"+
   "<h2>Les missions</h2>"+
   "<p>Quand on est cinq a tenir un toit, on cesse de sortir tous ensemble : on "+
   "envoie. L'onglet MISSIONS ne s'ouvre qu'a ces deux conditions - une base, "+
   "et cinq compagnons. A quatre on est une bande, a cinq on est une "+
   "maison.</p>"+
   "<p>On envoie quelqu'un chercher une chose precise : des armes, des "+
   "medicaments, des munitions, des vivres ou des materiaux. Il part seul pour "+
   "vingt-quatre heures et revient deposer sur les rayonnages. Ce qu'il ramene "+
   "depend de sa Fouille, comme partout.</p>"+
   "<p>Il ne se joue pas, il se raconte. Toutes les dix secondes il lui arrive "+
   "quelque chose ou non : sa Discretion decide s'il passe inapercu, sa Vigueur "+
   "ce qu'il encaisse quand il ne passe pas, sa Parade s'il evite les dents. "+
   "Deux motifs le font rentrer avant l'heure, et deux seulement : etre blesse "+
   "a plus de la moitie, ou avoir ete mordu. Dans les deux cas il revient avec "+
   "ce qu'il avait deja, et le moral en prend un coup.</p>"+
   "<p>Un homme sous la moitie de sa vie ne part pas seul. C'est le seul "+
   "endroit ou le jeu refuse : avec vous, un blesse est couvert et c'est votre "+
   "affaire de le risquer ; seul dans la nature, personne ne le releve. Celui "+
   "qui rentre mordu rentre malade : il faudra le soigner comme les autres.</p>"+
   "<h2>Ce qu'on lui met sur le dos</h2>"+
   "<p>Son rang dit ce qu'on ose lui demander, et rien d'autre : c'est un "+
   "acces, jamais une prime. Ce qu'il <b>emporte</b>, en revanche, change la "+
   "facon dont la course se passe. Une arme a feu avec de quoi la nourrir le "+
   "protege : il encaisse un tiers de moins et se fait mordre bien moins "+
   "souvent. Une lame, ou un fusil a sec, valent moitie moins. Les mains "+
   "nues ne valent rien du tout.</p>"+
   "<p>Et son <b>sac</b> borne ce qu'il peut rapporter, selon son Portage "+
   "comme partout : parti le dos charge, il revient le dos charge. Le "+
   "decharger avant de l'envoyer double presque sa recolte. L'onglet "+
   "MISSIONS le dit avant le depart - arme ou desarme, et ce qu'il lui reste "+
   "de place.</p>"+
   "<h2>Le moral</h2>"+
   "<p>Il est global : il n'y a pas dix humeurs, il y en a une, celle de la "+
   "base, et tout le monde la partage. Cinq crans - desespere, morose, "+
   "ordinaire, bon, excellent. Celui du milieu ne donne rien ni ne retire rien, "+
   "et c'est la qu'on commence ; au-dessus on frappe plus fort et l'on se "+
   "fatigue moins, en dessous c'est l'inverse, de huit a seize pour cent.</p>"+
   "<p>Il monte avec ce qu'on batit et descend avec ce qui manque. Sans rien "+
   "faire, il revient doucement vers l'ordinaire : personne ne reste desespere "+
   "sans raison.</p>"+
   "<h2>Ce qu'il faut chaque jour</h2>"+
   "<p>Une ration par personne, deux pour qui est blesse - un corps qui se "+
   "repare mange davantage. Et un medicament par jour et par blesse. Ce qui "+
   "manque se paie deux fois : le moral tombe, et le manque a sa consequence "+
   "propre. Pas de nourriture, aucun point de vie rendu au lever du jour. Pas "+
   "de medicament, la fievre ne recule pas et la journee de repos ne compte "+
   "pas. Et pas de matiere premiere, une amelioration lache - voir "+
   "l'entretien, plus bas.</p>"+
   "<h2>Le plan, et ce qu'on y batit</h2>"+
   "<p>A l'interieur d'un batiment, [M] ouvre son plan au lieu de la carte du "+
   "monde - qui ne dit rien quand on est dans une piece. Les fleches haut et "+
   "bas changent d'etage. Chaque piece porte des <b>cases</b> : une par "+
   "quatorze metres carres. On appelle grande une piece de trois cases ou "+
   "plus. Une maison en a onze en tout, une caserne trente-huit, un immeuble "+
   "cent vingt-trois.</p>"+
   "<p>Chez vous, cliquez une piece : la liste des ameliorations s'ouvre "+
   "dessous. Une amelioration occupe un nombre de cases que vous choisissez, "+
   "et son ampleur suit - un coin cuisine tient sur une case, une cantine en "+
   "demande quatre. Plusieurs cohabitent dans une piece s'il reste des cases. "+
   "Chacune ne se batit qu'une fois ; pour l'agrandir, on la demonte et on la "+
   "repose, en recuperant la moitie de la matiere.</p>"+
   "<p class='note'>Ce n'est pas le total de cases qui commande, c'est la "+
   "TAILLE DE LA PIECE. Une caserne a trente-huit cases mais aucune piece de "+
   "cinq : son plus grand dortoir sera celui de douze. Un hangar n'a que "+
   "vingt-six cases, mais vingt-cinq d'un seul tenant.</p>"+
   "<table><tr><th>Amelioration</th><th>Cases</th><th>Par case</th></tr>"+
   "<tr><td class='nm'>Dortoir</td><td>1 a 5</td><td>trois couchages</td></tr>"+
   "<tr><td class='nm'>Cuisine</td><td>1 a 4</td><td>une ration economisee par jour</td></tr>"+
   "<tr><td class='nm'>Infirmerie</td><td>1 a 3</td><td>un blesse soigne sans medicament</td></tr>"+
   "<tr><td class='nm'>Reserve</td><td>1 et plus</td><td>huit places de rangement</td></tr>"+
   "<tr><td class='nm'>Salle de sport</td><td>2 a 4</td><td>un dixieme de progression</td></tr>"+
   "<tr><td class='nm'>Armurerie</td><td>2 a 3</td><td>la cadence des defenseurs</td></tr>"+
   "<tr><td class='nm'>Atelier</td><td>1 a 3</td><td>un dixieme de matiere economisee</td></tr>"+
   "<tr><td class='nm'>Bibliotheque</td><td>1 a 2</td><td>le moral, mieux que tout</td></tr>"+
   "<tr><td class='nm'>Poste de guet</td><td>1</td><td>cinquante pas de vue - il ne grandit pas</td></tr>"+
   "</table>"+
   "<p>Chacune porte aussi son <b>bruit</b>, en plus ou en moins, par case. "+
   "L'atelier tape le plus fort, la salle de sport laisse tomber de la fonte, "+
   "la cuisine et l'armurerie s'entendent un peu. A l'inverse, la "+
   "bibliotheque tient tout le monde dedans et silencieux le soir, et le "+
   "poste de guet permet d'aller au-devant de ce qui rode avant que ca ne "+
   "s'attroupe : ce sont les deux seules choses qui font BAISSER ce qu'on "+
   "attire. Dortoir, infirmerie et reserve ne font pas de bruit du tout.</p>"+
   "<p class='note'>Deux facons de remplir vingt-cinq cases ne s'entendent "+
   "donc pas pareil, et une grande base silencieuse peut se faire reperer "+
   "plus tard qu'un simple coin bruyant. Une amelioration hors service ne "+
   "fait plus son bruit non plus - elle ne fait plus rien.</p>"+
   "<p>Vingt-cinq cases suffisent a tout batir au maximum, reserve exclue. "+
   "C'est l'echelle : la maison en a onze, il faudra choisir. La "+
   "<b>reserve</b> est la seule sans plafond - c'est elle qui absorbe les "+
   "cases en trop d'un grand toit, et elle ne se demonte pas pleine.</p>"+
   "<p>Qui n'a pas de couchage dort a meme le sol et le paie au moral, deux "+
   "points par tete et par jour. C'est la premiere raison de batir un "+
   "dortoir.</p>"+
   "<h2>L'entretien</h2>"+
   "<p>Ce qu'on batit se paie deux fois : une fois pour le poser, et deux de "+
   "matiere premiere par case et par jour pour qu'il continue de servir. "+
   "C'est ce qui donne un prix a la taille - une base de vingt-cinq cases "+
   "coute dix fois ce que coute une base de deux ou trois. L'atelier fait "+
   "baisser cette ligne comme il fait baisser les autres.</p>"+
   "<p class='note'>La reserve ne coute rien et ne se degrade pas : une "+
   "etagere n'a pas de piece mobile, elle tient ce qu'on y pose entretenue "+
   "ou non. C'est ce qui permet a un immeuble de cent vingt-trois cases de "+
   "n'etre pas ruineux par sa seule taille.</p>"+
   "<p>Faute de matiere au lever du jour, une amelioration lache. Elle reste "+
   "posee, elle occupe toujours ses cases, mais elle cesse de servir : plus "+
   "de rations economisees, plus de couchages, plus de moral, et le plan la "+
   "montre en rouge. On la remet en etat en payant la moitie de ce qu'elle "+
   "a coute. Une base qui se defait cesse de couter cher, ce qui laisse "+
   "toujours de quoi la relever.</p>"+
   "<h2>Ce qu'on attire</h2>"+
   "<p>Une base ne se cache pas. Elle a un toit, des gens dedans, des choses "+
   "qui tournent, et cela s'entend de loin. Une jauge se remplit toute seule, "+
   "a la vitesse du bruit qu'on fait : la taille de ce qu'on a batî, et le "+
   "nombre de gens presents - celui qui est parti en mission ne compte pas. "+
   "Elle ne se vide qu'en debordant.</p>"+
   "<p>Deux paliers previennent avant le debordement : on ne se fait pas "+
   "surprendre sans avoir eu de quoi comprendre. Puis une horde a repere "+
   "l'endroit. <b>Trente secondes</b> de preavis, pas une de plus. Le joueur "+
   "sprinte a trente-six metres par seconde et la carte se traverse en "+
   "trente-huit : rentrer se merite.</p>"+
   "<p class='note'>C'est la contrepartie du confort, et la seule raison pour "+
   "laquelle une grande base n'est pas gratuitement meilleure qu'une petite. "+
   "Vingt-cinq cases a six habitants se font reperer en une journee et demie ; "+
   "un coin de deux cases ou l'on dort seul, en six jours.</p>"+
   "<p>Le nombre, lui, va de dix a quatre cents. Le tirage est plat, la "+
   "pression le penche : la carte ou l'on se trouve pese le plus lourd, "+
   "ensuite le temps passe, ensuite le nombre de bouches. Au premier jour de "+
   "la premiere carte, deux hordes sur trois restent sous la centaine. Sur la "+
   "cinquieme, dans une longue partie, une horde de dix ne se verra plus "+
   "jamais.</p>"+
   "<p>Ils arrivent d'un cote et d'un seul - une horde a une provenance - et "+
   "jamais sous vos yeux : ils paraissent au-dela du plus large de vos plans "+
   "de vue et marchent sur la base. Pendant ce temps le groupe tient les "+
   "murs, comme il le fait deja.</p>"+
   "<h2>Rentrer, ou ne pas rentrer</h2>"+
   "<p>Si vous etes la - dedans, ou dans la rue d'a cote - l'assaut <b>se "+
   "joue</b>. Le groupe tire depuis les fenetres, vous aussi, et vous seul "+
   "payez vos cartouches. Il ne se termine pas quand une horloge le decide "+
   "mais quand plus rien ne bouge aux abords. Tenir remonte le moral.</p>"+
   "<p>Si vous n'y etes pas, il <b>se raconte</b>, comme une mission. Ce qui "+
   "defend, c'est la porte elle-meme, ceux que vous avez laisses au toit et "+
   "leur Combat, la cadence de l'armurerie, la vue du poste de guet, et le "+
   "moral de la maison. Ce qui passe emporte du stock, blesse ceux qui "+
   "tenaient, met des pieces hors service et coute au moral.</p>"+
   "<p class='note'>Ce qu'on perd est toujours reparable. La base ne se perd "+
   "jamais et personne n'y meurt en votre absence : une punition qu'on ne "+
   "peut pas defaire, infligee pendant qu'on regardait ailleurs, fermerait "+
   "la partie au lieu de la couter. Une piece mise hors service se remet en "+
   "etat, un blesse se soigne, un rayonnage se remplit.</p>"+
   "<h2>Le groupe</h2>"+
   "<p>Ceux qui ont dit oui marchent derriere, en quinconce sur deux colonnes. "+
   "Ils ne rentrent plus chez eux le soir et ne vaquent plus a leur metier. "+
   "Ils montent en competences comme vous, puisque c'est le meme drapeau qui "+
   "commande.</p>"+
   "<p>Leur fenetre de dialogue n'est pas celle des autres : on ne demande pas a "+
   "un compagnon s'il veut nous rejoindre. On lui demande ce qu'il pense de tout "+
   "ca, on lui demande de se raconter, ou on lui laisse la tete.</p>"+
   "<h2>Le groupe et l'equipe</h2>"+
   "<p>Deux choses differentes. Le <b>groupe</b> est le registre : tous ceux "+
   "qui ont dit oui, qu'ils soient a la base, en course ou avec vous. "+
   "L'<b>equipe</b> est ceux qui sortent, et elle se refait a chaque "+
   "depart.</p>"+
   "<p>Recruter quelqu'un dans la nature, c'est le mettre dans les deux d'un "+
   "coup : il n'y a pas de base ou le deposer, il suit. Mais rentrer chez soi "+
   "dissout l'equipe sans toucher au registre - on ne commande plus personne. "+
   "Pour ressortir, [S] demande d'abord avec qui : une, plusieurs, ou "+
   "personne.</p>"+
   "<p>On part avec qui l'on veut, blesses compris. Le jeu affiche l'etat de "+
   "chacun, il n'interdit rien : c'est au joueur de decider s'il risque la vie "+
   "d'un homme mal en point, et si tout le monde boite il faudra bien sortir "+
   "quand meme. Le seul qu'on ne peut pas emmener est celui qui n'est pas la, "+
   "parti en course.</p>"+
   "<h2>La discipline de feu</h2>"+
   "<p>Un compagnon ne decide rien. Il ne tire que si vous tirez, et ne frappe "+
   "que si vous frappez : c'est vous qui ouvrez le feu, eux qui suivent. Sans "+
   "cela une equipe de cinq viderait chaque bourg qu'elle traverse sans qu'on "+
   "ait rien demande, et le jeu se jouerait tout seul.</p>"+
   "<p>Votre dernier geste les engage quelques secondes. S'il s'agissait d'un "+
   "coup de feu, ils sortent leurs armes ; d'un coup de main, ils gardent les "+
   "leurs au fourreau et n'usent que de leurs mains. A bout portant ils "+
   "frappent de toute facon - on ne tire pas sur ce qui vous touche. Quand vous "+
   "vous arretez, ils s'arretent.</p>"+
   "<p class='note'>Aux murs de la base, c'est autre chose : la ils tirent "+
   "d'eux-memes sur tout ce qui approche, sans attendre votre signal.</p>"+
   "<h2>Prendre la tete</h2>"+
   "<p>On change de corps, pas de groupe. Celui qu'on incarnait reste avec nous "+
   "sous son propre nom et devient a son tour un compagnon ; on herite du sien "+
   "avec ses aptitudes, ses plafonds et son sac. La vie et le souffle se "+
   "recalculent aussitot. C'est la seule facon de jouer un boulanger apres avoir "+
   "commence militaire - et l'on peut toujours repartir dans l'autre sens.</p>"+
   "<p class='note'>Ce n'est pas anodin : on change aussi de plafonds. Le "+
   "militaire monte a 100 en Maniement que vous avez patiemment nourri devient "+
   "un boulanger qui plafonne a 60. Le corps qu'on quitte garde le sien, "+
   "intact.</p>"+
   "<h2>L'attachement</h2>"+
   "<p>Cinq rangs : recrue, copain, compagnon, ami, ami de confiance. On ne "+
   "monte pas tout seul, et surtout pas vite. Dix secondes cote a cote valent "+
   "un point, soit une trentaine par jour de jeu - il en faut deux cent "+
   "cinquante pour cesser d'etre une recrue et trois mille deux cents pour "+
   "atteindre le dernier rang. Marcher ensemble n'y suffira jamais.</p>"+
   "<p>Ce qui compte vraiment, c'est ce qu'on traverse ensemble et ce qu'on se "+
   "dit. Un zombi tombe a portee de lui vaut huit points. Se raconter en vaut "+
   "soixante - mais une seule fois par jour : sans ce delai il suffirait de "+
   "reposer la meme question vingt fois de suite pour gagner un rang, et "+
   "l'amitie ne vaudrait rien.</p>"+
   "<p>L'onglet GROUPE du panneau d'equipement donne une ligne par compagnon : "+
   "son nom, son metier, son rang et ce qui le separe du suivant. Le survol dit "+
   "le reste - ses quatre competences, sa specialite et son plafond, sa vie, et "+
   "ce qu'il porte. Cliquer une ligne ouvre la table a deux : ses quatre armes, "+
   "ses quatre pieces de tenue, son sac, et en face la source du moment. Un "+
   "clic sur une case la fait passer - entre les siens, rien ne se marchande.</p>"+
   "<p>Les rangs ne donnent aucun bonus : ils donnent un droit. Ils commandent "+
   "ce qu'on ose confier a quelqu'un en mission - des materiaux pour une "+
   "recrue, les vivres pour un copain, les munitions pour un compagnon, les "+
   "medicaments pour un ami, les armes pour un ami de confiance.</p>"+
   "<p>Devant une porte, [F] fait entrer : le personnage disparait a l'interieur "+
   "et [S] l'en fait ressortir, ou renonce a une serrure en cours. Tous les "+
   "batiments s'ouvrent, y compris les tentes et les abris.</p>"+
   "<p>Quand plusieurs choses s'offrent en meme temps - une porte et un "+
   "passant, un plant et un corps - la liste parait au-dessus de la barre du "+
   "bas et [F] declenche celle qui porte le repere. On en choisit une autre "+
   "de trois facons : la <b>molette</b>, le <b>clic</b> sur la ligne voulue, "+
   "ou <b>Tab</b> (Maj+Tab pour remonter). Aucune ne touche aux jambes : on "+
   "choisit en marchant.</p>"+
   "<table><tr><th>Batiment</th><th>Serrure</th></tr>"+
   "<tr><td class='nm'>Commissariat, armurerie, caserne militaire</td><td>toujours fermee, 10 s</td></tr>"+
   "<tr><td class='nm'>Autres edifices publics, chateau</td><td>toujours fermee, 4 a 9 s</td></tr>"+
   "<tr><td class='nm'>Maisons, immeubles, fermes</td><td>fermee une fois sur trois, 2 a 6 s</td></tr>"+
   "<tr><td class='nm'>Hangars, tentes, abris, tours de guet</td><td>jamais fermes</td></tr>"+
   "</table>"+
   "<p>On parle a tout le monde : habitants, soldats de village, garnison "+
   "de la caserne, fermiers et pecheurs. Chacun porte un nom a lui. Quand on approche, "+
   "le plus proche s'arrete pour nous laisser venir ; [F] engage la conversation et "+
   "les touches 1 a 5 repondent : des nouvelles du lieu, un mot sur lui-meme, la "+
   "rumeur qui court sur le laboratoire, une proposition de recrutement ou un coup "+
   "d'oeil a ses affaires, qui ouvre son propre panneau d'equipement. S'eloigner "+
   "met fin a l'echange.</p>"+
   "<h2>A propos de vous</h2>"+
   "<p>Chacun a un metier, et le metier a dix histoires. Celle qu'il vous raconte "+
   "lui a ete donnee a sa naissance et ne changera plus : revenez le voir dans "+
   "une heure, il dira la meme chose. C'est ce qui separe un personnage d'un "+
   "generateur de phrases. Son metier s'affiche sous son nom, en haut de la "+
   "fenetre.</p>"+
   "<p>Il y a trente-sept metiers. Le fermier, le pecheur, le militaire, le soldat "+
   "de bourg, le pompier, le policier et le soignant vivent la ou on les attend. "+
   "D'autres tiennent les commerces : epicier, droguiste, cuisinier, barman, "+
   "instituteur, secretaire de mairie, armurier, magasinier, garagiste, menuisier, "+
   "moniteur de tir. Un metier n'existe dans un bourg que si son lieu y existe : "+
   "pas d'armurier sans armurerie, pas de barman sans bar. Le reste de la "+
   "population, toujours majoritaire, est fait de retraites et de gens sans metier "+
   "fixe, qui ont eux aussi leurs dix histoires.</p>"+
   "<h2>Les enseignes et les adresses</h2>"+
   "<p>Douze metiers d'artisan n'ont pas de batiment a eux dans la table des "+
   "lieux : le plombier, le boulanger, le charcutier, l'electricien, le couvreur, "+
   "le coiffeur, le cordonnier, l'horloger, le couturier, le macon, le "+
   "veterinaire, l'imprimeur. Ils ont une enseigne a la place. Une maison sur "+
   "quatre et le bas d'un immeuble sur deux en portent une - la Boulangerie "+
   "Corbin, l'Electricite Marchand - et cette enseigne vaut adresse : l'artisan "+
   "n'existe dans un bourg que si son enseigne y est posee, et c'est devant elle "+
   "qu'il passe ses journees.</p>"+
   "<p>Les immeubles ont un numero et une rue. On entrait dans un immeuble parmi "+
   "vingt-sept, on entre maintenant au 47 rue de l'Egouttepaille. Les rues ne "+
   "dessinent aucun plan et n'essaient pas : ce sont des noms sur des facades, "+
   "pas un cadastre.</p>"+
   "<h2>Ce qu'on ne dit pas</h2>"+
   "<p>Cinq metiers ne se donnent jamais. Demandez a l'interesse ce qu'il fait, il "+
   "tournera autour : il rend service, il fait des petits boulots a droite a "+
   "gauche, il est un gars debrouillard. Sa fiche affichera une couverture - sans "+
   "emploi, brocanteur, transporteur, graveur, bucheron - et non son vrai "+
   "metier.</p>"+
   "<p>Mais les competences, elles, ne mentent pas. Un homme qui se dit "+
   "debrouillard et qui a le crochetage d'un serrurier n'est pas un homme "+
   "debrouillard. Le voleur a la discretion et le crochetage les plus hauts du "+
   "jeu, le receleur marchande mieux que l'epicier, le faussaire a la main d'un "+
   "horloger, le braconnier tire comme un militaire et le contrebandier porte "+
   "comme un magasinier. Ils sont rares : un ou deux par bourg.</p>"+
   "<p>Celui qui a une adresse y passe le plus clair de son jour : l'epicier "+
   "devant la superette, le garagiste devant la station. Ce n'est pas un horaire, "+
   "c'est une habitude - deux fois sur trois il y revient, le reste du temps il "+
   "arpente le bourg comme les autres. La nuit, chacun rentre chez soi et le "+
   "travail ne compte plus.</p>"+
   "<h2>Ce que le metier fait aux competences</h2>"+
   "<p>Personne n'a les memes chiffres que son voisin. Le militaire et le moniteur "+
   "de tir ont la main sure et le reste ordinaire ; l'instituteur et le soignant "+
   "ont la tete et rien dans les bras ; le fermier, le magasinier et le pompier "+
   "portent et encaissent ; l'epicier marchande mieux que quiconque. La competence "+
   "tire ses quatre aptitudes avec elle, et le metier ajoute ses specialites "+
   "par-dessus. Personne ne descend sous 5 ni ne depasse 100 : on n'est nul a "+
   "rien.</p>"+
   "<p>L'enceinte de la caserne militaire est close sur ses quatre cotes, portail "+
   "compris : on n'entre dans le terre-plein qu'en crochetant la porte.</p>"},
 {t:"Equipement", h:
   "<p>La touche [I] ouvre le panneau d'equipement, en deux onglets. Le premier "+
   "montre le personnage en pied avec quatre emplacements pour ce qu'il porte "+
   "(tete, torse, jambes, pieds), quatre pour ses armes, un pour son sac a dos et "+
   "deux pour l'acces rapide en [A] et [E]. A droite, le contenu : deux "+
   "emplacements sans sac, davantage quand il en trouvera un. Le bandeau du haut porte "+
   "le nom de celui a qui appartient le panneau. Tous les emplacements sont vides.</p>"+
   "<p><b>On deplace les vignettes.</b> Prenez un objet dans le contenu et "+
   "lachez-le ou il doit aller : une arme sur l'emplacement de sa categorie, "+
   "un vetement sur l'emplacement de son endroit, un soin sur [A], une arme "+
   "de jet sur [E], un sac a dos sur le dos. Le fantome qui suit la souris "+
   "porte l'image de ce que vous tenez et passe au vert des que la place "+
   "survolee l'accepte. Le geste marche dans les deux sens : tirez une arme "+
   "de son emplacement vers une case pour la ranger, tirez un vetement pour "+
   "l'oter. Deux cases du contenu s'echangent de la meme facon, et lacher "+
   "hors du panneau pose au sol.</p>"+
   "<p class='note'>Les listes de boutons restent sous chaque emplacement "+
   "pour qui prefere cliquer, et celle des armes sert d'outil de reglage : "+
   "elle les cree de rien. On n'ote pas un sac a dos si ce qu'il contient ne "+
   "tiendrait pas dans les poches - le jeu refuse plutot que de perdre "+
   "quelque chose.</p>"+
   "<h2>Le sac a des formes</h2>"+
   "<p>Toute case en valait une autre : un fusil long occupait autant qu'une "+
   "boite de conserve. <b>Une chose occupe maintenant un rectangle.</b> Un "+
   "sac n'a plus une capacite mais des dimensions, cinq de large partout, et "+
   "seule la hauteur progresse.</p>"+
   "<table><tr><th>Sac</th><th>Grille</th><th>Cases</th></tr>"+
   "<tr><td class='nm'>Sacoche de toile</td><td>5 sur 1</td><td>5</td></tr>"+
   "<tr><td class='nm'>Sac d'ecolier</td><td>5 sur 2</td><td>10</td></tr>"+
   "<tr><td class='nm'>Sac de randonnee</td><td>5 sur 3</td><td>15</td></tr>"+
   "<tr><td class='nm'>Sac militaire</td><td>5 sur 4</td><td>20</td></tr>"+
   "<tr><td class='nm'>Sac d'expedition</td><td>5 sur 5</td><td>25</td></tr>"+
   "</table>"+
   "<p class='note'>Sans sac, deux cases sur une ligne - trois pour tout le "+
   "monde sauf vous, l'ecart est ancien et volontaire.</p>"+
   "<p>Les armes prennent la place de leur famille : un poignard une case, un "+
   "pistolet deux en long, un fusil trois, une mitrailleuse trois sur deux. "+
   "Trois cases au plus en largeur, pour qu'une arme longue rentre dans les "+
   "cinq sacs - et dans aucune poche, ce qui est voulu. Le reste suit son "+
   "poids : une conserve tient une case, un pied-de-biche deux, un velo un "+
   "carre de deux sur deux.</p>"+
   "<p><b>Il n'y a pas de rotation.</b> Chaque chose a une orientation fixe. "+
   "Tourner doublerait le nombre d'etats a peindre et a eprouver pour un gain "+
   "que la largeur constante rend deja faible, et transformerait un "+
   "inventaire en casse-tete a chaque ramassage.</p>"+
   "<p class='note'>Ranger peut echouer alors qu'il reste des cases libres : "+
   "un fusil de trois cases ne se glisse pas dans trois trous separes. C'est "+
   "le refus que l'ancien sac ne savait pas prononcer. De meme, on n'ote plus "+
   "un sac si ce qu'il contient - et le sac lui-meme, qui redescend dans les "+
   "poches - n'y retrouve pas sa forme.</p>"+
   "<h2>Les ceintures de munitions</h2>"+
   "<p>Une case ne tient qu'une <b>boite</b> de munitions - cinquante "+
   "cartouches pour ce qui se tire au pistolet, trente pour les calibres de "+
   "fusil. Une <b>ceinture</b> leve cette limite : c'est un contenant qui "+
   "occupe une case comme le reste et y tient de deux a cinq boites, d'un "+
   "seul calibre.</p>"+
   "<table><tr><th>Ceinture</th><th>Boites</th><th>Poids</th></tr>"+
   "<tr><td class='nm'>Cartouchiere de chasse</td><td>2</td><td>0,30 kg</td></tr>"+
   "<tr><td class='nm'>Musette de tireur</td><td>3</td><td>0,45 kg</td></tr>"+
   "<tr><td class='nm'>Ceinture de police</td><td>3</td><td>0,50 kg</td></tr>"+
   "<tr><td class='nm'>Brelage militaire</td><td>4</td><td>0,80 kg</td></tr>"+
   "<tr><td class='nm'>Porte-chargeurs de combat</td><td>5</td><td>1,30 kg</td></tr>"+
   "</table>"+
   "<p>Lachez des munitions sur une ceinture posee, ou une ceinture sur des "+
   "munitions : la case passe au vert et affiche ce qu'elle tient sur ce "+
   "qu'elle peut tenir. Ramasser remplit les ceintures avant d'ouvrir une "+
   "case neuve, il n'y a donc rien a faire a la main apres le premier "+
   "geste.</p>"+
   "<p><b>Elle garde ce qu'elle contient.</b> Posee au sol, echangee ou "+
   "confiee, la ceinture part avec ses boites et vaut le prix des deux. Un "+
   "contenant peut se transporter garni parce que celui-ci ne tient que des "+
   "munitions : il ne pourra jamais contenir un autre contenant. C'est aussi "+
   "pourquoi le sac a dos, lui, se porte et ne se range pas plein dans une "+
   "case - le jeu refuse de l'oter si son contenu ne tiendrait pas dans les "+
   "poches.</p>"+
   "<p>Dans la fenetre d'echange, le <b>clic</b> donne une boite et laisse la "+
   "ceinture ; le <b>Maj+clic</b> donne la case entiere, ceinture comprise. "+
   "La meme regle vaut partout : Maj+clic donne toute la pile, dix conserves "+
   "d'un coup au lieu d'une.</p>"+
   "<p class='note'>Elle pese meme vide, et son poids s'ajoute a celui des "+
   "cartouches : cinq ceintures vides coutent trois kilos et demi pour rien. "+
   "On en trouve chez les armuriers, au stand, au poste de police, a la "+
   "caserne, a la ferme et aux tours de guet, une par batiment au plus, "+
   "quatre a dix par carte.</p>"+
   "<p>Le second onglet, Statistiques, porte les quatre competences que possede tout "+
   "le monde, joueur comme PNJ, notees sur 100 : Cardio, Astuce, Combat et Tir. "+
   "Chacune tient dans une case ; survoler la case ouvre a droite la colonne de ses "+
   "quatre aptitudes.</p>"+
   "<table><tr><th>Competence</th><th>Ce qu'elle commande</th><th>Ses quatre aptitudes</th></tr>"+
   "<tr><td class='nm'>Cardio</td><td>l'endurance ; monte en sprintant et en grimpant</td>"+
   "<td>Souffle, Vitesse, Portage, Immunite</td></tr>"+
   "<tr><td class='nm'>Astuce</td><td>fouilles, discretion et reperage ; monte en fouillant et en explorant</td>"+
   "<td>Fouille, Crochetage, Discretion, Troc</td></tr>"+
   "<tr><td class='nm'>Combat</td><td>la sante et le corps a corps ; monte en se battant</td>"+
   "<td>Vigueur, Sante, Frappe, Parade</td></tr>"+
   "<tr><td class='nm'>Tir</td><td>l'arme a feu, le recul et la dispersion ; monte en tirant</td>"+
   "<td>Chargement, Maniement, Stabilite, Lancer</td></tr></table>"+
   "<p>Une aptitude ne vaut jamais seule : elle compte pour moitie et sa competence "+
   "pour l'autre moitie. Il faut donc Stabilite a 100 et Tir a 100 pour qu'une "+
   "categorie atteigne 100 pour cent. La stabilite couvre a la fois le recul, "+
   "l'oscillation et la dispersion : les deux ne se distinguaient pas dans ce jeu. "+
   "Et une competence n'est que la moyenne de ses quatre aptitudes : faire "+
   "monter l'une la fait monter au quart de la vitesse.</p>"+
   "<p>Chacun nait avec ses chiffres, tires de son metier, et sa meilleure "+
   "aptitude de naissance est sa specialite : elle seule peut monter jusqu'a 100. "+
   "Les quinze autres ne depassent jamais leur valeur de depart de plus de 30 "+
   "points. Un boulanger qui court tous les jours finira meilleur qu'au depart, "+
   "jamais athlete comme un pompier. Rien ne s'emousse avec le temps : ce qui "+
   "vous limite n'est pas l'oubli, c'est ce que vous etiez a votre naissance.</p>"+
   "<p>Le sans-metier fait exception : il n'a pas de profil mais un tirage. "+
   "Toutes ses aptitudes sortent entre 5 et 50, sauf deux qui montent entre 30 et "+
   "60. Il part plus bas que tout le monde, et l'on peut tomber sur un personnage "+
   "franchement mauvais - mais sa specialite ira jusqu'a 100 comme celle d'un "+
   "armurier.</p>"+
   "<p>Le meme panneau sert pour un PNJ : la troisieme reponse d'une conversation "+
   "l'ouvre avec sa silhouette et son nom. [I] ou la fin de l'echange le referme.</p>"+
   "<p>Devant les affaires d'un PNJ, un bouton ECHANGER s'ajoute a cote de son nom et "+
   "ouvre les deux inventaires entiers cote a cote, le personnage toujours a gauche et "+
   "le PNJ toujours a droite : de chaque cote la silhouette, le nom, les quatre "+
   "emplacements portes, les armes, le sac a dos, les acces rapides et le contenu. "+
   "Devant l'un des siens, c'est la table a deux qui s'ouvre a la place. "+
   "[I] ou [Echap] referme, "+
   "la fin de la conversation aussi.</p>"+
   "<h2>Le troc</h2>"+
   "<p><b>Une seule surface.</b> Quand on parle a quelqu'un, l'onglet ECHANGER "+
   "de la conversation montre tout : son sac, le votre, et ce qu'il porte sur "+
   "lui. Il n'y a plus d'autre chemin - ni fenetre separee, ni second "+
   "panneau. Ce qui change, c'est qui est en face. VALEURS POUR LES INCONNUS, "+
   "GRATUIT POUR LES SIENS.</p>"+
   "<p>Il n'y a pas de monnaie : il y a du troc. Chaque chose porte une valeur "+
   "d'echange. Devant un inconnu, on <b>empile</b> ce qu'on offre d'un cote et "+
   "ce qu'on demande de l'autre - autant de cases qu'on veut de part et "+
   "d'autre. Les deux totaux se lisent au-dessus des grilles, et le bouton "+
   "CONCLURE les porte. Le marche ne part pas tout seul : on le conclut quand "+
   "les deux comptes se tiennent, et le bandeau dit l'ecart et la tolerance "+
   "quand ils ne se tiennent pas.</p>"+
   "<p class='note'>C'est ce qui rend le registre entier troquable. Tant qu'il "+
   "fallait une seule case contre une seule case, une chose n'avait de "+
   "vis-a-vis que dans sa propre fourchette : on ne pouvait ni donner deux "+
   "conserves pour un couteau, ni completer une offre un peu courte.</p>"+
   "<p>Devant un des siens, il n'y a rien a marchander : une case passe au "+
   "clic, dans un sens comme dans l'autre. Son Portage decide seul de ce "+
   "qu'il accepte, et ce qu'il refuse revient d'ou il venait. Dehors, c'est "+
   "votre sac qui fait face au sien ; chez vous, ce sont les rayonnages de "+
   "la base - le bandeau le dit.</p>"+
   "<p>La tolerance n'est pas un montant mais une part : on compare le rapport "+
   "et non l'ecart. Deux choses s'echangent si la plus chere ne vaut pas plus "+
   "d'un quart de plus que la plus modeste. Une conserve a 12 contre une autre a "+
   "19 : le marche se fait, le plancher de dix points couvrant tout le bas de "+
   "l'echelle. Un fusil a 1 200 va de 960 a 1 500. Le meilleur coup possible est "+
   "le meme partout : un quart, jamais davantage.</p>"+
   "<p class='note'>C'est la plus modeste des deux qui commande. Celui qui pose "+
   "un objet de 150 ne repart pas avec un objet de 50, ce serait ridicule.</p>"+

   "<h2>Marchander</h2>"+
   "<p>L'aptitude Troc, cinquieme aptitude d'Astuce, deplace cette part. Elle ne "+
   "vaut pas seule : c'est l'ecart entre votre Troc et celui d'en face qui "+
   "compte. A egalite on echange a un quart pres ; face a un marchandeur "+
   "beaucoup plus faible que vous la fourchette s'ouvre jusqu'a deux cinquiemes, "+
   "face a bien meilleur que vous elle se referme a un dixieme. Le meme fusil a "+
   "1 200 trouve alors quinze preneurs sur la carte, ou trois.</p>"+
   "<p>Les valeurs ne sont ecrites nulle part une a une : elles se deduisent de "+
   "ce que chaque chose est deja. Le materiel vaut sa matiere premiere, le vivre "+
   "ce qu'il rend de sante, le medicament davantage, la boite de munitions son "+
   "calibre fois son nombre, l'arme ce qu'elle envoie par minute et jusqu'ou. "+
   "Toute chose ajoutee au registre recoit ainsi sa valeur sans qu'on y pense, "+
   "et aucune ne peut etre oubliee. Une pile de dix vaut dix fois.</p>"+
   "<p>En haut a gauche, le personnage entier taille dans son sprite, son nom, sa vie "+
   "et son endurance. Pendant une conversation, la fiche de l'interlocuteur s'ajoute "+
   "a droite des barres : sa vignette, son nom, sa vie et son endurance. La reserve "+
   "n'est plus la meme pour tous : elle vaut 60 points plus 0,8 par point de Souffle, "+
   "soit 100 aux aptitudes de depart et 140 au mieux. Les PNJ la depensent comme le "+
   "joueur : celui qui fuit court tant qu'il a du souffle, puis continue au pas. Les "+
   "zombis, eux, n'en ont pas et ne se fatiguent jamais.</p>"},
 {t:"Remplir ses bouteilles", h:
   "<p>La bouteille vide ne vaut rien en elle-meme : elle vaut ce qu'on met dedans. "+
   "C'est le seul objet du jeu qui change de nature, et la seule fabrication qui "+
   "existe pour l'instant.</p>"+
   "<table><tr><th>Ou</th><th>Ce qu'on obtient</th></tr>"+
   "<tr><td class='nm'>Le puits d'un village</td><td>une bouteille d'eau</td></tr>"+
   "<tr><td class='nm'>Les pompes d'une station-service</td><td>un cocktail Molotov</td></tr>"+
   "</table>"+
   "<p>Il n'y a rien a presser : on se tient a cote, une barre decompte trois "+
   "secondes, et une bouteille se transforme. Puis la suivante, tant qu'il en reste "+
   "et qu'on ne bouge pas. S'ecarter, ou passer du puits a la pompe, remet le "+
   "decompte a zero. Si le sac est plein la bouteille revient telle quelle : rien "+
   "ne se perd jamais.</p>"+
   "<p>La station-service se reconnait de loin a son auvent blanc a bandeau rouge. "+
   "Il y en a une ou deux par carte, toujours au bord d'une route, car une pompe vit "+
   "du passage. Sa boutique est verrouillee comme le reste, mais sa serrure est "+
   "ordinaire : quatre secondes de crochetage.</p>"+
   "<p>Le puits, lui, ne soigne plus. Il rendait des points de vie a qui s'en "+
   "approchait, ce qui n'avait plus de sens du jour ou les medicaments sont entres "+
   "dans le jeu.</p>"},
 {t:"Ce que porte chacun", h:
   "<p>Chaque personnage nait avec son sac, une fois pour toutes. Le panneau "+
   "d'echange le montre quand il est vivant ; la fouille le montrera quand il sera "+
   "mort. Rien n'est tire au moment de la mort : ce qu'on trouve sur un corps est "+
   "ce qu'il portait de son vivant.</p>"+
   "<p>Trois frequences seulement - souvent, parfois, rarement - tirees "+
   "independamment les unes des autres. Un militaire peut donc sortir bredouille, "+
   "et un scout peut cumuler son arme et ses vivres.</p>"+
   "<table><tr><th>Qui</th><th>Ce qu'il porte</th></tr>"+
   "<tr><td class='nm'>Zombi du laboratoire</td><td>rien : il n'a jamais eu de vie</td></tr>"+
   "<tr><td class='nm'>Civil sans metier</td><td>souvent des vivres ; parfois un medicament, parfois du materiel ; rarement une arme de stand sans ses munitions, ou des munitions de stand sans arme</td></tr>"+
   "<tr><td class='nm'>Militaire, soldat</td><td>souvent une arme militaire et ses munitions ; rarement des vivres ou un medicament</td></tr>"+
   "<tr><td class='nm'>Pompier</td><td>souvent des medicaments ; parfois la hache ; rarement des vivres</td></tr>"+
   "<tr><td class='nm'>Policier</td><td>souvent une arme de police et ses munitions ; parfois un medicament, parfois des vivres</td></tr>"+
   "<tr><td class='nm'>Soignant</td><td>souvent des medicaments ; rarement des vivres</td></tr>"+
   "<tr><td class='nm'>Scout</td><td>souvent une arme de contact et souvent des vivres ; rarement un medicament</td></tr>"+
   "<tr><td class='nm'>Paysan, pecheur</td><td>souvent une arme de chasse ; parfois une arme de contact, parfois des vivres</td></tr>"+
   "</table>"+
   "<p>L'arme depareillee du civil est la trouvaille la plus interessante : elle "+
   "arrive sans ses munitions, ou les munitions arrivent sans elle. Il faut alors "+
   "chercher le calibre ailleurs.</p>"+
   "<p>Les vivres suivent le metier : le pecheur sort du poisson, le paysan des "+
   "legumes et du lait, le militaire sa ration, le scout ses barres et ses "+
   "conserves.</p>"+
   "<h2>Fouiller un corps</h2>"+
   "<p>Un corps garde ce qu'il portait. Il devient la quatrieme nature de cible "+
   "de la liste [F], apres le passant, la porte et le plant : approchez, et "+
   "Fouiller le corps s'y ajoute.</p>"+
   "<p>Une fenetre s'ouvre : a gauche la silhouette du defunt, a droite ce qu'il "+
   "portait, une ligne par trouvaille avec sa vignette, son nom et sa fiche. On "+
   "clique une ligne pour la prendre, ou TOUT PRENDRE pour ce qui tient. Ce qu'on "+
   "laisse demeure sur le corps et s'y retrouve en revenant : rien ne se perd "+
   "jamais, meme sac plein. Le bandeau du bas dit ce que le sac porte et passe au "+
   "rouge quand il est plein. [S] ou FERMER laisse le reste. Un corps vide ne se "+
   "propose plus, pour que la liste ne se remplisse pas de depouilles deja "+
   "retournees.</p>"+
   "<h2>Fouiller un batiment</h2>"+
   "<p>Entrer ne fouille rien. Le lieu se decoupe en emplacements des qu'on passe "+
   "la porte, et chaque appui sur [F] en ouvre un : la ligne d'action annonce "+
   "<i>Fouiller 3/8</i>, un compte a rebours court, et ce qu'on trouve tombe dans "+
   "la fenetre des trouvailles. On rappuie autant de fois qu'on veut - c'est vous "+
   "qui decidez combien de temps vous restez, emplacement par emplacement, et "+
   "vous pouvez partir apres le premier si le bruit devient inquietant.</p>"+
   "<p>Le decoupage est tire une fois pour toutes : un ou deux emplacements dans "+
   "une tour de guet ou un abri, deux a quatre dans une maison ou un bar, quatre "+
   "a sept dans une superette ou un depot, six a douze dans un hopital, une "+
   "caserne ou le chateau. Chaque emplacement tire sa propre duree, deux a cinq "+
   "secondes chez l'habitant, quatre a neuf dans un hangar ou un depot : deux "+
   "emplacements du meme lieu ne prennent jamais le meme temps. Un emplacement "+
   "donne de zero a deux objets, et le zero est frequent.</p>"+
   "<p>[S] interrompt et fait sortir dans le meme geste. Les emplacements non vus "+
   "le restent, le decompte reprend ou il s'est arrete, et ce qu'on a laisse est "+
   "toujours la. Un lieu fouille ne se repeuple pas : la carte est un stock "+
   "fini.</p>"+
   "<h2>Les trois aptitudes de la fouille</h2>"+
   "<p><b>Fouille</b> commande la vitesse : un quart plus lent a zero, un quart "+
   "plus rapide a cent. C'est elle aussi qui decide de votre maladresse - si "+
   "quelque chose tombe en retournant un tiroir. A cinquante, un emplacement sur "+
   "trois fait du bruit ; a cent, un sur douze ; a zero, plus d'un sur deux.</p>"+
   "<p><b>Discretion</b> decide jusqu'ou ce bruit porte : 190 pas a zero, 120 a "+
   "cinquante, 60 a cent. Elle fait deja cela pour vos pas et pour vos armes. Un "+
   "fouilleur soigneux mais lourd fait rarement du bruit, et loin ; un fouilleur "+
   "brouillon mais leger en fait souvent, et pres. Le son sort a la porte et non "+
   "sur vous, qui restez invisible tant que vous etes dedans. La plus discrete "+
   "des armes a feu, le .22, s'entend a 220 : une fouille reste toujours plus "+
   "silencieuse qu'un coup de feu, mais un hopital a douze emplacements fait "+
   "douze jets.</p>"+
   "<p>Fouille decide aussi de ce que vous ramenez : de moitie moins a moitie "+
   "plus que la normale. C'est elle qui fait qu'une meme maison, fouillee par "+
   "deux personnes differentes, ne rend pas la meme chose. Un bon fouilleur est "+
   "donc plus rapide, plus discret et mieux servi.</p>"+
   "<h2>L'arriere-boutique</h2>"+
   "<p>Une enseigne n'est pas qu'un nom sur une facade. Un emplacement sur trois "+
   "d'un lieu a enseigne tire sur la table du commerce plutot que sur celle du "+
   "logement, et cette table-la donne par poignees : c'est un stock, pas un "+
   "placard. Tomber sur la reserve de la boulangerie, c'est repartir avec du pain "+
   "pour trois jours ; celle de l'electricien rend du cable et des piles par "+
   "rouleaux entiers, celle du macon des parpaings a ne plus pouvoir marcher. Le "+
   "reste de la maison reste une maison.</p>"+
   "<h2>D'ou vient chaque chose</h2>"+
   "<p>Un lieu ne donne jamais n'importe quoi. La superette donne des vivres, la "+
   "droguerie de la chimie, le depot des materiaux, le cabinet et l'hopital des "+
   "medicaments, le restaurant de la cuisine, la maison du mobilier, l'immeuble "+
   "et l'ecole des appareils.</p>"+
   "<p>Les armes surtout. Le stand de tir donne les douze armes de stand et elles "+
   "seules. L'armurerie tient le civil : fusils a pompe, carabines a verrou et "+
   "revolvers .357. Le commissariat tient la dotation de police, la caserne "+
   "militaire la dotation d'armee - avec la Browning M2 et la Hecate II tres "+
   "rares, au niveau le plus haut. La caserne de pompiers ne donne que sa hache. "+
   "Le chateau est le musee, et le seul : sa vitrine tient toujours une piece de "+
   "1886 a 1936, et rien d'autre sur la carte n'en donne. La maison et la ferme "+
   "n'ont que le .22 du grenier, la ferme y ajoutant son fusil de chasse.</p>"+
   "<p>Les munitions suivent, et c'est la que les calibres prennent leur sens. Le "+
   ".22 et le calibre 12 courent partout ; le 9 mm et le .357 sortent du "+
   "commissariat, de la caserne et du stand ; le 5,56 de la seule caserne ; le "+
   "7,62 de la caserne et de l'armurerie pour les deux carabines civiles ; le "+
   ".338 est rare et le 12,7 tres rare, tous deux a la caserne. Le 8 mm Lebel et "+
   "le 7,5 mm MAS ne se trouvent qu'au chateau et dans les greniers de ferme : "+
   "l'arme historique frappe fort et s'eteint faute de ravitaillement.</p>"+
   "<p>Les sacs a dos aussi ont leur lieu : la sacoche de toile en maison et au "+
   "bar, le sac d'ecolier a l'ecole, le sac de randonnee a l'abri, le sac "+
   "militaire a la caserne, le sac d'expedition au chateau et au laboratoire "+
   "seulement. C'est la seule facon d'en trouver un autre que celui qu'on "+
   "porte.</p>"+
   "<p>Le laboratoire H-teck s'ouvre enfin : serrure de haute securite, une piece "+
   "unique, mais qui rend deux ou trois fois ce qu'une autre rendrait - de la "+
   "chimie, de l'electricite et de quoi faire sauter quelque chose.</p>"+
   "<p>Le zombi sorti du laboratoire ne porte rien : il n'a jamais eu de vie. "+
   "Mais celui qui se releve d'un mordu etait cette personne une minute plus tot, "+
   "et il porte encore ce qu'elle portait. Tuer un habitant qu'on a laisse se "+
   "relever revient donc au meme que l'avoir fouille tout de suite - a ceci pres "+
   "qu'il faut le tuer une seconde fois.</p>"+
   "<p>Dix boites de munitions, une par calibre, du .22 au 12,7. Cinquante coups "+
   "pour ce qui se tire au pistolet, au .22 et au fusil de chasse, trente pour les "+
   "calibres de fusil - la boite de 12,7 pese trois kilos et demi, ce qui suffit a "+
   "decourager de l'emporter. Ce sont elles qui font payer l'arme historique : le "+
   "Lebel frappe fort, mais son 8 mm ne se trouve qu'au chateau et dans les "+
   "greniers de ferme.</p>"+
   "<h2>Poser au sol</h2>"+
   "<p>On saisit une case du sac et on la lache hors du panneau : la chose tombe "+
   "un pas devant soi. Un fantome suit la souris et passe au vert des qu'on est "+
   "sorti du cadre. Le bouton <i>poser au sol</i> de la case fait exactement le "+
   "meme geste. [F] ramasse ce qui traine : une arme prend son emplacement de "+
   "categorie s'il est libre, sinon elle occupe une case entiere ; le reste "+
   "s'empile. Sac plein, la chose reste par terre - rien ne se perd jamais.</p>"+
   "<p>Ce qui git au sol vit trois minutes. Passe ce terme il s'efface, mais "+
   "seulement hors de l'ecran : rien ne s'evapore sous vos yeux, et rien ne "+
   "clignote pour l'annoncer. Les corps suivent la meme regle - ils s'entassaient "+
   "jusqu'ici jusqu'a la fin de la partie.</p>"+
   "<p>Reste celui qui pose tout au meme endroit et ne detourne pas le regard : "+
   "l'horloge ne l'atteindrait jamais. D'ou le plafond de vingt-quatre choses "+
   "visibles a la fois. Au-dela, la plus anciennement posee est devoree par les "+
   "rats, sans avertissement. Ce qui menace une chose sous vos yeux, ce n'est pas "+
   "le temps, ce sont eux.</p>"},
 {t:"Journal de bord", h:
   "<p>La fenetre en bas a gauche recueille ce que le personnage remarque, avec "+
   "l'heure du monde et le jour en cours : le passage du jour a la nuit, les portes "+
   "franchies et les conversations. Son bandeau prend le nom de l'habitant a qui "+
   "l'on parle. Le nom du repere le plus proche, panneau ou batiment longe, s'affiche "+
   "en haut de l'ecran et y reste tant qu'on est a portee ; il ne s'efface qu'une "+
   "fois qu'on s'en ecarte.</p>"+
   "<p>Un panneau est plante la ou une voie entre dans un bourg, un port, une "+
   "ferme ou l'enceinte d'un batiment isole. Chaque lieu porte un nom tire avec "+
   "la carte : Ville de Valsource, Port de Saintemont, Ferme de Belcombe.</p>"+
   "<p>Une journee du monde dure un cycle de 5 minutes : l'horloge du journal "+
   "parcourt donc 24 heures en 5 minutes reelles.</p>"},
 {t:"Affichage", h:
   "<p>Un batiment derriere lequel on passe devient translucide : sa portion du calque "+
   "de monde est repassee par-dessus a 42 pour cent, on voit donc le personnage au "+
   "travers du mur.</p>"+
   "<p>Le rendu vise 640 x 360 pixels logiques, agrandi en nombre entier pour rester net. "+
   "Le monde entier est peint une fois dans un canevas hors ecran, la camera n'en decoupe "+
   "que la portion visible.</p>"+
   "<p>Les entites sont triees par profondeur : ce qui a un y plus grand passe devant. "+
   "La minimap en bas a droite se decouvre au fur et a mesure de l'exploration, le "+
   "brouillard de guerre ne se referme jamais.</p>"},
 {t:"Les zombis", h:
   "<p>Il voit dans un cone de 180 degres devant lui, sur 88 pixels, et un mur suffit a "+
   "couper le regard : rien dans le dos, jamais. Il entend en revanche a travers tout. "+
   "Un bruit est un point et un rayon : vos pas ne portent rien en marche silencieuse, "+
   "28 pixels en marche normale et 56 au sprint ; un coup de feu porte le rayon de sa "+
   "munition, de 220 pixels pour du .22 a 1200 pour du 12,7 ; une lame porte le sien. "+
   "L'aptitude Discretion resserre tout ce que vous emettez, d'un tiers en plus quand "+
   "elle est nulle a un tiers en moins quand elle est pleine.</p>"+
   "<p>Quatre etats : il vegete, un bruit l'alerte et il va voir, il vous decouvre et "+
   "il chasse, il vous perd et fouille les environs de dix a trente secondes avant de "+
   "se rendormir la ou il se trouve. En vous decouvrant il gemit, et les siens "+
   "l'entendent a deux portees de pistolet.</p>"+
   "<p>Ils se regroupent tout seuls : deux zombis a moins de 140 pixels appartiennent a "+
   "la meme bande et la relation se propage. <b>Un isole marche sur la personne "+
   "la plus proche de toute la carte</b>, qu'il la voie ou non - c'est ce qui "+
   "fait descendre vers les bourgs celui qui sort du laboratoire. <b>Des "+
   "qu'ils sont deux, ils traversent la carte</b> au hasard et s'en prennent a "+
   "tout ce qu'ils croisent. Un isole qui n'a plus personne a rejoindre se "+
   "contente de deriver autour de l'endroit ou il se tient. Chacun porte un ou "+
   "deux traits d'espece qui deplacent sa vie, sa vitesse et son endurance, et "+
   "un sur cinq tient encore une arme.</p>"+
   "<p>Ils ne s'en prennent pas qu'a vous : tout ce qui vit sur la carte est une proie, "+
   "et un bourg peut se vider en votre absence. De pres ils epouvantent, et l'habitant "+
   "court dans leur dos. La morsure retire 25 a 35 points de vie et peut infecter a "+
   "n'importe quel niveau de vie : c'est l'Immunite qui decide, pas la jauge. Un "+
   "humain tue par une morsure se releve au bout d'une minute, sous son propre nom - "+
   "vous compris ; un mort par balle reste un mort.</p>"+
   "<p>Le terrain compte : une riviere les emporte deux fois plus vite que vous, ils ne "+
   "la traversent pas de leur plein gre, et un pont ou un gue annulent la derive. En "+
   "abordant une pente ils ont une chance sur trois de partir a la renverse.</p>"+
   "<p>D'ou viennent-ils : le laboratoire H-teck, un batiment unique plante loin des "+
   "bourgs. <b>Il ne lache rien tant que vous n'avez pas demande.</b> Chacun sort "+
   "par le sud et marche droit devant lui pendant trente secondes avant de s'arreter la "+
   "ou il est. Sept minutes apres la question le batiment se tait, et ils paraissent "+
   "desormais autour de vous, toujours hors de vue meme au plan le plus large - les "+
   "deux sources ne travaillent jamais ensemble. Leur nombre est plafonne.</p>"+
   "<h2>Le premier quart d'heure</h2>"+
   "<p>Au debut, tout va bien. Le pays tient, les gens vaquent, le laboratoire est "+
   "eteint. Rien ne se declenchera tant que vous ne poserez pas la question - la "+
   "quatrieme reponse d'une conversation, celle des rumeurs. Un joueur qui ne la "+
   "pose jamais vit dans un pays qui ne tombe jamais.</p>"+
   "<p>Une fois posee, tout se compte a partir de la :</p>"+
   "<table><tr><th>Quand</th><th>Ce qui arrive</th></tr>"+
   "<tr><td class='nm'>Tout de suite</td><td>le laboratoire commence a lacher. Ces "+
   "premiers zombis marchent sur les vivants, mais <b>personne ne les fuit</b> : "+
   "nul ne sait encore ce que c'est</td></tr>"+
   "<tr><td class='nm'>3 minutes</td><td>ils sont dehors. C'est alors seulement "+
   "qu'on peut recruter et fouiller les maisons - avant, il n'y a aucune raison "+
   "de forcer une porte dans un pays qui va bien</td></tr>"+
   "<tr><td class='nm'>5 minutes</td><td>un uniforme quitte son poste, vient droit "+
   "sur vous et donne l'ordre de quarantaine. A partir de la, les habitants "+
   "fuient les zombis</td></tr>"+
   "<tr><td class='nm'>7 minutes</td><td>le laboratoire se tait et ils paraissent "+
   "autour de vous</td></tr></table>"+
   "<p class='note'>Le recrutement reste par ailleurs commande par la "+
   "contamination : passe trois minutes la porte est ouverte, mais tant que le "+
   "pays tient, chacun a une vie a defendre et decline.</p>"+
   "<h2>Chez les gens, on n'entre pas</h2>"+
   "<p>On demarre devant la porte de l'habitant dont on a pris la place, et "+
   "c'est la <b>seule maison</b> ou l'on entre tant que le pays tient. Les "+
   "commerces, la mairie, le commissariat, l'hopital, la caserne : ceux-la "+
   "s'ouvrent depuis toujours. Devant un logement qui n'est pas le sien, le "+
   "personnage refuse - il n'a pas de raison de rentrer chez les gens - et il "+
   "ne crochete pas davantage.</p>"+
   "<p>Deux exceptions. Le <b>voleur</b>, celui des cinq metiers caches qui "+
   "vivait deja de ca, n'a pas besoin d'une epidemie pour se donner une "+
   "raison. Et l'<b>ordre de quarantaine</b>, qui lui ote ses scrupules d'un "+
   "coup : c'est le moment ou il decide de se trouver des armes.</p>"+
   "<p class='note'>Un immeuble a enseigne - la Boulangerie Duvals - reste un "+
   "logement. L'enseigne est une adresse d'artisan, il passe ses journees "+
   "devant.</p>"+
   "<h2>Se terrer, et gagner</h2>"+
   "<p>Le flic dit de rentrer chez soi. Le personnage repond qu'il ferait "+
   "mieux de se trouver des armes, et c'est ce que fera le joueur neuf fois "+
   "sur dix. Mais <b>obeir est une vraie fin</b>, et c'est la seule du jeu.</p>"+
   "<p>Rentrez chez vous - votre maison, pas n'importe quel toit - et "+
   "attendez. Passe la premiere minute, ils commencent a s'agglomerer autour "+
   "de la maison, de plus en plus nombreux : <b>trois cents</b> au bout de la "+
   "demi-heure. Alors des moteurs, au loin, et des ordres cries. L'armee "+
   "paraît - FAMAS, munitions infinies, pas de rechargement - et il en vient "+
   "sans fin jusqu'a ce que plus rien ne bouge. Le dernier zombi abattu, la "+
   "partie est gagnee.</p>"+
   "<p class='note'>Ressortir annule tout, et definitivement. Ce n'est pas "+
   "une pause : on a choisi l'autre vie. C'est ce qui donne son poids a la "+
   "demi-heure - trente minutes ou l'on ne peut rien faire d'autre que "+
   "regarder la fenetre se remplir, contre une partie entiere a chercher des "+
   "armes et des gens.</p>"+
   "<p>Il n'y a pas de cinematique : ce que l'on voit par la fenetre, ce sont "+
   "de vrais zombis qui arrivent vraiment, et l'on peut leur tirer dessus si "+
   "l'on veut.</p>"+
   "<p>Le stand de tir : un seul par carte lui aussi, mais celui-la se tient "+
   "toujours au bord d'une route, car un club de tir vit de ceux qui y viennent en "+
   "voiture. On le reconnait de loin a ses couloirs tondus qui montent vers le nord, "+
   "a sa ligne de cibles et a la butte de terre au fond. Le pas de tir couvert est "+
   "au sud, cote parking. Sa porte est toujours verrouillee, et sa serrure est la "+
   "meilleure du jeu : dix secondes de crochetage, autant que le commissariat, "+
   "l'armurerie et la caserne militaire.</p>"},
 {t:"Etat du chantier", h:
   "<p>Version 15. La boucle est fermee et le monde regarde ce qu'on y fait : il "+
   "produit une menace, on peut mourir, tuer a des consequences, et le score "+
   "s'enregistre en jours tenus.</p>"+
   "<p>Ce qui existe : le monde entier et sa voirie, le decor vivant et ses dialogues, "+
   "les trois marches, le cycle jour et nuit, la carte et le brouillard de guerre, le "+
   "socle deterministe (graines, journal d'entrees, empreinte d'etat, rejeu). "+
   "Cinquante-six armes francaises avec leurs munitions, leurs chargeurs et leurs modes de tir, l'epaule et "+
   "le corps a corps. Cinq sacs a dos et cent trente-cinq objets, dix armes de jet avec "+
   "leur souffle et leurs nappes - qu'un mur arrete, comme il arrete le "+
   "projectile lui-meme -, les deux acces rapides. Le souffle atteint tout ce "+
   "qui vit dans son rayon, vous compris : on se brule a son propre cocktail. "+
   "Les quatre competences et "+
   "leurs dix-huit aptitudes, dont l'endurance qui se depense et le poids porte qui "+
   "ralentit. Le bonus des voies. Les zombis, leur perception, leurs bandes, la "+
   "source unique et la releve des mordus. La fouille des corps et des batiments, "+
   "les sacs a dos "+
   "distribues par metier, l'echange d'objets. Le ravitaillement par calibre, les "+
   "objets qu'on pose et qu'on ramasse a terre. Et le regard des autres : on peut "+
   "tirer sur les vivants, les temoins fuient et se souviennent, un uniforme "+
   "previent toute la carte, et les porteurs d'uniforme ripostent.</p>"+
   "<p>Ce qui n'existe pas encore : "+
   "l'interieur des batiments n'est pas dessine, on fouille sans le voir. Le "+
   "changement de carte au bout du compte a rebours n'est pas branche, et la "+
   "construction de base non plus, bien que le materiel se ramasse deja et se "+
   "pese. Les compagnons ne se soignent pas d'eux-memes : ils attendent le "+
   "lever du jour a la base.</p>"}
];
var libI=0;
function showLib(k){
    state="menu";
    if(k!==undefined) libI=k;
    screenEl.style.display="flex";
    var nav="", i;
    for(i=0;i<LIB.length;i++)
        nav+="<button class='libnav"+(i===libI?" on":"")+"' data-i='"+i+"'>"+LIB[i].t+"</button>";
    screenEl.innerHTML="<div id='panel' class='help lib'>"+
        "<h1>Options</h1><div class='sub'>bibliotheque du jeu</div>"+
        "<div class='libwrap'><div class='libnavcol'>"+nav+"</div>"+
        "<div class='hscroll libbody'><h2>"+LIB[libI].t+"</h2>"+LIB[libI].h+"</div></div>"+
        "<button id='back' class='big' style='margin-top:12px;'>RETOUR</button></div>";
    var bs=screenEl.querySelectorAll(".libnav");
    for(i=0;i<bs.length;i++) bs[i].onclick=function(){ sClick(); showLib(+this.getAttribute("data-i")); };
    document.getElementById("back").onclick=function(){ audio(); showMenu(); };
}
/* Le visage du personnage, agrandi depuis son sprite, et sa silhouette en
   pied pour le panneau d'equipement. */
function drawPortraits(){
    var f=document.getElementById("pface"), b=document.getElementById("pbody");
    var tf=document.getElementById("tface"), tcd=document.getElementById("tcard");
    /* les deux figures de la fenetre de dialogue, en pied et face a face */
    function pied(id,spr,flip){
        var cv=document.getElementById(id);
        if(!cv||!cv.getContext) return;
        var g=cv.getContext("2d");
        g.imageSmoothingEnabled=false;
        g.clearRect(0,0,cv.width,cv.height);
        if(!spr) return;
        var dd=spr.hd||1, ww=spr.width/dd, hh=spr.height/dd;
        var sc=Math.min((cv.width-6)/ww,(cv.height-6)/hh);
        var dw=Math.round(ww*sc), dh=Math.round(hh*sc);
        var dx=Math.round((cv.width-dw)/2), dy=cv.height-dh-2;
        g.save();
        /* celui de droite regarde vers la gauche : les deux se font face */
        if(flip){ g.translate(cv.width,0); g.scale(-1,1); dx=cv.width-dx-dw; }
        g.drawImage(spr,0,0,spr.width,spr.height,dx,dy,dw,dh);
        g.restore();
    }
    pied("dme",(G&&G.p&&G.p.spr)?dressSpr(G.p,G.p.spr):heroA,false);
    pied("dyou",(G&&G.talk&&G.talk.spr)?G.talk.spr:null,true);
    /* la fiche de celui a qui l'on parle : sa vignette, son nom et ses barres */
    if(tf&&tf.getContext){
        var talkSpr=(G&&G.talk&&G.talk.spr)?G.talk.spr:null;
        if(tcd) tcd.style.display=talkSpr?"flex":"none";
        if(talkSpr){
            var tc=tf.getContext("2d");
            tc.imageSmoothingEnabled=false;
            tc.clearRect(0,0,tf.width,tf.height);
            var td=talkSpr.hd||1, tw=talkSpr.width/td, th=talkSpr.height/td;
            var tsc=Math.min((tf.width-4)/tw,(tf.height-4)/th);
            tc.drawImage(talkSpr,0,0,talkSpr.width,talkSpr.height,
                         Math.round((tf.width-tw*tsc)/2),Math.round((tf.height-th*tsc)/2),
                         Math.round(tw*tsc),Math.round(th*tsc));
        }
    }
    if(f&&f.getContext){
        var fc=f.getContext("2d");
        fc.imageSmoothingEnabled=false;
        fc.clearRect(0,0,f.width,f.height);
        var hspr=(G&&G.p&&G.p.spr)?dressSpr(G.p,G.p.spr):heroA;
        var d=hspr.hd||1, w=hspr.width/d, h=hspr.height/d;
        /* le personnage en pied, mis a l'echelle du cadre */
        var scf=Math.min((f.width-4)/w,(f.height-4)/h);
        fc.drawImage(hspr,0,0,hspr.width,hspr.height,
                     Math.round((f.width-w*scf)/2),Math.round((f.height-h*scf)/2),
                     Math.round(w*scf),Math.round(h*scf));
    }
    if(b&&b.getContext){
        var bspr=(G&&G.invNpc&&G.invNpc.spr)?dressSpr(G.invNpc,G.invNpc.spr):
                 ((G&&G.p&&G.p.spr)?dressSpr(G.p,G.p.spr):heroA);
        var bc=b.getContext("2d");
        bc.imageSmoothingEnabled=false;
        bc.clearRect(0,0,b.width,b.height);
        var d2b=bspr.hd||1, w2=bspr.width/d2b, h2=bspr.height/d2b;
        var sc=Math.min(b.width/w2,b.height/h2)*0.92;
        bc.drawImage(bspr,0,0,bspr.width,bspr.height,
                     Math.round((b.width-w2*sc)/2),Math.round((b.height-h2*sc)/2),
                     Math.round(w2*sc),Math.round(h2*sc));
    }
}
