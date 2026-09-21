"use strict";
/* ================================================================
   TUAZ - 03-monde-graines.js
   Les registres du decor, les graines de carte (budget, carte, sim),
   la grille d'obstacles et la grille des voies.
   (lignes 3264 a 3560 du mono-fichier d'origine)
   ================================================================ */
/* ================= CARTE : OBSTACLES / DECOR ================= */
var OC=[], ORECT=[], SWAMPS=[], TREES=[], VEGGIES=[], TORCHES=[];
var ROCKS=[], PONDS=[], REEDS=[], LILIES=[], FROGS=[], HUTS=[], FISHERS=[];
var GUIDES=[];
/* poissons sauteurs : pur decor, tire sur le flux visuel */
var FISH=[], FISHT=0, vdt=1/60;
/* Edifices publics des villages. Seule la forme compte pour l'instant :
   aucun n'a la moindre fonction en jeu. La mairie doit rester en tete. */
var BLDG=[
 {k:"mairie",    w:76,h:50, rf:["#4a5260","#5e6674","#343a46"], wl:["#d8cfb4","#c0b696","#a89c7c"]},
 {k:"medecin",   w:54,h:36, rf:["#6a7a80","#84949a","#4a585e"], wl:["#e4e8e0","#ccd2c8","#b0b6ac"]},
 {k:"police",    w:62,h:42, rf:["#2e3c58","#425270","#1e2a40"], wl:["#b6c0cc","#9aa6b4","#828e9c"]},
 {k:"armurerie", w:54,h:36, rf:["#4a3826","#5e4a34","#32241a"], wl:["#b09070","#987a5c","#7c6248"]},
 {k:"soins",     w:66,h:44, rf:["#c2c6c4","#dadedc","#a2a6a4"], wl:["#eeece4","#dcd8ce","#c2beb4"]},
 {k:"resto",     w:56,h:38, rf:["#7a3a2c","#96503c","#54241a"], wl:["#d8c4a0","#c0aa86","#a4906e"]},
 {k:"bar",       w:50,h:34, rf:["#3c3024","#524232","#281f18"], wl:["#9c8262","#846c50","#6a563e"]},
 {k:"ecole",     w:82,h:46, rf:["#8a4030","#a85840","#5e2a1e"], wl:["#dcd2b0","#c4ba98","#a89e7e"]},
 {k:"superette", w:64,h:40, rf:["#46606e","#5c7a8a","#324450"], wl:["#e8e4d6","#d2cec0","#b8b4a6"]},
 {k:"droguerie", w:52,h:36, rf:["#5e5030","#786742","#443a22"], wl:["#c8b494","#b09c7c","#948468"]},
 {k:"depot",     w:72,h:48, rf:["#54544e","#6c6c64","#3a3a36"], wl:["#8c867a","#767064","#5e594f"]},
 /* immeubles : la grande ville seulement */
 {k:"immeuble1", w:58,h:66, city:1, et:4, rf:["#4a4a48","#5e5e5a","#343432"], wl:["#c0b8a4","#a89f8c","#8e8674"]},
 {k:"immeuble2", w:74,h:80, city:1, et:5, rf:["#42484e","#565e64","#2e3438"], wl:["#b0aca4","#98948c","#7e7a74"]},
 {k:"immeuble3", w:50,h:56, city:1, et:3, rf:["#584a3c","#6e5e4c","#3e342a"], wl:["#c8b8a0","#b0a088","#948670"]}
];
var FARMS=[], VILLAGES=[], GUARDS=[], CAVES=[], DUNGEONS=[];
var ARMYBASES=[], FIREHOUSES=[], HOSPITALS=[], HANGARS=[], SHELTERS=[], CAMPS=[];
/* Le laboratoire H-teck : un seul par carte, hors des bourgs. C'est de la
   que tout est parti, et il continue de lacher ce qu'il contenait. */
var LAB=null;
/* Le stand de tir : un seul par carte comme le laboratoire, a l'ecart des
   bourgs mais toujours au bord d'une route, car un club de tir vit de ceux
   qui y viennent en voiture. Porte toujours verrouillee, et la meilleure
   serrure du jeu : 10 s.
   RANGESTAT compte les causes de rejet du placement, comme MESHSTAT le fait
   pour le maillage pieton : sans cela on ne sait pas quelle contrainte
   etrangle la recherche. */
