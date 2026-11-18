import type {
  ChurchEvent,
  CommunityChallengeComment,
  PastoralDevotional,
  PrayerRequest,
  SermonItem,
  SermonNote,
  VerseReference,
} from '../types';
export { READING_PLANS } from './readingPlans';

export const CHURCH_INFO = {
  name: 'IEB Horta',
  fullName: 'Igreja Evangélica Baptista da Horta',
  handle: '@iebhorta',
  address: 'Rua Walter Bensaúde, 14 · 9900-028 Horta, Ilha do Faial, Açores',
  city: 'Horta, Faial',
  email: 'geral@iebhorta.pt',
  phone: '+351 292 000 140',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rua+Walter+Bensaude+Horta+Acores',
  wazeUrl: 'https://waze.com/ul?q=Rua%20Walter%20Bensaude%20Horta%20Portugal',
  history: [
    'A Igreja Evangélica Baptista da Horta nasceu do desejo simples de reunir famílias e jovens da Ilha do Faial em torno das Escrituras, da oração mútua e do serviço prático à cidade.',
    'Entre o basalto escuro e o azul do Atlântico, procuramos ser uma casa aberta onde a fé é vivida com honestidade, hospitalidade açoriana e fidelidade à Palavra de Deus.',
  ],
  giving: {
    entity: 'Igreja Evangélica Baptista da Horta',
    nipc: '509 418 290',
    bank: 'Caixa Económica da Misericórdia · Açores',
    iban: 'PT50 0035 0341 0004 8291 0305 7',
    mbway: '+351 914 820 340',
    note: 'Para ofertas com finalidade específica (ex.: Ação Social ou Missões), indique a referência na descrição da transferência.',
  },
  images: {
    heroVerse: '/src/assets/images/hero_verse_azores_1794862313200.jpg',
    sanctuary: '/src/assets/images/church_community_horta_1794862313212.jpg',
    studyStill: '/src/assets/images/bible_study_still_1794862314123.jpg',
  },
};

export const DAILY_VERSE_REF: VerseReference & { verse: number } = {
  bookId: 'salmos',
  bookName: 'Salmos',
  chapter: 121,
  verse: 1,
};

export const DAILY_VERSE_SECOND_REF: VerseReference & { verse: number } = {
  bookId: 'filipenses',
  bookName: 'Filipenses',
  chapter: 4,
  verse: 7,
};

export const CHURCH_EVENTS: ChurchEvent[] = [
  {
    id: 'culto-domingo',
    title: 'Culto de Celebração e Palavra',
    dayLabel: 'Domingo',
    time: '10:30',
    location: 'Templo Principal · Rua Walter Bensaúde',
    category: 'Culto Semanal',
    description: 'Adoração congregacional, leitura bíblica e pregação expositiva com escola dominical para crianças.',
  },
  {
    id: 'escola-biblica',
    title: 'Escola Bíblica de Adultos',
    dayLabel: 'Domingo',
    time: '09:30',
    location: 'Sala Atlântico · IEB Horta',
    category: 'Ensino',
    description: 'Estudo sistemático em Romanos: fundamentos do Evangelho para o quotidiano.',
  },
  {
    id: 'oracao-quarta',
    title: 'Reunião de Oração e Intercessão',
    dayLabel: 'Quarta-feira',
    time: '20:00',
    location: 'Templo Principal e Online',
    category: 'Oração',
    description: 'Tempo dedicado a orar pelos pedidos da igreja, pelas famílias da ilha e pela cidade da Horta.',
  },
  {
    id: 'jovens-sexta',
    title: 'Encontro de Jovens · Farol',
    dayLabel: 'Sexta-feira',
    time: '21:00',
    location: 'Salão Social · IEB Horta',
    category: 'Juventude',
    description: 'Conversa aberta sobre fé, vocação e amizade em Cristo, seguida de ceia partilhada.',
  },
  {
    id: 'grupos-lares',
    title: 'Grupos nos Lares (Feteira e Angústias)',
    dayLabel: 'Quinta-feira',
    time: '19:30',
    location: 'Casas de Membros',
    category: 'Comunhão',
    description: 'Pequenos grupos para partilha da leitura da semana, café e apoio mútuo.',
  },
];

