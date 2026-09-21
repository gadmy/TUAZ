"use strict";
/* ================================================================
   TUAZ - 06-minimap.js
   La minicarte et le brouillard de guerre.
   (lignes 7762 a 7809 du mono-fichier d'origine)
   ================================================================ */
/* ================= MINIMAP + BROUILLARD ================= */
var FOGC=64, FOGN=(CFG.WORLD/FOGC)|0;
var fogSeen=new Uint8Array(FOGN*FOGN);
var MMS=120, MMSC=MMS/FOGN;
var miniTerr=document.createElement("canvas"); miniTerr.width=MMS; miniTerr.height=MMS;
miniTerr.getContext("2d").drawImage(worldCv,0,0,CFG.WORLD,CFG.WORLD,0,0,MMS,MMS);
var fogCv=document.createElement("canvas"); fogCv.width=MMS; fogCv.height=MMS;
var fogG=fogCv.getContext("2d");
function fogReset(){
    fogSeen.fill(0);
    fogG.fillStyle="#0a0c10"; fogG.fillRect(0,0,MMS,MMS);
}
fogReset();
function fogReveal(px,py){
    var fcx=(px/FOGC)|0, fcy=(py/FOGC)|0, r=3;
    for(var dy=-r;dy<=r;dy++) for(var dx=-r;dx<=r;dx++){
        if(dx*dx+dy*dy>r*r+1) continue;
        var gx=fcx+dx, gy=fcy+dy;
        if(gx<0||gy<0||gx>=FOGN||gy>=FOGN) continue;
        var k=gy*FOGN+gx;
        if(!fogSeen[k]){ fogSeen[k]=1; fogG.clearRect(gx*MMSC,gy*MMSC,MMSC,MMSC); }
    }
}

var vigCv=document.createElement("canvas"); vigCv.width=640; vigCv.height=360;
(function(){ var g=vigCv.getContext("2d");
    var gr=g.createRadialGradient(320,180,170,320,180,400);
    gr.addColorStop(0,"rgba(0,0,0,0)"); gr.addColorStop(0.55,"rgba(8,7,10,0.22)");
    gr.addColorStop(1,"rgba(8,7,10,0.68)");
    g.fillStyle=gr; g.fillRect(0,0,640,360);
})();

var lightsOn=true;
var lightCv=document.createElement("canvas"); lightCv.width=640; lightCv.height=360;
var lightG=lightCv.getContext("2d");
var glowCv=document.createElement("canvas"); glowCv.width=128; glowCv.height=128;
(function(){ var g=glowCv.getContext("2d");
    var gr=g.createRadialGradient(64,64,4,64,64,64);
    gr.addColorStop(0,"rgba(255,255,255,1)");
    gr.addColorStop(0.55,"rgba(255,255,255,0.55)");
    gr.addColorStop(1,"rgba(255,255,255,0)");
    g.fillStyle=gr; g.fillRect(0,0,128,128);
})();
function stampLight(x,y,r,a){
    lightG.globalAlpha=(a===undefined)?1:a;
    lightG.drawImage(glowCv,x-r,y-r,r*2,r*2);
}

