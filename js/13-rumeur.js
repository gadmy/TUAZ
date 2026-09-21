"use strict";
/* ================================================================
   TUAZ - 13-rumeur.js
   La rumeur, les dialogues, les quetes, puis les temoins et la
   reputation.
   (lignes 14367 a 16067 du mono-fichier d'origine)
   ================================================================ */
/* ================= LA RUMEUR =================

   Il court une histoire sur le laboratoire H-teck. Personne n'a rien vu,
   tout le monde en parle. Les vingt reponses vont du complot pur au haussement
   d'epaules, et chacun a sa place sur cette echelle : foi, de 0 a 10, tiree a
   la naissance et fixe. Ce n'est pas la personne qui change d'avis au fil de
   la conversation - c'est le monde qui change autour d'elle.

   Car la foi se lit toujours corrigee par l'etat de la carte. Tant que moins
   d'un cinquieme du pays a tourne, on rit de ceux qui y croient. Passe ce
   seuil la peur monte et les convaincus se multiplient. Au-dela de la moitie,
   il n'y a plus de sceptique : il n'y a que des gens qui ont vu. */
var RUMEUR=[
 /* --- ceux qui n'y croient pas du tout --- */
 {f:0, t:"Le laboratoire ? C'est une usine de peinture, mon pauvre. Mon "+
        "beau-frere y a livre du solvant pendant six ans."},
 {f:0, t:"Ah, ne me lancez pas la-dessus. On raconte n'importe quoi depuis "+
        "qu'il n'y a plus de television."},
 {f:1, t:"Il y a toujours eu des histoires sur ce batiment. Avant c'etaient "+
        "des extraterrestres. Maintenant c'est autre chose. Ca passera."},
 {f:1, t:"Les gens ont peur, alors ils cherchent un coupable avec un portail "+
        "et des grillages. C'est humain, mais c'est bete."},
 {f:2, t:"Moi je vous dis que c'est une maladie, comme les autres. Il y en a "+
        "eu avant, il y en aura apres. Pas besoin d'inventer un laboratoire."},
 {f:2, t:"J'y suis passe devant cent fois. C'est un batiment gris avec un "+
        "parking. Il n'y a rien a en dire."},
 /* --- les tiedes --- */
 {f:3, t:"Je ne sais pas. Je ne crois pas ces betises, mais je reconnais que "+
        "les camions y entraient de nuit. Ca m'a toujours chiffonne."},
 {f:3, t:"On m'a dit qu'ils faisaient de la recherche medicale. C'est peut-etre "+
        "tout, et c'est peut-etre le probleme."},
 {f:4, t:"Ecoutez, je n'en sais rien. Ce que je sais, c'est que le gardien a "+
        "demissionne trois semaines avant que ca commence. Faites-en ce que "+
        "vous voulez."},
 {f:4, t:"Ma voisine y travaillait a l'entretien. Elle n'a jamais voulu me "+
        "dire ce qu'il y avait au sous-sol. Jamais un mot."},
 {f:5, t:"Il y a quelque chose, c'est sur. Est-ce que c'est ce qu'on raconte ? "+
        "Ca, je n'irais pas le jurer."},
 {f:5, t:"J'ai entendu la meme chose que vous. Ni plus, ni moins. Et je "+
        "n'aime pas ca."},
 /* --- ceux qui penchent --- */
 {f:6, t:"Les premiers cas sont partis de la. Regardez une carte et comptez "+
        "les jours, vous verrez le cercle s'ouvrir depuis ce batiment."},
 {f:6, t:"Ils ont evacue le site en une nuit. Une nuit. On n'evacue pas une "+
        "usine de peinture en une nuit."},
 {f:7, t:"Ma cousine etait infirmiere. Elle a vu arriver deux hommes en "+
        "combinaison, pas des pompiers, pas des militaires. Elle n'a plus "+
        "jamais reparle de cette garde."},
 {f:7, t:"Il y avait des cuves enterrees. Le maire a signe les permis sans "+
        "reunion publique. Ca, c'est dans les registres, allez verifier."},
 /* --- les convaincus --- */
 {f:8, t:"Bien sur que c'est eux. Tout le monde le sait et personne ne le dit, "+
        "parce que ceux qui l'ont dit ne sont plus la pour le repeter."},
 {f:8, t:"On a fabrique ca la-bas, on l'a laisse sortir, et on nous a "+
        "explique que c'etait la faute des rats. Des rats."},
 {f:9, t:"J'ai vu les camions. Trois heures du matin, sans plaques, escortes. "+
        "Vous croyez qu'on transporte du solvant sous escorte ?"},
 {f:10,t:"Ils savaient. Ils ont su des le premier jour et ils ont attendu de "+
        "voir jusqu'ou ca irait. Nous, on etait la mesure. Vous comprenez ? "+
        "On etait le protocole."}
];
/* Les questions du second niveau, une fois la rumeur lancee. */
/* ---- CE QU'ON SE DIT EN MARCHANT ----
   Deux questions qui n'existent que pour ceux du groupe. La premiere sur ce
   qui arrive au pays, la seconde sur lui - et celle-la rapproche : c'est en
   se racontant qu'on cesse d'etre deux inconnus qui marchent ensemble. */
var GDOPTS=["Que penses-tu de tout ca ?",
            "Parle-moi de toi.",
            "Prends la tete, je te suis.",
            "Rien, continuons."];
var GEPI=[
 "Je ne sais pas ou ca s'arrete. Je ne suis pas sur que ca s'arrete.",
 "Au debut je comptais les jours. J'ai arrete a vingt-trois.",
 "On dit que c'est pire vers les villes. Je veux bien le croire.",
 "Ce qui me tue, c'est le silence. Avant on entendait les tracteurs.",
 "J'ai vu un convoi passer sans s'arreter. Ils ne regardaient meme pas.",
 "Tant qu'on marche, on est vivants. C'est tout ce que je me dis.",
 "Il y en a moins qu'avant sur cette route. Ou alors ils sont ailleurs.",
 "Ma soeur devait me rejoindre. Ca fait six semaines.",
 "Je ne veux pas mourir bete. Si vous apprenez quelque chose, dites-le-moi.",
 "On s'habitue. C'est ca qui devrait nous inquieter, qu'on s'habitue.",
 "La nuit je les entends. Le jour je me dis que j'ai reve.",
 "Vous avez remarque ? Les oiseaux, eux, ils sont restes."];
var GMOI=[
 "Ma mere disait que j'etais trop bavard. Elle n'aurait pas aime le silence.",
 "J'ai appris a nager a trente-deux ans. Par honte, pas par gout.",
 "Je n'ai jamais quitte la region. Enfin, jusqu'a maintenant.",
 "J'avais un chien. Un vieux. Il est mort avant tout ca, et c'est tant mieux.",
 "Je chante faux, je le sais, et je chante quand meme.",
 "Mon pere ne m'a jamais dit qu'il etait fier. Je crois qu'il l'etait.",
 "Je collectionnais les cartes postales. Des endroits ou je n'irai jamais.",
 "J'ai failli me marier. Elle a dit oui, et puis elle a dit non.",
 "Je dors mal depuis toujours. Au moins ca sert, maintenant.",
 "Je sais faire une soupe avec n'importe quoi. Vraiment n'importe quoi.",
 "On m'a vole mon velo a seize ans. J'y pense encore, c'est ridicule.",
 "Je n'ai jamais su me battre. J'apprends. Tard, mais j'apprends.",
 "Ce que je regrette le plus ? Le pain chaud. Betement, le pain chaud.",
 "J'ai un frere quelque part. On ne se parlait plus. Ca me parait idiot maintenant.",
 "Je ne suis pas courageux. Je fais juste ce qu'il y a a faire."];
var RDOPTS=["Aupres de qui je pourrais me renseigner ?",
            "Moi je pense que c'est vrai.",
            "Vous savez ou il est, ce laboratoire ?",
            "Revenons a autre chose."];
/* Les saluts changent avec l'etat du pays : on ne dit pas bonjour de la meme
   facon quand le bourg d'a cote a cesse de repondre. */
var HELLO1=["Bonjour... vous venez de la route ?",
  "Vous n'avez croise personne en chemin ? Non ? Tant mieux.",
  "Entrez pas trop dans les terres, en ce moment.",
  "Ca va, vous ? Vous avez l'air d'aller. C'est deja ca.",
  "On ferme tot le soir, maintenant. Vous devriez faire pareil.",
  "Bonjour. Excusez, je vous avais pris pour autre chose."];
var HELLO2=["Vous etes vivant. C'est deja beaucoup.",
  "Ne restez pas au milieu de la rue.",
  "Il y en avait trois hier au bout du chemin. Trois.",
  "Vous cherchez quelqu'un ? Il n'y a plus grand monde a chercher.",
  "Parlez bas. Ils viennent au bruit.",
  "Si vous partez, dites-moi ou vous allez. Que quelqu'un le sache."];
var ACCEPT=["Vous partez quand ? Je prends mon sac.",
  "D'accord. D'accord, oui. Je ne peux plus rester ici de toute facon.",
  "Emmenez-moi. Je ne demande rien, je porterai ce qu'il faut.",
  "Oui. J'aurais du partir il y a un mois.",
  "Je viens. A deux on tient mieux qu'a un, c'est tout ce que je sais.",
  "Attendez-moi le temps de fermer la porte. Enfin - le temps de la fermer."];
var REFUS=["Rejoindre votre equipe ? Non merci, j'ai ma vie ici.",
  "C'est aimable, mais ma place est au bourg.",
  "Partir sur les routes ? Ce n'est pas pour moi.",
  "J'ai des gens qui comptent sur moi ici. Une autre fois.",
  "Vous etes bien courageux. Moi, je reste.",
  "Non. Je ne saurais pas quoi faire dehors."];
/* ---- L'ETAT DU PAYS ----
   La part du monde qui a tourne : les zombis rapportes a tout ce qui marche
   encore, morts et vivants confondus. Trois phases, et elles commandent le
   ton de tout le monde.
     0  moins d'un cinquieme : on rit de ceux qui y croient
     1  d'un cinquieme a la moitie : la peur monte, les convaincus aussi
     2  au-dela de la moitie : plus personne ne doute, plus personne ne reste */
function plagueRatio(){
    var z=0, h=0, i;
    for(i=0;i<ZOMBIES.length;i++) if(!ZOMBIES[i].dead&&!ZOMBIES[i].gone) z++;
    for(i=0;i<HUM.length;i++) if(!HUM[i].dead) h++;
    if(z+h<=0) return 0;
    return z/(z+h);
}
function plagueTier(){
    var r=plagueRatio();
    return (r<0.20)?0:((r<0.50)?1:2);
}
/* La foi d'un homme, corrigee par ce qu'il voit autour de lui. Ce n'est pas
   lui qui change d'avis : c'est le monde qui lui donne raison. */
function foiOf(n){
    var f=(n&&n.foi!==undefined)?n.foi:5;
    var t=plagueTier();
    if(t===1) f+=3;
    else if(t===2) f+=7;
    return Math.max(0,Math.min(10,f));
}
/* La ligne de rumeur la plus proche de sa foi du moment. Les egalites se
   departagent par le rang de naissance, pour que le meme homme rende
   toujours la meme phrase a foi egale. */
function rumeurLine(n){
    var f=foiOf(n), best=[], i, dd, bd=99;
    for(i=0;i<RUMEUR.length;i++){
        dd=Math.abs(RUMEUR[i].f-f);
        if(dd<bd){ bd=dd; best=[i]; }
        else if(dd===bd) best.push(i);
    }
    return RUMEUR[best[((n&&n.bio)||0)%best.length]].t;
}
/* ---- LES DIRECTIONS ----
   On ne donne jamais de coordonnees : on donne un cap, comme le ferait
   quelqu'un qui tend le bras. Au centre, on le dit. */
