"use strict";
/* ================================================================
   TUAZ - 21-viedavant.js
   La vie d'avant : le passe de chaque habitant et les retrouvailles.
   (lignes 25093 a 25754 du mono-fichier d'origine)
   ================================================================ */
/* ================= LA VIE D'AVANT =================
   Avant que tout bascule, les habitants se parlent. Deux, parfois trois, qui
   se croisent et s'arretent un instant pour echanger quelques mots - la
   famille, les courses, et de plus en plus ce qu'on murmure sur la colline et
   le laboratoire. On ne le LIT qu'a l'ecran, dans une bulle au-dessus de celui
   qui parle : rien ne part au journal, qui va d'ailleurs disparaitre. Une
   replique a la fois, le temps de la lire, puis la suivante.

   Tout se defait des que la peur arrive : quarantaine declaree ou zombi
   proche, la conversation se rompt et chacun reprend sa route (ou sa fuite).
   La formation est deterministe - balayage cadence, tirages sur la graine -
   donc le rejeu retrouve les memes groupes et les memes mots. C'est un banc
   de test a venir (bench, plus tard) ; ceci est le mecanisme et une poignee
   de dialogues pour le voir vivre. La grande banque viendra ensuite. */
var CHATS=[];
var CHAT_R=44, CHAT_START=0.28, CHATSCAN=30, CHAT_LINE=3.0, CHAT_JOB=0.5;
/* Chaque script : une suite de [qui, ce qu'il dit]. qui vaut 0 ou 1 (ou 2 a
   trois). Moitie anodins, moitie rumeurs - jeu de test, court expres. */
