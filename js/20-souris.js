"use strict";
/* ================================================================
   TUAZ - 20-souris.js
   Le glisser-deposer de l'inventaire et la table d'echange a deux.
   (lignes 23135 a 25092 du mono-fichier d'origine)
   ================================================================ */
/* ================= LE GLISSER-DEPOSER =================
   Tout allait dans les poches et tout y restait bloque : pour s'armer, se
   vetir, se munir d'un sac ou poser un soin sur un acces rapide, il fallait
   ouvrir une liste de boutons a chaque fois. Ces listes restent - elles
   servent de reglage et elles creent des objets de rien - mais le geste
   ordinaire est maintenant de prendre la vignette et de la lacher ou l'on
   veut.

   UNE PLACE EST UNE ZONE ET UN RANG, codes en un seul nombre. Cinq zones
   d'atterrissage plus le sol, et le journal ne porte qu'une action pour
   toutes : idnd, qui vaut source fois dix mille plus destination. Sans cela
   il aurait fallu une action par couple de zones, et un geste a la souris ne
   se rejouerait pas.

   CE QUI PEUT ALLER OU EST DECIDE EN UN SEUL ENDROIT, dndOk. La regle n'est
   pas repetee dans le fantome, dans le lacher et dans le deplacement : le
   fantome INTERROGE dndOk pour se peindre en vert, et c'est la meme reponse
   qui autorise le geste. Deux copies de la meme regle finissent toujours par
   diverger. */
var DZ_BAG=0, DZ_ARM=1, DZ_VET=2, DZ_QCK=3, DZ_SAC=4, DZ_SOL=5;
function dzPlace(z,i){ return z*100+(i|0); }
function dzZone(pl){ return (pl/100)|0; }
function dzIdx(pl){ return pl%100; }
/* Ce qu'une place contient, pour qui veut le peindre ou le juger. */
function dzObj(pl){
    var p=G&&G.p, z=dzZone(pl), i=dzIdx(pl), c;
    if(!p) return null;
    if(z===DZ_BAG){ c=p.inv&&p.inv[i]; return cellObj(c); }
    if(z===DZ_ARM) return (p.slots&&p.slots[i])||null;
    if(z===DZ_VET) return vetAt(p,i);
    if(z===DZ_QCK) return itemById(quickId(i));
    if(z===DZ_SAC) return bagItem();
    return null;
}
/* L'indice d'une arme au registre : les emplacements gardent l'objet et non
   son rang, il faut donc le retrouver pour le confier a setCell. */
function wIndexOf(w){
    var q;
    if(!w) return -1;
    for(q=0;q<WEAPONS.length;q++) if(WEAPONS[q]===w) return q;
    return -1;
}
function bagIndexOf(o){
    var q;
    if(!o) return -1;
    for(q=0;q<BAGS.length;q++) if(BAGS[q].id===o.id) return q;
    return -1;
}
/* Ce qu'on pourrait perdre en otant le sac : les poches ne tiennent que
   POCKETS cases, et invFit tronque sans rien demander. */
function bagDropOk(){
    var p=G&&G.p, q, c, po=[], b=bagItem();
    if(!p||!p.inv) return true;
    /* CE N'EST PLUS UN COMPTE DE CASES. Les poches sont une grille de
       PPOCKETS sur un : il faut que chaque chose y retrouve une place a sa
       FORME, et le sac lui-meme avec, puisqu'il redescend dedans. On simule
       le rangement au lieu de compter - un pied-de-biche de deux cases et
       deux conserves font trois cases dans les deux calculs, mais seul le
       premier sait que le pied-de-biche ne rentre pas. */
    for(q=0;q<PPOCKETS;q++) po.push(null);
    po.gw=PPOCKETS;
    for(q=0;q<p.inv.length;q++){
        c=p.inv[q];
        if(!c||cellIsRef(c)) continue;
        if(!gridAdd(po,c)) return false;
    }
    return !b||gridAdd(po,{i:b.id,q:1});
}
/* Les deux gestes de la ceinture, isoles pour que le fantome et le lacher
   posent exactement la meme question. */
function dndBeltOk(si,di){
    var p=G&&G.p, cs, cd, os, od;
    if(!p||!p.inv) return false;
    cs=p.inv[si]; cd=p.inv[di];
    if(!cs||!cd||cellIsW(cs)||cellIsW(cd)||cellIsRef(cs)||cellIsRef(cd)) return false;
    os=itemById(cs.i); od=itemById(cd.i);
    if(cellBareBelt(cd)&&os&&os.k==="mun"&&cs.b===undefined) return true;
    if(cellBareBelt(cs)&&od&&od.k==="mun"&&cd.b===undefined) return true;
    return false;
}
function dndOk(src,dst){
    var p=G&&G.p, sz=dzZone(src), dz=dzZone(dst), si=dzIdx(src), di=dzIdx(dst);
    var o=dzObj(src), c;
    if(!p||!o) return false;
    if(src===dst) return false;
    c=(sz===DZ_BAG&&p.inv)?p.inv[si]:null;
    if(dz===DZ_SOL) return sz===DZ_BAG;
    if(dz===DZ_ARM){
        if(sz===DZ_BAG) return cellIsW(c)&&wSlot(o)===di;
        if(sz===DZ_ARM) return false;      /* un emplacement par categorie */
        return false;
    }
    if(dz===DZ_VET){
        if(sz!==DZ_BAG||cellIsW(c)) return false;
        return o.k==="vet"&&o.sl===di;
    }
    if(dz===DZ_QCK){
        if(sz!==DZ_BAG||cellIsW(c)) return false;
        return qOk(di,o);
    }
    if(dz===DZ_SAC){
        if(sz!==DZ_BAG||cellIsW(c)) return false;
        return o.k==="sac"&&bagIndexOf(o)>=0;
    }
    if(dz===DZ_BAG){
        if(!p.inv||di>=p.inv.length) return false;
        if(sz===DZ_BAG){
            /* LA FORME DECIDE. Deux cases ne permutent plus a l'aveugle : on
               pose l'objet tire a l'endroit vise, et il faut que son
               rectangle y tienne - en s'ignorant lui-meme, sans quoi on ne
               pourrait pas le decaler d'un cran. Les deux gestes de ceinture
               passent avant, eux ne deplacent rien. */
            if(dndBeltOk(si,di)) return true;
            /* un renvoi n'est pas une place - SAUF s'il appartient a l'objet
               qu'on deplace, sans quoi on ne pourrait pas le decaler d'un
               cran */
            if(!cellIsRef(p.inv[di])||p.inv[di].r===si){
                if(gridFree(p.inv,di,cellGW(c),cellGH(c),si)) return true;
            }
            /* LA PLACE EST PRISE : c'est un echange, et il n'est possible que
               si les deux tiennent. ON LE JOUE SUR UNE COPIE - la meme
               fonction que le geste lui-meme, jamais une seconde ecriture de
               la regle : deux copies d'une regle finissent toujours par
               diverger, et celle-ci decide a la fois du vert du fantome et du
               lacher. */
            return gridSwap(gridClone(p.inv),si,di);
        }
        if(cellIsRef(p.inv[di])) return false;
        if(sz===DZ_ARM) return gridFree(p.inv,di,o.gw||1,o.gh||1);
        if(sz===DZ_VET) return true;                   /* invPush trouve seul */
        if(sz===DZ_QCK) return true;                   /* on ne fait qu'oublier */
        if(sz===DZ_SAC) return bagDropOk();
    }
    return false;
}
/* Le deplacement lui-meme. Il ne juge rien - dndOk a deja juge - et il passe
   par les fonctions qui existaient : vetWearFrom sait deja rendre l'ancienne
   piece, setSlot sait deja refuser une arme qui n'est pas de sa categorie. */
function dndDo(src,dst){
    var p=G&&G.p, sz=dzZone(src), dz=dzZone(dst), si=dzIdx(src), di=dzIdx(dst);
    var o, c, wi, old, tmp;
    if(!dndOk(src,dst)) return false;
    o=dzObj(src);
    c=(sz===DZ_BAG&&p.inv)?p.inv[si]:null;
    if(dz===DZ_SOL) return gndPut(si);
    if(dz===DZ_ARM){
        wi=(c&&c.w!==undefined)?c.w:-1;
        old=p.slots[di];
        p.inv[si]=null;
        setSlot(di,wi);
        /* l'ancienne redescend a la place liberee */
        if(old){
            tmp=wIndexOf(old);
            if(tmp>=0) setCell(si,200+tmp);
        }
        logMsg("Vous prenez "+o.n+" en main.","jday");
        return true;
    }
    if(dz===DZ_VET) return vetWearFrom(di,si);
    if(dz===DZ_QCK){ setQuick(di,o.id); return true; }
    if(dz===DZ_SAC){
        old=bagItem();
        wi=bagIndexOf(o);
        c.q--; if(c.q<=0) p.inv[si]=null;
        setBag(wi);
        if(old&&!invPush(old.id,1)){
            gndDrop({i:old.id,q:1},p.x,p.y);
            logMsg("Plus de place : "+old.n+" tombe a terre.","jday");
        }
        logMsg("Vous prenez "+o.n+".","jday");
        return true;
    }
    if(dz===DZ_BAG){
        if(sz===DZ_BAG){
            /* ---- LE GESTE DE LA CEINTURE ----
               Deux cases qui se rencontrent ne font pas toujours un echange.
               Des munitions lachees sur une ceinture posee la garnissent ;
               une ceinture lachee sur des munitions les prend en charge. Le
               reste permute comme avant. */
            var cs=p.inv[si], cd=p.inv[di], bs, bd, os, od, t2;
            if(dndBeltOk(si,di)){
                os=itemById(cs.i); od=itemById(cd.i);
                bs=cellBareBelt(cs); bd=cellBareBelt(cd);
                /* les deux cases sont de forme un sur un : rien a replacer */
                /* des boites versees dans une ceinture vide */
                if(bd&&os&&os.k==="mun"&&cs.b===undefined){
                    t2=Math.min(cs.q||1,bd.blt);
                    p.inv[di]={i:cs.i,q:t2,b:bd.id};
                    cs.q-=t2;
                    p.inv[si]=(cs.q>0)?cs:null;
                    logMsg("Vous garnissez "+bd.n.toLowerCase()+".","jday");
                    return true;
                }
                /* une ceinture posee sur des boites qui n'en avaient pas */
                if(bs&&od&&od.k==="mun"&&cd.b===undefined){
                    t2=Math.min(cd.q||1,bs.blt);
                    p.inv[di]={i:cd.i,q:t2,b:bs.id};
                    p.inv[si]=(cd.q>t2)?{i:cd.i,q:cd.q-t2}:null;
                    logMsg("Vous garnissez "+bs.n.toLowerCase()+".","jday");
                    return true;
                }
            }
            /* LE DEPLACEMENT N'EST PLUS UNE PERMUTATION. On ote l'objet, on
               le repose a l'endroit vise ; si le rectangle n'y tient pas on
               le remet d'ou il vient - deux formes differentes n'ont aucune
               raison d'echanger leurs places. */
            tmp=gridTake(p.inv,si);
            if(!tmp) return false;
            if(gridFree(p.inv,di,cellGW(tmp),cellGH(tmp))&&gridPut(p.inv,di,tmp)) return true;
            gridPut(p.inv,si,tmp);
            /* la place etait prise : on tente l'echange, qui sait se defaire
               tout seul s'il ne tient pas */
            return gridSwap(p.inv,si,di);
        }
        if(sz===DZ_ARM){
            wi=wIndexOf(p.slots[si]);
            if(wi>=0&&!gridFree(p.inv,di,WEAPONS[wi].gw,WEAPONS[wi].gh)) return false;
            setSlot(si,-1);
            if(wi>=0) setCell(di,200+wi);
            logMsg("Vous rangez "+o.n+".","jday");
            return true;
        }
        if(sz===DZ_VET) return vetWearFrom(si,-1);
        if(sz===DZ_QCK){ setQuick(si,-1); return true; }
        if(sz===DZ_SAC){
            wi=o.id;
            setBag(-1);
            if(!invPush(wi,1)){
                gndDrop({i:wi,q:1},p.x,p.y);
                logMsg("Plus de place : "+o.n+" tombe a terre.","jday");
            } else logMsg("Vous otez "+o.n+".","jday");
            return true;
        }
    }
    return false;
}
/* ---- TIRER UNE CASE HORS DU PANNEAU ----
   Poser au sol se fait au geste : on saisit une case et on la lache en
   dehors du panneau d'equipement. LE FANTOME PORTE MAINTENANT LA VIGNETTE ET
   NON UN MOT - c'est l'image qu'on deplace, et l'on voit ce qu'on tient. Il
   se peint en vert des que la place survolee accepte ce qu'on porte, et
   c'est dndOk qui le lui dit, la meme fonction qui autorisera le lacher.
   Le lacher passe par le journal d'entrees comme tout le reste : sans cela
   un geste a la souris ne se rejouerait pas. */
