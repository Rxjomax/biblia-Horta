export type FallbackVersionId = 'ARC' | 'ARA' | 'NVI' | 'BPT' | 'A21';

export interface BibleVersionInfo {
  id: FallbackVersionId;
  name: string;
  shortName: string;
  description: string;
}

export interface BibleVerse {
  verse: number;
  translations: Record<FallbackVersionId, string>;
}

export interface BibleChapter {
  chapter: number;
  title?: string;
  verses: BibleVerse[];
}

export interface BibleBook {
  id: string;
  name: string;
  shortName: string;
  aliases: string[];
  testament: 'AT' | 'NT';
  totalChapters: number;
  chapters: BibleChapter[];
}

export const BIBLE_VERSIONS: BibleVersionInfo[] = [
  {
    id: 'ARC',
    name: 'Almeida Revista e Corrigida',
    shortName: 'ARC',
    description: 'Tradução clássica reverenciada pela sua linguagem solene e tradicional.',
  },
  {
    id: 'ARA',
    name: 'Almeida Revista e Atualizada',
    shortName: 'ARA',
    description: 'Fidelidade textual combinada com clareza gramatical contemporânea.',
  },
  {
    id: 'NVI',
    name: 'Nova Versão Internacional',
    shortName: 'NVI',
    description: 'Equilíbrio entre rigor exegético e fluidez natural de leitura.',
  },
  {
    id: 'BPT',
    name: 'Bíblia Para Todos',
    shortName: 'BPT',
    description: 'Tradução em português corrente de Portugal, clara e acessível.',
  },
  {
    id: 'A21',
    name: 'Almeida Século 21',
    shortName: 'A21',
    description: 'Revisão atualizada da tradição Almeida para o leitor de hoje.',
  },
];

function v(
  verse: number,
  ARC: string,
  ARA: string,
  NVI: string,
  BPT: string,
  A21: string
): BibleVerse {
  return {
    verse,
    translations: { ARC, ARA, NVI, BPT, A21 },
  };
}