export const LATEST_SERMON: SermonItem = {
  id: 'sermao-2026-11-15',
  title: 'Âncora na Tempestade: A Paz que Guarda o Coração',
  preacher: 'Pr. Duarte Medeiros',
  date: '15 de Novembro de 2026',
  series: 'Cartas de Esperança · Filipenses',
  passage: 'Filipenses 4:4-7',
  duration: '34:18',
  durationSeconds: 2058,
  youtubeId: 'jfKfPfyJRdk',
  summary:
    'Como substituir a ansiedade constante pela prática da oração grata, descansando na paz de Deus que ultrapassa o entendimento humano.',
  keyPoints: [
    'A alegria cristã não nega o vento contrário, mas ancora-se no caráter imutável do Senhor.',
    'O antídoto bíblico à inquietação é apresentar cada pedido com gratidão consciente.',
    'A paz de Deus atua como sentinela guardando a mente e as emoções em Cristo Jesus.',
  ],
};

export const PASTORAL_DEVOTIONALS: PastoralDevotional[] = [
  {
    id: 'dev-1',
    date: 'Hoje · 16 de Novembro',
    title: 'Olhar acima do horizonte do mar',
    author: 'Pr. Duarte Medeiros',
    reference: { bookId: 'salmos', bookName: 'Salmos', chapter: 121, verse: 1 },
    body: [
      'Quem vive numa ilha aprende depressa a ler os sinais do céu e do oceano. Há manhãs de neblina densa sobre o canal do Faial em que a linha do Pico desaparece por completo. O salmista conhece essa sensação de olhar em volta e perguntar: de onde me virá o socorro?',
      'A resposta não nasce da paisagem, nem da força das nossas mãos, mas de quem criou os montes e o mar. O mesmo Deus que sustenta as ilhas no meio do Atlântico guarda a tua saída e a tua entrada nesta semana.',
      'Antes de responder às urgências do dia, toma dois minutos de silêncio e entrega o primeiro pensamento a Ele.',
    ],
    prayer: 'Senhor, que o nosso olhar se erga acima das preocupações deste dia para confiar plenamente no Teu cuidado fiel. Ámen.',
  },
  {
    id: 'dev-2',
    date: '15 de Novembro',
    title: 'Quando tudo coopera para o bem',
    author: 'Diác. Helena Bettencourt',
    reference: { bookId: 'romanos', bookName: 'Romanos', chapter: 8, verse: 28 },
    body: [
      'Paulo não escreve que todas as circunstâncias são boas em si mesmas. Há perdas, esperas e dias difíceis que nos pesam verdadeiramente.',
      'A promessa de Romanos 8:28 assegura que nenhuma peça solta da nossa história escapa à mão soberana de Deus. Ele tece propósito mesmo nos fios escuros, moldando-nos à imagem do Seu Filho.',
    ],
    prayer: 'Pai, dá-nos paciência e confiança para discernir a Tua fidelidade mesmo quando não compreendemos o caminho. Ámen.',
  },
  {
    id: 'dev-3',
    date: '14 de Novembro',
    title: 'Descanso verdadeiro para almas cansadas',
    author: 'Pr. Duarte Medeiros',
    reference: { bookId: 'mateus', bookName: 'Mateus', chapter: 11, verse: 28 },
    body: [
      'O convite de Jesus não é para quem já resolveu todos os seus problemas, mas para todos os que estão cansados e sobrecarregados.',
      'Aprender com Ele é trocar o ritmo frenético da auto-suficiência pelo passo manso e humilde de quem caminha ao Seu lado.',
    ],
    prayer: 'Jesus, recebemos o Teu descanso e entregamos hoje os fardos que não conseguimos carregar sozinhos. Ámen.',
  },
];