var IDRAG=null;
function idragGhost(){ return document.getElementById("idrag"); }
function idragEnd(){
    var el=idragGhost();
    if(el){ el.style.display="none"; el.className=""; el.innerHTML=""; }
    IDRAG=null;
}
function idragOut(x,y){
    var r=ipanEl&&ipanEl.getBoundingClientRect?ipanEl.getBoundingClientRect():null;
    if(!r) return false;
    return x<r.left||x>r.right||y<r.top||y>r.bottom;
}
/* La place sous la souris, ou le sol si l'on est sorti du panneau. */
function idragAt(x,y){
    var el=document.elementFromPoint?document.elementFromPoint(x,y):null;
    var t=(el&&el.closest)?el.closest("[data-dz]"):null;
    if(t) return dzPlace(parseInt(t.getAttribute("data-dz"),10)|0,
                         parseInt(t.getAttribute("data-di"),10)|0);
    return idragOut(x,y)?dzPlace(DZ_SOL,0):-1;
}
/* Armer une case : elle devient une place, et l'on peut la saisir. Un seul
   endroit pose les attributs, donc une zone oubliee se voit tout de suite -
   elle n'attrape rien. */
function idragArm(el,z,i,o){
    if(!el) return;
    el.setAttribute("data-dz",String(z));
    el.setAttribute("data-di",String(i));
    el.onmousedown=function(e){
        if(!o) return;
        IDRAG={pl:dzPlace(z,i), x:e.clientX, y:e.clientY, on:false, o:o};
    };
}
addEventListener("mousemove",function(e){
    if(!IDRAG) return;
    if(!IDRAG.on){
        if(Math.abs(e.clientX-IDRAG.x)+Math.abs(e.clientY-IDRAG.y)<6) return;
        IDRAG.on=true;
        var el=idragGhost();
        if(el){
            var o=IDRAG.o;
            /* une arme est longue : sa vignette fait 192 sur 84, celle d'un
               objet 96 sur 96 */
            var lg=!(o&&o.ic);
            el.innerHTML="<canvas width='"+(lg?192:96)+"' height='"+
                         (lg?84:96)+"'></canvas>";
            var cv=el.querySelector("canvas");
            if(cv&&cv.getContext){
                var g=cv.getContext("2d");
                g.clearRect(0,0,cv.width,cv.height);
                if(o&&o.ic) itIconDraw(g,o.ic,0,0,4,IWHITE);
                else iconDraw(g,o,0,0,1,IWHITE);
            }
            el.style.display="block";
        }
    }
    var el2=idragGhost();
    if(!el2) return;
    el2.style.left=e.clientX+"px"; el2.style.top=e.clientY+"px";
    var pl=idragAt(e.clientX,e.clientY);
    el2.className=(pl>=0&&dndOk(IDRAG.pl,pl))?"iout":"";
});
addEventListener("mouseup",function(e){
    if(!IDRAG) return;
    var src=IDRAG.pl, on=IDRAG.on;
    var pl=idragAt(e.clientX,e.clientY);
    idragEnd();
    if(!on||pl<0) return;
    if(!dndOk(src,pl)) return;
    sClick();
    pushAct("idnd",src*10000+pl);
});
function bagGridFill(){
    var gr=document.getElementById("ibag"), p=G&&G.p;
    if(!gr||!p) return;
    invFit();
    var h="", i, c, o, rk=[], W=invGW(p.inv), x, y;
    gr.style.setProperty("--gn",W);
    for(i=0;i<p.inv.length;i++){
        c=p.inv[i];
        if(cellIsRef(c)) continue;   /* sa case est peinte par son ancre */
        o=cellObj(c);
        x=i%W; y=(i/W)|0;
        rk.push(i);
        var bl2=cellBelt(c);
        h+="<div class='slot"+(o?" ifull":"")+(bl2?" ibelt":"")+
           (IPICK===i?" ipickon":"")+"' data-c='"+i+
           "' style='grid-column:"+(x+1)+"/span "+(c?cellGW(c):1)+
           ";grid-row:"+(y+1)+"/span "+(c?cellGH(c):1)+"'>";
        if(o) h+="<canvas class='iic' width='96' height='96'></canvas>"+
                 (bl2?("<span class='iq ibq'>"+c.q+"/"+bl2.blt+"</span>")
                     :((c.q>1&&!cellIsW(c))?("<span class='iq'>"+c.q+"</span>"):""));
        h+="</div>";
    }
    gr.innerHTML=h;
    var cs=gr.querySelectorAll(".slot");
    for(i=0;i<cs.length;i++){
        c=p.inv[rk[i]]; o=cellObj(c);
        if(o){
            var cv=cs[i].querySelector("canvas");
            if(cv&&cv.getContext){
                var g2=cv.getContext("2d");
                g2.clearRect(0,0,96,96);
                /* une arme est longue : sa vignette de 192 sur 84 se pose en
                   travers de la case, a demi-echelle et centree en hauteur */
                if(cellIsW(c)) iconDraw(g2,o,0,27,0.5,IWHITE);
                else itIconDraw(g2,o.ic,0,0,4,IWHITE);
            }
        }
        cs[i].title=o?(o.n+(cellIsW(c)?(" - "+o.fam):(" - "+itemLine(o)))+
                       (cellBelt(c)?(" - "+cellBelt(c).n.toLowerCase()):"")):"";
        (function(k,ob){ cs[k].onclick=function(){
            sClick(); IPICK=(IPICK===rk[k])?-1:rk[k]; BPICK=false; iBagFill();
        }; })(i,o);
        idragArm(cs[i],DZ_BAG,rk[i],o);
    }
    /* ---- CE QUE CETTE LIGNE DIT, ET CE QU'ELLE NE DIT PLUS ----
       Elle expliquait la regle : le souffle qui part deux fois plus vite, la
       charge qui pese sur les jambes, la marche seule au-dela du double. Ce
       n'est pas la place d'un cours - les regles sont dans la bibliotheque,
       et un panneau d'equipement qui fait la lecon a chaque ouverture se
       lit une fois puis ne se lit plus. Il ne reste que des chiffres et un
       mot d'etat. */
    var nt=document.getElementById("ibagnote"), b=bagItem();
    if(nt) nt.textContent=(b?b.n:"Sans sac a dos")+" - "+invUsed()+"/"+
        p.inv.length+" cases, "+invWeight().toFixed(2)+"/"+
        carryCap().toFixed(1)+" kg"+
        (overCarry()?" - surcharge":
          (loadRatio()>0?" - charge":""));
    var pk=document.getElementById("ipick");
    if(!pk) return;
    if(IPICK<0){ pk.style.display="none"; pk.innerHTML=""; return; }
    var t="", fam="", cur=p.inv[IPICK], co=cellObj(cur);
    /* on ne mange que ce qui se mange : le bouton n'apparait pas ailleurs */
    if(co&&!cellIsW(cur)&&(co.k==="viv"||co.k==="med"))
        t+="<button data-i='-2'>-- utiliser --</button>";
    /* le meme geste que le glisser, pour qui prefere le bouton */
    if(co) t+="<button data-i='-3'>-- poser au sol --</button>";
    if(co&&baseHere()) t+="<button data-i='-4'>-- ranger a la base --</button>";
    t+="<button data-i='-1'>-- vider la case --</button>";
    for(i=0;i<ITEMS.length;i++){
        o=ITEMS[i];
        if(o.fam!==fam){ fam=o.fam; t+="<div class='ipfam'>"+fam+"</div>"; }
        t+="<button data-i='"+o.id+"'>"+o.n+"<i>"+itemLine(o)+"</i></button>";
    }
    /* les armes ferment la liste : une arme, une case, jamais de pile */
    t+="<div class='ipfam'>Armes</div>";
    for(i=0;i<WEAPONS.length;i++)
        t+="<button data-i='"+(200+i)+"'>"+WEAPONS[i].n+"<i>"+WEAPONS[i].fam+"</i></button>";
    pk.innerHTML=t; pk.style.display="flex";
    var bs2=pk.querySelectorAll("button");
    for(i=0;i<bs2.length;i++)(function(el2){
        el2.onclick=function(){
            var id=parseInt(this.getAttribute("data-i"),10);
            sClick();
            if(id===-2) pushAct("iuse",IPICK);
            else if(id===-3) pushAct("idrop",IPICK);
            else if(id===-4) pushAct("bput",IPICK);
            else pushAct("isel",IPICK*1000+(id+1));
        };
    })(bs2[i]);
}
function iBagFill(){ bagSlotFill(); bagGridFill(); qSlotFill(); }
/* Les deux emplacements rapides, et la liste qui s'ouvre dessous. */
var QPICK=-1;
function qSlotFill(){
    var s, el, id, o, i;
    for(s=0;s<2;s++){
        el=document.getElementById(s?"qsE":"qsA");
        if(!el) continue;
        id=quickId(s); o=itemById(id);
        el.innerHTML=o?("<canvas class='iic' width='96' height='96'></canvas>"+
                        "<span class='iq'>"+invCount(id)+"</span>"):"";
        if(o) itPaint(el,o);
        el.className="slot"+(o?" ifull":"")+(QPICK===s?" ipickon":"");
        el.title=o?(o.n+" - "+itemLine(o)):"";
        (function(k){ el.onclick=function(){
            sClick(); QPICK=(QPICK===k)?-1:k; BPICK=false; IPICK=-1; iBagFill();
        }; })(s);
        idragArm(el,DZ_QCK,s,o);
    }
    var pk=document.getElementById("qpick");
    if(!pk) return;
    if(QPICK<0){ pk.style.display="none"; pk.innerHTML=""; return; }
    var t="<button data-q='-1'>-- vider l'emplacement --</button>", fam="";
    for(i=0;i<ITEMS.length;i++){
        o=ITEMS[i];
        if(!qOk(QPICK,o)) continue;
        if(o.fam!==fam){ fam=o.fam; t+="<div class='ipfam'>"+fam+"</div>"; }
        t+="<button data-q='"+o.id+"'>"+o.n+"</button>";
    }
    pk.innerHTML=t; pk.style.display="flex";
    var bs=pk.querySelectorAll("button");
    for(i=0;i<bs.length;i++)(function(el2){
        el2.onclick=function(){
            sClick();
            pushAct("qsel",QPICK*1000+(parseInt(this.getAttribute("data-q"),10)+1));
            QPICK=-1;
        };
    })(bs[i]);
}
/* La signature du sac : elle change des qu'une case bouge, et c'est elle qui
   commande le repeint, puisque le choix ne prend effet qu'au tour suivant. */
function iBagSigOf(){
    var p=G&&G.p;
    if(!p) return "";
    var s=p.bag+"|"+BPICK+"|"+IPICK+"|"+QPICK+"|"+p.qa+"|"+p.qe+"|", i, c;
    for(i=0;i<(p.inv?p.inv.length:0);i++){
        c=p.inv[i];
        s+=(c?(cellIsW(c)?("w"+c.w):(c.i+"x"+c.q)):"-")+",";
    }
    return s;
}
var WPICK=-1, wSlotSig=null;
function wSlotFill(){
    var i, el, w, p=G&&G.p;
    for(i=0;i<4;i++){
        el=document.getElementById("wsl"+i);
        if(!el) continue;
        w=(p&&p.slots)?p.slots[i]:null;
        el.innerHTML=w?("<canvas class='wic' width='192' height='84'></canvas>"+
                        "<span class='wtag'>"+w.n+"</span>"):"";
        if(w){
            var cvx=el.querySelector("canvas");
            if(cvx&&cvx.getContext){
                var g=cvx.getContext("2d");
                g.clearRect(0,0,192,84);
                iconDraw(g,w,0,0,1,IWHITE);
            }
        }
        el.className="slot"+(w?" wfull":"")+((p&&p.hand===i)?" whand":"");
        (function(k){ el.onclick=function(){ sClick(); wPickOpen(k); }; })(i);
        idragArm(el,DZ_ARM,i,w);
    }
    var pk=document.getElementById("wpick");
    if(!pk) return;
    if(WPICK<0||WPICK>3){ pk.style.display="none"; pk.innerHTML=""; return; }
    var h="<button data-w='-1'>-- vider l'emplacement --</button>", q;
    for(q=0;q<WEAPONS.length;q++)
        if(wSlot(WEAPONS[q])===WPICK)
            h+="<button data-w='"+q+"'>"+WEAPONS[q].n+" - "+WEAPONS[q].fam+"</button>";
    pk.innerHTML=h; pk.style.display="flex";
    var bs=pk.querySelectorAll("button");
    for(q=0;q<bs.length;q++)(function(el2){
        el2.onclick=function(){
            var wi=parseInt(this.getAttribute("data-w"),10);
            sClick(); pushAct("wsel",WPICK*100+(wi+1));
            WPICK=-1;
        };
    })(bs[q]);
}
function wPickOpen(i){
    WPICK=(WPICK===i)?-1:i;
    wSlotFill();
}
/* ---- LES QUATRE EMPLACEMENTS DE TENUE ----
   Ils se peignent comme ceux des armes : la vignette de ce qu'on porte, son
   nom, et au clic la liste de ce qu'on a dans le sac pour cet emplacement.
   On n'y met que ce qu'on possede - contrairement aux armes, dont la liste
   est un outil de reglage qui les cree de rien. */
