"use strict";
/* ================================================================
   TUAZ - 04-genmap.js
   genMap : la generation complete de la carte, puis les requetes de
   terrain (collision, mer, pentes, herbes, courants, ligne de vue).
   (lignes 3561 a 5958 du mono-fichier d'origine)
   ================================================================ */
function genMap(){
    var Math=DMATH;
    var R=mulberry32(MAPSEED), i, j, x, y, sp;
    if(!BUDGET) BUDGET=rollBudget(BUDGET_SEED);
    FSFAIL=0; FLDFAIL=0;
    function Rr(a,b){ return a+R()*(b-a); }
    function Ri(a,b){ return (Rr(a,b+1))|0; }
    /* profil de cote : trois houles par bord, amplitude totale +/- 105 px */
    COAST=[];
    for(var ci0=0;ci0<4;ci0++) COAST.push({
        a1:Rr(38,64), k1:Rr(1.6,3.2)*6.283/CFG.WORLD, p1:Rr(0,6.283),
        a2:Rr(16,30), k2:Rr(4.5,8.0)*6.283/CFG.WORLD, p2:Rr(0,6.283),
        a3:Rr(6,13),  k3:Rr(11,19)*6.283/CFG.WORLD,  p3:Rr(0,6.283)
    });
    var SPOTS=[];
    /* emplacements reserves : fermes, chateau, casernes, hopital, hangars.
       Declares tot : l'eau, generee avant eux, consulte deja ces listes. */
    var FSPOT=[], ASPOT=[], PSPOT=[], HSPOT=[], GSPOT=[], DSPOT=null;
    var RELAX_R=[1,0.8,0.62,0.45], RELAX_C=[1,0.7,0.42,0];
    /* ne rend jamais null : le quota prime sur la qualite du placement.
       4 passes de contraintes relachees, puis placement force. */
    /* wayD : si fourni, le lieu doit rester a portee du reseau (fermes) */
    function freeSpot(rad,minC,tries,wayD,dry){
        var pass, k, s, sx, sy, ok, rd, mc, nw, nt=(tries||80);
        for(pass=0;pass<4;pass++){
            rd=rad*RELAX_R[pass]; mc=minC*RELAX_C[pass];
            /* la bande de mer est exclue : rien ne se batit sur l'eau */
            var lo=Math.max(rd+40,CFG.SEA_BAND+rd*0.55), hi=CFG.WORLD-lo;
            for(k=0;k<nt;k++){
                sx=Rr(lo,hi); sy=Rr(lo,hi); ok=true;
                if(!farFromCenter(sx,sy,mc)) continue;
                if(pass<3&&onRoad(sx,sy,rd*0.55)) continue;
                if(pass<3&&wayD){ nw=nearestWay(sx,sy);
                    if(nw&&nw.d>wayD*wayD*(1+pass*0.5)) continue; }
                if(dry&&wetDisc(sx,sy,rd*0.62)) continue;
                for(s=0;s<SPOTS.length;s++)
                    if(dist2(sx,sy,SPOTS[s].x,SPOTS[s].y)<(rd+SPOTS[s].r)*(rd+SPOTS[s].r)){ ok=false; break; }
                if(ok){ SPOTS.push({x:sx,y:sy,r:rd}); return {x:sx,y:sy}; }
            }
        }
        FSFAIL++;
        var lo2=Math.max(rad+40,CFG.SEA_BAND+rad*0.55), hi2=CFG.WORLD-lo2;
        sx=Rr(lo2,hi2); sy=Rr(lo2,hi2);
        SPOTS.push({x:sx,y:sy,r:rad*0.35});
        return {x:sx,y:sy};
    }
    /* Rien ne se pose sur une voie, et les cailloux se tiennent hors des
       villages et des fermes : leurs emprises sont reservees des le depart. */
    function inBuiltZone(x,y,m){
        var q;
        for(q=0;q<VSPOT.length;q++)
            if(dist2(x,y,VSPOT[q].x,VSPOT[q].y)<(VSPOT[q].r+55+m)*(VSPOT[q].r+55+m)) return true;
        for(q=0;q<FSPOT.length;q++)
            if(dist2(x,y,FSPOT[q].x,FSPOT[q].y)<(255+m)*(255+m)) return true;
        if(DSPOT&&dist2(x,y,DSPOT.x,DSPOT.y)<(215+m)*(215+m)) return true;
        for(q=0;q<ASPOT.length;q++)
            if(dist2(x,y,ASPOT[q].x,ASPOT[q].y)<(200+m)*(200+m)) return true;
        for(q=0;q<HSPOT.length;q++)
            if(dist2(x,y,HSPOT[q].x,HSPOT[q].y)<(160+m)*(160+m)) return true;
        for(q=0;q<PSPOT.length;q++)
            if(dist2(x,y,PSPOT[q].x,PSPOT[q].y)<(140+m)*(140+m)) return true;
        for(q=0;q<GSPOT.length;q++)
            if(dist2(x,y,GSPOT[q].x,GSPOT[q].y)<(140+m)*(140+m)) return true;
        return false;
    }
    function tree(x,y){
        if(onRoad(x,y,10)) return;
        /* un arbre sur dix seulement abrite une nichee */
        var c={x:x,y:y,r:7,tree:true,nest:(R()<0.1)}; OC.push(c); regObst(c,false);
        TREES.push({x:x,y:y,s:(R()*3)|0});
    }
    function wall(rx,ry,rw,rh){ var o={x:rx,y:ry,w:rw,h:rh}; ORECT.push(o); regObst(o,true); }
    function rock(rx,ry,rr2){
        if(onRoad(rx,ry,rr2+5)||inBuiltZone(rx,ry,rr2)) return;
        var c={x:rx,y:ry,r:rr2}; OC.push(c); regObst(c,false);
        ROCKS.push({x:rx,y:ry,r:rr2,s:(R()*3)|0,t:R()});
    }
    /* massif rocheux : anneau de blocs avec un couloir laisse ouvert.
       Les sources de riviere sont generees avant les voies : leurs blocs sont
       mis en attente et poses une fois le reseau trace, pour pouvoir l'eviter. */
    var DEFROCK=[];
    function massif(mx,my,rmin,rmax,nb,gap,defer){
        var open=R()*6.28;
        for(var q=0;q<nb;q++){
            var qa=R()*6.28;
            if(gap>0&&Math.abs(((qa-open+9.42)%6.28)-3.14)>3.14-gap) continue;
            var qd=rmin+(rmax-rmin)*Math.sqrt(R());
            var rx2=mx+Math.cos(qa)*qd, ry2=my+Math.sin(qa)*qd, rr4=7+R()*11;
            if(defer) DEFROCK.push({x:rx2,y:ry2,r:rr4});
            else rock(rx2,ry2,rr4);
        }
        return open;
    }
    /* ---- EMPLACEMENTS DES VILLAGES ----
       Ils sont reserves en premier : le reseau routier se construit ensuite
       pour les relier, et les maisons se posent enfin le long des routes. */
    var PENDTREE=[];
    var VSPOT=[];
    for(i=0;i<BUDGET.villages;i++){
        /* le rayon suit le nombre de batiments : un gros bourg prend ses aises */
        var vr2=100+Math.sqrt(BUDGET.houses[i])*64;
        var vsp=freeSpot(vr2+60,460,60);
        vsp.r=vr2; VSPOT.push(vsp);
    }

    /* ---- COLLINES ----
       Un plateau cerne d'une pente. Le contour est module par deux houles
       pour qu'aucune ne soit un disque parfait. */
    for(i=0;i<BUDGET.hills;i++){
        var hrt=Rr(180,265), hsl=Rr(95,150);
        sp=freeSpot(hrt+hsl+60,760,90);
        if(!sp) continue;
        HILLS.push({x:sp.x,y:sp.y,rTop:hrt,rBase:hrt+hsl,
            a1:Rr(0.07,0.13), p1:Rr(0,6.283),
            a2:Rr(0.03,0.07), p2:Rr(0,6.283),
            sun:Rr(0,6.283)});
    }
    /* etang de plateau */
    for(i=0;i<HILLS.length;i++){
        if(!BUDGET.hillPond[i]) continue;
        var hp=HILLS[i], pa3=Rr(0,6.283), pd3=Rr(0,hp.rTop*0.5), pr3=Rr(38,64);
        var pblob=[], pz;
        for(pz=0;pz<5;pz++) pblob.push({
            x:hp.x+Math.cos(pa3)*pd3+Rr(-pr3*0.5,pr3*0.5),
            y:hp.y+Math.sin(pa3)*pd3+Rr(-pr3*0.5,pr3*0.5),
            r:pr3*Rr(0.6,0.95)});
        pblob.water=true; SWAMPS.push(pblob);
        hp.pond={x:hp.x+Math.cos(pa3)*pd3,y:hp.y+Math.sin(pa3)*pd3,r:pr3};
    }
    /* ---- LA RIVIERE DE LA COLLINE ----
       Elle nait sur la pente et gagne la mer par le plus long chemin
       possible : on vise la cote la plus eloignee de la colline. */
    for(i=0;i<HILLS.length;i++){
        var hh2=HILLS[i], W3=CFG.WORLD;
        var edges=[{x:20,y:hh2.y},{x:W3-20,y:hh2.y},{x:hh2.x,y:20},{x:hh2.x,y:W3-20}];
        var far=edges[0], fd2=0, ez;
        for(ez=0;ez<4;ez++){ var dd3=dist2(hh2.x,hh2.y,edges[ez].x,edges[ez].y);
            if(dd3>fd2){ fd2=dd3; far=edges[ez]; } }
        var tang=datan2(far.y-hh2.y,far.x-hh2.x);
        var rang=tang+Rr(-0.5,0.5);
        var rx3=hh2.x+Math.cos(rang)*hh2.rTop*0.9, ry3=hh2.y+Math.sin(rang)*hh2.rTop*0.9;
        var flow=[], rb3=Rr(15,21), st3, guard=0;
        for(st3=0;st3<620;st3++){
            flow.push({x:rx3,y:ry3,r:rb3+Math.sin(st3*0.11)*3});
            /* meandre libre, mais toujours ramene vers la cible */
            var cur=datan2(Math.sin(rang),Math.cos(rang));
            rang=cur+Rr(-0.19,0.19);
            var want=datan2(far.y-ry3,far.x-rx3);
            var diff=((want-rang+9.4248)%6.2832)-3.1416;
            rang+=diff*0.11;
            if(inBuiltZone(rx3+Math.cos(rang)*24,ry3+Math.sin(rang)*24,rb3+16)){
                for(guard=1;guard<=7;guard++){
                    if(!inBuiltZone(rx3+Math.cos(rang+guard*0.4)*24,ry3+Math.sin(rang+guard*0.4)*24,rb3+16)){
                        rang+=guard*0.4; break; }
                    if(!inBuiltZone(rx3+Math.cos(rang-guard*0.4)*24,ry3+Math.sin(rang-guard*0.4)*24,rb3+16)){
                        rang-=guard*0.4; break; }
                }
            }
            rx3+=Math.cos(rang)*11; ry3+=Math.sin(rang)*11;
            rb3=Math.min(30,rb3+0.022);
            if(inSea(rx3,ry3)){ flow.push({x:rx3,y:ry3,r:rb3+4}); break; }
            if(rx3<10||ry3<10||rx3>W3-10||ry3>W3-10) break;
        }
        flow.water=true; flow.flow=true; SWAMPS.push(flow);
        hh2.river=flow.length;
    }
    /* ruisseaux : nait dans un massif rocheux, meurt dans un etang */
    for(i=0;i<BUDGET.rivers;i++){
        var sx=Rr(300,CFG.WORLD-300), sy=Rr(300,CFG.WORLD-300);
        var ang=Rr(0,6.28), seg=(18+((R()*14)|0))*3, rb=Rr(14,19), ph=Rr(0,6.28);
        var stream=[]; stream.water=true; stream.flow=true;
        /* source : chaos rocheux et vasque */
        massif(sx,sy,26,74,26,0.55,true);
        stream.push({x:sx,y:sy,r:rb+7});
        stream.push({x:sx,y:sy,r:rb+3});
        for(j=0;j<seg;j++){
            stream.push({x:sx,y:sy,r:rb+Math.sin(ph+j*0.12)*3});
            ang+=Rr(-0.16,0.16)+Math.sin(j*0.07)*0.06;
            /* le ruisseau contourne les emprises baties : on cherche un cap
               libre de part et d'autre plutot que de traverser un village */
            if(inBuiltZone(sx+Math.cos(ang)*22,sy+Math.sin(ang)*22,rb+14)){
                var turn=0, found=false, tk;
                for(tk=1;tk<=7&&!found;tk++){
                    for(turn=-1;turn<=1&&!found;turn+=2){
                        var ta2=ang+turn*tk*0.42;
                        if(!inBuiltZone(sx+Math.cos(ta2)*22,sy+Math.sin(ta2)*22,rb+14)){
                            ang=ta2; found=true;
                        }
                    }
                }
            }
            sx+=Math.cos(ang)*10; sy+=Math.sin(ang)*10;
            if(sx<160||sx>CFG.WORLD-160){ ang=Math.PI-ang; sx=clamp(sx,160,CFG.WORLD-160); }
            if(sy<160||sy>CFG.WORLD-160){ ang=-ang; sy=clamp(sy,160,CFG.WORLD-160); }
        }
        /* embouchure : etang large et irregulier, jamais sur une emprise batie */
        var pr=Rr(56,84);
        for(var mk2=0;mk2<14&&inBuiltZone(sx,sy,pr*1.5);mk2++){
            var ma2=Rr(0,6.28);
            sx=clamp(sx+Math.cos(ma2)*70,180,CFG.WORLD-180);
            sy=clamp(sy+Math.sin(ma2)*70,180,CFG.WORLD-180);
        }
        for(j=0;j<7;j++){
            var pa=R()*6.28, pd=R()*pr*0.55;
            stream.push({x:sx+Math.cos(pa)*pd,y:sy+Math.sin(pa)*pd,r:pr*(0.55+R()*0.4)});
        }
        PONDS.push({x:sx,y:sy,r:pr});
        SWAMPS.push(stream);
    }
    /* lacs isoles */
    var hutN=0;
    for(i=0;i<BUDGET.lakes;i++){
        sp=freeSpot(178,280,110); if(!sp) continue;
        var lake=[]; lake.water=true;
        var lr=Rr(72,112);
        if(hutN<BUDGET.huts) lr=Math.max(lr,90);
        for(j=0;j<9;j++){
            var la2=R()*6.28, ld=R()*lr*0.5;
            lake.push({x:sp.x+Math.cos(la2)*ld,y:sp.y+Math.sin(la2)*ld,r:lr*(0.55+R()*0.42)});
        }
        PONDS.push({x:sp.x,y:sp.y,r:lr});
        SWAMPS.push(lake);
        /* lac assez grand : cabane de pecheur sur la berge */
        if(hutN<BUDGET.huts){ hutN++;
            var ha2=R()*6.28;
            var hbx=sp.x+Math.cos(ha2)*(lr+52)-20, hby=sp.y+Math.sin(ha2)*(lr+52)-16;
            hbx=clamp(hbx,60,CFG.WORLD-100); hby=clamp(hby,60,CFG.WORLD-90);
            HUTS.push({x:hbx,y:hby});
            wall(hbx,hby,40,30);
            /* le pecheur se poste au bord de l'eau */
            var fpx=sp.x+Math.cos(ha2)*(lr*0.94), fpy=sp.y+Math.sin(ha2)*(lr*0.94);
            FISHERS.push({x:fpx,y:fpy,hx:fpx,hy:fpy,
                dx:hbx+20,dy:hby+30,lx:sp.x,ly:sp.y,
                hidden:false,face:(sp.x<fpx)?-1:1,anim:0,wt:0,rod:R()*6.28,bob:R()*6.28});
        }
    }
    /* berges : roseaux, herbes hautes, nenuphares + grenouilles */
    PONDS.forEach(function(pn){
        var nr=26+((R()*22)|0), q;
        for(q=0;q<nr;q++){
            var ra2=R()*6.28, rd2=pn.r*(0.82+R()*0.3);
            REEDS.push({x:pn.x+Math.cos(ra2)*rd2,y:pn.y+Math.sin(ra2)*rd2,
                h:9+((R()*13)|0),k:R()<0.55?0:1,ph:R()*6.28});
        }
        var nl=5+((R()*7)|0);
        for(q=0;q<nl;q++){
            var la3=R()*6.28, ld3=pn.r*0.62*Math.sqrt(R());
            LILIES.push({x:pn.x+Math.cos(la3)*ld3,y:pn.y+Math.sin(la3)*ld3,
                r:5+((R()*4)|0),fl:R()<0.35});
        }
        var nf=2+((R()*3)|0);
        for(q=0;q<nf;q++){
            var fgx=pn.x+Rr(-pn.r*0.5,pn.r*0.5), fgy=pn.y+Rr(-pn.r*0.5,pn.r*0.5), fgw=R()*2;
            FROGS.push({x:fgx,y:fgy,hx:fgx,hy:fgy,hw:fgw,
                px:pn.x,py:pn.y,pr:pn.r*0.72,tx:pn.x,ty:pn.y,wt:fgw,face:1,hop:0});
        }
    });
    /* ---- HERBES HAUTES ----
       Nappes libres, hors bourgs et hors eau : elles cachent le bas du corps
       et freinent d'un cinquieme. */
    for(i=0;i<BUDGET.grass;i++){
        var gsp=freeSpot(120,220,60,0,true);
        if(!gsp) continue;
        var gblob=[], gn=3+((R()*5)|0), gz;
        for(gz=0;gz<gn;gz++) gblob.push({
            x:gsp.x+Rr(-70,70), y:gsp.y+Rr(-70,70), r:Rr(40,88)});
        GRASS.push(gblob);
    }
    /* on donne a chaque tache son ondulation, puis sa boite englobante */
    function blobify(b){
        for(var q=0;q<b.length;q++){
            b[q].a1=Rr(0.09,0.17); b[q].p1=Rr(0,6.283);
            b[q].a2=Rr(0.04,0.09); b[q].p2=Rr(0,6.283);
        }
    }
    function bbox(b){
        b.x0=1e9; b.y0=1e9; b.x1=-1e9; b.y1=-1e9;
        for(var q=0;q<b.length;q++){ var rr5=b[q].r*1.2;
            if(b[q].x-rr5<b.x0) b.x0=b[q].x-rr5;
            if(b[q].x+rr5>b.x1) b.x1=b[q].x+rr5;
            if(b[q].y-rr5<b.y0) b.y0=b[q].y-rr5;
            if(b[q].y+rr5>b.y1) b.y1=b[q].y+rr5;
        }
    }
    for(i=0;i<GRASS.length;i++){ blobify(GRASS[i]); bbox(GRASS[i]); }
    /* ondulation, boite englobante, et sens du courant pour les rivieres */
    for(i=0;i<SWAMPS.length;i++){ var bb=SWAMPS[i];
        blobify(bb); bbox(bb);
        if(!bb.flow) continue;
        for(j=0;j<bb.length;j++){
            var pv2=bb[Math.max(0,j-1)], nx2=bb[Math.min(bb.length-1,j+1)];
            var vx2=nx2.x-pv2.x, vy2=nx2.y-pv2.y, vl2=Math.hypot(vx2,vy2)||1;
            bb[j].fx=vx2/vl2; bb[j].fy=vy2/vl2;
        }
    }
    /* ---- GEOMETRIE DES VOIES ----
       Une liaison droite fait faux : on la casse par deplacement du milieu,
       trois fois de suite, en s'ecartant perpendiculairement a la corde. */
    function wavyPts(x1,y1,x2,y2,amp,dep){
        var pts=[{x:x1,y:y1},{x:x2,y:y2}], lvl,k,out2,p1,p2,dx,dy,l,o;
        for(lvl=0;lvl<(dep||4);lvl++){
            out2=[pts[0]];
            for(k=0;k<pts.length-1;k++){
                p1=pts[k]; p2=pts[k+1];
                dx=p2.x-p1.x; dy=p2.y-p1.y; l=Math.hypot(dx,dy)||1;
                o=Rr(-1,1)*amp*dpow(0.52,lvl)*Math.min(1,l/260);
                out2.push({x:clamp((p1.x+p2.x)/2-dy/l*o,50,CFG.WORLD-50),
                           y:clamp((p1.y+p2.y)/2+dx/l*o,50,CFG.WORLD-50)});
                out2.push(p2);
            }
            pts=out2;
        }
        return pts;
    }
    /* Une voie touche-t-elle ce rectangle ? On echantillonne les segments dont
       la boite englobante recoupe le rectangle elargi : c'est exact a 4 px. */
    function wayHitsRect(rx,ry,rw,rh,m){
        var lists=[ROADS,PATHS], li, q, o, hw, ax0, ay0, ax1, ay1, dx, dy, l, n, z, t, px, py;
        for(li=0;li<2;li++) for(q=0;q<lists[li].length;q++){
            o=lists[li][q]; hw=o.w/2+m;
            ax0=rx-hw; ay0=ry-hw; ax1=rx+rw+hw; ay1=ry+rh+hw;
            if(Math.max(o.x1,o.x2)<ax0||Math.min(o.x1,o.x2)>ax1) continue;
            if(Math.max(o.y1,o.y2)<ay0||Math.min(o.y1,o.y2)>ay1) continue;
            dx=o.x2-o.x1; dy=o.y2-o.y1; l=Math.hypot(dx,dy);
            n=Math.max(1,Math.ceil(l/4));
            for(z=0;z<=n;z++){ t=z/n;
                px=o.x1+dx*t; py=o.y1+dy*t;
                if(px>ax0&&px<ax1&&py>ay0&&py<ay1) return true;
            }
        }
        return false;
    }
    /* Une polyligne trop tourmentee finit par revenir se coller a elle-meme :
       on voit alors deux chaussees paralleles a quelques metres l'une de
       l'autre. deloop() coupe court : des qu'un point plus loin sur le trace
       repasse a moins de d du point courant alors que le chemin parcouru pour
       y arriver est bien plus long, on saute directement dessus. Les deux
       brins n'en font plus qu'un. */
    function deloop(pts,d){
        if(pts.length<6) return pts;
        var acc=[0], q, out=[], i, j, arc, dd2;
        for(q=1;q<pts.length;q++)
            acc.push(acc[q-1]+Math.hypot(pts[q].x-pts[q-1].x,pts[q].y-pts[q-1].y));
        i=0;
        while(i<pts.length){
            out.push(pts[i]);
            var jump=-1;
            for(j=pts.length-1;j>=i+4;j--){
                dd2=Math.hypot(pts[j].x-pts[i].x,pts[j].y-pts[i].y);
                if(dd2>d) continue;
                arc=acc[j]-acc[i];
                if(arc>dd2*2.2+80){ jump=j; break; }
            }
            if(jump>0) i=jump; else i++;
        }
        return out.length>1?out:pts;
    }
    function pushWay(list,pts,w){
        WAYID++;
        for(var k=0;k<pts.length-1;k++)
            list.push({x1:pts[k].x,y1:pts[k].y,x2:pts[k+1].x,y2:pts[k+1].y,w:w,id:WAYID});
    }
    /* lampadaires tous les 190 px le long d'une voie, alternes de part et d'autre */
    function lampWay(pts){
        var acc=0, next=110, side=1, k, dx, dy, l, t, px, py;
        for(k=0;k<pts.length-1;k++){
            dx=pts[k+1].x-pts[k].x; dy=pts[k+1].y-pts[k].y;
            l=Math.hypot(dx,dy); if(l<0.01) continue;
            while(acc+l>=next){
                t=(next-acc)/l;
                px=pts[k].x+dx*t; py=pts[k].y+dy*t;
                TORCHES.push({x:px-dy/l*(ROAD_W/2+7)*side, y:py+dx/l*(ROAD_W/2+7)*side,
                              ph:R()*6, st:true});
                next+=190; side=-side;
            }
            acc+=l;
        }
    }
    /* ---- RESEAU ROUTIER ----
       Arbre couvrant minimal entre villages (Prim), plus quelques liaisons
       courtes en supplement qui creent les croisements. L'ensemble est ensuite
       decoupe en routes : une route est une suite de villages, et un village
       n'est traverse que par une seule d'entre elles, les autres s'y arretent. */
    /* Les deux bouts d'une route quittent la carte : la chaussee file jusqu'au
       cadre, franchit l'ocean sur un pont et s'acheve sur un point de passage. */
    function edgeExit(pts,head){
        var W2=CFG.WORLD, mrg=12;
        var a=head?pts[0]:pts[pts.length-1];
        var b=head?pts[Math.min(4,pts.length-1)]:pts[Math.max(0,pts.length-5)];
        var dx=a.x-b.x, dy=a.y-b.y, l=Math.hypot(dx,dy), t=1e9;
        if(l<1){ dx=a.x-W2/2; dy=a.y-W2/2; l=Math.hypot(dx,dy)||1; }
        dx/=l; dy/=l;
        if(dx> 0.002) t=Math.min(t,(W2-mrg-a.x)/dx);
        if(dx<-0.002) t=Math.min(t,(mrg-a.x)/dx);
        if(dy> 0.002) t=Math.min(t,(W2-mrg-a.y)/dy);
        if(dy<-0.002) t=Math.min(t,(mrg-a.y)/dy);
        if(!(t>140&&t<W2*1.6)) return;
        var ex=a.x+dx*t, ey=a.y+dy*t;
        var seg=deloop(wavyPts(a.x,a.y,ex,ey,Math.min(150,t*0.10)),PARA_D);
        if(wetJunction(seg)) return;
        pushWay(ROADS,seg,ROAD_W);
        lampWay(seg);
        EXITS.push({x:ex-dx*22,y:ey-dy*22,ax:dx,ay:dy});
    }
    function roadNet(){
        var n=VSPOT.length, a, b, e, k;
        if(n<2) return;
        function vd2(p,q){ return dist2(VSPOT[p].x,VSPOT[p].y,VSPOT[q].x,VSPOT[q].y); }
        /* --- Prim --- */
        var inT=[0], out=[], best, dd;
        for(a=1;a<n;a++) out.push(a);
        while(out.length){
            best=null;
            for(a=0;a<inT.length;a++) for(b=0;b<out.length;b++){
                dd=vd2(inT[a],out[b]);
                if(!best||dd<best.d) best={i:inT[a],j:out[b],d:dd,k:b};
            }
            ROADLINKS.push([best.i,best.j]);
            inT.push(best.j); out.splice(best.k,1);
        }
        /* --- liaisons en plus : les paires non reliees les plus courtes --- */
        var pool=[], has;
        for(a=0;a<n;a++) for(b=a+1;b<n;b++){
            has=false;
            for(e=0;e<ROADLINKS.length;e++)
                if((ROADLINKS[e][0]===a&&ROADLINKS[e][1]===b)||
                   (ROADLINKS[e][0]===b&&ROADLINKS[e][1]===a)) has=true;
            if(!has) pool.push({a:a,b:b,d:vd2(a,b)});
        }
        pool.sort(function(p,q){ return p.d-q.d; });
        for(a=0;a<Math.min(BUDGET.roadExtra,pool.length);a++)
            ROADLINKS.push([pool[a].a,pool[a].b]);
        /* --- decoupage en chaines --- */
        var used=[], thru=[], adj=[], chains=[];
        for(a=0;a<n;a++){ adj.push([]); thru.push(false); }
        for(e=0;e<ROADLINKS.length;e++){ used.push(false);
            adj[ROADLINKS[e][0]].push(e); adj[ROADLINKS[e][1]].push(e); }
        function other(ed,v){ return ROADLINKS[ed][0]===v?ROADLINKS[ed][1]:ROADLINKS[ed][0]; }
        function freeEdge(v,chain){
            for(var q=0;q<adj[v].length;q++){
                var ed=adj[v][q];
                if(used[ed]) continue;
                if(chain.indexOf(other(ed,v))>=0) continue;
                return ed;
            }
            return -1;
        }
        for(e=0;e<ROADLINKS.length;e++){
            if(used[e]) continue;
            var chain=[ROADLINKS[e][0],ROADLINKS[e][1]];
            used[e]=true;
            var grow=true, side, endi, ne;
            while(grow){
                grow=false;
                for(side=0;side<2;side++){
                    endi=side?chain[chain.length-1]:chain[0];
                    if(thru[endi]) continue;
                    ne=freeEdge(endi,chain);
                    if(ne<0) continue;
                    used[ne]=true; thru[endi]=true;
                    if(side) chain.push(other(ne,endi)); else chain.unshift(other(ne,endi));
                    grow=true;
                }
            }
            chains.push(chain);
        }
        /* --- une seule route par village ---
           Les chaines sont examinees de la plus longue a la plus courte. La
           premiere qui ne touche aucun village deja desservi devient une route
           goudronnee ; toutes les autres se rabattent en chemin de terre. */
        function chainPts(ch,amp){
            var pts=[], A, B, seg, q;
            for(q=0;q<ch.length-1;q++){
                A=VSPOT[ch[q]]; B=VSPOT[ch[q+1]];
                seg=wavyPts(A.x,A.y,B.x,B.y,
                    Math.min(300,Math.hypot(B.x-A.x,B.y-A.y)*amp));
                pts=pts.concat(q?seg.slice(1):seg);
            }
            return pts;
        }
        function chainLen(ch){
            var l2=0,q;
            for(q=0;q<ch.length-1;q++)
                l2+=Math.hypot(VSPOT[ch[q+1]].x-VSPOT[ch[q]].x,VSPOT[ch[q+1]].y-VSPOT[ch[q]].y);
            return l2;
        }
        /* Deux chaussees ne se longent pas : si une chaine suit de trop pres
           une route deja tracee, sur plus de la moitie de sa longueur et dans
           la meme direction, elle ne devient pas une seconde route. Elle se
           rabat en chemin de terre : il ne reste qu'une voie dans le couloir. */
        function runsAlong(pts){
            var tot=0, dup=0, q, dx, dy, l, mx, my, ux, uy, z, o, odx, ody, ol, cs;
            for(q=0;q<pts.length-1;q++){
                dx=pts[q+1].x-pts[q].x; dy=pts[q+1].y-pts[q].y;
                l=Math.hypot(dx,dy); if(l<0.01) continue;
                tot+=l;
                mx=(pts[q].x+pts[q+1].x)/2; my=(pts[q].y+pts[q+1].y)/2;
                ux=dx/l; uy=dy/l;
                for(z=0;z<ROADS.length;z++){ o=ROADS[z];
                    if(segD2(mx,my,o.x1,o.y1,o.x2,o.y2)>PARA_D*PARA_D) continue;
                    odx=o.x2-o.x1; ody=o.y2-o.y1; ol=Math.hypot(odx,ody)||1;
                    cs=(ux*odx+uy*ody)/ol;
                    if(cs>0.93||cs<-0.93){ dup+=l; break; }
                }
            }
            return tot>0.01&&dup/tot>0.5;
        }
        chains.sort(function(p,q){ return chainLen(q)-chainLen(p); });
        var served=[];
        for(a=0;a<n;a++) served.push(false);
        for(a=0;a<chains.length;a++){
            var ch2=chains[a], free=true, q2;
            for(q2=0;q2<ch2.length;q2++) if(served[ch2[q2]]) free=false;
            if(free){
                var pts=deloop(chainPts(ch2,0.24),PARA_D);
                if(runsAlong(pts)){
                    if(!wetJunction(pts)) pushWay(PATHS,pts,PATH_W);
                    continue;
                }
                for(q2=0;q2<ch2.length;q2++) served[ch2[q2]]=true;
                pushWay(ROADS,pts,ROAD_W);
                lampWay(pts);
                edgeExit(pts,true); edgeExit(pts,false);
            } else {
                /* chaine rabattue en chemin : refusee si elle croiserait une
                   voie au-dessus de l'eau */
                var dpts=chainPts(ch2,0.20);
                if(!wetJunction(dpts)) pushWay(PATHS,dpts,PATH_W);
            }
        }
    }
    roadNet();
    /* ---- CHEMINS DE TERRE ENTRE VILLAGES PROCHES ----
       Deux villages voisins que le reseau n'a pas relies gardent un sentier. */
    for(i=0;i<VSPOT.length;i++) for(j=i+1;j<VSPOT.length;j++){
        var lk=false, li;
        for(li=0;li<ROADLINKS.length;li++)
            if((ROADLINKS[li][0]===i&&ROADLINKS[li][1]===j)||
               (ROADLINKS[li][0]===j&&ROADLINKS[li][1]===i)) lk=true;
        if(lk) continue;
        var vdd=Math.hypot(VSPOT[j].x-VSPOT[i].x,VSPOT[j].y-VSPOT[i].y);
        if(vdd>1300) continue;
        var vpts=wavyPts(VSPOT[i].x,VSPOT[i].y,VSPOT[j].x,VSPOT[j].y,Math.min(200,vdd*0.2));
        if(!wetJunction(vpts)) pushWay(PATHS,vpts,PATH_W);
    }
    /* point le plus proche du reseau ou d'un village, pour y raccorder une ferme */
    function nearestWay(px,py){
        var best=null, q, o, dx, dy, l2, t, cxp, cyp, d;
        for(q=0;q<ROADS.length;q++){ o=ROADS[q];
            dx=o.x2-o.x1; dy=o.y2-o.y1; l2=dx*dx+dy*dy;
            t=l2<0.0001?0:((px-o.x1)*dx+(py-o.y1)*dy)/l2;
            t=t<0?0:(t>1?1:t);
            cxp=o.x1+dx*t; cyp=o.y1+dy*t;
            d=dist2(px,py,cxp,cyp);
            if(!best||d<best.d) best={x:cxp,y:cyp,d:d};
        }
        for(q=0;q<VSPOT.length;q++){
            d=dist2(px,py,VSPOT[q].x,VSPOT[q].y);
            if(!best||d<best.d) best={x:VSPOT[q].x,y:VSPOT[q].y,d:d};
        }
        return best;
    }
    /* Tout batiment pose hors village est raccorde au reseau des sa
       reservation : le sentier existe donc avant le decor, qui l'evitera. */
    /* Tous les points d'accroche possibles sur le reseau, du plus proche au
       plus loin : points des voies et centres de village. */
    function wayCandidates(px,py){
        var out=[], lists=[ROADS,PATHS], li, q, o, dx, dy, l2, t, cxp, cyp;
        for(li=0;li<2;li++) for(q=0;q<lists[li].length;q++){
            o=lists[li][q];
            dx=o.x2-o.x1; dy=o.y2-o.y1; l2=dx*dx+dy*dy;
            t=l2<0.0001?0:((px-o.x1)*dx+(py-o.y1)*dy)/l2;
            t=t<0?0:(t>1?1:t);
            cxp=o.x1+dx*t; cyp=o.y1+dy*t;
            out.push({x:cxp,y:cyp,d:dist2(px,py,cxp,cyp)});
        }
        for(q=0;q<VSPOT.length;q++)
            out.push({x:VSPOT[q].x,y:VSPOT[q].y,d:dist2(px,py,VSPOT[q].x,VSPOT[q].y)});
        out.sort(function(a2,b2){ return a2.d-b2.d; });
        return out;
    }
    /* Raccordement d'un batiment isole. Trois regles : le chemin part de la
       facade et sort droit devant, il ne traverse jamais l'eau, et il ne
       croise pas une autre voie au-dessus de l'eau. */
    function linkSpot(px,py,maxD){
        var fy0=py+54, cand=wayCandidates(px,fy0), q, k2, amp, pts, nd2;
        if(wetAt(px,fy0)||wetAt(px,py+26)) return;
        for(q=0;q<cand.length&&q<40;q++){
            nd2=Math.sqrt(cand[q].d);
            if(nd2<26) continue;
            if(nd2>(maxD||1100)) break;
            /* on privilegie une arrivee par l'avant : la voie visee doit etre
               devant la facade, sauf si aucune ne l'est */
            if(q<20&&cand[q].y<py+18) continue;
            for(k2=0;k2<3;k2++){
                amp=Math.min(150,nd2*0.18)*[1,0.45,0][k2];
                pts=wavyPts(px,fy0,cand[q].x,cand[q].y,amp);
                pts.unshift({x:px,y:py+14});
                if(dryPts(pts)&&!wetJunction(pts)){ pushWay(PATHS,pts,PATH_W); return; }
            }
        }
        /* second tour sans la contrainte d'arrivee par l'avant */
        for(q=0;q<cand.length&&q<40;q++){
            nd2=Math.sqrt(cand[q].d);
            if(nd2<26) continue;
            if(nd2>(maxD||1100)) break;
            pts=wavyPts(px,fy0,cand[q].x,cand[q].y,0);
            pts.unshift({x:px,y:py+14});
            if(dryPts(pts)&&!wetJunction(pts)){ pushWay(PATHS,pts,PATH_W); return; }
        }
    }
    /* le chateau, unique */
    DSPOT=freeSpot(210,600,70,900,true);
    linkSpot(DSPOT.x,DSPOT.y+18,1400);
    /* les fermes */
    for(i=0;i<BUDGET.farms;i++){
        var fsp=null;
        /* une ferme peut s'installer sur un plateau : on cherche d'abord la */
        if(i<HILLS.length&&BUDGET.hillFarm[i]){
            var hf=HILLS[i], fq, fa6, fd6, fx6, fy6;
            for(fq=0;fq<60&&!fsp;fq++){
                fa6=Rr(0,6.283); fd6=Rr(0,hf.rTop*0.55);
                fx6=hf.x+Math.cos(fa6)*fd6; fy6=hf.y+Math.sin(fa6)*fd6;
                if(wetDisc(fx6,fy6,150)) continue;
                if(hitObstacle(fx6,fy6,150)) continue;
                fsp={x:fx6,y:fy6,r:250}; SPOTS.push(fsp);
            }
        }
        if(!fsp) fsp=freeSpot(250,300,60,620,true);
        FSPOT.push(fsp);
        linkSpot(fsp.x,fsp.y+22,1500);
    }
    /* ---- PORTS ----
       Un quai qui avance dans la mer, un ou deux bateaux amarres, et un petit
       bourg portuaire dont deux hangars. C'est de la que l'on quitte la carte. */
    for(i=0;i<BUDGET.ports;i++){
        var pside, pt, psx, psy, pnx, pny, pcx, pcy, ptry, pok=false;
        /* Le beton du port est un disque de 215 : il ne doit chevaucher ni un
           autre port, ni le sol d'un bourg. Ces deux regles ne se relachent
           jamais, les autres cedent au fil des essais. */
        for(ptry=0;ptry<400&&!pok;ptry++){
            var prel=ptry/400;
            pside=(R()*4)|0; pt=Rr(500,CFG.WORLD-500);
            if(pside===0){ psx=coastDepth(pt,0); psy=pt; pnx=1; pny=0; }
            else if(pside===1){ psx=CFG.WORLD-coastDepth(pt,1); psy=pt; pnx=-1; pny=0; }
            else if(pside===2){ psx=pt; psy=coastDepth(pt,2); pnx=0; pny=1; }
            else { psx=pt; psy=CFG.WORLD-coastDepth(pt,3); pnx=0; pny=-1; }
            pcx=psx+pnx*175; pcy=psy+pny*175;
            var pclash=false, pz4;
            for(pz4=0;pz4<PORTS.length;pz4++)
                if(dist2(pcx,pcy,PORTS[pz4].x,PORTS[pz4].y)<470*470) pclash=true;
            for(pz4=0;pz4<VSPOT.length&&!pclash;pz4++){
                var vgr=VSPOT[pz4].r*1.06+245;
                if(dist2(pcx,pcy,VSPOT[pz4].x,VSPOT[pz4].y)<vgr*vgr) pclash=true;
            }
            for(pz4=0;pz4<FSPOT.length&&!pclash;pz4++)
                if(dist2(pcx,pcy,FSPOT[pz4].x,FSPOT[pz4].y)<480*480) pclash=true;
            if(pclash) continue;
            /* le beton ne mord pas non plus sur le relief d'une colline */
            for(pz4=0;pz4<HILLS.length;pz4++){
                var pha=datan2(pcy-HILLS[pz4].y,pcx-HILLS[pz4].x);
                var phr=hillRad(HILLS[pz4],pha,HILLS[pz4].rBase)+240;
                if(dist2(pcx,pcy,HILLS[pz4].x,HILLS[pz4].y)<phr*phr) pclash=true;
            }
            if(pclash) continue;
            if(ptry<380){
                if(inBuiltZone(pcx,pcy,230-prel*150)) continue;
                if(wetDisc(pcx,pcy,150-prel*70)) continue;
                if(hitObstacle(pcx,pcy,150-prel*70)) continue;
            }
            pok=true;
        }
        if(!pok) FSFAIL++;
        if(!pok) FSFAIL++;
        var po={x:pcx,y:pcy,sx:psx,sy:psy,nx:pnx,ny:pny,side:pside,bld:[],boats:[]};
        SPOTS.push({x:pcx,y:pcy,r:230});
        /* Le quai s'arrete au bord de l'eau : sa longueur ne depasse jamais la
           profondeur de mer disponible a cet endroit. */
        var pdep=(pside<2?coastDepth(psy,pside):coastDepth(psx,pside));
        var pql=Math.max(60,Math.min(168,pdep-46));
        po.quay={x:psx-pnx*14,y:psy-pny*14,l:pql,w:44};
        var qtx=-pny, qty=pnx;
        function pqp(al,ac){
            return {x:po.quay.x-pnx*al+qtx*ac, y:po.quay.y-pny*al+qty*ac};
        }
        /* le quai porte : on marche dessus sans s'enfoncer ni ralentir */
        var qa2=pqp(-18,0), qb2=pqp(pql,0);
        BRIDGES.push({x1:qa2.x,y1:qa2.y,x2:qb2.x,y2:qb2.y,w:44,k:"quai"});
        /* un ou deux bateaux le long du quai */
        var nbo=1+((R()*2)|0), bz;
        for(bz=0;bz<nbo;bz++){
            var bo={o:(bz?1:-1),d:Rr(38,Math.max(45,pql-32)),
                    len:Rr(58,86),bw:Rr(20,27),s:(R()*3)|0};
            var bc=pqp(bo.d,bo.o*(22+bo.bw/2+5));
            bo.cx=bc.x; bo.cy=bc.y;
            /* le pont du bateau porte aussi, et c'est de la que l'on embarque */
            BRIDGES.push({x1:bc.x-pnx*bo.len*0.45,y1:bc.y-pny*bo.len*0.45,
                          x2:bc.x+pnx*bo.len*0.45,y2:bc.y+pny*bo.len*0.45,
                          w:bo.bw+4,k:"quai"});
            EXITS.push({x:bc.x,y:bc.y,r:bo.len*0.4,boat:true});
            po.boats.push(bo);
        }
        linkSpot(pcx,pcy+54,1600);
        /* le bourg portuaire : deux hangars et le reste en batiments varies */
        var pn=BUDGET.portBld[i], pkinds=["depot","bar","superette","droguerie","maison","maison"];
        var plan2=["hangar","hangar"], pz2;
        for(pz2=2;pz2<pn;pz2++) plan2.push(pkinds[(R()*pkinds.length)|0]);
        for(pz2=0;pz2<plan2.length;pz2++){
            var pk2=plan2[pz2], pbd=null, pbw=44, pbh=32;
            if(pk2==="hangar"){ pbw=112; pbh=62; }
            else if(pk2!=="maison"){
                for(j=0;j<BLDG.length;j++) if(BLDG[j].k===pk2) pbd=BLDG[j];
                if(pbd){ pbw=pbd.w; pbh=pbd.h; }
            }
            var pbx=0, pby=0, pbad=true, pk3, pq4;
            for(pk3=0;pk3<130&&pbad;pk3++){
                var pa4=Rr(0,6.283), pd4=Rr(58,190+pk3*0.6);
                pbx=pcx+Math.cos(pa4)*pd4-pbw/2; pby=pcy+Math.sin(pa4)*pd4-pbh/2;
                pbad=false;
                if(wetRect(pbx-6,pby-6,pbw+12,pbh+12)){ pbad=true; continue; }
                if(wayHitsRect(pbx,pby,pbw,pbh,10)){ pbad=true; continue; }
                for(pq4=0;pq4<po.bld.length;pq4++){ var ob2=po.bld[pq4];
                    if(pbx<ob2.x+ob2.w+13&&pbx+pbw>ob2.x-13&&
                       pby<ob2.y+ob2.h+13&&pby+pbh>ob2.y-13){ pbad=true; break; } }
            }
            if(pbad){
                /* dernier recours : on ne garde que l'eau et les voies */
                for(pk3=0;pk3<200&&pbad;pk3++){
                    var pa5=Rr(0,6.283), pd5=Rr(58,300);
                    pbx=pcx+Math.cos(pa5)*pd5-pbw/2; pby=pcy+Math.sin(pa5)*pd5-pbh/2;
                    pbad=wetRect(pbx-8,pby-8,pbw+16,pbh+16)||wayHitsRect(pbx,pby,pbw,pbh,10);
                }
                if(pbad) FSFAIL++;
            }
            if(pk2==="hangar"){
                HANGARS.push({x:pbx+pbw/2,y:pby+pbh/2,w:106,h:56,s:(R()*3)|0,port:true});
                wall(pbx+pbw/2-53,pby+pbh/2-40,106,56);
            } else {
                po.bld.push({x:pbx,y:pby,w:pbw,h:pbh,k:pk2,s:(R()*3)|0});
                wall(pbx,pby,pbw,pbh);
            }
        }
        PORTS.push(po);
    }
    /* les batiments isoles : caserne militaire, pompiers, hopital, hangars */
    for(i=0;i<BUDGET.army;i++){ var asp=freeSpot(210,560,70,800,true);
        ASPOT.push(asp); linkSpot(asp.x,asp.y+96,1200); }
    for(i=0;i<BUDGET.fire;i++){ var psp=freeSpot(150,420,70,700,true);
        PSPOT.push(psp); linkSpot(psp.x,psp.y+40,1200); }
    for(i=0;i<BUDGET.hosp;i++){ var hsp=freeSpot(175,460,70,700,true);
        HSPOT.push(hsp); linkSpot(hsp.x,hsp.y+50,1200); }
    for(i=0;i<BUDGET.hangars;i++){ var gsp=freeSpot(150,360,70,760,true);
        GSPOT.push(gsp); linkSpot(gsp.x,gsp.y+30,1200); }
    /* bosquets et blocs de pierre sur les plateaux */
    for(i=0;i<HILLS.length;i++){
        var hz=HILLS[i], hq, hn2, hrad2, ha6, hd6, hx6, hy6;
        for(hq=0;hq<BUDGET.hillTrees[i];hq++){
            hn2=Ri(10,60); hrad2=28+Math.sqrt(hn2)*15;
            ha6=Rr(0,6.283); hd6=Rr(0,Math.max(10,hz.rTop-hrad2-20));
            hx6=hz.x+Math.cos(ha6)*hd6; hy6=hz.y+Math.sin(ha6)*hd6;
            for(j=0;j<hn2;j++){
                var ta6=Rr(0,6.283), td6=hrad2*Math.sqrt(R());
                var tx6=hx6+Math.cos(ta6)*td6, ty6=hy6+Math.sin(ta6)*td6;
                if(wetAt(tx6,ty6)||hitObstacle(tx6,ty6,9)) continue;
                tree(tx6,ty6);
            }
        }
        for(hq=0;hq<BUDGET.hillRocks[i];hq++){
            ha6=Rr(0,6.283); hd6=Rr(0,hz.rTop*0.7);
            massif(hz.x+Math.cos(ha6)*hd6,hz.y+Math.sin(ha6)*hd6,20,70,20,0.5);
        }
    }
    /* les blocs des sources de riviere, une fois le reseau connu */
    for(i=0;i<DEFROCK.length;i++) rock(DEFROCK[i].x,DEFROCK[i].y,DEFROCK[i].r);
    /* bosquets : 1 a 40 arbres */
    for(i=0;i<BUDGET.groves;i++){
        /* de la touffe d'arbres a la vraie foret */
        var n=Ri(4,120), rad=28+Math.sqrt(n)*17;
        sp=freeSpot(rad,260,40,0,true); if(!sp) continue;
        for(j=0;j<n;j++){
            var a=R()*6.28, d=rad*Math.sqrt(R());
            tree(sp.x+Math.cos(a)*d, sp.y+Math.sin(a)*d);
        }
    }
    /* fermes : un corps de ferme, 3 a 10 champs autour, et un chemin de terre
       qui rejoint la route ou le village le plus proche */
    function farm(cx,cy,nf,fi){
        var dc=dryOut({x:cx,y:cy},44,36); cx=dc.x; cy=dc.y;
        var bx=cx-20, by=cy-16, fields=[], k, q, a2, d2f, cols, rows, fw, fh, fx, fy, ok, o2, ftype;
        wall(bx,by,40,32);
        /* Trois passes : on cherche d'abord des parcelles bien separees, puis
           jointives, puis un peu plus loin. Les champs restent serres autour
           du corps de ferme, sans jamais se chevaucher. */
        var FMRG=[15,7,0,0], FRAD=[0,16,40,90], pass;
        for(k=0;k<nf;k++){
            ok=false;
            for(pass=0;pass<4&&!ok;pass++) for(q=0;q<70;q++){
                cols=Ri(3,5); rows=Ri(2,3);
                fw=cols*22+8; fh=rows*20+8;
                /* le premier champ est toujours cultive, ensuite c'est au sort */
                ftype=(k===0||R()<0.5)?"culture":"pature";
                if(ftype==="pature"){ fw+=Ri(0,2)*22; fh+=Ri(0,1)*20; }
                a2=Rr(0,6.28); d2f=Rr(54,88+nf*8+FRAD[pass]);
                fx=cx+Math.cos(a2)*d2f-fw/2; fy=cy+Math.sin(a2)*d2f-fh/2;
                ok=(fx>30&&fy>30&&fx+fw<CFG.WORLD-30&&fy+fh<CFG.WORLD-30);
                if(ok&&wayHitsRect(fx,fy,fw,fh,6)) ok=false;
                if(ok&&wetRect(fx,fy,fw,fh)) ok=false;
                if(ok&&fx<bx+52&&fx+fw>bx-12&&fy<by+44&&fy+fh>by-12) ok=false;
                for(o2=0;ok&&o2<fields.length;o2++){
                    var of2=fields[o2], mg=FMRG[pass];
                    if(fx<of2.x+of2.w+mg&&fx+fw>of2.x-mg&&
                       fy<of2.y+of2.h+mg&&fy+fh>of2.y-mg) ok=false;
                }
                if(ok) break;
            }
            if(!ok) FLDFAIL++;
            var fld={x:fx,y:fy,w:fw,h:fh,t:ftype,s:(R()*3)|0};
            fields.push(fld);
            if(ftype==="pature"){
                /* un enclos ne reste pas vide : moutons, cochons ou poules,
                   de deux a six betes selon la surface */
                fld.beast=["mouton","cochon","poule"][(R()*3)|0];
                fld.nb=Math.max(2,Math.min(6,Math.round(fw*fh/2600)));
                fld.herd=[];
            }
            if(ftype==="culture"){
                for(var vy=0;vy<rows;vy++) for(var vx=0;vx<cols;vx++)
                    VEGGIES.push({x:fx+8+vx*22,y:fy+8+vy*20,type:(R()*3)|0,respT:0});
            } else {
                /* pature : quatre cotes de barriere infranchissable, une seule
                   ouverture, du cote qui regarde le corps de ferme */
                var gs=Math.max(18,Math.min(34,fw*0.28))|0;
                var gside=(cy>fy+fh/2)?0:((cy<fy)?1:((cx<fx)?2:3));
                fld.gate={s:gside,o:gs};
                function bar(rx,ry,rw,rh){ wall(rx,ry,rw,rh); }
                if(gside===0){ bar(fx,fy,fw,3);
                    bar(fx,fy+fh-3,(fw-gs)/2,3); bar(fx+(fw+gs)/2,fy+fh-3,(fw-gs)/2,3); }
                else bar(fx,fy+fh-3,fw,3);
                if(gside===1){ bar(fx,fy,(fw-gs)/2,3); bar(fx+(fw+gs)/2,fy,(fw-gs)/2,3); }
                else if(gside!==0) bar(fx,fy,fw,3);
                if(gside===2){ bar(fx,fy,3,(fh-gs)/2); bar(fx,fy+(fh+gs)/2,3,(fh-gs)/2); }
                else bar(fx,fy,3,fh);
                if(gside===3){ bar(fx+fw-3,fy,3,(fh-gs)/2); bar(fx+fw-3,fy+(fh+gs)/2,3,(fh-gs)/2); }
                else bar(fx+fw-3,fy,3,fh);
            }
        }
        /* une tour de guet et/ou un hangar peuvent accompagner la ferme */
        function annexe(bw,bh,tries){
            var q3, a4, d4, ax4, ay4;
            for(q3=0;q3<tries;q3++){
                a4=Rr(0,6.28); d4=Rr(56,120+q3*2.2);
                ax4=cx+Math.cos(a4)*d4; ay4=cy+Math.sin(a4)*d4;
                if(wayHitsRect(ax4-bw/2,ay4-bh/2,bw,bh,8)) continue;
                if(wetRect(ax4-bw/2-6,ay4-bh/2-6,bw+12,bh+12)) continue;
                if(ax4-bw/2<bx+52&&ax4+bw/2>bx-12&&ay4-bh/2<by+44&&ay4+bh/2>by-12) continue;
                var clash=false;
                for(o2=0;o2<fields.length;o2++){ var f4=fields[o2];
                    if(ax4-bw/2<f4.x+f4.w+8&&ax4+bw/2>f4.x-8&&
                       ay4-bh/2<f4.y+f4.h+8&&ay4+bh/2>f4.y-8) clash=true; }
                if(clash) continue;
                return {x:ax4,y:ay4};
            }
            return null;
        }
        if(BUDGET.farmTower[fi]){
            var atw=annexe(30,30,80);
            if(atw){ GUARDS.push({x:atw.x,y:atw.y,farm:true});
                wall(atw.x-9,atw.y-9,18,18);
                TORCHES.push({x:atw.x,y:atw.y-30,ph:R()*6}); }
            else FSFAIL++;
        }
        if(BUDGET.farmHangar[fi]){
            var ahg=annexe(112,66,80);
            if(ahg){ HANGARS.push({x:ahg.x,y:ahg.y,w:106,h:56,s:(R()*3)|0,farm:true});
                wall(ahg.x-53,ahg.y-40,106,56); }
            else FSFAIL++;
        }
        var np=BUDGET.farmers[fi], people=[];
        for(q=0;q<np;q++)
            people.push({x:cx+26+q*7,y:cy+8+q*4,hx:cx+26,hy:cy+8,dx:bx+20,dy:by+30,
                hidden:false,face:1,anim:R()*6,wt:R()*3,hoe:R()*6});
        FARMS.push({x:cx,y:cy,bx:bx,by:by,fields:fields,farmers:people});
    }
    for(i=0;i<BUDGET.farms;i++) farm(FSPOT[i].x,FSPOT[i].y,BUDGET.fields[i],i);
    /* ---- VILLAGES ----
       5 a 20 batiments : des maisons et une poignee d'edifices publics tires
       au sort, plus 1 a 3 tours de guet selon la taille. */
    for(i=0;i<BUDGET.villages;i++){
        sp=VSPOT[i]; if(!sp) continue;
        var soldierNames=["Gareth","Roland","Tancrede","Bertrand","Aldric","Percival","Guillaume","Enguerrand"];
        var nb=BUDGET.houses[i];
        var vg={x:sp.x,y:sp.y,r:sp.r,houses:[],towers:[],well:{x:sp.x,y:sp.y},villagers:[],
            soldier:{x:sp.x+40,y:sp.y+20,name:soldierNames[(R()*soldierNames.length)|0],
                recruited:false,dead:false,hp:60,maxhp:60,face:1,anim:0,cd:0,near:0}};
        var isCity=(i===0);
        /* quels edifices publics ? la mairie d'abord, puis un tirage sans doublon.
           Les immeubles ne se batissent que dans la grande ville. */
        var pub=[], imm=[];
        for(j=0;j<BLDG.length;j++){ if(BLDG[j].city) imm.push(j); else pub.push(j); }
        var nSpec=Math.max(1,Math.min(pub.length,Math.round(nb*0.45)));
        var deck=pub.slice(), kinds=[];
        for(j=deck.length-1;j>0;j--){ var sw=(R()*(j+1))|0, tmp=deck[j]; deck[j]=deck[sw]; deck[sw]=tmp; }
        if(deck.indexOf(0)>0){ deck.splice(deck.indexOf(0),1); deck.unshift(0); }
        for(j=0;j<nSpec;j++) kinds.push(deck[j]);
        /* ordre de pose : les gros edifices d'abord, ils sont plus durs a caser */
        var plan=[];
        if(isCity){
            /* la ville accueille une ou deux des grandes institutions */
            plan.push("pompiers");
            if(BUDGET.cityHosp) plan.push("hopital");
        }
        for(j=0;j<kinds.length;j++) plan.push(kinds[j]);
        for(j=plan.length;j<nb;j++)
            plan.push(isCity&&R()<0.45?imm[(R()*imm.length)|0]:-1);
        for(j=0;j<nb;j++){
            var pk=plan[j], bd=null, bw=44, bh=32, kname="maison";
            if(pk==="pompiers"){ bw=132; bh=90; kname="pompiers"; }
            else if(pk==="hopital"){ bw=160; bh=110; kname="hopital"; }
            else if(pk>=0){ bd=BLDG[pk]; bw=bd.w; bh=bd.h; kname=bd.k; }
            /* 4 passes a contraintes relachees, puis placement force :
               le nombre de batiments du budget est toujours honore. */
            var HRX=[1,0.82,0.64,0.46], pass, k, q, hh;
            var ha=0, hd=0, hx=0, hy=0, bad=true, dmax=sp.r;
            for(pass=0;pass<HRX.length&&bad;pass++){
                /* marge minimale : deux anneaux de trottoir doivent tenir
                   entre deux murs, soit 2 x 10,5 px plus un jeu */
                var mrg=25+9*HRX[pass];
                for(k=0;k<50;k++){
                    ha=Rr(0,6.28); hd=Rr(54,dmax*(0.70+pass*0.14));
                    hx=sp.x+Math.cos(ha)*hd-bw/2; hy=sp.y+Math.sin(ha)*hd-bh/2; bad=false;
                    /* les batiments bordent la route, ils ne s'y posent jamais :
                       cette contrainte-la ne se relache a aucune passe */
                    if(wayHitsRect(hx,hy,bw,bh,10)){ bad=true; continue; }
                    if(wetRect(hx,hy,bw,bh)){ bad=true; continue; }
                    for(q=0;q<vg.houses.length;q++){ hh=vg.houses[q];
                        if(hx<hh.x+hh.w+mrg&&hx+bw>hh.x-mrg&&
                           hy<hh.y+hh.h+mrg&&hy+bh>hh.y-mrg){ bad=true; break; } }
                    if(!bad) break;
                }
            }
            if(bad){
                /* dernier recours : on ne garde que l'interdit de chaussee */
                for(k=0;k<140;k++){
                    ha=Rr(0,6.28); hd=Rr(54,dmax*1.4);
                    hx=sp.x+Math.cos(ha)*hd-bw/2; hy=sp.y+Math.sin(ha)*hd-bh/2;
                    if(!wayHitsRect(hx,hy,bw,bh,8)&&!wetRect(hx,hy,bw,bh)){ bad=false; break; }
                }
                FSFAIL++;
            }
            vg.houses.push({x:hx,y:hy,w:bw,h:bh,k:kname,s:(R()*3)|0});
            /* ---- ENSEIGNES ET ADRESSES ----
               Une maison sur quatre porte l'enseigne d'un artisan, et le bas
               d'un immeuble sur deux abrite un commerce : c'est la seule
               adresse que le plombier, le boulanger ou l'electricien peuvent
               avoir, faute d'un batiment a eux dans la table des lieux.
               Les immeubles recoivent en plus un numero et une rue - "un
               immeuble" ne disait rien a personne. Les rues ne forment aucun
               plan coherent et ne cherchent pas a en former un : ce sont des
               noms sur des facades, pas un cadastre. */
            (function(){
                var hs9=vg.houses[vg.houses.length-1];
                var im9=(kname.indexOf("immeuble")===0);
                /* MAISONS ET IMMEUBLES RECOIVENT UNE ADRESSE : "une maison" ne
                   disait rien, "le 12 rue du Four" se retient. Les edifices
                   publics gardent leur nom propre et n'en prennent pas. */
                if(kname==="maison"||im9)
                    hs9.adr=(1+((R()*98)|0))+" "+RUES[(R()*RUES.length)|0];
                if((kname==="maison"&&R()<0.25)||(im9&&R()<0.5)){
                    var t9=BIZ[(R()*BIZ.length)|0];
                    hs9.biz=t9.k;
                    hs9.ens=t9.p[(R()*t9.p.length)|0]+" "+
                            NOMFAM[(R()*NOMFAM.length)|0];
                }
            })();
            if(kname==="pompiers"){ FIREHOUSES.push({x:hx+bw/2,y:hy+bh/2-8,w:88,h:50,city:true});
                wall(hx+bw/2-44,hy+bh/2-42,88,50); wall(hx+bw/2+46,hy+bh/2-66,20,74); }
            else if(kname==="hopital"){ HOSPITALS.push({x:hx+bw/2-14,y:hy+bh/2,w:122,h:64,city:true});
                wall(hx+bw/2-75,hy+bh/2-44,122,64); }
            else wall(hx,hy,bw,bh);
        }
        /* tours de guet : decor, sans pouvoir, sur le pourtour du village */
        var ntw=BUDGET.towers[i];
        for(j=0;j<ntw;j++){
            var ta=0, tx2=0, ty2=0, tbad=true, tq, tk2;
            for(tq=0;tq<40&&tbad;tq++){
                ta=Rr(0,6.28); tx2=sp.x+Math.cos(ta)*Rr(dmax*0.62,dmax*1.02);
                ty2=sp.y+Math.sin(ta)*Rr(dmax*0.62,dmax*1.02); tbad=false;
                if(onRoad(tx2,ty2,24)){ tbad=true; continue; }
                for(tk2=0;tk2<vg.houses.length;tk2++){ hh=vg.houses[tk2];
                    if(tx2>hh.x-22&&tx2<hh.x+hh.w+22&&ty2>hh.y-22&&ty2<hh.y+hh.h+22){ tbad=true; break; } }
                for(tk2=0;tk2<vg.towers.length;tk2++)
                    if(dist2(tx2,ty2,vg.towers[tk2].x,vg.towers[tk2].y)<70*70){ tbad=true; break; }
            }
            if(tbad) FSFAIL++;
            vg.towers.push({x:tx2,y:ty2});
            GUARDS.push({x:tx2,y:ty2});
            wall(tx2-9,ty2-9,18,18);
            TORCHES.push({x:tx2,y:ty2-30,ph:R()*6});
        }
        /* le puits se decale de la chaussee ET des batiments : il tombait
           parfois sur une maison. On l'ecarte tant qu'il chevauche l'un ou
           l'autre, en s'eloignant un peu plus du centre. */
        var wx=sp.x, wy=sp.y, wq, wa2, wd2, wbad, wj, hh9;
        for(wq=0;wq<40;wq++){
            wbad=onRoad(wx,wy,14);
            if(!wbad) for(wj=0;wj<vg.houses.length;wj++){ hh9=vg.houses[wj];
                if(wx>hh9.x-16&&wx<hh9.x+hh9.w+16&&wy>hh9.y-16&&wy<hh9.y+hh9.h+16){ wbad=true; break; } }
            if(!wbad) break;
            wa2=Rr(0,6.28); wd2=Rr(34,110);
            wx=sp.x+Math.cos(wa2)*wd2; wy=sp.y+Math.sin(wa2)*wd2;
        }
        vg.well.x=wx; vg.well.y=wy;
        vg.soldier.x=wx+40; vg.soldier.y=wy+20;
        wall(wx-8,wy-8,16,16);
        /* population : 1 a 3 par maison, 2 a 3 par immeuble */
        vg.nvil=0;
        for(j=0;j<vg.houses.length;j++){
            var hk=vg.houses[j].k;
            if(hk==="maison") vg.nvil+=Ri(1,3);
            else if(hk.indexOf("immeuble")===0) vg.nvil+=Ri(2,3);
        }
        /* arbres de bourg : mis en attente, ils seront plantes une fois les
           trottoirs traces pour ne pas leur barrer la route */
        PENDTREE.push({x:sp.x,y:sp.y,n:Math.round(nb*1.15),d:dmax,wx:wx,wy:wy});
        VILLAGES.push(vg);
    }
    /* portails enchantes */
    /* grottes : 4-5, actives a partir de la vague 5 */
    var ncaves=BUDGET.caves;
    for(i=0;i<ncaves;i++){
        sp=freeSpot(150,420,60); if(!sp) continue;
        CAVES.push({x:sp.x,y:sp.y});
        /* complexe rocheux : deux anneaux + eboulis, couloir d'acces libre */
        var op=massif(sp.x,sp.y-14,46,96,34,0.62);
        massif(sp.x,sp.y-24,100,138,26,0.5);
        for(j=0;j<14;j++){
            var ea=op+Rr(-0.5,0.5), ed=Rr(100,165);
            var ex2=sp.x+Math.cos(ea)*ed, ey2=sp.y+Math.sin(ea)*ed, er2=3+R()*4;
            /* meme regle que les blocs : l'eboulis ne deborde pas sur une voie */
            if(onRoad(ex2,ey2,er2+5)||inBuiltZone(ex2,ey2,er2)) continue;
            ROCKS.push({x:ex2,y:ey2,r:er2,s:(R()*3)|0,t:R(),deco:true});
        }
    }
    /* le chateau : un seul par carte, a l'emplacement reserve plus haut */
    for(i=0;i<1;i++){
        sp=dryOut(DSPOT,160,120); if(!sp) continue;
        DUNGEONS.push({x:sp.x,y:sp.y});
        /* corps du chateau : deux ailes + linteau, la porte reste libre */
        wall(sp.x-72,sp.y-84,60,90);
        wall(sp.x+12,sp.y-84,60,90);
        wall(sp.x-12,sp.y-84,24,60);
    }
    /* tours de garde : noir=tire joueur, bleu=tire ennemis, vert=bouteilles */
    /* deck issu du budget : chaque couleur est garantie en nombre exact,
       et la pioche suit le placement au lieu de l'index de boucle. */
    var flags=BUDGET.towerDeck;
    for(i=0;i<BUDGET.towerTotal;i++){
        sp=freeSpot(70,360,60);
        var gcd=R()*2;
        GUARDS.push({x:sp.x,y:sp.y,flag:flags[i],cd:gcd,cd0:gcd,range:200});
        wall(sp.x-9,sp.y-9,18,18);
        TORCHES.push({x:sp.x,y:sp.y-30,ph:R()*6});
    }
    /* ---- BATIMENTS ISOLES ----
       Caserne militaire cloturee, caserne de pompiers, hopital, hangars.
       Ils se posent pres du reseau mais hors des villages. */
    (function(){
        var q, bsp;
        for(q=0;q<ASPOT.length;q++){
            bsp=dryOut(ASPOT[q],230,190);
            var ab={x:bsp.x,y:bsp.y,w:96,h:54,n:BUDGET.troops[q],troops:[]};
            ARMYBASES.push(ab);
            wall(ab.x-48,ab.y-40,96,54);
            /* deux baraquements */
            ab.b1={x:ab.x-72,y:ab.y+22}; ab.b2={x:ab.x+18,y:ab.y+22};
            wall(ab.b1.x,ab.b1.y,54,26); wall(ab.b2.x,ab.b2.y,54,26);
            /* cloture : quatre cotes pleins. Le portail du sud reste ferme,
               on n'entre que par la porte, serrure comprise. */
            ab.fx=ab.x-112; ab.fy=ab.y-84; ab.fw=224; ab.fh=178;
            wall(ab.fx,ab.fy,ab.fw,4);
            wall(ab.fx,ab.fy,4,ab.fh);
            wall(ab.fx+ab.fw-4,ab.fy,4,ab.fh);
            wall(ab.fx,ab.fy+ab.fh-4,ab.fw,4);
        }
        for(q=0;q<PSPOT.length;q++){
            bsp=dryOut(PSPOT[q],120,60);
            FIREHOUSES.push({x:bsp.x,y:bsp.y,w:88,h:50});
            wall(bsp.x-44,bsp.y-34,88,50);
            wall(bsp.x+46,bsp.y-58,20,74);
        }
        for(q=0;q<HSPOT.length;q++){
            bsp=dryOut(HSPOT[q],150,80);
            HOSPITALS.push({x:bsp.x,y:bsp.y,w:122,h:64});
            wall(bsp.x-61,bsp.y-44,122,64);
        }
        for(q=0;q<GSPOT.length;q++){
            bsp=dryOut(GSPOT[q],120,70);
            HANGARS.push({x:bsp.x,y:bsp.y,w:106,h:56,s:(R()*3)|0});
            wall(bsp.x-53,bsp.y-40,106,56);
        }
    })();
    /* ---- ZONES HABITEES ---- */
    for(i=0;i<VSPOT.length;i++) SETTLE.push({x:VSPOT[i].x,y:VSPOT[i].y,r:VSPOT[i].r*1.1});
    for(i=0;i<FSPOT.length;i++) SETTLE.push({x:FSPOT[i].x,y:FSPOT[i].y,r:250});
    if(DSPOT) SETTLE.push({x:DSPOT.x,y:DSPOT.y,r:200});
    for(i=0;i<ASPOT.length;i++) SETTLE.push({x:ASPOT[i].x,y:ASPOT[i].y,r:200});
    for(i=0;i<PSPOT.length;i++) SETTLE.push({x:PSPOT[i].x,y:PSPOT[i].y,r:150});
    for(i=0;i<HSPOT.length;i++) SETTLE.push({x:HSPOT[i].x,y:HSPOT[i].y,r:160});
    for(i=0;i<GSPOT.length;i++) SETTLE.push({x:GSPOT[i].x,y:GSPOT[i].y,r:150});
    for(i=0;i<PORTS.length;i++) SETTLE.push({x:PORTS[i].x,y:PORTS[i].y,r:240});
    /* ---- HARDES DE BICHES ----
       Elles paissent loin des hommes et ne s'en approchent jamais. */
    for(i=0;i<BUDGET.herds;i++){
        var hax=0, hay=0, hq2, hok=false;
        for(hq2=0;hq2<300&&!hok;hq2++){
            var rel=hq2/300;
            hax=Rr(300,CFG.WORLD-300); hay=Rr(300,CFG.WORLD-300);
            if(inSettle(hax,hay,260-rel*180)) continue;
            if(onRoad(hax,hay,120-rel*90)) continue;
            if(wetDisc(hax,hay,90-rel*50)) continue;
            hok=true;
        }
        if(!hok) FSFAIL++;
        var herd={x:hax,y:hay,r:230,n:BUDGET.deers[i],list:[]};
        DEER.push(herd);
    }
    /* ---- ABRIS DE BOIS ----
       Cabanes plantees loin de tout, jamais raccordees au reseau : c'est le
       gite de fortune que l'on trouve en s'ecartant des routes. */
    (function(){
        var q, k3, ax5, ay5, ok5;
        for(q=0;q<BUDGET.shelters;q++){
            ok5=false;
            for(k3=0;k3<120&&!ok5;k3++){
                ax5=Rr(200,CFG.WORLD-200); ay5=Rr(200,CFG.WORLD-200);
                if(inBuiltZone(ax5,ay5,120)) continue;
                if(onRoad(ax5,ay5,80)) continue;
                if(wetRect(ax5-22,ay5-20,44,38)) continue;
                if(hitObstacle(ax5,ay5,26)) continue;
                ok5=true;
            }
            if(!ok5) FSFAIL++;
            SHELTERS.push({x:ax5,y:ay5,s:(R()*3)|0,f:R()<0.5?1:-1,
                t:(q%2)?"tente":"cabane"});
            wall(ax5-15,ay5-14,30,20);
        }
    })();
    /* ---- CAMPS SCOUTS ----
       Trois tentes autour d'un foyer, plantees loin des bourgs et des voies :
       une troupe en sortie qui n'a pas vu venir ce qui arrive. Le camp n'est
       jamais raccorde au reseau, comme les abris. */
    (function(){
        var q, k4, cxx, cyy, ok6, t4, aa4, base4, tx4, ty4;
        for(q=0;q<BUDGET.camps;q++){
            ok6=false;
            for(k4=0;k4<200&&!ok6;k4++){
                cxx=Rr(240,CFG.WORLD-240); cyy=Rr(240,CFG.WORLD-240);
                if(inBuiltZone(cxx,cyy,150)) continue;
                if(inSettle(cxx,cyy,120)) continue;
                if(onRoad(cxx,cyy,70)) continue;
                if(wetRect(cxx-60,cyy-60,120,120)) continue;
                if(hitObstacle(cxx,cyy,62)) continue;
                ok6=true;
            }
            if(!ok6){ FSFAIL++; continue; }
            var camp={x:cxx,y:cyy,tents:[],scouts:[]};
            base4=Rr(0,6.283);
            for(t4=0;t4<3;t4++){
                aa4=base4+t4*2.0944;
                tx4=cxx+dcos(aa4)*42; ty4=cyy+dsin(aa4)*42;
                camp.tents.push({x:tx4,y:ty4,s:(R()*3)|0});
                wall(tx4-15,ty4-14,30,20);
            }
            CAMPS.push(camp);
        }
    })();
    /* ---- LE LABORATOIRE H-TECK ----
       Un seul batiment de ce genre sur la carte, plante loin de tout : un bloc
       de beton dans son enclos grillage, une porte de service restee ouverte.
       C'est de la que sortent les premiers zombis. On le veut a l'ecart des
       bourgs mais pas au bout du monde : la recherche s'elargit d'essai en
       essai, et si rien ne convient on relache la contrainte de distance. */
    (function(){
        var k7, lx, ly, ok7=false, dmin, i7;
        for(k7=0;k7<600&&!ok7;k7++){
            lx=Rr(300,CFG.WORLD-300); ly=Rr(300,CFG.WORLD-300);
            if(inBuiltZone(lx,ly,180)) continue;
            if(inSettle(lx,ly,260)) continue;
            if(onRoad(lx,ly,110)) continue;
            if(wetRect(lx-96,ly-84,192,168)) continue;
            if(hitObstacle(lx,ly,110)) continue;
            dmin=1e9;
            for(i7=0;i7<VILLAGES.length;i7++)
                dmin=Math.min(dmin,dist2(lx,ly,VILLAGES[i7].x,VILLAGES[i7].y));
            /* assez loin pour n'appartenir a personne, assez pres pour se
               trouver : la borne haute tombe au fil des essais */
            if(dmin<420*420) continue;
            if(k7<400&&dmin>1500*1500) continue;
            ok7=true;
        }
        if(!ok7){ FSFAIL++; return; }
        LAB={x:lx, y:ly, name:"Laboratoire H-teck",
             tanks:[{x:lx+52,y:ly+16,r:9},{x:lx+52,y:ly+34,r:9}],
             out:0, made:0};
        /* le corps de batiment */
        wall(lx-44,ly-30,88,62);
        /* l'enclos : trois cotes fermes, la face sud laisse passer */
        wall(lx-78,ly-66,156,5);
        wall(lx-78,ly-66,5,132);
        wall(lx+73,ly-66,5,132);
        wall(lx-78,ly+61,52,5);
        wall(lx+26,ly+61,52,5);
        /* Le laboratoire s'ouvre enfin. Le lieu le plus charge de sens de la
           carte etait une porte sans nom qui ne donnait rien : il a
           desormais son nom, sa serrure de haute securite et sa piece
           unique, ou l'on ne trouve que de la chimie et de l'electricite. */
        BLDRECTS.push({x:lx-44,y:ly-30,w:88,h:62,
                       nm:"le laboratoire H-teck",lock:true,lock0:true,pick:10,
                       k:"public",lt:"labo"});
    })();
    /* ---- LE STAND DE TIR ----
       Un seul par carte, comme le laboratoire. Un club de tir ne se pose pas
       n'importe ou : il vit de ceux qui y viennent en voiture, il se tient
       donc toujours au bord d'une route, mais assez loin des bourgs pour que
       le bruit n'y derange personne. On tire donc au sort un troncon de
       route, on s'en ecarte perpendiculairement d'une centaine de metres, et
       l'on verifie que la parcelle entiere est libre.
       Comme pour le laboratoire, les contraintes se relachent au fil des
       essais : la parcelle est large et il faut une belle clairiere au bord
       d'une route pour la loger. Passe 500 essais on accepte une clairiere
       plus juste, passe 900 on rapproche du bourg. Sans cela une carte tres
       boisee n'aurait pas de stand du tout.
       Le terrain se lit d'un coup d'oeil : le pas de tir couvert au sud, les
       couloirs qui montent vers le nord, la butte de terre au fond derriere
       les cibles, le parking et l'entree cote route. La porte est toujours
       verrouillee et sa serrure est la meilleure du jeu. */
    (function(){
        var k9, i9, sg, t9, px, py, dx9, dy9, ln, nx, ny, d9, rx, ry, ok9, dmin, cl, vm9, bz, dmax, st9, bb9;
        for(k9=0;k9<9000&&!RANGES.length;k9++){
            if(!ROADS.length) break;
            /* la clairiere exigee et l'ecart au bati cedent au fil des essais */
            cl=(k9<1500)?62:((k9<3000)?46:((k9<5500)?32:22));
            bz=(k9<1500)?70:((k9<3000)?40:-1);
            vm9=(k9<3000)?380:((k9<5500)?300:250);
            dmax=(k9<1500)?250:((k9<3000)?310:((k9<5500)?400:470));
            st9=(k9<1500)?190:((k9<3000)?150:((k9<5500)?110:80));
            sg=ROADS[Math.min(ROADS.length-1,(R()*ROADS.length)|0)];
            t9=R();
            px=sg.x1+(sg.x2-sg.x1)*t9; py=sg.y1+(sg.y2-sg.y1)*t9;
            dx9=sg.x2-sg.x1; dy9=sg.y2-sg.y1; ln=Math.hypot(dx9,dy9);
            if(ln<12){ RANGESTAT.court++; continue; }
            nx=-dy9/ln; ny=dx9/ln;
            /* la parcelle s'ouvre plein sud : on prend donc toujours le cote
               qui la pose au nord de la route, sans quoi le chemin d'acces
               entrerait par la butte et traverserait les couloirs de tir.
               Une route qui monte droit au nord ne peut pas servir : elle ne
               laisse aucun cote au sud, on la laisse a la suivante. */
            d9=Rr(130,dmax); if(ny>0) d9=-d9;
            rx=px+nx*d9; ry=py+ny*d9;
            /* passe 4000 essais on accepte une route mal placee : le stand se
               gagne alors a travers champs, ce qui vaut mieux qu'une carte
               sans stand du tout */
            if(py<ry+90&&k9<5500){ RANGESTAT.sud++; continue; }
            if(rx<210||ry<260||rx>CFG.WORLD-210||ry>CFG.WORLD-210){ RANGESTAT.bord++; continue; }
            /* la parcelle est haute : on la teste a ses deux bouts, pas
               seulement en son centre. Au dernier palier on renonce a cette
               marge de confort, mais jamais au chevauchement d'emprise : deux
               batiments l'un dans l'autre ne se rattrapent pas. */
            if(bz>=0&&(inBuiltZone(rx,ry,bz)||inBuiltZone(rx,ry-150,bz))){ RANGESTAT.bati++; continue; }
            ok9=true;
            for(i9=0;i9<BLDRECTS.length;i9++){
                bb9=BLDRECTS[i9];
                if(rx+96>bb9.x-20&&rx-96<bb9.x+bb9.w+20&&
                   ry+68>bb9.y-20&&ry-198<bb9.y+bb9.h+20){ ok9=false; break; }
            }
            if(!ok9){ RANGESTAT.emprise++; continue; }
            if(inSettle(rx,ry,st9)){ RANGESTAT.bourg++; continue; }
            if(onRoad(rx,ry,105)){ RANGESTAT.route++; continue; }
            if(wetRect(rx-78,ry-180,156,234)){ RANGESTAT.eau++; continue; }
            ok9=true;
            for(i9=-160;i9<=40&&ok9;i9+=50)
                if(hitObstacle(rx,ry+i9,cl)) ok9=false;
            if(!ok9){ RANGESTAT.arbre++; continue; }
            dmin=1e9;
            for(i9=0;i9<VILLAGES.length;i9++)
                dmin=Math.min(dmin,dist2(rx,ry,VILLAGES[i9].x,VILLAGES[i9].y));
            if(dmin<vm9*vm9){ RANGESTAT.village++; continue; }
            if(LAB&&dist2(rx,ry,LAB.x,LAB.y)<380*380){ RANGESTAT.labo++; continue; }
            RANGES.push({x:rx, y:ry, name:"", rdx:px, rdy:py});
            /* le pas de tir couvert */
            wall(rx-52,ry-16,104,34);
            /* la butte de terre : elle arrete aussi bien la balle que le pas */
            wall(rx-66,ry-168,132,20);
            /* la cloture, ouverte plein sud sur le parking */
            wall(rx-72,ry-174,144,4);
            wall(rx-72,ry-174,4,208);
            wall(rx+68,ry-174,4,208);
            wall(rx-72,ry+30,38,4);
            wall(rx+34,ry+30,38,4);
            BLDRECTS.push({x:rx-52,y:ry-16,w:104,h:34,
                           nm:"le stand de tir",lock:true,lock0:true,pick:10,
                           k:"public",lt:"stand"});
            /* l'acces depuis la route, quand elle se presente par le sud */
            if(py>=ry+90) PATHS.push({x1:px,y1:py,x2:rx,y2:ry+50,w:9});
        }
    })();
    /* ---- LES STATIONS-SERVICE ----
       Une ou deux par carte. Le probleme est le meme que pour le stand de
       tir - se poser au bord d'une route sans rien chevaucher - mais les
       contraintes sont inverses : une pompe vit du passage, elle se colle
       donc a la chaussee et ne fuit pas les bourgs. La parcelle est petite,
       le placement en est d'autant plus facile.
       La disposition suit la regle des portes : la boutique en haut avec sa
       porte au bord bas, l'auvent et ses deux ilots de pompes en dessous, le
       tablier d'enrobe qui descend vers la route. On entre par le sud, on
       passe les pompes, on trouve la porte. */
    (function(){
        var need=BUDGET.stations||0;
        var k8, i8, sg, t8, px, py, dx8, dy8, ln, nx, ny, d8, sx, sy, ok8, bb8, dmax8;
        for(k8=0;k8<7000&&STATIONS.length<need;k8++){
            if(!ROADS.length) break;
            /* on s'ecarte peu, et de moins en moins au fil des essais */
            dmax8=(k8<2000)?92:((k8<4000)?116:150);
            sg=ROADS[Math.min(ROADS.length-1,(R()*ROADS.length)|0)];
            t8=R();
            px=sg.x1+(sg.x2-sg.x1)*t8; py=sg.y1+(sg.y2-sg.y1)*t8;
            dx8=sg.x2-sg.x1; dy8=sg.y2-sg.y1; ln=Math.hypot(dx8,dy8);
            if(ln<12){ STATSTAT.court++; continue; }
            nx=-dy8/ln; ny=dx8/ln;
            /* toujours le cote qui pose la station au nord de la route :
               sans quoi le tablier entrerait par la boutique */
            d8=Rr(72,dmax8); if(ny>0) d8=-d8;
            sx=px+nx*d8; sy=py+ny*d8;
            if(py<sy+58&&k8<5000){ STATSTAT.sud++; continue; }
            if(sx<160||sy<160||sx>CFG.WORLD-160||sy>CFG.WORLD-160){ STATSTAT.bord++; continue; }
            ok8=true;
            for(i8=0;i8<BLDRECTS.length;i8++){
                bb8=BLDRECTS[i8];
                if(sx+62>bb8.x-16&&sx-62<bb8.x+bb8.w+16&&
                   sy+52>bb8.y-16&&sy-56<bb8.y+bb8.h+16){ ok8=false; break; }
            }
            if(!ok8){ STATSTAT.emprise++; continue; }
            if(onRoad(sx,sy,58)){ STATSTAT.route++; continue; }
            if(wetRect(sx-58,sy-56,116,108)){ STATSTAT.eau++; continue; }
            ok8=true;
            for(i8=-40;i8<=40&&ok8;i8+=40)
                if(hitObstacle(sx,sy+i8,30)) ok8=false;
            if(!ok8){ STATSTAT.arbre++; continue; }
            /* deux pompes ne se posent pas cote a cote */
            for(i8=0;i8<STATIONS.length;i8++)
                if(dist2(sx,sy,STATIONS[i8].x,STATIONS[i8].y)<620*620){ ok8=false; break; }
            if(!ok8){ STATSTAT.voisine++; continue; }
            if(LAB&&dist2(sx,sy,LAB.x,LAB.y)<300*300){ STATSTAT.voisine++; continue; }
            STATIONS.push({x:sx, y:sy, name:"", rdx:px, rdy:py});
            /* la boutique : c'est elle qu'on crochete, serrure ordinaire */
            wall(sx-32,sy-52,64,30);
            BLDRECTS.push({x:sx-32,y:sy-52,w:64,h:30,
                           nm:"la station-service",lock:true,lock0:true,pick:4,
                           k:"public",lt:"station"});
            /* les deux ilots de pompes, sous l'auvent */
            wall(sx-32,sy+2,18,10);
            wall(sx+14,sy+2,18,10);
            PUMPS.push({x:sx-23,y:sy+7});
            PUMPS.push({x:sx+23,y:sy+7});
            /* les quatre poteaux de l'auvent : on passe entre, pas dedans */
            wall(sx-48,sy-8,4,4); wall(sx+44,sy-8,4,4);
            wall(sx-48,sy+22,4,4); wall(sx+44,sy+22,4,4);
            /* l'acces depuis la route, quand elle se presente par le sud */
            if(py>=sy+58) PATHS.push({x1:px,y1:py,x2:sx,y2:sy+40,w:9});
        }
    })();
    /* ---- NOMS DE LIEUX ET PANNEAUX ----
       Chaque lieu recoit un nom, et un panneau se plante la ou une voie entre
       dans son enceinte. Les batiments publics, eux, se signalent de pres. */
    var NA=["Bel","Mont","Val","Roche","Fon","Bourg","Chate","Aigue","Grand","Petit",
            "Clair","Vieux","Haut","Beau","Puy","Sainte","Ver","Cour","Mar","Til"];
    var NB=["mont","val","fort","vent","chene","pre","rive","combe","bois","lande",
            "source","gue","brume","ville","lieu","fosse","tour","champ","eau","sac"];
    function placeName(){ return NA[(R()*NA.length)|0]+NB[(R()*NB.length)|0]; }
    var BLDNAME={pompiers:"Caserne de pompiers",hopital:"Hopital",
        mairie:"Mairie",medecin:"Cabinet medical",police:"Commissariat",
        armurerie:"Armurerie",soins:"Centre de soins",resto:"Restaurant",bar:"Bar",
        ecole:"Ecole",superette:"Superette",droguerie:"Droguerie",depot:"Depot"};
    (function(){
        function entrySigns(cx2,cy2,rad,label,maxn){
            var lists=[ROADS,PATHS], li, q, o, n=0, din, dout, t, ex2, ey2;
            for(li=0;li<2&&n<maxn;li++) for(q=0;q<lists[li].length&&n<maxn;q++){
                o=lists[li][q];
                din=dist2(o.x1,o.y1,cx2,cy2)<rad*rad;
                dout=dist2(o.x2,o.y2,cx2,cy2)<rad*rad;
                if(din===dout) continue;
                t=din?1:0;
                ex2=o.x1+(o.x2-o.x1)*t; ey2=o.y1+(o.y2-o.y1)*t;
                /* le panneau se plante sur le bas-cote */
                var dx2=o.x2-o.x1, dy2=o.y2-o.y1, l2=Math.hypot(dx2,dy2)||1;
                /* jamais au milieu de la chaussee : on cherche le bas-cote */
                var sgx=0, sgy=0, found9=false, side9, dist9;
                for(dist9=o.w/2+13;dist9<o.w/2+52&&!found9;dist9+=8){
                    for(side9=-1;side9<=1&&!found9;side9+=2){
                        sgx=ex2-dy2/l2*dist9*side9; sgy=ey2+dx2/l2*dist9*side9;
                        if(!onRoad(sgx,sgy,9)&&!wetAt(sgx,sgy)&&!hitObstacle(sgx,sgy,9))
                            found9=true;
                    }
                }
                if(!found9) continue;
                SIGNS.push({x:sgx,y:sgy,name:label,post:1,cd:0});
                n++;
            }
            if(!n){
                var fx9=cx2, fy9=cy2+rad*0.9, t9;
                for(t9=0;t9<40&&(onRoad(fx9,fy9,9)||wetAt(fx9,fy9)||hitObstacle(fx9,fy9,9));t9++){
                    var a9=Rr(0,6.283);
                    fx9=cx2+Math.cos(a9)*rad*Rr(0.8,1.05);
                    fy9=cy2+Math.sin(a9)*rad*Rr(0.8,1.05);
                }
                SIGNS.push({x:fx9,y:fy9,name:label,post:1,cd:0});
            }
        }
        VILLAGES.forEach(function(v,vi){
            v.name=placeName();
            v.label=(vi===0?"Ville de ":"Village de ")+v.name;
            entrySigns(v.x,v.y,v.r*1.06,v.label,2);
            v.houses.forEach(function(b){
                var lb=BLDNAME[b.k];
                if(!lb) return;
                SIGNS.push({x:b.x+b.w/2,y:b.y+b.h+10,name:lb+" de "+v.name,post:0,cd:0});
            });
        });
        /* LES FERMES AUSSI ONT UN NOM. Elles n'en avaient pas : on ne pouvait
           pas dire ou l'on habite quand on s'installe dans l'une d'elles, et
           la fiche de la base n'avait alors aucune adresse a montrer. Un
           panneau se plante a l'entree, comme pour les bourgs. */
        FARMS.forEach(function(f){
            f.name=placeName();
            f.label="Ferme de "+f.name;
            entrySigns(f.x,f.y,150,f.label,1);
        });
        PORTS.forEach(function(p){
            p.name=placeName();
            p.label="Port de "+p.name;
            entrySigns(p.x,p.y,215,p.label,2);
        });
        FARMS.forEach(function(f){
            f.name="Ferme de "+placeName();
            SIGNS.push({x:f.x,y:f.y+52,name:f.name,post:1,cd:0});
        });
        DUNGEONS.forEach(function(o){
            o.name="Chateau de "+placeName();
            SIGNS.push({x:o.x,y:o.y+40,name:o.name,post:1,cd:0}); });
        ARMYBASES.forEach(function(o){
            o.name="Caserne militaire de "+placeName();
            SIGNS.push({x:o.x,y:o.fy+o.fh+16,name:o.name,post:1,cd:0}); });
        FIREHOUSES.forEach(function(o){
            o.name="Caserne de pompiers de "+placeName();
            SIGNS.push({x:o.x,y:o.y+46,name:o.name,post:o.city?0:1,cd:0}); });
        HOSPITALS.forEach(function(o){
            o.name="Hopital de "+placeName();
            SIGNS.push({x:o.x,y:o.y+52,name:o.name,post:o.city?0:1,cd:0}); });
        HANGARS.forEach(function(o){
            if(o.farm||o.port) return;
            o.name="Hangar de "+placeName();
            SIGNS.push({x:o.x,y:o.y+44,name:o.name,post:1,cd:0}); });
        RANGES.forEach(function(o){
            o.name="Stand de tir de "+placeName();
            SIGNS.push({x:o.x,y:o.y+52,name:o.name,post:1,cd:0}); });
        STATIONS.forEach(function(o){
            o.name="Station de "+placeName();
            SIGNS.push({x:o.x,y:o.y+46,name:o.name,post:1,cd:0}); });
    })();
    /* ---- TROTTOIRS ET CEINTURES ----
       Tout batiment de bourg ou de port est ceint d'un trottoir. Hors des
       bourgs, un batiment est ceint de la meme matiere que la voie qui le
       dessert : une route s'il est au bout d'une route, un chemin sinon. */
    (function(){
        function ring(list,x,y,w,h,ww){
            var o=ww/2+5, x0=x-o, y0=y-o, x1=x+w+o, y1=y+h+o;
            list.push({x1:x0,y1:y0,x2:x1,y2:y0,w:ww,belt:1});
            list.push({x1:x1,y1:y0,x2:x1,y2:y1,w:ww,belt:1});
            list.push({x1:x1,y1:y1,x2:x0,y2:y1,w:ww,belt:1});
            list.push({x1:x0,y1:y1,x2:x0,y2:y0,w:ww,belt:1});
        }
        function nearWay(list,cx2,cy2,w2,h2,rad){
            var q,o,r2=rad*rad, px2, py2;
            for(q=0;q<list.length;q++){ o=list[q];
                px2=clamp((o.x1+o.x2)/2,cx2,cx2+w2);
                py2=clamp((o.y1+o.y2)/2,cy2,cy2+h2);
                if(segD2(px2,py2,o.x1,o.y1,o.x2,o.y2)<r2) return true; }
            return false;
        }
        function belt(x,y,w,h){
            if(nearWay(ROADS,x,y,w,h,120)) ring(ROADS,x,y,w,h,ROAD_W);
            else if(nearWay(PATHS,x,y,w,h,140)) ring(PATHS,x,y,w,h,PATH_W);
        }
        /* ---- RESEAU PIETON D'UNE AGGLOMERATION ----
           On ceint chaque batiment, puis on regroupe les anneaux qui se
           touchent, et on relie les groupes deux a deux par le plus court
           trajet qui ne passe sous aucun mur. Aucun batiment ne reste isole. */
        var WO=11/2+5, BIDN=0;
        function blocked(x1,y1,x2,y2,rects,ia,ib){
            var dx=x2-x1, dy=y2-y1, l=Math.hypot(dx,dy), n=Math.max(1,Math.ceil(l/5));
            var z2,t,px2,py2,q2,r2;
            for(z2=0;z2<=n;z2++){ t=z2/n; px2=x1+dx*t; py2=y1+dy*t;
                for(q2=0;q2<rects.length;q2++){
                    if(q2===ia||q2===ib) continue;
                    r2=rects[q2];
                    if(px2>r2.x-8&&px2<r2.x+r2.w+8&&py2>r2.y-8&&py2<r2.y+r2.h+8) return true;
                }
            }
            return false;
        }
        function walkNet(rects){
            for(var i2=0;i2<rects.length;i2++){
                /* chaque anneau porte l'identite de son batiment : le maillage
                   saura ainsi distinguer son propre anneau de celui du voisin */
                rects[i2].bid=++BIDN;
                var b2=WALKS.length;
                ring(WALKS,rects[i2].x,rects[i2].y,rects[i2].w,rects[i2].h,11);
                for(;b2<WALKS.length;b2++) WALKS[b2].bld=rects[i2].bid;
            }
            WALKSETS.push(rects);
        }
        VILLAGES.forEach(function(v){
            var rr6=[];
            v.houses.forEach(function(b){
                if(b.k==="pompiers"||b.k==="hopital") return;
                rr6.push({x:b.x,y:b.y,w:b.w,h:b.h}); });
            FIREHOUSES.forEach(function(o){ if(o.city&&dist2(o.x,o.y,v.x,v.y)<v.r*v.r*1.6)
                rr6.push({x:o.x-44,y:o.y-34,w:88,h:50}); });
            HOSPITALS.forEach(function(o){ if(o.city&&dist2(o.x,o.y,v.x,v.y)<v.r*v.r*1.6)
                rr6.push({x:o.x-61,y:o.y-44,w:122,h:64}); });
            rr6.push({x:v.well.x-9,y:v.well.y-9,w:18,h:18});
            walkNet(rr6);
        });
        PORTS.forEach(function(p){
            var rr7=[];
            p.bld.forEach(function(b){ rr7.push({x:b.x,y:b.y,w:b.w,h:b.h}); });
            HANGARS.forEach(function(o){ if(o.port&&dist2(o.x,o.y,p.x,p.y)<300*300)
                rr7.push({x:o.x-53,y:o.y-40,w:106,h:56}); });
            walkNet(rr7);
        });
        FIREHOUSES.forEach(function(o){ if(!o.city) belt(o.x-44,o.y-34,88,50); });
        HOSPITALS.forEach(function(o){ if(!o.city) belt(o.x-61,o.y-44,122,64); });
        HANGARS.forEach(function(o){ if(!o.city&&!o.port) belt(o.x-53,o.y-40,106,56); });
        ARMYBASES.forEach(function(o){ belt(o.fx,o.fy,o.fw,o.fh); });
        DUNGEONS.forEach(function(o){ belt(o.x-72,o.y-84,144,90); });
        FARMS.forEach(function(f){ belt(f.bx,f.by,40,32); });
    })();
    /* ---- ELAGAGE DES VOIES ----
       Les sentiers de desserte sont traces avant que les batiments ne soient
       eleves. On coupe donc, en fin de course, tout troncon qui passerait sous
       un mur : le chemin s'arrete proprement au pied du batiment. */
    (function(){
        var rects=BLDRECTS, q, z;
        /* Chaque emprise devient une porte : un nom, et une serrure une fois
           sur trois dont le crochetage prend de 2 a 10 secondes. */
        /* Les edifices publics sont tous fermes. Commissariat, armurerie et
           caserne militaire ont les meilleures serrures : 10 s de crochetage.
           Les hangars restent ouverts, les habitations une fois sur trois. */
        var HARD={police:1,armurerie:1,armee:1};
        /* lt : la nature du lieu au sens de la fouille. Elle est plus fine
           que k, qui ne dit que la serrure : c'est elle qui commande le
           nombre de pieces et la table des trouvailles. lock0 garde la
           serrure d'origine, sans quoi une porte crochetee une partie
           resterait ouverte a la suivante. */
        function add(x,y,w,h,nm,kind,lt,bz){
            var k8=kind||"", lk, pk;
            if(HARD[k8]){ lk=true; pk=10; }
            else if(k8==="hangar"){ lk=false; pk=0; }
            else if(k8==="public"){ lk=true; pk=Rr(4,9); }
            else { lk=(R()<0.34); pk=Rr(2,6); }
            rects.push({x:x,y:y,w:w,h:h,nm:nm||"",lock:lk,lock0:lk,pick:pk,
                        k:k8,lt:lt||"maison",biz:bz||""});
        }
        function bkind(k9){
            if(k9==="police") return "police";
            if(k9==="armurerie") return "armurerie";
            if(k9==="maison"||k9.indexOf("immeuble")===0) return "";
            return "public";
        }
        function bloot(k9){
            if(k9.indexOf("immeuble")===0) return "immeuble";
            return k9||"maison";
        }
        /* Le nom qui s'affichera a la porte. L'enseigne prime sur tout : on
           entre chez "la Boulangerie Corbin", pas dans "une maison". Sinon
           l'immeuble donne son adresse et la maison reste une maison. */
        function hbz(b){ return b.biz||""; }
        function hnm(b){
            /* PLUS DE NOM GENERIQUE. Un batiment se nomme par son enseigne, son
               adresse, ou le nom propre de l'edifice public - jamais par sa
               categorie. "une maison" ne disait rien ; a defaut de nom propre
               on ne rend rien, et l'affichage retombe sur le lieu-dit. */
            if(b.ens) return b.ens;
            if(b.adr) return "le "+b.adr;
            if(BLDNAME[b.k]) return BLDNAME[b.k];
            return "";
        }
        VILLAGES.forEach(function(v){ v.houses.forEach(function(b){
            add(b.x,b.y,b.w,b.h,hnm(b),bkind(b.k),bloot(b.k),hbz(b)); }); });
        PORTS.forEach(function(p){ p.bld.forEach(function(b){
            add(b.x,b.y,b.w,b.h,hnm(b),bkind(b.k),bloot(b.k),hbz(b)); }); });
        FARMS.forEach(function(f){ add(f.bx,f.by,40,32,"","","ferme"); });
        /* l'enceinte de la caserne est une emprise a part entiere : aucune
           voie ne traverse le terre-plein, elle s'arrete a la cloture */
        ARMYBASES.forEach(function(o){ add(o.fx,o.fy,o.fw,o.fh,"la caserne militaire","armee","armee"); });
        FIREHOUSES.forEach(function(o){ add(o.x-44,o.y-34,88,50,"la caserne de pompiers","public","pompiers"); });
        HOSPITALS.forEach(function(o){ add(o.x-61,o.y-44,122,64,"l'hopital","public","hopital"); });
        HANGARS.forEach(function(o){ add(o.x-53,o.y-40,106,56,"un hangar","hangar","hangar"); });
        SHELTERS.forEach(function(o){ add(o.x-15,o.y-14,30,20,
            o.t==="tente"?"une tente":"un abri de planches","hangar","abri"); });
        DUNGEONS.forEach(function(o){ add(o.x-72,o.y-84,144,90,"le chateau","public","chateau"); });
        /* les tours de guet en bois s'ouvrent aussi : echelle et plancher */
        GUARDS.forEach(function(o){ add(o.x-9,o.y-9,18,18,"une tour de guet","hangar","guet"); });
        /* la largeur de la voie compte : on dilate le rectangle d'une demi-voie */
        function under(sg){
            var dx=sg.x2-sg.x1, dy=sg.y2-sg.y1, hw=sg.w/2;
            var l=Math.hypot(dx,dy), n=Math.max(1,Math.ceil(l/4)), t, px, py, r;
            for(z=0;z<=n;z++){ t=z/n; px=sg.x1+dx*t; py=sg.y1+dy*t;
                for(q=0;q<rects.length;q++){ r=rects[q];
                    if(px>r.x-hw&&px<r.x+r.w+hw&&py>r.y-hw&&py<r.y+r.h+hw) return true; } }
            return false;
        }
        ROADS=ROADS.filter(function(sg){ return !under(sg); });
        PATHS=PATHS.filter(function(sg){ return !under(sg); });
        WALKS=WALKS.filter(function(sg){ return !under(sg); });
        /* une ceinture ne passe pas non plus sur un arbre, un bloc ou un champ */
        var frects=[];
        FARMS.forEach(function(f){ f.fields.forEach(function(fd){ frects.push(fd); }); });
        function onDecor(sg){
            var dx=sg.x2-sg.x1, dy=sg.y2-sg.y1, hw=sg.w/2;
            var l=Math.hypot(dx,dy), n=Math.max(1,Math.ceil(l/5)), t, px, py, z2;
            for(z2=0;z2<=n;z2++){ t=z2/n; px=sg.x1+dx*t; py=sg.y1+dy*t;
                if(hitObstacle(px,py,hw)) return true;
                for(q=0;q<frects.length;q++){ var fr=frects[q];
                    if(px>fr.x-hw&&px<fr.x+fr.w+hw&&py>fr.y-hw&&py<fr.y+fr.h+hw) return true; }
            }
            return false;
        }
        /* les liaisons pietonnes sont l'ossature du reseau : elles ne sont
           pas coupees par un arbre, on passe a cote */
        WALKS=WALKS.filter(function(sg){ return sg.link||!onDecor(sg); });
        /* les ceintures de route et de chemin suivent la meme regle ; les vraies
           voies, elles, gardent deja leurs distances avec le decor */
        /* seules les ceintures sont elaguees sur le decor : les vraies voies,
           posees avant les arbres et les blocs, gardent deja leurs distances */
        var nr0=ROADS.length, np0=PATHS.length;
        ROADS=ROADS.filter(function(sg){ return !sg.belt||!onDecor(sg); });
        PATHS=PATHS.filter(function(sg){ return !sg.belt||!onDecor(sg); });
        TRIMSTAT={roads:nr0-ROADS.length,paths:np0-PATHS.length,r0:nr0,p0:np0};
    })();
    /* ---- MAILLAGE PIETON ----
       Une seule vague de propagation par agglomeration : on quadrille le bourg
       en cases de 8 px, on marque celles qu'occupent murs, arbres et blocs, et
       on diffuse une distance depuis la place centrale. Chaque batiment
       redescend ensuite la pente jusqu'au reseau deja trace : les chemins se
       rejoignent d'eux-memes, et aucun batiment ne reste a l'ecart. */
    (function(){
        var CELL=8;
        WALKSETS.forEach(function(rects){
            var n=rects.length, i3, j3;
            if(n<2) return;
            var x0=1e9, y0=1e9, x1=-1e9, y1=-1e9;
            for(i3=0;i3<n;i3++){
                x0=Math.min(x0,rects[i3].x); y0=Math.min(y0,rects[i3].y);
                x1=Math.max(x1,rects[i3].x+rects[i3].w); y1=Math.max(y1,rects[i3].y+rects[i3].h);
            }
            x0-=70; y0-=70; x1+=70; y1+=70;
            var gw=Math.ceil((x1-x0)/CELL), gh=Math.ceil((y1-y0)/CELL);
            if(gw<3||gh<3||gw*gh>200000) return;
            var blk=new Uint8Array(gw*gh), dst=new Int32Array(gw*gh), net=new Uint8Array(gw*gh);
            var cx4, cy4, k4;
            for(j3=0;j3<gh;j3++) for(i3=0;i3<gw;i3++){
                cx4=x0+i3*CELL+CELL/2; cy4=y0+j3*CELL+CELL/2;
                /* 8 px de garde : la diagonale entre deux cases ne doit pas
                   pouvoir mordre sur un mur */
                blk[j3*gw+i3]=hitObstacle(cx4,cy4,8)?1:0;
                dst[j3*gw+i3]=-1;
            }
            /* Sources : la chaussee elle-meme. Un trottoir mene a la rue, et
               partir de la rue evite de s'enfermer dans une cour. */
            var qx=new Int32Array(gw*gh), head=0, tail=0, seeded=0;
            for(j3=0;j3<gh;j3++) for(i3=0;i3<gw;i3++){
                if(blk[j3*gw+i3]) continue;
                cx4=x0+i3*CELL+CELL/2; cy4=y0+j3*CELL+CELL/2;
                if(!onWay(ROADS,cx4,cy4,2)&&!onWay(PATHS,cx4,cy4,2)) continue;
                dst[j3*gw+i3]=0; qx[tail++]=j3*gw+i3; seeded++;
            }
            if(!seeded){
                var mcx=(x0+x1)/2, mcy=(y0+y1)/2, si=-1, sd=1e9;
                for(j3=0;j3<gh;j3++) for(i3=0;i3<gw;i3++){
                    if(blk[j3*gw+i3]) continue;
                    var dd6=dist2(x0+i3*CELL,y0+j3*CELL,mcx,mcy);
                    if(dd6<sd){ sd=dd6; si=j3*gw+i3; }
                }
                if(si<0) return;
                dst[si]=0; qx[tail++]=si;
            }
            var DX=[1,-1,0,0,1,1,-1,-1], DY=[0,0,1,-1,1,-1,1,-1];
            while(head<tail){
                var cur=qx[head++], ci=cur%gw, cj=(cur/gw)|0;
                for(k4=0;k4<8;k4++){
                    var ni=ci+DX[k4], nj=cj+DY[k4];
                    if(ni<0||nj<0||ni>=gw||nj>=gh) continue;
                    var nid=nj*gw+ni;
                    if(blk[nid]||dst[nid]>=0) continue;
                    dst[nid]=dst[cur]+1; qx[tail++]=nid;
                }
            }

            /* chaque batiment redescend la pente jusqu'au reseau */
            function freeNear(px4,py4){
                var bi=-1, bd2=1e9, ri, rj, ii, jj, id;
                ri=Math.round((px4-x0)/CELL); rj=Math.round((py4-y0)/CELL);
                for(jj=rj-5;jj<=rj+5;jj++) for(ii=ri-5;ii<=ri+5;ii++){
                    if(ii<0||jj<0||ii>=gw||jj>=gh) continue;
                    id=jj*gw+ii;
                    if(blk[id]||dst[id]<0) continue;
                    var d7=dist2(x0+ii*CELL,y0+jj*CELL,px4,py4);
                    if(d7<bd2){ bd2=d7; bi=id; }
                }
                return bi;
            }
            /* Les anneaux poses autour de chaque batiment sont deja des
               trottoirs. Un batiment qui descend vers la chaussee n'a donc pas
               a doubler celui du voisin : il s'y arrete. Pour qu'aucune grappe
               ne se referme sur elle-meme, on traite les batiments du plus
               proche de la chaussee au plus loin, et l'on ne se raccroche qu'a
               un anneau deja relie, jamais l'inverse. */
            var byBld={}, qb;
            for(qb=0;qb<WALKS.length;qb++)
                if(WALKS[qb].bld!==undefined){
                    if(!byBld[WALKS[qb].bld]) byBld[WALKS[qb].bld]=[];
                    byBld[WALKS[qb].bld].push(WALKS[qb]);
                }
            function stampCell(px7,py7){
                var ii7=Math.round((px7-x0)/CELL), jj7=Math.round((py7-y0)/CELL), ai, aj;
                for(aj=jj7-1;aj<=jj7+1;aj++) for(ai=ii7-1;ai<=ii7+1;ai++){
                    if(ai<0||aj<0||ai>=gw||aj>=gh) continue;
                    net[aj*gw+ai]=1;
                }
            }
            function stampRing(bid){
                var lst=byBld[bid], q7, s7, dx7, dy7, l7, n7, z7, t7;
                if(!lst) return;
                for(q7=0;q7<lst.length;q7++){
                    s7=lst[q7]; dx7=s7.x2-s7.x1; dy7=s7.y2-s7.y1;
                    l7=Math.hypot(dx7,dy7); n7=Math.max(1,Math.ceil(l7/(CELL/2)));
                    for(z7=0;z7<=n7;z7++){ t7=z7/n7;
                        stampCell(s7.x1+dx7*t7,s7.y1+dy7*t7); }
                }
            }
            var starts=[], order=[];
            for(i3=0;i3<n;i3++){
                var r4=rects[i3];
                var s4=freeNear(r4.x+r4.w/2,r4.y+r4.h+16);
                if(s4<0) s4=freeNear(r4.x+r4.w/2,r4.y-16);
                if(s4<0) s4=freeNear(r4.x-16,r4.y+r4.h/2);
                if(s4<0) s4=freeNear(r4.x+r4.w+16,r4.y+r4.h/2);
                starts[i3]=s4;
                if(s4<0){ MESHSTAT.nostart++; continue; }
                order.push(i3);
            }
            order.sort(function(a4,b4){ return dst[starts[a4]]-dst[starts[b4]]; });
            for(var oi=0;oi<order.length;oi++){
                i3=order[oi];
                var r5=rects[i3];
                var st=starts[i3];
                /* amorce : du pied du batiment jusqu'a la premiere case libre,
                   pour qu'aucune facade ne se retrouve sans trottoir */
                var sx6=x0+(st%gw)*CELL+CELL/2, sy6=y0+((st/gw)|0)*CELL+CELL/2;
                /* l'amorce part de l'anneau, du cote ou se trouve la case,
                   pour ne jamais retraverser le batiment */
                var ccx=r5.x+r5.w/2, ccy=r5.y+r5.h/2;
                var vdx=sx6-ccx, vdy=sy6-ccy, vdl=Math.hypot(vdx,vdy)||1;
                vdx/=vdl; vdy/=vdl;
                var tex=(r5.w/2+11)/Math.max(0.000001,Math.abs(vdx));
                var tey=(r5.h/2+11)/Math.max(0.000001,Math.abs(vdy));
                var tee=Math.min(tex,tey);
                var ax6=ccx+vdx*tee, ay6=ccy+vdy*tee;
                if(dist2(sx6,sy6,ax6,ay6)>9)
                    WALKS.push({x1:ax6,y1:ay6,x2:sx6,y2:sy6,w:11,belt:1,link:1});
                var pathc=[st], cur2=st, guard4=0;
                while(dst[cur2]>0&&!net[cur2]&&guard4++<6000){
                    var bi2=-1, bv=dst[cur2], ci2=cur2%gw, cj2=(cur2/gw)|0;
                    var bn2=-1, bnv=1e9;
                    for(k4=0;k4<8;k4++){
                        var mi=ci2+DX[k4], mj=cj2+DY[k4];
                        if(mi<0||mj<0||mi>=gw||mj>=gh) continue;
                        var mid=mj*gw+mi;
                        if(blk[mid]||dst[mid]<0) continue;
                        /* un trottoir deja trace juste a cote : on s'y raccorde
                           au lieu de courir en parallele a huit pixels */
                        if(net[mid]&&dst[mid]<=dst[cur2]+1&&dst[mid]<bnv){ bnv=dst[mid]; bn2=mid; }
                        if(dst[mid]<bv){ bv=dst[mid]; bi2=mid; }
                    }
                    if(bn2>=0) bi2=bn2;
                    if(bi2<0) break;
                    cur2=bi2; pathc.push(cur2);
                }
                /* on marque le trajet comme reseau, avec une case de garde tout
                   autour : le voisin s'y rabat au lieu de poser son propre ruban */
                for(k4=0;k4<pathc.length;k4++){
                    var pn2=pathc[k4], pi2=pn2%gw, pj2=(pn2/gw)|0, ni2, nj2;
                    for(nj2=pj2-1;nj2<=pj2+1;nj2++) for(ni2=pi2-1;ni2<=pi2+1;ni2++){
                        if(ni2<0||nj2<0||ni2>=gw||nj2>=gh) continue;
                        net[nj2*gw+ni2]=1;
                    }
                }
                MESHSTAT.done++;
                /* l'anneau de ce batiment est desormais relie a la chaussee :
                   le suivant pourra s'y arreter au lieu de doubler le ruban */
                stampRing(r5.bid);
                if(pathc.length<2){ MESHSTAT.tiny++; continue; }
                var pts5=[], last=null, dirx=0, diry=0;
                for(k4=0;k4<pathc.length;k4++){
                    var pi=pathc[k4]%gw, pj=(pathc[k4]/gw)|0;
                    var wx5=x0+pi*CELL+CELL/2, wy5=y0+pj*CELL+CELL/2;
                    if(!last){ pts5.push([wx5,wy5]); last=[wx5,wy5]; continue; }
                    var ndx=(wx5>last[0])?1:((wx5<last[0])?-1:0);
                    var ndy=(wy5>last[1])?1:((wy5<last[1])?-1:0);
                    if(ndx!==dirx||ndy!==diry){ pts5.push([wx5,wy5]); dirx=ndx; diry=ndy; }
                    else pts5[pts5.length-1]=[wx5,wy5];
                    last=[wx5,wy5];
                }
                for(k4=0;k4<pts5.length-1;k4++)
                    WALKS.push({x1:pts5[k4][0],y1:pts5[k4][1],
                                x2:pts5[k4+1][0],y2:pts5[k4+1][1],w:11,belt:1,link:1});
            }
        });
    })();
    /* Deuxieme passe : deux batiments voisins sont espaces de 22 px et leurs
       anneaux se frolent, tandis que le maillage vient parfois longer un
       anneau a quelques pixels. On se retrouve alors avec trois ou cinq
       rubans cote a cote pour un seul passage. Tout troncon entierement
       double par un troncon deja garde, a moins de six pixels, est redondant :
       la matiere est deja peinte, on le retire. */
    (function(){
        var keep=[], q1, z1, sg1, o1, n1, k1, t1, px1, py1, cov1;
        for(q1=0;q1<WALKS.length;q1++){
            sg1=WALKS[q1];
            var dx1=sg1.x2-sg1.x1, dy1=sg1.y2-sg1.y1;
            n1=Math.max(2,Math.ceil(Math.hypot(dx1,dy1)/4));
            cov1=true;
            for(k1=0;k1<=n1&&cov1;k1++){
                t1=k1/n1; px1=sg1.x1+dx1*t1; py1=sg1.y1+dy1*t1;
                var hit1=false;
                for(z1=0;z1<keep.length&&!hit1;z1++){
                    o1=keep[z1];
                    if(segD2(px1,py1,o1.x1,o1.y1,o1.x2,o1.y2)<100) hit1=true;
                }
                if(!hit1) cov1=false;
            }
            if(!cov1) keep.push(sg1);
        }
        WALKS=keep;
    })();
    /* Derniere passe : aucun trottoir ne doit courir sous un mur. On accepte
       de perdre quelques bouts de liaison plutot que de violer la regle. */
    (function(){
        var q9, z9, r9;
        function underB(sg){
            var dx=sg.x2-sg.x1, dy=sg.y2-sg.y1, hw=sg.w/2;
            var l=Math.hypot(dx,dy), n=Math.max(1,Math.ceil(l/4)), t, px, py;
            for(z9=0;z9<=n;z9++){ t=z9/n; px=sg.x1+dx*t; py=sg.y1+dy*t;
                for(q9=0;q9<BLDRECTS.length;q9++){ r9=BLDRECTS[q9];
                    if(px>r9.x-hw&&px<r9.x+r9.w+hw&&py>r9.y-hw&&py<r9.y+r9.h+hw) return true; }
            }
            return false;
        }
        WALKS=WALKS.filter(function(sg){ return !underB(sg); });
    })();
    /* ---- MOBILIER URBAIN ----
       Les vides d'un bourg se garnissent : bacs a fleurs, fontaines, statues.
       Rien ne se pose sur une voie, un trottoir, un mur ou un arbre. */
    (function(){
        var q0, k0, v0, a0, d0, mx0, my0, kind0, nb0;
        for(q0=0;q0<VILLAGES.length;q0++){
            v0=VILLAGES[q0];
            nb0=6+Math.round(v0.houses.length*0.5);
            for(k0=0;k0<nb0;k0++){
                var placed=false, tries0;
                for(tries0=0;tries0<40&&!placed;tries0++){
                    a0=Rr(0,6.283); d0=v0.r*Math.sqrt(Rr(0,1));
                    mx0=v0.x+Math.cos(a0)*d0; my0=v0.y+Math.sin(a0)*d0;
                    if(onRoad(mx0,my0,20)) continue;
                    if(hitObstacle(mx0,my0,22)) continue;
                    if(wetAt(mx0,my0)) continue;
                    placed=true;
                }
                if(!placed) continue;
                /* une fontaine ou une statue par bourg au plus, le reste en bacs */
                kind0="bac";
                if(k0===0&&v0.houses.length>8) kind0="fontaine";
                else if(k0===1&&v0.houses.length>12) kind0="statue";
                CITYDECO.push({x:mx0,y:my0,k:kind0,s:(R()*3)|0});
                if(kind0==="fontaine") wall(mx0-17,my0-13,34,26);
                else if(kind0==="statue") wall(mx0-8,my0-7,16,14);
                else wall(mx0-9,my0-5,18,10);
            }
        }
    })();
    /* les arbres de bourg, maintenant que le reseau pieton est fige */
    (function(){
        var q7, k7, ta7, td7, tx7, ty7, pt;
        for(q7=0;q7<PENDTREE.length;q7++){
            pt=PENDTREE[q7];
            for(j=0;j<pt.n;j++){
                for(k7=0;k7<26;k7++){
                    ta7=Rr(0,6.283); td7=Rr(40,pt.d*1.05);
                    tx7=pt.x+Math.cos(ta7)*td7; ty7=pt.y+Math.sin(ta7)*td7;
                    if(onRoad(tx7,ty7,13)) continue;
                    if(hitObstacle(tx7,ty7,13)) continue;
                    if(wetAt(tx7,ty7)) continue;
                    if(dist2(tx7,ty7,pt.wx,pt.wy)<30*30) continue;
                    tree(tx7,ty7); break;
                }
            }
        }
    })();
    /* arbres isoles en remplissage */
    for(i=0;i<120;i++){
        x=Rr(60,CFG.WORLD-60); y=Rr(60,CFG.WORLD-60);
        if(!farFromCenter(x,y,200)||hitObstacle(x,y,12)) continue;
        var bad2=false;
        for(j=0;j<VILLAGES.length;j++) if(dist2(x,y,VILLAGES[j].x,VILLAGES[j].y)<170*170){ bad2=true; break; }
        if(!bad2) tree(x,y);
    }
    /* ---- PONTS ET GUES ----
       L'eau est generee apres le reseau : on releve donc a la fin les portions
       de voie qui la franchissent. Une route recoit un pont, un chemin de terre
       recoit un gue de pierres. Le joueur n'y est ni ralenti ni mordu. */
    function wetAt(wx,wy){
        if(inSea(wx,wy)) return true;
        var q,z,bb,cc;
        for(q=0;q<SWAMPS.length;q++){ bb=SWAMPS[q];
            if(!bb.water) continue;
            if(wx<bb.x0||wx>bb.x1||wy<bb.y0||wy>bb.y1) continue;
            for(z=0;z<bb.length;z++) if(inBlob(bb[z],wx,wy)) return true; }
        return false;
    }
    function wetDisc(cx2,cy2,rd2){
        var q, a5;
        if(wetAt(cx2,cy2)) return true;
        for(q=0;q<10;q++){ a5=q/10*6.283;
            if(wetAt(cx2+Math.cos(a5)*rd2,cy2+Math.sin(a5)*rd2)) return true; }
        return false;
    }
    function dryPts(pts){
        for(var q=0;q<pts.length;q++) if(wetAt(pts[q].x,pts[q].y)) return false;
        return true;
    }
    /* Un croisement de voies ne doit jamais tomber dans l'eau : on refuse une
       voie dont un point mouille tombe sur une autre voie deja posee. */
    function wetJunction(pts){
        var q, z, o, r2, lists=[ROADS,PATHS], li;
        for(q=0;q<pts.length;q++){
            if(!wetAt(pts[q].x,pts[q].y)) continue;
            for(li=0;li<2;li++) for(z=0;z<lists[li].length;z++){
                o=lists[li][z]; r2=o.w/2+6;
                if(segD2(pts[q].x,pts[q].y,o.x1,o.y1,o.x2,o.y2)<r2*r2) return true;
            }
        }
        return false;
    }
    function wetRect(rx,ry,rw,rh){
        var sx2, sy2;
        for(sx2=rx;sx2<=rx+rw;sx2+=6) for(sy2=ry;sy2<=ry+rh;sy2+=6)
            if(wetAt(sx2,sy2)) return true;
        return false;
    }
    /* Decale un centre de batiment jusqu'a le sortir de l'eau ET de la
       chaussee : aucune voie ne doit passer sous un batiment. Son sentier ayant
       ete trace depuis l'emplacement reserve, on rattache le batiment deplace a
       son point d'origine pour ne pas laisser de chemin orphelin. */
    function dryOut(o,bw,bh){
        var q, a3, ox=o.x, oy=o.y;
        for(q=0;q<120&&wetRect(o.x-bw/2-8,o.y-bh/2-8,bw+16,bh+16);q++){
            a3=Rr(0,6.28);
            o.x=clamp(o.x+Math.cos(a3)*30,CFG.SEA_BAND+90+bw,CFG.WORLD-CFG.SEA_BAND-90-bw);
            o.y=clamp(o.y+Math.sin(a3)*30,CFG.SEA_BAND+90+bh,CFG.WORLD-CFG.SEA_BAND-90-bh);
        }
        if(dist2(ox,oy,o.x,o.y)>24*24)
            pushWay(PATHS,wavyPts(o.x,o.y,ox,oy,26),PATH_W);
        return o;
    }
    function crossings(list,kind,w){
        var q,z,s2,dx,dy,l,n,t0,t1,st,wet,prev,m0,m1;
        for(q=0;q<list.length;q++){
            s2=list[q]; dx=s2.x2-s2.x1; dy=s2.y2-s2.y1;
            l=Math.hypot(dx,dy); if(l<1) continue;
            n=Math.ceil(l/5); prev=false; st=0;
            for(z=0;z<=n;z++){
                t0=z/n;
                wet=wetAt(s2.x1+dx*t0,s2.y1+dy*t0);
                if(wet&&!prev) st=t0;
                if((prev&&!wet)||(wet&&z===n)){
                    t1=wet?1:t0;
                    m0=Math.max(0,st-7/l); m1=Math.min(1,t1+7/l);
                    BRIDGES.push({x1:s2.x1+dx*m0,y1:s2.y1+dy*m0,
                                  x2:s2.x1+dx*m1,y2:s2.y1+dy*m1,w:w,k:kind});
                }
                prev=wet;
            }
        }
    }
    /* ---- ELAGAGE DES HERBES HAUTES ----
       Une nappe cachee sous les paves d'un bourg, sous le beton d'un port ou
       sous une chaussee freinerait le joueur sans qu'il voie rien. */
    (function(){
        var q, z, c, keep;
        for(q=0;q<GRASS.length;q++){
            keep=[];
            for(z=0;z<GRASS[q].length;z++){
                c=GRASS[q][z];
                if(inBuiltZone(c.x,c.y,c.r*0.55)) continue;
                if(onRoad(c.x,c.y,c.r*0.5)) continue;
                var inPort=false, pz3;
                for(pz3=0;pz3<PORTS.length;pz3++)
                    if(dist2(c.x,c.y,PORTS[pz3].x,PORTS[pz3].y)<(215+c.r*0.55)*(215+c.r*0.55)) inPort=true;
                if(inPort) continue;
                var inVil=false, vz3;
                for(vz3=0;vz3<VSPOT.length;vz3++)
                    if(dist2(c.x,c.y,VSPOT[vz3].x,VSPOT[vz3].y)<
                       (VSPOT[vz3].r*1.06+c.r*0.55)*(VSPOT[vz3].r*1.06+c.r*0.55)) inVil=true;
                if(inVil) continue;
                keep.push(c);
            }
            GRASS[q]=keep;
        }
        GRASS=GRASS.filter(function(b){ return b.length>0; });
        for(q=0;q<GRASS.length;q++) bbox(GRASS[q]);
    })();
    /* ---- VOIES QUI FONT DOUBLE EMPLOI ----
       Un chemin de terre qui vient longer une chaussee ne sert a rien : tout
       troncon qui la double, dans la meme direction et a moins de 60 px,
       disparait. Il ne reste qu'une voie dans le couloir. */
    (function(){
        function alongRoad(a){
            var y, o, al, ol, cs, mx, my, dx, dy, l2, t, cx2, cy2;
            al=Math.hypot(a.x2-a.x1,a.y2-a.y1);
            if(al<0.01) return false;
            mx=(a.x1+a.x2)/2; my=(a.y1+a.y2)/2;
            for(y=0;y<ROADS.length;y++){
                o=ROADS[y];
                if(o.belt) continue;
                dx=o.x2-o.x1; dy=o.y2-o.y1; l2=dx*dx+dy*dy;
                if(l2<1) continue;
                ol=Math.sqrt(l2);
                cs=((a.x2-a.x1)*dx+(a.y2-a.y1)*dy)/(al*ol);
                if(cs<0.94&&cs>-0.94) continue;
                t=((mx-o.x1)*dx+(my-o.y1)*dy)/l2;
                if(t<0.05||t>0.95) continue;
                cx2=o.x1+dx*t; cy2=o.y1+dy*t;
                if(Math.hypot(mx-cx2,my-cy2)<60) return true;
            }
            return false;
        }
        PATHS=PATHS.filter(function(s2){ return s2.belt||!alongRoad(s2); });
    })();
    /* ---- RONDS-POINTS ----
       La ou une chaussee est franchement coupee par une autre voie, on
       installe un giratoire : anneau de bitume et terre-plein central que
       l'on doit contourner. La passe vient apres l'elagage, donc aucun
       giratoire ne se pose sur un troncon qui va disparaitre. */
    (function(){
        function segX(a,b){
            var rx=a.x2-a.x1, ry=a.y2-a.y1, sx=b.x2-b.x1, sy=b.y2-b.y1;
            var den=rx*sy-ry*sx;
            if(den<0.0001&&den>-0.0001) return null;
            var t=((b.x1-a.x1)*sy-(b.y1-a.y1)*sx)/den;
            var u=((b.x1-a.x1)*ry-(b.y1-a.y1)*rx)/den;
            if(t<0||t>1||u<0||u>1) return null;
            return {x:a.x1+rx*t,y:a.y1+ry*t};
        }
        /* le giratoire est un disque : c'est tout le disque qui doit etre au
           sec, pas seulement son centre */
        function dryRound(x,y,r){
            var k3, a3;
            if(inSea(x,y)||inSwamp(x,y)) return false;
            for(k3=0;k3<12;k3++){
                a3=k3/12*6.283;
                if(inSea(x+Math.cos(a3)*(r+4),y+Math.sin(a3)*(r+4))) return false;
                if(inSwamp(x+Math.cos(a3)*(r+4),y+Math.sin(a3)*(r+4))) return false;
                if(inSea(x+Math.cos(a3)*r*0.6,y+Math.sin(a3)*r*0.6)) return false;
                if(inSwamp(x+Math.cos(a3)*r*0.6,y+Math.sin(a3)*r*0.6)) return false;
            }
            return true;
        }
        var others=ROADS.concat(PATHS);
        var q,z,a,b,pt,k,bad,al,bl,cs;
        for(q=0;q<ROADS.length;q++){
            a=ROADS[q];
            if(a.belt) continue;
            for(z=0;z<others.length;z++){
                b=others[z];
                if(b===a||b.belt) continue;
                /* deux troncons voisins d'une meme polyligne se touchent sans
                   se croiser : ce n'est pas une intersection */
                if((a.x2===b.x1&&a.y2===b.y1)||(a.x1===b.x2&&a.y1===b.y2)) continue;
                if((a.x1===b.x1&&a.y1===b.y1)||(a.x2===b.x2&&a.y2===b.y2)) continue;
                al=Math.hypot(a.x2-a.x1,a.y2-a.y1)||1;
                bl=Math.hypot(b.x2-b.x1,b.y2-b.y1)||1;
                cs=((a.x2-a.x1)*(b.x2-b.x1)+(a.y2-a.y1)*(b.y2-b.y1))/(al*bl);
                /* un croisement rasant ne merite pas un giratoire */
                if(cs>0.74||cs<-0.74) continue;
                pt=segX(a,b);
                if(!pt) continue;
                if(pt.x<190||pt.y<190||pt.x>CFG.WORLD-190||pt.y>CFG.WORLD-190) continue;
                if(!dryRound(pt.x,pt.y,36)) continue;
                if(onCrossing(pt.x,pt.y)) continue;
                bad=false;
                for(k=0;k<VSPOT.length;k++)
                    if(dist2(pt.x,pt.y,VSPOT[k].x,VSPOT[k].y)<
                       (VSPOT[k].r+40)*(VSPOT[k].r+40)) bad=true;
                for(k=0;!bad&&k<BLDRECTS.length;k++){
                    var br=BLDRECTS[k];
                    if(pt.x>br.x-46&&pt.x<br.x+br.w+46&&
                       pt.y>br.y-46&&pt.y<br.y+br.h+46) bad=true;
                }
                for(k=0;!bad&&k<ROUNDS.length;k++)
                    if(dist2(pt.x,pt.y,ROUNDS[k].x,ROUNDS[k].y)<210*210) bad=true;
                if(bad) continue;
                ROUNDS.push({x:pt.x,y:pt.y,r:36});
                /* terre-plein central : on le contourne */
                var isl={x:pt.x,y:pt.y,r:13};
                OC.push(isl); regObst(isl,false);
            }
        }
        /* fourches en T : une voie qui meurt sur une chaussee est une
           intersection elle aussi, tant qu'elle l'aborde de biais */
        function freePoint(x,y){
            var k2, br2;
            if(x<190||y<190||x>CFG.WORLD-190||y>CFG.WORLD-190) return false;
            if(!dryRound(x,y,36)||onCrossing(x,y)) return false;
            for(k2=0;k2<VSPOT.length;k2++)
                if(dist2(x,y,VSPOT[k2].x,VSPOT[k2].y)<
                   (VSPOT[k2].r+40)*(VSPOT[k2].r+40)) return false;
            for(k2=0;k2<BLDRECTS.length;k2++){ br2=BLDRECTS[k2];
                if(x>br2.x-46&&x<br2.x+br2.w+46&&y>br2.y-46&&y<br2.y+br2.h+46) return false; }
            for(k2=0;k2<ROUNDS.length;k2++)
                if(dist2(x,y,ROUNDS[k2].x,ROUNDS[k2].y)<210*210) return false;
            return true;
        }
        var tj=PATHS.concat(ROADS), e2, ex2, ey2;
        for(q=0;q<tj.length&&ROUNDS.length<6;q++){
            b=tj[q];
            if(b.belt) continue;
            bl=Math.hypot(b.x2-b.x1,b.y2-b.y1)||1;
            for(e2=0;e2<2;e2++){
                ex2=e2?b.x2:b.x1; ey2=e2?b.y2:b.y1;
                for(z=0;z<ROADS.length;z++){
                    a=ROADS[z];
                    if(a===b||a.belt) continue;
                    al=Math.hypot(a.x2-a.x1,a.y2-a.y1)||1;
                    if(segD2(ex2,ey2,a.x1,a.y1,a.x2,a.y2)>(a.w/2+6)*(a.w/2+6)) continue;
                    cs=((a.x2-a.x1)*(b.x2-b.x1)+(a.y2-a.y1)*(b.y2-b.y1))/(al*bl);
                    if(cs>0.74||cs<-0.74) continue;
                    if(!freePoint(ex2,ey2)) continue;
                    ROUNDS.push({x:ex2,y:ey2,r:36});
                    var isl2={x:ex2,y:ey2,r:13};
                    OC.push(isl2); regObst(isl2,false);
                    break;
                }
            }
        }
    })();
    /* ---- PASSAGES PIETONS ----
       Un trottoir qui coupe une chaussee la traverse en zebre. Seules les
       routes goudronnees en recoivent : on ne zebre pas un chemin de terre. */
    (function(){
        var lists=[ROADS], li, q, z, wk, rd, k5;
        for(q=0;q<WALKS.length;q++){ wk=WALKS[q];
            if(!wk.link) continue;
            var ends=[[wk.x1,wk.y1],[wk.x2,wk.y2]], e5;
            for(e5=0;e5<2;e5++){
                var ex5=ends[e5][0], ey5=ends[e5][1], hit=null;
                for(li=0;li<lists.length&&!hit;li++) for(z=0;z<lists[li].length;z++){
                    rd=lists[li][z];
                    if(rd.belt) continue;
                    var rr9=rd.w/2+8;
                    if(segD2(ex5,ey5,rd.x1,rd.y1,rd.x2,rd.y2)<rr9*rr9){ hit=rd; break; }
                }
                if(!hit) continue;
                /* le zebre traverse la chaussee : sans trottoir en face, le
                   pieton ne traverse rien et le marquage n'a pas lieu d'etre */
                var rx9=hit.x2-hit.x1, ry9=hit.y2-hit.y1, rn9=Math.hypot(rx9,ry9)||1;
                var nx9=-ry9/rn9, ny9=rx9/rn9;
                var sd9=((ex5-hit.x1)*nx9+(ey5-hit.y1)*ny9)<0?-1:1;
                var tq9=((ex5-hit.x1)*rx9+(ey5-hit.y1)*ry9)/(rn9*rn9);
                tq9=tq9<0?0:(tq9>1?1:tq9);
                var mx9=hit.x1+rx9*tq9, my9=hit.y1+ry9*tq9;
                var far=false, st9;
                for(st9=0;st9<=9&&!far;st9++){
                    var off9=-sd9*(hit.w/2+6+st9*4);
                    if(onWay(WALKS,mx9+nx9*off9,my9+ny9*off9,3)) far=true;
                }
                if(!far) continue;
                /* et l'on n'aligne pas cinq passages cote a cote */
                var dup=false;
                for(k5=0;k5<ZEBRAS.length;k5++)
                    if(dist2(ex5,ey5,ZEBRAS[k5].x,ZEBRAS[k5].y)<150*150) dup=true;
                if(dup) continue;
                /* le zebre traverse la chaussee : ux,uy est le sens de la
                   marche, donc perpendiculaire a la route, et il est centre
                   sur l'axe de celle-ci et non sur le bord du trottoir */
                var rdx=hit.x2-hit.x1, rdy=hit.y2-hit.y1, rl9=Math.hypot(rdx,rdy)||1;
                var tp9=((ex5-hit.x1)*rdx+(ey5-hit.y1)*rdy)/(rl9*rl9);
                tp9=tp9<0?0:(tp9>1?1:tp9);
                ZEBRAS.push({x:hit.x1+rdx*tp9,y:hit.y1+rdy*tp9,
                    ux:-rdy/rl9,uy:rdx/rl9,w:hit.w});
            }
        }
    })();
    /* ---- REGLAGE DES PANNEAUX ----
       Un panneau plante au milieu de la chaussee n'a pas de sens : une fois
       toutes les voies connues, on le decale sur le bas-cote. */
    (function(){
        var q8, s8, k8, a8, d8, nx8, ny8;
        for(q8=0;q8<SIGNS.length;q8++){
            s8=SIGNS[q8];
            if(!s8.post) continue;
            if(!onRoad(s8.x,s8.y,9)&&!wetAt(s8.x,s8.y)&&!hitObstacle(s8.x,s8.y,9)) continue;
            for(k8=0;k8<80;k8++){
                a8=Rr(0,6.283); d8=16+k8*1.6;
                nx8=clamp(s8.x+Math.cos(a8)*d8,40,CFG.WORLD-40);
                ny8=clamp(s8.y+Math.sin(a8)*d8,40,CFG.WORLD-40);
                if(onRoad(nx8,ny8,9)||wetAt(nx8,ny8)||hitObstacle(nx8,ny8,9)) continue;
                s8.x=nx8; s8.y=ny8; break;
            }
        }
    })();
    crossings(ROADS,"pont",ROAD_W+10);
    crossings(PATHS,"gue",PATH_W+8);
}
function collide(e,r){
    var Math=DMATH;
    var cell=obstAt(e.x,e.y), i;
    for(i=0;i<cell.c.length;i++){
        var c=cell.c[i], d2=dist2(e.x,e.y,c.x,c.y), rr2=c.r+r;
        if(d2<rr2*rr2&&d2>0.01){ var d=Math.sqrt(d2);
            e.x=c.x+(e.x-c.x)/d*rr2; e.y=c.y+(e.y-c.y)/d*rr2; }
    }
    for(i=0;i<cell.r.length;i++){
        var o=cell.r[i];
        var qx=clamp(e.x,o.x,o.x+o.w), qy=clamp(e.y,o.y,o.y+o.h);
        var dx=e.x-qx, dy=e.y-qy, dd=dx*dx+dy*dy;
        if(dd<r*r){
            if(dd>0.01){ var l=Math.sqrt(dd); e.x=qx+dx/l*r; e.y=qy+dy/l*r; }
            else e.y=o.y-r;
        }
    }
}
/* La cote n'est pas droite : la profondeur de la mer ondule le long de
   chaque bord, somme de trois sinusoides tirees au sort avec la carte.
   Cotes : 0 ouest, 1 est, 2 nord, 3 sud. */