function dirWord(x0,y0,x1,y1){
    var dx=x1-x0, dy=y1-y0, m=Math.hypot(dx,dy), s="";
    if(m<180) return "tout pres d'ici";
    if(dy<-m*0.38) s+="nord";
    else if(dy>m*0.38) s+="sud";
    if(dx>m*0.38) s+=(s?"-":"")+"est";
    else if(dx<-m*0.38) s+=(s?"-":"")+"ouest";
    if(!s) s="nord";
    return "au "+s+(m>1400?", et c'est loin":"");
}
/* Le plus gros bourg de la carte : c'est la que se tient la mairie. */
function bigTown(){
    var b=null, i;
    for(i=0;i<VILLAGES.length;i++)
        if(!b||VILLAGES[i].villagers.length>b.villagers.length) b=VILLAGES[i];
    return b;
}
function labRect(){
    var i;
    for(i=0;i<BLDRECTS.length;i++) if(BLDRECTS[i].lt==="labo") return BLDRECTS[i];
    return null;
}
function pickName(fem){
    return (fem?PRENOM_F[(rng()*PRENOM_F.length)|0]
               :PRENOM_M[(rng()*PRENOM_M.length)|0])+" "+
           NOMFAM[(rng()*NOMFAM.length)|0];
}
/* Vie et endurance des PNJ : uniformes pour l'instant, on les differenciera
   plus tard. Ce qui leur appartient vraiment, c'est leur nom. */
/* ---- COMPETENCES DE BASE ----
   Quatre competences que tout le monde possede, joueur comme PNJ, notees sur
   100. Elles valent 50 partout pour l'instant : la progression et les effets
   viendront avec les systemes qu'elles commandent. */
/* Chaque competence porte quatre aptitudes. Une categorie ne vaut jamais
   l'aptitude seule : l'aptitude compte pour moitie et sa competence pour
   l'autre moitie, il faut donc les deux a 100 pour atteindre 100 pour cent. */
var STATDEF=[
 {k:"cardio", n:"Cardio",
  d:"Determine la quantite d'endurance. Plus elle est haute, plus longtemps "+
    "on peut courir ou se battre. Elle monte en sprintant et en grimpant.",
  sec:[{k:"souffle",  n:"Souffle",     d:"la reserve d'endurance"},
       {k:"vitesse",  n:"Vitesse",     d:"la vitesse de course"},
       {k:"portage",  n:"Portage",     d:"la charge que l'on peut porter"},
       {k:"immunite", n:"Immunite",    d:"la resistance aux maladies"}]},
 {k:"astuce", n:"Astuce",
  d:"Determine la vitesse, le silence et le rendement des fouilles, le niveau "+
    "de serrure que l'on sait ouvrir et la fourchette des echanges. Elle monte "+
    "en fouillant, en crochetant, en se cachant et en marchandant.",
  /* Fouille dit tout d'un fouilleur : la vitesse, la maladresse et le
     rendement. Le Flair avait ete separe un temps, puis rendu a Fouille -
     c'est la meme chose, quelqu'un de tres bon en fouille est plus rapide,
     plus discret et rapporte de meilleures choses. Et Entretien a disparu
     avec l'usure des aptitudes, qu'il etait seul a servir. */
  sec:[{k:"fouille",    n:"Fouille",    d:"vitesse, silence et rendement des fouilles"},
       {k:"crochetage", n:"Crochetage", d:"le niveau de serrure que l'on sait ouvrir"},
       {k:"discretion", n:"Discretion", d:"reduit le rayon ou l'on est repere"},
       {k:"troc",       n:"Troc",       d:"elargit la fourchette des echanges"}]},
 {k:"combat", n:"Combat",
  d:"Determine les points de vie, ce que l'on encaisse, ce que l'on rend au "+
    "corps a corps et la chance d'esquiver. Elle monte en se battant de pres "+
    "et en encaissant.",
  sec:[{k:"vigueur",  n:"Vigueur",      d:"ce que l'on encaisse des coups recus"},
       {k:"sante",    n:"Sante",        d:"le maximum de points de vie"},
       {k:"frappe",   n:"Frappe",       d:"les degats au corps a corps"},
       {k:"parade",   n:"Parade",       d:"la chance d'esquiver une attaque"}]},
 {k:"tir", n:"Tir",
  d:"Determine l'efficacite avec une arme a feu en main. En montant, elle "+
    "reduit le recul et l'oscillation. Elle monte en tirant sur les ennemis.",
  sec:[{k:"chargement", n:"Chargement", d:"le temps de rechargement"},
       {k:"maniement",  n:"Maniement",  d:"la rapidite de changement d'arme"},
       {k:"stabilite",  n:"Stabilite",  d:"le recul, l'oscillation et la dispersion"},
       {k:"lancer",     n:"Lancer",     d:"grenades et tout ce qui se jette"}]}
];
function baseStats(){ return {cardio:50, astuce:50, combat:50, tir:50}; }
function baseSec(){
    var o={}, i, q;
    for(i=0;i<STATDEF.length;i++)
        for(q=0;q<STATDEF[i].sec.length;q++) o[STATDEF[i].sec[q].k]=50;
    return o;
}
/* ---- LA COMPETENCE EST LA MOYENNE DE SES APTITUDES ----
   Elle ne se compte plus a part. Sans cela, elle restait bloquee a sa valeur
   de naissance et tirait eternellement la moyenne vers le bas : un
   instituteur qui aurait fouille toute sa vie aurait plafonne a 87 effectifs
   et jamais atteint 100. Elle se recalcule donc a chaque fois qu'une de ses
   aptitudes bouge - le specialiste d'une seule aptitude ne fait monter sa
   competence qu'au quart de la vitesse, ce qui recompense le complet sans
   punir le specialiste. */
function statSync(o){
    var i, q, s, n, S;
    if(!o||!o.sec) return o;
    if(!o.stats) o.stats={};
    for(i=0;i<STATDEF.length;i++){
        S=STATDEF[i]; s=0; n=0;
        for(q=0;q<S.sec.length;q++){
            if(o.sec[S.sec[q].k]===undefined) continue;
            s+=o.sec[S.sec[q].k]; n++;
        }
        if(n) o.stats[S.k]=clamp(s/n,5,100);
    }
    return o;
}
/* ---- CE QUE L'ON PORTE ----
   o.vet est un tableau de quatre indices d'objet, un par emplacement, -1
   pour un emplacement vide. Le joueur et les compagnons suivent la meme
   regle : un habitant habille garde sa tenue en rejoignant le groupe, et
   c'est de la que vient le pompier qui encaisse mieux que les autres. */
function vetInit(){ return [-1,-1,-1,-1]; }
function vetAt(o,s){
    if(!o||!o.vet) return null;
    var d=itemById(o.vet[s]);
    return (d&&d.k==="vet")?d:null;
}
/* La somme de ce que la tenue ajoute a une aptitude. */
function vetBon(o,sk){
    var s=0, i, d;
    if(!o||!o.vet) return 0;
    for(i=0;i<4;i++){
        d=vetAt(o,i);
        if(d&&d.bon&&d.bon[sk]) s+=d.bon[sk];
    }
    return s;
}
/* Le poids de ce qu'on a sur le dos : il compte comme le reste. */
function vetWeight(o){
    var s=0, i, d;
    for(i=0;i<4;i++){ d=vetAt(o,i); if(d) s+=d.pds; }
    return s;
}
/* Habiller quelqu'un directement, a sa naissance ou par le butin. */
function vetSet(o,id){
    var d=itemById(id);
    if(!o) return false;
    if(!o.vet) o.vet=vetInit();
    if(!d||d.k!=="vet") return false;
    o.vet[d.sl]=d.id;
    if(o.maxhp!==undefined){ o.maxhp=hpMax(o); if(o.hp>o.maxhp) o.hp=o.maxhp; }
    return true;
}
function vetClear(o,s){
    if(!o||!o.vet) return -1;
    var old=o.vet[s];
    o.vet[s]=-1;
    if(o.maxhp!==undefined){ o.maxhp=hpMax(o); if(o.hp>o.maxhp) o.hp=o.maxhp; }
    return old;
}
/* La valeur d'une categorie : moitie competence, moitie aptitude. La
   competence etant la moyenne des quatre, une aptitude pese cinq huitiemes de
   son propre chiffre et trois huitiemes de celui de ses voisines.
   Ce que la tenue donne s'ajoute par-dessus, en entier et non de moitie : un
   gilet annonce quatorze de Vigueur, il en donne quatorze. Le total reste
   borne a 100, sans quoi toutes les formules du jeu sortiraient de leur
   plage - un vetement aide donc celui qui n'est pas deja au sommet. */
function statEff(o,mk,sk){
    var m=((o&&o.stats)||baseStats())[mk]||0;
    var a=((o&&o.sec)||baseSec())[sk]||0;
    return clamp((m+a)/2+vetBon(o,sk),0,100);
}
/* ---- LE PLAFOND DE CHACUN ----
   Personne ne devient bon en tout. Chacun garde ses valeurs de naissance dans
   sec0, et la plus haute d'entre elles est sa specialite : celle-la seule
   peut monter jusqu'a 100. Les quinze autres ne depassent jamais leur depart
   de plus de CFG.STAT_GAIN points. Un boulanger qui court tous les jours
   finira meilleur qu'au depart, jamais athlete comme un pompier.
   Le metier herite ne decide donc plus seulement du debut : il decide du
   plafond, et c'est ce qui lui donne son poids. */
function statSpec(o){
    var k, best=null, bv=-1;
    if(!o||!o.sec) return null;
    for(k in o.sec) if(o.sec[k]>bv){ bv=o.sec[k]; best=k; }
    return best;
}
/* tie : departage les egalites. Un personnage dont toutes les aptitudes se
   valent - le sans-metier - n'a aucune raison d'etre specialiste de la
   premiere de la liste : sa specialite se tire a sa naissance, une fois. */
function statBirth(o,tie){
    var k, best=[], bv=-1;
    if(!o||!o.sec) return o;
    o.sec0={};
    for(k in o.sec){
        o.sec0[k]=o.sec[k];
        if(o.sec[k]>bv){ bv=o.sec[k]; best=[k]; }
        else if(o.sec[k]===bv) best.push(k);
    }
    o.spec=best[Math.min(best.length-1,((tie||0)*best.length)|0)]||null;
    return o;
}
/* Le niveau de serrure que l'on sait ouvrir : 1 a 5 d'aptitude, 10 a 100.
   C'est un savoir, pas une vitesse. */
function pickLevel(o){
    var e=statEff(o,"astuce","crochetage");
    return Math.max(1,Math.min(10,Math.round(1+9*(e-5)/95)));
}
/* ---- LA MONTEE ----
   Elle ne vaut que pour le joueur et pour ceux qui l'ont suivi : un habitant
   croise dans la rue ne progresse pas, sans quoi la carte entiere monterait
   sans que personne ne la regarde. Le drapeau recruted est pose d'avance -
   le recrutement lui-meme viendra, la montee l'attend sans rien demander.
   Le plafond de chacun s'applique : la specialite jusqu'a 100, les quinze
   autres jusqu'a leur naissance plus CFG.STAT_GAIN. */