var CHAT2=[
 [[0,"Tu as des nouvelles de ta soeur ?"],[1,"Elle rentre dimanche, si les trains veulent bien."],[0,"Embrasse-la pour moi."],[1,"Je n'y manquerai pas."]],
 [[0,"Il te reste du pain ? La boulangerie etait fermee."],[1,"Prends-en une, j'en ai trop cuit."],[0,"Tu me sauves la vie."],[1,"C'est rien, va."]],
 [[0,"Les gosses ont repris l'ecole ?"],[1,"Depuis lundi. La maison est enfin calme."],[0,"Profites-en bien."]],
 [[0,"Tu viens au marche demain matin ?"],[1,"Si le temps tient. Sinon je reste au chaud."],[0,"Comme toujours."],[1,"Comme toujours."]],
 [[0,"Ta toiture a tenu, cette nuit ?"],[1,"Une tuile de moins. Rien de grave."],[0,"Passe donc, j'ai une echelle."]],
 [[0,"Tu as entendu, pour l'usine sur la colline ?"],[1,"On dit qu'ils y font des essais. Sur des betes, parait-il."],[0,"Ma voisine dit pareil. Ca me met mal a l'aise."],[1,"Ce sont des ragots. N'ecoute pas tout."]],
 [[0,"Le fils Meunier est rentre fievreux de la ville."],[1,"Encore une grippe qui traine ?"],[0,"Sa mere dit que non. Que ca ne ressemble a rien de connu."],[1,"J'espere qu'ils l'ont vu a temps."]],
 [[0,"Il parait qu'un convoi militaire est passe cette nuit."],[1,"Vers le laboratoire ?"],[0,"Personne ne sait. Ils n'ont parle a personne."],[1,"Ca ne me dit rien de bon."]],
 [[0,"Ma cousine ne repond plus depuis deux jours."],[1,"La ligne, peut-etre ?"],[0,"Elle habite pres des labos, alors..."],[1,"Ne te fais pas d'idees. Elle rappellera."]],
 [[0,"Tu as vu le medecin fermer en plein apres-midi ?"],[1,"Rupture de stock, il parait. De tout."],[0,"Meme les masques ?"],[1,"Meme les masques. Va comprendre."]],
 [[0,"Tu as recu le courrier ?"],[1,"Rien que des factures."],[0,"Comme d'habitude."]],
 [[0,"Ton potager donne bien cette annee ?"],[1,"Les tomates, oui. Les courgettes, une catastrophe."],[0,"Trop d'eau."],[1,"C'est ce que je me dis."]],
 [[0,"Le car de sept heures est passe a l'heure ?"],[1,"En retard, comme tous les lundis."],[0,"Faudra que je parte plus tot."]],
 [[0,"Tu as fini de repeindre les volets ?"],[1,"Un cote. L'autre attendra le beau temps."],[0,"Sage decision."]],
 [[0,"La petite a perdu sa premiere dent."],[1,"Deja ? Ca file."],[0,"Trop vite, oui."]],
 [[0,"Tu passes a la ferme prendre des oeufs ?"],[1,"Ce soir, si j'ai le temps."],[0,"Prends-en une douzaine pour moi."]],
 [[0,"Il fait un froid de canard ce matin."],[1,"J'ai ressorti les gros pulls."],[0,"Bien raison."]],
 [[0,"Ton chien a retrouve le chemin tout seul ?"],[1,"Comme toujours. Il connait le bourg mieux que moi."],[0,"Malin, ce chien."]],
 [[0,"Tu as goute la confiture de la mere Alix ?"],[1,"Un pur delice. J'en ai repris trois pots."],[0,"Gourmand."]],
 [[0,"La fete du village tient toujours samedi ?"],[1,"Il parait. J'ai ressorti l'accordeon."],[0,"Pitie, pas l'accordeon."]],
 [[0,"Tu as vu le prix de l'essence ?"],[1,"Ne m'en parle pas. Je fais tout a velo."],[0,"Ca te fera les mollets."]],
 [[0,"Mon evier fuit encore."],[1,"Appelle le fils Boret, il s'y connait."],[0,"Je vais faire ca."]],
 [[0,"Tu descends au marche a pied ?"],[1,"Oui, ca me degourdit. Tu m'accompagnes ?"],[0,"Le temps de prendre mon panier."]],
 [[0,"La messe est a quelle heure dimanche ?"],[1,"Dix heures et demie. Le cure a decale."],[0,"Merci, je notais l'ancienne."]],
 [[0,"Ta belle-mere va mieux ?"],[1,"Sur pied. Increvable, celle-la."],[0,"Tant mieux pour vous."]],
 [[0,"Tu as rentre le bois avant la pluie ?"],[1,"Juste a temps. Une corde entiere."],[0,"Prevoyant."]],
 [[0,"Le boulanger ferme lundi, tu savais ?"],[1,"Ah non. Je prendrai double aujourd'hui."],[0,"Fais donc."]],
 [[0,"Ta fille passe son permis quand ?"],[1,"Le mois prochain. Elle ne dort plus."],[0,"Ca lui passera."]],
 [[0,"Tu as trouve un locataire pour la grange ?"],[1,"Un couple de la ville. Ils emmenagent bientot."],[0,"Du sang neuf, c'est bien."]],
 [[0,"Il te faut un coup de main pour la moisson ?"],[1,"Je ne dirais pas non. Samedi ?"],[0,"Compte sur moi."]],
 [[0,"Tu as retrouve tes lunettes ?"],[1,"Sur mon front, figure-toi."],[0,"Ca nous arrive a tous."]],
 [[0,"La fontaine coule encore trouble."],[1,"J'ai prevenu la mairie. On verra bien."],[0,"On verra, oui."]],
 [[0,"Tu regardes le match ce soir ?"],[1,"Si l'antenne veut bien. Elle fait des siennes."],[0,"Toujours au mauvais moment."]],
 [[0,"Tu pars en vacances cet ete ?"],[1,"Chez ma soeur, au bord de la mer. Huit jours."],[0,"Veinard."]],
 [[0,"La route du moulin est barree ?"],[1,"Depuis hier. Un arbre est tombe."],[0,"Faudra passer par le pont."]],
 [[0,"Tu as des nouvelles du vieux Cassin ?"],[1,"Toujours dans son fauteuil, a raler. Bon signe."],[0,"Ha, ce Cassin."]],
 [[0,"Mon chat a encore ramene une souris."],[1,"Cadeau du matin."],[0,"Charmant."]],
 [[0,"Tu viens jouer aux cartes ce soir ?"],[1,"Chez qui ?"],[0,"Chez Renaud. Il a sorti le cidre."],[1,"J'apporte les gateaux."]],
 [[0,"Ta cheminee tire mieux ?"],[1,"Depuis le ramonage, un vrai bonheur."],[0,"Faut que je pense au mien."]],
 [[0,"Tu as taille la haie ?"],[1,"A moitie. La cisaille a rendu l'ame."],[0,"Prends la mienne."]],
 [[0,"Ta jument a pouline ?"],[1,"Cette nuit. Une petite pouliche."],[0,"Quelle bonne nouvelle."]],
 [[0,"On a retrouve le chat des Vasseur ?"],[1,"Sous le hangar, tout tremblant."],[0,"Ces betes, quand meme."]],
 [[0,"Tu me pretes ta remorque samedi ?"],[1,"Elle est a toi. Rends-la avec le plein."],[0,"Comme d'habitude, oui."]],
 [[0,"Le puits du bas est-il encore bon ?"],[1,"L'eau y est fraiche et claire."],[0,"Tant mieux, le mien baisse."]],
 [[0,"Tu as pense a l'anniversaire de ta mere ?"],[1,"Demain ! Tu me sauves. J'allais oublier."],[0,"Cours lui prendre des fleurs."]],
 [[0,"On dit que l'hopital du chef-lieu ne prend plus personne."],[1,"Complet ?"],[0,"Ferme. Portes closes, gardees."],[1,"Gardees par qui ?"]],
 [[0,"Tu as senti cette odeur, vers la riviere ?"],[1,"Comme du brule, mais douceatre."],[0,"Ca descend de la-haut, de l'usine."],[1,"N'y va pas voir."]],
 [[0,"Le facteur n'est pas passe depuis trois jours."],[1,"Chez moi non plus."],[0,"On dit que les routes du nord sont coupees."],[1,"Coupees comment ?"]],
 [[0,"Ma radio ne capte plus qu'un gresillement."],[1,"La mienne aussi, depuis hier soir."],[0,"Et la television ?"],[1,"Rien que de la neige."]],
 [[0,"Le medecin est parti en pleine nuit, sacoche a la main."],[1,"Une urgence ?"],[0,"Il n'est pas revenu."],[1,"Ca fait deux jours."]],
 [[0,"Tu as vu les camions baches, sur la departementale ?"],[1,"Toute la nuit. Sans phares."],[0,"Vers ou ?"],[1,"La colline. Toujours la colline."]],
 [[0,"La femme du fermier delire de fievre, parait-il."],[1,"On a appele le medecin ?"],[0,"Introuvable. Ils l'ont mise a l'ecart, dans la grange."],[1,"A l'ecart ?"]],
 [[0,"On raconte qu'un homme a mordu un gendarme, en ville."],[1,"Mordu ?"],[0,"Comme une bete. A trois, ils l'ont maitrise."],[1,"Tu inventes."]],
 [[0,"Les cloches n'ont pas sonne ce matin."],[1,"Le cure est souffrant ?"],[0,"Personne ne l'a vu depuis dimanche."],[1,"C'est mauvais signe."]],
 [[0,"On dit que l'eau du puits rend malade."],[1,"Qui raconte ca ?"],[0,"Les Vidal. Toute la famille est alitee."],[1,"Je ne bois plus que du vin, alors."]],
 [[0,"Tu as remarque, plus un chien qui aboie la nuit ?"],[1,"Un silence a faire peur."],[0,"Ils sentent quelque chose."],[1,"Ne dis pas ca."]],
 [[0,"Le pont du nord est garde par des soldats."],[1,"Depuis quand ?"],[0,"Ce matin. On ne passe plus."],[1,"Et ceux qui travaillent de l'autre cote ?"]],
 [[0,"Ma cousine dit qu'en ville les magasins sont vides."],[1,"La panique."],[0,"Elle a fait des reserves. Elle me dit d'en faire."],[1,"Tu crois que je devrais ?"]],
 [[0,"Il y a eu des cris cette nuit, du cote des Marchand."],[1,"J'ai entendu aussi."],[0,"Ce matin, volets clos. Personne."],[1,"Faudrait aller voir."]],
 [[0,"On dit que ce qui s'echappe de l'usine, ce n'est pas une fumee."],[1,"C'est quoi, alors ?"],[0,"Personne n'ose le dire."],[1,"Alors n'en parlons plus."]],
 [[0,"Le laboratoire a double ses gardes cette semaine."],[1,"Comment tu sais ca ?"],[0,"Mon beau-frere y livrait. Il n'y va plus."],[1,"Pourquoi il n'y va plus ?"]],
 [[0,"Tu as vu passer l'ambulance sans sirene ?"],[1,"Trois fois aujourd'hui."],[0,"Trois fois, et jamais dans l'autre sens."],[1,"Elles ne ramenent personne."]],
 [[0,"La maitresse a renvoye les enfants a midi."],[1,"Pourquoi ?"],[0,"Trop d'absents. La moitie de la classe, malade."],[1,"En une nuit ?"]],
 [[0,"On parle d'une quarantaine, en ville."],[1,"Une quoi ?"],[0,"On boucle les quartiers. Personne n'entre ni ne sort."],[1,"Ici, ca n'arrivera pas."]],
 [[0,"Le vieux Perrin jure avoir vu un homme marcher sans vie."],[1,"Sans vie ?"],[0,"Ce sont ses mots."],[1,"Il a bu, c'est tout."]],
 [[0,"Les betes du pre se sont sauvees vers le bas."],[1,"D'un coup ?"],[0,"Toutes ensemble cette nuit. Cloture cassee."],[1,"Elles fuyaient quoi ?"]],
 [[0,"Mon frere devait rentrer hier. Rien."],[1,"Le telephone ?"],[0,"Sonne dans le vide."],[1,"Attends encore un jour. Juste un."]],
 [[0,"On a livre des caisses a la mairie, sous baches."],[1,"Quel genre de caisses ?"],[0,"Longues. Le maire n'a rien voulu dire."],[1,"Longues comment ?"]],
 [[0,"Il parait que la pharmacie a tout donne en un matin."],[1,"Tout ?"],[0,"Masques, alcool, compresses. Vide a midi."],[1,"Les gens savent quelque chose."]],
 [[0,"Tu crois a ces histoires de maladie ?"],[1,"Je ne sais plus quoi croire."],[0,"Moi non plus. Et c'est ca le pire."],[1,"Oui. Ne plus savoir."]],
 [[0,"Le boucher a ferme et cloue ses volets."],[1,"En plein jour ?"],[0,"Parti au sud avec les siens."],[1,"Il en sait plus que nous."]],
 [[0,"On dit que l'usine, c'est l'armee qui la tient."],[1,"Depuis quand l'armee fait de la peinture ?"],[0,"C'est bien la question."],[1,"Tais-toi, on nous regarde."]],
 [[0,"La ligne du bourg est coupee depuis ce matin."],[1,"La mienne marche encore."],[0,"Profites-en pour appeler les tiens."],[1,"Tu me fais peur, la."]],
 [[0,"J'ai vu de la lumiere a l'usine toute la nuit."],[1,"Ils travaillent tard."],[0,"Non. Des projecteurs, braques vers l'exterieur."],[1,"Pour eclairer quoi ?"]],
 [[0,"Tu as fait des reserves ?"],[1,"Un peu de conserves. Pourquoi ?"],[0,"Fais-en plus. Pendant qu'il en reste."],[1,"Tu sais quelque chose, toi."]],
 [[0,"Ils condamnent la route de l'usine."],[1,"Avec quoi ?"],[0,"Des herses, des sacs. Comme en guerre."],[1,"En guerre contre quoi ?"]],
 [[0,"Ma voisine tousse depuis trois jours et ne sort plus."],[1,"Tu es allee voir ?"],[0,"Elle crie de rester dehors. Pour mon bien."],[1,"Ecoute-la."]],
 [[0,"Le maire a recu un appel de la prefecture, parait-il."],[1,"Et alors ?"],[0,"Il en est ressorti blanc comme un linge."],[1,"Personne ne sait ce qui s'est dit."]],
 [[0,"Tu sens ce silence, le soir ? Plus un moteur."],[1,"Les gens ne sortent plus."],[0,"Ou ils sont deja partis."],[1,"Nous, on reste ?"]],
 [[0,"Il parait qu'a l'hopital on ne rend plus les corps."],[1,"Comment ca, on ne les rend plus ?"],[0,"On les garde. On les brule, meme."],[1,"Tais-toi. Ne repete pas ca."]],
 [[0,"Le rosier de ta cour a repris ?"],[1,"Deux boutons ce matin. J'etais si content."],[0,"Ta femme va etre ravie."]],
 [[0,"Tu as retrouve tes cles de grange ?"],[1,"Dans la poche de l'autre veste, comme toujours."],[0,"On est bien pareils."]],
 [[0,"On dit que les Thierry ont barricade leur porte."],[1,"De l'interieur ?"],[0,"Et ils ne repondent plus a personne."],[1,"Laisse-les. Chacun se protege comme il peut."]]
];
var CHAT3=[
 [[0,"On se retrouve pour la peche dimanche ?"],[1,"Moi je viens."],[2,"Moi aussi, si ma femme me laisse partir."],[0,"Alors c'est dit."]],
 [[0,"Vous avez remarque, plus un oiseau vers la colline ?"],[1,"Maintenant que tu le dis..."],[2,"Mon chien refuse d'aller par la depuis une semaine."],[0,"Les betes sentent des choses avant nous."],[1,"Tu me files la chair de poule."]],
 [[0,"Vous venez au marche demain ?"],[1,"Moi oui."],[2,"Moi je garde les petits."],[0,"On te ramenera des fruits."],[2,"Vous etes des amours."]],
 [[0,"Qui arrose le jardin du cure pendant son absence ?"],[1,"Moi le lundi."],[2,"Moi le jeudi."],[0,"Parfait, il ne saura rien."]],
 [[0,"On refait l'equipe de boules dimanche ?"],[1,"Present."],[2,"Si mon dos tient."],[0,"On te mettra pointeur, alors."]],
 [[0,"La kermesse, on la tient ou cette annee ?"],[1,"Sur la place, comme toujours."],[2,"S'il ne pleut pas."],[0,"Il ne pleuvra pas. J'ai decide."]],
 [[0,"Le four du village est repare ?"],[1,"Depuis hier."],[2,"Je fais du pain jeudi, alors."],[0,"Garde-m'en une miche."]],
 [[0,"Vos enfants rentrent pour les fetes ?"],[1,"Les deux, avec les petits."],[2,"Le mien, on verra. Le travail."],[0,"Qu'il vienne au moins un jour."]],
 [[0,"On se cotise pour le cadeau de la maitresse ?"],[1,"Je mets pour deux."],[2,"Compte sur moi."],[0,"On lui prendra un beau chale."]],
 [[0,"La riviere est bien basse, vous avez vu ?"],[1,"Jamais vu si peu d'eau en juin."],[2,"Bon pour la peche, mauvais pour les champs."],[0,"C'est toujours l'un ou l'autre."]],
 [[0,"Le bal du quatorze, on invite l'orchestre d'a cote ?"],[1,"Ils sont chers."],[2,"Mais ils sont bons."],[0,"Alors on fait une quete."]],
 [[0,"Vous avez remarque, le ciel est jaune vers la colline ?"],[1,"Depuis ce matin."],[2,"Ca ne ressemble a aucun nuage."],[0,"Rentrons le linge, au cas ou."],[1,"Rentrons surtout les enfants."]],
 [[0,"On dit que le chef-lieu est boucle."],[1,"Ma soeur y habite."],[2,"Elle repond encore ?"],[1,"Plus depuis hier soir."],[0,"Elle economise sa batterie, c'est tout."]],
 [[0,"Trois familles ont plie bagage cette nuit."],[1,"Sans un mot ?"],[2,"Les Fabre, les Louis, les Georges. Au sud."],[0,"Ils savent quelque chose qu'on ignore."],[1,"Ou ils ont juste peur, comme nous."]],
 [[0,"Le medecin a laisse un mot sur sa porte."],[1,"Il dit quoi ?"],[2,"De ne pas approcher les malades. De prevenir la gendarmerie."],[0,"Et la gendarmerie ?"],[2,"Ne repond plus."]],
 [[0,"On a entendu tirer, la nuit, vers l'usine."],[1,"Des chasseurs ?"],[2,"A cette heure ? Non."],[0,"Alors quoi ?"],[1,"Je prefere ne pas y penser."]],
 [[0,"On va nous distribuer des masques a la mairie."],[1,"Pourquoi des masques ?"],[2,"Contre la maladie qui vient de la ville."],[0,"Alors elle vient vraiment."],[1,"Il faut croire."]],
 [[0,"Le pere Simon dit avoir tire sur un rodeur cette nuit."],[1,"Et alors ?"],[2,"Il dit que l'homme s'est releve."],[0,"Le pere Simon boit."],[2,"Peut-etre. Mais il ne riait pas, ce matin."]],
 [[0,"Vous fermez a clef, vous, maintenant ?"],[1,"Depuis trois nuits."],[2,"Moi aussi. Et je laisse la lumiere."],[0,"On en est la, alors."],[1,"On en est la."]]
];
/* ---- LES DIALOGUES DE METIER ----
   Quand l'un des deux exerce un metier, il parle parfois de son travail : le
   professionnel est toujours l'index 0, chatBegin le place en premier. Un
   melange de quotidien professionnel et de ce que sa fonction lui fait voir de
   la menace qui monte - le flic et ses appels, le militaire et ses ordres, le
   medecin et ses fievres. */