var COAST=null;
function coastDepth(t,side){
    if(!COAST) return CFG.SEA_BAND;
    var c=COAST[side];
    return CFG.SEA_BAND
        + c.a1*dsin(t*c.k1+c.p1)
        + c.a2*dsin(t*c.k2+c.p2)
        + c.a3*dsin(t*c.k3+c.p3);
}
function inSea(x,y){
    var W=CFG.WORLD;
    if(x<coastDepth(y,0)) return true;
    if(x>W-coastDepth(y,1)) return true;
    if(y<coastDepth(x,2)) return true;
    if(y>W-coastDepth(x,3)) return true;
    return false;
}
/* Un pont ou un gue porte le joueur : ni boue, ni ocean sous les pieds.
   und : celui qui est passe DESSOUS ne beneficie de rien. Le tablier et
   l'eau occupent la meme case de la carte ; c'est ce drapeau, et lui seul,
   qui dit a quelle hauteur on se trouve. */
function onCrossing(x,y,und){
    var q,o,r;
    if(und) return false;
    for(q=0;q<BRIDGES.length;q++){ o=BRIDGES[q]; r=o.w/2;
        if(segD2(x,y,o.x1,o.y1,o.x2,o.y2)<r*r) return true; }
    return false;
}
/* Une colline est un plateau cerne d'une pente. Monter la pente coute
   80 pour cent de la vitesse, sauf si l'on emprunte une voie. Une fois en
   haut, sur le plateau, on marche normalement. */