var VPICK=-1, vSlotSig=null;
function vSlotSigOf(){
    var p=G&&G.p, i, s=VPICK+"|";
    if(!p) return s;
    for(i=0;i<4;i++) s+=(p.vet?p.vet[i]:-1)+",";
    if(p.inv) for(i=0;i<p.inv.length;i++){
        var c=p.inv[i];
        s+=(c&&!cellIsW(c))?("i"+c.i):"-";
    }
    return s;
}
function vSlotFill(){
    var i, el, d, p=G&&G.p;
    for(i=0;i<4;i++){
        el=document.getElementById("vsl"+i);
        if(!el) continue;
        d=vetAt(p,i);
        el.innerHTML=d?"<canvas class='iic' width='96' height='96'></canvas>":"";
        if(d){
            var cvx=el.querySelector("canvas");
            if(cvx&&cvx.getContext){
                var g=cvx.getContext("2d");
                g.clearRect(0,0,96,96);
                itIconDraw(g,d.ic,0,0,4,IWHITE);
            }
        }
        el.className="slot"+(d?" wfull":"");
        el.title=d?(d.n+" - "+vetLine(d)+" - "+d.pds.toFixed(2)+" kg")
                  :("Emplacement "+VETSLOT[i].toLowerCase()+" - vide");
        (function(k){ el.onclick=function(){ sClick(); vPickOpen(k); }; })(i);
        idragArm(el,DZ_VET,i,d);
    }
    var pk=document.getElementById("vpick");
    if(!pk) return;
    if(VPICK<0||VPICK>3){ pk.style.display="none"; pk.innerHTML=""; return; }
    var h="", q, c, o, seen={}, n=0;
    if(vetAt(p,VPICK)) h+="<button data-c='-1'>-- retirer et ranger --</button>";
    if(p&&p.inv) for(q=0;q<p.inv.length;q++){
        c=p.inv[q];
        if(!c||cellIsW(c)) continue;
        o=itemById(c.i);
        if(!o||o.k!=="vet"||o.sl!==VPICK||seen[o.id]) continue;
        seen[o.id]=1; n++;
        h+="<button data-c='"+q+"'>"+o.n+" - "+vetLine(o)+"</button>";
    }
    if(!n&&!vetAt(p,VPICK))
        h="<button data-c='-2'>rien pour cet emplacement dans le sac</button>";
    pk.innerHTML=h; pk.style.display="flex";
    var bs=pk.querySelectorAll("button");
    for(q=0;q<bs.length;q++)(function(el2){
        el2.onclick=function(){
            var ci=parseInt(this.getAttribute("data-c"),10);
            sClick();
            if(ci!==-2) pushAct("vsel",VPICK*1000+(ci+2));
            VPICK=-1;
        };
    })(bs[q]);
}
function vPickOpen(i){
    VPICK=(VPICK===i)?-1:i;
    vSlotFill();
}
/* ---- ENFILER, RETIRER ----
   Les deux gestes passent par le journal d'entrees comme tout le reste : le
   rejeu doit rhabiller le joueur au meme tour que la partie d'origine.
   ci vaut -1 pour un retrait, sinon la case du sac ou se trouve la piece.
   Ce qu'on portait redescend dans le sac ; s'il est plein, la piece tombe
   par terre plutot que de s'evaporer. */
function vetWearFrom(s,ci){
    var p=G&&G.p, old, c, o;
    if(!p||s<0||s>3) return false;
    if(!p.vet) p.vet=vetInit();
    if(ci<0){
        old=vetClear(p,s);
        if(old<0) return false;
        if(!invPush(old,1)){
            gndDrop({i:old,q:1},p.x,p.y);
            logMsg("Plus de place : "+itemById(old).n+" tombe a terre.","jday");
        } else logMsg("Vous retirez "+itemById(old).n+".","jday");
        return true;
    }
    c=(p.inv&&ci<p.inv.length)?p.inv[ci]:null;
    if(!c||cellIsW(c)) return false;
    o=itemById(c.i);
    if(!o||o.k!=="vet"||o.sl!==s) return false;
    /* on sort la piece du sac avant de rendre l'ancienne : sinon un sac plein
       refuserait l'echange alors que la place se libere au meme instant */
    c.q--; if(c.q<=0) p.inv[ci]=null;
    old=vetClear(p,s);
    vetSet(p,o.id);
    if(old>=0&&!invPush(old,1)){
        gndDrop({i:old,q:1},p.x,p.y);
        logMsg("Plus de place : "+itemById(old).n+" tombe a terre.","jday");
    }
    logMsg("Vous enfilez "+o.n+".","jday");
    return true;
}
/* Le cartouche d'arme, a cote du visage : la vignette de ce qu'on tient, son
   nom, et l'etat du chargeur. */
var wCardLast=null;
function wCardTick(){
    var el=document.getElementById("wcard");
    if(!el) return;
    var w=handWeapon(), p=G.p;
    if(!w||!G.armed){ el.style.display="none"; wCardLast=null; return; }
    el.style.display="flex";
    if(wCardLast!==w){
        wCardLast=w;
        document.getElementById("wcardn").textContent=w.n.toUpperCase();
        var c=document.getElementById("wcardic");
        if(c&&c.getContext){
            var g=c.getContext("2d");
            g.clearRect(0,0,192,84);
            iconDraw(g,w,0,0,1,IWHITE);
        }
    }
    /* les balles du mode de tir */
    var md=document.getElementById("wcardm");
    if(md){
        var nb=[1,3,5][handMode()]||1, h="", q;
        for(q=0;q<nb;q++) h+="<i></i>";
        md.innerHTML=h;
    }
    var a=document.getElementById("wcarda"), f=document.getElementById("wcardf");
    if(!a) return;
    if(!w.mag){ a.className=""; a.textContent="-"; if(f) f.style.width="0"; return; }
    /* le rechargement ne barre plus l'ecran : il se lit ici, et une barre
       transparente se remplit derriere le texte */
    if(p.rl>0){
        a.className="low"; a.textContent="RECHARGE";
        if(f) f.style.width=Math.round(100*(1-p.rl/(p.rlT||1)))+"%";
        return;
    }
    if(f) f.style.width="0";
    var m=p.mag[p.hand]|0;
    a.className=(m<=Math.max(1,w.mag*0.25))?"low":"";
    /* le signe de l'infini a disparu : c'est la reserve du calibre qui se
       lit maintenant a droite du chargeur */
    var rs=ammoStock(p,w.am);
    a.innerHTML="<b>"+m+"</b> / "+w.mag+"  <u>"+rs+"</u>";
    if(rs<=0) a.className="low";
}
var actSig=null;
function actListTick(){
    var el=document.getElementById("achoice");
    if(!el) return;
    var L=(G&&G.acts)||[];
    /* Pendant qu'un emplacement se fouille, la liste est vide mais il faut
       bien montrer le compte a rebours : on remplace la ligne d'action par
       une jauge, qui dit aussi le rang de l'emplacement en cours. */
    if(G&&G.srch&&!G.showBag&&!G.trade){
        var f9=Math.min(1,G.srch.t/Math.max(0.001,G.srch.dur));
        var s9="w"+Math.round(f9*40);
        if(s9!==actSig){
            actSig=s9;
            el.innerHTML="<div class='arow on'>Fouille "+
                ((G.srch.b.done|0)+1)+"/"+(G.srch.b.rooms|0)+
                "  <b>"+Math.round(f9*100)+"%</b></div>"+
                "<div class='ahint'>[S] pour interrompre et sortir</div>";
            el.style.display="block";
        }
        return;
    }
    if(!L.length||G.showBag||G.trade){
        if(actSig!==null){ el.style.display="none"; el.innerHTML=""; actSig=null; }
        return;
    }
    var sg=L.map(actIdOf).join("|")+"#"+G.actI, h="", i;
    if(sg===actSig) return;
    actSig=sg;
    for(i=0;i<L.length;i++)
        h+="<div class='arow"+(i===G.actI?" on":"")+"' data-a='"+i+"'>"+
           (i===G.actI?"<b>[F]</b> ":"&nbsp;&nbsp;&nbsp;&nbsp; ")+
           actLabel(L[i])+"</div>";
    if(L.length>1) h+="<div class='ahint'>molette, Tab, ou clic</div>";
    el.innerHTML=h; el.style.display="block";
    /* Le clic ne designe que la ligne : il ne la declenche pas. Declencher au
       clic ferait partir une action sur un simple survol maladroit, alors que
       [F] est a portee de pouce et que la liste sert justement a choisir avant
       d'agir. */
    if(L.length>1){
        var rw=el.querySelectorAll(".arow");
        for(i=0;i<rw.length;i++)(function(rr9){
            rr9.onmousedown=function(ev){ if(ev&&ev.stopPropagation) ev.stopPropagation(); };
            rr9.onclick=function(){
                pushAct("asel",parseInt(rr9.getAttribute("data-a"),10)|0);
            };
        })(rw[i]);
    }
}
/* Les deux cartouches qui encadrent l'arme : le soin de [A] a gauche, l'arme
   de jet de [E] a droite, chacun avec ce qu'il en reste dans le sac. Le
   nombre passe au rouge quand il tombe a zero. */
var qCardLast=[null,null];
function qCardTick(){
    var s, el, id, o, cv, g, num, n;
    for(s=0;s<2;s++){
        el=document.getElementById(s?"qcardE":"qcardA");
        if(!el) continue;
        id=quickId(s); o=itemById(id);
        if(!o){ el.style.display="none"; qCardLast[s]=null; continue; }
        el.style.display="block";
        if(qCardLast[s]!==o){
            qCardLast[s]=o;
            cv=el.querySelector("canvas");
            if(cv&&cv.getContext){
                g=cv.getContext("2d"); g.clearRect(0,0,96,96);
                itIconDraw(g,o.ic,0,0,4,IWHITE);
            }
        }
        n=invCount(id);
        num=el.querySelector(".qnum");
        if(num) num.textContent=n;
        el.className="qcard"+(n?"":" qempty");
    }
}
/* ---- REGLAGE DES ZOMBIS (F2) ----
   Vie, vitesse de jour, vitesse de nuit, rayon d'ouie, rayon de vue et
   nombre. Rien n'ecoute ni ne voit encore : les deux rayons sont poses pour
   le comportement a venir, et se dessinent autour du zombi le plus proche
   pour qu'on juge de leur taille. */
var ZDBG={on:false};
var ZFLD=[
 {k:"hp",       n:"Vie",            min:20, max:600, step:5,  u:" pv"},
 {k:"spdDay",   n:"Vitesse jour",   min:0,  max:160, step:1,  u:" px/s"},
 {k:"spdNight", n:"Vitesse nuit",   min:0,  max:160, step:1,  u:" px/s"},
 {k:"hear",     n:"Finesse d'ouie", min:0,  max:300, step:5,  u:" %"},
 {k:"sight",    n:"Rayon de vue",   min:0,  max:900, step:1,  u:" px"},
 {k:"moan",     n:"Gemissement",    min:0,  max:900, step:5,  u:" px"},
 {k:"dmgMin",   n:"Morsure min",    min:0,  max:100, step:1,  u:" pv"},
 {k:"dmgMax",   n:"Morsure max",    min:0,  max:100, step:1,  u:" pv"},
 {k:"grp",      n:"Distance de bande", min:20, max:600, step:5, u:" px"},
 {k:"push",     n:"Poussee des corps", min:0, max:40,  step:1,  u:" px"},
 {k:"flowPc",   n:"Derive au courant", min:0, max:400, step:10, u:" %"},
 {k:"fallPc",   n:"Chute sur pente",   min:0, max:100, step:5,  u:" %"},
 {k:"labEvery", n:"Cadence de la source", min:2, max:120, step:1, u:" s"},
 /* labStop ne commande plus rien depuis le prologue : c'est PRO_ANNEAU
    qui decide quand la source se tait. Le curseur reste pour memoire. */
 {k:"labStop",  n:"Duree du laboratoire (sans effet)", min:0, max:3600, step:60, u:" s"},
 {k:"labWalk",  n:"Marche des nouveaux",  min:0, max:180, step:5, u:" s"},
 {k:"rise",     n:"Delai de releve",   min:5, max:600, step:5, u:" s"},
 {k:"cap",      n:"Plafond de zombis", min:10, max:600, step:10, u:""},
 {k:"n",        n:"Nombre",         min:0,  max:400, step:5,  u:""}
];
function zDbgText(){
    var t="REGLAGE DES ZOMBIS"+NL, i, f;
    for(i=0;i<ZFLD.length;i++){ f=ZFLD[i]; t+=f.n+" : "+ZCFG[f.k]+f.u+NL; }
    t+="traits : "+ZTRAIT.map(function(q){ return q.n+" (vie x"+q.hp+
        ", vitesse x"+q.spd+", endurance x"+q.sta+")"; }).join(", ");
    return t;
}
function zDbgNote(){
    var n=document.getElementById("znote");
    if(n) n.innerHTML="Le cone de vue et le rayon de gemissement se dessinent "+
        "autour du zombi le plus proche. La finesse d'ouie multiplie le rayon "+
        "de chaque bruit : un pas vaut 28 px, un sprint 56, une detonation le "+
        "rayon de sa munition. Changer le nombre demande de repeupler. "+
        "La source lache un zombi par cadence : le laboratoire pendant sa "+
        "duree, puis une couronne hors champ autour du joueur. Le plafond "+
        "arrete tout, source comme releve.";
    var o=document.getElementById("zout");
    if(o) o.value=zDbgText();
}
function zDbgFill(){
    var i, h="";
    for(i=0;i<ZFLD.length;i++){
        var f=ZFLD[i];
        h+="<div class='dbgsl'><label>"+f.n+"</label>"+
           "<button class='dbgpm' id='zm"+i+"'>-</button>"+
           "<input type='range' id='zf"+i+"' min='"+f.min+"' max='"+f.max+
           "' step='"+f.step+"' value='"+ZCFG[f.k]+"'>"+
           "<button class='dbgpm' id='zp"+i+"'>+</button>"+
           "<span id='zv"+i+"'>"+ZCFG[f.k]+f.u+"</span></div>";
    }
    document.getElementById("zsliders").innerHTML=h;
    for(i=0;i<ZFLD.length;i++)(function(k){
        function set(v){
            var f=ZFLD[k];
            v=Math.max(f.min,Math.min(f.max,Math.round(v)));
            ZCFG[f.k]=v;
            var el=document.getElementById("zf"+k); if(el) el.value=v;
            var sp=document.getElementById("zv"+k); if(sp) sp.textContent=v+f.u;
            zDbgNote();
        }
        var el=document.getElementById("zf"+k);
        if(el) el.oninput=function(){ set(parseFloat(this.value)); };
        var mn=document.getElementById("zm"+k);
        if(mn) mn.onclick=function(){ set(ZCFG[ZFLD[k].k]-1); sClick(); };
        var pl=document.getElementById("zp"+k);
        if(pl) pl.onclick=function(){ set(ZCFG[ZFLD[k].k]+1); sClick(); };
    })(i);
    zDbgNote();
}
function zDbgToggle(){
    ZDBG.on=!ZDBG.on;
    var el=document.getElementById("zdbg");
    if(el) el.style.display=ZDBG.on?"block":"none";
    if(ZDBG.on) zDbgFill();
}
/* le cone de vue et la portee du gemissement, autour du zombi le plus proche */
function zDbgDraw(cx,cy){
    if(!ZDBG.on||!G) return;
    var i, z, best=null, bd=1e9, d;
    for(i=0;i<ZOMBIES.length;i++){
        z=ZOMBIES[i];
        if(z.dead) continue;
        d=dist2(z.x,z.y,G.p.x,G.p.y);
        if(d<bd){ bd=d; best=z; }
    }
    if(!best) return;
    var sx=Math.round(best.x-cx), sy=Math.round(best.y-cy);
    ctx.lineWidth=1;
    ctx.strokeStyle="rgba(120,216,240,0.45)";
    ctx.beginPath(); ctx.arc(sx,sy,ZCFG.moan,0,6.283); ctx.stroke();
    ctx.strokeStyle="rgba(240,184,64,0.75)";
    ctx.fillStyle="rgba(240,184,64,0.10)";
    ctx.beginPath();
    ctx.moveTo(sx,sy);
    ctx.arc(sx,sy,ZCFG.sight,best.a-1.5708,best.a+1.5708);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
}
/* ---- CARTE ----
   Elle quitte le coin de l'ecran pour une fenetre au milieu, ouverte par [M],
   de la taille du panneau d'equipement. Le brouillard et les reperes restent
   ceux de l'ancienne minimap, simplement agrandis. */