var CHATJOB={
 policier:[
  [[0,"Encore un vol de poules signale ce matin."],[1,"Vous allez enqueter ?"],[0,"Sur des poules ? J'ai fait le tour, j'ai note. C'est deja ca."]],
  [[0,"On m'a rapporte ma plaque a la mairie."],[1,"Elle etait ou ?"],[0,"Trouvee sur la route. Les gens sont honnetes, ici. Ca fait du bien."]],
  [[0,"Verrouillez bien la nuit, en ce moment."],[1,"Vous conseillez ca a tout le monde ?"],[0,"A tout le monde, oui."],[1,"Vous savez quelque chose ?"]],
  [[0,"On a recu un drole d'appel du chef-lieu."],[1,"Quel genre ?"],[0,"Je n'ai pas le droit d'en parler."],[1,"Alors c'est grave."]],
  [[0,"Deux disparitions signalees cette semaine."],[1,"Deux ? Ici ?"],[0,"Des gens partis voir de la famille, sans doute. Sans doute."]],
  [[0,"Si vous croisez quelqu'un de blesse et confus, ne l'approchez pas."],[1,"Pourquoi ?"],[0,"Venez me chercher. Promettez-le-moi."],[1,"Vous me faites peur."]],
  [[0,"On m'a demande de recenser les armes du bourg."],[1,"Pour quoi faire ?"],[0,"Ordre d'en haut. Je ne pose plus de questions."]],
  [[0,"J'ai double mes rondes de nuit."],[1,"Vous dormez quand ?"],[0,"Peu. Mais je dors mieux en marchant qu'au lit, ces temps-ci."]]
 ],
 militaire:[
  [[0,"On tient la caserne, mais les ordres ne viennent plus."],[1,"Et vous faites quoi ?"],[0,"On nettoie nos armes. On regarde la route."]],
  [[0,"Ne montez pas vers l'usine. Jamais."],[1,"Pourquoi donc ?"],[0,"Consigne. Et un bon conseil, en plus de la consigne."]],
  [[0,"Ma section etait de vingt. Nous sommes six."],[1,"Et les autres ?"],[0,"Ne me le demandez pas. Pas aujourd'hui."]],
  [[0,"On a recu des caisses scellees cette nuit."],[1,"Des munitions ?"],[0,"Je n'ai pas ouvert. On m'a dit de ne pas ouvrir."]],
  [[0,"Si vous voyez une colonne sur la route, ecartez-vous."],[1,"Ils s'arreteraient pas ?"],[0,"Ils ne s'arretent plus. C'est tout ce que je sais."]],
  [[0,"Le pont, c'est nous qui le tenons maintenant."],[1,"Depuis quand l'armee garde les ponts ?"],[0,"Depuis qu'on nous l'a ordonne. Ne cherchez pas plus loin."]],
  [[0,"Je m'entraine chaque matin. Les autres ont arrete."],[1,"Ils se reposent, c'est tout."],[0,"Non. Pas cette semaine."]],
  [[0,"On a distribue des masques a la troupe."],[1,"Contre quoi ?"],[0,"On ne nous l'a pas dit. Et ca m'inquiete plus que tout."]]
 ],
 soldat:[
  [[0,"Huit jours que je garde cette maison. Personne pour me relever."],[1,"On vous nourrit, au moins ?"],[0,"Les gens d'ici sont braves. Ca aide."]],
  [[0,"La nuit, j'entends des choses vers les champs."],[1,"Des betes ?"],[0,"Peut-etre. Le jour il n'y a rien. Je prefere le jour."]],
  [[0,"Il me reste deux chargeurs. Je compte chaque coup."],[1,"Vous en aurez d'autres ?"],[0,"On verra. Pour l'instant, je compte."]],
  [[0,"Mon sergent est parti au nord avec la moitie de la section."],[1,"Pas vous ?"],[0,"Ma consigne, c'est de tenir ici. Je tiens ici."]],
  [[0,"On m'a donne un fusil et dit de regarder la route."],[1,"Vous etiez quoi, avant ?"],[0,"Mecanicien. Ca me manque, les moteurs."]],
  [[0,"Si ca tourne mal, je ne bougerai pas d'ici."],[1,"Meme seul ?"],[0,"C'est le seul endroit ou je sers a quelque chose."]]
 ],
 pompier:[
  [[0,"On sort moins pour le feu qu'avant."],[1,"Pour quoi, alors ?"],[0,"Pour autre chose. Et ca ne s'eteint pas avec de l'eau."]],
  [[0,"Il reste de quoi tenir deux departs dans les cuves."],[1,"Et apres ?"],[0,"Apres, on regardera bruler. J'espere ne pas y arriver."]],
  [[0,"Je connais chaque maison du bourg par l'interieur."],[1,"Ca doit servir."],[0,"Plus que jamais, ces jours-ci."]],
  [[0,"On nous a appeles trois fois cette nuit."],[1,"Des incendies ?"],[0,"Des gens a sortir de chez eux. C'est nouveau, ca."]],
  [[0,"Gardez une echelle a portee, et une sortie a l'arriere."],[1,"Vous prechez le pire."],[0,"Je prepare au pire. C'est mon metier."]],
  [[0,"Mon binome est reste dans une cage d'escalier, il y a des annees."],[1,"Je suis desole."],[0,"J'y pense a chaque depart. Aujourd'hui plus encore."]],
  [[0,"On m'a appris a entrer quand tout le monde sort."],[1,"C'est courageux."],[0,"C'est surtout dur a desapprendre."]]
 ],
 soignant:[
  [[0,"Mes stocks sont a sec depuis un mois."],[1,"Vous soignez comment ?"],[0,"A la parole et a l'eau bouillie. Ca tient les gens, un temps."]],
  [[0,"J'ai vu trois fievres cette semaine qui ne ressemblent a rien."],[1,"A rien de connu ?"],[0,"A rien du tout. Et ca m'empeche de dormir."]],
  [[0,"Si quelqu'un est mordu, amenez-le-moi vite."],[1,"Mordu par quoi ?"],[0,"Par n'importe quoi. Vite, c'est tout ce qui compte."]],
  [[0,"Ma consoeur du bourg voisin ne repond plus."],[1,"Vous irez voir ?"],[0,"Je n'ai pas le courage. Que Dieu me pardonne."]],
  [[0,"Lavez-vous les mains. Encore. Toujours."],[1,"Vous vous repetez, docteur."],[0,"Je me repeterai jusqu'a ce que ca rentre."]],
  [[0,"On m'a demande de signaler toute fievre a la prefecture."],[1,"Et vous le faites ?"],[0,"Je le faisais. La prefecture ne repond plus."]],
  [[0,"Gardez vos enfants a la maison quelques jours."],[1,"Et l'ecole ?"],[0,"L'ecole attendra. Leur sante, non."]],
  [[0,"J'ai mis une seringue de cote, a part."],[1,"Pour un patient ?"],[0,"Vous devinez pour qui. N'en parlons plus."]]
 ],
 fermier:[
  [[0,"Mes betes se sont sauvees vers le bas cette nuit."],[1,"Toutes ?"],[0,"D'un coup, la cloture cassee. Jamais vu ca en trente ans."]],
  [[0,"Il faut nourrir les betes meme quand le monde s'ecroule."],[1,"Vous croyez qu'il s'ecroule ?"],[0,"Je ne sais pas. Mais je les nourris quand meme."]],
  [[0,"La recolte est bonne, au moins."],[1,"C'est deja ca."],[0,"C'est bien la seule chose de bon cette annee."]],
  [[0,"Le tracteur est en panne, je fais tout a la main."],[1,"Ca prend le double de temps."],[0,"Ca me tient debout. C'est ce qu'il me faut."]],
  [[0,"Une odeur descend de la colline, le matin."],[1,"Vous la sentez aussi ?"],[0,"Mes chiens ne veulent plus aller par la. Ca me suffit."]],
  [[0,"J'ai rentre du grain pour tenir l'hiver."],[1,"L'hiver est loin."],[0,"On ne sait jamais. Mieux vaut plein que vide."]],
  [[0,"Ma femme est partie chez sa soeur, de l'autre cote."],[1,"Bien arrivee ?"],[0,"Je ne sais pas. La ligne ne passe plus."]]
 ],
 pecheur:[
  [[0,"Je sors le bateau moins loin qu'avant."],[1,"Le poisson se fait rare ?"],[0,"Le poisson, oui. Et je n'aime pas ce qui remonte avec, ces temps-ci."]],
  [[0,"J'ai appris a lire le ciel avant les lettres."],[1,"Il dit quoi, le ciel ?"],[0,"Rien de bon pour la semaine. Rien de bon du tout."]],
  [[0,"Mon frere n'est pas rentre en mars."],[1,"En mer ?"],[0,"On n'a rien retrouve. On ne retrouve jamais rien, en mer."]],
  [[0,"Il y a des jours ou je reste au large jusqu'a la nuit."],[1,"Ca ne vous pese pas, seul ?"],[0,"Au contraire. Personne pour crier. C'est bien."]],
  [[0,"J'ai vu des lumieres sur l'eau, cette nuit, vers le port."],[1,"Des bateaux ?"],[0,"Sans feux de position. Aucun pecheur ne fait ca."]],
  [[0,"Le quai est desert depuis deux jours."],[1,"Personne ne vend plus ?"],[0,"Personne ne vient plus. Meme les mouettes ont file."]]
 ]
};
/* ---- LES BULLES D'APRES L'EXPLOSION ----
   Une fois le laboratoire ouvert, les passants ne parlent plus que de ca. */