function hillRad(h,ang,base){
    return base*(1+h.a1*dsin(ang*3+h.p1)+h.a2*dsin(ang*5+h.p2));
}
/* Emprises habitees, connues hors generation : les hardes s'en tiennent
   toujours eloignees. */
function inSettle(x,y,m){
    var q,s;
    for(q=0;q<SETTLE.length;q++){ s=SETTLE[q];
        if(dist2(x,y,s.x,s.y)<(s.r+m)*(s.r+m)) return true; }
    return false;
}
function onSlope(x,y){
    var q,h,d,a;
    for(q=0;q<HILLS.length;q++){ h=HILLS[q];
        d=dist2(x,y,h.x,h.y);
        if(d>h.rBase*1.2*h.rBase*1.2) continue;
        a=datan2(y-h.y,x-h.x);
        d=Math.sqrt(d);
        if(d>hillRad(h,a,h.rTop)&&d<hillRad(h,a,h.rBase)) return true; }
    return false;
}
/* Le sens de l'aval en un point de pente : vers l'exterieur de la colline,
   loin du sommet (le plateau est en haut, le pied en bas). Renvoie un vecteur
   unite, ou null si l'on n'est pas sur une pente. */
function slopeDown(x,y){
    var q,h,d,a,rt,rb;
    for(q=0;q<HILLS.length;q++){ h=HILLS[q];
        d=dist2(x,y,h.x,h.y);
        if(d>h.rBase*1.2*h.rBase*1.2) continue;
        a=datan2(y-h.y,x-h.x); d=Math.sqrt(d);
        rt=hillRad(h,a,h.rTop); rb=hillRad(h,a,h.rBase);
        if(d>rt&&d<rb){ if(d<1e-4) return null; return {x:(x-h.x)/d, y:(y-h.y)/d}; }
    }
    return null;
}
/* Herbes hautes : elles cachent le bas du corps et freinent d'un cinquieme. */
/* Aucune nappe n'est un disque : le rayon de chaque tache ondule avec
   l'angle, ce qui casse la silhouette de rond pose sur rond. */