var RANGES=[];
var RANGESTAT={court:0,sud:0,bord:0,bati:0,emprise:0,bourg:0,route:0,eau:0,arbre:0,village:0,labo:0};
/* Les stations-service : une ou deux par carte. Contrairement au stand de
   tir, elles se collent a la route et ne fuient pas les bourgs - une pompe
   vit du passage. C'est au pied de leurs pompes qu'une bouteille vide
   devient un cocktail. STATSTAT compte les rejets, comme RANGESTAT. */
/* Les gens de metier : pompiers, policiers et soignants. Contrairement aux
   villageois qui arpentent tout le bourg, ils ne quittent pas les abords de
   leur batiment - la caserne, le commissariat, l'hopital ou le cabinet. Ils
   naissent avec la partie et non avec la carte, comme les scouts. */
var WORKERS=[];
var STATIONS=[], PUMPS=[];
var STATSTAT={court:0,sud:0,bord:0,emprise:0,route:0,eau:0,arbre:0,voisine:0};
var HILLS=[], GRASS=[], PORTS=[], BLDRECTS=[], DEER=[], SETTLE=[];
var WALKS=[], SIGNS=[], ZEBRAS=[], WALKSETS=[], CITYDECO=[], TRIMSTAT=null, MESHSTAT={nostart:0,done:0,tiny:0};
var ROADS=[], PATHS=[], ROADLINKS=[], BRIDGES=[], EXITS=[], ROUNDS=[];
function urlSeed(name){
    var m=(location.search||"").match(new RegExp("[?&]"+name+"=(-?[0-9]+)"));
    return m ? (parseInt(m[1],10)|0) : null;
}
function randSeed(){ return (Math.random()*1e9)|0; }
var MAPSEED=urlSeed("mseed"); if(MAPSEED===null) MAPSEED=randSeed();
/* BUDGET_SEED : combien de chaque chose. Partage entre les deux joueurs en versus.
   MAPSEED : ou se pose chaque chose. Peut differer sans casser l'equite. */
var BUDGET_SEED=urlSeed("bseed"); if(BUDGET_SEED===null) BUDGET_SEED=randSeed();
/* SIMSEED : tout l'aleatoire de partie. Derive des deux autres par defaut,
   forcable par ?sseed= ou setSeeds(b,m,s). */
var SIMSEED=urlSeed("sseed");
if(SIMSEED===null) SIMSEED=(BUDGET_SEED^Math.imul(MAPSEED,0x9E3779B1))|0;
var BUDGET=null, FSFAIL=0, FLDFAIL=0;
/* setSeeds(b,m) : force les seeds et invalide le budget courant.
   Passer null pour laisser une seed inchangee. Relancer une partie ensuite. */
function setSeeds(b,m,s){
    if(b!==undefined&&b!==null) BUDGET_SEED=b|0;
    if(m!==undefined&&m!==null) MAPSEED=m|0;
    if(s!==undefined&&s!==null) SIMSEED=s|0;
    else SIMSEED=(BUDGET_SEED^Math.imul(MAPSEED,0x9E3779B1))|0;
    BUDGET=null;
    return "BUDGET_SEED="+BUDGET_SEED+"  MAPSEED="+MAPSEED+"  SIMSEED="+SIMSEED+
           "  (regen() requis avant de rejouer)";
}
/* regen() : refait la carte a partir des seeds courantes. Indispensable des
   qu'on change de seed sans recharger la page (rejeu, lobby). */