var CHATRUM=[
 [[0,"Tu as entendu la detonation ? Ca venait du laboratoire."],[1,"Tout le monde l'a entendue. Personne n'ose rien dire."],[0,"C'est ca qui me fait peur."]],
 [[0,"On raconte que les portes du labo ont saute."],[1,"Et qu'il en sort des choses. Des gens... plus tout a fait des gens."],[0,"Ne dis pas ca."]],
 [[0,"Ma cousine a vu quelqu'un marcher de travers, tout gris."],[1,"Un malade, surement."],[0,"Il ne saignait pas. Il aurait du saigner."]],
 [[0,"Il parait qu'il ne faut surtout pas se faire mordre."],[1,"Mordre par qui ?"],[0,"Justement. Personne ne veut le dire tout haut."]],
 [[0,"Tu fermes ta porte a clef, ce soir ?"],[1,"A clef, et la commode devant."],[0,"Je crois que je vais faire pareil."]],
 [[0,"Le labo, la fumee, les gens qui changent... ca fait beaucoup."],[1,"Ca fait trop. On aurait du partir hier."],[0,"On peut encore. Non ?"]],
 [[0,"Ils disaient que c'etaient des ragots, pour le laboratoire."],[1,"Ils ne le disent plus, tu remarqueras."],[0,"Oui. Plus personne ne rit."]],
 [[0,"Tu crois ce qu'on raconte, toi ?"],[1,"Apres ce que j'ai vu ce matin ? Je crois tout, maintenant."],[0,"Alors on est deux."]]
];
function chatFree(n){
    return n&&!n.dead&&!n.gone&&!n.recruited&&!n.inb&&!n.hidden&&
           !(n.fear>0)&&!n.go&&!n.chat&&!(n.chatCd>0);
}
function chatBegin(a,b,v){
    var people, c=null, k, o, mx=(a.x+b.x)/2, my=(a.y+b.y)/2, sc=null;
    /* Apres l'explosion du laboratoire, on ne parle plus que de ca. */
    if(G&&G.pro0>=0){ people=[a,b]; sc=CHATRUM[(rng()*CHATRUM.length)|0]; }
    /* Sinon, si l'un des deux exerce un metier qui a ses propres repliques, il
       en parle une fois sur deux, et c'est lui qui parle en premier (index 0). */
    if(!sc){
        var ja=a.job&&CHATJOB[a.job], jb=b.job&&CHATJOB[b.job];
        if(ja&&rng()<CHAT_JOB){ people=[a,b]; sc=ja[(rng()*ja.length)|0]; }
        else if(jb&&rng()<CHAT_JOB){ people=[b,a]; sc=jb[(rng()*jb.length)|0]; }
    }
    if(!sc){
        /* sinon la banque generale, avec parfois un troisieme larron */
        for(k=0;k<v.villagers.length;k++){
            o=v.villagers[k];
            if(o===a||o===b||!chatFree(o)) continue;
            if(dist2(o.x,o.y,mx,my)<CHAT_R*CHAT_R){ c=o; break; }
        }
        var three=(c&&rng()<0.4&&CHAT3.length>0);
        var bank=three?CHAT3:CHAT2;
        sc=bank[(rng()*bank.length)|0];
        people=three?[a,b,c]:[a,b];
    }
    var ch={people:people, lines:sc, li:0, spk:sc[0][0], t:CHAT_LINE}, i2;
    for(i2=0;i2<people.length;i2++) people[i2].chat=ch;
    /* ils se tournent les uns vers les autres */
    a.face=(b.x<a.x)?-1:1; b.face=(a.x<b.x)?-1:1;
    if(people.length>2&&c) c.face=(mx<c.x)?-1:1;
    CHATS.push(ch);
}
function chatForm(){
    if(proFear()) return;                 /* plus de babillage une fois la peur venue */
    var p=G.p, i, v, j, k, a, o, b;
    /* AVANT L'EXPLOSION, une seule conversation a la fois dans les parages ;
       APRES, on en tolere deux en meme temps - le pays ne parle plus que de ca. */
    var nearC=0, limC=(G&&G.pro0>=0)?2:1;
    for(i=0;i<CHATS.length;i++){ var c0=CHATS[i].people[0];
        if(c0&&dist2(c0.x,c0.y,p.x,p.y)<640*640) nearC++; }
    if(nearC>=limC) return;
    for(i=0;i<VILLAGES.length;i++){
        v=VILLAGES[i];
        if(dist2(v.x,v.y,p.x,p.y)>800*800) continue;
        for(j=0;j<v.villagers.length;j++){
            a=v.villagers[j];
            if(!chatFree(a)||dist2(a.x,a.y,p.x,p.y)>560*560) continue;
            b=null;
            for(k=j+1;k<v.villagers.length;k++){
                o=v.villagers[k];
                if(!chatFree(o)) continue;
                if(dist2(a.x,a.y,o.x,o.y)<CHAT_R*CHAT_R){ b=o; break; }
            }
            if(!b) continue;
            if(rng()<CHAT_START){ chatBegin(a,b,v); return; }  /* une seule par balayage */
        }
    }
}
function chatEnd(ch){
    var k, n;
    for(k=0;k<ch.people.length;k++){
        n=ch.people[k]; if(!n||n===G.p) continue;   /* le joueur n'est pas gere ici */
        n.chat=null; n.chatCd=rr(25,55); n.wt=rr(1,3);
    }
}
function chatStep(dt){
    var i, ch, k, brk, n, dmax;
    for(i=CHATS.length-1;i>=0;i--){
        ch=CHATS[i];
        /* la crise fait taire le bavardage ordinaire, mais pas une bulle
           forcee (l'ordre du flic) ni un echange de quete (les retrouvailles) */
        brk=(!(ch.forced||ch.quest))&&proFear();
        for(k=0;k<ch.people.length&&!brk;k++){
            n=ch.people[k];
            if(n===G.p) continue;   /* le joueur ne rompt pas la conversation */
            if(!n||n.dead||n.gone||n.fear>0||n.inb||n.hidden||n.recruited) brk=true;
        }
        /* trop eloignes : le groupe se defait (le joueur a un peu plus de mou) */
        dmax=ch.quest?140:80;
        if(!brk&&ch.people.length>=2&&
           dist2(ch.people[0].x,ch.people[0].y,ch.people[1].x,ch.people[1].y)>dmax*dmax) brk=true;
        if(brk){ if(ch.quest&&ch.qstep) ch.qstep.dlgOn=0; chatEnd(ch); CHATS.splice(i,1); continue; }
        ch.t-=dt;
        if(ch.t<=0){
            ch.li++;
            if(ch.li>=ch.lines.length){
                if(ch.quest&&ch.qstep) questFinishStep(ch.qstep);
                chatEnd(ch); CHATS.splice(i,1); continue;
            }
            ch.spk=ch.lines[ch.li][0];
            ch.t=CHAT_LINE;
        }
    }
}
function updChats(dt){
    if((G.tick%CHATSCAN)===0) chatForm();
    chatStep(dt);
}
/* la bulle : fond sombre, texte clair, une petite queue vers la tete. Texte
   court coupe en lignes. Purement visuel. */