function statUp(o){ return !!o&&(o===(G&&G.p)||!!o.recruited); }
function useCost(v){
    return CFG.STAT_USE_A*Math.exp(CFG.STAT_USE_B*v);
}
function secBump(o,k,n){
    if(!statUp(o)||!o.sec||o.sec[k]===undefined) return 0;
    var cap=statCap(o,k), got=0, c;
    /* La Sante au plafond ne s'arrete pas la : ce qu'on ne peut plus mettre
       dans l'aptitude passe en points de vie bruts, jusqu'au plafond de la
       carcasse. C'est la seule aptitude qui deborde. */
    if(k==="sante"&&o.sec[k]>=cap&&o.sec0){
        var hc=hpCap(o), cur=hpMax(o);
        if(cur>=hc) return 0;
        if(!o.use) o.use={};
        o.use[k]=(o.use[k]||0)+(n||1);
        while(hpMax(o)<hc){
            c=useCost(hpMax(o));
            if(o.use[k]<c) break;
            o.use[k]-=c;
            o.hpGain=(o.hpGain||0)+1;
            got++;
        }
        if(got){
            var mx2=hpMax(o);
            o.hp=Math.min(mx2,(o.hp||0)+(mx2-(o.maxhp||mx2)));
            o.maxhp=mx2;
            if(o===(G&&G.p))
                logMsg("Vous encaissez mieux : "+mx2+" points de vie"+
                       ((mx2>=hc)?" (plafond atteint)":"")+".","jsay");
        }
        return got;
    }
    if(o.sec[k]>=cap) return 0;
    if(!o.use) o.use={};
    o.use[k]=(o.use[k]||0)+(n||1)*(1+0.1*builtN("sport"));
    while(o.sec[k]<cap){
        c=useCost(o.sec[k]);
        if(o.use[k]<c) break;
        o.use[k]-=c;
        o.sec[k]=Math.min(cap,o.sec[k]+1);
        got++;
    }
    if(!got) return 0;
    /* la competence suit ses aptitudes, et la vie suit la Sante */
    statSync(o);
    if(k==="sante"){
        var mx=hpMax(o);
        o.hp=Math.min(mx,(o.hp||0)+(mx-(o.maxhp||mx)));
        o.maxhp=mx;
    }
    if(o===(G&&G.p)){
        var J=null, i, q;
        for(i=0;i<STATDEF.length;i++)
            for(q=0;q<STATDEF[i].sec.length;q++)
                if(STATDEF[i].sec[q].k===k) J=STATDEF[i].sec[q];
        logMsg((J?J.n:k)+" : "+Math.round(o.sec[k])+
               (o.sec[k]>=cap?" (plafond atteint)":""),"jsay");
    }
    return got;
}
function statCap(o,k){
    if(!o||!o.sec0||o.sec0[k]===undefined) return 100;
    if(o.spec===k) return 100;
    return Math.min(100,o.sec0[k]+CFG.STAT_GAIN);
}
/* ---- ENDURANCE ET PORTAGE ----
   Les deux vivent sur Cardio : Souffle donne la reserve, Portage la charge.
   La reserve n'est jamais stockee, elle se recalcule : une aptitude qui monte
   ou qui s'emousse deplace le plafond sans qu'on ait a y toucher. */
/* ---- SANTE : LES POINTS DE VIE ----
   Le maximum de vie n'est plus un 100 pour tous : c'est l'aptitude Sante,
   plus les points gagnes en montant (hpGain, plafonne a CFG.STAT_GAIN par la
   montee elle-meme). Un personnage ne a 30 de Sante a 30 points de vie et
   pourra en gagner 30 ; un ne a 100 pourra atteindre 130. Comme le souffle,
   le maximum ne se stocke pas : il se recalcule, et une aptitude qui monte
   deplace le plafond toute seule. */
/* Le plafond de vie. L'aptitude s'arrete a 100 comme toutes les autres, mais
   la carcasse, elle, peut aller au-dela : celui qui nait avec 100 de Sante
   monte jusqu'a 130. Le plafond est donc le plus haut des deux - ce que
   l'aptitude autorise, et la naissance plus le gain. Un ne a 30 sans
   specialite plafonne a 60 ; un ne a 30 dont la Sante est la specialite
   plafonne a 100 ; un ne a 100 plafonne a 130. */
function hpCap(o){
    if(!o||!o.sec0||o.sec0.sante===undefined) return 100;
    return Math.max(statCap(o,"sante"),o.sec0.sante+CFG.STAT_GAIN);
}
/* ---- LE MORAL ----
   Un seul moral. Quand une base existe, c'est le sien (0 a 100, 50 neutre) et
   il vaut pour TOUS ses occupants - le joueur et ses compagnons. Sans base, le
   moral n'est que celui du joueur, sur la meme echelle. En dessous de 50 il
   ronge la vie et l'endurance : a 50 on est entier, a 0 elles plafonnent a la
   moitie. Au-dessus de 50, pas de bonus de vie (c'est morBonus qui recompense
   le bon moral, sur les degats et le souffle). Les villageois, troupes et
   zombis n'y sont pas soumis : pour eux le facteur reste a un. */
function moralMul(o){
    if(!o||!G) return 1;
    var isP=(o===G.p), m;
    if(BASE){
        if(!isP&&!o.recruited) return 1;
        m=(BASE.mor===undefined)?MOR_START:BASE.mor;
    } else {
        if(!isP) return 1;
        m=(G.p.moral!==undefined)?G.p.moral:MOR_START;
    }
    if(m<0) m=0; else if(m>100) m=100;
    /* +-25% : neutre au centre, +50 (affiche) => 1.25, -50 => 0.75 */
    return 1+(m-50)/200;
}
function setMoral(o,v){
    if(!o) return;
    o.moral=Math.max(0,Math.min(MOR_MAX,v));
    o.maxhp=hpMax(o); if(o.hp>o.maxhp) o.hp=o.maxhp;
    var sm=staMax(o); if(o.sta>sm) o.sta=sm;
}
/* Le moral effectif, 0 a 100 : celui de la base tant qu'elle existe (il vaut
   pour tous ses occupants), sinon celui du joueur seul. C'est ce chiffre que
   la jauge du HUD montre. */
function moralNow(){
    if(BASE) return (BASE.mor===undefined)?MOR_START:BASE.mor;
    return (G&&G.p&&G.p.moral!==undefined)?G.p.moral:MOR_START;
}
/* Crediter ou debiter le moral, la ou il vit (la base, sinon le joueur), puis
   rafraichir les plafonds de vie et d'endurance sous le nouveau facteur. */
function moralAdd(d){
    if(BASE){
        BASE.mor=clamp((BASE.mor===undefined?MOR_START:BASE.mor)+d,0,MOR_MAX);
        setMoral(G.p,(G.p.moral!==undefined)?G.p.moral:MOR_START);
    } else {
        setMoral(G.p,(G.p.moral||MOR_START)+d);
    }
}
/* Un petit nombre qui monte AU-DESSUS DE LA BARRE concernee (et non plus du
   personnage) : c'est de la barre que part le pop. Purement visuel. */
function statPop(host,n,col,side){
    if(!host||!n) return;
    var d=document.createElement("div");
    d.className="statpop "+(side?"side":"top"); d.textContent=(n>0?"+":"")+n;
    d.style.color=col;
    if(col==="#000000") d.style.textShadow="0 0 3px #fff,0 0 4px #fff";
    host.appendChild(d);
    setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); },850);
}
function hpMax(o){
    if(!o) return 100;
    if(o.traits) return o.maxhp||100;   /* les zombis ont leur propre regle */
    var s=(o.sec&&o.sec.sante!==undefined)?o.sec.sante:100;
    /* La Sante d'un vetement s'ajoute apres le plafond : une veste de pompier
       donne huit points de vie a qui la porte, quel que soit son plafond de
       naissance, et les reprend quand il la pose. */
    return Math.max(5,Math.round((Math.min(hpCap(o),s+(o.hpGain||0))+vetBon(o,"sante"))*moralMul(o)));
}
function staMax(o){
    return (CFG.STA_BASE+CFG.STA_PER*statEff(o,"cardio","souffle"))*moralMul(o);
}
/* Ce que le joueur peut porter sans le sentir passer. */
function carryCap(){
    return CFG.CARRY_BASE+CFG.CARRY_PER*statEff(G&&G.p,"cardio","portage");
}
/* La part de charge au-dela de la moitie de la capacite, de 0 a 1 : c'est
   elle qui pese sur les jambes et sur le souffle. Au-dela de 1, on surcharge. */
function loadRatio(){
    var c=carryCap(), r;
    if(c<=0) return 1;
    r=invWeight()/c;
    return (r<=CFG.CARRY_FREE)?0:((r-CFG.CARRY_FREE)/(1-CFG.CARRY_FREE));
}
/* ---- LA SURCHARGE, EN DEUX PALIERS ----
   On peut depasser le poids que la force autorise : rien ne l'interdit, mais
   cela se paie, et le prix tombe d'un coup.
   IL Y AVAIT DEUX PALIERS, IL N'Y EN A PLUS QU'UN. Le souffle qui brulait
   double a une fois la charge, la course refusee a deux fois : on ne peut
   pas depasser son Portage a demi. Des qu'on le depasse, la course est
   refusee ET le souffle descend en marchant au lieu de remonter - c'est la
   seule facon que le souffle veuille encore dire quelque chose quand la
   course, elle, est deja interdite. A sec, l'allure tombe.
   overRatio rend la charge en parts du poids autorise : 1 c'est la limite. */
function overRatio(){
    var c=carryCap();
    if(c<=0) return 3;
    return invWeight()/c;
}
/* Au-dela du poids autorise : le souffle brule deux fois plus vite. */
function overCarry(){ return overRatio()>1; }
/* Le meme seuil, garde sous son ancien nom : la marche et rien d'autre. Ni
   course, ni accroupissement - on ne se baisse pas sous plus que sa charge. */
function overLoaded(){ return overCarry(); }
/* Le multiplicateur de depense de souffle du a la surcharge. */
function staDrain(){ return (overCarry()?2:1)*(1-morBonus()); }
/* ---- PARADE : L'ESQUIVE ----
   La chance de se derober au coup qui part. Une sur vingt les bras ballants,
   une sur trois a cent - jamais plus : un zombi finit toujours par mordre. */
function dodgeChance(o){
    return 0.05+0.283*statEff(o,"combat","parade")/100;
}
/* ---- VITESSE : LE PAS DE COURSE ----
   Elle ne joue qu'en courant : marcher, tout le monde sait. De trois quarts a
   cinq quarts de l'allure de base selon l'aptitude. */
function sprintMul(o){
    if(!o||o.mode!==2) return 1;
    return 0.75+0.5*statEff(o,"cardio","vitesse")/100;
}
/* Le coefficient de vitesse du a la charge. */
function loadSpeed(){
    /* En surcharge on marche encore normalement TANT QU'ON A DU SOUFFLE : la
       punition n'est plus dans le pas, elle est dans la reserve qui se vide.
       C'est quand elle est vide que les jambes lachent, et cela s'annonce -
       la jauge descend a vue - au lieu de tomber au premier kilo de trop. */
    if(overLoaded()&&G.p.winded) return 1-CFG.CARRY_OVER_SLOW;
    return 1-CFG.CARRY_SLOW*Math.min(1,loadRatio());
}
/* Le sprint coute plus cher quand on est charge, et double en surcharge. */
function loadCost(){
    return (1+CFG.CARRY_COST*Math.min(1,loadRatio()))*staDrain();
}
/* Peut-on sprinter ? Il faut du souffle, et ne pas porter plus du double. */
/* ---- COURIR : CE QUI L'INTERDIT ----
   Trois choses, et elles ne se remplacent pas. La charge au-dela du Portage.
   Le souffle a sec. Et LA CARCASSE : sous SPRINT_HP de sa vie on ne court
   plus, quelle que soit la reserve d'air - on tient debout, c'est deja
   beaucoup. C'est le seuil qui rend une fuite impossible quand on aurait
   justement besoin de fuir, et c'est voulu : on soigne avant de repartir.
   C'EST UNE PART, PAS UN NOMBRE DE POINTS, et il a fallu le mesurer pour le
   comprendre. Un point de vie vaut ici la Sante : la carcasse mediane d'un
   humain fait 45 points, le quart inferieur 34, et un ne sans metier peut
   n'en avoir que 5. Trente points fixes, c'etaient les deux tiers de la vie
   d'un homme moyen - il aurait passe sa partie a marcher - et les faibles
   n'auraient jamais couru une seule fois, meme intacts. Trente pour cent
   veut dire la meme chose pour tout le monde. */