function regen(){
    /* la grille d'obstacles survivait a la regeneration : la carte suivante
       heritait des arbres, des blocs et des murs de la precedente, et n'etait
       donc plus reproductible depuis sa seule MAPSEED */
    obstGrid.clear();
    OC=[]; ORECT=[]; SWAMPS=[]; TREES=[]; VEGGIES=[]; TORCHES=[];
    ROCKS=[]; PONDS=[]; REEDS=[]; LILIES=[]; FROGS=[]; HUTS=[]; FISHERS=[];
    FISH=[]; FISHT=0;
    FARMS=[]; VILLAGES=[]; GUARDS=[]; CAVES=[]; DUNGEONS=[];
    ARMYBASES=[]; FIREHOUSES=[]; HOSPITALS=[]; HANGARS=[]; SHELTERS=[]; CAMPS=[];
    LAB=null; RANGES=[]; STATIONS=[]; PUMPS=[];
    STATSTAT={court:0,sud:0,bord:0,emprise:0,route:0,eau:0,arbre:0,voisine:0};
    RANGESTAT={court:0,sud:0,bord:0,bati:0,emprise:0,bourg:0,route:0,eau:0,arbre:0,village:0,labo:0};
    HILLS=[]; GRASS=[]; PORTS=[]; BLDRECTS=[]; DEER=[]; SETTLE=[];
    WALKS=[]; SIGNS=[]; ZEBRAS=[]; WALKSETS=[]; CITYDECO=[]; MESHSTAT={nostart:0,done:0,tiny:0};
    ROADS=[]; PATHS=[]; ROADLINKS=[]; BRIDGES=[]; EXITS=[]; ROUNDS=[]; COAST=null;
    BUDGET=null;
    genMap();
    wayIndex();
    paintWorld();
    miniTerr.getContext("2d").drawImage(worldCv,0,0,CFG.WORLD,CFG.WORLD,0,0,MMS,MMS);
    return "carte regeneree  MAPSEED="+MAPSEED+"  FSFAIL="+FSFAIL;
}
function rollBudget(seed){
    var R=mulberry32(seed), B=CFG.BUDGET, b={}, k;
    function Ri(a,b2){ return a+((R()*(b2-a+1))|0); }
    function Rn(rg){ return Ri(rg[0],rg[1]); }
    function Arr(n,rg){ var o=[]; for(var q=0;q<n;q++) o.push(Rn(rg)); return o; }
    b.seed     = seed|0;
    b.groves   = Rn(B.GROVES);
    b.rivers   = Rn(B.RIVERS);
    b.lakes    = Rn(B.LAKES);
    b.huts     = Math.min(b.lakes, Rn(B.HUTS));
    b.farms    = Rn(B.FARMS);
    b.villages = Rn(B.VILLAGES);
    /* la premiere agglomeration est la grande ville, les autres des villages */
    b.houses   = Arr(b.villages, B.HOUSES);
    b.city     = Rn(B.CITY);
    b.houses[0]= b.city;
    b.cityIso  = Rn(B.CITY_ISO);
    b.cityFire = 1;
    b.cityHosp = b.cityIso>1?1:0;
    b.fire     = 0;
    b.hosp     = 1-b.cityHosp;
    b.shelters = Rn(B.SHELTERS);
    b.camps    = Rn(B.CAMPS);
    b.scouts   = Arr(b.camps, B.SCOUTS);
    b.hills    = Rn(B.HILLS);
    b.hillTrees= Arr(b.hills,[1,3]);
    b.hillRocks= Arr(b.hills,[0,2]);
    b.hillPond = Arr(b.hills,[0,1]);
    b.hillFarm = Arr(b.hills,[0,1]);
    b.grass    = Rn(B.GRASS);
    b.ports    = Rn(B.PORTS);
    b.herds    = Rn(B.HERDS);
    b.deers    = Arr(b.herds, B.DEERS);
    b.portBld  = Arr(b.ports,[5,10]);
    b.farmers  = Arr(b.farms, [1,4]);
    b.kits     = Arr(b.villages, [0, SOLKITS.length-1]);
    b.caves    = Rn(B.CAVES);
    /* un seul chateau par carte */
    b.army     = Rn(B.ARMY);
    b.troops   = Arr(b.army,B.TROOPS);
    b.hangars  = Rn(B.HANGARS);
    b.stations = Rn(B.STATIONS);
    /* tours de guet : c'est la taille de l'agglomeration qui decide */
    b.towers   = b.houses.map(function(n){ return n<=9?1:(n<=15?2:(n<=30?3:5)); });
    b.roadExtra= Rn(B.ROAD_EXTRA);
    b.fields   = Arr(b.farms, B.FIELDS);
    /* une ferme sur deux environ recoit une tour de guet et/ou un hangar */
    b.farmTower  = Arr(b.farms, B.FARM_TOWER);
    b.farmHangar = Arr(b.farms, B.FARM_HANGAR);
    return b;
}
var obstGrid=new Map();
function obstKey(x,y){ return ((x/128)|0)+","+((y/128)|0); }
function regObst(o,isRect){
    var x0,x1,y0,y1;
    if(isRect){ x0=o.x; x1=o.x+o.w; y0=o.y; y1=o.y+o.h; }
    else { x0=o.x-o.r; x1=o.x+o.r; y0=o.y-o.r; y1=o.y+o.r; }
    for(var gx=(x0/128)|0; gx<=((x1/128)|0); gx++)
    for(var gy=(y0/128)|0; gy<=((y1/128)|0); gy++){
        var k=gx+","+gy, cell=obstGrid.get(k);
        if(!cell){ cell={c:[],r:[]}; obstGrid.set(k,cell); }
        (isRect?cell.r:cell.c).push(o);
    }
}
function obstAt(x,y){ return obstGrid.get(obstKey(x,y))||{c:[],r:[]}; }
/* ---- GRILLE DES VOIES ----
   Savoir sur quoi l'on marche coutait 0,2 ms par appel : onWay parcourait les
   778 segments de la carte. A raison d'une question par habitant et par
   image, c'etait deux secondes de calcul par seconde de jeu. Les segments
   sont donc ranges une fois pour toutes dans des cases de 128 px, comme les
   obstacles, et l'on n'examine plus que ceux de la case ou l'on se tient. */