function bubble(cx0,cy0,txt){
    ctx.font="10px 'Courier New',monospace";
    var maxw=140, words=txt.split(" "), lines=[], cur="", i, ww;
    for(i=0;i<words.length;i++){
        ww=cur?cur+" "+words[i]:words[i];
        if(ctx.measureText(ww).width>maxw&&cur){ lines.push(cur); cur=words[i]; }
        else cur=ww;
    }
    if(cur) lines.push(cur);
    var lh=13, pad=5, tw=0;
    for(i=0;i<lines.length;i++) tw=Math.max(tw,ctx.measureText(lines[i]).width);
    var bw=tw+pad*2, bh=lines.length*lh+pad*2, bx=Math.round(cx0-bw/2), by=Math.round(cy0-bh);
    ctx.fillStyle="rgba(20,17,11,0.92)"; ctx.strokeStyle="#8a6a3e"; ctx.lineWidth=1;
    ctx.fillRect(bx,by,bw,bh); ctx.strokeRect(bx+0.5,by+0.5,bw,bh);
    ctx.fillStyle="rgba(20,17,11,0.92)";
    ctx.beginPath(); ctx.moveTo(cx0-3,by+bh); ctx.lineTo(cx0+3,by+bh); ctx.lineTo(cx0,by+bh+5); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#f0e0c0"; ctx.textAlign="center";
    for(i=0;i<lines.length;i++) ctx.fillText(lines[i],cx0,by+pad+lh*(i+1)-3);
    ctx.textAlign="left";
}
function drawChats(cx,cy){
    /* UNE SEULE BULLE A L'ECRAN : on ne peint que le locuteur le plus proche
       du joueur, parmi les conversations visibles. */
    var i, ch, n, sx, sy, best=null, bd=1e9, bsx=0, bsy=0, dd;
    for(i=0;i<CHATS.length;i++){
        ch=CHATS[i]; n=ch.people[ch.spk]; if(!n||n.dead) continue;
        sx=n.x-cx; sy=n.y-cy;
        if(sx<-60||sx>700||sy<-40||sy>400) continue;
        dd=dist2(n.x,n.y,G.p.x,G.p.y);
        if(dd<bd){ bd=dd; best=ch; bsx=Math.round(sx); bsy=Math.round(sy); }
    }
    if(best) bubble(bsx,bsy-28,best.lines[best.li][1]);
}
function updVillages(dt){
    var Math=DMATH;
    var p=G.p, i, j, v, n;
    for(i=0;i<VILLAGES.length;i++){
        v=VILLAGES[i];
        if(dist2(v.x,v.y,p.x,p.y)>900*900) continue;
        /* villageois */
        for(j=0;j<v.villagers.length;j++){
            n=v.villagers[j];
            if(n.dead) continue;
            /* ---- CEUX QUI NOUS SUIVENT ----
               Une recrue ne vaque plus : elle marche derriere. Chacun a sa
               place dans le sillage, en quinconce, pour qu'ils ne se
               marchent pas dessus. Sans recherche de chemin ils butent sur
               les facades comme tout le monde : celui qui se laisse trop
               distancer nous rattrape d'un coup, faute de mieux. */
            if(n.recruited) continue;
            /* le temps d'oubli entre deux conversations descend, et celui qui
               discute reste plante la, tourne vers l'autre, jusqu'a la fin de
               l'echange (ou jusqu'a ce que la peur le disperse) */
            if(n.chatCd>0){ n.chatCd-=dt; if(n.chatCd<0) n.chatCd=0; }
            if(n.chat){ collide(n,4); continue; }
            /* Ils ne fuient jamais le joueur. Ils arpentent tout le bourg, la
               repartition etant uniforme en surface pour eviter les
               attroupements au centre, et rentrent chez eux la nuit. */
            var spd=25;
            if(n.inb){
                /* dedans : il ressort au jour, ou apres une visite */
                n.wt-=dt;
                if((!G.night||!n.night)&&n.wt<=0){
                    n.inb=false; n.night=false;
                    n.x=n.hx; n.y=n.hy+16; n.wt=rr(1,3);
                }
                continue;
            }
            if(G.night&&!n.night&&n.home&&!n.qtgt){
                /* 90 pour cent des habitants regagnent leur toit */
                n.night=true;
                if(rng()<0.9){ n.tx=n.home.x+n.home.w/2; n.ty=n.home.y+n.home.h+12; n.go=1; }
            }
            if(!G.night) n.night=false;
            /* un habitant coince par un mur finit par rentrer quand meme :
               sans recherche de chemin, mieux vaut ce garde-fou qu'un pantin
               bloque contre une facade toute la nuit */
            if(n.go){ n.goT=(n.goT||0)+dt; } else n.goT=0;
            if(n.go&&(dist2(n.x,n.y,n.tx,n.ty)<12*12||n.goT>22)){
                n.go=0; n.inb=true;
                n.hx=n.tx; n.hy=n.ty;
                n.wt=G.night?rr(20,60):rr(6,22);
                continue;
            }
            n.wt-=dt;
            if(!n.go&&n.wt<=0){
                n.wt=rr(2,5);
                if(n.qtgt){
                    /* LA PERSONNE QU'ON CHERCHE NE S'ELOIGNE PAS : elle vaque
                       dans un petit rayon autour de l'endroit ou la course l'a
                       fixee, pour qu'on la retrouve la ou on l'indique. */
                    var qa2=rr(0,6.283), qd2=rr(0,(n.qr||64));
                    var qtx2=n.qax+Math.cos(qa2)*qd2, qty2=n.qay+Math.sin(qa2)*qd2;
                    if(!inSea(qtx2,qty2)){ n.tx=qtx2; n.ty=qty2; }
                } else if(!G.night&&rng()<0.16&&v.doors.length){
                    /* petite visite : il entre quelque part un moment */
                    var dr=v.doors[(rng()*v.doors.length)|0];
                    n.tx=dr.x+dr.w/2; n.ty=dr.y+dr.h+12; n.go=1; n.home=n.home||dr;
                } else {
                    /* ---- ON TRAINE AUTOUR DE SON TRAVAIL ----
                       Celui qui a un metier avec une adresse passe le plus
                       clair de son jour devant sa boutique : l'epicier devant
                       la superette, le garagiste devant la station. Ce n'est
                       pas un horaire, c'est une habitude - deux fois sur
                       trois il y revient, le reste du temps il vaque comme
                       les autres. La nuit, chacun rentre chez soi et le
                       travail ne compte plus. */
                    var wa, wd, wtx, wty, wtry, wk=n.work;
                    if(wk&&!G.night&&rng()<0.75){
                        /* Toujours DEVANT la boutique, jamais dedans. Le but
                           se tirait autour du centre du batiment : la moitie
                           des points tombait dans l'emprise, ou l'on ne peut
                           pas entrer, et l'habitant poussait contre le mur
                           sans jamais arriver. Certains n'ont ainsi jamais vu
                           leur lieu de travail. Le but se tire donc sur la
                           bande sud, la ou est la porte. */
                        wa=rr(0,6.28); wd=rr(4,26);
                        wtx=wk.x+wk.w/2+Math.cos(wa)*wd;
                        wty=wk.y+wk.h+11+Math.abs(Math.sin(wa))*wd*0.55;
                        if(!inSea(wtx,wty)&&!hitObstacle(wtx,wty,6)){
                            n.tx=wtx; n.ty=wty; n.wt=rr(5,11);
                        }
                    } else {
                        for(wtry=0;wtry<6;wtry++){
                            wa=rr(0,6.28); wd=v.r*Math.sqrt(rr(0,1))*1.03;
                            wtx=v.x+Math.cos(wa)*wd; wty=v.y+Math.sin(wa)*wd;
                            if(!inSea(wtx,wty)) break;
                        }
                        if(!inSea(wtx,wty)){ n.tx=wtx; n.ty=wty; }
                    }
                }
            }
            if(n.go) spd=42;
            if(n.stop>0){ n.stop-=dt; n.anim+=dt*1.5; collide(n,4); continue; }
            spd*=npcSlow(n.x,n.y);
            var l=Math.hypot(n.tx-n.x,n.ty-n.y);
            if(l>4){
                /* Un habitant qui vaque n'entre jamais dans l'eau : il vise
                   son but tant que le pied reste au sec, et longe la rive
                   sinon. Seule la peur lui fera franchir la berge. */
                var vx=(n.tx-n.x)/l*spd*dt, vy=(n.ty-n.y)/l*spd*dt;
                if(stepClear(n.x+vx,n.y+vy,4,true)){ n.x+=vx; n.y+=vy; }
                else if(!stepAround(n,n.tx-n.x,n.ty-n.y,spd*dt,4,true)){
                    /* coince : on longe la rive, dernier filet */
                    if(!inSea(n.x+vx,n.y)) n.x+=vx;
                    else if(!inSea(n.x,n.y+vy)) n.y+=vy;
                    else n.wt=0;
                }
                n.face=(n.tx<n.x)?-1:1; n.anim+=dt*(spd>40?14:7);
            }
            collide(n,4);
        }
        /* soldat : simple presence, plus de recrutement ni de combat */
        var sol=v.soldier;
        if(sol&&!sol.dead) collide(sol,5);
    }
}