var SPRINT_HP=0.30;
function canSprint(o){
    var p=o||(G&&G.p);
    if(!p) return false;
    if(overLoaded()) return false;
    if(p.hp<(p.maxhp||hpMax(p))*SPRINT_HP) return false;
    if(p.winded) return p.sta>=staMax(p)*CFG.STA_RESUME;
    return p.sta>0;
}
/* L'usure des aptitudes a ete abandonnee. Elle etait ecrite depuis la v10 et
   n'a jamais tourne : elle demandait qu'une aptitude puisse monter pour avoir
   un sens, et le jour ou la montee est arrivee on lui a prefere le plafond
   individuel. Un personnage ne perd plus rien avec le temps ; ce qui le
   limite n'est pas l'oubli, c'est ce qu'il etait a sa naissance. */
/* ---- CE QUE PORTE CHACUN ----
   Un seul inventaire par personnage, pose a sa naissance : le panneau
   d'echange le montre quand il est vivant, la fouille le montrera quand il
   sera mort. Rien n'est tire au moment de la mort.
   Trois frequences seulement, tirees independamment les unes des autres :
   un militaire peut donc sortir bredouille, et un scout peut cumuler son
   arme et ses vivres, ce qui est bien le sens de "souvent" deux fois.
   Le zombi sorti du laboratoire ne porte rien : il n'a jamais eu de vie. */
var SOUVENT=0.65, PARFOIS=0.30, RAREMENT=0.08;
/* D'ou vient chaque arme. C'est la meme regle que pour la fouille des
   batiments : elle donne leur sens aux calibres. */
var WSRC={
 stand:["Chiappa M1-22","CZ 457","Unique T66","Ruger 10/22","Unique DES 69",
        "Ruger Mk IV","Kalachnikov WBP Jack","Ruger Mini-14","S&W 686",
        "Verney-Carron Impact","Browning B525","Verney-Carron Veloce"],
 militaire:["FAMAS F1","FAMAS G2","HK416F","Minimi 5,56","AA-52","MAS-49/56",
        "FR-F1","FR-F2","HK417","FN SCAR-H PR","PGM Ultima Ratio",
        "Poignard Le Vengeur","Beche-pioche 1916","Hache de sapeur"],
 police:["PAMAS G1","SIG SP 2022","Glock 17","Manurhin MR73","MP5","HK UMP9",
        "MAT-49","Remington 870","Tonfa PR-24"],
 chasse:["Manufrance Robust","Manufrance Falcor","Verney-Carron Veloce",
        "Verney-Carron VCD10","CZ 457","Unique T66","Ruger 10/22","Chapuis ROLS"],
 cac:["Poignard Le Vengeur","Beche-pioche 1916","Hache de sapeur","Tonfa PR-24"],
 pompier:["Hache de pompier"],
 /* Les quatre provenances que la fouille des batiments ajoute. L'armurerie
    tient le civil, le chateau tient le musee, et le grenier de maison ne
    donne que du .22 - la ferme y ajoute son fusil de chasse. */
 armurerie:["Manufrance Robust","Manufrance Falcor","Verney-Carron Veloce",
        "Verney-Carron VCD10","CZ 457","Unique T66","Ruger 10/22",
        "Chapuis ROLS","Manurhin MR73","S&W 686"],
 musee:["Lebel Mle 1886","Berthier 1907/15","Chauchat CSRG 1915",
        "Hotchkiss Mle 1914","FM 24/29","MAS-36","RSC Mle 1917",
        "Revolver Mle 1892","MAS-38","Baionnette Rosalie"],
 grenier:["Chiappa M1-22","CZ 457","Unique T66","Ruger 10/22",
        "Unique DES 69","Ruger Mk IV"],
 gferme:["Chiappa M1-22","CZ 457","Unique T66","Ruger 10/22",
        "Unique DES 69","Ruger Mk IV","Manufrance Robust","Manufrance Falcor"],
 /* Les deux pieces les plus lourdes de la carte, au niveau le plus haut :
    elles ne sortent que de la caserne, et rarement. */
 lourd:["Browning M2","PGM Hecate II"]
};
/* Les vivres ne sont pas les memes selon le metier : le pecheur sort du
   poisson, le paysan des legumes et du lait. */
var FOODSET={
 pecheur:["Conserve de thon","Viande sechee","Pain rassis","Bidon d'eau","Gourde pleine"],
 paysan:["Pomme","Poire","Tomate","Carotte","Pomme de terre","Chou","Brique de lait"],
 scout:["Barre de cereales","Biscuits secs","Conserve de haricots","Gourde pleine","Viande sechee"],
 militaire:["Ration militaire","Conserve de haricots","Bidon d'eau"]
};
function wByName(n){ var i; for(i=0;i<WEAPONS.length;i++) if(WEAPONS[i].n===n) return i; return -1; }
function pickFrom(list){ return list[(rng()*list.length)|0]; }
/* Poser une arme dans le sac d'un PNJ, et rendre son calibre. */
function npcGiveW(n,src){
    var wi=wByName(pickFrom(WSRC[src]||[]));
    if(wi<0) return null;
    var q, w=WEAPONS[wi];
    for(q=0;q<n.inv.length;q++) if(!n.inv[q]){ n.inv[q]={w:wi,q:1}; return w.am; }
    return null;
}
function npcGiveI(n,name,q){
    var o=itemFind(name), k;
    if(!o) return;
    q=q||1;
    for(k=0;k<n.inv.length&&q>0;k++)
        if(!n.inv[k]){ n.inv[k]={i:o.id,q:1}; q--; }
}
function npcGiveAmmo(n,am){
    var i;
    if(!am) return;
    for(i=0;i<ITEMS.length;i++)
        if(ITEMS[i].k==="mun"&&ITEMS[i].am===am){ npcGiveI(n,ITEMS[i].n,1); return; }
}
function npcGiveKind(n,kind,set){
    var pool=[], i;
    if(set&&FOODSET[set]){ npcGiveI(n,pickFrom(FOODSET[set]),1); return; }
    for(i=0;i<ITEMS.length;i++) if(ITEMS[i].k===kind) pool.push(ITEMS[i].n);
    if(pool.length) npcGiveI(n,pickFrom(pool),1);
}
/* Le sac d'un PNJ : petit, et son contenu depend de son metier. */
/* ---- LE SAC DE CHACUN ----
   Tout le monde avait quatre cases et pas de sac : un citadin portait autant
   qu'un scout en expedition. Le sac vient maintenant du metier, avec une part
   de hasard, et c'est lui qui donne le nombre de cases. Les gens de bourg
   voyagent leger, ceux qui vivent dehors ont de quoi.
   Les indices renvoient a BAGS : 0 sacoche de 5, 1 ecolier de 10,
   2 randonnee de 15, 3 militaire de 20, 4 expedition de 25. La valeur -1
   veut dire les poches, et rien d'autre : trois cases.
   CE SONT DES INDICES ICI ET NULLE PART AILLEURS. npcBag les convertit en
   identifiants d'objet avant d'ecrire n.bag - voir la note qui l'accompagne.
   Rien hors de cette table ne doit lire n.bag comme un rang de BAGS. */
/* petit surtout, moyen un peu moins, gros tres rare : le lot commun de qui
   n'est ni soldat, ni eclaireur, ni fermier. Huit petits, trois moyens, un
   gros sur douze tirages. */
var BAGB=[0,0,0,0,1,1,1,1,2,2,2,3];
var BAGROLE={
    militaire:[3,3,4],  soldat:[2,3,3],
    scout:[2,3,4],      fermier:[1,2,3,4],
    policier:BAGB,      pompier:BAGB,
    soignant:BAGB,      pecheur:BAGB,
    habitant:BAGB
};
var POCKETS=3;
/* DEUX CONVENTIONS SE PARTAGEAIENT n.bag, ET ELLES NE COINCIDAIENT QUE PAR
   ACCIDENT. Le champ vaut un IDENTIFIANT D'OBJET partout ailleurs - setBag
   ecrit b.id, la table a deux ecrit o.id, ownBag lit itemById(o.bag), et
   eqStripBag rend {i:n.bag} au sac de qui le retire. Ici seul, il valait un
   INDICE DE BAGS. Les deux se lisaient pareil parce que BAGS est le premier
   tableau verse dans ITEMS, donc id vaut indice pour les cinq sacs et pour
   eux seuls. Le jour ou l'on verse quoi que ce soit avant, un militaire nait
   avec un objet quelconque sur le dos et le desequipement rend cet objet-la.
   Ca ne se serait vu nulle part, ni au banc ni a l'oeil : c'est exactement le
   genre de piege que npcWeapon a tendu pendant trois versions.
   L'INDICE RESTE LOCAL - BAGROLE tire un indice, on lit la capacite dessus,
   et l'on ecrit l'identifiant. */
function npcBag(n,role){
    var t=BAGROLE[role]||BAGROLE.habitant;
    var b=t[(rng()*t.length)|0];
    n.bag=(b>=0&&BAGS[b])?BAGS[b].id:-1;
    /* meme piege que n.stripped : un corps depouille de son sac renaissait
       sans lui d'une partie a l'autre */
    n.bagged=0;
    var cap=(b>=0&&BAGS[b])?BAGS[b].cap:POCKETS;
    n.inv=[];
    while(n.inv.length<cap) n.inv.push(null);
    n.inv.gw=(b>=0&&BAGS[b])?BAGS[b].bw:POCKETS;
    return n;
}
/* ---- LA TENUE DU METIER ----
   On ne trouve pas un casque de pompier dans un tiroir : on le trouve sur un
   pompier, ou dans sa caserne. Chacun s'habille donc a sa naissance selon ce
   qu'il fait, piece par piece et avec sa propre chance - un militaire porte
   presque toujours son treillis, rarement le gilet pare-balles.
   Le civil s'habille en civil, et pauvrement : c'est ce qui rend une tenue
   trouvee sur un uniforme interessante. */
