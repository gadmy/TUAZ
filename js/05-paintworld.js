"use strict";
/* ================================================================
   TUAZ - 05-paintworld.js
   paintWorld : le fond statique du monde peint une fois pour toutes,
   plus le vignettage et la lueur.
   (lignes 5959 a 7761 du mono-fichier d'origine)
   ================================================================ */
/* fond du monde (statique) */
var worldCv=document.createElement("canvas");
worldCv.width=CFG.WORLD; worldCv.height=CFG.WORLD;
/* fond statique : depend des tableaux remplis par genMap, donc rejouable */
function paintWorld(){
    var g=worldCv.getContext("2d"), R=mulberry32(1234), i, j, x, y;
    g.fillStyle="#2b2721"; g.fillRect(0,0,CFG.WORLD,CFG.WORLD);
    for(i=0;i<56000;i++){
        g.fillStyle=["#302a20","#241f1a","#38301f","#2b2721","#2e2b26"][(R()*5)|0];
        g.fillRect((R()*CFG.WORLD)|0,(R()*CFG.WORLD)|0,2,2);
    }
    /* larges plaques de terre nue et de cendre */
    for(i=0;i<340;i++){
        x=(R()*CFG.WORLD)|0; y=(R()*CFG.WORLD)|0;
        var pc=R()<0.5?"#3a3024":"#232019";
        for(j=0;j<40;j++){ g.fillStyle=pc;
            g.fillRect(x+((R()*46)|0),y+((R()*34)|0),4,3); }
    }
    for(i=0;i<160;i++){
        x=(R()*CFG.WORLD)|0; y=(R()*CFG.WORLD)|0;
        for(j=0;j<26;j++){ g.fillStyle=R()<0.5?"#4a3c28":"#42341f";
            g.fillRect(x+((R()*36)|0),y+((R()*24)|0),3,2); }
    }
    /* prairies : la lande n'est pas uniformement brune, de larges nappes
       d'herbe verte la percent */
    for(i=0;i<300;i++){
        x=(R()*CFG.WORLD)|0; y=(R()*CFG.WORLD)|0;
        var prr=50+R()*170, prn=(prr*prr/5)|0, pk;
        var pal2=R()<0.5?["#33421f","#3c4c24","#2b381a"]:["#3a4626","#44522c","#303c20"];
        var pw1=0.10+R()*0.16, pph1=R()*6.283, pw2=0.05+R()*0.08, pph2=R()*6.283;
        function prad(an){ return prr*(1+pw1*Math.sin(an*3+pph1)+pw2*Math.sin(an*5+pph2)); }
        for(pk=0;pk<prn;pk++){
            var pa=R()*6.283, pd=prad(pa)*Math.sqrt(R());
            g.fillStyle=pal2[(R()*3)|0];
            g.fillRect((x+Math.cos(pa)*pd)|0,(y+Math.sin(pa)*pd)|0,3,3);
        }
        /* brins dresses sur la nappe */
        for(pk=0;pk<prn/14;pk++){
            var qa=R()*6.283, qd=prad(qa)*Math.sqrt(R());
            var gx7=(x+Math.cos(qa)*qd)|0, gy7=(y+Math.sin(qa)*qd)|0;
            g.fillStyle=R()<0.5?"#4a5c28":"#556a2e";
            g.fillRect(gx7,gy7,1,3); g.fillRect(gx7+2,gy7+1,1,2);
        }
    }
    /* buissons : petites boules de feuillage semees dans la nature */
    for(i=0;i<3400;i++){
        x=(R()*CFG.WORLD)|0; y=(R()*CFG.WORLD)|0;
        var br=3+((R()*4)|0);
        g.fillStyle="rgba(0,0,0,0.24)";
        g.fillRect(x-br+1,y+br-1,br*2,2);
        var bpal=[["#2e4420","#3c5a2a","#22331a"],
                  ["#3a4a1e","#4c6028","#2a3616"],
                  ["#35402a","#465438","#252c1e"]][(R()*3)|0];
        g.fillStyle=bpal[0];
        g.fillRect(x-br,y-br+1,br*2,br*2-1);
        g.fillRect(x-br+1,y-br,br*2-2,br*2+1);
        g.fillStyle=bpal[1];
        g.fillRect(x-br+1,y-br+1,br,br);
        g.fillStyle=bpal[2];
        g.fillRect(x-1,y+br-2,br,2);
    }
    /* plages : une bande de sable court le long du trait de cote */
    (function(){
        var W4=CFG.WORLD, t, k6, d6, bw6, px6, py6, nx6, ny6, sd6;
        for(t=0;t<W4;t++){
            for(k6=0;k6<4;k6++){
                d6=coastDepth(t,k6);
                bw6=22+18*Math.sin(t*0.0031+k6*2.1)+10*Math.sin(t*0.0119+k6);
                if(bw6<6) continue;
                if(k6===0){ px6=d6; py6=t; nx6=1; ny6=0; }
                else if(k6===1){ px6=W4-d6; py6=t; nx6=-1; ny6=0; }
                else if(k6===2){ px6=t; py6=d6; nx6=0; ny6=1; }
                else { px6=t; py6=W4-d6; nx6=0; ny6=-1; }
                /* trois bandes, du sable clair du bord a la terre de l'interieur */
                var b1=bw6*0.28, b2=bw6*0.64;
                function band(from,to,col){
                    var ln=to-from; if(ln<=0) return;
                    g.fillStyle=col;
                    if(nx6) g.fillRect((px6+nx6*(nx6>0?from:to))|0,py6|0,ln,1);
                    else    g.fillRect(px6|0,(py6+ny6*(ny6>0?from:to))|0,1,ln);
                }
                band(0,b1,R()<0.5?"#b9a97e":"#c8b98d");
                band(b1,b2,R()<0.5?"#a2916a":"#b0a077");
                band(b2,bw6,R()<0.5?"#7c7350":"#6a6544");
                for(sd6=0;sd6<3;sd6++){
                    var rd7=R()*bw6;
                    g.fillStyle=R()<0.5?"#cfc09a":"#948a68";
                    g.fillRect((px6+nx6*rd7)|0,(py6+ny6*rd7)|0,2,1);
                }
                /* galets et bois flotte */
                if(R()<0.012){
                    var gd6=R()*bw6;
                    g.fillStyle=R()<0.5?"#8a8676":"#6e6a5c";
                    g.fillRect((px6+nx6*gd6)|0,(py6+ny6*gd6)|0,3,2);
                }
            }
        }
    })();
    /* touffes d'herbe seche */
    for(i=0;i<1500;i++){ x=(R()*CFG.WORLD)|0; y=(R()*CFG.WORLD)|0;
        g.fillStyle=R()<0.6?"#4e4a26":"#5c5230";
        g.fillRect(x,y,1,4); g.fillRect(x+2,y+1,1,3); g.fillRect(x-2,y+2,1,2); }
    /* cailloux gris froid */
    for(i=0;i<900;i++){ x=(R()*CFG.WORLD)|0; y=(R()*CFG.WORLD)|0;
        g.fillStyle="#55565a"; g.fillRect(x,y,4,3);
        g.fillStyle="#74767c"; g.fillRect(x,y,3,1);
        g.fillStyle="#35363a"; g.fillRect(x,y+2,4,1); }
    /* brindilles et racines mortes */
    for(i=0;i<700;i++){ x=(R()*CFG.WORLD)|0; y=(R()*CFG.WORLD)|0;
        g.fillStyle="#3a2e1e";
        g.fillRect(x,y,6,1); g.fillRect(x+4,y-2,1,3); g.fillRect(x+1,y+1,1,2); }
    /* ossements epars */
    for(i=0;i<260;i++){ x=(R()*CFG.WORLD)|0; y=(R()*CFG.WORLD)|0;
        g.fillStyle="#9a9382";
        if(R()<0.35){ g.fillRect(x,y,5,4); g.fillRect(x+1,y+4,3,2);
            g.fillStyle="#2a2620"; g.fillRect(x+1,y+1,1,2); g.fillRect(x+3,y+1,1,2); }
        else { g.fillRect(x,y,7,1); g.fillRect(x-1,y-1,2,3); g.fillRect(x+6,y-1,2,3); } }
    /* taches sombres (sang sec) */
    for(i=0;i<180;i++){ x=(R()*CFG.WORLD)|0; y=(R()*CFG.WORLD)|0;
        g.fillStyle="#3a1c18";
        for(j=0;j<7;j++) g.fillRect(x+((R()*12)|0),y+((R()*9)|0),3,2); }
    /* ---- COLLINES ----
       Vue de dessus, le relief se lit par des paliers concentriques de plus en
       plus clairs, des courbes de niveau et un flanc a l'ombre. */
    HILLS.forEach(function(h){
        var STEPS=16, k, a, rr4, q;
        function ring(base){
            g.beginPath();
            for(a=0;a<=72;a++){
                var an=a/72*6.283, rd4=hillRad(h,an,base);
                var px3=h.x+Math.cos(an)*rd4, py3=h.y+Math.sin(an)*rd4;
                if(a) g.lineTo(px3,py3); else g.moveTo(px3,py3);
            }
            g.closePath();
        }
        var TER=["#2f2a21","#332d23","#373025","#3b3427","#3f3729","#433a2b",
                 "#473d2d","#4a402f","#4d4331","#504533","#534835","#564a37",
                 "#584c38","#5a4e3a","#5c503b","#5e523c","#60543d"];
        for(k=0;k<=STEPS;k++){
            rr4=h.rBase+(h.rTop-h.rBase)*(k/STEPS);
            g.fillStyle=TER[k];
            ring(rr4); g.fill();
        }
        /* courbes de niveau */
        for(k=1;k<STEPS;k+=3){
            rr4=h.rBase+(h.rTop-h.rBase)*(k/STEPS);
            g.strokeStyle="rgba(28,24,16,0.30)"; g.lineWidth=2;
            ring(rr4); g.stroke();
        }
        g.lineWidth=1;
        /* flanc a l'ombre, du cote oppose au soleil */
        var sx3=Math.cos(h.sun), sy3=Math.sin(h.sun);
        var grd=g.createLinearGradient(h.x+sx3*h.rBase,h.y+sy3*h.rBase,
                                       h.x-sx3*h.rBase,h.y-sy3*h.rBase);
        grd.addColorStop(0,"rgba(255,232,180,0.10)");
        grd.addColorStop(0.5,"rgba(0,0,0,0)");
        grd.addColorStop(1,"rgba(10,8,4,0.32)");
        g.fillStyle=grd; ring(h.rBase); g.fill();
        /* eboulis sur la pente et herbe rase sur le plateau */
        for(q=0;q<h.rBase*5;q++){
            a=R()*6.283;
            rr4=hillRad(h,a,h.rTop)+(hillRad(h,a,h.rBase)-hillRad(h,a,h.rTop))*R();
            g.fillStyle=R()<0.5?"#4a4234":"#3a3428";
            g.fillRect((h.x+Math.cos(a)*rr4)|0,(h.y+Math.sin(a)*rr4)|0,3,2);
        }
        for(q=0;q<h.rTop*7;q++){
            a=R()*6.283; rr4=hillRad(h,a,h.rTop)*Math.sqrt(R());
            g.fillStyle=["#5e5a34","#6a6440","#4e4a2c"][(R()*3)|0];
            var gx4=(h.x+Math.cos(a)*rr4)|0, gy4=(h.y+Math.sin(a)*rr4)|0;
            g.fillRect(gx4,gy4,1,4); g.fillRect(gx4+2,gy4+1,1,3);
        }
        /* lisiere de crete, un bourrelet clair */
        g.strokeStyle="rgba(150,140,100,0.28)"; g.lineWidth=3;
        ring(h.rTop); g.stroke(); g.lineWidth=1;
    });
    /* ---- HERBES HAUTES ---- */
    GRASS.forEach(function(b){
        b.forEach(function(c){
            var q, a, rd5, gx5, gy5, rmax;
            for(q=0;q<c.r*c.r/2.2;q++){
                a=R()*6.283; rmax=blobR(c,a); rd5=rmax*Math.sqrt(R());
                gx5=(c.x+Math.cos(a)*rd5)|0; gy5=(c.y+Math.sin(a)*rd5)|0;
                g.fillStyle=["#3c4a22","#46561f","#334018"][(R()*3)|0];
                g.fillRect(gx5,gy5,2,2);
            }
            for(q=0;q<c.r*c.r/9;q++){
                a=R()*6.283; rmax=blobR(c,a); rd5=rmax*Math.sqrt(R());
                gx5=(c.x+Math.cos(a)*rd5)|0; gy5=(c.y+Math.sin(a)*rd5)|0;
                g.fillStyle=R()<0.5?"#5c7028":"#6a8030";
                g.fillRect(gx5,gy5,1,7); g.fillRect(gx5+2,gy5+2,1,5);
                g.fillRect(gx5-2,gy5+3,1,4);
            }
        });
    });
    /* SOL DES VILLAGES : terre battue et paves, pose avant les voies pour que
       la chaussee passe par-dessus. Le bourg se distingue de la lande. */
    VILLAGES.forEach(function(v){
        var rr3=v.r*1.06, q, ax, ay, ad;
        /* contour ondule, sans lobes reguliers */
        var vw1=0.07+R()*0.09, vf1=2+((R()*3)|0), vp1=R()*6.283;
        var vw2=0.04+R()*0.06, vf2=5+((R()*4)|0), vp2=R()*6.283;
        var vw3=0.02+R()*0.03, vf3=9+((R()*6)|0), vp3=R()*6.283;
        function vrad(an){
            return rr3*(1+vw1*Math.sin(an*vf1+vp1)+vw2*Math.sin(an*vf2+vp2)
                          +vw3*Math.sin(an*vf3+vp3));
        }
        g.fillStyle="#6b6152";
        g.beginPath();
        for(q=0;q<=96;q++){
            var van=q/96*6.283, vrd=vrad(van);
            if(q) g.lineTo(v.x+Math.cos(van)*vrd,v.y+Math.sin(van)*vrd);
            else  g.moveTo(v.x+Math.cos(van)*vrd,v.y+Math.sin(van)*vrd);
        }
        g.closePath(); g.fill();
        /* grain de terre battue */
        for(q=0;q<rr3*rr3/9;q++){
            ax=R()*6.283; ad=vrad(ax)*Math.sqrt(R());
            var px2=(v.x+Math.cos(ax)*ad)|0, py2=(v.y+Math.sin(ax)*ad)|0;
            g.fillStyle=R()<0.5?"#75695a":"#5f5749";
            g.fillRect(px2,py2,3,2);
        }
        /* paves : quelques placettes irregulieres plutot qu'un rond de dalles */
        var npl=3+((R()*4)|0), pl;
        for(pl=0;pl<npl;pl++){
            var plx=(pl===0)?v.well.x:v.x+Math.cos(R()*6.283)*R()*rr3*0.72;
            var ply=(pl===0)?v.well.y:v.y+Math.sin(R()*6.283)*R()*rr3*0.72;
            var plr=(pl===0?46:22)+R()*36;
            var pw1=0.16+R()*0.2, pp1=R()*6.283, pw2=0.09+R()*0.12, pp2=R()*6.283;
            for(q=0;q<plr*plr/9;q++){
                ax=R()*6.283;
                var prm=plr*(1+pw1*Math.sin(ax*3+pp1)+pw2*Math.sin(ax*5+pp2));
                ad=prm*Math.sqrt(R());
                var pvx=(plx+Math.cos(ax)*ad)|0, pvy=(ply+Math.sin(ax)*ad)|0;
                /* dalle rectangulaire, orientation et taille variables */
                var pdw=3+((R()*4)|0), pdh=3+((R()*3)|0);
                g.fillStyle=["#807565","#6a6152","#8a7f6c","#5f584b"][(R()*4)|0];
                g.fillRect(pvx,pvy,pdw,pdh);
                if(R()<0.3){ g.fillStyle="rgba(40,36,28,0.35)";
                    g.fillRect(pvx,pvy+pdh,pdw,1); }
            }
        }
        /* lisiere : la terre s'effiloche dans l'herbe */
        for(q=0;q<rr3*2.6;q++){
            ax=R()*6.283; ad=vrad(ax)*(0.94+R()*0.15);
            g.fillStyle=R()<0.5?"#6b6152":"#5a5a3e";
            g.fillRect((v.x+Math.cos(ax)*ad)|0,(v.y+Math.sin(ax)*ad)|0,3+((R()*3)|0),2+((R()*2)|0));
        }
    });
    /* SOL DES PORTS : beton et graviers */
    PORTS.forEach(function(po){
        var q, a, d;
        g.fillStyle="#5e5c54";
        g.beginPath(); g.arc(po.x,po.y,215,0,7); g.fill();
        for(q=0;q<12;q++){
            a=q/12*6.283;
            g.beginPath(); g.arc(po.x+Math.cos(a)*186,po.y+Math.sin(a)*186,R()*44+22,0,7); g.fill();
        }
        for(q=0;q<9000;q++){
            a=R()*6.283; d=215*Math.sqrt(R());
            g.fillStyle=["#6a6860","#54524a","#726f66"][(R()*3)|0];
            g.fillRect((po.x+Math.cos(a)*d)|0,(po.y+Math.sin(a)*d)|0,3,2);
        }
        /* lisiere qui s'effiloche */
        for(q=0;q<600;q++){
            a=R()*6.283; d=215*(0.94+R()*0.16);
            g.fillStyle=R()<0.5?"#5e5c54":"#4a4a3a";
            g.fillRect((po.x+Math.cos(a)*d)|0,(po.y+Math.sin(a)*d)|0,4,3);
        }
    });
    /* VOIES : chemins de terre d'abord, routes goudronnees par-dessus.
       Les polylignes sont tracees au trait, bordure puis remplissage. */
    function wayPath(list){
        g.beginPath();
        for(i=0;i<list.length;i++){
            g.moveTo(list[i].x1,list[i].y1); g.lineTo(list[i].x2,list[i].y2);
        }
    }
    function wayGrain(list,w,cols,dens){
        for(i=0;i<list.length;i++){
            var s2=list[i], dx=s2.x2-s2.x1, dy=s2.y2-s2.y1;
            var l=Math.sqrt(dx*dx+dy*dy)||1, n=(l*dens)|0, q;
            for(q=0;q<n;q++){
                var t=R(), o=(R()-0.5)*w;
                x=(s2.x1+dx*t-dy/l*o)|0; y=(s2.y1+dy*t+dx/l*o)|0;
                g.fillStyle=cols[(R()*cols.length)|0];
                g.fillRect(x,y,2,2);
            }
        }
    }
    g.lineJoin="round"; g.lineCap="round";
    if(PATHS.length){
        wayPath(PATHS);
        g.lineWidth=PATH_W+4; g.strokeStyle="#5c4c34"; g.stroke();
        g.lineWidth=PATH_W;   g.strokeStyle="#7a6748"; g.stroke();
        wayGrain(PATHS,PATH_W-3,["#6a5840","#8a7654","#5a4a32"],0.5);
    }
    if(WALKS.length){
        /* trottoirs : dalles claires bordees d'un caniveau */
        wayPath(WALKS);
        g.lineWidth=PATH_W-2; g.strokeStyle="#5e5a50"; g.stroke();
        g.lineWidth=11;       g.strokeStyle="#9a9488"; g.stroke();
        g.lineWidth=8;        g.strokeStyle="#aaa498"; g.stroke();
        wayGrain(WALKS,8,["#b4ae9e","#8e887c","#a09a8c"],0.55);
        /* joints de dalle en travers */
        for(i=0;i<WALKS.length;i++){
            var wk=WALKS[i], wdx=wk.x2-wk.x1, wdy=wk.y2-wk.y1;
            var wl2=Math.sqrt(wdx*wdx+wdy*wdy)||1, wn=(wl2/9)|0, wz;
            g.strokeStyle="rgba(70,66,56,0.5)"; g.lineWidth=1;
            g.beginPath();
            for(wz=1;wz<wn;wz++){
                var wt=wz/wn, wpx=wk.x1+wdx*wt, wpy=wk.y1+wdy*wt;
                g.moveTo(wpx-wdy/wl2*5,wpy+wdx/wl2*5);
                g.lineTo(wpx+wdy/wl2*5,wpy-wdx/wl2*5);
            }
            g.stroke();
        }
    }
    if(ROADS.length){
        wayPath(ROADS);
        g.lineWidth=ROAD_W+5; g.strokeStyle="#4c4a46"; g.stroke();
        g.lineWidth=ROAD_W;   g.strokeStyle="#2e2e30"; g.stroke();
        wayGrain(ROADS,ROAD_W-4,["#343437","#282829"],0.6);
        wayGrain(ROADS,ROAD_W-10,["#232325"],0.06);
        g.setLineDash([13,15]);
        g.lineWidth=2; g.strokeStyle="#b0a888"; g.stroke();
        g.setLineDash([]);
    }
    /* ronds-points : anneau de bitume et terre-plein plante, par-dessus la
       chaussee mais sous les zebres */
    ROUNDS.forEach(function(ro){
        var q7, a7, d7;
        g.fillStyle="#4c4a46";
        g.beginPath(); g.arc(ro.x,ro.y,ro.r+3,0,7); g.fill();
        g.fillStyle="#2e2e30";
        g.beginPath(); g.arc(ro.x,ro.y,ro.r,0,7); g.fill();
        for(q7=0;q7<420;q7++){
            a7=R()*6.283; d7=ro.r*Math.sqrt(R());
            g.fillStyle=R()<0.5?"#343437":"#282829";
            g.fillRect((ro.x+Math.cos(a7)*d7)|0,(ro.y+Math.sin(a7)*d7)|0,2,2);
        }
        /* anneau blanc pointille */
        g.strokeStyle="#b0a888"; g.lineWidth=2;
        g.setLineDash([9,11]);
        g.beginPath(); g.arc(ro.x,ro.y,ro.r-5,0,6.283); g.stroke();
        g.setLineDash([]);
        /* terre-plein central */
        g.fillStyle="#6a6152";
        g.beginPath(); g.arc(ro.x,ro.y,16,0,7); g.fill();
        g.fillStyle="#4e6a2e";
        g.beginPath(); g.arc(ro.x,ro.y,13,0,7); g.fill();
        for(q7=0;q7<70;q7++){
            a7=R()*6.283; d7=13*Math.sqrt(R());
            g.fillStyle=R()<0.5?"#5a7a34":"#405a26";
            g.fillRect((ro.x+Math.cos(a7)*d7)|0,(ro.y+Math.sin(a7)*d7)|0,2,2);
        }
        for(q7=0;q7<3;q7++){
            a7=q7/3*6.283+0.6; d7=6;
            g.fillStyle="#2e4a1e";
            g.fillRect((ro.x+Math.cos(a7)*d7)|0,(ro.y+Math.sin(a7)*d7-5)|0,3,6);
            g.fillStyle="#3e6428";
            g.fillRect((ro.x+Math.cos(a7)*d7-2)|0,(ro.y+Math.sin(a7)*d7-8)|0,7,5);
        }
    });
    /* passages pietons : bandes blanches dans le sens de la traversee, comme
       en vrai. Chaque bande court d'un bord a l'autre de la chaussee, et les
       bandes se succedent le long de celle-ci. Peints en dernier, apres
       chemins, trottoirs et routes, pour rester visibles. */
    ZEBRAS.forEach(function(zb){
        var ax=-zb.uy, ay=zb.ux;            /* axe de la chaussee */
        var half=zb.w/2-1, k6, q6;
        g.fillStyle="rgba(228,224,208,0.82)";
        for(q6=-half;q6<=half;q6+=5.5){
            for(k6=-11;k6<=11;k6+=1.2){
                g.fillRect((zb.x+ax*k6+zb.ux*q6)|0,(zb.y+ay*k6+zb.uy*q6)|0,3,3);
            }
        }
    });
    g.lineWidth=1;
    /* trace le contour ondule d'une tache */
    function blobPath(c,scale){
        var a, r2;
        g.beginPath();
        for(a=0;a<=48;a++){
            var an=a/48*6.283; r2=blobR(c,an)*(scale||1);
            var bx8=c.x+Math.cos(an)*r2, by8=c.y+Math.sin(an)*r2;
            if(a) g.lineTo(bx8,by8); else g.moveTo(bx8,by8);
        }
        g.closePath();
    }
    SWAMPS.forEach(function(b){
        b.forEach(function(c){
            g.fillStyle="#24506a"; blobPath(c); g.fill();
        });
        b.forEach(function(c){
            var q8;
            for(q8=0;q8<c.r*c.r/26;q8++){
                var aa=R()*6.283, dd8=blobR(c,aa)*Math.sqrt(R());
                g.fillStyle=R()<0.7?"#1c4058":"#2a5874";
                g.fillRect((c.x+Math.cos(aa)*dd8)|0,(c.y+Math.sin(aa)*dd8)|0,3,2);
            }
        });
        b.forEach(function(c,ci){
            for(i=0;i<8;i++){ var wa=R()*6.28, wrd=c.r*Math.sqrt(R());
                g.fillStyle=R()<0.5?"#3a6a8a":"#6aa8c8";
                g.fillRect((c.x+Math.cos(wa)*wrd)|0,(c.y+Math.sin(wa)*wrd)|0,3,1); }
            /* Sur une pente le courant s'emballe : marches rocheuses, bourrelets
               d'ecume en travers du lit et embruns sur les bords. */
            if(!onSlope(c.x,c.y)) return;
            var pv=b[Math.max(0,ci-1)], nv2=b[Math.min(b.length-1,ci+1)];
            var fdx=nv2.x-pv.x, fdy=nv2.y-pv.y, fl=Math.sqrt(fdx*fdx+fdy*fdy)||1;
            var ux=fdx/fl, uy=fdy/fl, tx2=-uy, ty2=ux, q, k5;
            /* marche sombre en travers */
            g.fillStyle="rgba(14,32,44,0.55)";
            for(k5=-1;k5<=1;k5+=2)
                for(q=0;q<c.r;q+=2)
                    g.fillRect((c.x+tx2*(q-c.r/2)+ux*k5*2)|0,(c.y+ty2*(q-c.r/2)+uy*k5*2)|0,2,2);
            /* bourrelet d'ecume */
            for(k5=0;k5<2;k5++){
                var off=(k5?3:-3);
                for(q=0;q<c.r*1.6;q++){
                    var tt=(R()-0.5)*c.r*1.7, jj=(R()-0.5)*3;
                    g.fillStyle=R()<0.45?"#dcefff":(R()<0.6?"#a8d0e8":"#88b8d8");
                    g.fillRect((c.x+tx2*tt+ux*(off+jj))|0,(c.y+ty2*tt+uy*(off+jj))|0,2,2);
                }
            }
            /* embruns projetes sur les cotes */
            for(q=0;q<c.r*0.7;q++){
                var sd2=(R()<0.5?-1:1)*(c.r*0.7+R()*10);
                g.fillStyle=R()<0.6?"rgba(230,245,255,0.65)":"rgba(180,215,235,0.5)";
                g.fillRect((c.x+tx2*sd2+ux*(R()-0.5)*c.r)|0,
                           (c.y+ty2*sd2+uy*(R()-0.5)*c.r)|0,2,1);
            }
        });
    });
    /* ocean qui ceinture la carte, decoupe par le profil de cote */
    (function(){
        var W2=CFG.WORLD, t, d, k2, sx2, sy2;
        /* nappe d'eau, colonne par colonne puis ligne par ligne */
        g.fillStyle="#18384e";
        for(t=0;t<W2;t++){
            d=coastDepth(t,2)|0; if(d>0) g.fillRect(t,0,1,d);
            d=coastDepth(t,3)|0; if(d>0) g.fillRect(t,W2-d,1,d);
        }
        for(t=0;t<W2;t++){
            d=coastDepth(t,0)|0; if(d>0) g.fillRect(0,t,d,1);
            d=coastDepth(t,1)|0; if(d>0) g.fillRect(W2-d,t,d,1);
        }
        /* degrade vers le large */
        for(t=0;t<W2;t+=1){
            var dn=coastDepth(t,2), ds=coastDepth(t,3);
            for(k2=0;k2<dn;k2+=6){
                g.fillStyle="rgba(10,26,40,"+((1-k2/dn)*0.5).toFixed(3)+")";
                g.fillRect(t,k2,1,3);
            }
            for(k2=0;k2<ds;k2+=6){
                g.fillStyle="rgba(10,26,40,"+((1-k2/ds)*0.5).toFixed(3)+")";
                g.fillRect(t,W2-k2-3,1,3);
            }
            var dw=coastDepth(t,0), de=coastDepth(t,1);
            for(k2=0;k2<dw;k2+=6){
                g.fillStyle="rgba(10,26,40,"+((1-k2/dw)*0.5).toFixed(3)+")";
                g.fillRect(k2,t,3,1);
            }
            for(k2=0;k2<de;k2+=6){
                g.fillStyle="rgba(10,26,40,"+((1-k2/de)*0.5).toFixed(3)+")";
                g.fillRect(W2-k2-3,t,3,1);
            }
        }
        /* moutons d'ecume au large */
        for(k2=0;k2<11000;k2++){
            sx2=(R()*W2)|0; sy2=(R()*W2)|0;
            if(!inSea(sx2,sy2)) continue;
            g.fillStyle=R()<0.7?"#2a5a76":"#3e7a9a";
            g.fillRect(sx2,sy2,3+((R()*4)|0),1);
        }
        /* ressac et sable mouille le long du trait de cote */
        for(t=0;t<W2;t+=2){
            var pts2=[[t,coastDepth(t,2),0,1],[t,W2-coastDepth(t,3),0,-1],
                      [coastDepth(t,0),t,1,0],[W2-coastDepth(t,1),t,-1,0]];
            for(k2=0;k2<4;k2++){
                var px2=pts2[k2][0]|0, py2=pts2[k2][1]|0, nx2=pts2[k2][2], ny2=pts2[k2][3];
                g.fillStyle="rgba(180,220,235,0.35)";
                g.fillRect(px2-(ny2?2:0)-(nx2?1:0),py2-(nx2?2:0)-(ny2?1:0),ny2?4:2,nx2?4:2);
                g.fillStyle="rgba(120,105,75,0.35)";
                g.fillRect(px2+nx2*2-(ny2?2:0),py2+ny2*2-(nx2?2:0),ny2?4:6,nx2?4:6);
            }
        }
    })();
    /* PONTS ET GUES : poses apres l'eau, donc visibles par-dessus elle */
    (function(){
        var q,o,dx,dy,l,nx,ny,z,n,t,px,py, o0w=ROAD_W+6;
        g.lineCap="butt"; g.lineJoin="round";
        /* tablier des ponts */
        for(z=0;z<2;z++){
            g.beginPath();
            for(q=0;q<BRIDGES.length;q++){ o=BRIDGES[q];
                if(o.k!=="pont") continue;
                g.moveTo(o.x1,o.y1); g.lineTo(o.x2,o.y2); }
            g.lineWidth=z?o0w:o0w+7; g.strokeStyle=z?"#7a5a34":"#3a2a18"; g.stroke();
        }
        /* planches, garde-corps et piles */
        for(q=0;q<BRIDGES.length;q++){ o=BRIDGES[q];
            if(o.k!=="pont") continue;
            dx=o.x2-o.x1; dy=o.y2-o.y1; l=Math.sqrt(dx*dx+dy*dy)||1;
            nx=-dy/l; ny=dx/l;
            n=(l/7)|0;
            g.strokeStyle="#5a3f22"; g.lineWidth=2;
            g.beginPath();
            for(z=0;z<n;z++){ t=(z+0.5)/n;
                px=o.x1+dx*t; py=o.y1+dy*t;
                g.moveTo(px+nx*(o0w/2-1),py+ny*(o0w/2-1));
                g.lineTo(px-nx*(o0w/2-1),py-ny*(o0w/2-1)); }
            g.stroke();
            g.strokeStyle="#9a7a4e"; g.lineWidth=3;
            for(z=-1;z<=1;z+=2){
                g.beginPath();
                g.moveTo(o.x1+nx*z*(o0w/2+1),o.y1+ny*z*(o0w/2+1));
                g.lineTo(o.x2+nx*z*(o0w/2+1),o.y2+ny*z*(o0w/2+1));
                g.stroke();
            }
            /* poteaux du garde-corps */
            g.fillStyle="#6a4c2c";
            n=(l/17)|0;
            for(z=0;z<=n;z++){ t=n?z/n:0;
                px=o.x1+dx*t; py=o.y1+dy*t;
                g.fillRect((px+nx*(o0w/2+1))|0,(py+ny*(o0w/2+1))|0,3,3);
                g.fillRect((px-nx*(o0w/2+1))|0,(py-ny*(o0w/2+1))|0,3,3); }
        }
        /* gues : pierres emergees, semees le long du chemin */
        for(q=0;q<BRIDGES.length;q++){ o=BRIDGES[q];
            if(o.k!=="gue") continue;
            dx=o.x2-o.x1; dy=o.y2-o.y1; l=Math.sqrt(dx*dx+dy*dy)||1;
            nx=-dy/l; ny=dx/l;
            n=Math.max(1,(l/11)|0);
            for(z=0;z<=n;z++){ t=z/n;
                var off=(R()-0.5)*(PATH_W*0.5), rr3=3+((R()*3)|0);
                px=o.x1+dx*t+nx*off; py=o.y1+dy*t+ny*off;
                g.fillStyle="rgba(10,26,40,0.45)";
                g.beginPath(); g.ellipse(px+1,py+2,rr3+1,rr3*0.8,0,0,7); g.fill();
                g.fillStyle="#5c5a54";
                g.beginPath(); g.ellipse(px,py,rr3,rr3*0.82,0,0,7); g.fill();
                g.fillStyle="#83807a";
                g.beginPath(); g.ellipse(px-0.6,py-0.8,rr3*0.62,rr3*0.5,0,0,7); g.fill();
            }
        }
        g.lineWidth=1;
    })();
    /* PANNEAUX DE LIEU : poteau, planche et lettres suggerees */
    SIGNS.forEach(function(sg){
        if(!sg.post) return;
        var px=sg.x|0, py=sg.y|0, q;
        g.fillStyle="rgba(0,0,0,0.28)"; g.fillRect(px-7,py+3,17,3);
        g.fillStyle="#5a4326"; g.fillRect(px-1,py-13,3,16);
        g.fillStyle="#8a6a3e"; g.fillRect(px-11,py-22,25,10);
        g.fillStyle="#a8834e"; g.fillRect(px-11,py-22,25,2);
        g.fillStyle="#5e4526"; g.fillRect(px-11,py-13,25,1);
        g.fillStyle="#3a2a16";
        for(q=0;q<4;q++) g.fillRect(px-8+q*6,py-18,4+((q*7)%2),1);
        g.fillRect(px-8,py-16,17,1);
    });
    /* PANNEAUX DE SORTIE : la ou la route quitte la carte */
    EXITS.forEach(function(e){
        var px=e.x|0, py=e.y|0;
        g.fillStyle="rgba(0,0,0,0.3)"; g.fillRect(px-9,py+4,20,3);
        g.fillStyle="#5a4326"; g.fillRect(px-2,py-14,3,18); g.fillRect(px+8,py-14,3,18);
        g.fillStyle="#8a6a3e"; g.fillRect(px-6,py-24,21,12);
        g.fillStyle="#c8a860"; g.fillRect(px-6,py-24,21,2);
        g.fillStyle="#3a2a16";
        g.fillRect(px-3,py-20,4,1); g.fillRect(px+3,py-20,7,1);
        g.fillRect(px-3,py-17,10,1);
    });
    LILIES.forEach(function(li){
        g.fillStyle="#2e5c34";
        g.beginPath(); g.arc(li.x,li.y,li.r,0,7); g.fill();
        g.fillStyle="#3e7a44";
        g.beginPath(); g.arc(li.x-1,li.y-1,li.r*0.72,0,7); g.fill();
        g.fillStyle="#1c3a22"; g.fillRect(li.x,li.y,li.r,1);
        if(li.fl){ g.fillStyle="#e8d0e0"; g.fillRect(li.x-2,li.y-2,4,4);
            g.fillStyle="#f8e8f0"; g.fillRect(li.x-1,li.y-2,2,2);
            g.fillStyle="#e0b040"; g.fillRect(li.x,li.y-1,1,1); }
    });
    ROCKS.forEach(function(rk){
        var rr2=rk.r;
        var dk=["#35332f","#3b3833","#302e2b"][rk.s];
        var md=["#5a5750","#625e56","#524f49"][rk.s];
        var lt=["#807c72","#8a8578","#77736a"][rk.s];
        /* silhouette anguleuse : rayons irreguliers */
        var nv=6+((R()*4)|0), pts=[], q, qa, qr;
        for(q=0;q<nv;q++){
            qa=q/nv*6.283+R()*0.34;
            qr=rr2*(0.72+R()*0.42);
            pts.push([rk.x+Math.cos(qa)*qr, rk.y+Math.sin(qa)*qr*0.84]);
        }
        function tracer(off,sc,dyy){
            g.beginPath();
            for(q=0;q<pts.length;q++){
                var px2=rk.x+(pts[q][0]-rk.x)*sc+off, py2=rk.y+(pts[q][1]-rk.y)*sc+dyy;
                if(q===0) g.moveTo(px2,py2); else g.lineTo(px2,py2);
            }
            g.closePath();
        }
        /* ombre portee */
        g.fillStyle="rgba(0,0,0,0.32)"; tracer(3,1,rr2*0.32); g.fill();
        /* masse principale */
        g.fillStyle=dk; tracer(0,1,0); g.fill();
        /* pan eclaire : moitie haute-gauche */
        g.fillStyle=md; tracer(-rr2*0.1,0.78,-rr2*0.14); g.fill();
        g.fillStyle=lt; tracer(-rr2*0.22,0.44,-rr2*0.3); g.fill();
        /* aretes vives entre facettes */
        g.strokeStyle="#26241f"; g.lineWidth=1;
        for(q=0;q<3;q++){
            var e1=pts[(q*2)%pts.length];
            g.beginPath(); g.moveTo(e1[0],e1[1]);
            g.lineTo(rk.x+(R()-0.5)*rr2*0.4,rk.y+(R()-0.5)*rr2*0.4); g.stroke();
        }
        /* lisere clair sur l'arete superieure */
        g.strokeStyle="rgba(160,156,144,0.55)";
        g.beginPath();
        g.moveTo(pts[0][0],pts[0][1]);
        for(q=1;q<Math.ceil(pts.length/2);q++) g.lineTo(pts[q][0],pts[q][1]);
        g.stroke();
        /* fissures */
        g.strokeStyle="#22201c";
        g.beginPath();
        g.moveTo(rk.x-rr2*0.3,rk.y-rr2*0.2);
        g.lineTo(rk.x-rr2*0.05,rk.y+rr2*0.1);
        g.lineTo(rk.x+rr2*0.25,rk.y+rr2*0.05); g.stroke();
        /* lichen au pied */
        if(rk.t<0.4){
            g.fillStyle="#3e5e2c";
            g.fillRect(rk.x-rr2*0.55,rk.y+rr2*0.3,rr2*0.4,2);
            g.fillRect(rk.x+rr2*0.15,rk.y+rr2*0.45,rr2*0.3,2);
            g.fillStyle="#527a38"; g.fillRect(rk.x-rr2*0.5,rk.y+rr2*0.3,rr2*0.2,1);
        }
    });
    REEDS.forEach(function(rd3){
        var h=rd3.h;
        if(rd3.k===0){
            /* roseau : tige + massette */
            g.fillStyle="#4a6a2e"; g.fillRect(rd3.x,rd3.y-h,1,h);
            g.fillStyle="#5c7e38"; g.fillRect(rd3.x+2,rd3.y-h*0.7,1,h*0.7);
            g.fillStyle="#6a4a24"; g.fillRect(rd3.x-1,rd3.y-h-5,3,6);
            g.fillStyle="#8a6438"; g.fillRect(rd3.x-1,rd3.y-h-5,1,6);
        } else {
            /* touffe d'herbes hautes */
            g.fillStyle="#556e30";
            g.fillRect(rd3.x,rd3.y-h,1,h);
            g.fillRect(rd3.x-3,rd3.y-h*0.75,1,h*0.75);
            g.fillRect(rd3.x+3,rd3.y-h*0.8,1,h*0.8);
            g.fillStyle="#6a8840";
            g.fillRect(rd3.x-2,rd3.y-h*0.55,1,h*0.55);
            g.fillRect(rd3.x+2,rd3.y-h*0.6,1,h*0.6);
        }
    });
    
    FARMS.forEach(function(f){
        f.fields.forEach(function(fd){
            var q;
            if(fd.t==="pature"){
                /* pature : herbe grasse, plus verte que la lande alentour */
                g.fillStyle="#415c2e"; g.fillRect(fd.x,fd.y,fd.w,fd.h);
                g.fillStyle="#4c6a35";
                for(q=0;q<fd.w*fd.h/26;q++)
                    g.fillRect((fd.x+R()*fd.w)|0,(fd.y+R()*fd.h)|0,3,2);
                g.fillStyle="#5a7c3e";
                for(q=0;q<fd.w*fd.h/90;q++)
                    g.fillRect((fd.x+R()*fd.w)|0,(fd.y+R()*fd.h)|0,1,4);
                /* sentes tracees par le betail */
                g.fillStyle="#6a6a48";
                for(q=0;q<fd.w*fd.h/420;q++)
                    g.fillRect((fd.x+R()*fd.w)|0,(fd.y+R()*fd.h)|0,7,3);
                g.fillStyle="rgba(30,44,22,0.35)"; g.fillRect(fd.x,fd.y,fd.w,3);
            } else {
                g.fillStyle="#4a3826"; g.fillRect(fd.x,fd.y,fd.w,fd.h);
                g.fillStyle="#3a2c1c";
                for(q=0;q*18+8<fd.h-2;q++) g.fillRect(fd.x,fd.y+8+q*18,fd.w,3);
                g.fillStyle="#6a5030";
                g.fillRect(fd.x,fd.y,fd.w,2); g.fillRect(fd.x,fd.y+fd.h-2,fd.w,2);
            }
        });
    });
    ORECT.forEach(function(o){
        g.fillStyle="#6a6a66"; g.fillRect(o.x,o.y,o.w,o.h);
        g.fillStyle="#54545a";
        for(y=o.y;y<o.y+o.h;y+=4) for(x=o.x+((y/4)%2)*4;x<o.x+o.w;x+=8)
            g.fillRect(x,y,4,1);
        g.fillStyle="#8a8a86"; g.fillRect(o.x,o.y,o.w,2);
        g.fillStyle="#3a3a40"; g.fillRect(o.x,o.y+o.h-2,o.w,2);
    });
    var HROOF=[["#8a4030","#a85840","#5e2a1e"],["#4a5a68","#68808e","#2e3a44"],["#6a4a2a","#8a6a40","#422c18"]];
    var HWALL=[["#c8b48a","#a89468","#8a7450"],["#b8a078","#98805a","#7a6444"]];
    function house(hx,hy,hw,hh){
        var rf=HROOF[(R()*HROOF.length)|0], wl=HWALL[(R()*HWALL.length)|0];
        var wy=hy+11, wb=hy+hh, cxm=hx+((hw/2)|0);
        /* ombre portee au sol */
        g.fillStyle="rgba(0,0,0,0.22)"; g.fillRect(hx+3,wb,hw,3);
        /* murs en torchis */
        g.fillStyle=wl[0]; g.fillRect(hx,wy,hw,hh-11);
        g.fillStyle=wl[1]; g.fillRect(hx,wb-4,hw,4);
        g.fillStyle=wl[2]; g.fillRect(hx+hw-3,wy,3,hh-11);
        /* colombages */
        g.fillStyle="#4a3520";
        g.fillRect(hx,wy,2,hh-11); g.fillRect(hx+hw-2,wy,2,hh-11);
        g.fillRect(hx,wb-2,hw,2); g.fillRect(cxm-1,wy,2,hh-11);
        /* fenetres : cadre, vitre, croisillons, volets */
        function win(wx){
            g.fillStyle="#4a3520"; g.fillRect(wx-1,wy+4,10,10);
            g.fillStyle="#2a3a4a"; g.fillRect(wx,wy+5,8,8);
            g.fillStyle="#5a7a90"; g.fillRect(wx,wy+5,8,3);
            g.fillStyle="#4a3520"; g.fillRect(wx+3,wy+5,2,8); g.fillRect(wx,wy+8,8,2);
            g.fillStyle=rf[0]; g.fillRect(wx-4,wy+4,3,10); g.fillRect(wx+9,wy+4,3,10);
            g.fillStyle=rf[2]; g.fillRect(wx-4,wy+4,3,1); g.fillRect(wx+9,wy+4,3,1);
        }
        win(hx+7); win(hx+hw-16);
        /* porte encadree + poignee + marche */
        g.fillStyle="#4a3520"; g.fillRect(cxm-7,wb-15,14,15);
        g.fillStyle="#3a2c1c"; g.fillRect(cxm-5,wb-13,10,13);
        g.fillStyle="#503c26"; g.fillRect(cxm-5,wb-13,2,13); g.fillRect(cxm+1,wb-13,1,13);
        g.fillStyle="#d8b040"; g.fillRect(cxm+2,wb-7,2,2);
        g.fillStyle="#8a8a86"; g.fillRect(cxm-8,wb-1,16,2);
        /* jardiniere fleurie a droite de la porte */
        g.fillStyle="#8a5030"; g.fillRect(cxm+9,wb-6,7,5);
        g.fillStyle="#3e5e2c"; g.fillRect(cxm+9,wb-8,7,2);
        g.fillStyle="#e8608a"; g.fillRect(cxm+10,wb-10,2,2);
        g.fillStyle="#f0c040"; g.fillRect(cxm+13,wb-9,2,2);
        /* toit debordant + tuiles + faitage */
        g.fillStyle=rf[2]; g.fillRect(hx-5,hy+9,hw+10,3);
        g.fillStyle=rf[0]; g.fillRect(hx-5,hy,hw+10,10);
        g.fillStyle=rf[1]; g.fillRect(hx-5,hy,hw+10,3);
        g.fillStyle=rf[2];
        for(x=hx-5;x<hx+hw+5;x+=5) g.fillRect(x,hy+3,1,7);
        for(y=hy+3;y<hy+10;y+=4) g.fillRect(hx-5,y,hw+10,1);
        g.fillStyle=rf[1]; g.fillRect(hx-5,hy,hw+10,1);
        /* ombre du toit sur le mur */
        g.fillStyle="rgba(0,0,0,0.25)"; g.fillRect(hx,wy,hw,3);
        /* cheminee */
        g.fillStyle="#7a6a5a"; g.fillRect(hx+hw-14,hy-8,8,10);
        g.fillStyle="#9a8a7a"; g.fillRect(hx+hw-14,hy-8,8,2);
        g.fillStyle="#4a4038"; g.fillRect(hx+hw-13,hy-7,6,2);
    }
    /* --- edifices publics : chacun sa silhouette, aucun n'a de fonction --- */
    function bldg(hx,hy,hw,hh,kind){
        var d=null,q;
        for(q=0;q<BLDG.length;q++) if(BLDG[q].k===kind) d=BLDG[q];
        if(!d){ house(hx,hy,hw,hh); return; }
        var rf=d.rf, wl=d.wl;
        var flat=(kind==="superette"||kind==="depot"||kind==="soins"||d.city);
        var rh=flat?7:12, wy=hy+rh, wb=hy+hh, cxm=hx+((hw/2)|0), xx, yy;
        /* ombre au sol */
        g.fillStyle="rgba(0,0,0,0.24)"; g.fillRect(hx+3,wb,hw,3);
        /* murs */
        g.fillStyle=wl[0]; g.fillRect(hx,wy,hw,hh-rh);
        g.fillStyle=wl[1]; g.fillRect(hx,wb-5,hw,5);
        g.fillStyle=wl[2]; g.fillRect(hx+hw-3,wy,3,hh-rh);
        g.fillStyle="rgba(0,0,0,0.18)"; g.fillRect(hx,wy,hw,3);
        function win(wx,wyy,ww,wh2,bars){
            g.fillStyle=wl[2]; g.fillRect(wx-1,wyy-1,ww+2,wh2+2);
            g.fillStyle="#2a3a4a"; g.fillRect(wx,wyy,ww,wh2);
            g.fillStyle="#5a7a90"; g.fillRect(wx,wyy,ww,Math.max(2,(wh2/3)|0));
            if(bars){ g.fillStyle="#3a4048";
                for(xx=wx+2;xx<wx+ww;xx+=4) g.fillRect(xx,wyy,1,wh2); }
        }
        function door(dw,dc){
            g.fillStyle=wl[2]; g.fillRect(cxm-dw/2-2,wb-16,dw+4,16);
            g.fillStyle=dc; g.fillRect(cxm-dw/2,wb-14,dw,14);
            g.fillStyle="rgba(255,255,255,0.14)"; g.fillRect(cxm-dw/2,wb-14,dw,2);
            g.fillStyle="#d8b040"; g.fillRect(cxm+dw/2-3,wb-8,2,2);
        }
        function roof(){
            if(flat){
                g.fillStyle=rf[2]; g.fillRect(hx-3,hy+rh-3,hw+6,4);
                g.fillStyle=rf[0]; g.fillRect(hx-3,hy,hw+6,rh);
                g.fillStyle=rf[1]; g.fillRect(hx-3,hy,hw+6,2);
            } else {
                g.fillStyle=rf[2]; g.fillRect(hx-5,hy+rh-3,hw+10,3);
                g.fillStyle=rf[0]; g.fillRect(hx-5,hy,hw+10,rh-2);
                g.fillStyle=rf[1]; g.fillRect(hx-5,hy,hw+10,3);
                g.fillStyle=rf[2];
                for(xx=hx-5;xx<hx+hw+5;xx+=5) g.fillRect(xx,hy+3,1,rh-5);
            }
        }
        /* enseigne : bandeau colore sous le toit */
        function sign(col,txt){
            g.fillStyle="#241c12"; g.fillRect(hx+5,wy+3,hw-10,8);
            g.fillStyle=col;       g.fillRect(hx+6,wy+4,hw-12,6);
            g.fillStyle="rgba(0,0,0,0.4)";
            for(xx=hx+9;xx<hx+hw-10;xx+=4) g.fillRect(xx,wy+6,2,2);
        }
        function cross(cxp,cyp,sz,col){
            g.fillStyle=col;
            g.fillRect(cxp-sz,cyp-(sz/3|0),sz*2,(sz/3|0)*2);
            g.fillRect(cxp-(sz/3|0),cyp-sz,(sz/3|0)*2,sz*2);
        }
        if(kind==="mairie"){
            win(hx+9,wy+9,11,12); win(hx+hw-20,wy+9,11,12);
            win(hx+9,wy+26,11,10); win(hx+hw-20,wy+26,11,10);
            /* perron a colonnes */
            g.fillStyle=wl[1]; g.fillRect(cxm-19,wb-24,38,24);
            g.fillStyle=wl[2]; g.fillRect(cxm-19,wb-24,38,3);
            g.fillStyle="#e8e2cc";
            g.fillRect(cxm-16,wb-21,5,21); g.fillRect(cxm+11,wb-21,5,21);
            door(14,"#4a3520");
            g.fillStyle="#9a9488"; g.fillRect(cxm-22,wb-1,44,3);
            roof();
            /* fronton, horloge et hampe */
            g.fillStyle=wl[0]; g.fillRect(cxm-16,hy-9,32,12);
            g.fillStyle=wl[1]; g.fillRect(cxm-16,hy-9,32,2);
            g.fillStyle=rf[2]; g.fillRect(cxm-18,hy-11,36,3);
            g.fillStyle="#f0ead4"; g.fillRect(cxm-5,hy-7,10,9);
            g.fillStyle="#2a2418"; g.fillRect(cxm-1,hy-5,1,4); g.fillRect(cxm,hy-2,3,1);
            g.fillStyle="#5a5a56"; g.fillRect(cxm-1,hy-26,2,16);
            g.fillStyle="#3a5ad0"; g.fillRect(cxm+1,hy-26,6,8);
            g.fillStyle="#e8e8e0"; g.fillRect(cxm+7,hy-26,5,8);
            g.fillStyle="#c83030"; g.fillRect(cxm+12,hy-26,5,8);
        } else if(kind==="medecin"){
            win(hx+8,wy+8,13,12); win(hx+hw-21,wy+8,13,12);
            door(12,"#e8e8e0");
            roof();
            g.fillStyle="#f4f4ee"; g.fillRect(cxm+10,wy+8,14,14);
            g.fillStyle="#3aa84a"; g.fillRect(cxm+11,wy+9,12,12);
            cross(cxm+17,wy+15,4,"#f4f4ee");
        } else if(kind==="police"){
            win(hx+8,wy+9,12,12,true); win(hx+hw-20,wy+9,12,12,true);
            win(hx+8,wy+26,12,9,true);
            door(14,"#2a3a58");
            roof();
            sign("#2a4ab0");
            /* gyrophare au-dessus de la porte */
            g.fillStyle="#1a2030"; g.fillRect(cxm-4,wb-22,8,5);
            g.fillStyle="#4a80f0"; g.fillRect(cxm-3,wb-21,6,3);
            g.fillStyle="#a8c8ff"; g.fillRect(cxm-3,wb-21,6,1);
        } else if(kind==="armurerie"){
            /* volets de bois fermes */
            g.fillStyle=wl[2]; g.fillRect(hx+8,wy+9,14,13); g.fillRect(hx+hw-22,wy+9,14,13);
            g.fillStyle=rf[1];
            for(yy=wy+10;yy<wy+22;yy+=3){ g.fillRect(hx+9,yy,12,2); g.fillRect(hx+hw-21,yy,12,2); }
            door(13,"#3a2c1c");
            roof();
            sign("#8a2020");
            /* silhouette de fusil sur l'enseigne */
            g.fillStyle="#e8dcc0";
            g.fillRect(hx+10,wy+6,hw-22,2); g.fillRect(hx+12,wy+8,5,2);
        } else if(kind==="soins"){
            win(hx+7,wy+8,12,11); win(hx+22,wy+8,12,11); win(hx+hw-19,wy+8,12,11);
            win(hx+7,wy+24,12,10); win(hx+hw-19,wy+24,12,10);
            door(16,"#cfe0e8");
            roof();
            /* auvent d'entree et grande croix */
            g.fillStyle="#b8bcba"; g.fillRect(cxm-16,wb-20,32,4);
            g.fillStyle="#8e9290"; g.fillRect(cxm-16,wb-17,32,2);
            g.fillStyle="#f4f4f0"; g.fillRect(cxm-11,hy-13,22,14);
            cross(cxm,hy-6,7,"#c83030");
        } else if(kind==="resto"){
            win(hx+9,wy+10,13,12); win(hx+hw-22,wy+10,13,12);
            door(13,"#5a3a22");
            roof();
            /* store raye au-dessus de la devanture */
            for(xx=0;xx<hw-8;xx+=6){
                g.fillStyle=(xx/6|0)%2?"#c83030":"#f0e0c0";
                g.fillRect(hx+4+xx,wy+22,6,7);
            }
            g.fillStyle="rgba(0,0,0,0.25)"; g.fillRect(hx+4,wy+28,hw-8,2);
            /* terrasse : deux gueridons */
            g.fillStyle="rgba(0,0,0,0.2)"; g.fillRect(hx-16,wb+1,26,3);
            g.fillStyle="#e8e4d8"; g.fillRect(hx-15,wb-4,9,6); g.fillRect(hx-2,wb-3,9,6);
            g.fillStyle="#8a7a5a"; g.fillRect(hx-12,wb+1,3,3); g.fillRect(hx+1,wb+2,3,2);
        } else if(kind==="bar"){
            win(hx+8,wy+10,12,11); win(hx+hw-20,wy+10,12,11);
            door(12,"#2e2418");
            roof();
            for(xx=0;xx<hw-8;xx+=6){
                g.fillStyle=(xx/6|0)%2?"#2e6a48":"#e0d0a0";
                g.fillRect(hx+4+xx,wy+21,6,6);
            }
            /* enseigne lumineuse */
            g.fillStyle="#241c12"; g.fillRect(hx+hw-20,hy-11,20,11);
            g.fillStyle="#f0a030"; g.fillRect(hx+hw-18,hy-9,16,7);
            g.fillStyle="#ffd890"; g.fillRect(hx+hw-18,hy-9,16,2);
            /* tonneaux */
            g.fillStyle="#6a4a28"; g.fillRect(hx-11,wb-8,8,10); g.fillRect(hx-11,wb-14,8,7);
            g.fillStyle="#8a6238"; g.fillRect(hx-11,wb-7,8,2); g.fillRect(hx-11,wb-13,8,2);
        } else if(kind==="ecole"){
            for(xx=0;xx<4;xx++) win(hx+8+xx*((hw-16)/4|0),wy+10,13,13);
            for(xx=0;xx<3;xx++) win(hx+12+xx*((hw-24)/3|0),wy+27,11,9);
            door(16,"#5a3a22");
            roof();
            /* clocheton */
            g.fillStyle=wl[1]; g.fillRect(cxm-8,hy-16,16,17);
            g.fillStyle=wl[2]; g.fillRect(cxm+5,hy-16,3,17);
            g.fillStyle="#241c14"; g.fillRect(cxm-4,hy-12,8,8);
            g.fillStyle="#d8b040"; g.fillRect(cxm-2,hy-10,4,5);
            g.fillStyle=rf[2]; g.fillRect(cxm-11,hy-19,22,4);
            g.fillStyle=rf[0]; g.fillRect(cxm-8,hy-25,16,7);
            g.fillStyle=rf[1]; g.fillRect(cxm-8,hy-25,16,2);
            /* cour cloturee */
            g.fillStyle="#6a6a66";
            for(xx=hx-14;xx<hx+hw+14;xx+=8) g.fillRect(xx,wb+7,2,7);
            g.fillRect(hx-14,wb+7,hw+28,2);
        } else if(kind==="superette"){
            /* devanture vitree continue */
            g.fillStyle=wl[2]; g.fillRect(hx+5,wy+7,hw-10,hh-rh-14);
            g.fillStyle="#2a4050"; g.fillRect(hx+7,wy+9,hw-14,hh-rh-18);
            g.fillStyle="#5a8098";
            for(xx=hx+8;xx<hx+hw-8;xx+=9) g.fillRect(xx,wy+9,4,hh-rh-18);
            g.fillStyle=wl[1];
            for(xx=hx+16;xx<hx+hw-8;xx+=16) g.fillRect(xx,wy+7,3,hh-rh-14);
            door(15,"#3a5a6a");
            roof();
            sign("#3aa84a");
            /* chariots devant */
            g.fillStyle="#9aa0a6"; g.fillRect(hx-13,wb-6,10,7); g.fillRect(hx-13,wb-11,10,4);
            g.fillStyle="#6a7076"; g.fillRect(hx-13,wb+1,2,2); g.fillRect(hx-5,wb+1,2,2);
        } else if(kind==="droguerie"){
            g.fillStyle=wl[2]; g.fillRect(hx+6,wy+9,hw-12,13);
            g.fillStyle="#2a3a4a"; g.fillRect(hx+8,wy+11,hw-16,9);
            g.fillStyle="#5a7a90"; g.fillRect(hx+8,wy+11,hw-16,3);
            door(12,"#4a3826");
            roof();
            sign("#c88030");
            /* cageots empiles */
            g.fillStyle="#8a6a3e"; g.fillRect(hx+hw+2,wb-9,10,9); g.fillRect(hx+hw+2,wb-17,10,7);
            g.fillStyle="#a88a56"; g.fillRect(hx+hw+2,wb-9,10,2); g.fillRect(hx+hw+2,wb-17,10,2);
        } else if(d.city){
            /* immeuble : etages reguliers, cage d'escalier, toit plat */
            var et=d.et, fl2=(hh-rh-14)/et, col=Math.max(2,((hw-14)/17)|0), fx2, fy2;
            g.fillStyle=wl[2]; g.fillRect(hx,wy,hw,2);
            for(yy=0;yy<et;yy++){
                for(xx=0;xx<col;xx++){
                    fx2=hx+7+xx*((hw-14)/col); fy2=wy+6+yy*fl2;
                    g.fillStyle="#2a3440"; g.fillRect(fx2,fy2,11,Math.max(7,fl2-6));
                    g.fillStyle=(R()<0.35)?"#8a7a4a":"#54707e";
                    g.fillRect(fx2,fy2,11,3);
                    g.fillStyle=wl[2]; g.fillRect(fx2+5,fy2,1,Math.max(7,fl2-6));
                }
                g.fillStyle=wl[1]; g.fillRect(hx,wy+2+yy*fl2+fl2-4,hw,3);
            }
            /* entree et auvent */
            g.fillStyle=wl[2]; g.fillRect(cxm-13,wb-19,26,19);
            g.fillStyle="#33404a"; g.fillRect(cxm-10,wb-16,20,16);
            g.fillStyle="#5a7280"; g.fillRect(cxm-10,wb-16,20,3);
            g.fillStyle=wl[0]; g.fillRect(cxm-1,wb-16,2,16);
            g.fillStyle=rf[2]; g.fillRect(cxm-17,wb-22,34,4);
            roof();
            /* edicule d'ascenseur et antennes */
            g.fillStyle=rf[1]; g.fillRect(cxm-9,hy-10,18,11);
            g.fillStyle=rf[2]; g.fillRect(cxm-9,hy-10,18,2);
            g.fillStyle="#8a8a84"; g.fillRect(hx+6,hy-13,2,14);
            g.fillRect(hx+hw-9,hy-9,2,10);
        } else if(kind==="depot"){
            /* bardage nervure */
            g.fillStyle=wl[2];
            for(xx=hx+2;xx<hx+hw;xx+=6) g.fillRect(xx,wy,2,hh-rh-6);
            /* grande porte roulante */
            g.fillStyle="#3a3a36"; g.fillRect(cxm-20,wb-26,40,26);
            g.fillStyle="#5a5a54";
            for(yy=wb-25;yy<wb;yy+=4) g.fillRect(cxm-19,yy,38,2);
            g.fillStyle="#7a7a72"; g.fillRect(cxm-21,wb-28,42,3);
            win(hx+5,wy+4,10,8); win(hx+hw-15,wy+4,10,8);
            roof();
            /* quai de chargement et palettes */
            g.fillStyle="#6a665e"; g.fillRect(cxm-24,wb,48,5);
            g.fillStyle="#4a463e"; g.fillRect(cxm-24,wb+4,48,2);
            g.fillStyle="#8a6a3e"; g.fillRect(hx+hw+3,wb-10,12,10);
            g.fillStyle="#a88a56"; g.fillRect(hx+hw+3,wb-10,12,2);
        }
    }
    DUNGEONS.forEach(function(dj){
        var dx0=dj.x, dy0=dj.y, bx, byy;
        /* ombre au sol */
        g.fillStyle="rgba(0,0,0,0.32)"; g.fillRect(dx0-76,dy0+4,152,7);
        /* corps de garde */
        g.fillStyle="#5c5a54"; g.fillRect(dx0-72,dy0-84,144,90);
        g.fillStyle="#4a4842";
        for(byy=dy0-84;byy<dy0+6;byy+=6)
            for(bx=dx0-72+(((byy/6)|0)%2)*7;bx<dx0+72;bx+=14) g.fillRect(bx,byy,13,1);
        g.fillStyle="#6e6c64"; g.fillRect(dx0-72,dy0-84,144,3);
        g.fillStyle="#3a3834"; g.fillRect(dx0-72,dy0+2,144,4);
        /* creneaux du corps */
        g.fillStyle="#5c5a54";
        for(bx=dx0-72;bx<dx0+72;bx+=18) g.fillRect(bx,dy0-94,11,11);
        g.fillStyle="#6e6c64";
        for(bx=dx0-72;bx<dx0+72;bx+=18) g.fillRect(bx,dy0-94,11,2);
        /* meurtrieres eclairees */
        for(bx=-56;bx<=56;bx+=28){
            if(bx>-16&&bx<16) continue;
            g.fillStyle="#1a1614"; g.fillRect(dx0+bx,dy0-66,6,14);
            g.fillStyle="#d8a040"; g.fillRect(dx0+bx+1,dy0-62,4,7);
            g.fillStyle="#3a3834"; g.fillRect(dx0+bx-1,dy0-68,8,2);
        }
        /* deux tours d'angle */
        [-88,66].forEach(function(tox){
            g.fillStyle="#66645c"; g.fillRect(dx0+tox,dy0-108,22,114);
            g.fillStyle="#54524c";
            for(byy=dy0-108;byy<dy0+6;byy+=6) g.fillRect(dx0+tox,byy,22,1);
            g.fillStyle="#7c7a72"; g.fillRect(dx0+tox,dy0-108,4,114);
            g.fillStyle="#3e3c38"; g.fillRect(dx0+tox+18,dy0-108,4,114);
            g.fillStyle="#1a1614"; g.fillRect(dx0+tox+8,dy0-78,6,13);
            g.fillStyle="#d8a040"; g.fillRect(dx0+tox+9,dy0-74,4,7);
            /* creneaux + toit conique */
            g.fillStyle="#66645c";
            for(bx=0;bx<22;bx+=7) g.fillRect(dx0+tox+bx,dy0-117,5,10);
            g.fillStyle="#5e2a1e"; g.fillRect(dx0+tox-4,dy0-124,30,8);
            g.fillStyle="#8a4030"; g.fillRect(dx0+tox-1,dy0-134,24,11);
            g.fillStyle="#a85840"; g.fillRect(dx0+tox+3,dy0-134,16,3);
            g.fillStyle="#5e2a1e"; g.fillRect(dx0+tox+6,dy0-131,2,8); g.fillRect(dx0+tox+14,dy0-131,2,8);
            /* oriflamme */
            g.fillStyle="#2a2620"; g.fillRect(dx0+tox+10,dy0-152,2,19);
            g.fillStyle="#8a2838"; g.fillRect(dx0+tox+12,dy0-152,12,9);
            g.fillStyle="#b04050"; g.fillRect(dx0+tox+12,dy0-152,12,2);
        });
        /* porte en arche + herse */
        g.fillStyle="#3a3834"; g.fillRect(dx0-16,dy0-30,32,36);
        g.fillStyle="#0a0808"; g.fillRect(dx0-12,dy0-24,24,30);
        g.fillRect(dx0-10,dy0-28,20,5);
        g.fillStyle="#6e6c64";
        g.fillRect(dx0-16,dy0-32,32,3); g.fillRect(dx0-16,dy0-30,4,36); g.fillRect(dx0+12,dy0-30,4,36);
        g.fillStyle="#4a443a";
        for(bx=-10;bx<11;bx+=5) g.fillRect(dx0+bx,dy0-22,2,20);
        g.fillRect(dx0-11,dy0-16,22,2); g.fillRect(dx0-11,dy0-8,22,2);
        /* marches */
        g.fillStyle="#7a7870"; g.fillRect(dx0-20,dy0+4,40,4);
        g.fillStyle="#5c5a54"; g.fillRect(dx0-24,dy0+8,48,4);
        /* mousse et gravats */
        g.fillStyle="#3e5e2c";
        g.fillRect(dx0-64,dy0-8,7,3); g.fillRect(dx0+52,dy0-14,5,3); g.fillRect(dx0-40,dy0-2,6,2);
        g.fillStyle="#54545a";
        g.fillRect(dx0-80,dy0+2,5,4); g.fillRect(dx0+74,dy0-2,4,4);
    });
    /* barrieres des patures : deux lisses et des piquets, avec une ouverture */
    FARMS.forEach(function(f){
        f.fields.forEach(function(fd){
            if(fd.t!=="pature") return;
            var gs=fd.gate?fd.gate.o:0, gsd=fd.gate?fd.gate.s:-1, q;
            function rail(x0,y0,horiz,len,skip){
                var a0=skip?(len-gs)/2:len, b0=skip?(len+gs)/2:len;
                function part(from,to){
                    if(to<=from) return;
                    if(horiz){
                        g.fillStyle="#6a5030"; g.fillRect(x0+from,y0-5,to-from,2);
                        g.fillStyle="#7e6038"; g.fillRect(x0+from,y0-1,to-from,2);
                        g.fillStyle="#4a3520";
                        for(q=from;q<to;q+=13) g.fillRect(x0+q,y0-8,3,10);
                    } else {
                        g.fillStyle="#6a5030"; g.fillRect(x0-4,y0+from,2,to-from);
                        g.fillStyle="#7e6038"; g.fillRect(x0,y0+from,2,to-from);
                        g.fillStyle="#4a3520";
                        for(q=from;q<to;q+=13) g.fillRect(x0-5,y0+q,8,3);
                    }
                }
                if(skip){ part(0,a0); part(b0,len); } else part(0,len);
            }
            rail(fd.x,fd.y+1,true,fd.w,gsd===1);
            rail(fd.x,fd.y+fd.h,true,fd.w,gsd===0);
            rail(fd.x+2,fd.y,false,fd.h,gsd===2);
            rail(fd.x+fd.w-1,fd.y,false,fd.h,gsd===3);
        });
    });
    FARMS.forEach(function(f){ house(f.bx,f.by,40,32); });
    HUTS.forEach(function(h){
        house(h.x,h.y,40,30);
        /* sechoir a filets accole */
        g.fillStyle="#5a4630"; g.fillRect(h.x+42,h.y+6,2,22); g.fillRect(h.x+56,h.y+6,2,22);
        g.fillStyle="#6a5a44"; g.fillRect(h.x+42,h.y+6,16,2);
        g.fillStyle="rgba(180,170,140,0.5)";
        for(var hz=0;hz<5;hz++) g.fillRect(h.x+43,h.y+9+hz*3,14,1);
        for(hz=0;hz<5;hz++) g.fillRect(h.x+44+hz*3,h.y+9,1,12);
        /* tonneau et casier */
        g.fillStyle="#5a3f22"; g.fillRect(h.x-12,h.y+18,10,12);
        g.fillStyle="#7a5a34"; g.fillRect(h.x-12,h.y+18,10,2); g.fillRect(h.x-12,h.y+24,10,2);
    });
    /* ---- MOBILIER URBAIN ---- */
    CITYDECO.forEach(function(m){
        var x0=m.x|0, y0=m.y|0, q, a;
        if(m.k==="fontaine"){
            /* vasque ronde, eau, jet central */
            g.fillStyle="rgba(0,0,0,0.26)";
            g.beginPath(); g.ellipse(x0+2,y0+10,19,9,0,0,7); g.fill();
            g.fillStyle="#8a8578";
            g.beginPath(); g.ellipse(x0,y0+4,19,13,0,0,7); g.fill();
            g.fillStyle="#9e9a8c";
            g.beginPath(); g.ellipse(x0,y0+2,19,13,0,0,7); g.fill();
            g.fillStyle="#2a5c78";
            g.beginPath(); g.ellipse(x0,y0+2,14,9,0,0,7); g.fill();
            g.fillStyle="#3f7a98";
            g.beginPath(); g.ellipse(x0-2,y0,10,6,0,0,7); g.fill();
            g.fillStyle="#7fb4cc";
            for(q=0;q<14;q++){ a=R()*6.283;
                g.fillRect((x0+Math.cos(a)*R()*12)|0,(y0+2+Math.sin(a)*R()*7)|0,2,1); }
            g.fillStyle="#8a8578"; g.fillRect(x0-3,y0-14,6,16);
            g.fillStyle="#a09a8a"; g.fillRect(x0-3,y0-14,6,3);
            g.fillStyle="rgba(190,225,240,0.7)";
            g.fillRect(x0-1,y0-22,2,9);
            g.fillRect(x0-5,y0-18,2,4); g.fillRect(x0+4,y0-18,2,4);
        } else if(m.k==="statue"){
            /* socle, silhouette de bronze */
            g.fillStyle="rgba(0,0,0,0.26)"; g.fillRect(x0-10,y0+6,21,3);
            g.fillStyle="#7e7a6e"; g.fillRect(x0-10,y0-2,21,9);
            g.fillStyle="#928e80"; g.fillRect(x0-10,y0-2,21,2);
            g.fillStyle="#6a6658"; g.fillRect(x0-8,y0-6,17,5);
            var bz=["#5c6a4a","#6a5a3a","#4a5a5a"][m.s];
            g.fillStyle=bz;
            g.fillRect(x0-4,y0-22,8,17);
            g.fillRect(x0-7,y0-18,4,9);
            g.fillRect(x0+4,y0-20,3,11);
            g.fillRect(x0-3,y0-28,6,6);
            g.fillStyle="rgba(255,255,255,0.14)";
            g.fillRect(x0-4,y0-22,3,17); g.fillRect(x0-3,y0-28,2,6);
        } else {
            /* bac a fleurs : caisse de bois et floraison */
            var wp=["#7a5a34","#6a6252","#8a6a3e"][m.s];
            g.fillStyle="rgba(0,0,0,0.24)"; g.fillRect(x0-9,y0+5,19,3);
            g.fillStyle=wp; g.fillRect(x0-9,y0-4,19,9);
            g.fillStyle="rgba(255,255,255,0.12)"; g.fillRect(x0-9,y0-4,19,2);
            g.fillStyle="rgba(0,0,0,0.3)";
            for(q=x0-7;q<x0+9;q+=5) g.fillRect(q,y0-3,1,7);
            g.fillStyle="#3a2c1c"; g.fillRect(x0-7,y0-6,15,3);
            g.fillStyle="#40561f";
            for(q=0;q<16;q++)
                g.fillRect((x0-7+R()*15)|0,(y0-10+R()*6)|0,2,3);
            var fl=["#c85a5a","#d8b048","#b060b0","#e0e0d0"][(R()*4)|0];
            for(q=0;q<7;q++){
                g.fillStyle=fl;
                g.fillRect((x0-6+R()*13)|0,(y0-12+R()*6)|0,2,2);
            }
        }
    });
    /* ---- BATIMENTS ISOLES ---- */
    /* caserne militaire : enceinte grillagee, corps de garde, baraquements */
    ARMYBASES.forEach(function(a){
        var xx, yy;
        /* terre-plein */
        g.fillStyle="#4e5040"; g.fillRect(a.fx,a.fy,a.fw,a.fh);
        g.fillStyle="#585a48";
        for(xx=0;xx<220;xx++) g.fillRect((a.fx+R()*a.fw)|0,(a.fy+R()*a.fh)|0,3,2);
        /* cloture : poteaux et grillage, ouverture au sud */
        function fence(x0,y0,x1,y1){
            g.fillStyle="rgba(150,160,150,0.5)";
            if(y0===y1){ for(xx=x0;xx<x1;xx+=3) g.fillRect(xx,y0-11,1,11); }
            else       { for(yy=y0;yy<y1;yy+=3) g.fillRect(x0,yy-11,1,11); }
            g.fillStyle="#7a7c70";
            if(y0===y1){ for(xx=x0;xx<x1;xx+=16) g.fillRect(xx,y0-13,3,14); g.fillRect(x0,y0-13,x1-x0,2); }
            else       { for(yy=y0;yy<y1;yy+=16) g.fillRect(x0,yy-13,3,14); g.fillRect(x0,y0-13,3,y1-y0); }
        }
        fence(a.fx,a.fy+4,a.fx+a.fw,a.fy+4);
        fence(a.fx,a.fy+4,a.fx,a.fy+a.fh);
        fence(a.fx+a.fw-3,a.fy+4,a.fx+a.fw-3,a.fy+a.fh);
        fence(a.fx,a.fy+a.fh,a.fx+88,a.fy+a.fh);
        fence(a.fx+136,a.fy+a.fh,a.fx+a.fw,a.fy+a.fh);
        /* portail ferme : deux vantaux grillages, montants et chaine */
        (function(){
            var gx=a.fx+88, gy=a.fy+a.fh, gw=48;
            g.fillStyle="rgba(150,160,150,0.62)";
            for(xx=gx+2;xx<gx+gw-2;xx+=3) g.fillRect(xx,gy-12,1,12);
            for(yy=gy-12;yy<gy;yy+=3) g.fillRect(gx+2,yy,gw-4,1);
            g.fillStyle="#8a8c80";
            g.fillRect(gx,gy-15,3,15); g.fillRect(gx+gw-3,gy-15,3,15);
            g.fillRect(gx+gw/2-2,gy-14,4,14);
            g.fillRect(gx,gy-15,gw,2);
            g.fillStyle="#b4b09c";
            g.fillRect(gx+gw/2-4,gy-9,8,3);
            g.fillStyle="#3a3c34";
            g.fillRect(gx+gw/2-1,gy-8,2,4);
        })();
        /* guerite a l'entree */
        g.fillStyle="#4a4e3a"; g.fillRect(a.fx+92,a.fy+a.fh-22,18,20);
        g.fillStyle="#5c6048"; g.fillRect(a.fx+92,a.fy+a.fh-22,18,3);
        g.fillStyle="#24281c"; g.fillRect(a.fx+96,a.fy+a.fh-17,10,7);
        /* baraquements */
        [a.b1,a.b2].forEach(function(b){
            g.fillStyle="rgba(0,0,0,0.24)"; g.fillRect(b.x+3,b.y+26,54,3);
            g.fillStyle="#5a6046"; g.fillRect(b.x,b.y+7,54,19);
            g.fillStyle="#4a5038"; g.fillRect(b.x,b.y+22,54,4);
            g.fillStyle="#3e4432"; g.fillRect(b.x-3,b.y,60,8);
            g.fillStyle="#525a40"; g.fillRect(b.x-3,b.y,60,2);
            g.fillStyle="#242a1c";
            g.fillRect(b.x+8,b.y+11,9,7); g.fillRect(b.x+22,b.y+11,9,7); g.fillRect(b.x+36,b.y+11,9,7);
        });
        /* corps de garde principal */
        var bx=a.x-48, by=a.y-40;
        g.fillStyle="rgba(0,0,0,0.28)"; g.fillRect(bx+4,by+54,96,4);
        g.fillStyle="#5a6046"; g.fillRect(bx,by+14,96,40);
        g.fillStyle="#666e50";
        for(yy=by+14;yy<by+54;yy+=5) g.fillRect(bx,yy,96,1);
        g.fillStyle="#4a5038"; g.fillRect(bx,by+48,96,6);
        g.fillStyle="#3e4432"; g.fillRect(bx-6,by,108,16);
        g.fillStyle="#525a40"; g.fillRect(bx-6,by,108,3);
        g.fillStyle="#242a1c";
        for(xx=0;xx<4;xx++) g.fillRect(bx+9+xx*22,by+20,13,10);
        g.fillStyle="#2e3424"; g.fillRect(bx+40,by+36,17,18);
        g.fillStyle="#4a5038"; g.fillRect(bx+40,by+36,17,2);
        /* mat et fanion */
        g.fillStyle="#6a6a62"; g.fillRect(a.x-2,by-30,3,32);
        g.fillStyle="#6a7048"; g.fillRect(a.x+1,by-30,15,9);
        g.fillStyle="#828a5c"; g.fillRect(a.x+1,by-30,15,3);
        /* etoile peinte au sol */
        g.fillStyle="rgba(200,190,140,0.35)";
        g.fillRect(a.x-14,a.y+34,28,4); g.fillRect(a.x-2,a.y+22,4,28);
    });
    /* caserne de pompiers : trois portes de garage et une tour a tuyaux */
    FIREHOUSES.forEach(function(f){
        var bx=f.x-44, by=f.y-34, xx, yy;
        /* aire betonnee */
        g.fillStyle="#5c5c58"; g.fillRect(bx-10,by+50,118,26);
        g.fillStyle="#6a6a64";
        for(xx=0;xx<70;xx++) g.fillRect((bx-10+R()*118)|0,(by+50+R()*26)|0,3,2);
        g.fillStyle="#c8b840";
        for(xx=bx-6;xx<bx+104;xx+=14) g.fillRect(xx,by+72,8,2);
        /* tour a tuyaux */
        g.fillStyle="rgba(0,0,0,0.26)"; g.fillRect(f.x+50,by+50,20,4);
        g.fillStyle="#a83028"; g.fillRect(f.x+46,by-24,20,74);
        g.fillStyle="#c04038"; g.fillRect(f.x+46,by-24,20,3);
        g.fillStyle="#7c221c"; g.fillRect(f.x+62,by-24,4,74);
        g.fillStyle="#241a18";
        for(yy=by-16;yy<by+44;yy+=16) g.fillRect(f.x+51,yy,10,9);
        g.fillStyle="#4a4a46"; g.fillRect(f.x+44,by-30,24,7);
        /* corps de caserne */
        g.fillStyle="rgba(0,0,0,0.28)"; g.fillRect(bx+4,by+50,88,4);
        g.fillStyle="#b03830"; g.fillRect(bx,by+13,88,37);
        g.fillStyle="#c04a3c"; g.fillRect(bx,by+13,88,3);
        g.fillStyle="#8a2620"; g.fillRect(bx,by+45,88,5);
        g.fillStyle="#3a3a38"; g.fillRect(bx-5,by,98,15);
        g.fillStyle="#54544e"; g.fillRect(bx-5,by,98,3);
        /* portes de garage */
        for(xx=0;xx<3;xx++){
            var gx2=bx+5+xx*29;
            g.fillStyle="#e8e4d8"; g.fillRect(gx2,by+20,24,30);
            g.fillStyle="#c8c4b8";
            for(yy=by+21;yy<by+50;yy+=4) g.fillRect(gx2+1,yy,22,2);
            g.fillStyle="#8a2620"; g.fillRect(gx2,by+20,24,3);
        }
        /* enseigne */
        g.fillStyle="#241c14"; g.fillRect(bx+22,by+2,44,10);
        g.fillStyle="#f0c040"; g.fillRect(bx+24,by+4,40,6);
        g.fillStyle="#8a2620";
        for(xx=bx+27;xx<bx+62;xx+=5) g.fillRect(xx,by+6,3,2);
    });
    /* hopital : bloc blanc, croix sur le toit, auvent d'entree, helisurface */
    HOSPITALS.forEach(function(h){
        var bx=h.x-61, by=h.y-44, xx, yy;
        /* parking et helisurface */
        g.fillStyle="#5a5a56"; g.fillRect(bx-14,by+66,150,30);
        g.fillStyle="#4e4e4a"; g.fillRect(bx+96,by-40,58,58);
        g.strokeStyle="#e0e0d4"; g.lineWidth=3;
        g.beginPath(); g.arc(bx+125,by-11,22,0,7); g.stroke();
        g.fillStyle="#e0e0d4";
        g.fillRect(bx+116,by-23,4,24); g.fillRect(bx+130,by-23,4,24); g.fillRect(bx+116,by-13,18,4);
        g.lineWidth=1;
        /* corps du batiment */
        g.fillStyle="rgba(0,0,0,0.3)"; g.fillRect(bx+5,by+64,122,5);
        g.fillStyle="#e8e8e2"; g.fillRect(bx,by+16,122,48);
        g.fillStyle="#d4d4cc"; g.fillRect(bx,by+56,122,8);
        g.fillStyle="#c0c0b8"; g.fillRect(bx+118,by+16,4,48);
        g.fillStyle="#b8bcbe"; g.fillRect(bx-5,by,132,18);
        g.fillStyle="#cfd3d4"; g.fillRect(bx-5,by,132,4);
        /* fenetres en bandes */
        for(yy=0;yy<2;yy++) for(xx=0;xx<6;xx++){
            g.fillStyle="#2a3a4a"; g.fillRect(bx+8+xx*19,by+22+yy*17,14,11);
            g.fillStyle="#5a7a90"; g.fillRect(bx+8+xx*19,by+22+yy*17,14,4);
        }
        /* auvent et portes vitrees */
        g.fillStyle="#9aa0a2"; g.fillRect(h.x-24,by+58,48,7);
        g.fillStyle="#c8ccce"; g.fillRect(h.x-24,by+58,48,2);
        g.fillStyle="#6a7a86"; g.fillRect(h.x-16,by+42,32,22);
        g.fillStyle="#8fa4b0"; g.fillRect(h.x-16,by+42,32,3);
        g.fillStyle="#e8e8e2"; g.fillRect(h.x-1,by+42,2,22);
        /* croix rouge sur le toit */
        g.fillStyle="#f4f4f0"; g.fillRect(h.x-15,by-16,30,18);
        g.fillStyle="#c83030";
        g.fillRect(h.x-11,by-10,22,7); g.fillRect(h.x-4,by-16,8,18);
    });
    /* ---- PORTS : quai, bateaux, bourg portuaire ---- */
    PORTS.forEach(function(po){
        var nx=po.nx, ny=po.ny, tx=-ny, ty=nx, q, k4;
        var qx=po.quay.x, qy=po.quay.y, ql=po.quay.l, qw=po.quay.w;
        /* le quai avance dans l'eau, dans le sens oppose a la normale */
        function qp(alongOut,across){
            return {x:qx-nx*alongOut+tx*across, y:qy-ny*alongOut+ty*across};
        }
        /* pilotis */
        g.fillStyle="#2e2418";
        for(q=10;q<ql;q+=22) for(k4=-1;k4<=1;k4+=2){
            var pl=qp(q,k4*(qw/2-4));
            g.fillRect((pl.x-2)|0,(pl.y-2)|0,5,5);
        }
        /* tablier */
        g.save();
        g.beginPath();
        var c1=qp(-16,-qw/2), c2=qp(-16,qw/2), c3=qp(ql,qw/2), c4=qp(ql,-qw/2);
        g.moveTo(c1.x,c1.y); g.lineTo(c2.x,c2.y); g.lineTo(c3.x,c3.y); g.lineTo(c4.x,c4.y);
        g.closePath();
        g.fillStyle="#6a5a44"; g.fill();
        g.clip();
        g.fillStyle="#57492f";
        for(q=-16;q<ql;q+=7){
            var d1=qp(q,-qw/2), d2=qp(q,qw/2);
            g.beginPath(); g.moveTo(d1.x,d1.y); g.lineTo(d2.x,d2.y);
            g.strokeStyle="#57492f"; g.lineWidth=2; g.stroke();
        }
        g.restore();
        g.lineWidth=1;
        /* bordures et bittes d'amarrage */
        g.strokeStyle="#8a7654"; g.lineWidth=3;
        g.beginPath(); g.moveTo(c1.x,c1.y); g.lineTo(c4.x,c4.y);
        g.moveTo(c2.x,c2.y); g.lineTo(c3.x,c3.y); g.stroke();
        g.lineWidth=1;
        g.fillStyle="#3a3a36";
        for(q=24;q<ql;q+=40) for(k4=-1;k4<=1;k4+=2){
            var bl=qp(q,k4*(qw/2-3));
            g.fillRect((bl.x-3)|0,(bl.y-4)|0,6,7);
            g.fillStyle="#55554e"; g.fillRect((bl.x-3)|0,(bl.y-4)|0,6,2);
            g.fillStyle="#3a3a36";
        }
        /* caisses et filets sur le quai */
        for(q=0;q<7;q++){
            var cl=qp(30+R()*(ql-60),(R()-0.5)*(qw-18));
            g.fillStyle="#7a5a34"; g.fillRect((cl.x-5)|0,(cl.y-5)|0,11,10);
            g.fillStyle="#96703f"; g.fillRect((cl.x-5)|0,(cl.y-5)|0,11,2);
        }
        /* bateaux amarres */
        po.boats.forEach(function(bo){
            var pal=[["#8a3a30","#a8503c","#5e241c"],
                     ["#2e5a6a","#3e7284","#1e3c48"],
                     ["#6a6252","#847c68","#464034"]][bo.s];
            var ctr={x:bo.cx,y:bo.cy};
            var hl=bo.len/2, hw2=bo.bw/2;
            /* ombre dans l'eau */
            g.fillStyle="rgba(6,20,32,0.45)";
            g.beginPath();
            g.moveTo(ctr.x-nx*hl+tx*hw2+3,ctr.y-ny*hl+ty*hw2+3);
            g.lineTo(ctr.x+nx*hl*0.9+tx*hw2*0.5+3,ctr.y+ny*hl*0.9+ty*hw2*0.5+3);
            g.lineTo(ctr.x+nx*hl*0.9-tx*hw2*0.5+3,ctr.y+ny*hl*0.9-ty*hw2*0.5+3);
            g.lineTo(ctr.x-nx*hl-tx*hw2+3,ctr.y-ny*hl-ty*hw2+3);
            g.closePath(); g.fill();
            /* coque : poupe large, proue effilee */
            g.beginPath();
            g.moveTo(ctr.x-nx*hl+tx*hw2,ctr.y-ny*hl+ty*hw2);
            g.lineTo(ctr.x+nx*hl*0.72+tx*hw2*0.86,ctr.y+ny*hl*0.72+ty*hw2*0.86);
            g.lineTo(ctr.x+nx*hl,ctr.y+ny*hl);
            g.lineTo(ctr.x+nx*hl*0.72-tx*hw2*0.86,ctr.y+ny*hl*0.72-ty*hw2*0.86);
            g.lineTo(ctr.x-nx*hl-tx*hw2,ctr.y-ny*hl-ty*hw2);
            g.closePath();
            g.fillStyle=pal[0]; g.fill();
            g.strokeStyle=pal[2]; g.lineWidth=2; g.stroke(); g.lineWidth=1;
            /* pont et liston */
            g.beginPath();
            g.moveTo(ctr.x-nx*hl*0.82+tx*hw2*0.68,ctr.y-ny*hl*0.82+ty*hw2*0.68);
            g.lineTo(ctr.x+nx*hl*0.66+tx*hw2*0.58,ctr.y+ny*hl*0.66+ty*hw2*0.58);
            g.lineTo(ctr.x+nx*hl*0.86,ctr.y+ny*hl*0.86);
            g.lineTo(ctr.x+nx*hl*0.66-tx*hw2*0.58,ctr.y+ny*hl*0.66-ty*hw2*0.58);
            g.lineTo(ctr.x-nx*hl*0.82-tx*hw2*0.68,ctr.y-ny*hl*0.82-ty*hw2*0.68);
            g.closePath();
            g.fillStyle="#a89070"; g.fill();
            /* cabine vers l'arriere */
            var cab=8;
            g.fillStyle=pal[1];
            g.fillRect((ctr.x-nx*hl*0.34-cab)|0,(ctr.y-ny*hl*0.34-cab)|0,cab*2,cab*2);
            g.fillStyle=pal[2];
            g.fillRect((ctr.x-nx*hl*0.34-cab)|0,(ctr.y-ny*hl*0.34-cab)|0,cab*2,3);
            g.fillStyle="#2a3a46";
            g.fillRect((ctr.x-nx*hl*0.34-4)|0,(ctr.y-ny*hl*0.34-3)|0,8,6);
            /* mat et amarres */
            g.fillStyle="#6a5a3e";
            g.fillRect((ctr.x-1)|0,(ctr.y-1)|0,3,3);
            g.strokeStyle="rgba(210,200,170,0.6)"; g.lineWidth=1;
            g.beginPath();
            var am=qp(bo.d-14,bo.o*(qw/2-2));
            g.moveTo(am.x,am.y);
            g.lineTo(ctr.x-nx*hl*0.5,ctr.y-ny*hl*0.5);
            g.stroke();
        });
        /* bourg portuaire */
        po.bld.forEach(function(b){
            if(b.k==="maison") house(b.x,b.y,b.w,b.h); else bldg(b.x,b.y,b.w,b.h,b.k);
        });
        /* panneau de depart, cote terre */
        var sgx=(po.x+nx*-90)|0, sgy=(po.y+ny*-90)|0;
        g.fillStyle="rgba(0,0,0,0.3)"; g.fillRect(sgx-9,sgy+4,20,3);
        g.fillStyle="#5a4326"; g.fillRect(sgx-2,sgy-14,3,18); g.fillRect(sgx+8,sgy-14,3,18);
        g.fillStyle="#8a6a3e"; g.fillRect(sgx-6,sgy-24,21,12);
        g.fillStyle="#c8a860"; g.fillRect(sgx-6,sgy-24,21,2);
        g.fillStyle="#3a2a16";
        g.fillRect(sgx-3,sgy-20,4,1); g.fillRect(sgx+3,sgy-20,7,1);
        g.fillRect(sgx-3,sgy-17,10,1);
    });
    /* abri de bois : appentis de planches, toit de tole, foyer eteint */
    SHELTERS.forEach(function(a){
        var bx=a.x-15, by=a.y-14, xx;
        var pal=[["#6a5030","#7e6038","#4a3520"],
                 ["#5e5442","#72684e","#423b2e"],
                 ["#70563a","#866a48","#4e3c28"]][a.s];
        if(a.t==="tente"){
            /* tente canadienne : deux pans de toile, un mat, des piquets */
            var tp=[["#5a6a48","#6e8058","#3e4c32"],
                    ["#6a5c42","#82724f","#4a4030"],
                    ["#4e5a62","#647078","#363f46"]][a.s];
            g.fillStyle="rgba(0,0,0,0.26)"; g.fillRect(bx+1,by+20,32,3);
            /* pan de gauche */
            g.beginPath();
            g.moveTo(a.x,by-2); g.lineTo(bx-2,by+21); g.lineTo(a.x,by+21);
            g.closePath(); g.fillStyle=tp[1]; g.fill();
            /* pan de droite, a l'ombre */
            g.beginPath();
            g.moveTo(a.x,by-2); g.lineTo(bx+32,by+21); g.lineTo(a.x,by+21);
            g.closePath(); g.fillStyle=tp[0]; g.fill();
            /* faitiere et ouverture */
            g.fillStyle=tp[2]; g.fillRect(a.x-1,by-2,2,23);
            g.beginPath();
            g.moveTo(a.x-6,by+21); g.lineTo(a.x,by+7); g.lineTo(a.x+6,by+21);
            g.closePath(); g.fillStyle="#1c1610"; g.fill();
            /* mat, haubans et piquets */
            g.fillStyle="#6a5a3e"; g.fillRect(a.x-1,by-8,2,7);
            g.strokeStyle="rgba(200,190,160,0.55)"; g.lineWidth=1;
            g.beginPath();
            g.moveTo(a.x,by-7); g.lineTo(bx-9,by+22);
            g.moveTo(a.x,by-7); g.lineTo(bx+39,by+22);
            g.stroke();
            g.fillStyle="#4a3f2c";
            g.fillRect(bx-10,by+21,2,4); g.fillRect(bx+38,by+21,2,4);
            /* cercle de pierres du foyer */
            g.fillStyle="#4a463e";
            for(xx=0;xx<7;xx++)
                g.fillRect((a.x+18*Math.cos(xx/7*6.283))|0,(a.y+24+10*Math.sin(xx/7*6.283))|0,4,3);
            g.fillStyle="#2a241c"; g.fillRect(a.x-4,a.y+22,8,5);
            return;
        }
        g.fillStyle="rgba(0,0,0,0.26)"; g.fillRect(bx+3,by+20,30,3);
        /* planches verticales */
        g.fillStyle=pal[0]; g.fillRect(bx,by+5,30,15);
        g.fillStyle=pal[2];
        for(xx=bx+2;xx<bx+30;xx+=5) g.fillRect(xx,by+5,1,15);
        g.fillStyle=pal[1]; g.fillRect(bx,by+5,30,2);
        /* ouverture sombre */
        g.fillStyle="#1c1610"; g.fillRect(bx+(a.f>0?7:12),by+9,11,11);
        /* toit de tole en pente */
        g.fillStyle="#565a58"; g.fillRect(bx-4,by-1,38,7);
        g.fillStyle="#6e726e"; g.fillRect(bx-4,by-1,38,2);
        g.fillStyle="#3e423e";
        for(xx=bx-4;xx<bx+34;xx+=6) g.fillRect(xx,by+1,1,5);
        /* etai et bois empile */
        g.fillStyle=pal[2]; g.fillRect(bx+(a.f>0?31:-3),by+4,3,17);
        g.fillStyle="#4e3c26";
        g.fillRect(bx+(a.f>0?-11:33),by+13,9,4); g.fillRect(bx+(a.f>0?-11:33),by+17,9,4);
        g.fillStyle="#6a5236"; g.fillRect(bx+(a.f>0?-11:33),by+13,9,1);
        /* cercle de pierres du foyer */
        g.fillStyle="#4a463e";
        for(xx=0;xx<7;xx++)
            g.fillRect((a.x+18*Math.cos(xx/7*6.283))|0,(a.y+24+10*Math.sin(xx/7*6.283))|0,4,3);
        g.fillStyle="#2a241c"; g.fillRect(a.x-4,a.y+22,8,5);
    });
    /* camp scout : trois tentes autour d'un foyer de pierres */
    CAMPS.forEach(function(cp){
        var xx, yy;
        /* le foyer, au centre : pierres, cendres et deux buches croisees */
        g.fillStyle="#4a463e";
        for(xx=0;xx<9;xx++)
            g.fillRect((cp.x+13*Math.cos(xx/9*6.283))|0,
                       (cp.y+7*Math.sin(xx/9*6.283))|0,4,3);
        g.fillStyle="#241e18"; g.fillRect(cp.x-8,cp.y-4,16,8);
        g.fillStyle="#5a4630"; g.fillRect(cp.x-7,cp.y-2,14,3);
        g.fillStyle="#4a3826"; g.fillRect(cp.x-2,cp.y-6,4,11);
        cp.tents.forEach(function(t){
            var bx=t.x-15, by=t.y-14;
            var tp=[["#6a7048","#7e8658","#4a5032"],
                    ["#7a6a46","#8e7e56","#544830"],
                    ["#5a6258","#6e7668","#3e453e"]][t.s];
            g.fillStyle="rgba(0,0,0,0.26)"; g.fillRect(bx+1,by+20,32,3);
            /* deux pans de toile */
            g.beginPath();
            g.moveTo(t.x,by-2); g.lineTo(bx-2,by+21); g.lineTo(t.x,by+21);
            g.closePath(); g.fillStyle=tp[1]; g.fill();
            g.beginPath();
            g.moveTo(t.x,by-2); g.lineTo(bx+32,by+21); g.lineTo(t.x,by+21);
            g.closePath(); g.fillStyle=tp[0]; g.fill();
            /* faitiere, ouverture, haubans */
            g.fillStyle=tp[2]; g.fillRect(t.x-1,by-2,2,23);
            g.beginPath();
            g.moveTo(t.x-6,by+21); g.lineTo(t.x,by+7); g.lineTo(t.x+6,by+21);
            g.closePath(); g.fillStyle="#1c1610"; g.fill();
            g.strokeStyle="rgba(200,190,160,0.5)"; g.lineWidth=1;
            g.beginPath();
            g.moveTo(t.x,by-1); g.lineTo(bx-8,by+22);
            g.moveTo(t.x,by-1); g.lineTo(bx+38,by+22);
            g.stroke();
            g.fillStyle="#4a3f2c";
            g.fillRect(bx-9,by+21,2,4); g.fillRect(bx+37,by+21,2,4);
        });
    });
    /* laboratoire H-teck : bloc de beton dans son enclos grillage, deux cuves
       accolees, une porte de service restee ouverte au sud. Le dallage clair
       et le grillage disent de loin qu'on n'est pas dans une ferme. */
    if(LAB){
        var lb=LAB, xx2, yy2;
        /* dallage de l'enclos */
        g.fillStyle="#5e6260"; g.fillRect(lb.x-76,lb.y-64,152,128);
        g.fillStyle="#666a68";
        for(xx2=lb.x-76;xx2<lb.x+76;xx2+=19)
            for(yy2=lb.y-64;yy2<lb.y+64;yy2+=16)
                g.fillRect(xx2,yy2,18,15);
        g.fillStyle="rgba(30,34,32,0.35)";
        for(xx2=lb.x-76;xx2<lb.x+77;xx2+=19) g.fillRect(xx2,lb.y-64,1,128);
        for(yy2=lb.y-64;yy2<lb.y+65;yy2+=16) g.fillRect(lb.x-76,yy2,152,1);
        /* grillage : poteaux et maille, ouvert plein sud */
        g.fillStyle="#8e948f";
        g.fillRect(lb.x-78,lb.y-66,156,3);
        g.fillRect(lb.x-78,lb.y-66,3,130);
        g.fillRect(lb.x+75,lb.y-66,3,130);
        g.fillRect(lb.x-78,lb.y+61,52,3); g.fillRect(lb.x+26,lb.y+61,52,3);
        g.fillStyle="rgba(190,198,192,0.30)";
        for(xx2=lb.x-76;xx2<lb.x+77;xx2+=6){
            g.fillRect(xx2,lb.y-66,1,7);
            if(xx2<lb.x-26||xx2>lb.x+26) g.fillRect(xx2,lb.y+57,1,7);
        }
        for(yy2=lb.y-62;yy2<lb.y+62;yy2+=6){
            g.fillRect(lb.x-78,yy2,7,1); g.fillRect(lb.x+72,yy2,7,1);
        }
        /* les deux cuves */
        lb.tanks.forEach(function(tk){
            g.fillStyle="rgba(0,0,0,0.28)";
            g.beginPath(); g.arc(tk.x+2,tk.y+3,tk.r,0,6.283); g.fill();
            g.fillStyle="#8a9088";
            g.beginPath(); g.arc(tk.x,tk.y,tk.r,0,6.283); g.fill();
            g.fillStyle="#a2a89e";
            g.beginPath(); g.arc(tk.x-2,tk.y-2,tk.r*0.55,0,6.283); g.fill();
            g.fillStyle="#4e5450";
            g.beginPath(); g.arc(tk.x,tk.y,tk.r*0.28,0,6.283); g.fill();
        });
        /* le corps de batiment */
        g.fillStyle="rgba(0,0,0,0.32)"; g.fillRect(lb.x-40,lb.y+28,84,5);
        g.fillStyle="#9aa09c"; g.fillRect(lb.x-44,lb.y-30,88,62);
        g.fillStyle="#aab0ac"; g.fillRect(lb.x-44,lb.y-30,88,9);
        g.fillStyle="#7e8480"; g.fillRect(lb.x-44,lb.y+24,88,8);
        /* joints de panneaux prefabriques */
        g.fillStyle="rgba(60,66,62,0.45)";
        for(xx2=lb.x-44;xx2<lb.x+44;xx2+=14) g.fillRect(xx2,lb.y-21,1,45);
        /* bandeau de fenetres en verre depoli */
        g.fillStyle="#4a5e64"; g.fillRect(lb.x-36,lb.y-14,72,12);
        g.fillStyle="#6e8a90";
        for(xx2=lb.x-36;xx2<lb.x+36;xx2+=10) g.fillRect(xx2+1,lb.y-13,7,5);
        g.fillStyle="rgba(20,26,28,0.55)";
        for(xx2=lb.x-36;xx2<lb.x+37;xx2+=10) g.fillRect(xx2,lb.y-14,1,12);
        /* porte de service, ouverte */
        g.fillStyle="#3a4240"; g.fillRect(lb.x-9,lb.y+8,18,24);
        g.fillStyle="#14181a"; g.fillRect(lb.x-6,lb.y+11,12,21);
        g.fillStyle="#c4ccc6"; g.fillRect(lb.x-14,lb.y+4,28,3);
        /* toiture : edicule technique et gaines */
        g.fillStyle="#868c88"; g.fillRect(lb.x+8,lb.y-28,26,14);
        g.fillStyle="#9aa09c"; g.fillRect(lb.x+8,lb.y-28,26,4);
        g.fillStyle="#6e7470"; g.fillRect(lb.x-34,lb.y-28,20,8);
        /* le sigle, deux barres et un point */
        g.fillStyle="#c8402e"; g.fillRect(lb.x-30,lb.y+4,10,3);
        g.fillStyle="#e8e2d0"; g.fillRect(lb.x+18,lb.y+4,14,3);
        g.fillRect(lb.x+18,lb.y+10,9,3);
    }
    /* stands de tir : le pas de tir couvert au sud, six couloirs herbeux qui
       montent vers le nord, la ligne de cibles et la butte de terre au fond.
       Parking de gravier cote route. Tout se lit d'en haut sans legende : les
       couloirs sont fauches, la butte est nue, les cibles sont blanches. */
    RANGES.forEach(function(rg){
        var rx=rg.x, ry=rg.y, xx3, yy3, i3;
        /* la parcelle fauchee */
        g.fillStyle="#5c6a3e"; g.fillRect(rx-70,ry-172,140,204);
        g.fillStyle="#66763f";
        for(yy3=ry-172;yy3<ry+32;yy3+=13) g.fillRect(rx-70,yy3,140,7);
        /* les couloirs de tir : bandes tondues plus claires */
        g.fillStyle="#7a8a4e";
        for(i3=0;i3<6;i3++) g.fillRect(rx-63+i3*21,ry-150,15,132);
        g.fillStyle="rgba(40,48,28,0.30)";
        for(i3=0;i3<7;i3++) g.fillRect(rx-66+i3*21,ry-150,2,132);
        /* les reperes de distance, trois traits blancs par couloir */
        g.fillStyle="rgba(232,228,208,0.42)";
        for(i3=1;i3<=3;i3++) g.fillRect(rx-63,ry-18-i3*33,126,1);
        /* la butte de terre, talus nu avec sa crete claire */
        g.fillStyle="rgba(0,0,0,0.26)"; g.fillRect(rx-66,ry-148,132,5);
        g.fillStyle="#6b5a42"; g.fillRect(rx-66,ry-168,132,20);
        g.fillStyle="#7d6a4e"; g.fillRect(rx-66,ry-168,132,7);
        g.fillStyle="#5a4b36";
        for(xx3=rx-66;xx3<rx+66;xx3+=11) g.fillRect(xx3,ry-160,4,12);
        /* les cibles : cadre de bois, carton blanc, centre noir */
        for(i3=0;i3<6;i3++){
            xx3=rx-60+i3*21;
            g.fillStyle="rgba(0,0,0,0.28)"; g.fillRect(xx3+1,ry-144,10,3);
            g.fillStyle="#8a7550"; g.fillRect(xx3+4,ry-146,2,8);
            g.fillStyle="#e6e2d4"; g.fillRect(xx3,ry-156,10,11);
            g.fillStyle="#2a2a2c"; g.fillRect(xx3+3,ry-153,4,5);
        }
        /* la cloture de la parcelle, ouverte plein sud */
        g.fillStyle="#7e8478";
        g.fillRect(rx-72,ry-174,144,3);
        g.fillRect(rx-72,ry-174,3,208);
        g.fillRect(rx+69,ry-174,3,208);
        g.fillRect(rx-72,ry+30,38,3); g.fillRect(rx+34,ry+30,38,3);
        g.fillStyle="rgba(196,202,190,0.26)";
        for(xx3=rx-70;xx3<rx+71;xx3+=7){
            g.fillRect(xx3,ry-174,1,6);
            if(xx3<rx-34||xx3>rx+34) g.fillRect(xx3,ry+27,1,6);
        }
        for(yy3=ry-170;yy3<ry+28;yy3+=7){
            g.fillRect(rx-72,yy3,6,1); g.fillRect(rx+66,yy3,6,1);
        }
        /* le pas de tir couvert : dalle, auvent, poteaux, tables */
        g.fillStyle="rgba(0,0,0,0.30)"; g.fillRect(rx-48,ry+18,100,5);
        g.fillStyle="#8e8478"; g.fillRect(rx-52,ry-16,104,34);
        g.fillStyle="#9c9286"; g.fillRect(rx-52,ry-16,104,10);
        g.fillStyle="#6e665c"; g.fillRect(rx-52,ry+12,104,6);
        /* poteaux de l'auvent */
        g.fillStyle="#5e564c";
        for(xx3=rx-46;xx3<rx+48;xx3+=23) g.fillRect(xx3,ry-16,4,10);
        /* les tables de tir alignees sous l'auvent */
        g.fillStyle="#4c4640";
        for(i3=0;i3<4;i3++) g.fillRect(rx-42+i3*23,ry-4,15,7);
        /* la porte, fermee : c'est elle qu'on crochete */
        g.fillStyle="#3c4038"; g.fillRect(rx-9,ry+2,18,16);
        g.fillStyle="#20241f"; g.fillRect(rx-7,ry+4,14,14);
        g.fillStyle="#c8b060"; g.fillRect(rx+3,ry+10,3,3);
        /* le panonceau rouge du club */
        g.fillStyle="#b03828"; g.fillRect(rx+20,ry-12,20,6);
        g.fillStyle="#e8e2d0"; g.fillRect(rx+23,ry-10,14,2);
        /* le parking de gravier, cote route */
        g.fillStyle="#7a766c"; g.fillRect(rx-34,ry+22,68,26);
        g.fillStyle="rgba(40,40,36,0.30)";
        for(xx3=rx-34;xx3<rx+34;xx3+=17) g.fillRect(xx3,ry+24,1,22);
    });
    /* ---- LA STATION-SERVICE ----
       Elle se lit d'un coup d'oeil : le tablier d'enrobe clair sur l'herbe,
       la boutique vitree en haut, l'auvent blanc a bandeau rouge pose sur
       ses quatre poteaux, et dessous les deux ilots avec leurs pompes et
       leurs pistolets. */
    STATIONS.forEach(function(st){
        var sx=st.x, sy=st.y, xx4, i4;
        /* le tablier d'enrobe, borde de blanc */
        g.fillStyle="rgba(0,0,0,0.18)"; g.fillRect(sx-56,sy-54,112,106);
        g.fillStyle="#6e6a64"; g.fillRect(sx-56,sy-54,112,104);
        g.fillStyle="#7a766e"; g.fillRect(sx-56,sy-54,112,6);
        g.fillStyle="rgba(232,228,208,0.30)";
        g.fillRect(sx-56,sy-54,112,1); g.fillRect(sx-56,sy+49,112,1);
        g.fillRect(sx-56,sy-54,1,104); g.fillRect(sx+55,sy-54,1,104);
        /* les places de ravitaillement, marquees au sol de part et d'autre */
        g.fillStyle="rgba(232,224,190,0.22)";
        for(i4=0;i4<3;i4++){
            g.fillRect(sx-52,sy-4+i4*14,16,1);
            g.fillRect(sx+36,sy-4+i4*14,16,1);
        }
        /* la boutique : bardage clair, vitrine sombre, porte au bord bas */
        g.fillStyle="rgba(0,0,0,0.28)"; g.fillRect(sx-30,sy-24,64,5);
        g.fillStyle="#c8c2b2"; g.fillRect(sx-32,sy-52,64,30);
        g.fillStyle="#dcd6c6"; g.fillRect(sx-32,sy-52,64,9);
        g.fillStyle="#8e8a80"; g.fillRect(sx-32,sy-25,64,3);
        g.fillStyle="#2e3a3e"; g.fillRect(sx-28,sy-40,24,13);
        g.fillStyle="#3c4a50"; g.fillRect(sx+6,sy-40,22,13);
        g.fillStyle="rgba(216,228,232,0.30)";
        g.fillRect(sx-28,sy-40,24,3); g.fillRect(sx+6,sy-40,22,3);
        /* la porte, fermee : c'est elle qu'on crochete */
        g.fillStyle="#3c4038"; g.fillRect(sx-9,sy-38,18,16);
        g.fillStyle="#20241f"; g.fillRect(sx-7,sy-36,14,14);
        g.fillStyle="#c8b060"; g.fillRect(sx+3,sy-30,3,3);
        /* les poteaux de l'auvent, avant le toit qui les coiffe */
        g.fillStyle="#8a8680";
        g.fillRect(sx-48,sy-8,4,32); g.fillRect(sx+44,sy-8,4,32);
        /* les ilots : socle de beton, pompe, pistolet au flanc */
        for(i4=0;i4<2;i4++){
            xx4=(i4===0)?(sx-32):(sx+14);
            g.fillStyle="rgba(0,0,0,0.26)"; g.fillRect(xx4+2,sy+11,18,3);
            g.fillStyle="#9a968c"; g.fillRect(xx4,sy+2,18,10);
            g.fillStyle="#aaa69c"; g.fillRect(xx4,sy+2,18,3);
            /* la borne */
            g.fillStyle="#b8402e"; g.fillRect(xx4+4,sy-8,10,12);
            g.fillStyle="#d05a40"; g.fillRect(xx4+4,sy-8,10,4);
            g.fillStyle="#e8e2d0"; g.fillRect(xx4+6,sy-5,6,4);
            g.fillStyle="#2a2a2c"; g.fillRect(xx4+7,sy-4,4,2);
            /* le pistolet accroche au flanc */
            g.fillStyle="#3a3a38"; g.fillRect(xx4+13,sy-2,3,5);
        }
        /* l'auvent : dalle blanche, bandeau rouge, ombre portee au sol */
        g.fillStyle="rgba(0,0,0,0.22)"; g.fillRect(sx-46,sy+24,92,4);
        g.fillStyle="#e4e0d4"; g.fillRect(sx-50,sy-14,100,14);
        g.fillStyle="#f0ece0"; g.fillRect(sx-50,sy-14,100,5);
        g.fillStyle="#b8402e"; g.fillRect(sx-50,sy-3,100,4);
        g.fillStyle="rgba(0,0,0,0.20)"; g.fillRect(sx-50,sy+1,100,2);
        /* le totem des prix, cote route */
        g.fillStyle="#6e6a62"; g.fillRect(sx+40,sy+30,3,14);
        g.fillStyle="#e4e0d4"; g.fillRect(sx+34,sy+24,16,10);
        g.fillStyle="#b8402e"; g.fillRect(sx+34,sy+24,16,3);
        g.fillStyle="rgba(40,44,40,0.55)";
        g.fillRect(sx+36,sy+29,12,1); g.fillRect(sx+36,sy+31,12,1);
    });
    /* hangar : bardage nervure, toit courbe, grande porte coulissante */
    HANGARS.forEach(function(hg){
        var bx=hg.x-53, by=hg.y-40, xx, yy;
        var pal=[["#7a7a72","#8e8e84","#5e5e58"],
                 ["#6a7278","#7e868c","#4e565c"],
                 ["#7c7060","#928574","#5e5448"]][hg.s];
        g.fillStyle="rgba(0,0,0,0.28)"; g.fillRect(bx+5,by+54,106,5);
        /* mur pignon */
        g.fillStyle=pal[0]; g.fillRect(bx,by+14,106,42);
        g.fillStyle=pal[2];
        for(xx=bx+3;xx<bx+106;xx+=7) g.fillRect(xx,by+14,2,42);
        g.fillStyle=pal[2]; g.fillRect(bx,by+50,106,6);
        /* toit en demi-cercle aplati */
        g.fillStyle=pal[1];
        for(xx=0;xx<106;xx++){
            var hgt=Math.round(16*Math.sin(Math.PI*xx/106));
            g.fillRect(bx+xx,by+14-hgt,1,hgt+2);
        }
        g.fillStyle=pal[2];
        for(xx=0;xx<106;xx+=9){
            var hg2=Math.round(16*Math.sin(Math.PI*xx/106));
            g.fillRect(bx+xx,by+14-hg2,1,hg2);
        }
        /* porte coulissante */
        g.fillStyle="#3a3a36"; g.fillRect(bx+26,by+22,54,34);
        g.fillStyle="#4e4e48";
        for(xx=bx+28;xx<bx+80;xx+=6) g.fillRect(xx,by+23,4,32);
        g.fillStyle="#6a6a62"; g.fillRect(bx+24,by+19,58,4);
        g.fillStyle="#242420"; g.fillRect(bx+52,by+22,3,34);
        /* fenetres hautes et caisses */
        g.fillStyle="#2a3a4a";
        g.fillRect(bx+8,by+20,12,8); g.fillRect(bx+86,by+20,12,8);
        g.fillStyle="#8a6a3e"; g.fillRect(bx+112,by+40,14,14); g.fillRect(bx+112,by+28,14,11);
        g.fillStyle="#a88a56"; g.fillRect(bx+112,by+40,14,2); g.fillRect(bx+112,by+28,14,2);
    });
    VILLAGES.forEach(function(v){
        v.houses.forEach(function(h){
            if(h.k==="pompiers"||h.k==="hopital") return; /* peints avec les batiments isoles */
            if(h.k==="maison") house(h.x,h.y,h.w,h.h); else bldg(h.x,h.y,h.w,h.h,h.k);
        });
        var wx=v.well.x, wy2=v.well.y;
        g.fillStyle="rgba(0,0,0,0.25)"; g.fillRect(wx-10,wy2+7,20,3);
        /* margelle en pierre */
        g.fillStyle="#6a6a66"; g.fillRect(wx-10,wy2-7,20,15);
        g.fillRect(wx-8,wy2-9,16,3);
        g.fillStyle="#8a8a86"; g.fillRect(wx-8,wy2-9,16,2);
        g.fillStyle="#4a4a4e";
        for(x=wx-10;x<wx+10;x+=5) g.fillRect(x,wy2-4,1,12);
        g.fillRect(wx-10,wy2-1,20,1); g.fillRect(wx-10,wy2+4,20,1);
        g.fillStyle="#3a3a40"; g.fillRect(wx-10,wy2+6,20,2);
        /* eau */
        g.fillStyle="#16283a"; g.fillRect(wx-7,wy2-8,14,8);
        g.fillStyle="#2a4a68"; g.fillRect(wx-6,wy2-7,12,2);
        g.fillStyle="#4a7a9a"; g.fillRect(wx-4,wy2-6,4,1);
        /* poteaux + treuil */
        g.fillStyle="#6b4a24"; g.fillRect(wx-9,wy2-24,3,16); g.fillRect(wx+6,wy2-24,3,16);
        g.fillStyle="#8a6234"; g.fillRect(wx-8,wy2-16,14,3);
        /* toit */
        g.fillStyle="#5e2a1e"; g.fillRect(wx-13,wy2-24,26,3);
        g.fillStyle="#8a4030"; g.fillRect(wx-12,wy2-29,24,6);
        g.fillStyle="#a85840"; g.fillRect(wx-12,wy2-29,24,2);
        g.fillStyle="#5e2a1e";
        for(x=wx-12;x<wx+12;x+=5) g.fillRect(x,wy2-27,1,4);
        /* corde + seau */
        g.fillStyle="#c8b48a"; g.fillRect(wx-1,wy2-13,1,5);
        g.fillStyle="#6b4a24"; g.fillRect(wx-4,wy2-8,7,5);
        g.fillStyle="#8a6234"; g.fillRect(wx-4,wy2-8,7,1);
    });
    GUARDS.forEach(function(gd){
        var fx=gd.x, fy=gd.y, yy, bi;
        g.fillStyle="rgba(0,0,0,0.25)"; g.fillRect(fx-12,fy+8,24,4);
        /* pilotis */
        g.fillStyle="#5a3c1c"; g.fillRect(fx-10,fy-16,4,26); g.fillRect(fx+6,fy-16,4,26);
        g.fillStyle="#6b4a24"; g.fillRect(fx-10,fy-16,2,26); g.fillRect(fx+6,fy-16,2,26);
        /* croisillons en X */
        g.fillStyle="#4a3016";
        for(bi=0;bi<13;bi++){ g.fillRect(fx-7+bi,fy-14+bi,2,2); g.fillRect(fx+5-bi,fy-14+bi,2,2); }
        g.fillRect(fx-10,fy-2,20,2);
        /* echelle */
        g.fillStyle="#7a5228"; g.fillRect(fx-3,fy-16,1,26); g.fillRect(fx+2,fy-16,1,26);
        for(yy=fy-14;yy<fy+8;yy+=5) g.fillRect(fx-3,yy,6,1);
        /* plancher */
        g.fillStyle="#7a5228"; g.fillRect(fx-13,fy-20,26,4);
        g.fillStyle="#4a3016"; g.fillRect(fx-13,fy-17,26,1);
        /* cabine */
        g.fillStyle="#6b4a24"; g.fillRect(fx-11,fy-38,22,18);
        g.fillStyle="#8a6234";
        for(yy=-38;yy<-20;yy+=5) g.fillRect(fx-11,fy+yy,22,2);
        g.fillStyle="#5a3c1c"; g.fillRect(fx-11,fy-38,2,18); g.fillRect(fx+9,fy-38,2,18);
        g.fillStyle="#241a10"; g.fillRect(fx-7,fy-34,14,8);
        g.fillStyle="#3a2812"; g.fillRect(fx-7,fy-34,14,2);
        /* rambarde */
        g.fillStyle="#7a5228"; g.fillRect(fx-13,fy-24,26,2);
        for(bi=-12;bi<12;bi+=5) g.fillRect(fx+bi,fy-24,1,4);
        /* toit */
        g.fillStyle="#3a2812"; g.fillRect(fx-14,fy-42,28,4);
        g.fillStyle="#5a3c1c"; g.fillRect(fx-12,fy-47,24,6);
        g.fillStyle="#7a5228"; g.fillRect(fx-12,fy-47,24,2);
        /* mat + drapeau */
        g.fillStyle="#3a2812"; g.fillRect(fx-1,fy-64,2,18);
        var fc="#b8863a";
        g.fillStyle=fc; g.fillRect(fx+1,fy-64,13,10);
        g.fillStyle="rgba(255,255,255,0.22)"; g.fillRect(fx+1,fy-64,13,3);
        g.fillStyle="rgba(0,0,0,0.28)"; g.fillRect(fx+5,fy-61,3,7); g.fillRect(fx+11,fy-62,2,8);
        g.fillStyle=fc; g.fillRect(fx+14,fy-62,2,6);
    });
    TREES.forEach(function(t){
        g.fillStyle="#4a3220"; g.fillRect(t.x-2,t.y-6,5,9);
        g.fillStyle="#5e422a"; g.fillRect(t.x-2,t.y-6,2,9);
        g.fillStyle="rgba(0,0,0,0.25)"; g.fillRect(t.x-6,t.y+2,13,3);
    });
    g.fillStyle="#141812";
    g.fillRect(0,0,CFG.WORLD,10); g.fillRect(0,CFG.WORLD-10,CFG.WORLD,10);
    g.fillRect(0,0,10,CFG.WORLD); g.fillRect(CFG.WORLD-10,0,10,CFG.WORLD);
    g.fillStyle="#4a3a26";
    for(i=0;i<CFG.WORLD;i+=24){ g.fillRect(i,6,8,8); g.fillRect(i,CFG.WORLD-14,8,8); g.fillRect(6,i,8,8); g.fillRect(CFG.WORLD-14,i,8,8); }
}
paintWorld();
