"use strict";
/* ================================================================
   TUAZ - 10-monde-vivant.js
   Le journal de bord, l'interaction [F] et les trente-sept metiers.
   (lignes 11692 a 12363 du mono-fichier d'origine)
   ================================================================ */
/* ================= JOURNAL DE BORD ================= */
/* Une petite fenetre en bas a gauche recueille ce que le personnage remarque :
   le passage du jour a la nuit, les panneaux, les batiments qu'il longe. */
var jlogEl=document.getElementById("jlog"), jtimeEl=document.getElementById("jtime");
(function(){
    var a=document.getElementById("itb0"), b=document.getElementById("itb1");
    var g=document.getElementById("itb2");
    if(g) g.onclick=function(){ sClick(); bagTab(2); };
    var bs=document.getElementById("itb3");
    if(bs) bs.onclick=function(){ sClick(); bagTab(3); };
    var ms=document.getElementById("itb4");
    if(ms) ms.onclick=function(){ sClick(); bagTab(4); };
    var dg=document.getElementById("depgo");
    if(dg) dg.onclick=function(){ sClick(); pushAct("depgo",0); };
    var t=document.getElementById("itrade");
    var la=document.getElementById("lall"), lo=document.getElementById("lout");
    if(la) la.onclick=function(){ sClick(); lootAll(); };
    /* Le bouton fait exactement ce que fait [S] : il passe par le journal
       d'entrees, sans quoi un clic ne se rejouerait pas. */
    if(lo) lo.onclick=function(){ sClick(); pushAct("out",0); };
    var zr=document.getElementById("zrepop");
    if(zr) zr.onclick=function(){ sClick(); zPopulate(); zDbgNote(); };
    var zc=document.getElementById("zcopy");
    if(zc) zc.onclick=function(){
        sClick();
        var ta=document.getElementById("zout"), ok=document.getElementById("zok");
        if(ta){ ta.value=zDbgText(); ta.select(); }
        try{ if(navigator.clipboard) navigator.clipboard.writeText(zDbgText()); }catch(e){}
        try{ document.execCommand("copy"); }catch(e2){}
        if(ok){ ok.textContent="copie"; setTimeout(function(){ ok.textContent=""; },1600); }
    };
    var cp=document.getElementById("dbgcopy");
    if(cp) cp.onclick=function(){ sClick(); aimDbgCopy(); };
    var ab=document.getElementById("dbgarms");
    if(ab) ab.onclick=function(){ AIMDBG.showArms=!AIMDBG.showArms; sClick(); aimDbgNote(); };
    if(a) a.onclick=function(){ sClick(); bagTab(0); };
    if(b) b.onclick=function(){ sClick(); bagTab(1); };
    if(t) t.onclick=function(){ sClick(); tradeOpen(); };
    /* les six consignes de groupe : chaque bouton pousse son code dans le
       journal d'entrees, exactement comme depgo ou out, pour que le clic se
       rejoue */
    [0,1,2,3,4,5].forEach(function(c){
        var el=document.getElementById("gc"+c);
        if(el) el.onclick=function(){ sClick(); pushAct("gcmd",c); };
    });
})();
var JLOG=[];
function gameClock(){
    var f=cycleT()/CFG.CYCLE, h=Math.floor(f*24), m=Math.floor((f*24-h)*60);
    return pad(h)+":"+pad(m);
}
function logMsg(txt,cls){
    /* deux panneaux d'un meme bourg ne repetent pas la ligne */
    if(JLOG.length&&JLOG[JLOG.length-1].s===txt) return;
    JLOG.push({t:gameClock(),d:dayNum(),s:txt,c:cls||""});
    if(JLOG.length>80) JLOG.shift();
    if(!jlogEl) return;
    var h="", q;
    for(q=0;q<JLOG.length;q++)
        h+="<div class='jline "+JLOG[q].c+"'><i>"+JLOG[q].t+"</i>"+JLOG[q].s+"</div>";
    jlogEl.innerHTML=h;
    jlogEl.scrollTop=jlogEl.scrollHeight;
}
function updJournal(dt){
    var p=G.p, i, s;
    if(jtimeEl) jtimeEl.textContent="Jour "+G.day+" - "+gameClock();
    /* Le nom du repere le plus proche reste affiche tant qu'on est a portee :
       panneau d'abord, batiment longe ensuite. Il ne s'efface qu'une fois
       qu'on s'en ecarte. */
    var near=null, nd=1e9, d9;
    for(i=0;i<SIGNS.length;i++){
        s=SIGNS[i];
        var rs=(s.post?78:62);
        d9=dist2(p.x,p.y,s.x,s.y);
        if(d9<rs*rs&&d9<nd){ nd=d9; near=s.name; }
    }
    if(!near){
        for(i=0;i<BLDRECTS.length;i++){
            var b9=BLDRECTS[i];
            if(p.x<b9.x-44||p.x>b9.x+b9.w+44||p.y<b9.y-44||p.y>b9.y+b9.h+44) continue;
            var lbl9=bldLabel(b9);
            if(!lbl9) continue;
            d9=dist2(p.x,p.y,b9.x+b9.w/2,b9.y+b9.h/2);
            if(d9<nd){ nd=d9; near=lbl9; }
        }
    }
    if(near&&!G.inside) G.place={n:near,t:1};
}

/* ================= INTERACTION ================= */
/* Entrer dans un batiment, crocheter une serrure, aborder un habitant.
   Tout passe par une action discrete, donc le rejeu reproduit la scene. */
/* ================= LES METIERS =================
   Un habitant n'etait qu'un nom et une silhouette. Il a desormais un metier,
   et le metier decide de trois choses : ce qu'il raconte de lui, ce qu'il
   sait faire, et l'endroit ou il traine.

   lt   le lieu de travail, au sens de la fouille : si le bourg possede ce
        batiment, le metier existe dans ce bourg et l'habitant tournera
        autour. Sans lt, le metier n'a pas d'adresse et l'on vaque partout.
   w    le poids du metier dans le tirage, quand son lieu existe.
   st   ce que le metier fait aux quatre competences, en ecart a 50.
   ap   ce qu'il fait aux aptitudes, toujours en ecart a 50.
   d    dix presentations. Chacun garde la sienne pour toute la partie : on
        peut revenir le voir, il racontera la meme chose. */