function vetGive(n,name,ch){
    var d=itemFind(name);
    if(!d||d.k!=="vet") return;
    if(rng()<(ch===undefined?1:ch)) vetSet(n,d.id);
}
function vetWear(n,role){
    if(!n) return n;
    n.vet=vetInit();
    /* le corps se refouille d'une partie a l'autre : sans cela, un pecheur
       depouille la partie precedente renaissait deja vide */
    n.stripped=0;
    if(role==="militaire"||role==="soldat"){
        vetGive(n,"Casque militaire",SOUVENT);
        vetGive(n,"Veste de treillis",SOUVENT);
        vetGive(n,"Gilet pare-balles",RAREMENT);
        vetGive(n,"Pantalon de treillis",SOUVENT);
        vetGive(n,"Rangers",SOUVENT);
    } else if(role==="pompier"){
        vetGive(n,"Casque de pompier",SOUVENT);
        vetGive(n,"Veste de pompier",SOUVENT);
        vetGive(n,"Surpantalon de feu",PARFOIS);
        vetGive(n,"Bottes de pompier",SOUVENT);
    } else if(role==="policier"){
        vetGive(n,"Casquette de police",PARFOIS);
        vetGive(n,"Gilet pare-balles",PARFOIS);
        vetGive(n,"Blouson de cuir",PARFOIS);
        vetGive(n,"Pantalon de service",SOUVENT);
        vetGive(n,"Rangers",PARFOIS);
    } else if(role==="soignant"){
        vetGive(n,"Blouse de soignant",SOUVENT);
        vetGive(n,"Masque a gaz",RAREMENT);
        vetGive(n,"Pantalon de service",PARFOIS);
        vetGive(n,"Baskets",PARFOIS);
    } else if(role==="scout"){
        vetGive(n,"Cagoule de chasse",PARFOIS);
        vetGive(n,"Pantalon de chasse",PARFOIS);
        vetGive(n,"Mocassins de chasse",PARFOIS);
        vetGive(n,"Blouson de cuir",RAREMENT);
    } else if(role==="pecheur"){
        vetGive(n,"Cire de pecheur",SOUVENT);
        vetGive(n,"Bonnet de laine",PARFOIS);
        vetGive(n,"Bottes de peche",SOUVENT);
    } else if(role==="fermier"){
        vetGive(n,"Jean de travail",SOUVENT);
        vetGive(n,"Chaussures de securite",PARFOIS);
        vetGive(n,"Bonnet de laine",RAREMENT);
    } else if(role==="labo"){
        vetGive(n,"Masque a gaz",SOUVENT);
        vetGive(n,"Blouse de soignant",SOUVENT);
    } else {
        /* le civil : peu de chose, et rien de protecteur */
        vetGive(n,pickFrom(["Bonnet de laine","Cagoule de chasse"]),RAREMENT);
        vetGive(n,pickFrom(["Blouson de cuir","Cire de pecheur"]),RAREMENT);
        vetGive(n,pickFrom(["Bas de jogging","Jean de travail","Pantalon de chasse"]),PARFOIS);
        vetGive(n,pickFrom(["Baskets","Mocassins de chasse","Chaussures de securite"]),PARFOIS);
    }
    if(n.maxhp!==undefined){ n.maxhp=hpMax(n); n.hp=n.maxhp; }
    return n;
}
function npcLoot(n,role){
    var i, am;
    npcBag(n,role);
    vetWear(n,role);
    /* chargeur, vrac et signal de penurie appartiennent a la partie : sans
       cette remise a zero, un pecheur reutilise d'une partie a l'autre
       renaissait avec le chargeur qu'on lui avait rempli */
    n.mag=[0,0,0,0]; n.loose={}; n.dry=0;
    n.heal=0; n.healR=0; n.careT=0; n.sto=0; n.stoR=0;
    if(!n.slots) n.slots=[null,null,null,null];
    else { n.slots[0]=null; n.slots[1]=null; n.slots[2]=null; n.slots[3]=null; }
    if(role==="labo"){ n.bag=-1; n.inv=[null,null,null]; return n; }
    if(role==="guide"){
        /* L'EPEE EST SUR LE SPRITE, ELLE DOIT ETRE DANS LA MAIN. Il la porte
           toujours - c'est tout son personnage, un guide desarme n'aurait
           aucune raison de tenir la porte - et c'est LA PIECE UNIQUE DE LA
           CARTE : elle n'est dans aucune table de provenance, personne
           d'autre ne peut l'avoir, et il n'y a qu'une facon de l'obtenir. */
        var wg=wByName("Epee de cour du chateau"), qg;
        if(wg>=0) for(qg=0;qg<n.inv.length;qg++)
            if(!n.inv[qg]){ n.inv[qg]={w:wg,q:1}; break; }
        if(rng()<SOUVENT) npcGiveKind(n,"viv");
        if(rng()<PARFOIS) npcGiveKind(n,"med");
        return n;
    }
    if(role==="militaire"||role==="soldat"){
        if(rng()<SOUVENT){ am=npcGiveW(n,"militaire"); if(rng()<SOUVENT) npcGiveAmmo(n,am); }
        if(rng()<RAREMENT) npcGiveKind(n,"viv","militaire");
        if(rng()<RAREMENT) npcGiveKind(n,"med");
    } else if(role==="pompier"){
        if(rng()<SOUVENT) npcGiveKind(n,"med");
        if(rng()<PARFOIS) npcGiveW(n,"pompier");
        if(rng()<RAREMENT) npcGiveKind(n,"viv");
    } else if(role==="policier"){
        if(rng()<SOUVENT){ am=npcGiveW(n,"police"); if(rng()<SOUVENT) npcGiveAmmo(n,am); }
        if(rng()<PARFOIS) npcGiveKind(n,"med");
        if(rng()<PARFOIS) npcGiveKind(n,"viv");
    } else if(role==="soignant"){
        if(rng()<SOUVENT) npcGiveKind(n,"med");
        if(rng()<RAREMENT) npcGiveKind(n,"viv");
    } else if(role==="scout"){
        if(rng()<SOUVENT) npcGiveW(n,"cac");
        if(rng()<SOUVENT) npcGiveKind(n,"viv","scout");
        if(rng()<RAREMENT) npcGiveKind(n,"med");
    } else if(role==="fermier"||role==="pecheur"){
        if(rng()<SOUVENT) npcGiveW(n,"chasse");
        if(rng()<PARFOIS) npcGiveW(n,"cac");
        if(rng()<PARFOIS) npcGiveKind(n,"viv",(role==="pecheur")?"pecheur":"paysan");
    } else {
        /* le civil sans metier */
        if(rng()<SOUVENT) npcGiveKind(n,"viv");
        if(rng()<PARFOIS) npcGiveKind(n,"med");
        if(rng()<PARFOIS) npcGiveKind(n,"obj");
        /* l'arme depareillee : elle force a chercher son calibre ailleurs */
        if(rng()<RAREMENT) npcGiveW(n,"stand");
        else if(rng()<RAREMENT) npcGiveAmmo(n,pickFrom(["a22","a12"]));
    }
    /* porte-t-il de quoi se battre ? civFight le lira pour decider s'il fait
       face au lieu de fuir. Fige a la dotation, comme tout le reste. */
    n.armed=npcHasArm(n);
    return n;
}
function npcVitals(n,job){
    /* le metier decide des competences : un fermier n'a pas la main du
       moniteur de tir, et le moniteur n'a pas le dos du fermier.
       L'histoire se retire a chaque partie, sans condition : la garder d'une
       partie sur l'autre economisait un tirage et decalait tout le flux SIM -
       le rejeu divergeait des la premiere fouille. */
    if(job){ n.job=job; n.bio=(rng()*10)|0; n.foi=ri(0,10); }
    var js=job?jobRoll(job):{stats:baseStats(),sec:baseSec()};
    n.stats=js.stats; n.sec=js.sec;
    n.sec0=js.sec0||null; n.spec=js.spec||null;
    if(!n.sec0) statBirth(n,0);
    /* la vie decoule de la Sante, comme le souffle du Souffle */
    n.maxhp=hpMax(n); n.hp=n.maxhp;
    /* la reserve se deduit du Souffle, et repart pleine : sans cette remise a
       zero, un PNJ essouffle une partie repartait essouffle a la suivante */
    n.sta=staMax(n);
    /* ce qu'il a vu et son delai de tir sont du meme ordre : sans remise a
       zero, un temoin d'une partie precedente nous tiendrait encore pour un
       assassin au debut de la suivante */
    n.knows=0; n.fcd=0;
    return n;
}
/* Le plus proche de tous les vivants : habitants, soldats de village,
   garnison, fermiers, pecheurs, scouts et gens de metier. Chacun porte un
   nom, un metier et la vignette qui le represente. */
function nearestVillager(mr){
    var best=null, bd=mr*mr, i, j, v, n, d;
    function look(n2,v2,role,spr){
        if(!n2||n2.dead||n2.hidden||n2.inb) return;
        var d2=dist2(n2.x,n2.y,G.p.x,G.p.y);
        if(d2<bd){ bd=d2; best={n:n2,v:v2||null,role:role,spr:spr}; }
    }
    for(i=0;i<VILLAGES.length;i++){ v=VILLAGES[i];
        if(dist2(v.x,v.y,G.p.x,G.p.y)>(v.r+400)*(v.r+400)) continue;
        for(j=0;j<v.villagers.length;j++){ n=v.villagers[j];
            look(n,v,"habitant",VILSPR[n.s||0]); }
        if(v.soldier) look(v.soldier,v,"soldat",armySpr);
    }
    for(i=0;i<ARMYBASES.length;i++){
        var ab=ARMYBASES[i];
        if(dist2(ab.x,ab.y,G.p.x,G.p.y)>900*900) continue;
        for(j=0;j<ab.troops.length;j++)
            look(ab.troops[j],null,"militaire",armySpr);
    }
    for(i=0;i<FARMS.length;i++){
        var fa=FARMS[i];
        if(dist2(fa.x,fa.y,G.p.x,G.p.y)>900*900) continue;
        for(j=0;j<fa.farmers.length;j++)
            look(fa.farmers[j],null,"fermier",farmerSpr);
    }
    for(i=0;i<FISHERS.length;i++)
        look(FISHERS[i],null,"pecheur",fisherSpr);
    for(i=0;i<GUIDES.length;i++)
        look(GUIDES[i],null,"guide",heroA);
    for(i=0;i<CAMPS.length;i++){
        var cpp=CAMPS[i];
        if(dist2(cpp.x,cpp.y,G.p.x,G.p.y)>900*900) continue;
        for(j=0;j<cpp.scouts.length;j++)
            look(cpp.scouts[j],null,"scout",scoutSpr);
    }
    for(i=0;i<WORKERS.length;i++){
        var wk=WORKERS[i];
        if(dist2(wk.hx,wk.hy,G.p.x,G.p.y)>900*900) continue;
        look(wk,null,wk.job,workerSpr(wk));
    }
    return best;
}
function doorAt(mr){
    var best=null, bd=mr*mr, i, b, dx, dy, d;
    for(i=0;i<BLDRECTS.length;i++){ b=BLDRECTS[i];
        dx=b.x+b.w/2; dy=b.y+b.h+6;
        d=dist2(dx,dy,G.p.x,G.p.y);
        if(d<bd){ bd=d; best=b; } }
    return best;
}
function shopList(v){
    var seen={}, out=[], i, k;
    for(i=0;i<v.houses.length;i++){
        k=v.houses[i].k;
        if(k==="maison"||k.indexOf("immeuble")===0||seen[k]) continue;
        seen[k]=1;
        out.push(({pompiers:"la caserne de pompiers",hopital:"l'hopital",
            mairie:"la mairie",medecin:"le cabinet medical",police:"le commissariat",
            armurerie:"l'armurerie",soins:"le centre de soins",resto:"le restaurant",
            bar:"le bar",ecole:"l'ecole",superette:"la superette",
            droguerie:"la droguerie",depot:"le depot"})[k]||k);
    }
    return out;
}
/* ---- LE FIL DE LA CONVERSATION ----
   Les repliques ne vont plus au journal du coin, ou elles se melaient aux
   nouvelles du monde. Elles alimentent leur propre fil, celui de la fenetre
   centrale, et repartent de zero a chaque rencontre. Le journal ne garde que
   la trace du fait qu'on a parle a quelqu'un. */
var DTALK=[];
function dsay(txt,cls){
    DTALK.push({s:txt,c:cls||"dsay"});
    if(DTALK.length>40) DTALK.shift();
    dpanFill();
}
function dpanFill(){
    var lg=document.getElementById("dlog"), q, h="";
    if(!lg) return;
    for(q=0;q<DTALK.length;q++)
        h+="<div class='dline "+DTALK[q].c+"'>"+DTALK[q].s+"</div>";
    lg.innerHTML=h;
    lg.scrollTop=lg.scrollHeight;
}
/* Les trois questions, cliquables autant que numerotees. */
var DOPTS=["Des nouvelles du bourg ?",
           "A propos de vous ?",
           "Vous avez entendu parler de la rumeur ?",
           "Voulez-vous rejoindre mon equipe ?",
           "Et vos affaires, on peut voir ?"];
function dpanOpts(){
    var op=document.getElementById("dopts"), q, b, h="";
    if(!op) return;
    /* Deux niveaux : la rumeur ouvre ses propres questions, et l'on y reste
       tant qu'on ne revient pas au fil principal. */
    var L=(G&&G.talk&&G.talk.sub===2)?GDOPTS:
          ((G&&G.talk&&G.talk.sub)?RDOPTS:DOPTS);
    for(q=0;q<L.length;q++)
        h+="<button class='dopt' data-k='"+(q+1)+"'><b>["+(q+1)+"]</b>"+L[q]+"</button>";
    /* au niveau principal seulement, on peut demander la route de l'objectif
       du jour : le bouton [6] n'apparait que s'il reste un but a atteindre. */
    if(!(G&&G.talk&&G.talk.sub)){
        var qa=questAsk();
        if(qa) h+="<button class='dopt' data-k='6'><b>[6]</b>"+qa.qtxt+"</button>";
    }
    op.innerHTML=h;
    var bs=op.querySelectorAll(".dopt");
    for(q=0;q<bs.length;q++)
        (function(bt){ bt.onclick=function(){
            sClick(); pushAct("choice",parseInt(bt.getAttribute("data-k"),10));
        }; })(bs[q]);
}
/* ---- L'ECHANGE, DANS LA FENETRE DE DIALOGUE ----
   Un onglet remplace le fil de la conversation par les deux sacs cote a cote,
   les silhouettes restant en vue de part et d'autre. C'est la meme table que
   partout ailleurs : un inconnu marchande et l'on empile de part et d'autre
   avant de conclure, un des notres ne marchande pas et la case passe au clic.
   C'EST LA SEULE SURFACE depuis le lot E : elle porte aussi ce que l'autre a
   sur lui, ce qu'on allait chercher dans un second panneau. */