export const COMMUNITY_CHALLENGE_INFO = {
  id: 'vencer-medo-7',
  monthLabel: 'Novembro · Desafio IEB Horta',
  title: 'Caminhar na Paz de Cristo',
  subtitle: 'Toda a igreja a ler junta o plano de 7 dias sobre confiança, oração e serenidade.',
  participantsCount: 48,
};

export const INITIAL_CHALLENGE_COMMENTS: CommunityChallengeComment[] = [
  {
    id: 'cc-1',
    author: 'Marta Silveira',
    day: 1,
    text: 'O Salmo 121 acompanhou-me hoje antes de ir trabalhar para o hospital. Lembrar que Deus não dorme trouxe-me muita calma.',
    createdAt: 'Hoje, 08:40',
  },
  {
    id: 'cc-2',
    author: 'Tiago Goulart',
    day: 2,
    text: 'Em Filipenses 4:6 chamou-me atenção a expressão "com ação de graças" — agradecer antes mesmo de ver a resposta.',
    createdAt: 'Ontem, 21:15',
  },
  {
    id: 'cc-3',
    author: 'Inês Brum',
    day: 1,
    text: 'Partilhei o versículo 2 ao jantar com os meus pais. Que bom estarmos a ler o mesmo texto como igreja!',
    createdAt: 'Ontem, 19:50',
  },
];

export const INITIAL_PRAYER_REQUESTS: PrayerRequest[] = [
  {
    id: 'pr-1',
    author: 'Mariana Furtado',
    isAnonymous: false,
    category: 'Saúde',
    content: 'Peço oração pela recuperação do meu pai após a cirurgia no Hospital da Horta esta semana, e por serenidade para toda a família.',
    createdAt: 'Há 2 horas',
    prayingCount: 14,
  },
  {
    id: 'pr-2',
    author: 'Membro da Comunidade',
    isAnonymous: true,
    category: 'Orientação',
    content: 'Estou numa fase de decisão profissional difícil entre permanecer no Faial ou aceitar trabalho fora da ilha. Orem por sabedoria clara.',
    createdAt: 'Ontem',
    prayingCount: 19,
  },
  {
    id: 'pr-3',
    author: 'Rui & Cláudia Pereira',
    isAnonymous: false,
    category: 'Gratidão',
    content: 'Agradecemos a Deus pelo nascimento saudável da nossa filha Leonor e por todo o carinho que recebemos dos irmãos da igreja.',
    createdAt: 'Há 2 dias',
    prayingCount: 31,
  },
  {
    id: 'pr-4',
    author: 'Jovens Farol',
    isAnonymous: false,
    category: 'Igreja',
    content: 'Oremos pelos jovens universitários e estudantes do Faial que nos visitam às sextas-feiras, para que encontrem acolhimento e fé viva.',
    createdAt: 'Há 3 dias',
    prayingCount: 22,
  },
];

export const INITIAL_SERMON_NOTES: SermonNote[] = [
  {
    id: 'sn-1',
    title: 'A Paz que Guarda o Coração (Filipenses 4)',
    preacher: 'Estudo Pessoal',
    date: '15 Nov 2026',
    content:
      'Apontamentos da leitura de Filipenses 4:\n\n1. A inquietação rouba a atenção do momento presente. Em Filipenses 4:6 somos convidados a transformar preocupação em oração específica com ação de graças.\n2. A promessa de Filipenses 4:7 garante que a paz de Deus guarda o coração como uma sentinela.\n3. Descansamos também em Romanos 8:28 e na companhia do Bom Pastor (Salmos 23:1).',
    updatedAt: '15 Nov 2026',
  },
  {
    id: 'sn-2',
    title: 'Luz no Meio do Atlântico (Mateus 5)',
    preacher: 'Grupo nos Lares',
    date: '08 Nov 2026',
    content:
      'Reflexão sobre o nosso testemunho na Horta:\nEm Mateus 5:14 Jesus lembra que a igreja é como uma cidade edificada sobre o monte.\nO amor descrito em João 3:16 move-nos a servir os vizinhos com generosidade e simplicidade.',
    updatedAt: '08 Nov 2026',
  },
];