var wayGrid=new Map();
function wayKey(x,y){ return ((x/128)|0)+","+((y/128)|0); }
function regWay(o,kind){
    /* on borne le segment, marge prise sur sa demi-largeur */
    var m=o.w/2+4;
    var x0=(o.x1<o.x2?o.x1:o.x2)-m, x1=(o.x1>o.x2?o.x1:o.x2)+m;
    var y0=(o.y1<o.y2?o.y1:o.y2)-m, y1=(o.y1>o.y2?o.y1:o.y2)+m;
    for(var gx=(x0/128)|0; gx<=((x1/128)|0); gx++)
    for(var gy=(y0/128)|0; gy<=((y1/128)|0); gy++){
        var k=gx+","+gy, cell=wayGrid.get(k);
        if(!cell){ cell=[]; wayGrid.set(k,cell); }
        cell.push({s:o, k:kind});
    }
}
/* A rappeler apres chaque generation : les listes sont alors completes. */
function wayIndex(){
    wayGrid.clear();
    var q;
    for(q=0;q<ROADS.length;q++) regWay(ROADS[q],2);
    for(q=0;q<PATHS.length;q++) regWay(PATHS[q],1);
    /* le trottoir est une allee de bourg : il porte comme la terre battue, pas
       comme une nationale */
    for(q=0;q<WALKS.length;q++) regWay(WALKS[q],1);
}
/* Sur quoi marche-t-on : 0 rien, 1 terre battue ou trottoir, 2 goudron.
   Le revetement le plus porteur l'emporte quand deux voies se croisent. */
function wayKind(x,y){
    var cell=wayGrid.get(wayKey(x,y));
    if(!cell) return 0;
    var best=0, q, e, r;
    for(q=0;q<cell.length;q++){
        e=cell[q];
        if(e.k<=best) continue;
        r=e.s.w/2;
        if(segD2(x,y,e.s.x1,e.s.y1,e.s.x2,e.s.y2)<r*r){ best=e.k; if(best===2) return 2; }
    }
    return best;
}
/* Le gain que procure la voie : un vingtieme sur la terre battue et les
   trottoirs, un dixieme sur le goudron. Il porte a la fois sur la vitesse et
   sur ce que coute le souffle, d'ou le meme coefficient des deux cotes. */
function wayBonus(x,y){
    var k=wayKind(x,y);
    return k?(k===2?CFG.ROAD_PAVED:CFG.ROAD_SOFT):0;
}
function farFromCenter(x,y,d){ return dist2(x,y,CFG.WORLD/2,CFG.WORLD/2)>d*d; }
/* Le reseau routier n'est plus une grille d'axes droits mais un ensemble de
   polylignes qui relient les villages. Une voie est une suite de segments
   {x1,y1,x2,y2,w} : routes goudronnees dans ROADS, chemins de terre dans
   PATHS. Tout le reste de la carte evite leur emprise. */