var mapOpen=false;
/* ---- LE DESSIN DU PLAN ----
   Un schema, pas un lieu : cloisons, portes, fenetres, escalier, et les
   cases de chaque piece. Rien n'y est encore posable - on regarde. */
var PLANON=false, PLANFL=0, PLANRI=-1, PLANHIT=[];
/* Le pictogramme d'une amelioration : des rectangles, rien de plus. Un
   dessin lisible a douze pixels de cote ne peut pas etre autre chose. */
function planGlyph(g,k,cx,cy,s,c){
    function r(a,b,w,h){ g.fillStyle=c;
        g.fillRect(Math.round(cx+a*s),Math.round(cy+b*s),
                   Math.round(w*s),Math.round(h*s)); }
    if(k==="dortoir"){ r(-3,-2,6,4); r(-3,-2,6,1.2); }
    else if(k==="cuisine"){ r(-2.5,-1.5,5,3); r(2.5,-0.8,1.4,1); r(-3.9,-0.8,1.4,1); }
    else if(k==="infirmerie"){ r(-0.9,-3,1.8,6); r(-3,-0.9,6,1.8); }
    else if(k==="sport"){ r(-3.4,-1.6,1.3,3.2); r(3,-1.6,1.3,3.2); r(-2.4,-0.6,4.8,1.2); }
    else if(k==="biblio"){ r(-3,-2.6,1.4,5.2); r(-1.2,-2.6,1.4,5.2);
                           r(0.6,-2,1.4,4.6); r(2.4,-2.6,1.4,5.2); }
    else if(k==="armurerie"){ r(-3.6,-0.7,7,1.5); r(-1,0.5,1.2,2); r(2,-1.6,1.6,1); }
    else if(k==="atelier"){ r(-3,-2.6,2.6,2.6); r(-1.4,-1,3.6,1.3); r(1.4,0,1.6,2.6); }
    else if(k==="guet"){ r(-2.4,-3,1.2,6); r(1.2,-3,1.2,6);
                         r(-2.4,-1.8,4.8,0.9); r(-2.4,0.4,4.8,0.9); }
    else if(k==="reserve"){ r(-3,-2.4,6,4.8); r(-3,-0.5,6,1); r(-0.5,-2.4,1,4.8); }
}
/* Chez soi seulement : ailleurs le plan se regarde et ne se touche pas. */
function planEdit(){ return !!(BASE&&baseHere()&&G&&G.inside===BASE.b); }
function planFill(g,x,y,w,h,c){ g.fillStyle=c; g.fillRect(x|0,y|0,w|0,h|0); }
function planDraw(){
    var cv=document.getElementById("plancv");
    var b=G&&G.inside;
    if(!cv||!cv.getContext||!b) return;
    var g=cv.getContext("2d"), W=cv.width, H=cv.height;
    g.imageSmoothingEnabled=false;
    planFill(g,0,0,W,H,"#12100b");
    var PL=bldPlan(b), D=PL.def;
    if(PLANFL>=PL.et) PLANFL=PL.et-1;
    if(PLANFL<0) PLANFL=0;
    var F=PL.fl[PLANFL], i, q, r, k;
    var pad=44, S=Math.min((W-pad*2)/F.wm,(H-pad*2-14)/F.hm);
    var ox=Math.round((W-F.wm*S)/2), oy=Math.round((H-F.hm*S)/2)+8;
    function X(m){ return ox+m*S; }
    function Y(m){ return oy+m*S; }

    /* le mur porteur */
    planFill(g,X(0)-9,Y(0)-9,F.wm*S+18,F.hm*S+18,"#2a241a");
    planFill(g,X(0)-7,Y(0)-7,F.wm*S+14,F.hm*S+14,"#7e7566");
    planFill(g,X(0)-7,Y(0)-7,F.wm*S+14,3,"#a09684");
    planFill(g,X(0)-2,Y(0)-2,F.wm*S+4,F.hm*S+4,"#1a160f");

    /* le couloir */
    if(F.cor){
        r=F.cor;
        planFill(g,X(r.x),Y(r.y),r.w*S,r.h*S,"#4a4438");
        planFill(g,X(r.x),Y(r.y),r.w*S,2,"#5e5748");
    }
    /* les pieces, puis le reduit d'une halle par-dessus le volume */
    for(i=0;i<F.rooms.length;i++){
        r=F.rooms[i];
        planFill(g,X(r.x),Y(r.y),r.w*S,r.h*S,"#3e352a");
        planFill(g,X(r.x)+2,Y(r.y)+2,r.w*S-4,r.h*S-4,r.g?"#8a6f3e":"#6b5b42");
        planFill(g,X(r.x)+2,Y(r.y)+2,r.w*S-4,2,r.g?"#a88a52":"#7e6d50");
        if(r.creux) planFill(g,X(r.creux.x),Y(r.creux.y),
                             r.creux.w*S,r.creux.h*S,"#3e352a");
    }
    for(i=0;i<F.rooms.length;i++){
        r=F.rooms[i];
        if(!r.red) continue;
        planFill(g,X(r.x),Y(r.y),r.w*S,r.h*S,"#3e352a");
        planFill(g,X(r.x)+2,Y(r.y)+2,r.w*S-4,r.h*S-4,"#6b5b42");
        planFill(g,X(r.x)+2,Y(r.y)+2,r.w*S-4,2,"#7e6d50");
    }
    /* les portes : un trou dans la cloison plus un vantail, sans quoi on ne
       lit pas le sens */
    function porte(x,y,horiz,lg,c){
        if(horiz){ planFill(g,X(x),Y(y)-3,lg*S,6,c);
                   planFill(g,X(x),Y(y)-3,2,6,"#a89060"); }
        else     { planFill(g,X(x)-3,Y(y),6,lg*S,c);
                   planFill(g,X(x)-3,Y(y),6,2,"#a89060"); }
    }
    if(F.cor) for(i=0;i<F.rooms.length;i++){
        r=F.rooms[i];
        var c=F.cor;
        if(c.h>=c.w){
            if(Math.abs(r.x+r.w-c.x)<0.02) porte(c.x,r.y+r.h/2-0.45,0,0.9,"#6b5b42");
            else if(Math.abs(r.x-(c.x+c.w))<0.02) porte(c.x+c.w,r.y+r.h/2-0.45,0,0.9,"#6b5b42");
        } else {
            if(Math.abs(r.y+r.h-c.y)<0.02) porte(r.x+r.w/2-0.45,c.y,1,0.9,"#6b5b42");
            else if(Math.abs(r.y-(c.y+c.h))<0.02) porte(r.x+r.w/2-0.45,c.y+c.h,1,0.9,"#6b5b42");
        }
    }
    if(D.pl==="halle") for(i=0;i<F.rooms.length;i++){
        r=F.rooms[i];
        if(!r.red) continue;
        if(r.x<=0.02) porte(r.x+r.w,r.y+r.h/2-0.45,0,0.9,"#6b5b42");
        else porte(r.x,r.y+r.h/2-0.45,0,0.9,"#6b5b42");
    }
    /* les fenetres, selon le regime du lieu */
    function fen(x,y,horiz,lg,c){
        c=c||"#78c8e0";
        if(horiz){ planFill(g,X(x),Y(y)-6,lg*S,12,"#1a160f");
                   planFill(g,X(x),Y(y)-3,lg*S,6,c); }
        else     { planFill(g,X(x)-6,Y(y),12,lg*S,"#1a160f");
                   planFill(g,X(x)-3,Y(y),6,lg*S,c); }
    }
    if(D.fe==="nb"){
        for(k=1.2;k<F.wm-2.4;k+=3.5){ fen(k,0,1,1.2); fen(k,F.hm,1,1.2); }
        for(k=1.2;k<F.hm-2.4;k+=3.5){ fen(0,k,0,1.2); fen(F.wm,k,0,1.2); }
    } else if(D.fe==="vit"){
        fen(F.wm*0.14,F.hm,1,F.wm*0.72,"#a8e0f0");
        for(k=1.2;k<F.hm-2.4;k+=5.5){ fen(0,k,0,1.2); fen(F.wm,k,0,1.2); }
    } else if(D.fe==="rar"){
        fen(F.wm/2-0.6,0,1,1.2); fen(0,F.hm/2-0.6,0,1.2); fen(F.wm,F.hm/2-0.6,0,1.2);
    } else if(D.fe==="meur"){
        fen(F.wm/2-0.3,0,1,0.6,"#5a9ab0"); fen(F.wm,F.hm/2-0.3,0,0.6,"#5a9ab0");
    }
    /* une halle s'ouvre en grand, sur la largeur d'un camion */
    if(D.pl==="halle"){
        var bp=Math.min(6.5,F.wm*0.3);
        for(q=0;q<2;q++){
            var bx2=F.wm*(q?0.62:0.08);
            planFill(g,X(bx2)-3,Y(F.hm)-5,bp*S+6,20,"#1a160f");
            planFill(g,X(bx2),Y(F.hm)-3,bp*S,16,"#6e6252");
            for(k=0;k<7;k++) planFill(g,X(bx2)+3+k*((bp*S-6)/7),Y(F.hm)-1,2,12,"#3e352a");
        }
    } else if(PLANFL===0){
        var ex=F.cor&&F.cor.h>=F.cor.w?(F.cor.x+F.cor.w/2-0.9):(F.wm/2-0.9);
        planFill(g,X(ex)-2,Y(F.hm)-4,1.8*S+4,16,"#1a160f");
        planFill(g,X(ex),Y(F.hm)-2,1.8*S,12,"#8a6a3e");
        planFill(g,X(ex),Y(F.hm)+8,1.8*S,2,"#c8a860");
    }
    /* l'escalier */
    if(PL.et>1){
        var sx,sy,sw,sh;
        if(F.cor&&F.cor.h>=F.cor.w){ sx=F.cor.x+0.15; sy=F.hm-3.6; sw=PL_COR-0.3; sh=3.2; }
        else if(F.cor){ sx=F.wm-3.6; sy=F.cor.y+0.15; sw=3.2; sh=PL_COR-0.3; }
        else { sx=F.wm-3.4; sy=F.hm-3.4; sw=Math.min(3,F.wm*0.5); sh=Math.min(3,F.hm*0.5);
               sx=F.wm-sw-0.2; sy=F.hm-sh-0.2; }
        planFill(g,X(sx),Y(sy),sw*S,sh*S,"#2e2820");
        planFill(g,X(sx)+2,Y(sy)+2,sw*S-4,sh*S-4,"#8e8674");
        for(k=0;k<6;k++){
            if(sw>=sh) planFill(g,X(sx)+3+k*((sw*S-6)/6),Y(sy)+2,2,sh*S-4,"#4a4438");
            else       planFill(g,X(sx)+2,Y(sy)+3+k*((sh*S-6)/6),sw*S-4,2,"#4a4438");
        }
    }
    /* ---- LES CASES, ET CE QU'ON Y A POSE ----
       Chaque piece garde son rectangle dans PLANHIT : c'est ce qui rend le
       plan cliquable sans que le dessin ait a connaitre la souris. */
    g.font="bold 9px 'Courier New',monospace";
    PLANHIT=[];
    var edit=planEdit();
    for(i=0;i<F.rooms.length;i++){
        r=F.rooms[i];
        PLANHIT.push({ri:i,x:X(r.x),y:Y(r.y),w:r.w*S,h:r.h*S});
        var nc=r.cs;
        var cols=Math.max(1,Math.min(nc,Math.round(Math.sqrt(nc*r.w/Math.max(0.1,r.h)))));
        var rows=Math.ceil(nc/cols), cols2=cols, rows2=rows;
        if(r.creux){ cols2=cols+1; rows2=rows+2; }
        var cell=Math.max(7,Math.min((r.w*S-12)/cols2,(r.h*S-18)/rows2,22));
        var gw=cols2*cell+(cols2-1)*3, gh=rows2*cell+(rows2-1)*3;
        var gx=X(r.x)+(r.w*S-gw)/2, gy=Y(r.y)+(r.h*S-gh)/2+2;
        var pos=[], cc, rr2;
        for(rr2=0;rr2<rows2;rr2++) for(cc=0;cc<cols2;cc++){
            var qx=gx+cc*(cell+3), qy=gy+rr2*(cell+3);
            if(r.creux){
                var k8=r.creux;
                if(qx+cell>X(k8.x)-6&&qx<X(k8.x+k8.w)+6&&
                   qy+cell>Y(k8.y)-6&&qy<Y(k8.y+k8.h)+6) continue;
            }
            pos.push([qx,qy]);
        }
        /* ce qui occupe la piece prend les premieres cases, dans l'ordre */
        var occ=(BASE&&G&&G.inside===BASE.b)?roomBuilt(PLANFL,i):[], base=0, pj;
        var pris=0;
        for(pj=0;pj<occ.length;pj++) pris+=occ[pj].n;
        for(q=0;q<nc&&q<pos.length;q++){
            var busy=q<pris;
            planFill(g,pos[q][0],pos[q][1],cell,cell,busy?"#3a5c46":"#1c1810");
            var col=busy?"#8ad0a0":"#c8a860";
            planFill(g,pos[q][0],pos[q][1],cell,2,col);
            planFill(g,pos[q][0],pos[q][1]+cell-2,cell,2,col);
            planFill(g,pos[q][0],pos[q][1],2,cell,col);
            planFill(g,pos[q][0]+cell-2,pos[q][1],2,cell,col);
        }
        for(pj=0;pj<occ.length;pj++){
            var c0=Math.min(base,pos.length-1), c1=Math.min(base+occ[pj].n-1,pos.length-1);
            if(c0<0||!pos.length) break;
            planGlyph(g,occ[pj].k,(pos[c0][0]+pos[c1][0]+cell)/2,
                      (pos[c0][1]+pos[c1][1]+cell)/2,
                      Math.max(1.1,Math.min(2.4,cell/9)),
                      occ[pj].hs?"#c8604c":"#e8f4d8");
            base+=occ[pj].n;
        }
        /* le nom de ce qui est pose, sous la piece */
        if(occ.length){
            g.textAlign="center";
            for(pj=0;pj<occ.length;pj++){
                g.fillStyle=occ[pj].hs?"rgba(240,150,130,0.95)"
                                      :"rgba(190,240,200,0.9)";
                g.fillText(buildName(buildDef(occ[pj].k),occ[pj].n)+
                           " ("+occ[pj].n+")"+(occ[pj].hs?" H.S.":""),
                           X(r.x)+r.w*S/2,Y(r.y)+r.h*S-6-pj*10);
            }
            g.textAlign="left";
        }
        /* la piece choisie s'entoure d'or */
        if(edit&&PLANRI===i){
            planFill(g,X(r.x),Y(r.y),r.w*S,3,"#f0d890");
            planFill(g,X(r.x),Y(r.y)+r.h*S-3,r.w*S,3,"#f0d890");
            planFill(g,X(r.x),Y(r.y),3,r.h*S,"#f0d890");
            planFill(g,X(r.x)+r.w*S-3,Y(r.y),3,r.h*S,"#f0d890");
        }
        g.fillStyle=r.g?"rgba(255,232,180,0.55)":"rgba(232,216,176,0.40)";
        g.fillText(r.red?"reduit 1":((r.g?"G ":"p ")+
                   (pris?((nc-pris)+"/"+nc):nc)),X(r.x)+6,Y(r.y)+12);
    }
    /* le bandeau du haut */
    planFill(g,0,0,W,22,"rgba(20,17,11,0.94)");
    planFill(g,0,22,W,2,"#5a4326");
    g.font="bold 9px 'Courier New',monospace";
    g.fillStyle="#f0d890";
    g.fillText((bldLabel(b)||"ce batiment")+"  -  "+
        (PLANFL===0?"rez-de-chaussee":("etage "+PLANFL)),10,15);
    g.fillStyle="#9a8a62";
    g.textAlign="right";
    var tc=0;
    for(i=0;i<F.rooms.length;i++) tc+=F.rooms[i].cs;
    g.fillText(F.rooms.length+" piece"+(F.rooms.length>1?"s":"")+", "+
               tc+" case"+(tc>1?"s":""),W-10,15);
    g.textAlign="left";
}
function planNote(){
    var n=document.getElementById("plannote"), b=G&&G.inside;
    if(!n) return;
    if(!b){ n.textContent=""; return; }
    var PL=bldPlan(b);
    var t=Math.round(b.w/M)+" sur "+Math.round(b.h/M)+" metres, "+
        PL.et+" niveau"+(PL.et>1?"x":"")+", "+PL.cases+" case"+
        (PL.cases>1?"s":"")+" en tout"+
        (PL.et>1?" - fleches haut et bas pour changer d'etage.":".");
    if(planEdit()){
        var lib=PL.cases-builtCases();
        t+=" Chez vous : "+builtCases()+" case"+(builtCases()>1?"s":"")+
           " posee"+(builtCases()>1?"s":"")+", "+lib+" libre"+(lib>1?"s":"")+
           ". Vingt-cinq suffisent a tout b\u00e2tir au maximum.";
        if(PLANRI<0) t+=" Choisissez une piece.";
    } else t+=" Vous n'etes pas chez vous : le plan se regarde et rien de plus.";
    n.textContent=t;
}
/* ---- CE QU'ON PEUT POSER DANS LA PIECE CHOISIE ----
   Une ligne par amelioration. Celle qui est deja b\u00e2tie propose de se
   defaire ; celle qui ne tient pas se grise et dit pourquoi. La taille se
   choisit case par case : on ne pose pas une cantine sans le vouloir. */