/* ---- REMPLIR SES BOUTEILLES ----
   Le puits et la pompe a essence font le meme geste : on se tient a cote,
   on attend, et toutes les trois secondes une bouteille vide se change en
   autre chose. De l'eau au puits, un cocktail a la pompe. C'est le seul
   objet du jeu qui change de nature, et la seule fabrication qui existe.
   Rien ne part si l'on n'a pas de bouteille vide ; le compte a rebours
   repart de zero des qu'on s'ecarte ou qu'on change de source. */
var FILL_S=3, FILLID=null;
function fillIds(){
    if(FILLID) return FILLID;
    function id(n){ var o=itemFind(n); return o?o.id:-1; }
    FILLID={vide:id("Bouteille vide"), eau:id("Bouteille d'eau"),
            molo:id("Cocktail Molotov")};
    return FILLID;
}
/* Ou se tient le joueur : au bord d'un puits, au pied d'une pompe, nulle part. */
function fillSpot(){
    var p=G.p, i, v;
    for(i=0;i<VILLAGES.length;i++){
        v=VILLAGES[i];
        if(dist2(v.well.x,v.well.y,p.x,p.y)<26*26) return "eau";
    }
    for(i=0;i<PUMPS.length;i++)
        if(dist2(PUMPS[i].x,PUMPS[i].y,p.x,p.y)<30*30) return "molo";
    return null;
}
function updFill(dt){
    var ID=fillIds(), k=fillSpot(), into, o;
    if(!k||ID.vide<0||G.inside||G.pick||G.talk||invCount(ID.vide)<=0){
        G.fill=null; return;
    }
    if(!G.fill||G.fill.k!==k) G.fill={k:k,t:0};
    G.fill.t+=dt;
    if((G.frame%12)===0)
        G.fx.push({k:"p",x:G.p.x+rr(-4,4),y:G.p.y-8,vx:0,vy:-20,t:0.5,
                   c:(k==="eau")?"#78d8f0":"#e8a040"});
    if(G.fill.t<FILL_S) return;
    G.fill.t-=FILL_S;
    into=(k==="eau")?ID.eau:ID.molo;
    if(into<0) return;
    invTake(ID.vide,1);
    if(!invPush(into,1)){
        /* le sac est plein : la bouteille revient telle quelle. On continue
           d'essayer en silence - des qu'une case se libere le remplissage
           reprend - mais on ne le dit qu'une fois par halte. */
        invPush(ID.vide,1);
        if(!G.fill.warn){ notice("SAC PLEIN"); G.fill.warn=1; }
        return;
    }
    G.fill.warn=0;
    o=itemById(into);
    logMsg((k==="eau")?"Vous tirez de l'eau au puits."
                     :"Vous bourrez une bouteille d'essence et de chiffon.","jday");
    if(o&&invCount(ID.vide)<=0) notice("PLUS DE BOUTEILLE VIDE");
}

