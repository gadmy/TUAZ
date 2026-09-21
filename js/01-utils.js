"use strict";
/* ================================================================
   TUAZ - 01-utils.js
   Les outils : les trois flux de hasard (sim, visuel, indexe), la
   bibliotheque de math deterministe D3, et le son.
   (lignes 1808 a 1905 du mono-fichier d'origine)
   ================================================================ */
/* ================= UTILS ================= */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/* flux SIM : deterministe, reseede par SIMSEED a chaque newGame */
var rng = mulberry32(1);
/* flux VISUEL : jamais lu par la sim (audio, decals, shake camera, torches).
   Seul endroit avec randSeed() ou Math.random est tolere. */
var vrng = mulberry32((Math.random()*1e9)|0);
function vr(a,b){ return a + vrng()*(b-a); }
/* flux INDEXE : RNG independant par (sel, index). Ne depend ni de l'ordre
   ni du nombre de tirages anterieurs. */
function rr(a,b){ return a + rng()*(b-a); }
function ri(a,b){ return Math.floor(rr(a,b+1)); }
function dist2(ax,ay,bx,by){ var dx=ax-bx, dy=ay-by; return dx*dx+dy*dy; }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function pad(n){ return (n<10?"0":"")+n; }

/* ================= MATH DETERMINISTE (D3) =================
   sin, cos, atan2 et pow ne sont PAS correctement arrondis par la norme :
   deux moteurs JS peuvent rendre des bits differents, donc des hash differents.
   Ci-dessous, uniquement +, -, *, / et Math.sqrt, qui eux sont correctement
   arrondis, donc identiques partout. A n'utiliser que dans la SIM : le RENDER
   garde Math.* (aucune consequence sur le hash, et c'est plus rapide). */
var DPI=3.141592653589793, DTAU=6.283185307179586, DPI2=1.5707963267948966;
var DPI6=0.5235987755982988, DT30=0.5773502691896257, DT15=0.2679491924311227;
/* reduction de Cody-Waite : PI/2 coupe en deux moities exactes */
var DP2H=1.5707963267341256, DP2L=6.077100506506192e-11;
function dsinc(r){
    var z=r*r;
    return r+r*z*(-0.16666666666666666+z*(0.008333333333333333+z*(-0.0001984126984126984+z*(2.7557319223985893e-6+z*(-2.505210838544172e-8+z*2.08767569878681e-10)))));
}
function dcosc(r){
    var z=r*r;
    return 1+z*(-0.5+z*(0.041666666666666664+z*(-0.001388888888888889+z*(2.48015873015873e-5+z*(-2.7557319223985893e-7+z*2.08767569878681e-9)))));
}
function dsin(x){
    var k=Math.round(x/DPI2), r=x-k*DP2H-k*DP2L, q=((k%4)+4)%4;
    return q===0?dsinc(r):(q===1?dcosc(r):(q===2?-dsinc(r):-dcosc(r)));
}
function dcos(x){
    var k=Math.round(x/DPI2), r=x-k*DP2H-k*DP2L, q=((k%4)+4)%4;
    return q===0?dcosc(r):(q===1?-dsinc(r):(q===2?-dcosc(r):dsinc(r)));
}
/* atan replie sous tan(15 deg), puis serie courte */
function datanS(z){
    var s=z*z;
    return z*(1+s*(-0.3333333333333333+s*(0.2+s*(-0.14285714285714285+s*(0.1111111111111111+s*(-0.09090909090909091+s*(0.07692307692307693+s*(-0.06666666666666667+s*0.058823529411764705))))))));
}
function datanU(z){ return z>DT15 ? DPI6+datanS((z-DT30)/(1+DT30*z)) : datanS(z); }
function datan2(y,x){
    if(x===0&&y===0) return 0;
    var ax=x<0?-x:x, ay=y<0?-y:y, a;
    a = ay<=ax ? datanU(ay/ax) : (DPI2-datanU(ax/ay));
    if(x<0) a=DPI-a;
    return y<0?-a:a;
}
/* Math.sqrt est exact : hypot s'appuie dessus sans passer par Math.hypot,
   dont l'implementation varie d'un moteur a l'autre. */
function dhypot(dx,dy){ return Math.sqrt(dx*dx+dy*dy); }
/* pow : partie entiere par exponentiation binaire, partie fractionnaire par
   racines carrees successives (24 bits de precision, ~1e-8 en relatif). */
function dpow(b,e){
    var n=Math.floor(e), f=e-n, r=1, x=b, k, i, s, t;
    if(n<0){ k=-n; s=1; for(i=0;i<k;i++) s*=b; r=1/s; }
    else { k=n; while(k>0){ if(k&1) r*=x; x*=x; k>>=1; } }
    if(f>0){ s=Math.sqrt(b); t=0.5;
        for(i=0;i<24;i++){ if(f>=t){ f-=t; r*=s; } s=Math.sqrt(s); t*=0.5; } }
    return r;
}
/* controle console : ecart max contre Math.* */
/* DMATH : substitut de Math pour les fonctions de sim. Une ligne
   "var Math=DMATH;" en tete de fonction rend tout le corps deterministe,
   closures incluses, sans toucher aux appels eux-memes.
   random est volontairement absent : un tirage non seede dans la sim doit
   planter bruyamment plutot que passer inapercu. */
var DMATH={
    sin:dsin, cos:dcos, atan2:datan2, hypot:dhypot, pow:dpow,
    PI:Math.PI,
    sqrt:Math.sqrt, abs:Math.abs, min:Math.min, max:Math.max,
    floor:Math.floor, ceil:Math.ceil, round:Math.round, imul:Math.imul
};

/* ================= AUDIO ================= */
var AC=null, muted=false, sfxT=0;
function audio(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return AC; }
function beep(f,d,type,vol,slide){
    if(muted) return; var ac=audio(); if(!ac) return;
    var o=ac.createOscillator(), g=ac.createGain();
    o.type=type||"square"; o.frequency.value=f;
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide), ac.currentTime+d);
    g.gain.value=vol||0.05; g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime+d);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+d);
}
function sShot(){ if(performance.now()-sfxT<28) return; sfxT=performance.now();
    beep(vr(140,190),0.05,"square",0.04,-420); }
function sHurt(){ beep(110,0.18,"sawtooth",0.07,-60); }
function sBoss(){ beep(70,0.7,"sawtooth",0.09,-30); }
function sClick(){ beep(600,0.04,"square",0.03); }