function planList(){
    var el=document.getElementById("planbuild");
    if(!el) return;
    if(!planEdit()||PLANRI<0){ el.innerHTML=""; el.style.display="none"; return; }
    el.style.display="block";
    var libre=roomFree(PLANFL,PLANRI), cs=roomCases(PLANFL,PLANRI);
    var mat=baseStock().mat, h="", q, B, e, mx, n2, prix;
    h+="<div class='plhd'>Piece "+(PLANRI+1)+" - "+cs+" case"+(cs>1?"s":"")+
       ", "+libre+" libre"+(libre>1?"s":"")+" - "+Math.round(mat)+
       " de matiere en stock</div>";
    for(q=0;q<BUILDS.length;q++){
        B=BUILDS[q];
        e=BASE&&BASE.built&&BASE.built[B.k];
        if(e){
            var ou=(e.fl===PLANFL&&e.ri===PLANRI)?"ici":
                   ("etage "+(e.fl===0?"rez":e.fl)+", piece "+(e.ri+1));
            var fix=e.hs?Math.ceil(buildCost(B,e.n)/2):0;
            h+="<div class='plrow "+(e.hs?"plno":"plok")+"'><span class='pln'>"+
               buildName(B,e.n)+(e.hs?" - hors service":"")+
               "</span><span class='plc'>"+ou+"</span>"+
               (e.hs?("<button class='plb"+((fix>mat)?" plgris":"")+
                      "' data-fix='"+B.k+"' title=\"Elle occupe toujours ses "+
                      "cases et ne rend plus rien.\">reparer ("+fix+")</button>"):"")+
               "<button class='plb' data-take='"+B.k+"'>demonter</button></div>";
            continue;
        }
        mx=buildMax(B,libre);
        if(mx<B.mn){
            h+="<div class='plrow plno'><span class='pln'>"+B.n+
               "</span><span class='plc'>il faut "+B.mn+" case"+
               (B.mn>1?"s":"")+"</span></div>";
            continue;
        }
        h+="<div class='plrow'><span class='pln'>"+B.n+"</span>"+
           "<span class='plc'>"+B.mn+(B.mx?("-"+B.mx):" et plus")+" cases</span>";
        for(n2=B.mn;n2<=mx;n2++){
            prix=buildCost(B,n2);
            h+="<button class='plb"+((prix>mat)?" plgris":"")+
               "' data-put='"+B.k+"' data-n='"+n2+"' title=\""+
               (B.d||"").replace(/"/g,"'")+"\">"+n2+" ("+prix+")</button>";
        }
        h+="</div>";
    }
    el.innerHTML=h;
    var bs=el.querySelectorAll("button"), i;
    for(i=0;i<bs.length;i++)(function(bt){
        bt.onclick=function(){
            sClick();
            var kp=bt.getAttribute("data-put"), kt=bt.getAttribute("data-take");
            var kf=bt.getAttribute("data-fix");
            if(kf){ pushAct("brep",BUILDS.map(function(x){ return x.k; }).indexOf(kf)); return; }
            if(kt){ pushAct("bdown",BUILDS.map(function(x){ return x.k; }).indexOf(kt)); return; }
            if(kp) pushAct("bup",planCode(kp,parseInt(bt.getAttribute("data-n"),10)));
        };
    })(bs[i]);
}
/* Un geste tient dans un entier : l'amelioration, sa taille, l'etage et la
   piece. Sans cela le journal d'entrees ne saurait pas le rejouer. */
function planCode(k,n){
    var i=0, q;
    for(q=0;q<BUILDS.length;q++) if(BUILDS[q].k===k) i=q;
    return (i&15)|((n&15)<<4)|((PLANFL&15)<<8)|((PLANRI&15)<<12);
}
function planPut(a){
    var B=BUILDS[a&15];
    if(!B) return false;
    return buildPut(B.k,(a>>4)&15,(a>>8)&15,(a>>12)&15);
}
function planTake(a){
    var B=BUILDS[a];
    return B?buildTake(B.k):false;
}
function planRefresh(){ planDraw(); planNote(); planList(); }
function planToggle(){
    if(!G||!G.inside){ PLANON=false; }
    else PLANON=!PLANON;
    var el=document.getElementById("planpan");
    if(el) el.style.display=PLANON?"block":"none";
    if(PLANON){ PLANFL=0; PLANRI=-1; planRefresh(); }
}
function planFlip(d){
    var b=G&&G.inside;
    if(!PLANON||!b) return;
    var PL=bldPlan(b);
    PLANFL=Math.max(0,Math.min(PL.et-1,PLANFL+d));
    PLANRI=-1;
    planRefresh();
}
/* Choisir une piece : le meme clic la lache. */
function planPick(ri){
    if(!planEdit()) return;
    PLANRI=(PLANRI===ri)?-1:ri;
    planRefresh();
}
function planClose(){
    PLANON=false; PLANRI=-1;
    var el=document.getElementById("planpan");
    if(el) el.style.display="none";
}
/* Le clic sur la toile : on cherche le rectangle qui le contient. Les
   rectangles ont ete poses par le dessin, qui n'a pas a connaitre la
   souris. */
(function(){
    var cv=document.getElementById("plancv");
    if(!cv) return;
    cv.onclick=function(ev){
        if(!PLANON||!planEdit()) return;
        var b=cv.getBoundingClientRect();
        var x=(ev.clientX-b.left)*cv.width/b.width;
        var y=(ev.clientY-b.top)*cv.height/b.height, q;
        for(q=PLANHIT.length-1;q>=0;q--){
            var r=PLANHIT[q];
            if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h){
                sClick(); planPick(r.ri); return;
            }
        }
    };
})();
function mapToggle(){
    mapOpen=!mapOpen;
    var el=document.getElementById("mappan");
    if(el) el.style.display=mapOpen?"block":"none";
    if(mapOpen) mapDraw();
}
function mapDraw(){
    var cv2=document.getElementById("mapcv");
    if(!cv2||!cv2.getContext||!G) return;
    var g=cv2.getContext("2d"), S2=cv2.width, k=S2/CFG.WORLD, i;
    g.imageSmoothingEnabled=false;
    g.fillStyle="#0a0c10"; g.fillRect(0,0,S2,S2);
    g.drawImage(miniTerr,0,0,MMS,MMS,0,0,S2,S2);
    g.drawImage(fogCv,0,0,MMS,MMS,0,0,S2,S2);
    function mark(x,y,c,r){
        if(!fogSeen[((y/FOGC)|0)*FOGN+((x/FOGC)|0)]) return;
        g.fillStyle=c; g.fillRect(Math.round(x*k)-r,Math.round(y*k)-r,r*2+1,r*2+1);
    }
    for(i=0;i<VILLAGES.length;i++) mark(VILLAGES[i].well.x,VILLAGES[i].well.y,"#78d8f0",2);
    for(i=0;i<DUNGEONS.length;i++) mark(DUNGEONS[i].x,DUNGEONS[i].y,"#d8c090",3);
    for(i=0;i<EXITS.length;i++) mark(EXITS[i].x,EXITS[i].y,"#f0d890",2);
    for(i=0;i<FARMS.length;i++) mark(FARMS[i].x,FARMS[i].y,"#a8c878",2);
    g.strokeStyle="rgba(255,255,255,0.4)"; g.lineWidth=1;
    g.strokeRect(G.cam.x*k,G.cam.y*k,640*k,360*k);
    g.fillStyle="#ffffff";
    g.fillRect(Math.round(G.p.x*k)-2,Math.round(G.p.y*k)-2,5,5);
    var n=document.getElementById("mapnote");
    if(n) n.textContent="Vous etes a "+Math.round(G.p.x)+", "+Math.round(G.p.y)+
        ". Le cadre blanc montre ce que l'ecran couvre.";
}
function bagToggle(){
    if(!G) return;
    G.showBag=!G.showBag;
    if(!G.showBag) G.invNpc=null;
    ipanEl.style.display=G.showBag?"block":"none";
    if(G.showBag) bagFill();
}
/* Ouvrir les affaires de l'interlocuteur : meme panneau, contenu a lui. */
function bagShowNpc(){
    if(!G||!G.talk) return;
    G.invNpc=G.talk;
    G.showBag=true;
    ipanEl.style.display="block";
    /* ---- LE MEME PANNEAU, DEUX PORTES ----
       Devant un inconnu on regarde ses affaires et l'on troque. Devant l'un
       des siens, on ouvre la table a deux : c'est le seul endroit ou l'on
       fouille dans les poches de quelqu'un sans lui demander son avis, et
       c'est justement ce qui distingue un compagnon d'un passant. */
    var who=(G.talk.n||G.talk);
    if(who&&who.recruited&&grpJoinable(who)){
        G.eqn=who;
        bagTab(2);
        bagFill();
        return;
    }
    bagTab(0);
    bagFill();
}
/* ---- LE PORTILLON DES ONGLETS ----
   BASE et MISSIONS n'ont aucun sens tant que le pays tient : on ne s'installe
   nulle part et l'on n'envoie personne. Ils restaient pourtant cliquables et
   ne rendaient qu'une phrase d'excuse. Ils sont maintenant grises et sourds
   jusqu'a ce que baseCan() dise oui - le meme verrou que la touche [B], donc
   les deux ne peuvent pas se contredire. */