function updFrogs(dt){
    var Math=DMATH;
    for(var i=0;i<FROGS.length;i++){
        var f=FROGS[i];
        f.wt-=dt;
        if(f.wt<=0){
            var fa=rng()*6.28, fd=rng()*f.pr;
            f.tx=f.px+Math.cos(fa)*fd; f.ty=f.py+Math.sin(fa)*fd;
            f.wt=1.2+rng()*2.8; f.hop=0;
        }
        var ddx=f.tx-f.x, ddy=f.ty-f.y, dl=Math.hypot(ddx,ddy);
        if(dl>2){
            f.hop=(f.hop+dt*2.2)%1;
            f.x+=ddx/dl*24*dt; f.y+=ddy/dl*24*dt;
            f.face=(ddx<0)?-1:1;
        } else f.hop=0;
    }
}
/* ---- LE GUIDE DU CHATEAU ----
   Il ne patrouille pas, il ne fuit pas, il ne rentre pas : il tient la porte.
   Tant qu'aucun mort ne s'approche il reste sur son pas ; l'un d'eux entre
   dans GUIDE_VUE et il va au-devant, mais JAMAIS AU-DELA DE GUIDE_LAISSE du
   seuil - c'est ce qui l'empeche de se faire entrainer au loin par une proie
   qui recule, et de mourir a trois cents pas de ce qu'il gardait.
   Il frappe avec sa vraie lame, par npcMelee, comme les compagnons en sortie :
   une seule regle de coup pour tout le monde, et sa Frappe compte. */