var DTAB=0;
function dTabSet(k){
    DTAB=k?1:0;
    var t0=document.getElementById("dtb0"), t1=document.getElementById("dtb1");
    var lg=document.getElementById("dlog"), op=document.getElementById("dopts");
    var tr=document.getElementById("dtrade");
    if(t0) t0.className="dtab"+(DTAB?"":" on");
    if(t1) t1.className="dtab"+(DTAB?" on":"");
    if(lg) lg.style.display=DTAB?"none":"block";
    if(op) op.style.display=DTAB?"none":"flex";
    if(tr) tr.style.display=DTAB?"block":"none";
    if(DTAB) dTradeFill();
}
/* Le nombre de cases que porte quelqu'un : son sac, ou ses poches. */
/* Elle lisait n.bag comme un indice de BAGS ; c'est un identifiant d'objet.
   ownBag fait la resolution une fois pour tout le monde. */
function humBagName(n){
    var b=ownBag(n);
    return b?b.n:(n?"Poches":"");
}
/* Combien de cases occupees dans un inventaire quelconque. */
function invUsedOf(iv){
    var q, u=0;
    if(!iv) return 0;
    for(q=0;q<iv.length;q++) if(iv[q]) u++;
    return u;
}
/* ---- L'ONGLET D'ECHANGE DU DIALOGUE ----
   Il montre la meme table que partout ailleurs, en plus etroit : notre cote
   a gauche, le sien a droite. Il ne decide de rien - le geste, la regle et
   le verdict appartiennent au socle commun. */
function dTradeFill(){
    var tr=document.getElementById("dtrade");
    if(!tr||!G||!G.talk) return;
    var n=G.talk.n, src, ib;
    invFit();
    ownFit(n);
    if(!n.inv) n.inv=[];
    src=xchgSrc(n)||[]; ib=n.inv;
    xselClean(XSL,src); xselClean(XSR,ib);
    var fr=xchgFree(n);
    var va=xselVal(XSL,src), vb=xselVal(XSR,ib);
    function hd(titre,sac,iv,tot){
        return "<div class='dthd'>"+titre+" <span>- "+sac+", "+
               invUsedOf(iv)+"/"+iv.length+
               (fr?"":(" - offre <b>"+tot+"</b>"))+"</span></div>";
    }
    tr.innerHTML="<div class='dtcols'>"+
        "<div class='dtcol'>"+hd(xchgSrcName(n),
            xchgSrcIsBase(n)?"la base":humBagName(G.p),src,va)+
        "<div class='gridbag dtbag' id='dtbagL'></div></div>"+
        "<div class='dtcol'>"+hd((n.name||"Lui"),humBagName(n),ib,vb)+
        "<div class='gridbag dtbag' id='dtbagR'></div></div>"+
        "</div>"+
        /* CE QU'IL PORTE SUR LUI : c'est ce qu'on venait voir en ouvrant une
           seconde fenetre, il est donc ici. En lecture seule - un inconnu ne
           se laisse pas deshabiller, et l'on equipe les siens depuis
           l'onglet GROUPE, ou l'on est chez soi. */
        dWornRow(n)+
        (fr?"":("<div class='dtdeal'><button id='dtgo'"+
                (xchgCan(n,src)?"":" disabled")+">CONCLURE "+va+" / "+vb+
                "</button></div>"))+
        "<div class='dtnote' id='dtnote'></div>";
    cellGrid("dtbagL",src,XSL,!fr,function(k,al){ pushAct("troc",(al?8192:0)|4096|(k&4095)); });
    cellGrid("dtbagR",ib,XSR,!fr,function(k,al){ pushAct("troc",(al?8192:0)|(k&4095)); });
    var nt=document.getElementById("dtnote");
    if(nt) nt.textContent=xchgNote(n);
    var gb=document.getElementById("dtgo");
    if(gb) gb.onclick=function(){ sClick(); pushAct("trocgo",0); };
    dWornPaint(n);
}
/* La ligne de ce qu'il a sur lui : ses quatre armes puis ses quatre pieces
   de tenue, vignettes seules. */