function tabOpen(k){
    /* BASE RESTE TOUJOURS OUVERT, MEME SANS BASE : c'est la qu'on lit son
       adresse et qu'on regarde la fleche du retour, et c'est justement quand
       on est perdu qu'on en a besoin. Le fermer aurait ferme la boussole.
       GROUPE se ferme tant que personne ne vous suit - et non sur baseCan,
       qui aurait verrouille l'onglet pendant la fenetre ou l'on recrute deja
       sans que le pays soit tombe de moitie : les affaires d'un compagnon
       s'ouvrent par cet onglet, et le geste serait mort avec lui.
       MISSIONS se ferme tant qu'on ne peut pas s'installer nulle part : on
       n'envoie personne de nulle part. */
    if(k===2) return grpList().length>0;
    if(k===4) return !!baseCan();
    return true;
}
function tabGate(){
    var q, el, L=[2,4], j;
    for(j=0;j<L.length;j++){
        q=L[j];
        el=document.getElementById("itb"+q);
        if(!el) continue;
        if(el.className.indexOf(" on")>=0) continue;
        el.className="itab"+(tabOpen(q)?"":" off");
    }
    /* L'ONGLET DE LA BASE PORTE "MA MAISON" TANT QU'ON N'A PAS D'AUTRE TOIT :
       la premiere base n'en est pas une, c'est le logement de depart. Il
       devient "BASE" des qu'on s'installe ailleurs. */
    var b3=document.getElementById("itb3");
    if(b3) b3.textContent=BASE?"BASE":"MA MAISON";
}

function bagTab(k){
    k=k|0;
    if(!tabOpen(k)) return;
    var q;
    for(q=0;q<5;q++){
        document.getElementById("itb"+q).className="itab"+(k===q?" on":"");
        document.getElementById("ipg"+q).style.display=(k===q)?"flex":"none";
    }
    if(k===2){ grpFill(); eqFill(); }
    if(k===3) baseFill();
    if(k===4) missFill();
    tabGate();
}
/* ---- L'ONGLET DES MISSIONS ----
   Une ligne par compagnon : soit cinq boutons pour l'envoyer, soit le compte
   a rebours de son absence. */
/* ---- LA FENETRE DE DEPART ----
   Rentrer chez soi dissout l'equipe : on ne commande plus personne. Pour
   ressortir, il faut dire avec qui - une, plusieurs, ou personne. Ceux qui
   sont en course ou trop mal en point ne peuvent pas etre du voyage. */
var DEPSEL=[];
function depOpen(){
    var el=document.getElementById("deppan");
    if(!el||!BASE) return;
    DEPSEL=[];
    el.style.display="block";
    depFill();
}
function depClose(){
    var el=document.getElementById("deppan");
    if(el) el.style.display="none";
    DEPSEL=[];
}
function depOn(){
    var el=document.getElementById("deppan");
    return !!(el&&el.style.display==="block");
}
function depFill(){
    var el=document.getElementById("deplist"), L=grpList(), h="", i, n, dispo, pres=0;
    if(!el) return;
    for(i=0;i<L.length;i++) if(!L[i].miss) pres++;
    if(!L.length) h="<div class='mnone'>Vous etes seul. Vous partirez seul.</div>";
    else if(pres>=1) h="<div class='dpnote'>Un compagnon au moins reste tenir la base : on ne les emmene pas tous.</div>";
    for(i=0;i<L.length;i++){
        n=L[i];
        /* seul l'absent est indisponible : il n'est pas la, c'est tout.
           L'etat des autres s'affiche, il n'interdit rien. */
        dispo=!n.miss;
        h+="<div class='dprow"+(dispo?(DEPSEL.indexOf(n)>=0?" on":""):" no")+
           "' data-i='"+i+"'>"+
           "<span class='dpn'>"+n.name+"</span>"+
           "<span class='dpi'>"+grpRank(n)+" - "+
           (n.miss?"en course, pas la":
            (Math.round(n.hp)+" / "+Math.round(n.maxhp)+" de vie"+
             ((n.hp<n.maxhp*0.5)?", mal en point":"")))+"</span></div>";
    }
    el.innerHTML=h;
    var rw=el.querySelectorAll(".dprow");
    for(i=0;i<rw.length;i++)
        (function(k){ rw[k].onclick=function(){
            var m=grpList()[k];
            if(!m||m.miss) return;
            sClick();
            var q=DEPSEL.indexOf(m);
            if(q>=0) DEPSEL.splice(q,1);
            else {
                /* On ne vide jamais la base de ses presents : au moins un
                   gardien reste. Le groupe reduit a une seule personne echappe
                   a la regle par la force des choses - il n'y a alors personne
                   d'autre a laisser. */
                var pr=0, j, LL=grpList();
                for(j=0;j<LL.length;j++) if(!LL[j].miss) pr++;
                if(pr>=1&&DEPSEL.length+1>=pr){ notice("UN GARDIEN RESTE"); return; }
                DEPSEL.push(m);
            }
            depFill();
        }; })(i);
}
function depGo(){
    /* Garde-fou : si la selection tenait malgre tout tous les presents, on en
       libere un pour que la base ne parte jamais sans gardien. */
    var LL=grpList(), pr=0, j;
    for(j=0;j<LL.length;j++) if(!LL[j].miss) pr++;
    if(pr>=1&&DEPSEL.length>=pr) DEPSEL.pop();
    var n=eqSet(DEPSEL);
    depClose();
    logMsg(n?("Vous sortez avec "+n+" compagnon"+(n>1?"s":"")+"."):
             "Vous sortez seul.","jsay");
    outKey(1);
}
function missFill(){
    var el=document.getElementById("mlist"), L=grpList(), h="", i, n, q;
    if(!el) return;
    if(!missOpen()){
        el.innerHTML="<div class='mnone'>Il faut un toit et "+MISS_MIN+
            " compagnons pour envoyer quelqu'un dehors.<br>"+
            (BASE?("Vous etes "+L.length+".")
                 :"Vous n'avez pas encore de base.")+"</div>";
        return;
    }
    /* Une seule fois en tete, plutot que sur chaque bouton grise : sans
       poste, aucun rappel n'est possible et il vaut mieux le lire que le
       deviner. */
    if(!baseRadio())
        h+="<div class='mnone'>Sans poste radio a la base, personne ne se "+
           "rappelle une fois parti.</div>";
    for(i=0;i<L.length;i++){
        n=L[i];
        h+="<div class='mrow'><span class='mnm'>"+n.name+"</span>";
        if(n.miss){
            var res=Math.max(0,MISS_DUR-n.miss.t);
            h+="<span class='mst'>parti chercher "+
               (missKind(n.miss.k)?missKind(n.miss.k).n.toLowerCase():"?")+
               " - "+Math.ceil(res)+" s"+
               (n.miss.mordu?", mordu":"")+
               (n.miss.rec?", rappele":"")+"</span>";
            if(!n.miss.rec){
                var joi=baseRadio()&&missRadio(n);
                h+="<button class='mgo mrec"+(joi?"":" mno")+"' data-r='"+i+
                   "'"+(joi?"":" disabled")+" title=\""+
                   (joi?"il a le talkie-walkie sur lui":
                        (baseRadio()?"sans talkie-walkie, on ne le joint pas":
                                     "il faut un poste radio a la base"))+
                   "\">Le rappeler</button>";
            }
        } else if(n.hp<n.maxhp*0.5){
            h+="<span class='mst'>trop mal en point pour partir seul</span>";
        } else {
            /* Ce qu'il emporte se voit avant de l'envoyer : sans cela on
               apprend qu'il partait nu en le voyant rentrer en sang. */
            var arm=missArm(n), ro=missRoom(n);
            h+="<span class='mst'>disponible - "+grpRank(n)+
               " - "+((arm>=1)?"arme":((arm>0)?"mal arme":"desarme"))+
               ", sac "+Math.round((1-ro)*100)+" pour cent plein"+
               (missRadio(n)?", joignable":", sans radio")+"</span>";
            for(q=0;q<MISS_KINDS.length;q++){
                /* On voit tout, on n'obtient pas tout : le bouton ferme dit
                   quel rang l'ouvre, pour que la montee ait un but visible. */
                var mok=missAllowed(n,MISS_KINDS[q]);
                h+="<button class='mgo"+(mok?"":" mno")+"' data-n='"+i+"' data-k='"+q+
                   "'"+(mok?"":" disabled")+" title=\""+
                   (mok?MISS_KINDS[q].d:
                        "demande d'etre son "+GRP_RANKS[MISS_KINDS[q].rk].n)+
                   "\">"+MISS_KINDS[q].n+"</button>";
            }
        }
        h+="</div>";
    }
    el.innerHTML=h;
    var bs=el.querySelectorAll(".mgo");
    for(i=0;i<bs.length;i++)
        (function(bt){ bt.onclick=function(){
            sClick();
            /* deux boutons dans la meme classe : celui qui porte data-r
               rappelle, les autres envoient */
            var r=bt.getAttribute("data-r");
            if(r!==null){ pushAct("mrec",parseInt(r,10)); return; }
            pushAct("miss",parseInt(bt.getAttribute("data-n"),10)*16+
                           parseInt(bt.getAttribute("data-k"),10));
        }; })(bs[i]);
}
/* ---- LA FICHE DE LA BASE ----
   La facade se decoupe dans le calque de monde : c'est le batiment lui-meme
   qu'on regarde, pas une vignette generique. Les quatre reserves se lisent
   sous elle, et les rayonnages a droite. */
/* ---- LE TOIT DE REFERENCE ----
   ON A UNE MAISON DES LA PREMIERE SECONDE, et c'est elle que le policier
   ordonne de rejoindre : G.p.homeB, la porte devant laquelle la partie
   commence. C'est aussi la premiere base, tant qu'on ne s'installe pas
   ailleurs. La fiche et la boussole regardent donc la base si elle existe,
   et la maison sinon - jamais rien d'autre, et jamais rien. */
function homeB(){
    if(BASE&&BASE.b) return BASE.b;
    return (G&&G.p&&G.p.homeB)||null;
}
/* ---- L'ADRESSE ----
   Un batiment a un nom - "Maison", "Grange" - qui ne dit pas OU il est. Quand
   le commissariat previent d'un assaut et qu'on est a l'autre bout du pays,
   ce qu'il faut savoir c'est le lieu-dit. On le retrouve en cherchant qui
   contient le batiment : d'abord les bourgs par leurs maisons, puis par leur
   enceinte, puis les fermes. Un batiment isole n'a pas d'adresse, et le dire
   est encore une information. */
function baseAddr(b){
    var i, q, v, f;
    if(!b) b=homeB();
    if(!b) return "";
    for(i=0;i<VILLAGES.length;i++){
        v=VILLAGES[i];
        for(q=0;q<v.houses.length;q++) if(v.houses[q]===b) return v.label||"";
    }
    for(i=0;i<VILLAGES.length;i++){
        v=VILLAGES[i];
        if(dist2(b.x+b.w/2,b.y+b.h/2,v.x,v.y)<v.r*v.r) return v.label||"";
    }
    for(i=0;i<FARMS.length;i++){
        f=FARMS[i];
        if(dist2(b.x+b.w/2,b.y+b.h/2,f.x,f.y)<200*200) return f.label||"";
    }
    return "En rase campagne";
}
/* ---- L'ECHELLE ----
   Le jeu comptait en pixels, ce qui ne dit rien a personne. L'etalon est LA
   TAILLE D'UN HOMME, la seule mesure que l'ecran donne vraiment : une
   silhouette fait seize pixels de haut a l'affichage, un homme fait un metre
   soixante-dix-huit, donc NEUF PIXELS PAR METRE. Le monde entier fait alors
   quatre cent vingt metres de cote et une maison dix de large, ce qui se
   tient. La vitesse de marche, elle, reste celle d'un jeu et non celle d'un
   homme : on ne peut pas avoir les deux, et c'est la distance qu'on affiche.
   Sous cent metres on donne le chiffre rond a cinq pres - une fleche n'a pas
   a etre precise au metre, et un nombre qui saute a chaque pas se lit mal. */