var GUIDE_VUE=150, GUIDE_LAISSE=110, GUIDE_CD=0.75;
function updGuides(dt){
    var Math=DMATH;
    var p=G.p, i, q, g, z, d, bd, best, w, dmg, l, mx;
    for(i=0;i<GUIDES.length;i++){
        g=GUIDES[i];
        if(g.dead) continue;
        if(dist2(g.hx,g.hy,p.x,p.y)>900*900) continue;
        updMal(g,dt); updLow(g,dt);
        if(g.cd>0) g.cd-=dt;
        /* le mort le plus proche, dans sa vue et dans sa laisse */
        best=null; bd=GUIDE_VUE*GUIDE_VUE;
        for(q=0;q<ZOMBIES.length;q++){
            z=ZOMBIES[q];
            if(z.dead||z.gone) continue;
            d=dist2(z.x,z.y,g.x,g.y);
            if(d<bd&&dist2(z.x,z.y,g.hx,g.hy)<GUIDE_LAISSE*GUIDE_LAISSE){
                bd=d; best=z;
            }
        }
        if(best){
            w=npcMelee(g);
            mx=w?(w.por||18):16;
            l=Math.hypot(best.x-g.x,best.y-g.y);
            g.face=(best.x<g.x)?-1:1;
            if(l>mx*0.8){
                g.x+=(best.x-g.x)/l*74*dt;
                g.y+=(best.y-g.y)/l*74*dt;
                g.anim+=dt*11;
            } else if(g.cd<=0){
                g.cd=GUIDE_CD;
                /* la Frappe pese sur le coup comme chez tout le monde */
                dmg=(w?(w.dmg||20):12)*(0.75+statEff(g,"combat","frappe")/200);
                SWING.push({x:g.x, y:g.y-11,
                    a:Math.atan2((best.y-11)-(g.y-11),best.x-g.x),
                    arc:(w?meleeArc(w,0):40)*Math.PI/180,
                    r:(w?w.por:20), t:0.16, m:0});
                hurt(best,dmg,1);
                secBump(g,"frappe",1);
            }
            continue;
        }
        /* plus rien a portee : on retourne se poster */
        l=Math.hypot(g.hx-g.x,g.hy-g.y);
        if(l>3){
            g.x+=(g.hx-g.x)/l*62*dt;
            g.y+=(g.hy-g.y)/l*62*dt;
            g.anim+=dt*8;
        } else { g.x=g.hx; g.y=g.hy; g.face=(p.x<g.x)?-1:1; }
    }
}
function updFishers(dt){
    var Math=DMATH;
    var p=G.p;
    for(var i=0;i<FISHERS.length;i++){
        var f=FISHERS[i];
        if(f.dead) continue;
        if(dist2(f.hx,f.hy,p.x,p.y)>900*900) continue;
        /* le pecheur ne rentre plus dans sa hutte : il taquine le poisson */
        var bl=Math.hypot(f.hx-f.x,f.hy-f.y);
        if(bl>4){ f.x+=(f.hx-f.x)/bl*40*dt; f.y+=(f.hy-f.y)/bl*40*dt;
            f.face=(f.hx<f.x)?-1:1; f.anim+=dt*8; }
        else { f.face=(f.lx<f.x)?-1:1; f.bob+=dt*(2.4+Math.sin(f.rod)*1.2); }
        f.rod+=dt*0.7;
    }
}
function updFarms(dt){
    var Math=DMATH;
    var p=G.p;
    for(var i=0;i<FARMS.length;i++){
        var f=FARMS[i];
        if(dist2(f.x,f.y,p.x,p.y)>900*900) continue;
        for(var pi=0;pi<f.farmers.length;pi++){ var fm=f.farmers[pi];
        if(fm.dead) continue;
        /* le fermier ne se cache plus : il bine, quoi qu'il arrive */
        if(fm.stop>0){ fm.stop-=dt; }
        else {
            fm.wt-=dt;
            if(fm.wt<=0){ fm.wt=rr(1.5,3.5);
                var fd=f.fields.length?f.fields[(rng()*f.fields.length)|0]:null;
                if(fd){ fm.tx=fd.x+rr(4,fd.w-4); fm.ty=fd.y+rr(4,fd.h-4); }
                else  { fm.tx=f.x+rr(-40,40); fm.ty=f.y+rr(-16,16); } }
            var wl=Math.hypot((fm.tx||fm.hx)-fm.x,(fm.ty||fm.hy)-fm.y);
            if(wl>4){ var fsp=22*npcSlow(fm.x,fm.y);
                fm.x+=((fm.tx||fm.hx)-fm.x)/wl*fsp*dt; fm.y+=((fm.ty||fm.hy)-fm.y)/wl*fsp*dt; fm.face=((fm.tx||fm.hx)<fm.x)?-1:1; fm.anim+=dt*5; }
            fm.hoe=(fm.hoe+dt*6)%6.28;
        }
        collide(fm,5);
        }
        /* le betail broute et ne franchit jamais la barriere */
        for(var hi=0;hi<f.fields.length;hi++){
            var pf=f.fields[hi];
            if(!pf.herd||!pf.herd.length) continue;
            for(var bi=0;bi<pf.herd.length;bi++){
                var bt=pf.herd[bi];
                bt.wt-=dt;
                if(bt.wt<=0){ bt.wt=rr(2.5,6);
                    bt.tx=pf.x+rr(9,pf.w-9); bt.ty=pf.y+rr(9,pf.h-9); }
                var bl=Math.hypot(bt.tx-bt.x,bt.ty-bt.y);
                if(bl>3){
                    var bsp=13*npcSlow(bt.x,bt.y);
                    bt.x+=(bt.tx-bt.x)/bl*bsp*dt; bt.y+=(bt.ty-bt.y)/bl*bsp*dt;
                    bt.face=(bt.tx<bt.x)?-1:1; bt.anim+=dt*5;
                }
                collide(bt,4);
                bt.x=clamp(bt.x,pf.x+7,pf.x+pf.w-7);
                bt.y=clamp(bt.y,pf.y+7,pf.y+pf.h-7);
            }
        }
    }
}