function dWornRow(n){
    var h="<div class='dtworn'><span class='dtwl'>Sur lui</span>", i, w, d;
    for(i=0;i<4;i++){
        w=(n.slots&&n.slots[i])||null;
        h+="<div class='slot dtw"+(w?" ifull":"")+"' data-dw='w"+i+"' title=\""+
           (w?(w.n+" - "+w.fam):(SLOTN[i]+" - vide")).replace(/"/g,"'")+"\">"+
           (w?"<canvas class='iic' width='96' height='96'></canvas>":"")+"</div>";
    }
    for(i=0;i<4;i++){
        d=vetAt(n,i);
        h+="<div class='slot dtw"+(d?" ifull":"")+"' data-dw='v"+i+"' title=\""+
           (d?(d.n+" - "+vetLine(d)):(VETSLOT[i]+" - vide")).replace(/"/g,"'")+"\">"+
           (d?"<canvas class='iic' width='96' height='96'></canvas>":"")+"</div>";
    }
    return h+"</div>";
}
function dWornPaint(n){
    var i, el, w, d, cv, g;
    for(i=0;i<4;i++){
        el=document.querySelector("[data-dw='w"+i+"']");
        w=(n.slots&&n.slots[i])||null;
        if(el&&w){ cv=el.querySelector("canvas");
            if(cv&&cv.getContext){ g=cv.getContext("2d");
                g.clearRect(0,0,96,96); iconDraw(g,w,0,27,0.5,IWHITE); } }
        el=document.querySelector("[data-dw='v"+i+"']");
        d=vetAt(n,i);
        if(el&&d){ cv=el.querySelector("canvas");
            if(cv&&cv.getContext){ g=cv.getContext("2d");
                g.clearRect(0,0,96,96); itIconDraw(g,d.ic,0,0,4,IWHITE); } }
    }
}
function dpanShow(on){
    var el=document.getElementById("dpan");
    if(el) el.style.display=on?"flex":"none";
    if(on){
        var t0=document.getElementById("dtb0"), t1=document.getElementById("dtb1");
        if(t0) t0.onclick=function(){ sClick(); dTabSet(0); };
        if(t1) t1.onclick=function(){ sClick(); dTabSet(1); };
        dTabSet(0);
    }
}
function talkStart(t){
    G.talk={n:t.n,v:t.v,name:t.n.name,sub:0,
            role:jobName(t.n.job||t.role||"habitant"),spr:t.spr||null};
    t.n.stop=999;
    DTALK=[]; xchgReset();
    var wh=document.getElementById("dwho"), rl=document.getElementById("drole");
    if(wh) wh.textContent=G.talk.name||"";
    if(rl) rl.textContent=G.talk.role||"";
    dpanShow(true);
    /* le salut suit l'etat du pays : on ne dit pas bonjour de la meme facon
       quand le bourg d'a cote a cesse de repondre */
    var HL=[HELLO,HELLO1,HELLO2][plagueTier()];
    dsay(HL[(rng()*HL.length)|0],"dsay");
    /* un compagnon n'a pas besoin qu'on lui demande des nouvelles du bourg */
    if(t.n&&t.n.recruited){
        G.talk.sub=2;
        G.talk.role=grpRank(t.n);
    }
    logMsg("Vous abordez "+(G.talk.name||"quelqu'un")+".","jday");
    drawPortraits();
    talkMenu();
}
function talkMenu(){
    dpanOpts();
}
function talkChoice(k){
    if(!G.talk) return;
    var v=G.talk.v, sh, i, n=G.talk.n;
    /* ---- LE NIVEAU DU GROUPE ----
       Il ne s'ouvre que pour ceux qui nous suivent, et remplace la liste
       ordinaire : on ne demande pas a un compagnon s'il veut nous rejoindre. */
    if(G.talk.sub===2){
        dsay(GDOPTS[k-1]||"","dme");
        if(k===1){
            dsay(GEPI[(rng()*GEPI.length)|0],"dsay");
            grpBump(n,2);
        } else if(k===2){
            /* Se raconter rapproche, mais une fois par jour seulement : sans
               ce delai il suffirait de reposer la question vingt fois de
               suite pour gagner un rang, et l'amitie ne vaudrait rien. */
            var jr=dayNum();
            if(n.gday===jr){
                dsay("Je vous ai deja tout dit aujourd'hui. Une autre fois.","dsay");
                talkMenu();
                return;
            }
            n.gday=jr;
            dsay(GMOI[(rng()*GMOI.length)|0],"dsay");
            grpBump(n,60);
            var rg=grpRank(n);
            if(rg!==(n.rg||"recrue")){
                n.rg=rg;
                dsay("("+(n.name||"Il")+" est desormais votre "+rg+".)","dnote");
                logMsg((n.name||"Un compagnon")+" est desormais votre "+rg+".","jsay");
            }
        } else if(k===3){
            var nm=n.name;
            talkEnd(true);
            grpTakeOver(n);
            return;
        } else {
            G.talk.sub=0;
            dsay("Comme vous voudrez.","dsay");
        }
        talkMenu();
        return;
    }
    /* ---- LE SECOND NIVEAU : LA RUMEUR ---- */
    if(G.talk.sub){
        dsay(RDOPTS[k-1]||"","dme");
        var f=foiOf(n), t=plagueTier();
        if(k===1){
            var bt=bigTown();
            dsay("A la mairie, dans la plus grande ville. C'est la que sont "+
                 "les registres, et les gens qui signent.","dsay");
            if(bt) dsay("Elle est "+dirWord(G.p.x,G.p.y,bt.x,bt.y)+
                        (bt.name?(" : "+bt.name+"."):"."),"dsay");
            else dsay("Encore faudrait-il qu'il en reste une.","dsay");
        } else if(k===2){
            if(f>=8) dsay("Alors vous n'etes pas fou. Ca fait du bien de "+
                          "l'entendre dire tout haut.","dsay");
            else if(f>=5) dsay("Peut-etre. Moi je ne sais plus quoi penser, "+
                               "et ca m'empeche de dormir.","dsay");
            else if(f>=3) dsay("Vous avez le droit. Moi je prefere croire "+
                               "qu'il y a une explication ennuyeuse.","dsay");
            else dsay("Vous en etes la, vous aussi. Bon. Ne le repetez pas "+
                      "trop fort, on vous regarderait de travers.","dsay");
        } else if(k===3){
            var lb=labRect();
            if(!lb) dsay("Aucune idee. Je ne suis jamais alle voir.","dsay");
            else if(f<3)
                dsay("Le batiment gris ? Il est "+
                     dirWord(G.p.x,G.p.y,lb.x+lb.w/2,lb.y+lb.h/2)+
                     ". Vous perdrez votre temps, mais allez-y.","dsay");
            else if(f<8)
                dsay("Il est "+dirWord(G.p.x,G.p.y,lb.x+lb.w/2,lb.y+lb.h/2)+
                     ". Ne vous approchez pas trop du grillage.","dsay");
            else
                dsay("Il est "+dirWord(G.p.x,G.p.y,lb.x+lb.w/2,lb.y+lb.h/2)+
                     ". Et si vous y allez vraiment, dites-moi ce que vous y "+
                     "trouvez. Quelqu'un doit finir par le dire.","dsay");
        } else {
            G.talk.sub=0;
            dsay("Comme vous voudrez.","dsay");
        }
        talkMenu();
        return;
    }
    /* on entend d'abord la question qu'on vient de poser */
    if(k<=DOPTS.length) dsay(DOPTS[k-1]||"","dme");
    if(k===1){
        if(v){
            sh=shopList(v);
            dsay("Ici c'est "+v.name+". Nous sommes "+v.villagers.length+" a y vivre.","dsay");
            if(sh.length) dsay("Vous trouverez "+sh.join(", ")+".","dsay");
            else dsay("Il n'y a pas grand-chose a voir, juste des maisons.","dsay");
        } else {
            dsay(({
                militaire:"La caserne tient bon. Rondes de jour comme de nuit, et rien a signaler.",
                fermier:"Les champs donnent encore. Tant qu'il pleut, on tiendra.",
                pecheur:"Ca mord mollement aujourd'hui. La riviere est basse.",
                soldat:"Consigne : on surveille, on ne suit personne.",
                pompier:"On sort moins qu'avant. Ce n'est plus le feu, le probleme.",
                policier:"Circulez. Et si vous voyez quelqu'un de mordu, ne l'approchez pas.",
                soignant:"On soigne ce qu'on peut. Les morsures, on ne sait pas."
            })[G.talk.role]||"Rien a raconter aujourd'hui.","dsay");
        }
    } else if(k===2){
        /* ---- A PROPOS DE VOUS ----
           Chacun garde son histoire pour toute la partie : elle est tiree a
           sa naissance et non a la question. On peut revenir le voir, il
           racontera la meme chose - c'est ce qui fait la difference entre un
           personnage et un generateur de phrases. */
        var jb=(G.talk.n&&G.talk.n.job)||G.talk.role||"habitant";
        var J=jobDef(jb), bi=(G.talk.n&&G.talk.n.bio)||0;
        dsay(J.d[bi%J.d.length],"dsay");
    } else if(k===3){
        /* la rumeur, et le second niveau qui s'ouvre derriere. C'EST ICI
           QUE TOUT COMMENCE : la premiere fois qu'on pose la question, la
           porte du laboratoire s'ouvre. */
        dsay(rumeurLine(n),"dsay");
        proStart();
        G.talk.sub=1;
    } else if(k===4){
        /* ---- LA PERSONNE QU'ON EST VENU CHERCHER ----
           Le proche ou l'ami de la course du jour ne se fait pas prier : il
           accepte de nous suivre, quel que soit l'etat du pays. */
        if(n&&n.qtgt){
            if(!n.recruited){ n.recruited=1; n.out=BASE?(baseHere()?0:1):1;
                dsay("Toi ? Evidemment que je te suis. Ou tu vas, je vais.","dsay");
                logMsg((G.talk.name||"Un proche")+" vous rejoint sans hesiter.","jsay");
                notice("RECRUE"); }
            else dsay("Je te suis deja. Ne me demande pas deux fois.","dsay");
            n.qtgt=0;
            talkMenu(); return;
        }
        /* ---- LE RECRUTEMENT ORDINAIRE ----
           Tant que le pays tient, chacun a une vie a defendre et decline. La
           peur venue, un sur trois cede, puis deux sur trois. Au-dela de la
           moitie du pays perdu, plus personne ne refuse : il n'y a plus rien
           a garder. Le drapeau se pose ; ce qu'un compagnon fait ensuite
           reste a ecrire, mais il monte deja en competences comme vous. */
        var tr=plagueTier(), ch=(tr===0)?0:((tr===1)?0.38:1);
        if(!proOpen()){
            /* Le pays va bien : il n'y a aucune raison de suivre un
               inconnu. Le refus le dit sans mystere - ce n'est pas une
               porte fermee, c'est une proposition qui n'a pas de sens
               encore. */
            dsay("Vous suivre ? Et pour aller ou ? J'ai ma journee, moi.","dsay");
        } else if(!grpJoinable(n)){
            /* Il a un poste, pas une vie a emporter. Tant que le registre ne
               sait pas le tenir, il decline sans ambiguite. */
            dsay("Ma place est ici, elle ne se quitte pas. Cherchez ailleurs.","dsay");
        } else if(n&&n.recruited){
            dsay("Je vous suis deja. Dites-moi ou l'on va.","dsay");
        } else if(rng()<ch){
            if(n){ n.recruited=1; n.out=BASE?(baseHere()?0:1):1; }
            dsay(ACCEPT[(rng()*ACCEPT.length)|0],"dsay");
            logMsg((G.talk.name||"Un habitant")+" vous suit desormais.","jsay");
            notice("RECRUE");
        } else {
            dsay(REFUS[(rng()*REFUS.length)|0],"dsay");
            if(tr===1) dsay("...Enfin. Repassez me voir, on ne sait jamais.","dsay");
        }
    } else if(k===6){
        /* ---- LA ROUTE DE L'OBJECTIF DU JOUR ----
           On demande son chemin. L'interlocuteur pointe un cap - jamais une
           coordonnee - vers l'etape en cours. S'il EST la personne recherchee,
           il le dit. */
        var qa=questAsk();
        if(!qa){ dsay("Vous n'avez rien de precis a chercher aujourd'hui.","dsay"); talkMenu(); return; }
        dsay(qa.qtxt,"dme");
        if(qa.who&&qa.who===n){
            dsay("Eh bien... c'est moi. Vous m'avez trouve.","dsay");
        } else {
            var cap=dirWord(G.p.x,G.p.y,qa.x,qa.y);
            var desc="";
            if(qa.who){
                var col=topColorName(qa.who);
                if(col) desc=" "+(qa.who.fem?"Elle":"Il")+" porte un haut "+col+".";
            }
            if(cap==="tout pres d'ici"){
                if(qa.who) dsay(qa.place+" ? Tout pres, a deux pas d'ici."+desc,"dsay");
                else if(qa.place) dsay(capPhrase(qa.place)+" ? Tout pres, a deux pas d'ici.","dsay");
                else dsay("C'est tout pres d'ici. Ouvrez l'oeil.","dsay");
            } else if(qa.who){
                dsay(qa.place+" ? Je l'"+(qa.who.fem?"ai vue":"ai vu")+" passer "+cap+"."+desc,"dsay");
            } else if(qa.place){
                dsay(capPhrase(qa.place)+" ? C'est "+cap+".","dsay");
            } else {
                dsay("Il faut aller "+cap+".","dsay");
            }
        }
    } else {
        /* ---- UNE SEULE PORTE ----
           Trois chemins menaient au sac de l'autre : cette option ouvrait le
           panneau d'equipement, un bouton y ouvrait la fenetre ECHANGE, et
           l'onglet du dialogue montrait deja la meme table. Trois surfaces
           pour un seul geste, et deux noms pour une seule chose - echange
           entre les siens, troc avec les autres. Il n'en reste qu'une :
           l'onglet, ou l'on voit desormais AUSSI ce qu'il porte sur lui. */
        dsay("Voila tout ce que je porte.","dsay");
        dTabSet(1);
    }
    talkMenu();
}
function talkEnd(quiet){
    if(!G.talk) return;
    xchgReset();
    G.talk.n.stop=0;
    if(!quiet) logMsg("Vous vous eloignez.","jday");
    G.talk=null; G.showInv=false;
    dpanShow(false); DTALK=[];
    if(G.invNpc){ G.invNpc=null; G.showBag=false; ipanEl.style.display="none"; }
    if(G.trade) tradeClose();
    drawPortraits();
}
/* ---- L'ARME REGAGNE SA CASE ----
   Comme un vetement rejoint sa coquille, une arme qui traine dans le sac
   remonte dans l'emplacement de sa categorie des que celui-ci est libre. Meme
   geste que l'equipement a la main (setSlot) : le chargeur revient donc vide,
   comme partout ailleurs - pas de stock infini par simple aller-retour. On le
   fait chaque tour ; le glisser-deposer etant journalise, le rejeu suit. */
function autoSlotWeapons(){
    var p=G&&G.p, i, c, o, sl, moved=false;
    if(!p||!p.slots||!p.inv) return;
    for(i=0;i<p.inv.length;i++){
        c=p.inv[i];
        if(!c||c.w===undefined) continue;
        o=WEAPONS[c.w]; if(!o) continue;
        sl=wSlot(o);
        if(sl<0||sl>3||p.slots[sl]) continue;   /* pas de case libre pour elle */
        p.inv[i]=null;
        setSlot(sl,c.w);
        moved=true;
    }
    if(moved) invFit();
}
function updInteract(dt){
    var p=G.p;
    /* l'habitant le plus proche s'arrete pour nous laisser venir */
    if(!G.talk){
        var t=nearestVillager(120);
        if(G.stopped&&G.stopped!==(t&&t.n)) G.stopped.stop=0;
        G.stopped=t?t.n:null;
        if(t) t.n.stop=0.4;
    }
    if(G.talk){
        if(dist2(G.talk.n.x,G.talk.n.y,p.x,p.y)>96*96) talkEnd();
    }
    /* crochetage en cours */
    if(G.pick){
        G.pick.t+=dt;
        if(G.pick.t>=G.pick.dur){
            var b=G.pick.b; G.pick=null;
            /* une serrure forcee vaut son niveau en usages */
            secBump(G.p,"crochetage",Math.max(1,b.pick|0));
            b.lock=false;
            logMsg("La serrure cede.","jday");
            enterBld(b);
        }
    }
    if(G.place&&G.place.t>0) G.place.t-=dt;
    updGnd(dt);
    autoSlotWeapons();
    grpTime(dt);
    baseDefend(dt);
    grpFight(dt);
    updMiss(dt);
    updSearch(dt);
    buildActs();
}
/* ---- CHEZ LES GENS, ON N'ENTRE PAS ----
   Toutes les portes s'ouvraient des la premiere seconde, et l'on commencait
   une partie en vidant les maisons du bourg pendant que ses habitants
   vaquaient dehors. Ce n'est pas un jeu de cambriolage : tant que le pays
   tient, un logement est le logement de quelqu'un.

   QUATRE FACONS D'ENTRER, ET PAS UNE DE PLUS :
   - ce n'est pas un logement. Les commerces, la mairie, le commissariat,
     l'hopital, la caserne : on y entre depuis toujours et cela ne change pas.
   - c'est chez soi. Une seule maison sur la carte, celle de l'habitant dont
     on a pris la place, et l'on demarre devant.
   - on est voleur. Le metier cache le plus evident : celui qui vivait deja de
     ca n'a pas besoin d'une epidemie pour se donner une raison.
   - l'ordre de quarantaine est tombe. A ce moment le personnage cesse d'avoir
     des scrupules, et c'est lui-meme qui le dit.

   Le refus n'est pas un mur : la porte reste dans la liste de [F], on la
   voit, et c'est le personnage qui explique pourquoi il n'y touche pas. */
/* ATTENTION, DEUX FAMILLES D'OBJETS PORTENT LE MOT BATIMENT. v.houses tient
   les descriptions d'un bourg - k vaut "maison", "resto", "mairie" - et
   BLDRECTS tient les rectangles ou l'on entre, qui portent lt et non k. C'est
   BLDRECTS que la porte de [F] designe, donc c'est lt qu'il faut lire.
   Un immeuble a enseigne - la Boulangerie Duvals - reste un logement : le
   commerce est une ADRESSE d'artisan, il passe ses journees devant. Les vrais
   commerces et les batiments publics sont des rectangles a part. */
function bldPrivate(b){
    var t=b&&b.lt;
    if(!t) return false;
    return t==="maison"||String(t).indexOf("immeuble")===0;
}
function bldMine(b){ return !!(b&&G&&G.p&&G.p.homeB&&b===G.p.homeB); }
/* ---- LE NOM AFFICHE D'UN BATIMENT ----
   Notre propre logement se nomme toujours "ma maison" ; les autres portent
   leur nom propre - enseigne, adresse, edifice public - et a defaut le
   lieu-dit ou ils se trouvent. Plus jamais "une maison". */
function bldLabel(b){
    if(!b) return "";
    if(bldMine(b)) return "ma maison";
    if(b.nm) return b.nm;
    return baseAddr(b)||"";
}
function bldCanEnter(b){
    if(!bldPrivate(b)) return true;
    if(bldMine(b)) return true;
    if(G&&G.p&&G.p.job==="voleur") return true;
    return proFear();
}
function bldRefuse(b){
    logMsg(bldMine(b)?"":"Je n'ai pas de raison de rentrer chez les gens.","jsay");
    notice("PAS DE RAISON");
}
function enterBld(b){
    G.inside=b;
    quarEnter(b);
    var enm=bldLabel(b);
    G.place={n:enm?("Vous entrez dans "+enm):"Vous entrez","t":3.2};
    logMsg("Vous entrez dans "+(enm||"le batiment")+". [S] pour ressortir.","jday");
    /* ---- LA FOUILLE NE PART PLUS TOUTE SEULE ----
       Elle se deroulait d'un bout a l'autre des qu'on passait la porte : on
       entrait, on attendait, on ressortait. Le joueur n'avait rien a faire
       qu'a regarder une barre avancer. Chaque emplacement se declenche
       maintenant a [F], avec son propre compte a rebours : on decide combien
       de temps on reste, emplacement par emplacement, et l'on peut partir
       apres le premier si le bruit devient inquietant.
       On decoupe le lieu des l'entree, pour pouvoir annoncer combien
       d'emplacements il y a. La fenetre s'ouvre seule si l'on y avait deja
       laisse quelque chose. */
    srchInit(b);
    /* ---- CHEZ SOI, ON GERE ----
       On n'y fouille pas et l'on n'y marche pas : le panneau de la base
       s'ouvre de lui-meme et devient le jeu. Le personnage reste debout
       derriere la fenetre et tire sur ce qui approche, comme les autres. */
    if(BASE&&BASE.b===b){
        /* rentrer dissout l'equipe : on ne commande plus personne */
        eqClear();
        G.showBag=true;
        if(ipanEl) ipanEl.style.display="block";
        bagTab(3);
        logMsg("Vous rentrez chez vous. Le groupe tient les murs.","jsay");
        return;
    }
    if(b.inv&&b.inv.some(function(c){ return !!c; })) lootOpenBld(b);
    logMsg((b.done>=b.rooms)?"Tout a deja ete retourne ici."
        :("[F] pour fouiller : "+b.done+" emplacement sur "+b.rooms+
          " de fait."),"jday");
}
/* ---- LISTE DES ACTIONS ----
   Plusieurs choses peuvent s'offrir sous [F] en meme temps : un passant, une
   porte, un plant. On les range par distance et l'on choisit a la molette, au
   clic sur la ligne voulue, ou avec Tab. AUCUN DE CES TROIS MOYENS NE TOUCHE
   AUX JAMBES - c'etait le defaut de Q et D, qui cessaient de deplacer des que
   deux choses s'offraient ensemble. */
/* ---- LES CADAVRES ----
   Un corps garde ce qu'il portait de son vivant : c'est le meme inventaire,
   seule change la fenetre qui le montre. Il reste sur place, et ce qu'on ne
   prend pas y reste aussi - on le retrouve en revenant.
   Un corps vide ne se propose plus : la liste de [F] ne doit pas se remplir
   de depouilles deja retournees. */
/* ---- CE QU'UN MORT LAISSE ----
   La tenue est sur lui, pas dans son sac : sans ce versement elle
   disparaitrait avec le corps, et les vetements d'uniforme seraient
   introuvables. On la verse dans le sac au moment ou l'on se penche sur lui,
   une seule fois, et l'on agrandit le sac s'il est plein - un mort n'a plus
   besoin de compter ses cases. */
function bodyStrip(o){
    var i, d;
    if(!o||!o.vet||o.stripped) return;
    o.stripped=1;
    if(!o.inv) o.inv=[];
    for(i=0;i<4;i++){
        d=vetAt(o,i);
        if(!d) continue;
        o.vet[i]=-1;
        if(!o.inv.gw) o.inv.gw=ownGW(o);
        gridAddGrow(o.inv,{i:d.id,q:1});
    }
}
/* LE SAC DU MORT. Il naissait avec, il mourait avec : n.bag est un indice
   pose sur la personne et non une case de son inv, et fouiller un corps ne
   lit que l'inv. On tuait donc un militaire pour repartir avec ses vivres en
   laissant vingt cases sur le dos.
   Meme facon de faire que bodyStrip, jusqu'au drapeau : le sac quitte le dos
   et prend une case, une seule fois, au premier regard porte sur le corps.
   ET IL PREND UNE CASE DE PLUS S'IL LE FAUT. Un sac plein ne doit pas
   empecher de rendre le sac lui-meme - le mort n'a plus de capacite a
   respecter, et perdre le contenant parce que le contenu tient dedans serait
   le comble. */
function bodyBag(o){
    var it, i;
    if(!o||o.bagged) return;
    o.bagged=1;
    it=ownBag(o);
    if(!it) return;
    o.bag=-1;
    if(!o.inv) o.inv=[];
    if(!o.inv.gw) o.inv.gw=POCKETS;
    gridAddGrow(o.inv,{i:it.id,q:1});
}
function bodyHas(o){
    var i;
    if(!o||!o.dead||o.gone) return false;
    bodyStrip(o);
    bodyBag(o);
    if(!o.inv) return false;
    for(i=0;i<o.inv.length;i++) if(o.inv[i]) return true;
    return false;
}
function nearestCorpse(mr){
    var best=null, bd=mr*mr, i, j, v, d;
    function look(o){
        if(!bodyHas(o)) return;
        d=dist2(o.x,o.y,G.p.x,G.p.y);
        if(d<bd){ bd=d; best=o; }
    }
    for(i=0;i<VILLAGES.length;i++){ v=VILLAGES[i];
        for(j=0;j<v.villagers.length;j++) look(v.villagers[j]);
        if(v.soldier) look(v.soldier); }
    for(i=0;i<ARMYBASES.length;i++)
        for(j=0;j<ARMYBASES[i].troops.length;j++) look(ARMYBASES[i].troops[j]);
    for(i=0;i<FARMS.length;i++)
        for(j=0;j<FARMS[i].farmers.length;j++) look(FARMS[i].farmers[j]);
    for(i=0;i<FISHERS.length;i++) look(FISHERS[i]);
    for(i=0;i<GUIDES.length;i++) look(GUIDES[i]);
    for(i=0;i<CAMPS.length;i++)
        for(j=0;j<CAMPS[i].scouts.length;j++) look(CAMPS[i].scouts[j]);
    for(i=0;i<WORKERS.length;i++) look(WORKERS[i]);
    for(i=0;i<ZOMBIES.length;i++) look(ZOMBIES[i]);
    return best;
}
/* ================= TEMOINS ET REPUTATION =================
   Tuer un vivant n'etait jusqu'ici qu'un fait sans consequence : personne ne
   regardait. Desormais chaque mort de la main du joueur a des temoins, et ce
   qu'ils en font depend de qui ils sont.
   Un habitant qui voit tuer prend peur et se souvient : il fuit le joueur
   comme il fuirait un zombi. Un porteur d'uniforme, lui, previent les siens,
   et c'est toute la carte qui apprend le nom du coupable.
   La reputation ne s'efface pas : elle tiendra jusqu'au changement de carte,
   quand celui-ci existera. On repart donc d'un monde neuf, pas d'un pardon.
   Ces regles ne valent que pour les vivants : abattre un zombi devant temoin
   n'a jamais choque personne. */
var WITNESS_R=260;
/* les metiers qui portent un uniforme et previennent les autres */
function isUniform(o){
    if(!o) return false;
    if(o.job==="policier") return true;
    if(o.kit!==undefined) return true;   /* soldat de bourg et garnison */
    return false;
}
/* Un vivant voit-il ce point ? Pas de cone : il regarde autour de lui, mais
   un mur suffit a l'aveugler, comme pour le zombi. */
function humSees(n,x,y){
    if(!n||n.dead||n.inb||n.hidden) return false;
    if(dist2(n.x,n.y,x,y)>WITNESS_R*WITNESS_R) return false;
    return los(n.x,n.y,x,y);
}
/* Le joueur devient l'ennemi de tous : les uniformes se passent le mot. */
function outlawAll(why){
    if(G.outlaw) return;
    G.outlaw=1;
    logMsg(why||"On vous a vu. La nouvelle court d'un poste a l'autre.","jsay");
    notice("RECHERCHE");
    /* tout le monde le sait, donc tout le monde s'ecarte */
    var i, n;
    for(i=0;i<HUM.length;i++){
        n=HUM[i];
        if(n.dead) continue;
        n.knows=1;
    }
}
/* Un mort de la main du joueur : on regarde qui etait la. */
function witnessKill(o){
    var i, n, vu=0, flic=0;
    for(i=0;i<HUM.length;i++){
        n=HUM[i];
        if(n===o||n.dead) continue;
        if(!humSees(n,o.x,o.y)) continue;
        vu++;
        n.knows=1;
        /* il fuit ce qu'il vient de voir, exactement comme devant un zombi */
        n.fear=Math.max(n.fear||0,5);
        n.fdx=n.x-G.p.x; n.fdy=n.y-G.p.y;
        if(isUniform(n)) flic=1;
    }
    if(flic) outlawAll("Un uniforme vous a vu tuer. Toute la region est prevenue.");
    else if(vu) logMsg(vu+" temoin"+(vu>1?"s ont":" a")+" vu la scene.","jsay");
}
/* Qui en veut au joueur : celui qui sait, ou tout le monde si l'on est
   recherche. */
function hostile(n){
    if(!n||n.dead) return false;
    return !!(G.outlaw||n.knows);
}
/* Poser une arme dans le sac du joueur : elle prend une case entiere. */
function invPushW(wi){
    var p=G.p;
    invFit();
    /* une arme est longue : elle demande son rectangle, pas une case */
    return gridAdd(p.inv,{w:wi,q:1});
}
/* ---- ON MET DIRECTEMENT SUR SOI CE QU'ON N'A PAS ENCORE ----
   Une armure dont l'emplacement est libre, un sac quand on n'en porte aucun :
   on l'enfile au lieu de le ranger dans les poches. Si l'emplacement est deja
   pris, on renvoie faux et l'appelant le range dans le sac comme d'habitude.
   Les armes suivent la meme regle mais passent par setSlot chez l'appelant,
   car elles ont quatre emplacements de categorie. */
function autoWearOne(o){
    var p=G&&G.p;
    if(!o||!p) return false;
    if(o.k==="vet"){
        if(!p.vet) p.vet=vetInit();
        if(o.sl>=0&&o.sl<4&&p.vet[o.sl]<0){
            vetSet(p,o.id);
            logMsg("Vous enfilez "+o.n.toLowerCase()+".","jday");
            return true;
        }
    } else if(o.k==="sac"){
        if(p.bag<0){
            var bi=bagIndexOf(o);
            if(bi>=0){ setBag(bi); logMsg("Vous enfilez "+o.n.toLowerCase()+".","jday"); return true; }
        }
    }
    return false;
}
/* Fouiller un corps : la fenetre s'ouvre, on choisit. */
function bodySearch(o){
    if(!bodyHas(o)) return;
    lootOpen(o,o.name||"Un corps","CORPS",bodySpr(o));
    logMsg("Vous fouillez "+(o.name?("le corps "+
        ("aeiouyAEIOUY".indexOf(o.name.charAt(0))>=0?"d'":"de ")+o.name)
        :"le corps")+".","jday");
}
/* La silhouette a montrer dans la fenetre : celle qu'il avait de son vivant. */
function bodySpr(o){
    /* un PNJ transforme garde la silhouette qu'il avait vivant, meme mort :
       on ne montre pas le skin du laboratoire pour quelqu'un qu'on connaissait */
    if(o.turned&&o.hspr) return o.hspr;
    if(o.traits) return zombSpr;
    if(o.job==="guide") return heroA;
    if(o.job) return workerSpr(o);
    if(o.kit!==undefined) return armySpr;
    if(o.s!==undefined) return VILSPR[o.s||0];
    if(o.rod!==undefined) return fisherSpr;
    return farmerSpr;
}