function blobR(c,ang){
    return c.r*(1+(c.a1||0)*dsin(ang*3+(c.p1||0))+(c.a2||0)*dsin(ang*5+(c.p2||0)));
}
function inBlob(c,x,y){
    var dx=x-c.x, dy=y-c.y, d=dx*dx+dy*dy, lo=c.r*0.8, hi=c.r*1.2, r;
    if(d>hi*hi) return false;
    if(d<lo*lo) return true;
    r=blobR(c,datan2(dy,dx));
    return d<r*r;
}
function inGrass(x,y){
    var q,z,b;
    for(q=0;q<GRASS.length;q++){ b=GRASS[q];
        if(x<b.x0||x>b.x1||y<b.y0||y>b.y1) continue;
        for(z=0;z<b.length;z++) if(inBlob(b[z],x,y)) return true; }
    return false;
}
/* Sur une chaussee, un chemin ou un trottoir, les herbes hautes n'ont plus
   leur mot a dire : ni freinage, ni rideau de tiges devant le marcheur. */
function inGrassFoot(x,y){
    return inGrass(x,y)&&!onRoad(x,y,0);
}
/* Sens et presence du courant sous les pieds : seules les rivieres coulent,
   les etangs et les lacs sont dormants. */
function flowAt(x,y){
    var q,z,b;
    for(q=0;q<SWAMPS.length;q++){ b=SWAMPS[q];
        if(!b.flow) continue;
        if(x<b.x0||x>b.x1||y<b.y0||y>b.y1) continue;
        for(z=0;z<b.length;z++) if(inBlob(b[z],x,y)) return b[z]; }
    return null;
}
function inSwamp(x,y,und){
    if(inSea(x,y)) return !onCrossing(x,y,und);
    for(var i=0;i<SWAMPS.length;i++){ var b=SWAMPS[i];
        if(x<b.x0||x>b.x1||y<b.y0||y>b.y1) continue;
        for(var j=0;j<b.length;j++)
            if(inBlob(b[j],x,y)) return !onCrossing(x,y,und); }
    return false;
}
/* ---- DESSUS OU DESSOUS ----
   On ne remonte pas d'une riviere sur un pont : la berge se prend a la
   nage, pas le tablier. Mais on peut se laisser tomber du pont dans l'eau,
   et l'on peut s'y tenir a l'abri - sous un tablier, les zombis perdent la
   trace.
   Tout tient a savoir d'ou l'on est entre dans l'emprise du pont : par
   l'eau, on reste dessous ; par la terre, on est dessus. Tant qu'on ne
   sort pas de l'emprise, on ne change pas de hauteur. */
function updUnder(p){
    var now=onCrossing(p.x,p.y,0), was=p.under;
    if(!now) p.under=0;
    else if(!p.inBr) p.under=inSwamp(p.x,p.y,1)?1:0;
    p.inBr=now;
    if(p.under&&!was){
        G.place={n:"Sous le pont",t:2.6};
        logMsg("Vous vous glissez sous le tablier. On ne vous voit plus.","jday");
    } else if(!p.under&&was)
        logMsg("Vous quittez l'abri du pont.","jday");
}
/* Sous un tablier, on est hors de vue : c'est la seule cachette de la
   carte qui coupe la poursuite. */
function pHidden(){ return !!(G&&G.p&&G.p.under); }
function los(x1,y1,x2,y2){
    var Math=DMATH;
    var d=Math.hypot(x2-x1,y2-y1), n=Math.ceil(d/14);
    for(var i=1;i<n;i++){
        var x=x1+(x2-x1)*i/n, y=y1+(y2-y1)*i/n;
        if(hitObstacle(x,y,1)) return false;
    }
    return true;
}
genMap();
wayIndex();

