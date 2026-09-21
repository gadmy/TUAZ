"use strict";
/* ================================================================
   TUAZ - 15-joueur.js
   Le joueur : sa mise a jour, son souffle, son allure.
   (lignes 17165 a 17295 du mono-fichier d'origine)
   ================================================================ */
/* ================= JOUEUR ================= */
function updPlayer(dt){
    var Math=DMATH;
    var p=G.p, dx=0, dy=0;
    /* ce qu'on a mange se rend lentement, meme assis dans une maison */
    if(p.heal>0){
        var gp=Math.min(p.heal,(p.healR||1)*dt);
        p.hp=Math.min(p.maxhp,p.hp+gp);
        p.heal-=gp;
        if(p.heal<=0.001){ p.heal=0; p.healR=0; }
    }
    /* la gorgee qui descend : le souffle revient au meme rythme que la vie */
    if(p.sto>0){
        var gs=Math.min(p.sto,(p.stoR||1)*dt), sm9=staMax(p);
        p.sta=Math.min(sm9,(p.sta||0)+gs);
        p.sto-=gs;
        if(p.sto<=0.001){ p.sto=0; p.stoR=0; }
        if(p.winded&&p.sta>=sm9*CFG.STA_RESUME) p.winded=0;
    }
    /* a l'interieur d'un batiment, ou penche sur une serrure, on ne bouge pas */
    if(G.inside||G.pick){
        /* on ne bouge pas : c'est la que le souffle revient le mieux */
        var sm0=staMax(p);
        p.staD=Math.max(0,p.staD-dt);
        if(p.staD<=0&&p.sta<sm0) p.sta=Math.min(sm0,p.sta+CFG.STA_REG_STILL*dt);
        if(p.winded&&p.sta>=sm0*CFG.STA_RESUME) p.winded=0;
        p.flash=Math.max(0,p.flash-dt);
        return;
    }
    if(inp(0)) dy-=1;
    if(inp(1)) dy+=1;
    if(inp(2)) dx-=1;
    if(inp(3)) dx+=1;
    updUnder(p);
    updMal(p,dt);
    updLow(p,dt);
    if(baseHere()) baseHeal(p,dt);
    p.mode=inpMode();
    /* On demande le sprint, on ne l'obtient pas toujours : a bout de souffle
       ou en surcharge, la touche ne fait plus rien et l'on repasse en marche. */
    if(p.mode===2&&!canSprint()) p.mode=1;
    /* plus du double du poids autorise : on ne se baisse plus non plus */
    if(p.mode===0&&overLoaded()) p.mode=1;
    var l=Math.hypot(dx,dy);
    /* la cadence de l'animation suit l'allure : on voit le mode a l'ecran */
    if(l>0){ dx/=l; dy/=l; p.fx=dx; p.fy=dy; p.anim+=dt*10*CFG.MODE_SPD[p.mode]; }
    /* a l'epaule on ne bouge plus : on gagne en visee ce qu'on perd en pieds */
    if(p.ads){ dx=0; dy=0; }
    /* des pieds qui bougent font du bruit ; a l'arret, rien */
    p.mov=(l>0&&!p.ads)?1:0;
    var mul=CFG.MODE_SPD[p.mode];
    /* le sac tire sur les jambes des la moitie de la charge */
    mul*=loadSpeed();
    /* une voie porte : on y va plus vite qu'a travers champs */
    var wb=wayBonus(p.x,p.y);
    if(wb) mul*=1+wb;
    if(inSwamp(p.x,p.y,p.under)){
        mul*=CFG.SWAMP_SLOW;
        /* l'eau qui dort : un jet de maladie par seconde entiere passee
           dedans. Traverser vite est presque sur ; s'y attarder se paie. */
        p.wetT=(p.wetT||0)+dt;
        if(p.wetT>=1){ p.wetT-=1; malCatch(p,"eau"); }
    } else p.wetT=0;
    if(inGrassFoot(p.x,p.y)) mul*=CFG.GRASS_SLOW;
    /* la pente ne penalise que hors des voies : la route est amenagee. Et
       elle depend du sens - on peine a la montee, on prend de la vitesse a la
       descente, entre les deux en travers. */
    if(!onRoad(p.x,p.y,0)){
        var sd=slopeDown(p.x,p.y);
        if(sd){
            var dot=(l>0)?(dx*sd.x+dy*sd.y):0;
            if(dot<-0.2) mul*=CFG.SLOPE_SLOW;
            else if(dot>0.2) mul*=CFG.SLOPE_DOWN;
            else mul*=CFG.SLOPE_CROSS;
        }
    }
    var spd=CFG.PLAYER_SPD*mul*sprintMul(p);
    /* le courant pousse : dans une riviere on derive vers l'aval */
    var fl2=flowAt(p.x,p.y);
    if(fl2&&!onCrossing(p.x,p.y,p.under)){
        p.x+=fl2.fx*CFG.FLOW*dt; p.y+=fl2.fy*CFG.FLOW*dt;
    }
    p.x+=dx*spd*dt+p.kx*dt; p.y+=dy*spd*dt+p.ky*dt;
    p.kx*=Math.pow(0.001,dt); p.ky*=Math.pow(0.001,dt);
    collide(p,6);
    p.x=clamp(p.x,16,CFG.WORLD-16); p.y=clamp(p.y,16,CFG.WORLD-16);
    /* ---- LE SOUFFLE ----
       Courir le vide, tout le reste le rend, mais jamais dans la seconde qui
       suit l'effort. Tombe a zero on est a bout : la course est refusee tant
       qu'on n'a pas repris le cinquieme de sa reserve. */
    var smax=staMax(p);
    if(p.sta>smax) p.sta=smax;
    /* EN SURCHARGE, MARCHER COUTE. La course etant deja refusee, sans cela le
       souffle n'aurait plus aucun role : on porterait le double en flanant
       sans jamais rien sentir. STA_OVER est le bouton - a six par seconde, une
       reserve pleine tient une quinzaine de secondes de marche chargee. */
    if(p.mode!==2&&p.mov&&overCarry()){
        p.sta-=CFG.STA_OVER*(1-wayBonus(p.x,p.y))*dt;
        p.staD=CFG.STA_DELAY;
        if(p.sta<=0){ p.sta=0; p.winded=1; }
    }
    if(p.mode===2&&p.mov){
        /* la voie epargne le souffle dans la meme proportion qu'elle porte */
        p.sta-=CFG.STA_SPRINT*loadCost()*(1-wayBonus(p.x,p.y))*dt;
        /* courir apprend a courir : une seconde entiere vaut un usage. La
           charge sur le dos fait le portage - sans poids, on ne muscle rien
           a se promener. */
        p.runT=(p.runT||0)+dt;
        if(p.runT>=1){
            p.runT-=1;
            secBump(p,"souffle",1);
            secBump(p,"vitesse",1);
            if(loadRatio()>0.35) secBump(p,"portage",1);
        }
        p.staD=CFG.STA_DELAY;
        if(p.sta<=0){ p.sta=0; p.winded=1; }
    } else {
        p.staD=Math.max(0,p.staD-dt);
        if(p.staD<=0&&p.sta<smax)
            p.sta=Math.min(smax,p.sta+
                (p.mov?CFG.STA_REG[p.mode]:CFG.STA_REG_STILL)*dt);
        if(p.winded&&p.sta>=smax*CFG.STA_RESUME) p.winded=0;
    }
    p.flash=Math.max(0,p.flash-dt);
    var tx=clamp(p.x-CFG.VIEW_W/2,0,CFG.WORLD-CFG.VIEW_W);
    var ty=clamp(p.y-CFG.VIEW_H/2,0,CFG.WORLD-CFG.VIEW_H);
    G.cam.x+=(tx-G.cam.x)*Math.min(1,8*dt);
    G.cam.y+=(ty-G.cam.y)*Math.min(1,8*dt);
}