var PX_M=9;
function metres(px){
    var m=px/PX_M;
    /* a moins de trois metres on ne donne pas un chiffre : "0 m" se lisait
       comme une panne, alors qu'on a la main sur la poignee */
    if(m<3) return "a la porte";
    if(m<100) return (Math.round(m/5)*5)+" m";
    return (Math.round(m/10)*10)+" m";
}
/* ---- LA BOUSSOLE ----
   Chez soi on regarde sa maison ; dehors on regarde le chemin du retour. Le
   meme cadre sert aux deux, parce qu'on n'a jamais besoin des deux a la fois.
   Une fleche, la distance, et rien d'autre : ni carte, ni trace, ni point sur
   un plan - on saura vers ou marcher, pas par ou passer. */
function baseArrow(g,cv){
    var b=homeB(), p=G.p;
    if(!b) return;
    var tx=b.x+b.w/2, ty=b.y+b.h/2;
    var dx=tx-p.x, dy=ty-p.y;
    var d=Math.hypot(dx,dy)||1, a=Math.atan2(dy,dx);
    var cxx=cv.width/2, cyy=cv.height/2-14, R=62, q, ax, ay;
    g.strokeStyle="#5a4a34"; g.lineWidth=2;
    g.beginPath(); g.arc(cxx,cyy,R,0,6.2832); g.stroke();
    /* les quatre points cardinaux, pour que la fleche ait un repere */
    g.fillStyle="#6a5a42"; g.font="9px monospace"; g.textAlign="center";
    g.fillText("N",cxx,cyy-R+11); g.fillText("S",cxx,cyy+R-4);
    g.fillText("O",cxx-R+7,cyy+4); g.fillText("E",cxx+R-7,cyy+4);
    /* la fleche : une hampe et une pointe pleine */
    g.strokeStyle="#f0d890"; g.lineWidth=4; g.lineCap="round";
    g.beginPath();
    g.moveTo(cxx-Math.cos(a)*R*0.52,cyy-Math.sin(a)*R*0.52);
    g.lineTo(cxx+Math.cos(a)*R*0.38,cyy+Math.sin(a)*R*0.38);
    g.stroke();
    ax=cxx+Math.cos(a)*R*0.70; ay=cyy+Math.sin(a)*R*0.70;
    g.fillStyle="#f0d890";
    g.beginPath();
    g.moveTo(ax,ay);
    for(q=-1;q<=1;q+=2)
        g.lineTo(ax-Math.cos(a)*17-Math.sin(a)*10*q,
                 ay-Math.sin(a)*17+Math.cos(a)*10*q);
    g.closePath(); g.fill();
    g.fillStyle="#e8e2cc"; g.font="13px monospace";
    g.fillText(metres(d),cxx,cyy+R+22);
    g.fillStyle="#9a8a6a"; g.font="10px monospace";
    g.fillText((BASE&&BASE.b)?"vers votre base":"vers votre maison",
               cxx,cyy+R+37);
}
function baseFacade(){
    var cv=document.getElementById("bfacade");
    if(!cv||!cv.getContext) return;
    var g=cv.getContext("2d");
    g.clearRect(0,0,cv.width,cv.height);
    var b=homeB();
    if(!b) return;
    /* SANS BASE AUSSI LA FLECHE SERT, et c'est meme la qu'elle sert le plus :
       l'ordre de quarantaine dit de rentrer CHEZ SOI, et rien dans le jeu ne
       disait ou c'etait. On est chez soi quand on est dedans. */
    if(!(G.inside&&G.inside===b)){ baseArrow(g,cv); return; }
    var m=10;
    var sw=b.w+m*2, sh=b.h+44+m*2;
    var sc=Math.min(cv.width/sw,cv.height/sh);
    var ox=(cv.width-sw*sc)/2, oy=(cv.height-sh*sc)/2;
    g.imageSmoothingEnabled=false;
    g.drawImage(worldCv,b.x-m,b.y-44-m,sw,sh,ox,oy,sw*sc,sh*sc);
}
function baseFill(){
    var nm=document.getElementById("bnm"), rs=document.getElementById("bres");
    var gr=document.getElementById("bgrid"), hi=document.getElementById("bhint");
    if(!nm) return;
    baseFacade();
    var hb=homeB(), dedans=!!(hb&&G.inside&&G.inside===hb);
    var ttl0=document.getElementById("bttl");
    if(ttl0) ttl0.textContent=dedans?"Chez vous":"Le chemin du retour";
    if(!BASE){
        /* PAS DE BASE NE VEUT PAS DIRE PAS DE TOIT : on a sa maison des la
           premiere seconde, c'est elle que le policier ordonne de rejoindre,
           et c'est elle que la fleche montre. L'adresse d'abord. */
        var ah=baseAddr(hb);
        nm.innerHTML=hb
            ?((ah?("<b>"+ah+"</b><br>"):"")+(bldLabel(hb)||"Votre maison"))
            :"Aucun toit.";
        rs.innerHTML=(hb?"Votre maison, et votre premiere base. ":"")+
            (baseCan()
            ?"Entrez et pressez [B] pour vous y installer."
            :"Tant que le pays tient, personne ne s'installe ailleurs.");
        if(gr) gr.innerHTML="";
        if(hi) hi.textContent="";
        return;
    }
    var r=baseStock(), n=baseNeed(), plein=0, i;
    for(i=0;i<BASE.inv.length;i++) if(BASE.inv[i]) plein++;
    /* L'ADRESSE D'ABORD, LE NOM DU BATIMENT ENSUITE : "Village de Belmont" dit
       ou revenir, "Maison" ne dit rien. */
    var ad=baseAddr();
    nm.innerHTML=(ad?("<b>"+ad+"</b><br>"):"")+
        (bldLabel(BASE.b)||"Votre base")+"  -  "+plein+" / "+BASE.cap;

    var nm2=baseMedNeed(), tr=morTier();
    rs.innerHTML=
        "Moral <b>"+tr.n+"</b>"+
        ((tr.b!==0)?(" <span class='"+((tr.b<0)?"manque":"")+"'>("+
          ((tr.b>0)?"+":"")+Math.round(tr.b*100)+" pour cent)</span>"):"")+"<br>"+
        "Vivres <b>"+r.viv+"</b> ration"+(r.viv>1?"s":"")+
        " <span"+((r.viv<n)?" class='manque'":"")+">(il en faut "+n+" par jour)</span><br>"+
        "Soins <b>"+r.med+"</b> piece"+(r.med>1?"s":"")+
        " <span"+((r.med<nm2)?" class='manque'":"")+">(il en faut "+nm2+
        " par jour)</span><br>"+
        "Munitions <b>"+r.mun+"</b> cartouches<br>"+
        "Materiaux <b>"+Math.round(r.mat)+"</b> de matiere premiere"+
        ((maintCost()>0)
          ?(" <span"+((r.mat<maintCost())?" class='manque'":"")+
            ">(il en faut "+maintCost()+" par jour d'entretien)</span>"):"")+"<br>"+
        "Bouches a nourrir <b>"+n+"</b>, dont <b>"+nm2+"</b> a soigner<br>"+
        "Couchages <b>"+baseBeds()+"</b>"+
        (((grpList().length+1)>baseBeds())
          ?(" <span class='manque'>("+((grpList().length+1)-baseBeds())+
            " dorment a meme le sol)</span>"):"")+"<br>"+
        "Cases posees <b>"+builtCases()+"</b> sur <b>"+
        (BASE.b?bldPlan(BASE.b).cases:0)+"</b>, dont <b>"+maintCases()+
        "</b> a entretenir"+
        (maintDead().length
          ?(" <span class='manque'>("+maintDead().length+
            " hors service)</span>"):"");
    /* ---- CE QUI EST BATI ----
       On ne b\u00e2tit plus d'ici : une amelioration occupe une piece precise, et
       une piece se designe sur le plan. La liste dit ce qu'on a et ou. */
    var bh="", q, B, e, tot=BASE.b?bldPlan(BASE.b).cases:0;
    for(q=0;q<BUILDS.length;q++){
        B=BUILDS[q];
        e=BASE.built&&BASE.built[B.k];
        bh+="<div class='brow"+(e?(e.hs?"":" bok"):"")+"' title=\""+
            B.d.replace(/"/g,"'")+"\">"+
            "<span class='bn'>"+(e?(buildName(B,e.n)+(e.hs?" - hors service":"")):B.n)+"</span>"+
            "<span class='bc'>"+(e?(e.n+" case"+(e.n>1?"s":"")+", "+
                (e.fl===0?"rez":("etage "+e.fl))+", piece "+(e.ri+1))
              :("a b\u00e2tir - "+B.mn+(B.mx?("-"+B.mx):"+")+" cases"))+
            "</span></div>";
    }
    var bl=document.getElementById("blist");
    if(bl) bl.innerHTML=bh;
    /* ---- LA JAUGE ----
       Le bruit qu'on fait, et ce qu'il finit par attirer. Elle ne se vide
       qu'en debordant. */
    var jg=document.getElementById("bjauge");
    if(jg){
        var pc=Math.max(0,Math.min(100,Math.round(BASE.jauge||0)));
        var etat, cls;
        if(BASE.assaut>0){ etat="LA HORDE EST LA"; cls="jred"; pc=100; }
        else if(BASE.alerte>0){
            etat="ASSAUT DANS "+Math.ceil(BASE.alerte)+" SECONDES"; cls="jred"; pc=100;
        } else {
            etat=(pc<50)?"rien de particulier"
                :((pc<80)?"des choses rodent"
                :"la base s'entend de trop loin");
            cls=(pc<50)?"":((pc<80)?"jamb":"jred");
        }
        jg.innerHTML="<div class='jlab'>Ce qu'on attire <b>"+etat+"</b></div>"+
            "<div class='jbar'><i class='"+cls+"' style='width:"+pc+"%'></i></div>"+
            "<div class='jsub'>Bruit "+Math.round(baseNoise())+" par tour - "+
            builtCases()+" case"+(builtCases()>1?"s":"")+", "+baseHeads()+
            " personne"+(baseHeads()>1?"s":"")+" sur place</div>";
    }
    if(hi) hi.textContent=baseHere()
        ?"Cliquez une case pour la reprendre. On ne b\u00e2tit pas d'ici : [M] "+
         "ouvre le plan, ou l'on choisit une piece et ce qu'on y installe."
        :"Vous n'etes pas sur place : on ne range rien a distance.";
    /* les rayonnages */
    var h="", c, o;
    for(i=0;i<BASE.inv.length;i++){
        c=BASE.inv[i]; o=cellObj(c);
        h+="<div class='slot"+(o?" ifull":"")+"' data-c='"+i+"'>";
        if(o) h+="<canvas class='iic' width='96' height='96'></canvas>"+
                 ((c.q>1&&!cellIsW(c))?("<span class='iq'>"+c.q+"</span>"):"");
        h+="</div>";
    }
    gr.innerHTML=h;
    var cs=gr.querySelectorAll(".slot");
    for(i=0;i<cs.length;i++){
        c=BASE.inv[i]; o=cellObj(c);
        if(o){
            var cvv=cs[i].querySelector("canvas");
            if(cvv&&cvv.getContext){
                var g2=cvv.getContext("2d");
                g2.clearRect(0,0,96,96);
                if(cellIsW(c)) iconDraw(g2,o,0,27,0.5,IWHITE);
                else itIconDraw(g2,o.ic,0,0,4,IWHITE);
            }
            cs[i].title=o.n+((c.q>1&&!cellIsW(c))?(" x"+c.q):"");
        }
        (function(k2,ob){ cs[k2].onclick=function(){
            if(!ob||!baseHere()) return;
            pushAct("btake",k2);
        }; })(i,o);
    }
}
/* ---- LA FICHE DU GROUPE ----
   Une ligne par compagnon : son nom, son metier, son rang, et ce qui le
   separe du suivant. Le survol dit le reste - ses quatre competences, sa
   specialite, sa vie, et ce qu'il porte. */
/* ---- LE NUANCIER ----
   La couleur se choisit ici et nulle part ailleurs : c'est l'ecran ou l'on
   regarde les siens, donc celui ou l'on decide de quoi ils auront l'air. Le
   changement passe par le journal d'entrees comme le reste, et refait les
   silhouettes marquees dans la foulee. */
function clanSwatches(){
    var h="<div class='clanrow'><span class='clanlbl'>Couleur du clan</span>", q;
    for(q=0;q<CLANCOL.length;q++)
        h+="<span class='clansw"+((G&&G.clan===q)?" on":"")+"' data-cl='"+q+
           "' title=\""+CLANCOL[q].n+"\" style=\"background:"+CLANCOL[q].c+"\"></span>";
    return h+"<span class='clannm'>"+((G&&CLANCOL[G.clan||0])?CLANCOL[G.clan||0].n:"")+
           "</span></div>";
}
function clanWire(el){
    var sw=el.querySelectorAll(".clansw"), q;
    for(q=0;q<sw.length;q++)(function(e2){
        e2.onclick=function(){ sClick(); pushAct("clan",parseInt(e2.getAttribute("data-cl"),10)); };
    })(sw[q]);
}
function grpFill(){
    var el=document.getElementById("grplist"), L=grpList(), h="", i, n, nx, q;
    if(!el) return;
    h+=clanSwatches();
    if(!L.length){
        el.innerHTML=h+"<div class='gnone'>Personne ne vous suit.<br>"+
            "Tant que le pays tient, chacun a une vie a defendre. "+
            "Quand la peur sera venue, on vous suivra.</div>";
        clanWire(el);
        return;
    }
    for(i=0;i<L.length;i++){
        n=L[i]; nx=grpNext(n);
        var pc=nx?Math.round(100*((n.aff||0)-rankFloor(n))/
                              Math.max(1,nx.s-rankFloor(n))):100;
        /* ce qu'il porte, pour l'infobulle */
        var sac=[], c, o;
        if(n.inv) for(q=0;q<n.inv.length;q++){
            c=n.inv[q]; o=cellObj(c);
            if(o) sac.push(o.n+((c.q>1&&!cellIsW(c))?(" x"+c.q):""));
        }
        /* Le rang ne se lit plus comme un titre honorifique : on dit dans la
           foulee ce qu'il ouvre, sinon le joueur ne sait pas pourquoi il
           passe du temps avec quelqu'un. */
        var mq, mlist=[];
        for(mq=MISS_KINDS.length-1;mq>=0;mq--)
            if(missAllowed(n,MISS_KINDS[mq]))
                mlist.push(MISS_KINDS[mq].n.replace(/^Des? /,"").toLowerCase());
        var t=n.name+" - "+jobName(n.job||"habitant")+"\n"+
              "Cardio "+Math.round(n.stats.cardio)+
              "  Astuce "+Math.round(n.stats.astuce)+
              "  Combat "+Math.round(n.stats.combat)+
              "  Tir "+Math.round(n.stats.tir)+"\n"+
              "Specialite : "+(n.spec||"-")+" ("+Math.round(n.sec[n.spec]||0)+
              ", plafond 100)\n"+
              "Vie "+Math.round(n.hp)+" / "+Math.round(n.maxhp)+"\n"+
              "Peut aller chercher : "+(mlist.length?mlist.join(", "):"rien")+"\n"+
              "Sac : "+(sac.length?sac.join(", "):"rien");
        h+="<div class='grow"+((G&&G.eqn===n)?" gon":"")+
           "' data-g='"+i+"' title=\""+t.replace(/"/g,"'")+"\">"+
           "<span class='gnm'>"+n.name+"</span>"+
           "<span class='gjb'>"+jobName(n.job||"habitant")+"</span>"+
           "<span class='grk'>"+grpRank(n)+"</span>"+
           "<span class='gbar'><i style='width:"+Math.max(0,Math.min(100,pc))+
           "%'></i></span>"+
           "<span class='gst'>"+(nx?("vers "+nx.n):"au sommet")+"</span>"+
           "</div>";
    }
    el.innerHTML=h;
    clanWire(el);
    /* chaque ligne ouvre la table a deux sur celui qu'on a choisi */
    var rows=el.querySelectorAll(".grow"), q2;
    for(q2=0;q2<rows.length;q2++)(function(e2){
        e2.onclick=function(){
            sClick();
            eqOpen(L[parseInt(e2.getAttribute("data-g"),10)]);
        };
    })(rows[q2]);
}
/* ================= LA TABLE A DEUX =================
   A gauche la liste du groupe, a droite les affaires de celui qu'on a
   choisi. Ses deux sacs sont la meme grille que partout ailleurs, et le
   clic y est le meme geste : un des notres ne marchande pas, la case passe.
   Ce qui lui appartient en propre, c'est ce qui n'a pas d'equivalent
   ailleurs - ses quatre armes, ses quatre pieces de tenue, son sac, qu'on
   lui retire d'un clic. */
function eqPaint(el,c){
    var o=cellObj(c), cv=el.querySelector("canvas"), g;
    if(!o||!cv||!cv.getContext) return;
    g=cv.getContext("2d");
    g.clearRect(0,0,96,96);
    if(cellIsW(c)) iconDraw(g,o,0,27,0.5,IWHITE);
    else itIconDraw(g,o.ic,0,0,4,IWHITE);
    el.title=o.n+(cellIsW(c)?(" - "+o.fam):(" - "+itemLine(o)));
}
function eqFill(){
    var col=document.getElementById("eqcol"), pan=document.getElementById("eqpan");
    var ttl=document.getElementById("eqtitle"), n=eqCol();
    if(!col||!pan) return;
    if(!n||n.dead||!grpJoinable(n)){ col.style.display="none"; if(G) G.eqn=null; return; }
    col.style.display="flex";
    ownFit(n);
    if(ttl) ttl.textContent=n.name+" - "+jobName(n.job||"habitant");
    var h="", i, c, d, src=xchgSrc(n)||[];
    /* ---- SES ARMES ---- */
    h+="<div class='eqsub'>Ses armes</div><div class='eqrow'>";
    for(i=0;i<4;i++){
        c=(n.slots&&n.slots[i])?{w:WEAPONS.indexOf(n.slots[i]),q:1}:null;
        h+="<div class='slot"+(c?" ifull":"")+"' data-sw='"+i+"' data-l='"+
           SLOTN[i].substr(0,6)+"'>"+
           (c?"<canvas class='iic' width='96' height='96'></canvas>":"")+"</div>";
    }
    h+="</div>";
    /* ---- SA TENUE ---- */
    h+="<div class='eqsub'>Sa tenue</div><div class='eqrow'>";
    for(i=0;i<4;i++){
        d=vetAt(n,i);
        h+="<div class='slot"+(d?" ifull":"")+"' data-sv='"+i+"' data-l='"+
           VETSLOT[i]+"'>"+
           (d?"<canvas class='iic' width='96' height='96'></canvas>":"")+"</div>";
    }
    h+="</div>";
    /* ---- SON SAC ---- */
    d=ownBag(n);
    h+="<div class='eqsub'>Son sac - <span data-sb='1' class='eqlink'>"+
       (d?d.n:"aucun")+"</span></div><div class='gridbag' id='eqbag'></div>";
    var pw=ownWeight(n), pc=ownCarry(n), sm=Math.round(ownSpeedMul(n)*100);
    h+="<div class='inote'>"+ownFree(n)+"/"+n.inv.length+" cases libres, "+
       pw.toFixed(2)+"/"+pc.toFixed(1)+" kg"+
       ((sm>=100)?"":(" - "+sm+" pour cent d'allure"))+"</div>";
    /* ---- LA SOURCE D'EN FACE ---- */
    h+="<div class='eqsub'>"+xchgSrcName(n)+
       "</div><div class='gridbag' id='eqsrc'></div>";
    h+="<div class='inote' id='eqnote'></div>";
    pan.innerHTML=h;
    /* les deux sacs sont la grille commune, et le clic y est le geste unique */
    cellGrid("eqbag",n.inv,-1,false,function(k,al){ pushAct("troc",(al?8192:0)|(k&4095)); });
    cellGrid("eqsrc",src,-1,false,function(k,al){ pushAct("troc",(al?8192:0)|4096|(k&4095)); });
    var nte=document.getElementById("eqnote");
    if(nte) nte.textContent=xchgNote(n);
    /* ---- ON REBRANCHE ---- */
    function wire(sel,attr,fn){
        var L=pan.querySelectorAll(sel), q;
        for(q=0;q<L.length;q++)(function(el2){
            el2.onclick=function(){
                sClick();
                fn(parseInt(el2.getAttribute(attr),10));
            };
        })(L[q]);
    }
    var L2=pan.querySelectorAll("[data-sw]"), q2;
    for(q2=0;q2<L2.length;q2++){
        i=parseInt(L2[q2].getAttribute("data-sw"),10);
        if(n.slots&&n.slots[i]){
            eqPaint(L2[q2],{w:WEAPONS.indexOf(n.slots[i]),q:1});
            /* ce qu'il a dedans et ce qui lui reste : sans cela on arme
               quelqu'un sans savoir s'il a de quoi tirer */
            var wa=n.slots[i];
            if(wa.am) L2[q2].title=L2[q2].title+" - chargeur "+
                (n.mag?(n.mag[i]|0):0)+"/"+(wa.mag||1)+", reserve "+
                ammoStock(n,wa.am)+" cartouche"+((ammoStock(n,wa.am)>1)?"s":"");
        }
        else L2[q2].title="Emplacement "+SLOTN[i].toLowerCase()+" - vide";
    }
    L2=pan.querySelectorAll("[data-sv]");
    for(q2=0;q2<L2.length;q2++){
        i=parseInt(L2[q2].getAttribute("data-sv"),10);
        d=vetAt(n,i);
        if(d){ eqPaint(L2[q2],{i:d.id,q:1}); L2[q2].title=d.n+" - "+vetLine(d); }
        else L2[q2].title="Emplacement "+VETSLOT[i].toLowerCase()+" - vide";
    }
    wire("[data-sw]","data-sw",function(k){ pushAct("eqw",k); });
    wire("[data-sv]","data-sv",function(k){ pushAct("eqv",k); });
    wire("[data-sb]","data-sb",function(){ pushAct("eqb",0); });
    /* les pieces d'equipement peuvent changer l'allure : on rafraichit les
       silhouettes (pantin, fiche, inventaire) sans attendre une reouverture */
    drawPortraits();
}
/* Choisir de qui l'on s'occupe. Le meme clic ferme la table.
   ELLE OUVRE LA TABLE A DEUX plutot que d'echanger dans sa colonne : la
   colonne reste ce qu'elle etait - la fiche, les emplacements, les poids -
   mais l'echange se fait a un seul endroit dans tout le jeu. */
function eqOpen(n){
    if(!G) return;
    G.eqn=(G.eqn===n)?null:n;
    xchgReset();
    grpFill(); eqFill();
    if(G.eqn) tradeOpen(G.eqn);
}
function rankFloor(n){
    var s=(n&&n.aff)||0, f=0, i;
    for(i=0;i<GRP_RANKS.length;i++) if(s>=GRP_RANKS[i].s) f=GRP_RANKS[i].s;
    return f;
}
/* ---- ON N'ENGENDRE PLUS RIEN AVANT QU'ON L'AIT DEMANDE ----
   La carte se fabriquait au lancement de la page, avant meme que le menu ne
   paraisse, PUIS UNE SECONDE FOIS quand on cliquait sur NOUVELLE PARTIE :
   startRun rappelait newGame. Le premier pays etait donc engendre pour rien,
   et l'ecran de coupures qu'on lisait pendant ce temps illustrait une carte
   que personne ne verrait jamais. Trois fonctions au lieu d'une :

   boot()      pose l'ecran et s'arrete la ;
   startRun()  est ce que fait le bouton - chargement puis generation ;
   enterPlay() est ce qui suit le chargement, et n'engendre rien.

   La generation reste derriere deux requestAnimationFrame : la premiere
   laisse l'ecran de chargement se peindre, la seconde laisse le navigateur
   respirer avant de partir pour une seconde de calcul synchrone. */
function startRun(){
    showLoading();
    requestAnimationFrame(function(){
        requestAnimationFrame(function(){
            /* UN MONDE NEUF A CHAQUE PARTIE. Sans cela, relancer depuis le menu
               rejouait la meme graine - donc le meme bourg et le meme
               personnage. Le rejeu d'un journal, lui, passe par jplay qui
               restaure la graine enregistree : il n'est pas concerne. */
            setSeeds(randSeed(),randSeed());
            newGame();
            resize(); setTimeout(resize,50);
            var msg=document.getElementById("cutmsg");
            if(msg&&!loadHold) msg.textContent="Le pays est pret.";
            loadTimer=setInterval(loadTick,120);
            loadTick();
        });
    });
}
function enterPlay(){
    pnameEl.textContent=G.p.name||"Heros";
    G.showBag=false; G.invNpc=null; ipanEl.style.display="none"; bagTab(0);
    lootClose();
    tradeClose();
    planClose();
    bagFill();
    screenEl.style.display="none";
    state="play"; sClick();
}
function endGame(win){
    if(state==="dead"||state==="win") return;
    state=win?"win":"dead";
    var t=Math.floor(G.t);
    addScore((G.p&&G.p.name)||"Heros",G.day,t);
    screenEl.style.display="flex";
    screenEl.innerHTML="<div id='panel'>"+
        "<h1>"+(win?"VICTOIRE":"MORT")+"</h1>"+
        "<div class='sub'>"+esc((G.p&&G.p.name)||"Heros")+"</div>"+
        "<div id='stats'>Jours tenus : "+G.day+
        "<br>Temps total : "+pad(Math.floor(t/60))+":"+pad(t%60)+"</div>"+
        "<button class='big' id='go'>REJOUER</button>"+
        "<br><button id='sco' style='font-family:inherit;font-size:12px;background:none;border:none;"+
        "color:#7a5c2e;cursor:pointer;margin-top:8px;text-decoration:underline;'>voir les scores</button>"+
        "<br><button id='back' style='font-family:inherit;font-size:12px;background:none;border:none;"+
        "color:#7a5c2e;cursor:pointer;margin-top:8px;text-decoration:underline;'>retour au menu</button></div>";
    document.getElementById("go").onclick=startRun;
    document.getElementById("sco").onclick=function(){ audio(); showScores(); };
    document.getElementById("back").onclick=showMenu;
}