var JOBS=[
 {k:"fermier", n:"fermier", lt:"ferme", w:0,
  st:{cardio:14,astuce:4,combat:6,tir:2}, ap:{portage:16,souffle:10,immunite:12,vigueur:8},
  d:["Je tiens la ferme au bout du chemin. Trente ans que je me leve avant le jour, et ce n'est pas maintenant que je vais changer.",
     "Mon pere avait les memes champs. Il disait que la terre ne trahit pas. Elle ne sauve pas non plus, mais elle ne trahit pas.",
     "J'ai vendu les vaches l'annee derniere. Trop de travail pour un seul homme. Il me reste les cultures et deux chiens.",
     "On m'a propose de partir en ville. J'ai ri. Qu'est-ce que j'irais y faire, moi, entre quatre murs ?",
     "Le tracteur est en panne depuis le printemps. Je fais tout a la main. Ca prend le double de temps et ca me tient debout.",
     "Ma femme s'occupait du potager. Elle est partie chez sa soeur, de l'autre cote. Je ne sais pas si elle y est arrivee.",
     "Je connais chaque haie a dix lieues. Si vous cherchez un chemin, demandez-moi plutot qu'a une carte.",
     "Les recoltes ont ete bonnes. C'est bien la seule chose qui ait ete bonne cette annee.",
     "J'ai commence a quatorze ans chez un voisin. Je n'ai jamais fait autre chose et je n'ai jamais voulu.",
     "Il faut nourrir les betes meme quand le monde s'ecroule. Elles n'y sont pour rien, elles."]},
 {k:"pecheur", n:"pecheur", lt:"", w:0,
  st:{cardio:8,astuce:12,combat:2,tir:6}, ap:{souffle:8,portage:8,discretion:12,fouille:8},
  d:["Je sors le bateau tous les matins. Moins loin qu'avant, mais je sors.",
     "Trente ans de mer et je ne sais toujours pas nager. Ca fait rire tout le monde. Ca m'a jamais gene.",
     "Mon frere avait le bateau d'a cote. Il n'est pas rentre en mars. On n'a rien retrouve.",
     "Le poisson se fait rare. Ou alors c'est moi qui vieillis et qui ne sais plus ou le prendre.",
     "J'ai appris a lire le ciel avant de lire les lettres. Ca m'a servi plus souvent.",
     "Ma mere reparait les filets sur le quai. Elle avait les mains dures comme du bois.",
     "On m'appelle quand quelqu'un tombe a l'eau. Je suis le seul a savoir ou le courant le portera.",
     "Le bateau, c'est tout ce que je possede. Je dors dessus depuis que la maison a brule.",
     "Je vendais au marche du bourg. Maintenant je donne, parce que plus personne n'a de quoi payer.",
     "Il y a des jours ou je reste au large jusqu'a la nuit. Personne pour parler, personne pour crier. C'est bien."]},
 {k:"militaire", n:"militaire", lt:"armee", w:0,
  st:{cardio:16,astuce:8,combat:20,tir:24}, ap:{maniement:22,stabilite:18,chargement:20,frappe:14,vigueur:12},
  d:["Douze ans de service. J'ai fait deux missions dehors avant qu'on nous rappelle tous ici.",
     "On tient la caserne. Officiellement, on attend des ordres. Officieusement, il n'y a plus personne pour en donner.",
     "Je suis entre a dix-huit ans parce que je ne savais pas quoi faire. J'y suis reste parce que j'ai su.",
     "Ma section etait de vingt. Nous sommes six. Je ne vous raconterai pas le reste.",
     "L'armurerie est verrouillee et je suis le seul a savoir ou est la clef. C'est mieux comme ca.",
     "On m'a decore pour quelque chose que je n'ai pas fait. J'ai garde la medaille et ferme ma bouche.",
     "Le reglement dit qu'on ne tire pas sur un civil. Le reglement n'avait pas prevu ce qui arrive.",
     "Je m'entraine encore tous les matins. Les autres ont arrete. Ils ont tort.",
     "Ma famille est a trois cents kilometres. Je n'ai pas de nouvelles depuis six semaines.",
     "Si vous voyez une colonne militaire sur la route, ne l'approchez pas. Ils ne s'arretent plus."]},
 {k:"soldat", n:"soldat", lt:"", w:0,
  st:{cardio:12,astuce:4,combat:14,tir:18}, ap:{maniement:16,stabilite:14,vigueur:10,parade:10},
  d:["On m'a detache ici pour tenir le bourg. Je tiens le bourg.",
     "Je suis plante devant cette maison depuis huit jours. Personne n'est venu me relever.",
     "J'etais mecanicien avant. On m'a donne un fusil et on m'a dit de regarder la route.",
     "Ma consigne, c'est de surveiller. Pas de suivre, pas de partir, pas de discuter. Surveiller.",
     "Les gens d'ici me donnent a manger. Je crois qu'ils ont plus peur de me voir partir que de me voir rester.",
     "J'ai vingt-deux ans. On ne m'avait rien dit de tout ca a l'engagement.",
     "Mon sergent a pris la route du nord avec la moitie de la section. Je n'ai pas voulu.",
     "La nuit, j'entends des choses vers les champs. Le jour, il n'y a rien. Je prefere le jour.",
     "On m'a donne trois chargeurs. Il m'en reste deux. Je compte chaque coup.",
     "Si ca tourne mal, je ne bougerai pas d'ici. C'est le seul endroit ou je sers a quelque chose."]},
 {k:"pompier", n:"pompier", lt:"pompiers", w:2,
  st:{cardio:20,astuce:10,combat:12,tir:2}, ap:{souffle:18,portage:18,vigueur:14,sante:12,immunite:10},
  d:["Caserne du bourg. Dix-huit ans de service, et pas une seule annee ou j'ai regrette.",
     "On sort moins pour le feu qu'avant. On sort pour autre chose, et ca ne s'eteint pas avec de l'eau.",
     "J'ai sorti une gamine d'un premier etage il y a six ans. Elle doit avoir votre age maintenant.",
     "Mon binome est reste dans une cage d'escalier. Je pense a lui a chaque depart.",
     "La lance pese vingt kilos pleine. On apprend a la tenir avant d'apprendre a viser.",
     "On nous appelle pour tout : les inondations, les nids de guepes, les chats. Et pour le reste.",
     "Je connais chaque maison du bourg par l'interieur. C'est le metier qui veut ca.",
     "Volontaire au debut, puis engage. Ma mere n'a jamais compris pourquoi.",
     "Il reste de quoi tenir deux departs dans les cuves. Apres, on regardera bruler.",
     "On m'a appris a entrer quand tout le monde sort. C'est difficile a desapprendre."]},
 {k:"policier", n:"policier", lt:"police", w:2,
  st:{cardio:10,astuce:16,combat:14,tir:16}, ap:{maniement:14,stabilite:12,crochetage:16,discretion:10,parade:10},
  d:["Brigade du bourg. Nous etions quatre, nous sommes deux.",
     "Vingt ans de service et je n'ai jamais tire ailleurs qu'au stand. J'aimerais que ca dure.",
     "Le commissariat n'a plus de ligne. On fait ce qu'on peut avec ce qu'on voit.",
     "J'ai commence a la circulation. On rit, mais c'est la qu'on apprend a lire les gens.",
     "Mon collegue a rendu sa plaque en avril. Il est parti chercher ses enfants au sud.",
     "On m'a jete des pierres le mois dernier. Je comprends. Ca ne m'aide pas, mais je comprends.",
     "Les cellules servent de reserve maintenant. On y range ce qu'on trouve.",
     "Il y a des choses qu'on ne consigne plus dans le registre. Personne ne le lira jamais.",
     "Je suis ne dans ce bourg. Je connais les parents de la moitie de ceux que j'arrete.",
     "Si vous voyez quelqu'un de mordu, ne l'approchez pas. Venez me chercher, moi."]},
 {k:"soignant", n:"soignant", lt:"medecin", w:2,
  st:{cardio:6,astuce:22,combat:4,tir:2}, ap:{sante:24,immunite:20,fouille:20},
  d:["Cabinet du bourg. Je suis le seul a dix kilometres a la ronde.",
     "J'ai fait mes etudes en ville et je suis revenu. Tout le monde m'a dit que c'etait une erreur.",
     "Les stocks sont a sec depuis un mois. Je soigne a la parole et a l'eau bouillie.",
     "Les morsures, on ne sait pas. J'ai essaye trois protocoles. Aucun n'a rien change.",
     "J'ai mis au monde une bonne partie des gens que vous croisez ici.",
     "Ma consoeur du bourg voisin ne repond plus. Je n'ai pas eu le courage d'aller voir.",
     "Je garde une seringue de morphine a part. Vous devinez pour qui.",
     "On vient me voir pour des angines quand le monde s'effondre. Ca me rassure, quelque part.",
     "J'ai perdu deux patients cette semaine faute de materiel. Pas faute de savoir.",
     "Si vous trouvez des medicaments dehors, apportez-les-moi. Je paierai comme je peux."]},
 {k:"epicier", n:"epicier", lt:"superette", w:3,
  st:{cardio:4,astuce:14,combat:2,tir:0}, ap:{troc:22,fouille:20,portage:8},
  d:["La superette, c'est moi. Depuis dix-sept ans, et mon pere avant.",
     "Les rayons sont vides mais j'ouvre quand meme. Les gens viennent pour parler, pas pour acheter.",
     "Je connais les habitudes de chacun ici. Qui prend du sucre, qui n'en prend jamais.",
     "J'ai encore trois palettes en reserve. Je les sors au compte-gouttes, sinon tout part en un jour.",
     "Ma femme tenait la caisse. Elle est partie en fevrier avec le representant. Ca aussi c'est arrive.",
     "On me demande de faire credit. Je fais credit. Je ne sais pas a qui je le reclamerai.",
     "J'ai commence comme livreur. Le patron m'a laisse la boutique en partant a la retraite.",
     "Le vrai commerce, ce n'est pas de vendre. C'est de savoir ce que les gens vont vouloir avant eux.",
     "Le camion ne passe plus depuis avril. Je vais chercher ce que je peux a la ferme.",
     "Marchandez si vous voulez, mais ne me prenez pas pour un imbecile. Je fais ca depuis trop longtemps."]},
 {k:"droguiste", n:"droguiste", lt:"droguerie", w:3,
  st:{cardio:4,astuce:20,combat:2,tir:2}, ap:{troc:14,fouille:26,immunite:12},
  d:["La droguerie du bourg. Peinture, soude, acide, tout ce qui pique et tout ce qui ronge.",
     "Je sais quel produit ne doit jamais rencontrer quel autre. C'est la moitie du metier.",
     "On m'a demande de fabriquer des choses ces derniers temps. J'ai refuse deux fois, puis j'ai accepte.",
     "Mon oncle tenait la boutique avant. Il est mort d'avoir respire ce qu'il vendait.",
     "J'ai un fonds de reserve a la cave. Personne ne sait, et ce n'est pas vous que je le dirai.",
     "Les gens viennent chercher de l'eau de javel comme si ca reglait tout. Ca ne regle rien.",
     "J'ai fait chimie deux ans avant d'abandonner. Assez pour ne pas me tromper de flacon.",
     "Le magasin sent la terebenthine depuis trente ans. Je ne le sens plus, moi.",
     "Un client m'a demande de quoi faire sauter une porte. Je lui ai vendu un pied-de-biche.",
     "Tout ce qui est ici peut soigner ou tuer selon la dose. C'est vrai de tout, en fait."]},
 {k:"cuisinier", n:"cuisinier", lt:"resto", w:3,
  st:{cardio:8,astuce:12,combat:8,tir:0}, ap:{sante:12,immunite:14,troc:10,frappe:8,portage:8},
  d:["Le restaurant sur la place, c'est ma cuisine. Vingt couverts les bons jours.",
     "J'ai fait les brigades en ville pendant huit ans. Je suis revenu pour la tranquillite.",
     "On m'apporte ce qu'on trouve et j'en fais quelque chose. C'est devenu ca, le metier.",
     "Ma salle est pleine tous les soirs. Les gens ne veulent pas manger seuls en ce moment.",
     "J'ai forme trois apprentis. Deux sont partis, le troisieme est reste. C'est une bonne moyenne.",
     "Le congelateur a lache la semaine derniere. On a tout mange en deux jours. C'etait une belle fete.",
     "Mon pere disait qu'on ne jette rien. Je n'ai jamais rien jete de ma vie.",
     "Je sais quoi faire d'un lapin, d'une carpe ou d'un pigeon. Ca peut servir, par les temps qui courent.",
     "La cuisine, c'est de la chaleur et des couteaux. On apprend vite a ne pas s'affoler.",
     "Venez le soir. Il restera toujours une assiette, meme si je ne sais pas de quoi."]},
 {k:"barman", n:"barman", lt:"bar", w:3,
  st:{cardio:6,astuce:16,combat:8,tir:2}, ap:{troc:18,discretion:12,fouille:10,parade:8},
  d:["Le bar de la place. J'ouvre a dix heures et je ferme quand le dernier s'en va.",
     "J'entends tout ce qui se dit dans ce bourg. Je n'en repete pas la moitie.",
     "Le stock d'alcool tiendra encore trois mois. Apres, il faudra bien que les gens parlent a jeun.",
     "J'ai rachete la licence a un type qui buvait sa propre marchandise. Lecon retenue.",
     "Il y a une bagarre par semaine. Je les separe seul depuis quinze ans.",
     "Ma fille faisait le service le samedi. Elle est en ville, aux etudes. Enfin, elle y etait.",
     "Les vieux du fond ont la meme table depuis que j'ai repris. Ils n'ont jamais change de place.",
     "Si vous cherchez quelqu'un dans le coin, demandez-moi. Tout le monde finit par passer.",
     "J'ai arrete de boire il y a dix ans. C'est plus facile derriere le comptoir que devant.",
     "On vient ici pour oublier. Moi je suis paye pour me souvenir de ce que chacun prend."]},
 {k:"instituteur", n:"instituteur", lt:"ecole", w:2,
  st:{cardio:4,astuce:24,combat:2,tir:0}, ap:{fouille:25,sante:10,discretion:8,troc:8},
  d:["L'ecole du bourg. Une classe unique, du plus petit au plus grand.",
     "Vingt-trois eleves en septembre. Onze en mars. Je ne demande plus pourquoi les autres ne viennent pas.",
     "J'ai demande cette affectation. On m'a pris pour un fou de vouloir la campagne.",
     "Je fais classe meme quand il n'en vient que trois. Surtout quand il n'en vient que trois.",
     "Les parents me confient plus que leurs enfants. Ils me confient ce qu'ils ne se disent pas entre eux.",
     "J'ai enseigne a la moitie des adultes que vous croisez ici. Ils m'appellent encore monsieur.",
     "La bibliotheque de l'ecole a trois cents livres. C'est la plus grande a vingt kilometres.",
     "On m'a propose la direction en ville. J'ai dit non deux fois, puis on a arrete de demander.",
     "Je garde le registre a jour. Les noms, les dates. Quelqu'un devra bien savoir qui etait la.",
     "Ce que j'apprends aux petits ne leur servira peut-etre a rien. Je le leur apprends quand meme."]},
 {k:"secretaire", n:"secretaire de mairie", lt:"mairie", w:2,
  st:{cardio:4,astuce:20,combat:2,tir:2}, ap:{fouille:26,troc:12},
  d:["Mairie du bourg. Etat civil, cadastre, elections. Ce qu'il en reste.",
     "Je sais qui possede quoi a dix kilometres a la ronde. C'est ecrit, et c'est moi qui l'ecris.",
     "Le maire ne vient plus. Je signe a sa place depuis six semaines et personne n'a rien dit.",
     "J'ai enregistre quarante deces ce trimestre. La moyenne annuelle etait de douze.",
     "Vingt-six ans dans le meme bureau. J'y ai vu passer quatre maires et deux inondations.",
     "Les archives sont a la cave. Tout le bourg y est, depuis 1789. Je les ai montees a l'etage en mars.",
     "On vient me voir pour des papiers dont plus personne ne verifiera l'existence. Je les fais quand meme.",
     "Mon mari travaillait aux services techniques. Il connaissait chaque canalisation.",
     "J'ai la clef de tous les batiments communaux. Toutes, sans exception.",
     "Ce bourg a un nom, une histoire et un registre. Tant que le registre tient, le bourg tient."]},
 {k:"armurier", n:"armurier", lt:"armurerie", w:2,
  st:{cardio:6,astuce:18,combat:8,tir:22}, ap:{maniement:20,chargement:16,stabilite:14,troc:12,crochetage:22},
  d:["L'armurerie, c'est moi. Chasse et tir sportif, rien de militaire, quoi qu'on en dise.",
     "Je demonte et je remonte les yeux fermes. Trente ans d'atelier, ca laisse des habitudes.",
     "Le registre des ventes est a jour. On me l'a demande trois fois ce mois-ci.",
     "Mon pere reparait les fusils dans le meme atelier. Les memes etaux, les memes limes.",
     "Les gens viennent acheter n'importe quoi depuis que ca a commence. Je refuse plus que je ne vends.",
     "Une arme mal entretenue est plus dangereuse pour celui qui la tient. Rappelez-vous-en.",
     "J'ai les cles du coffre et personne d'autre. Ni ma femme, ni la brigade.",
     "Je tire au stand tous les dimanches depuis que j'ai quinze ans.",
     "On m'a cambriole en avril. Ils ont pris six armes. Je sais qui c'est et je n'ai rien dit.",
     "Apportez-moi ce que vous trouvez, je vous dirai ce que ca vaut et si ca peut encore servir."]},
 {k:"magasinier", n:"magasinier", lt:"depot", w:3,
  st:{cardio:14,astuce:12,combat:8,tir:2}, ap:{portage:22,souffle:12,fouille:16,troc:10},
  d:["Le depot a la sortie du bourg. Je sais ou est chaque chose, meme sans etiquette.",
     "J'ai charge des camions pendant douze ans. Mon dos s'en souvient tous les matins.",
     "Il reste des palettes entieres au fond. Personne ne sait ce qu'il y a dedans. Moi si.",
     "L'inventaire, c'est ma religion. Ce qui n'est pas compte n'existe pas.",
     "Le patron est parti sans un mot en mars. J'ai continue a ouvrir tous les jours.",
     "Je porte des charges que trois hommes ne souleveraient pas. C'est de la technique, pas de la force.",
     "On m'a propose de dechirer le registre et de tout vendre. J'ai refuse. C'est pas a moi.",
     "Le monte-charge est mort il y a deux ans. Depuis, je monte tout a la sangle.",
     "Ma soeur travaille au depot du bourg voisin. Enfin, travaillait.",
     "Si vous cherchez quelque chose de precis, decrivez-le-moi. Il y a une chance que je l'aie eu en main."]},
 {k:"garagiste", n:"garagiste", lt:"station", w:2,
  st:{cardio:12,astuce:18,combat:8,tir:2}, ap:{fouille:27,portage:14,troc:10},
  d:["La station a l'entree du bourg. Pompes, atelier, et tout ce qui roule.",
     "Les cuves sont vides depuis six semaines. Je repare encore, mais je ne sers plus rien.",
     "J'ai monte l'affaire a vingt-quatre ans avec l'argent de mon service.",
     "On m'amene des moteurs que personne ne saurait plus nommer. Je les fais repartir.",
     "Mon apprenti a dix-sept ans et de meilleures mains que moi au meme age.",
     "Les gens laissent leur voiture et ne reviennent pas la chercher. J'en ai neuf sur le parking.",
     "Je peux ouvrir n'importe quel capot et vous dire ce qui cloche a l'oreille.",
     "La derniere citerne est passee le douze avril. Je note tout, c'est plus fort que moi.",
     "Il y a de quoi bricoler de belles choses dans mon atelier. Je ne dis pas quoi.",
     "Tant qu'il restera un moteur en etat sur cette carte, il faudra quelqu'un comme moi."]},
 {k:"menuisier", n:"menuisier", lt:"hangar", w:2,
  st:{cardio:14,astuce:14,combat:12,tir:2}, ap:{portage:18,frappe:12,fouille:20},
  d:["Le hangar au bord de la route, c'est mon atelier. Charpente et menuiserie.",
     "Je travaille le bois depuis mes seize ans. Mes mains sont plus vieilles que le reste.",
     "On me demande des volets et des portes renforcees depuis quelques mois. Je ne demande pas pourquoi.",
     "J'ai refait la charpente de l'eglise il y a huit ans. Elle tiendra plus longtemps que moi.",
     "Mon associe est parti avec la camionnette et la moitie de l'outillage.",
     "Le bois ne ment pas. Il travaille, il fend, il previent avant de casser.",
     "J'ai encore trois metres cubes de chene sec sous le hangar. Ca vaut de l'or aujourd'hui.",
     "Ma fille voulait reprendre l'atelier. Je lui ai dit d'aller voir ailleurs d'abord.",
     "Je peux vous condamner une porte en une heure. Deux si vous voulez qu'elle tienne vraiment.",
     "On construit ou on repare. Il n'y a jamais eu que ces deux facons de tenir debout."]},
 {k:"moniteur", n:"moniteur de tir", lt:"stand", w:2,
  st:{cardio:10,astuce:12,combat:10,tir:26}, ap:{stabilite:24,maniement:20,chargement:18,fouille:12},
  d:["Le stand sur la route, c'est moi qui le tiens. Vingt-cinq postes, cent metres.",
     "J'ai tire en competition pendant quinze ans. Deux titres regionaux, rien de plus.",
     "J'apprends aux gens a respirer avant de leur apprendre a viser. C'est tout le secret.",
     "Le club comptait quatre-vingts membres. Il en reste six, et ils viennent tous les jours.",
     "Je vois tout de suite qui a deja tire et qui fait semblant. A la facon de tenir, avant meme le coup.",
     "Mon pere etait chasseur. Il m'a mis une carabine dans les mains a dix ans, et une lecon avec.",
     "On m'a demande de former des gens en urgence le mois dernier. J'ai dit oui. J'y pense encore.",
     "La regle numero un n'a pas change : le canon ne pointe jamais ce qu'on ne veut pas detruire.",
     "Il reste des cibles et des douilles par milliers dans le local. Prenez ce qui vous sert.",
     "Un bon tireur, ce n'est pas celui qui touche. C'est celui qui sait quand ne pas tirer."]},
 {k:"retraite", n:"retraite", lt:"", w:0,
  st:{cardio:-10,astuce:16,combat:-6,tir:4}, ap:{troc:12,fouille:19,immunite:8},
  d:["J'ai fini de travailler il y a onze ans. Je regarde passer les jours, maintenant.",
     "J'ai ete cantonnier pour la commune pendant quarante ans. Chaque fosse, c'est moi.",
     "Ma femme est morte au printemps dernier. La maison est grande, tout d'un coup.",
     "Mes enfants sont en ville. Ils appelaient tous les dimanches. Ils n'appellent plus.",
     "Je fais mon tour deux fois par jour, matin et soir. Ca fait cinquante ans que je fais ce tour.",
     "J'ai connu ce bourg avec trois cents habitants. Il y en a quatre-vingts aujourd'hui.",
     "On me dit de me mettre a l'abri. A mon age, s'abriter de quoi, exactement ?",
     "Je jardine encore. Trois rangs de haricots, deux de pommes de terre. Ca suffit largement.",
     "J'ai fait la guerre, moi, la vraie. On ne me raconte pas d'histoires sur ce qui arrive.",
     "Je connais tout le monde ici, et tout le monde connait mon pere. C'est comme ca, un bourg."]},
 /* ---- LES ARTISANS ----
    Ils n'ont pas de batiment dans la table des lieux : leur adresse est une
    enseigne posee sur une maison ou au bas d'un immeuble. Le champ bz les
    rattache a cette enseigne comme lt rattache l'epicier a sa superette. */
 {k:"plombier", n:"plombier", lt:"", bz:"plombier", w:2,
  st:{cardio:12,astuce:16,combat:8,tir:0}, ap:{portage:14,fouille:12,frappe:8,crochetage:20},
  d:["Plomberie, chauffage, tout ce qui coule ou qui devrait couler.",
     "Vingt ans sous les eviers. J'ai vu l'interieur de toutes les maisons du bourg.",
     "Le chateau d'eau tient encore. Le jour ou il lachera, je serai le seul a savoir ou couper.",
     "J'ai appris chez mon beau-pere. Il ne m'a jamais dit un mot gentil et il m'a tout appris.",
     "On m'appelle a trois heures du matin pour une fuite. On ne m'appelle jamais pour dire merci.",
     "Ma camionnette est a l'arret, plus de carburant. Je fais les depannages a velo.",
     "Le cuivre vaut de l'or maintenant. J'ai de quoi remplir une brouette dans mon atelier.",
     "Je sais ou passent toutes les canalisations du bourg. Ca peut servir plus qu'on ne croit.",
     "Mon fils voulait faire autre chose. Il a bien fait, remarquez.",
     "Une soudure propre, ca tient trente ans. Une soudure sale, ca tient jusqu'a ce que vous ayez tourne le dos."]},
 {k:"boulanger", n:"boulanger", lt:"", bz:"boulanger", w:2,
  st:{cardio:14,astuce:12,combat:6,tir:0}, ap:{souffle:14,portage:14,sante:12,immunite:12,troc:10},
  d:["Le fournil ouvre a quatre heures. Il ouvre encore, tant qu'il y a de la farine.",
     "Trente ans que je ne dors pas la nuit. Je ne saurais plus faire autrement.",
     "Il me reste six sacs de farine. Apres, je ne sais pas ce que mangera ce bourg.",
     "Mon four est a bois. C'est ce qui me sauve : les autres ont tout perdu avec le courant.",
     "J'ai repris la boulangerie de mon oncle. Elle etait fermee depuis deux ans, ca sentait encore le pain.",
     "Je donne l'invendu du soir a qui passe. Il n'y a plus beaucoup d'invendu.",
     "Le levain a quarante ans. Il vient de mon predecesseur. Je le nourris tous les jours.",
     "Les gens viennent chercher du pain et repartent avec des nouvelles. C'est le meme commerce.",
     "Ma femme tenait la boutique. Elle est partie soigner sa mere en mars et n'est pas revenue.",
     "On m'a propose de partir avec un convoi. Qui ferait le pain, alors ?"]},
 {k:"charcutier", n:"charcutier", lt:"", bz:"charcutier", w:2,
  st:{cardio:10,astuce:12,combat:16,tir:4}, ap:{frappe:20,portage:14,immunite:14,troc:12},
  d:["Charcuterie, boucherie. Je decoupe ce qu'on m'apporte, sans poser de questions.",
     "J'ai fait mon apprentissage a quinze ans. Mes mains n'ont plus la meme forme depuis.",
     "Le froid est parti avec le courant. On sale, on fume, on seche : les vieilles methodes reviennent.",
     "Je sais desosser une bete entiere en vingt minutes. Ca impressionne moins qu'avant.",
     "Mon pere tenait l'etal du marche. Il m'a appris a affuter avant a couper.",
     "Les fermiers m'amenent leurs betes et je partage. C'est du troc, plus du commerce.",
     "J'ai quatre-vingts kilos de jambon sec en cave. Personne ne le sait, et ca vaut mieux.",
     "Un bon couteau, ca s'entretient tous les jours. Sinon ce n'est plus qu'un morceau de fer.",
     "Ma soeur tient l'etal a ma place quand je vais chercher les betes.",
     "On s'habitue au sang. C'est ce qui m'inquiete le plus, en ce moment."]},
 {k:"electricien", n:"electricien", lt:"", bz:"electricien", w:2,
  st:{cardio:8,astuce:22,combat:4,tir:2}, ap:{fouille:16,crochetage:26,discretion:8},
  d:["Installations, depannages. Enfin, quand il y avait quelque chose a depanner.",
     "Le reseau est mort depuis six semaines. Je bricole des batteries et des panneaux.",
     "J'ai monte le tableau de la moitie des maisons d'ici. Je sais ce qu'il y a derriere chaque mur.",
     "Le groupe electrogene de la mairie, c'est moi qui l'entretiens. Il tiendra encore un mois.",
     "On m'a demande de rebrancher le pylone. J'ai explique que ca ne marchait pas comme ca.",
     "J'ai appris a l'armee, aux transmissions. Le civil m'a paru facile apres.",
     "Il y a de quoi eclairer une salle entiere dans mon atelier, si on me trouve du fil.",
     "Le courant, ca ne pardonne pas. On ne fait pas deux fois la meme erreur.",
     "Ma fille est electricienne aussi, en ville. Enfin, elle l'etait.",
     "Donnez-moi une batterie de voiture et une journee, je vous rends la lumiere."]},
 {k:"couvreur", n:"couvreur", lt:"", bz:"couvreur", w:2,
  st:{cardio:18,astuce:12,combat:10,tir:2}, ap:{souffle:18,portage:16,vitesse:12,fouille:12},
  d:["Couverture et zinguerie. Les toits du bourg, c'est moi ou mon predecesseur.",
     "Je passe mes journees a dix metres du sol. Le vertige, ca se perd la premiere semaine.",
     "J'ai refait le clocher il y a six ans. On voit tout le pays de la-haut.",
     "Les tuiles anciennes ne se trouvent plus. Je recupere sur les ruines pour reparer les vivants.",
     "Mon apprenti est tombe l'annee derniere. Il s'en est sorti. J'y pense encore tous les matins.",
     "De la-haut, on voit venir les gens longtemps avant qu'ils arrivent. Ca s'est mis a compter.",
     "J'ai trois cents metres de corde et de quoi monter n'importe ou.",
     "Mon pere etait charpentier. Il disait que le toit, c'est la seule chose qui compte vraiment.",
     "Une fuite mal reparee, ca pourrit une maison entiere en deux hivers.",
     "Je connais les toits mieux que les rues. Je pourrais traverser le bourg sans descendre."]},
 {k:"coiffeur", n:"coiffeur", lt:"", bz:"coiffeur", w:2,
  st:{cardio:4,astuce:18,combat:4,tir:2}, ap:{troc:16,discretion:12,sante:10,fouille:14},
  d:["Le salon sur la place. Coupe, barbe, et tout ce qui se raconte entre les deux.",
     "J'entends plus de confidences que le medecin. Les gens parlent quand on leur touche la tete.",
     "J'ai ouvert a vingt-trois ans avec l'argent de ma grand-mere.",
     "Plus personne ne paie. On me donne des oeufs, du bois, ce qu'on a.",
     "Je coupe encore les cheveux des vieux qui ne sortent plus. Je me deplace chez eux.",
     "Mon rasoir a lame date de mon predecesseur. Il coupe mieux que tout ce qui se vend aujourd'hui.",
     "J'ai vu grandir la moitie du bourg dans mon fauteuil, coupe apres coupe.",
     "Les gens veulent avoir bonne mine meme quand tout va mal. Surtout quand tout va mal.",
     "Ma mere etait coiffeuse. J'ai balaye son salon pendant dix ans avant de tenir des ciseaux.",
     "Asseyez-vous si vous voulez. Ca ne coutera rien et ca vous fera du bien."]},
 {k:"cordonnier", n:"cordonnier", lt:"", bz:"cordonnier", w:2,
  st:{cardio:6,astuce:18,combat:6,tir:2}, ap:{troc:14,fouille:12,portage:8,crochetage:22},
  d:["Cordonnerie. Je ressemelle, je recouds, je rends des chaussures a des gens qui marchent beaucoup.",
     "Depuis que tout le monde marche, je n'ai jamais eu autant de travail.",
     "Une paire bien entretenue dure dix ans. Les gens ne le savaient plus. Ils le reapprennent.",
     "J'ai appris chez un vieux qui ne parlait pas. On travaillait en silence, huit heures par jour.",
     "Il me reste du cuir pour une centaine de paires. Je le compte comme de l'or.",
     "On m'apporte des chaussures de morts a remettre en etat. Je ne demande plus d'ou elles viennent.",
     "Ma boutique fait trois metres sur quatre. Je n'en ai jamais eu besoin de plus.",
     "Le fil pois, l'alene, le marteau. Les memes outils depuis deux siecles.",
     "Mon frere avait la boutique du bourg voisin. Plus de nouvelles depuis fevrier.",
     "Montrez-moi vos semelles, je vous dirai d'ou vous venez."]},
 {k:"horloger", n:"horloger", lt:"", bz:"horloger", w:2,
  st:{cardio:2,astuce:26,combat:2,tir:6}, ap:{crochetage:36,fouille:16,stabilite:12},
  d:["Horlogerie et petite reparation. Tout ce qui a des rouages passe entre mes mains.",
     "Quarante ans a regarder dans une loupe. J'ai le dos voute et la main sure.",
     "J'entretiens l'horloge de la mairie depuis 1991. Elle sonne encore juste.",
     "Une serrure et une montre, c'est le meme travail. Je ne dis pas ca a tout le monde.",
     "Mon pere reparait des pendules. Son pere aussi. Ca s'arrete a moi.",
     "On m'apporte des mecanismes que je n'avais jamais vus. C'est la meilleure partie du metier.",
     "J'ai des outils qu'on ne fabrique plus. Des limes fines comme un cheveu.",
     "Le temps, les gens s'en fichent maintenant. Ils viennent quand meme faire reparer les montres.",
     "Ma femme classait les pieces detachees. Je ne retrouve plus rien depuis qu'elle est partie.",
     "La patience, ca ne s'apprend pas. On l'a ou on change de metier."]},
 {k:"couturiere", n:"couturier", lt:"", bz:"couturiere", w:2,
  st:{cardio:4,astuce:20,combat:2,tir:2}, ap:{troc:14,fouille:27,discretion:10},
  d:["Couture et retouches. Je rhabille tout le bourg avec ce qu'on me donne.",
     "On ne coud plus pour la mode, on coud pour que ca tienne. Ca me va tres bien.",
     "J'ai appris a la machine avant d'apprendre a ecrire.",
     "Je decouds les vieux vetements pour en faire des neufs. Rien ne se jette.",
     "Ma machine est a pedale. Elle marchait avant le courant, elle marche apres.",
     "J'ai cousu la robe de mariage de la moitie des femmes d'ici.",
     "Il me reste trois rouleaux de toile epaisse. De quoi habiller dix personnes pour l'hiver.",
     "On m'a demande de coudre des sacs et des sangles. J'en fais dix par semaine maintenant.",
     "Mon atelier donne sur la rue. Je vois passer tout le monde sans lever la tete.",
     "Apportez-moi ce qui est dechire. Je ne promets pas joli, je promets solide."]},
 {k:"maconnerie", n:"macon", lt:"", bz:"maconnerie", w:2,
  st:{cardio:20,astuce:10,combat:14,tir:0}, ap:{portage:22,souffle:16,frappe:14,vigueur:12},
  d:["Maconnerie generale. Murs, dalles, fondations : tout ce qui doit tenir debout.",
     "Vingt-cinq ans a porter des parpaings. Mon dos me le rappelle chaque matin.",
     "On me demande de murer des fenetres depuis quelques mois. Je ne demande pas pourquoi.",
     "J'ai bati la moitie des extensions du bourg. Je sais ou sont les murs porteurs.",
     "Mon equipe etait de quatre. Ils sont partis chacun de leur cote en fevrier.",
     "Il me reste du ciment pour trois murs. Apres, ce sera de la pierre seche.",
     "J'ai commence manoeuvre a seize ans. Je n'ai jamais rien fait d'autre.",
     "Un mur monte a la va-vite, ca tombe au premier hiver. Il n'y a pas de raccourci.",
     "Mon pere etait carrier. Il m'a appris a lire la pierre avant a la poser.",
     "Si vous voulez condamner quelque chose pour de bon, venez me voir."]},
 {k:"veterinaire", n:"veterinaire", lt:"", bz:"veterinaire", w:1,
  st:{cardio:8,astuce:24,combat:4,tir:6}, ap:{sante:22,immunite:22,fouille:19},
  d:["Cabinet veterinaire. Les betes de ferme surtout, un peu de domestique.",
     "Je soigne des humains depuis trois mois. Ce n'est pas si different qu'on croit.",
     "J'ai fait l'ecole a Lyon. Je suis revenu parce qu'il n'y avait plus personne ici.",
     "Les stocks de ma pharmacie tiennent encore. Je les partage avec le cabinet medical.",
     "Une vache qui vele a trois heures du matin, ca ne se remet pas au lendemain.",
     "J'ai vu les premieres betes malades avant tout le monde. Personne ne m'a ecoute.",
     "Mon pere etait fermier. Il ne comprenait pas pourquoi je voulais des diplomes.",
     "Je sais endormir n'importe quoi de moins de six cents kilos. Ca a deja servi.",
     "Les chiens du bourg me connaissent tous. Ils ne m'aiment pas, mais ils me connaissent.",
     "Si vous trouvez une bete blessee, ne la laissez pas. Amenez-la-moi."]},
 {k:"imprimeur", n:"imprimeur", lt:"", bz:"imprimeur", w:1,
  st:{cardio:6,astuce:22,combat:4,tir:2}, ap:{fouille:29,troc:12},
  d:["Imprimerie et papeterie. Affiches, faire-part, le bulletin municipal.",
     "Ma presse a soixante ans et tourne a la manivelle. C'est ce qui la rend utile aujourd'hui.",
     "J'imprime les avis de la mairie. Personne ne les lit, je les imprime quand meme.",
     "J'ai repris l'atelier de mon patron quand il est mort. Il n'avait pas d'enfants.",
     "Il me reste du papier pour deux mille feuilles. C'est enorme et c'est deja peu.",
     "On m'a demande de reproduire des documents officiels. J'ai dit non. La premiere fois.",
     "L'encre, je la fabrique moi-meme depuis mars. Suie et huile de lin, comme au debut.",
     "Je connais chaque caractere de plomb de mon casier au toucher.",
     "Ma soeur tenait la papeterie a cote. Elle a ferme en janvier, avant tout le monde.",
     "Si vous avez besoin d'ecrire quelque chose que les gens liront, venez me voir."]},
 /* ---- LES CINQ METIERS QU'ON NE DIT PAS ----
    Ceux-la ne donnent pas leur metier : ils tournent autour, ils blaguent,
    ils changent de sujet. Mais les competences sont bien la, et c'est a elles
    qu'on les reconnait - un homme qui se dit "debrouillard" et qui a le
    crochetage d'un serrurier n'est pas un homme debrouillard.
    cv est la couverture : ce qui s'affiche sous leur nom a la place du
    metier. Personne ne se presente comme voleur. */
 {k:"voleur", n:"voleur", cv:"sans emploi", lt:"", w:0, cache:1,
  st:{cardio:16,astuce:26,combat:8,tir:6}, ap:{crochetage:26,discretion:26,fouille:22,vitesse:14},
  d:["Je fais des petits boulots a droite a gauche. Je suis un gars debrouillard, disons.",
     "Mon metier ? Disons que je rends service. On me demande, je trouve.",
     "Je n'ai jamais eu de patron et je compte bien que ca dure.",
     "J'ai des horaires souples. Tres souples. Surtout la nuit, en fait.",
     "On me demande ce que je fais, je reponds : ce qu'il faut. Ca satisfait tout le monde.",
     "Disons que je connais beaucoup de portes dans ce bourg. Et pas seulement les entrees.",
     "J'ai fait un peu de tout. Serrurier un temps. Enfin, quelque chose comme ca.",
     "Ne me demandez pas d'ou vient ce que je vends. Ca gache le plaisir.",
     "Je ne vole personne, moi. Je recupere ce qui trainait, nuance.",
     "Vous cherchez quelque chose de precis ? Je peux peut-etre le trouver. Contre quelque chose."]},
 {k:"receleur", n:"receleur", cv:"brocanteur", lt:"", w:0, cache:1,
  st:{cardio:6,astuce:26,combat:8,tir:4}, ap:{troc:28,fouille:31,discretion:18},
  d:["Brocante, si vous voulez. J'achete, je revends. Je ne demande pas la provenance.",
     "Tout a une valeur, il suffit de trouver qui la connait. C'est tout mon metier.",
     "J'ai un hangar plein de choses. Ne me demandez pas l'inventaire.",
     "On m'apporte, je paie, ca repart. Simple. Et personne n'a de nom.",
     "Je sais reconnaitre une piece de valeur au premier coup d'oeil. C'est un don, ou une habitude.",
     "Les gendarmes sont passes deux fois. Ils n'ont rien trouve, evidemment.",
     "J'etais antiquaire avant. Le mot fait plus serieux, c'est le meme travail.",
     "Ce qui se perd finit toujours par se retrouver. Chez moi, en general.",
     "Si vous avez quelque chose d'encombrant, je peux vous en debarrasser. Contre un bon prix.",
     "Je paie moins que ca ne vaut, et vous acceptez quand meme. C'est ca, le commerce."]},
 {k:"contrebandier", n:"contrebandier", cv:"transporteur", lt:"", w:0, cache:1,
  st:{cardio:18,astuce:24,combat:12,tir:14}, ap:{discretion:24,troc:20,portage:18,maniement:14,souffle:14},
  d:["Transport. Je deplace des choses d'un point a un autre. Ce qui est dedans ne me regarde pas.",
     "Je connais des chemins qui ne sont sur aucune carte. C'est mon fonds de commerce.",
     "J'ai fait la route toute ma vie. Les frontieres, ca m'a toujours paru theorique.",
     "On me paie pour ne pas poser de questions. C'est un talent, croyez-moi.",
     "Il y a des passages ou personne ne vous demandera rien. Je pourrais vous les montrer.",
     "J'ai eu un camion. J'ai eu un bateau. J'ai surtout eu de la chance.",
     "Le plus dur n'est pas de passer. C'est de savoir quand ne pas passer.",
     "Je livre a l'heure et je ne perds rien. Ma reputation, c'est tout ce que j'ai.",
     "On m'a arrete deux fois. Deux fois relache. Faites-en ce que vous voulez.",
     "Si vous avez besoin d'aller quelque part discretement, on peut en discuter."]},
 {k:"faussaire", n:"faussaire", cv:"graveur", lt:"", w:0, cache:1,
  st:{cardio:2,astuce:28,combat:2,tir:4}, ap:{crochetage:35,troc:18,fouille:16,stabilite:16},
  d:["Gravure, calligraphie, travaux delicats. J'ai la main plutot sure.",
     "Je reproduis des choses. Des documents, des tampons, ce qu'on me demande.",
     "J'ai fait les Beaux-Arts. On m'a dit que je n'en vivrais jamais. On avait tort.",
     "Un bon papier et une bonne encre font les trois quarts du travail. Le reste est de la patience.",
     "Ne me demandez pas ce que j'ai grave la semaine derniere. Vraiment.",
     "Les gens ont besoin de papiers en ce moment. Beaucoup de papiers.",
     "Je travaille seul, chez moi, volets fermes. C'est plus confortable pour tout le monde.",
     "Une signature, ca s'apprend en une soiree. Une ecriture entiere, ca prend une semaine.",
     "J'ai vu passer des tampons de prefecture qui n'existent plus. Ils marchent toujours.",
     "Si vous avez besoin d'un document, disons, difficile a obtenir, on peut en parler."]},
 {k:"braconnier", n:"braconnier", cv:"bucheron", lt:"", w:0, cache:1,
  st:{cardio:20,astuce:24,combat:12,tir:24}, ap:{discretion:26,stabilite:20,maniement:18,fouille:18,souffle:16},
  d:["Je coupe du bois, je pose des collets. Enfin, je coupe du bois surtout.",
     "Je passe mes nuits dehors. C'est plus tranquille et il y a moins de monde.",
     "Je connais chaque taillis a quinze kilometres. Chaque coulee, chaque passage.",
     "La chasse, moi ? J'ai un permis quelque part. Enfin, j'en avais un.",
     "Je ramene toujours de quoi manger. Ne me demandez pas comment.",
     "Le garde-chasse et moi, on a un arrangement. On ne se croise jamais.",
     "Mon pere m'emmenait la nuit quand j'avais huit ans. C'est comme ca qu'on apprend.",
     "Je tire a cent metres sans lunette. Ca surprend les gens qui me prennent pour un bucheron.",
     "Le gibier se rarefie. Ou alors c'est autre chose qui le mange avant moi.",
     "Si vous avez faim, je peux arranger ca. Ca restera entre nous."]},
 /* ---- LE GUIDE DU CHATEAU ----
    Un seul par carte, poste devant la porte, et il n'entre dans le tirage
    d'aucun bourg : w a zero et pas de lieu de travail, donc jobPool ne le
    prend jamais. On ne le trouve qu'en allant au chateau.
    Il est ce que le heros aurait du etre : la meme silhouette, l'epee au
    cote, et le Combat le plus haut du pays. */
 {k:"guide", n:"guide du chateau", lt:"", w:0,
  st:{cardio:22,astuce:14,combat:44,tir:6},
  ap:{frappe:14, parade:16, portage:8, vigueur:10},
  d:["Je garde la porte. Ce n'est pas mon chateau, mais quelqu'un doit le faire.",
     "J'ai visite chaque salle avant que ca tourne. Demandez-moi n'importe quel couloir.",
     "On m'a mis la pour les visites guidees. Il n'y a plus de visites. Il reste la garde.",
     "A l'epee, personne ici ne me tient tete. C'est une competence idiote, jusqu'au jour ou non.",
     "Les murs ont six pieds d'epaisseur. Ils ne se soucient pas de ce qui gratte dehors.",
     "Je connais le pays a la ronde. C'est mon metier de savoir ou menent les chemins.",
     "Les gens montaient jusqu'ici le dimanche. Maintenant ils ne montent plus, et je comprends.",
     "Je dors dans la loge. Une porte, une meurtriere, de quoi tenir un moment.",
     "On m'a propose de partir avec les autres. J'ai regarde la porte et je suis reste.",
     "Ne vous fiez pas au silence. Un chateau vide fait plus de bruit qu'un bourg plein."]},
 /* Le sans-metier ne se range pas dans la table : il n'a pas de profil, il a
    un tirage. Toutes ses aptitudes sortent entre 5 et 50, sauf deux qui
    montent entre 30 et 60 - ce sont ses deux dons, et il ne les a pas
    choisis. Il part donc plus bas que tout le monde, mais l'un de ses deux
    dons est sa specialite et ira jusqu'a 100 comme les autres. C'est le
    depart le plus rude et le moins previsible du jeu. */
 {k:"habitant", n:"habitant", lt:"", w:0, rnd:1,
  st:{cardio:0,astuce:0,combat:0,tir:0}, ap:{},
  d:["Je fais un peu de tout et rien de precis. On s'arrange, dans un bourg.",
     "J'etais interimaire en ville. Plus d'interim, plus de ville, me voila.",
     "Je garde les maisons de ceux qui sont partis. Ils m'ont laisse les clefs.",
     "Je donne un coup de main a la ferme quand il faut. Ca paie en legumes, c'est deja ca.",
     "Je suis arrive ici il y a deux ans. On me considere toujours comme un etranger.",
     "Je m'occupe de ma mere. Elle ne se leve plus. C'est un metier a plein temps.",
     "J'ai perdu mon travail en janvier, juste avant que tout le reste se perde aussi.",
     "Je repare des choses. Des velos, des radios, ce qu'on m'apporte. J'apprends en faisant.",
     "Je ne fais rien de mes journees et je ne m'en cache pas. Il n'y a plus grand-chose a faire.",
     "Ne me demandez pas mon metier. Ca ne veut plus dire grand-chose, un metier, aujourd'hui."]}
];
function jobDef(k){
    var i;
    for(i=0;i<JOBS.length;i++) if(JOBS[i].k===k) return JOBS[i];
    return JOBS[JOBS.length-1];
}
/* Ce qui s'affiche sous le nom. Les metiers caches donnent leur couverture :
   personne ne se presente comme voleur. Le vrai metier ne se lit nulle part -
   il se devine aux reponses evasives, et se confirme aux competences. */