export const BIBLE_BOOKS: BibleBook[] = [
  {
    id: 'genesis',
    name: 'Génesis',
    shortName: 'Gn',
    aliases: ['genesis', 'génesis', 'gn', 'gen'],
    testament: 'AT',
    totalChapters: 50,
    chapters: [
      {
        chapter: 1,
        title: 'A Criação dos Céus e da Terra',
        verses: [
          v(
            1,
            'No princípio, criou Deus os céus e a terra.',
            'No princípio criou Deus os céus e a terra.',
            'No princípio Deus criou os céus e a terra.',
            'No princípio, quando Deus criou os céus e a terra,',
            'No princípio, Deus criou os céus e a terra.'
          ),
          v(
            2,
            'E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas.',
            'A terra, porém, estava sem forma e vazia; havia trevas sobre a face do abismo, e o Espírito de Deus pairava por sobre as águas.',
            'Era a terra sem forma e vazia; trevas cobriam a face do abismo, e o Espírito de Deus se movia sobre a face das águas.',
            'a terra era um caos sem forma nem vida; a escuridão cobria o abismo, e o sopro de Deus pairava sobre as águas.',
            'A terra era sem forma e vazia; havia trevas sobre a face do abismo, e o Espírito de Deus pairava sobre a face das águas.'
          ),
          v(
            3,
            'E disse Deus: Haja luz. E houve luz.',
            'Disse Deus: Haja luz; e houve luz.',
            'Disse Deus: "Haja luz", e houve luz.',
            'Então Deus disse: «Haja luz!» E a luz apareceu.',
            'Disse Deus: Haja luz! E houve luz.'
          ),
          v(
            4,
            'E viu Deus que era boa a luz; e fez Deus separação entre a luz e as trevas.',
            'E viu Deus que a luz era boa; e fez separação entre a luz e as trevas.',
            'Deus viu que a luz era boa, e separou a luz das trevas.',
            'Deus viu que a luz era boa e separou a luz da escuridão.',
            'Viu Deus que a luz era boa; e fez separação entre a luz e as trevas.'
          ),
          v(
            5,
            'E Deus chamou à luz Dia; e às trevas chamou Noite. E foi a tarde e a manhã: o dia primeiro.',
            'Chamou Deus à luz Dia e às trevas, Noite. Houve tarde e manhã, o primeiro dia.',
            'Deus chamou à luz dia, e às trevas chamou noite. Passaram-se a tarde e a manhã; esse foi o primeiro dia.',
            'À luz chamou dia e à escuridão chamou noite. Passou a tarde e veio a manhã: foi o primeiro dia.',
            'Chamou Deus à luz Dia e às trevas, Noite. Houve tarde e manhã, o primeiro dia.'
          ),
          v(
            26,
            'E disse Deus: Façamos o homem à nossa imagem, conforme a nossa semelhança; e domine sobre os peixes do mar, e sobre as aves dos céus.',
            'Também disse Deus: Façamos o homem à nossa imagem, conforme a nossa semelhança; tenha ele domínio sobre os peixes do mar e sobre as aves dos céus.',
            'Então disse Deus: "Façamos o homem à nossa imagem, conforme a nossa semelhança. Domine ele sobre os peixes do mar e sobre as aves do céu".',
            'Depois Deus disse: «Façamos o ser humano à nossa imagem, semelhante a nós, para que domine sobre os peixes do mar e as aves do céu.»',
            'Disse Deus também: Façamos o ser humano à nossa imagem, conforme a nossa semelhança; domine ele sobre os peixes do mar e sobre as aves do céu.'
          ),
          v(
            27,
            'E criou Deus o homem à sua imagem; à imagem de Deus o criou; macho e fêmea os criou.',
            'Criou Deus, pois, o homem à sua imagem, à imagem de Deus o criou; homem e mulher os criou.',
            'Criou Deus o homem à sua imagem, à imagem de Deus o criou; homem e mulher os criou.',
            'E Deus criou o ser humano à sua imagem; criou-o à imagem de Deus; criou-os homem e mulher.',
            'Criou Deus o ser humano à sua imagem, à imagem de Deus o criou; homem e mulher os criou.'
          ),
          v(
            31,
            'E viu Deus tudo quanto tinha feito, e eis que era muito bom; e foi a tarde e a manhã: o dia sexto.',
            'Viu Deus tudo quanto fizera, e eis que era muito bom. Houve tarde e manhã, o sexto dia.',
            'E Deus viu tudo o que havia feito, e tudo havia ficado muito bom. Passaram-se a tarde e a manhã; esse foi o sexto dia.',
            'Deus olhou para tudo quanto tinha feito e viu que tudo era muito bom. Passou a tarde e veio a manhã: foi o sexto dia.',
            'Deus viu tudo o que havia feito, e era muito bom. Houve tarde e manhã, o sexto dia.'
          ),
        ],
      },
      {
        chapter: 2,
        title: 'O Descanso do Sétimo Dia e o Jardim do Éden',
        verses: [
          v(
            1,
            'Assim, os céus, e a terra, e todo o seu exército foram acabados.',
            'Assim, pois, foram acabados os céus e a terra e todo o seu exército.',
            'Assim foram concluídos os céus e a terra, e tudo o que neles há.',
            'Ficaram assim terminados os céus e a terra com tudo o que contêm.',
            'Assim foram concluídos os céus e a terra, com todo o seu exército.'
          ),
          v(
            2,
            'E, havendo Deus acabado no dia sétimo a sua obra, que tinha feito, descansou no sétimo dia de toda a sua obra.',
            'E, havendo Deus terminado no dia sétimo a sua obra, que fizera, descansou nesse dia de toda a sua obra que tinha feito.',
            'No sétimo dia Deus já havia concluído a obra que realizara, e nesse dia descansou.',
            'No sétimo dia Deus tinha completado a obra que fizera e descansou de todo o trabalho realizado.',
            'No sétimo dia, tendo Deus acabado a obra que fizera, descansou de toda a sua obra.'
          ),
          v(
            3,
            'E abençoou Deus o dia sétimo e o santificou; porque nele descansou de toda a sua obra, que Deus criara e fizera.',
            'E abençoou Deus o dia sétimo e o santificou; porque nele descansou de toda a obra que, como Criador, fizera.',
            'Abençoou Deus o sétimo dia e o santificou, porque nele descansou de toda a obra que realizara na criação.',
            'Deus abençoou o sétimo dia e consagrou-o, porque nesse dia descansou de toda a sua obra criadora.',
            'Deus abençoou o sétimo dia e o santificou, porque nele descansou de toda a obra que criara e fizera.'
          ),
        ],
      },
      {
        chapter: 12,
        title: 'O Chamamento de Abrão',
        verses: [
          v(
            1,
            'Ora, o Senhor disse a Abrão: Sai-te da tua terra, e da tua parentela, e da casa de teu pai, para a terra que eu te mostrarei.',
            'Ora, disse o Senhor a Abrão: Sai da tua terra, da tua parentela e da casa de teu pai e vai para a terra que te mostrarei.',
            'O Senhor disse a Abrão: "Saia da sua terra, do meio dos seus parentes e da casa de seu pai, e vá para a terra que eu lhe mostrarei".',
            'O Senhor disse a Abrão: «Deixa a tua terra, a tua família e a casa de teu pai, e vai para a terra que eu te vou mostrar.»',
            'O Senhor disse a Abrão: Sai da tua terra, da tua parentela e da casa de teu pai, e vai para a terra que te mostrarei.'
          ),
          v(
            2,
            'E far-te-ei uma grande nação, e abençoar-te-ei, e engrandecerei o teu nome, e tu serás uma bênção.',
            'De ti farei uma grande nação, e te abençoarei, e te engrandecerei o nome. Sê tu uma bênção!',
            'Farei de você um grande povo, e o abençoarei. Tornarei famoso o seu nome, e você será uma bênção.',
            'Farei de ti um grande povo, abençoar-te-ei e tornarei famoso o teu nome, e tu próprio serás uma bênção.',
            'Farei de ti uma grande nação, e te abençoarei, e engrandecerei o teu nome; e tu serás uma bênção.'
          ),
        ],
      },
    ],
  },
  {
    id: 'salmos',
    name: 'Salmos',
    shortName: 'Sl',
    aliases: ['salmos', 'salmo', 'sl', 'ps'],
    testament: 'AT',
    totalChapters: 150,
    chapters: [
      {
        chapter: 1,
        title: 'Os Dois Caminhos',
        verses: [
          v(
            1,
            'Bem-aventurado o varão que não anda segundo o conselho dos ímpios, nem se detém no caminho dos pecadores, nem se assenta na roda dos escarnecedores.',
            'Bem-aventurado o homem que não anda no conselho dos ímpios, não se detém no caminho dos pecadores, nem se assenta na roda dos escarnecedores.',
            'Como é feliz aquele que não segue o conselho dos ímpios, não imita a conduta dos pecadores, nem se assenta na roda dos zombadores!',
            'Feliz o homem que não segue os conselhos dos maus, nem anda no caminho dos pecadores, nem se junta aos que zombam de Deus.',
            'Bem-aventurado o homem que não anda no conselho dos ímpios, não se detém no caminho dos pecadores, nem se assenta na roda dos zombadores.'
          ),
          v(
            2,
            'Antes, tem o seu prazer na lei do Senhor, e na sua lei medita de dia e de noite.',
            'Antes, o seu prazer está na lei do Senhor, e na sua lei medita de dia e de noite.',
            'Ao contrário, sua satisfação está na lei do Senhor, e nessa lei medita dia e noite.',
            'Pelo contrário, encontra a sua alegria na lei do Senhor e medita nela dia e noite.',
            'Antes, tem o seu prazer na lei do Senhor, e na sua lei medita de dia e de noite.'
          ),
          v(
            3,
            'Pois será como a árvore plantada junto a ribeiros de águas, a qual dá o seu fruto na estação própria, e cujas folhas não caem, e tudo quanto fizer prosperará.',
            'Ele é como árvore plantada junto a corrente de águas, que, no devido tempo, dá o seu fruto, e cuja folhagem não murcha; e tudo quanto ele faz será bem-sucedido.',
            'É como árvore plantada à beira de águas correntes: dá fruto no tempo certo e suas folhas não murcham. Tudo o que ele faz prospera!',
            'É como uma árvore plantada junto à água: dá fruto no tempo certo, as suas folhas nunca secam e tudo o que faz corre bem.',
            'Ele é como árvore plantada junto a ribeiros de águas, que dá o seu fruto no devido tempo e cuja folhagem não murcha; tudo o que fizer prosperará.'
          ),
        ],
      },
      {
        chapter: 23,
        title: 'O Senhor é o Meu Pastor',
        verses: [
          v(
            1,
            'O Senhor é o meu pastor; nada me faltará.',
            'O Senhor é o meu pastor; nada me faltará.',
            'O Senhor é o meu pastor; de nada terei falta.',
            'O Senhor é o meu pastor: nada me falta.',
            'O Senhor é o meu pastor; nada me faltará.'
          ),
          v(
            2,
            'Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.',
            'Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas de descanso;',
            'Em verdes pastagens me faz repousar e me conduz a águas tranquilas;',
            'Leva-me a descansar em verdes prados e conduz-me junto a águas tranquilas.',
            'Ele me faz repousar em pastos verdejantes e me conduz a águas tranquilas.'
          ),
          v(
            3,
            'Refrigera a minha alma; guia-me pelas veredas da justiça por amor do seu nome.',
            'refrigera-me a alma. Guia-me pelas veredas da justiça por amor do seu nome.',
            'restaura-me o vigor. Guia-me nas veredas da justiça por amor do seu nome.',
            'Reanima as minhas forças e guia-me pelos caminhos da justiça por amor do seu nome.',
            'Restaura-me a alma; guia-me pelas veredas da justiça por amor do seu nome.'
          ),
          v(
            4,
            'Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.',
            'Ainda que eu ande pelo vale da sombra da morte, não temerei mal nenhum, porque tu estás comigo; o teu bordão e o teu cajado me consolam.',
            'Mesmo quando eu andar por um vale de trevas e morte, não temerei perigo algum, pois tu estás comigo; a tua vara e o teu cajado me protegem.',
            'Mesmo que atravesse vales tenebrosos, não terei medo de mal algum, porque tu estás comigo: o teu cajado e a tua vara dão-me confiança.',
            'Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.'
          ),
          v(
            5,
            'Preparas uma mesa perante mim na presença dos meus inimigos, unges a minha cabeça com óleo, o meu cálice transborda.',
            'Preparas-me uma mesa na presença dos meus adversários, unges-me a cabeça com óleo; o meu cálice transborda.',
            'Preparas um banquete para mim à vista dos meus inimigos. Tu me honras, ungindo a minha cabeça com óleo e fazendo transbordar o meu cálice.',
            'Preparas-me um banquete diante dos meus inimigos; perfumas-me a cabeça com óleo e enches o meu cálice até transbordar.',
            'Preparas uma mesa perante mim na presença dos meus inimigos; unges a minha cabeça com óleo, o meu cálice transborda.'
          ),
          v(
            6,
            'Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na Casa do Senhor por longos dias.',
            'Bondade e misericórdia certamente me seguirão todos os dias da minha vida; e habitarei na Casa do Senhor para todo o sempre.',
            'Sei que a bondade e a fidelidade me acompanharão todos os dias da minha vida, e voltarei à casa do Senhor enquanto eu viver.',
            'A bondade e o amor acompanhar-me-ão todos os dias da minha vida, e habitarei na casa do Senhor para todo o sempre.',
            'Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na casa do Senhor por longos dias.'
          ),
        ],
      },
      {
        chapter: 46,
        title: 'Deus é o Nosso Refúgio e Fortaleza',
        verses: [
          v(
            1,
            'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.',
            'Deus é o nosso refúgio e fortaleza, socorro bem presente nas tribulações.',
            'Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na adversidade.',
            'Deus é o nosso refúgio e a nossa força, um auxílio sempre presente nas horas difíceis.',
            'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.'
          ),
          v(
            2,
            'Pelo que não temeremos, ainda que a terra se mude, e ainda que os montes se transportem para o meio dos mares.',
            'Portanto, não temeremos ainda que a terra se transtorne e os montes se abalem no seio dos mares;',
            'Por isso não temeremos, ainda que a terra trema e os montes afundem no coração do mar,',
            'Por isso não temos medo, mesmo que a terra estremeça e as montanhas se desmoronem no fundo do mar,',
            'Portanto, não temeremos, ainda que a terra se mude e os montes se abalem no coração dos mares.'
          ),
          v(
            10,
            'Aquietai-vos e sabei que eu sou Deus; serei exaltado entre as nações; serei exaltado sobre a terra.',
            'Aquietai-vos e sabei que eu sou Deus; sou exaltado entre as nações, sou exaltado na terra.',
            'Parem de lutar! Saibam que eu sou Deus! Serei exaltado entre as nações, serei exaltado na terra.',
            '«Parai e reconhecei que eu sou Deus! Sou exaltado entre os povos, sou exaltado sobre toda a terra.»',
            'Aquietai-vos e sabei que eu sou Deus; serei exaltado entre as nações, serei exaltado na terra.'
          ),
        ],
      },
      {
        chapter: 91,
        title: 'À Sombra do Omnipotente',
        verses: [
          v(
            1,
            'Aquele que habita no esconderijo do Altíssimo, à sombra do Omnipotente descansará.',
            'O que habita no esconderijo do Altíssimo e descansa à sombra do Onipotente',
            'Aquele que habita no abrigo do Altíssimo e descansa à sombra do Todo-poderoso',
            'Quem vive sob a proteção do Altíssimo e repousa à sombra do Todo-Poderoso',
            'Aquele que habita no abrigo do Altíssimo descansará à sombra do Todo-Poderoso.'
          ),
          v(
            2,
            'Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.',
            'diz ao Senhor: Meu refúgio e meu baluarte, Deus meu, em quem confio.',
            'pode dizer ao Senhor: "Tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem confio".',
            'pode dizer ao Senhor: «Tu és o meu abrigo e a minha fortaleza, o meu Deus, em quem confio.»',
            'Direi do Senhor: Ele é o meu refúgio e a minha fortaleza, o meu Deus, em quem confio.'
          ),
          v(
            11,
            'Porque aos seus anjos dará ordem a teu respeito, para te guardarem em todos os teus caminhos.',
            'Porque aos seus anjos dará ordens a teu respeito, para que te guardem em todos os teus caminhos.',
            'Pois a seus anjos ele dará ordens a seu respeito, para que o protejam em todos os seus caminhos;',
            'Ele dará ordens aos seus anjos para que te protejam por onde quer que andes.',
            'Porque aos seus anjos dará ordens a teu respeito, para que te guardem em todos os teus caminhos.'
          ),
        ],
      },
      {
        chapter: 121,
        title: 'O Guarda de Israel',
        verses: [
          v(
            1,
            'Elevo os meus olhos para os montes: de onde me virá o socorro?',
            'Elevo os olhos para os montes: de onde me virá o socorro?',
            'Levanto os meus olhos para os montes e pergunto: De onde me vem o socorro?',
            'Ergo os olhos para os montes: de onde me virá o auxílio?',
            'Elevo os meus olhos para os montes: de onde me virá o socorro?'
          ),
          v(
            2,
            'O meu socorro vem do Senhor, que fez o céu e a terra.',
            'O meu socorro vem do Senhor, que fez o céu e a terra.',
            'O meu socorro vem do Senhor, que fez os céus e a terra.',
            'O meu auxílio vem do Senhor, que fez o céu e a terra.',
            'O meu socorro vem do Senhor, que fez o céu e a terra.'
          ),
          v(
            3,
            'Não deixará vacilar o teu pé; aquele que te guarda não tosquenejará.',
            'Ele não permitirá que os teus pés vacilem; não dormitará aquele que te guarda.',
            'Ele não permitirá que você tropece; o seu protetor se manterá alerta,',
            'Ele não deixará vacilar os teus pés; aquele que te guarda não adormece.',
            'Ele não deixará vacilar o teu pé; aquele que te guarda não cochilará.'
          ),
          v(
            4,
            'Eis que não tosquenejará nem dormirá o guarda de Israel.',
            'É certo que não dormita, nem dorme o guarda de Israel.',
            'sim, o protetor de Israel não dormirá; ele está sempre alerta!',
            'Não, o guarda de Israel não dormita nem adormece!',
            'Eis que não cochila nem dorme o guarda de Israel.'
          ),
          v(
            5,
            'O Senhor é quem te guarda; o Senhor é a tua sombra à tua direita.',
            'O Senhor é quem te guarda; o Senhor é a tua sombra à tua direita.',
            'O Senhor é o seu protetor; como sombra que o protege, ele está à sua direita.',
            'O Senhor é o teu guarda; o Senhor está sempre ao teu lado como sombra protetora.',
            'O Senhor é quem te guarda; o Senhor é a tua sombra à tua direita.'
          ),
          v(
            6,
            'O sol não te molestará de dia, nem a lua, de noite.',
            'De dia não te molestará o sol, nem de noite, a lua.',
            'De dia o sol não o ferirá, nem a lua, de noite.',
            'Nem o sol te fará mal de dia, nem a lua durante a noite.',
            'O sol não te ferirá de dia, nem a lua de noite.'
          ),
          v(
            7,
            'O Senhor te guardará de todo o mal; ele guardará a tua alma.',
            'O Senhor te guardará de todo mal; guardará a tua alma.',
            'O Senhor o protegerá de todo o mal, protegerá a sua vida.',
            'O Senhor protege-te de todo o mal; ele guarda a tua vida.',
            'O Senhor te guardará de todo o mal; ele guardará a tua vida.'
          ),
          v(
            8,
            'O Senhor guardará a tua entrada e a tua saída, desde agora e para sempre.',
            'O Senhor guardará a tua saída e a tua entrada, desde agora e para sempre.',
            'O Senhor protegerá a sua saída e a sua chegada, desde agora e para sempre.',
            'O Senhor protege os teus passos, quer saias quer entres, desde agora e para sempre.',
            'O Senhor guardará a tua saída e a tua entrada, desde agora e para sempre.'
          ),
        ],
      },
    ],
  },
  {
    id: 'proverbios',
    name: 'Provérbios',
    shortName: 'Pv',
    aliases: ['proverbios', 'provérbios', 'pv', 'prov'],
    testament: 'AT',
    totalChapters: 31,
    chapters: [
      {
        chapter: 3,
        title: 'Confiança no Senhor e Sabedoria',
        verses: [
          v(
            5,
            'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.',
            'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.',
            'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento;',
            'Confia no Senhor de todo o teu coração e não te fies apenas na tua própria inteligência.',
            'Confia no Senhor de todo o teu coração e não te apoies no teu próprio entendimento.'
          ),
          v(
            6,
            'Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.',
            'Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.',
            'reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas.',
            'Lembra-te dele em tudo o que fizeres e ele tornará retos os teus caminhos.',
            'Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.'
          ),
          v(
            7,
            'Não sejas sábio a teus próprios olhos; teme ao Senhor e aparta-te do mal.',
            'Não sejas sábio aos teus próprios olhos; teme ao Senhor e aparta-te do mal.',
            'Não seja sábio aos seus próprios olhos; tema ao Senhor e evite o mal.',
            'Não te julgues demasiado sábio; respeita o Senhor e afasta-te do mal.',
            'Não sejas sábio aos teus próprios olhos; teme ao Senhor e afasta-te do mal.'
          ),
        ],
      },
      {
        chapter: 16,
        title: 'Os Planos do Coração',
        verses: [
          v(
            3,
            'Confia ao Senhor as tuas obras, e os teus pensamentos serão estabelecidos.',
            'Confia ao Senhor as tuas obras, e os teus desígnios serão estabelecidos.',
            'Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.',
            'Entrega ao Senhor tudo o que fazes, e os teus planos serão bem-sucedidos.',
            'Entrega ao Senhor as tuas obras, e os teus planos serão estabelecidos.'
          ),
          v(
            9,
            'O coração do homem considera o seu caminho, mas o Senhor lhe dirige os passos.',
            'O coração do homem traça o seu caminho, mas o Senhor lhe dirige os passos.',
            'Em seu coração o homem planeia o seu caminho, mas o Senhor determina os seus passos.',
            'O ser humano faz os seus planos, mas é o Senhor quem dirige os seus passos.',
            'O coração do homem planeia o seu caminho, mas o Senhor lhe dirige os passos.'
          ),
        ],
      },
    ],
  },
  {
    id: 'mateus',
    name: 'Mateus',
    shortName: 'Mt',
    aliases: ['mateus', 'mt', 'mat'],
    testament: 'NT',
    totalChapters: 28,
    chapters: [
      {
        chapter: 5,
        title: 'As Bem-Aventuranças e o Sal da Terra',
        verses: [
          v(
            3,
            'Bem-aventurados os pobres de espírito, porque deles é o Reino dos céus.',
            'Bem-aventurados os humildes de espírito, porque deles é o reino dos céus.',
            'Bem-aventurados os pobres em espírito, pois deles é o Reino dos céus.',
            'Felizes os que reconhecem a sua pobreza espiritual, porque o Reino dos céus é deles.',
            'Bem-aventurados os pobres em espírito, porque deles é o reino dos céus.'
          ),
          v(
            6,
            'Bem-aventurados os que têm fome e sede de justiça, porque eles serão fartos.',
            'Bem-aventurados os que têm fome e sede de justiça, porque serão fartos.',
            'Bem-aventurados os que têm fome e sede de justiça, pois serão satisfeitos.',
            'Felizes os que têm fome e sede de justiça, porque serão saciados.',
            'Bem-aventurados os que têm fome e sede de justiça, porque serão saciados.'
          ),
          v(
            13,
            'Vós sois o sal da terra; e se o sal for insípido, com que se há de salgar? Para nada mais presta, senão para se lançar fora e ser pisado pelos homens.',
            'Vós sois o sal da terra; ora, se o sal vier a ser insípido, como lhe restaurar o sabor? Para nada mais presta senão para, lançado fora, ser pisado pelos homens.',
            'Vocês são o sal da terra. Mas se o sal perder o seu sabor, como restaurá-lo? Não servirá para nada, exceto para ser jogado fora e pisado pelos homens.',
            'Vós sois o sal da terra. Se o sal perder a força, como lhe devolver o sabor? Já não serve para nada, senão para ser deitado fora e pisado pelas pessoas.',
            'Vós sois o sal da terra; mas, se o sal perder o sabor, com que se há de salgar? Para nada mais presta, senão para ser lançado fora e pisado pelos homens.'
          ),
          v(
            14,
            'Vós sois a luz do mundo; não se pode esconder uma cidade edificada sobre um monte;',
            'Vós sois a luz do mundo. Não se pode esconder a cidade edificada sobre um monte;',
            'Vocês são a luz do mundo. Não se pode esconder uma cidade construída sobre um monte.',
            'Vós sois a luz do mundo. Não se pode esconder uma cidade situada no cimo de um monte.',
            'Vós sois a luz do mundo. Não se pode esconder uma cidade situada sobre um monte;'
          ),
          v(
            16,
            'Assim resplandeça a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai, que está nos céus.',
            'Assim brilhe também a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai que está nos céus.',
            'Assim brilhe a luz de vocês diante dos homens, para que vejam as suas boas obras e glorifiquem ao Pai de vocês, que está nos céus.',
            'Brilhe assim a vossa luz diante de todos, para que vejam as vossas boas obras e louvem o vosso Pai que está nos céus.',
            'Assim resplandeça a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai que está nos céus.'
          ),
        ],
      },
      {
        chapter: 6,
        title: 'A Oração e a Confiança Diária',
        verses: [
          v(
            9,
            'Portanto, vós orareis assim: Pai nosso, que estás nos céus, santificado seja o teu nome;',
            'Portanto, vós orareis assim: Pai nosso, que estás nos céus, santificado seja o teu nome;',
            'Vocês, orem assim: "Pai nosso, que estás nos céus! Santificado seja o teu nome".',
            'Orai, pois, assim: «Pai nosso que estás nos céus, santificado seja o teu nome.',
            'Portanto, orai deste modo: Pai nosso que estás nos céus, santificado seja o teu nome;'
          ),
          v(
            33,
            'Mas buscai primeiro o Reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.',
            'buscai, pois, em primeiro lugar, o seu reino e a sua justiça, e todas estas coisas vos serão acrescentadas.',
            'Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas serão acrescentadas a vocês.',
            'Procurai primeiro o Reino de Deus e a sua justiça, e tudo o resto vos será dado por acréscimo.',
            'Buscai, antes de tudo, o reino de Deus e a sua justiça, e todas essas coisas vos serão acrescentadas.'
          ),
          v(
            34,
            'Não vos inquieteis, pois, pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo. Basta a cada dia o seu mal.',
            'Portanto, não vos inquieteis com o dia de amanhã, pois o amanhã trará os seus cuidados; basta ao dia o seu próprio mal.',
            'Portanto, não se preocupem com o amanhã, pois o amanhã trará as suas próprias preocupações. Basta a cada dia o seu próprio mal.',
            'Por isso não andeis preocupados com o dia de amanhã, porque o dia de amanhã terá as suas próprias preocupações. A cada dia basta o seu cuidado.',
            'Portanto, não vos inquieteis com o dia de amanhã, pois o amanhã cuidará de si mesmo. Basta a cada dia o seu próprio mal.'
          ),
        ],
      },
      {
        chapter: 11,
        title: 'O Convite de Jesus ao Descanso',
        verses: [
          v(
            28,
            'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.',
            'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.',
            'Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.',
            'Vinde a mim, todos os que andais cansados e oprimidos, e eu vos darei descanso.',
            'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos darei descanso.'
          ),
          v(
            29,
            'Tomai sobre vós o meu jugo, e aprendei de mim, que sou manso e humilde de coração, e encontrareis descanso para a vossa alma.',
            'Tomai sobre vós o meu jugo e aprendei de mim, porque sou manso e humilde de coração; e achareis descanso para a vossa alma.',
            'Tomem sobre vocês o meu jugo e aprendam de mim, pois sou manso e humilde de coração, e vocês encontrarão descanso para as suas almas.',
            'Tomai sobre vós o meu jugo e aprendei comigo, que sou manso e humilde de coração, e encontrareis descanso para as vossas almas.',
            'Tomai sobre vós o meu jugo e aprendei de mim, porque sou manso e humilde de coração; e achareis descanso para a vossa alma.'
          ),
        ],
      },
      {
        chapter: 28,
        title: 'A Grande Comissão',
        verses: [
          v(
            18,
            'E, chegando-se Jesus, falou-lhes, dizendo: É-me dado todo o poder no céu e na terra.',
            'Jesus, aproximando-se, falou-lhes, dizendo: Toda a autoridade me foi dada no céu e na terra.',
            'Então Jesus aproximou-se deles e disse: "Foi-me dada toda a autoridade no céu e na terra".',
            'Jesus aproximou-se deles e disse-lhes: «Foi-me dada toda a autoridade no céu e na terra.',
            'E Jesus, aproximando-se, falou-lhes: Toda a autoridade me foi dada no céu e na terra.'
          ),
          v(
            19,
            'Portanto, ide, ensinai todas as nações, batizando-as em nome do Pai, e do Filho, e do Espírito Santo;',
            'Ide, portanto, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo;',
            'Portanto, vão e façam discípulos de todas as nações, batizando-os em nome do Pai e do Filho e do Espírito Santo,',
            'Ide, pois, e fazei discípulos de todos os povos, batizando-os em nome do Pai, do Filho e do Espírito Santo,',
            'Portanto, ide, fazei discípulos de todas as nações, batizando-os em nome do Pai, do Filho e do Espírito Santo;'
          ),
          v(
            20,
            'ensinando-as a guardar todas as coisas que eu vos tenho mandado; e eis que eu estou convosco todos os dias, até à consumação dos séculos. Ámen.',
            'ensinando-os a guardar todas as coisas que vos tenho ordenado. E eis que estou convosco todos os dias até à consumação do século.',
            'ensinando-os a obedecer a tudo o que eu ordenei a vocês. E eu estarei sempre com vocês, até o fim dos tempos.',
            'ensinando-os a cumprir tudo o que vos mandei. E ficai certos de que eu estarei sempre convosco até ao fim dos tempos.»',
            'ensinando-os a obedecer a tudo quanto vos tenho ordenado. E eis que estou convosco todos os dias, até ao fim dos tempos.'
          ),
        ],
      },
    ],
  },
  {
    id: 'joao',
    name: 'João',
    shortName: 'Jo',
    aliases: ['joao', 'joão', 'jo', 'jn'],
    testament: 'NT',
    totalChapters: 21,
    chapters: [
      {
        chapter: 1,
        title: 'O Verbo Fez-se Carne',
        verses: [
          v(
            1,
            'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.',
            'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.',
            'No princípio era aquele que é a Palavra. Ele estava com Deus, e era Deus.',
            'No princípio já existia a Palavra; a Palavra estava junto de Deus e a Palavra era Deus.',
            'No princípio era a Palavra, e a Palavra estava com Deus, e a Palavra era Deus.'
          ),
          v(
            4,
            'Nele estava a vida, e a vida era a luz dos homens.',
            'A vida estava nele e a vida era a luz dos homens.',
            'Nele estava a vida, e esta era a luz dos homens.',
            'Nele estava a vida, e a vida era a luz da humanidade.',
            'Nele estava a vida, e a vida era a luz dos homens.'
          ),
          v(
            5,
            'E a luz resplandece nas trevas, e as trevas não a compreenderam.',
            'A luz resplandece nas trevas, e as trevas não prevaleceram contra ela.',
            'A luz brilha nas trevas, e as trevas não a derrotaram.',
            'A luz brilha na escuridão e a escuridão não conseguiu apagá-la.',
            'A luz resplandece nas trevas, e as trevas não a venceram.'
          ),
          v(
            14,
            'E o Verbo se fez carne e habitou entre nós, e vimos a sua glória, como a glória do unigénito do Pai, cheio de graça e de verdade.',
            'E o Verbo se fez carne e habitou entre nós, cheio de graça e de verdade, e vimos a sua glória, glória como do unigênito do Pai.',
            'Aquele que é a Palavra tornou-se carne e viveu entre nós. Vimos a sua glória, glória como do Unigênito vindo do Pai, cheio de graça e de verdade.',
            'E a Palavra fez-se ser humano e veio habitar connosco. Vimos a sua glória, glória do Filho único do Pai, cheio de graça e de verdade.',
            'E a Palavra se fez carne e habitou entre nós; e vimos a sua glória, glória como do Filho único do Pai, cheio de graça e de verdade.'
          ),
        ],
      },
      {
        chapter: 3,
        title: 'O Novo Nascimento e o Amor de Deus',
        verses: [
          v(
            14,
            'E, como Moisés levantou a serpente no deserto, assim importa que o Filho do Homem seja levantado,',
            'E do modo por que Moisés levantou a serpente no deserto, assim importa que o Filho do Homem seja levantado,',
            'Da mesma forma como Moisés levantou a serpente no deserto, assim também é necessário que o Filho do homem seja levantado,',
            'Assim como Moisés ergueu a serpente no deserto, também o Filho do Homem tem de ser erguido,',
            'E, assim como Moisés levantou a serpente no deserto, assim importa que o Filho do Homem seja levantado,'
          ),
          v(
            15,
            'para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
            'para que todo o que nele crê tenha a vida eterna.',
            'para que todo o que nele crer tenha a vida eterna.',
            'para que todo aquele que crê nele tenha a vida eterna.',
            'para que todo o que nele crer tenha a vida eterna.'
          ),
          v(
            16,
            'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigénito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
            'Porque Deus amou ao mundo de tal maneira que deu o seu Filho unigênito, para que todo o que nele crê não pereça, mas tenha a vida eterna.',
            'Porque Deus tanto amou o mundo que deu o seu Filho Unigênito, para que todo o que nele crer não pereça, mas tenha a vida eterna.',
            'Porque Deus amou tanto o mundo que deu o seu Filho único, para que todo o que nele crê não se perca, mas tenha a vida eterna.',
            'Porque Deus amou o mundo de tal maneira que deu o seu Filho único, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.'
          ),
          v(
            17,
            'Porque Deus enviou o seu Filho ao mundo não para que condenasse o mundo, mas para que o mundo fosse salvo por ele.',
            'Porquanto Deus enviou o seu Filho ao mundo, não para que julgasse o mundo, mas para que o mundo fosse salvo por ele.',
            'Pois Deus enviou o seu Filho ao mundo, não para condenar o mundo, mas para que este fosse salvo por meio dele.',
            'De facto, Deus não enviou o Filho ao mundo para condenar o mundo, mas para que o mundo seja salvo por meio dele.',
            'Pois Deus enviou o seu Filho ao mundo não para condenar o mundo, mas para que o mundo fosse salvo por meio dele.'
          ),
        ],
      },
      {
        chapter: 14,
        title: 'O Caminho, a Verdade e a Vida',
        verses: [
          v(
            1,
            'Não se turbe o vosso coração; credes em Deus, crede também em mim.',
            'Não se turbe o vosso coração; credes em Deus, crede também em mim.',
            'Não se perturbe o coração de vocês. Creiam em Deus; creiam também em mim.',
            'Não se perturbe o vosso coração. Tendes fé em Deus; tende também fé em mim.',
            'Não se perturbe o vosso coração; credes em Deus, crede também em mim.'
          ),
          v(
            6,
            'Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim.',
            'Respondeu-lhe Jesus: Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai senão por mim.',
            'Respondeu Jesus: "Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai, a não ser por mim".',
            'Respondeu-lhe Jesus: «Eu sou o caminho, a verdade e a vida. Ninguém vai ao Pai senão por mim.»',
            'Respondeu-lhe Jesus: Eu sou o caminho, a verdade e a vida; ninguém vem ao Pai senão por mim.'
          ),
          v(
            27,
            'Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.',
            'Deixo-vos a paz, a minha paz vos dou; não vo-la dou como a dá o mundo. Não se turbe o vosso coração, nem se atemorize.',
            'Deixo a paz com vocês; a minha paz dou a vocês. Não a dou como o mundo a dá. Não se perturbe o seu coração, nem tenham medo.',
            'Deixo-vos a paz, dou-vos a minha paz. Não vo-la dou como o mundo a dá. Não se perturbe o vosso coração nem tenhais medo.',
            'Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se perturbe o vosso coração, nem tenha medo.'
          ),
        ],
      },
      {
        chapter: 15,
        title: 'A Videira Verdadeira',
        verses: [
          v(
            5,
            'Eu sou a videira, vós, as varas; quem está em mim, e eu nele, esse dá muito fruto, porque sem mim nada podeis fazer.',
            'Eu sou a videira, vós, os ramos. Quem permanece em mim, e eu, nele, esse dá muito fruto; porque sem mim nada podeis fazer.',
            'Eu sou a videira; vocês são os ramos. Se alguém permanecer em mim e eu nele, esse dará muito fruto; pois sem mim vocês não podem fazer coisa alguma.',
            'Eu sou a videira e vós os ramos. Quem permanece em mim e eu nele dá muito fruto, porque sem mim nada podeis fazer.',
            'Eu sou a videira, vós os ramos. Quem permanece em mim, e eu nele, esse dá muito fruto; pois sem mim nada podeis fazer.'
          ),
          v(
            12,
            'O meu mandamento é este: que vos ameis uns aos outros, assim como eu vos amei.',
            'O meu mandamento é este: que vos ameis uns aos outros, assim como eu vos amei.',
            'O meu mandamento é este: Amem-se uns aos outros como eu os amei.',
            'O meu mandamento é este: que vos ameis uns aos outros como eu vos amei.',
            'O meu mandamento é este: que vos ameis uns aos outros assim como eu vos amei.'
          ),
        ],
      },
    ],
  },
  {
    id: 'romanos',
    name: 'Romanos',
    shortName: 'Rm',
    aliases: ['romanos', 'rm', 'rom'],
    testament: 'NT',
    totalChapters: 16,
    chapters: [
      {
        chapter: 8,
        title: 'A Vida no Espírito e Mais que Vencedores',
        verses: [
          v(
            1,
            'Portanto, agora nenhuma condenação há para os que estão em Cristo Jesus, que não andam segundo a carne, mas segundo o Espírito.',
            'Agora, pois, já nenhuma condenação há para os que estão em Cristo Jesus.',
            'Portanto, agora já não há condenação para os que estão em Cristo Jesus,',
            'Portanto, já não há nenhuma condenação para aqueles que estão unidos a Cristo Jesus.',
            'Portanto, agora nenhuma condenação há para os que estão em Cristo Jesus.'
          ),
          v(
            26,
            'E da mesma maneira também o Espírito ajuda as nossas fraquezas; porque não sabemos o que havemos de pedir como convém, mas o mesmo Espírito intercede por nós com gemidos inexprimíveis.',
            'Também o Espírito, semelhantemente, nos assiste em nossa fraqueza; porque não sabemos orar como convém, mas o mesmo Espírito intercede por nós sobremaneira, com gemidos inexprimíveis.',
            'Da mesma forma o Espírito nos ajuda em nossa fraqueza, pois não sabemos como orar, mas o próprio Espírito intercede por nós com gemidos inexprimíveis.',
            'Do mesmo modo, o Espírito vem em auxílio da nossa fraqueza, pois não sabemos o que pedir nas nossas orações, mas o próprio Espírito intercede por nós com gemidos que não se podem exprimir.',
            'Da mesma maneira, também o Espírito nos ajuda na nossa fraqueza, porque não sabemos orar como convém, mas o mesmo Espírito intercede por nós com gemidos que não se podem exprimir.'
          ),
          v(
            28,
            'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados por seu decreto.',
            'Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.',
            'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.',
            'Sabemos que tudo contribui para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu plano.',
            'Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.'
          ),
          v(
            31,
            'Que diremos, pois, a estas coisas? Se Deus é por nós, quem será contra nós?',
            'Que diremos, pois, à vista destas coisas? Se Deus é por nós, quem será contra nós?',
            'Que diremos, pois, diante dessas coisas? Se Deus é por nós, quem será contra nós?',
            'Que dizer diante disto? Se Deus está connosco, quem poderá estar contra nós?',
            'Que diremos, pois, diante destas coisas? Se Deus é por nós, quem será contra nós?'
          ),
          v(
            38,
            'Porque estou certo de que nem a morte, nem a vida, nem os anjos, nem os principados, nem as potestades, nem o presente, nem o porvir,',
            'Porque eu estou bem certo de que nem a morte, nem a vida, nem os anjos, nem os principados, nem as coisas do presente, nem do porvir, nem os poderes,',
            'Pois estou convencido de que nem morte nem vida, nem anjos nem demônios, nem o presente nem o futuro, nem quaisquer poderes,',
            'Tenho a certeza de que nem a morte nem a vida, nem os anjos nem os espíritos superiores, nem o presente nem o futuro,',
            'Pois estou convencido de que nem a morte, nem a vida, nem anjos, nem principados, nem o presente, nem o porvir, nem poderes,'
          ),
          v(
            39,
            'nem a altura, nem a profundidade, nem alguma outra criatura nos poderá separar do amor de Deus, que está em Cristo Jesus, nosso Senhor.',
            'nem a altura, nem a profundidade, nem qualquer outra criatura poderá separar-nos do amor de Deus, que está em Cristo Jesus, nosso Senhor.',
            'nem altura nem profundidade, nem qualquer outra coisa na criação será capaz de nos separar do amor de Deus que está em Cristo Jesus, nosso Senhor.',
            'nem as forças das alturas nem as das profundezas, nem qualquer outra criatura nos poderá separar do amor de Deus que está em Cristo Jesus, nosso Senhor.',
            'nem altura, nem profundidade, nem qualquer outra criatura poderá separar-nos do amor de Deus que está em Cristo Jesus, nosso Senhor.'
          ),
        ],
      },
      {
        chapter: 12,
        title: 'Sacrifício Vivo e Amor Fraternal',
        verses: [
          v(
            1,
            'Rogo-vos, pois, irmãos, pela compaixão de Deus, que apresenteis os vossos corpos em sacrifício vivo, santo e agradável a Deus, que é o vosso culto racional.',
            'Rogo-vos, pois, irmãos, pelas misericórdias de Deus, que apresenteis o vosso corpo por sacrifício vivo, santo e agradável a Deus, que é o vosso culto racional.',
            'Portanto, irmãos, rogo-lhes pelas misericórdias de Deus que se ofereçam em sacrifício vivo, santo e agradável a Deus; este é o culto racional de vocês.',
            'Irmãos, pela misericórdia de Deus, peço-vos que vos ofereçais a vós mesmos como um sacrifício vivo, santo e agradável a Deus: é este o verdadeiro culto espiritual.',
            'Rogo-vos, pois, irmãos, pelas misericórdias de Deus, que apresenteis o vosso corpo como sacrifício vivo, santo e agradável a Deus, que é o vosso culto racional.'
          ),
          v(
            2,
            'E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento, para que experimenteis qual seja a boa, agradável e perfeita vontade de Deus.',
            'E não vos conformeis com este século, mas transformai-vos pela renovação da vossa mente, para que experimenteis qual seja a boa, agradável e perfeita vontade de Deus.',
            'Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente, para que sejam capazes de experimentar e comprovar a boa, agradável e perfeita vontade de Deus.',
            'Não vos deixeis moldar pelos critérios deste mundo; transformai-vos pela renovação da vossa mente, para saberdes distinguir qual é a vontade de Deus — o que é bom, agradável e perfeito.',
            'Não vos conformeis com este mundo, mas transformai-vos pela renovação da vossa mente, para que experimenteis qual seja a boa, agradável e perfeita vontade de Deus.'
          ),
          v(
            12,
            'Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração;',
            'regozijai-vos na esperança, sede pacientes na tribulação, na oração, perseverantes;',
            'Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração.',
            'Alegrai-vos na esperança, sede pacientes na dificuldade e constantes na oração.',
            'Alegrai-vos na esperança, sede pacientes na tribulação e perseverai na oração.'
          ),
        ],
      },
    ],
  },
  {
    id: 'filipenses',
    name: 'Filipenses',
    shortName: 'Fp',
    aliases: ['filipenses', 'fp', 'fil'],
    testament: 'NT',
    totalChapters: 4,
    chapters: [
      {
        chapter: 4,
        title: 'Alegria, Paz e Contentamento em Cristo',
        verses: [
          v(
            4,
            'Regozijai-vos sempre no Senhor; outra vez digo, regozijai-vos.',
            'Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.',
            'Alegrem-se sempre no Senhor. Novamente direi: alegrem-se!',
            'Alegrai-vos sempre no Senhor! Volto a repetir: alegrai-vos!',
            'Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.'
          ),
          v(
            6,
            'Não estejais inquietos por coisa alguma; antes, as vossas petições sejam em tudo conhecidas diante de Deus, pela oração e súplicas, com ação de graças.',
            'Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas, diante de Deus, as vossas petições, pela oração e pela súplica, com ações de graças.',
            'Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplica, e com ação de graças, apresentem seus pedidos a Deus.',
            'Não vos preocupeis com nada; pelo contrário, em todas as situações apresentai os vossos pedidos a Deus, pela oração e súplica, acompanhadas de ação de graças.',
            'Não andeis ansiosos por coisa alguma; antes, em tudo, sejam os vossos pedidos apresentados diante de Deus pela oração e súplica, com ações de graças.'
          ),
          v(
            7,
            'E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus.',
            'E a paz de Deus, que excede todo o entendimento, guardará o vosso coração e a vossa mente em Cristo Jesus.',
            'E a paz de Deus, que excede todo o entendimento, guardará o coração e a mente de vocês em Cristo Jesus.',
            'E a paz de Deus, que ultrapassa toda a compreensão, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.',
            'E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e as vossas mentes em Cristo Jesus.'
          ),
          v(
            13,
            'Posso todas as coisas naquele que me fortalece.',
            'tudo posso naquele que me fortalece.',
            'Tudo posso naquele que me fortalece.',
            'Tudo posso naquele que me dá força.',
            'Tudo posso naquele que me fortalece.'
          ),
        ],
      },
    ],
  },
];

export function getBookById(bookId: string): BibleBook | undefined {
  return BIBLE_BOOKS.find((b) => b.id === bookId);
}

export function getChapter(bookId: string, chapterNum: number) {
  const book = getBookById(bookId);
  if (!book) return undefined;
  return book.chapters.find((c) => c.chapter === chapterNum) ?? book.chapters[0];
}

export function getVerseText(
  bookId: string,
  chapterNum: number,
  verseNum: number,
  version: FallbackVersionId
): string | undefined {
  const ch = getChapter(bookId, chapterNum);
  const found = ch?.verses.find((vItem) => vItem.verse === verseNum);
  return found?.translations[version];
}