/* une nationale fait 8,5 m de large, un chemin de terre 3,75 */
var ROAD_W=8.5*M, PATH_W=3.75*M;
/* deux chaussees plus proches que cela, et paralleles, font double emploi */
var PARA_D=70;
var WAYID=0;
/* distance au carre d'un point au segment [x1,y1]-[x2,y2] */
function segD2(px,py,x1,y1,x2,y2){
    var dx=x2-x1, dy=y2-y1, l2=dx*dx+dy*dy;
    if(l2<0.0001) return dist2(px,py,x1,y1);
    var t=((px-x1)*dx+(py-y1)*dy)/l2;
    t=t<0?0:(t>1?1:t);
    return dist2(px,py,x1+dx*t,y1+dy*t);
}
function onWay(list,px,py,m){
    var q,o,r;
    for(q=0;q<list.length;q++){ o=list[q]; r=o.w/2+m;
        if(segD2(px,py,o.x1,o.y1,o.x2,o.y2)<r*r) return true; }
    return false;
}
function onRoad(px,py,m){
    m=m||0;
    return onWay(ROADS,px,py,m)||onWay(PATHS,px,py,m*0.5)||onWay(WALKS,px,py,m*0.4);
}
function hitObstacle(x,y,r){
    var cell=obstAt(x,y), i;
    for(i=0;i<cell.c.length;i++){ var c=cell.c[i];
        if(dist2(x,y,c.x,c.y)<(c.r+r)*(c.r+r)) return true; }
    for(i=0;i<cell.r.length;i++){ var o=cell.r[i];
        if(x>o.x-r&&x<o.x+o.w+r&&y>o.y-r&&y<o.y+o.h+r) return true; }
    return false;
}
function budgetReport(){
    var ok=true, L=[];
    function vmap(f){ return VILLAGES.map(f); }
    function line(n,exp,got){
        var e=""+exp, o=""+got;
        if(e!==o) ok=false;
        L.push((e===o?"  ":"XX")+" "+n+" attendu="+e+" obtenu="+o);
    }
    line("villages",  BUDGET.villages, VILLAGES.length);
    line("maisons",   BUDGET.houses,   vmap(function(v){ return v.houses.length; }));
    line("habitants", vmap(function(v){ return v.nvil; }),
                      vmap(function(v){ return v.villagers.length; }));
    line("kits",      BUDGET.kits,     vmap(function(v){ return v.soldier?v.soldier.kit:-1; }));
    line("fermes",    BUDGET.farms,    FARMS.length);
    line("grottes",   BUDGET.caves,    CAVES.length);
    line("chateau",   1,               DUNGEONS.length);
    line("tours",     BUDGET.towers,   VILLAGES.map(function(v){ return v.towers.length; }));
    line("casernes",  [BUDGET.army,BUDGET.fire+BUDGET.cityFire],
                      [ARMYBASES.length,FIREHOUSES.length]);
    line("hopitaux",  BUDGET.hosp+BUDGET.cityHosp, HOSPITALS.length);
    line("garnison",  BUDGET.troops,   ARMYBASES.map(function(a){ return a.n; }));
    line("abris",     BUDGET.shelters, SHELTERS.length);
    line("hangars",   BUDGET.hangars+BUDGET.farmHangar.reduce(function(a,b2){return a+b2;},0)+BUDGET.ports*2,
                      HANGARS.length);
    line("ports",     BUDGET.ports,    PORTS.length);
    line("hardes",    BUDGET.deers,    DEER.map(function(h){ return h.n; }));
    line("bourgs de port", BUDGET.portBld.map(function(n2){ return n2-2; }),
                      PORTS.map(function(p2){ return p2.bld.length; }));
    line("tours ferme",BUDGET.farmTower.reduce(function(a,b2){return a+b2;},0),
                      GUARDS.filter(function(t){ return t.farm; }).length);
    line("cabanes",   BUDGET.huts,     HUTS.length);
    line("etangs",    BUDGET.lakes+BUDGET.rivers, PONDS.length);
    line("champs",    BUDGET.fields,   FARMS.map(function(f){ return f.fields.length; }));
    L.push("   routes="+ROADLINKS.length+" liaisons / "+ROADS.length+" segments"+
           "  chemins="+PATHS.length+" segments");
    var sdOk=(BUDGET.seed===(BUDGET_SEED|0));
    if(!sdOk) ok=false;
    L.push((sdOk?"   ":"XX ")+"seed budget reelle="+BUDGET.seed+"  globale="+BUDGET_SEED);
    L.push("   FSFAIL="+FSFAIL+"  champs forces="+FLDFAIL+"  MAPSEED="+MAPSEED);
    L.unshift((ok&&FSFAIL===0)?"BUDGET OK":"BUDGET : ECARTS DETECTES");
    return L.join("\n");
}