function jobName(k){ var J=jobDef(k); return J.cv||J.n; }
/* Les competences d'un metier : l'ecart s'applique sur la base de 50, et la
   competence tire toutes ses aptitudes avec elle - un militaire a le Tir
   haut, et tout ce qui pend au Tir avec. Les aptitudes nommees s'ajoutent
   par-dessus. Tout reste borne de 5 a 100 : personne n'est nul a rien. */
function jobStats(k){
    var J=jobDef(k), sc=baseSec(), o={sec:sc}, q, i, dd;
    /* Les aptitudes d'abord : l'ecart de competence les pousse toutes les
       quatre, puis les specialites du metier s'ajoutent par-dessus. La
       competence n'est plus posee, elle se deduit - c'est statSync qui la
       calcule, et elle vaut donc exactement la moyenne de ses quatre. */
    for(i=0;i<STATDEF.length;i++){
        dd=J.st[STATDEF[i].k]||0;
        for(q=0;q<STATDEF[i].sec.length;q++)
            sc[STATDEF[i].sec[q].k]=clamp(50+dd*0.8,5,100);
    }
    for(q in J.ap) if(sc[q]!==undefined) sc[q]=clamp(sc[q]+J.ap[q],5,100);
    statSync(o);
    statBirth(o);
    return {stats:o.stats, sec:sc, sec0:o.sec0, spec:o.spec};
}
/* Ce qu'un bourg peut employer : on regarde ses batiments. Un metier dont le
   lieu n'existe pas ici n'existe pas ici non plus - il n'y a pas d'armurier
   sans armurerie. Le reste du bourg vaque : retraites et gens sans metier
   fixe, qui forment toujours le gros de la population. */
/* Le profil d'un personnage a sa naissance. Il part de la table du metier,
   et le sans-metier y substitue son tirage. Un seul appel par personnage :
   il consomme du flux SIM, l'appeler deux fois decalerait tout. */
function jobRoll(k){
    var J=jobDef(k), base=jobStats(k), sc={}, q, keys=[], i, a, b, tie;
    for(q in base.sec) { sc[q]=base.sec[q]; keys.push(q); }
    tie=rng();
    if(J.rnd){
        for(i=0;i<keys.length;i++) sc[keys[i]]=ri(5,50);
        a=(rng()*keys.length)|0;
        b=(rng()*(keys.length-1))|0; if(b>=a) b++;
        sc[keys[a]]=ri(30,60);
        sc[keys[b]]=ri(30,60);
    }
    var o={sec:sc};
    statSync(o);
    statBirth(o,tie);
    return {stats:o.stats, sec:sc, sec0:o.sec0, spec:o.spec};
}
function jobPool(v){
    var pool=[], i, j, has={}, ens={}, k;
    for(i=0;i<v.houses.length;i++){
        has[v.houses[i].k]=v.houses[i];
        /* l'enseigne d'un artisan vaut adresse au meme titre qu'un commerce */
        if(v.houses[i].biz&&!ens[v.houses[i].biz]) ens[v.houses[i].biz]=v.houses[i];
    }
    for(j=0;j<JOBS.length;j++){
        k=JOBS[j];
        if(k.lt&&k.w&&has[k.lt]){
            for(i=0;i<k.w;i++) pool.push({k:k.k, b:has[k.lt]});
            continue;
        }
        if(k.bz&&k.w&&ens[k.bz])
            for(i=0;i<k.w;i++) pool.push({k:k.k, b:ens[k.bz]});
    }
    /* Les cinq metiers qu'on ne dit pas : ils n'ont pas d'adresse et ne
       dependent d'aucun batiment, mais il y en a toujours un ou deux dans un
       bourg. Rares, sans quoi la moitie du pays serait faussaire. */
    for(j=0;j<JOBS.length;j++)
        if(JOBS[j].cache) pool.push({k:JOBS[j].k, b:null});
    /* le fond de population, toujours majoritaire. Les deux bornes se
       calculent AVANT de remplir : les mettre dans la condition de boucle
       faisait grandir la cible a chaque tour et le tableau ne s'arretait
       jamais - la memoire y passait avant la premiere image. */
    var nh=Math.max(4,pool.length), nr=Math.max(2,(pool.length/3)|0);
    for(i=0;i<nh;i++) pool.push({k:"habitant", b:null});
    for(i=0;i<nr;i++) pool.push({k:"retraite", b:null});
    return pool;
}
var HELLO=["Bonjour a vous.","Salut l'etranger.","Belle journee, non ?",
  "Vous n'etes pas d'ici, vous.","Tiens, de la visite.","Bonjour. Ca va, ca vient.",
  "On fait aller. Et vous ?","Vous cherchez quelque chose ?"];
