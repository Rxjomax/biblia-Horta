import type { ReadingPlan, ReadingPlanDay, VerseReference } from '../types';
import { BIBLE_BOOKS_CATALOG, getBookMetaById } from './bibleBooksCatalog';

interface ChapterCursor {
  bookId: string;
  bookName: string;
  chapter: number;
}

function buildChapterPool(bookIds: string[]): ChapterCursor[] {
  const pool: ChapterCursor[] = [];
  for (const id of bookIds) {
    const meta = getBookMetaById(id);
    if (!meta) continue;
    for (let ch = 1; ch <= meta.totalChapters; ch++) {
      pool.push({
        bookId: meta.id,
        bookName: meta.name,
        chapter: ch,
      });
    }
  }
  return pool;
}

function formatPassagesSummary(passages: VerseReference[]): string {
  if (passages.length === 0) return '';
  const grouped: { bookName: string; chapters: number[] }[] = [];
  for (const p of passages) {
    const last = grouped[grouped.length - 1];
    if (last && last.bookName === p.bookName) {
      last.chapters.push(p.chapter);
    } else {
      grouped.push({ bookName: p.bookName, chapters: [p.chapter] });
    }
  }
  return grouped
    .map((g) =>
      g.chapters.length === 1
        ? `${g.bookName} ${g.chapters[0]}`
        : `${g.bookName} ${g.chapters[0]}–${g.chapters[g.chapters.length - 1]}`
    )
    .join(' · ');
}

function distributeChaptersOverDays(
  bookIds: string[],
  totalDays: number,
  summaryLabel: string
): ReadingPlanDay[] {
  const pool = buildChapterPool(bookIds);
  const days: ReadingPlanDay[] = [];
  let cursor = 0;

  for (let d = 1; d <= totalDays; d++) {
    const remainingDays = totalDays - d + 1;
    const remainingChapters = pool.length - cursor;
    const takeCount = Math.max(1, Math.ceil(remainingChapters / remainingDays));
    const slice = pool.slice(cursor, cursor + takeCount);
    cursor += takeCount;

    const passages: VerseReference[] = slice.map((item) => ({
      bookId: item.bookId,
      bookName: item.bookName,
      chapter: item.chapter,
    }));

    const label = formatPassagesSummary(passages);
    days.push({
      day: d,
      title: label || `Leitura do Dia ${d}`,
      passages,
      summary: `${summaryLabel}: ${label}.`,
    });
  }

  return days;
}

const CANONICAL_ALL_BOOK_IDS = BIBLE_BOOKS_CATALOG.map((b) => b.id);

const CHRONOLOGICAL_BOOK_IDS = [
  'genesis',
  'job',
  'exodo',
  'levitico',
  'numeros',
  'deuteronomio',
  'josue',
  'juizes',
  'rute',
  '1samuel',
  '2samuel',
  'salmos',
  '1reis',
  'proverbios',
  'eclesiastes',
  'cantares',
  '2reis',
  'joel',
  'jonas',
  'amos',
  'oseias',
  'isaias',
  'miqueias',
  'naum',
  'sofonias',
  'habacuque',
  'jeremias',
  'lamentacoes',
  'obadias',
  'ezequiel',
  'daniel',
  '1cronicas',
  '2cronicas',
  'esdras',
  'ester',
  'ageu',
  'zacarias',
  'neemias',
  'malaquias',
  'lucas',
  'mateus',
  'marcos',
  'joao',
  'atos',
  'tiago',
  'galatas',
  '1tessalonicenses',
  '2tessalonicenses',
  '1corintios',
  '2corintios',
  'romanos',
  'efesios',
  'filipenses',
  'colossenses',
  'filemom',
  '1timoteo',
  'tito',
  '1pedro',
  '2pedro',
  '2timoteo',
  'hebreus',
  'judas',
  '1joao',
  '2joao',
  '3joao',
  'apocalipse',
];

const NT_BOOK_IDS = BIBLE_BOOKS_CATALOG.filter((b) => b.testament === 'NT').map((b) => b.id);
const GOSPELS_BOOK_IDS = ['mateus', 'marcos', 'lucas', 'joao'];

function buildPsalmsAndProverbs31Days(): ReadingPlanDay[] {
  const days: ReadingPlanDay[] = [];
  let psalmCursor = 1;
  for (let d = 1; d <= 31; d++) {
    const remainingDays = 31 - d + 1;
    const remainingPsalms = 150 - psalmCursor + 1;
    const takeCount = Math.max(1, Math.ceil(remainingPsalms / remainingDays));
    const startPsalm = psalmCursor;
    const endPsalm = Math.min(150, psalmCursor + takeCount - 1);
    psalmCursor = endPsalm + 1;

    const passages: VerseReference[] = [];
    for (let ps = startPsalm; ps <= endPsalm; ps++) {
      passages.push({ bookId: 'salmos', bookName: 'Salmos', chapter: ps });
    }
    passages.push({ bookId: 'proverbios', bookName: 'Provérbios', chapter: d });

    days.push({
      day: d,
      title: `Salmos ${startPsalm}–${endPsalm} e Provérbios ${d}`,
      passages,
      summary: `Oração poética nos Salmos ${startPsalm}–${endPsalm} e sabedoria prática em Provérbios ${d}.`,
    });
  }
  return days;
}

export const READING_PLANS: ReadingPlan[] = [
  {
    id: 'biblia-ano',
    title: 'Bíblia num Ano (Sequencial)',
    category: 'Toda a Escritura',
    durationDays: 365,
    description:
      'Leitura completa dos 66 livros (1.189 capítulos) de Génesis a Apocalipse em 365 dias (~3 a 4 capítulos por dia).',
    days: distributeChaptersOverDays(
      CANONICAL_ALL_BOOK_IDS,
      365,
      'Leitura sequencial de toda a Escritura'
    ),
  },
  {
    id: 'biblia-ano-cronologico',
    title: 'Bíblia num Ano (Cronológico)',
    category: 'Toda a Escritura',
    durationDays: 365,
    description:
      'Percorra os 66 livros na ordem histórica dos acontecimentos, situando Salmos, Profetas e Epístolas no seu contexto.',
    days: distributeChaptersOverDays(
      CHRONOLOGICAL_BOOK_IDS,
      365,
      'Leitura cronológica da história bíblica'
    ),
  },
  {
    id: 'nt-90-dias',
    title: 'Novo Testamento em 90 Dias',
    category: 'Novo Testamento',
    durationDays: 90,
    description:
      'Todos os 260 capítulos do Novo Testamento em três meses: Evangelhos, Atos, Cartas Apostólicas e Apocalipse.',
    days: distributeChaptersOverDays(NT_BOOK_IDS, 90, 'Jornada pelo Novo Testamento'),
  },
  {
    id: 'evangelhos-30',
    title: 'Evangelhos em 30 Dias',
    category: 'Vida de Jesus',
    durationDays: 30,
    description:
      'Leia Mateus, Marcos, Lucas e João completos num mês, acompanhando a vida, ensinos e cruz de Jesus Cristo.',
    days: distributeChaptersOverDays(GOSPELS_BOOK_IDS, 30, 'Caminhada pelos Quatro Evangelhos'),
  },
  {
    id: 'salmos-proverbios',
    title: 'Salmos e Provérbios (Sabedoria Diária)',
    category: 'Sabedoria e Oração',
    durationDays: 31,
    description:
      'Um capítulo diário de Provérbios acompanhado de Salmos de adoração e confiança durante 31 dias.',
    days: buildPsalmsAndProverbs31Days(),
  },
  {
    id: 'atos-14-dias',
    title: 'Igreja Primitiva: Atos em 14 Dias',
    category: 'Livros e Cartas',
    durationDays: 14,
    description:
      'Dois capítulos por dia ao longo de duas semanas para redescobrir a missão, a oração e o poder do Espírito na igreja.',
    days: distributeChaptersOverDays(['atos'], 14, 'História da Igreja em Atos'),
  },
  {
    id: 'cartas-paulo-21',
    title: 'Cartas de Paulo: Graça e Igreja (21 Dias)',
    category: 'Livros e Cartas',
    durationDays: 21,
    description:
      'Três semanas de estudo nas cartas paulinas centrais sobre justificação, unidade cristã e esperança.',
    days: [
      { day: 1, title: 'Justificados pela Fé', passages: [{ bookId: 'romanos', bookName: 'Romanos', chapter: 5 }], summary: 'Paz com Deus por meio de nosso Senhor Jesus Cristo.' },
      { day: 2, title: 'Nenhuma Condenação', passages: [{ bookId: 'romanos', bookName: 'Romanos', chapter: 8 }], summary: 'A vida no Espírito e a certeza de que nada nos separa do amor de Deus.' },
      { day: 3, title: 'Sacrifício Vivo', passages: [{ bookId: 'romanos', bookName: 'Romanos', chapter: 12 }], summary: 'Renovação da mente e serviço mútuo no corpo de Cristo.' },
      { day: 4, title: 'A Sabedoria da Cruz', passages: [{ bookId: '1corintios', bookName: '1 Coríntios', chapter: 1 }], summary: 'Cristo crucificado como poder e sabedoria de Deus.' },
      { day: 5, title: 'O Caminho Excelente do Amor', passages: [{ bookId: '1corintios', bookName: '1 Coríntios', chapter: 13 }], summary: 'Sem amor, os dons nada aproveitam; o amor jamais acaba.' },
      { day: 6, title: 'Vitória da Ressurreição', passages: [{ bookId: '1corintios', bookName: '1 Coríntios', chapter: 15 }], summary: 'A esperança firme na ressurreição de Cristo.' },
      { day: 7, title: 'Nova Criação em Cristo', passages: [{ bookId: '2corintios', bookName: '2 Coríntios', chapter: 5 }], summary: 'Embaixadores da reconciliação chamados a viver para Ele.' },
      { day: 8, title: 'Crucificado com Cristo', passages: [{ bookId: 'galatas', bookName: 'Gálatas', chapter: 2 }], summary: 'Já não sou eu quem vive, mas Cristo vive em mim.' },
      { day: 9, title: 'O Fruto do Espírito', passages: [{ bookId: 'galatas', bookName: 'Gálatas', chapter: 5 }], summary: 'Liberdade verdadeira para amar e servir ao próximo.' },
      { day: 10, title: 'Riquezas da Graça', passages: [{ bookId: 'efesios', bookName: 'Efésios', chapter: 1 }], summary: 'Todas as bênçãos espirituais em Cristo.' },
      { day: 11, title: 'Salvos pela Graça para Boas Obras', passages: [{ bookId: 'efesios', bookName: 'Efésios', chapter: 2 }], summary: 'De mortos em delitos a membros da família de Deus.' },
      { day: 12, title: 'Unidade do Corpo', passages: [{ bookId: 'efesios', bookName: 'Efésios', chapter: 4 }], summary: 'Um só Senhor, uma só fé, um só batismo.' },
      { day: 13, title: 'A Armadura de Deus', passages: [{ bookId: 'efesios', bookName: 'Efésios', chapter: 6 }], summary: 'Firmeza na verdade, na justiça e na oração perseverante.' },
      { day: 14, title: 'Viver é Cristo', passages: [{ bookId: 'filipenses', bookName: 'Filipenses', chapter: 1 }], summary: 'Alegria e confiança no Evangelho mesmo em cadeias.' },
      { day: 15, title: 'A Humildade de Jesus', passages: [{ bookId: 'filipenses', bookName: 'Filipenses', chapter: 2 }], summary: 'Ter o mesmo sentimento que houve em Cristo Jesus.' },
      { day: 16, title: 'A Paz que Excede Todo Entendimento', passages: [{ bookId: 'filipenses', bookName: 'Filipenses', chapter: 4 }], summary: 'Contentamento e gratidão em qualquer circunstância.' },
      { day: 17, title: 'A Supremacia de Cristo', passages: [{ bookId: 'colossenses', bookName: 'Colossenses', chapter: 1 }], summary: 'Tudo foi criado por Ele e para Ele.' },
      { day: 18, title: 'Revestidos de Compaixão', passages: [{ bookId: 'colossenses', bookName: 'Colossenses', chapter: 3 }], summary: 'Que a paz de Cristo seja o árbitro dos vossos corações.' },
      { day: 19, title: 'Consolo na Volta do Senhor', passages: [{ bookId: '1tessalonicenses', bookName: '1 Tessalonicenses', chapter: 4 }], summary: 'Viver de modo digno e consolar-se com a esperança cristã.' },
      { day: 20, title: 'Fidelidade à Escritura', passages: [{ bookId: '2timoteo', bookName: '2 Timóteo', chapter: 3 }], summary: 'Toda a Escritura é inspirada por Deus e útil para ensinar.' },
      { day: 21, title: 'Combater o Bom Combate', passages: [{ bookId: '2timoteo', bookName: '2 Timóteo', chapter: 4 }], summary: 'Perseverar até ao fim confiando na fidelidade do Senhor.' },
    ],
  },
  {
    id: 'vencer-medo-7',
    title: 'Vencer o Medo e a Ansiedade (7 Dias)',
    category: 'Temático · 7 Dias',
    durationDays: 7,
    description:
      'Uma semana de textos bíblicos para substituir a inquietação pela paz de Cristo.',
    days: [
      { day: 1, title: 'O Meu Socorro Vem do Senhor', passages: [{ bookId: 'salmos', bookName: 'Salmos', chapter: 121 }], summary: 'Ele não dorme e guarda cada passo da tua jornada.' },
      { day: 2, title: 'A Paz que Guarda a Mente', passages: [{ bookId: 'filipenses', bookName: 'Filipenses', chapter: 4 }], summary: 'Orar com ação de graças no meio da pressão.' },
      { day: 3, title: 'Não vos Inquieteis com o Amanhã', passages: [{ bookId: 'mateus', bookName: 'Mateus', chapter: 6 }], summary: 'Buscar em primeiro lugar o Reino de Deus.' },
      { day: 4, title: 'Deixo-vos a Minha Paz', passages: [{ bookId: 'joao', bookName: 'João', chapter: 14 }], summary: 'Não se perturbe o vosso coração nem tenha medo.' },
      { day: 5, title: 'Se Deus é por Nós', passages: [{ bookId: 'romanos', bookName: 'Romanos', chapter: 8 }], summary: 'Nada nos pode separar do amor de Deus.' },
      { day: 6, title: 'O Bom Pastor no Vale', passages: [{ bookId: 'salmos', bookName: 'Salmos', chapter: 23 }], summary: 'A Sua presença afasta o temor mesmo na escuridão.' },
      { day: 7, title: 'Aquietai-vos e Sabei', passages: [{ bookId: 'salmos', bookName: 'Salmos', chapter: 46 }], summary: 'Descansar na soberania de quem governa a terra e os mares.' },
    ],
  },
  {
    id: 'oracao-intimidade-7',
    title: 'Oração e Intimidade com Deus (7 Dias)',
    category: 'Temático · 7 Dias',
    durationDays: 7,
    description:
      'Sete leituras selecionadas para aprofundar a vida secreta de oração, adoração e intercessão.',
    days: [
      { day: 1, title: 'No Lugar Secreto com o Pai', passages: [{ bookId: 'mateus', bookName: 'Mateus', chapter: 6 }], summary: 'Jesus ensina o Pai Nosso com simplicidade e confiança filial.' },
      { day: 2, title: 'Uma Coisa Peço ao Senhor', passages: [{ bookId: 'salmos', bookName: 'Salmos', chapter: 27 }], summary: 'Contemplar a beleza do Senhor e esperar nEle com coragem.' },
      { day: 3, title: 'Pedi, Buscai e Batei', passages: [{ bookId: 'lucas', bookName: 'Lucas', chapter: 11 }], summary: 'A bondade do Pai que dá o Espírito Santo aos que Lho pedem.' },
      { day: 4, title: 'A Minha Alma Tem Sede de Ti', passages: [{ bookId: 'salmos', bookName: 'Salmos', chapter: 63 }], summary: 'Buscar a Deus de madrugada como em terra seca.' },
      { day: 5, title: 'Oração pelo Povo e pela Cidade', passages: [{ bookId: 'daniel', bookName: 'Daniel', chapter: 9 }], summary: 'Exemplo de intercessão humilde apoiada nas promessas bíblicas.' },
      { day: 6, title: 'A Oração Sacerdotal de Jesus', passages: [{ bookId: 'joao', bookName: 'João', chapter: 17 }], summary: 'Cristo ora pela santificação e unidade dos Seus discípulos.' },
      { day: 7, title: 'A Oração do Justo Pode Muito', passages: [{ bookId: 'tiago', bookName: 'Tiago', chapter: 5 }], summary: 'Orar uns pelos outros na alegria, na doença e na espera.' },
    ],
  },
  {
    id: 'proposito-vocacao-7',
    title: 'Propósito, Vocação e Serviço (7 Dias)',
    category: 'Temático · 7 Dias',
    durationDays: 7,
    description:
      'Descobrir a identidade em Cristo e o chamado prático para servir na igreja e no trabalho quotidiano.',
    days: [
      { day: 1, title: 'Conhecidos Antes de Nascer', passages: [{ bookId: 'jeremias', bookName: 'Jeremias', chapter: 1 }], summary: 'Deus capacita quem Ele chama com a Sua presença fiel.' },
      { day: 2, title: 'Obra-Prima Criada em Cristo', passages: [{ bookId: 'efesios', bookName: 'Efésios', chapter: 2 }], summary: 'Criados para boas obras que Deus preparou de antemão.' },
      { day: 3, title: 'Sal da Terra e Luz do Mundo', passages: [{ bookId: 'mateus', bookName: 'Mateus', chapter: 5 }], summary: 'Testemunho visível que glorifica o Pai nos céus.' },
      { day: 4, title: 'Permanecer na Videira', passages: [{ bookId: 'joao', bookName: 'João', chapter: 15 }], summary: 'Sem Jesus nada podemos fazer; unidos a Ele damos fruto.' },
      { day: 5, title: 'Dons Diferentes, Um Só Espírito', passages: [{ bookId: '1corintios', bookName: '1 Coríntios', chapter: 12 }], summary: 'Cada membro da igreja é indispensável para o bem comum.' },
      { day: 6, title: 'Fazer Tudo como para o Senhor', passages: [{ bookId: 'colossenses', bookName: 'Colossenses', chapter: 3 }], summary: 'O trabalho diário transformado em adoração fiel.' },
      { day: 7, title: 'Ide por Todo o Mundo', passages: [{ bookId: 'mateus', bookName: 'Mateus', chapter: 28 }], summary: 'Fazer discípulos confiando na presença de Cristo todos os dias.' },
    ],
  },
  {
    id: 'familia-lar-7',
    title: 'Família, Casamento e Lar Cristão (7 Dias)',
    category: 'Temático · 7 Dias',
    durationDays: 7,
    description:
      'Princípios bíblicos de amor sacrificial, educação dos filhos, perdão e hospitalidade no lar.',
    days: [
      { day: 1, title: 'Aliança na Criação', passages: [{ bookId: 'genesis', bookName: 'Génesis', chapter: 2 }], summary: 'O desenho original de Deus para a comunhão e o matrimónio.' },
      { day: 2, title: 'Se o Senhor Não Edificar a Casa', passages: [{ bookId: 'salmos', bookName: 'Salmos', chapter: 127 }], summary: 'Os filhos como herança e o descanso que vem de Deus.' },
      { day: 3, title: 'Bem-Aventurado o Lar que Teme a Deus', passages: [{ bookId: 'salmos', bookName: 'Salmos', chapter: 128 }], summary: 'A bênção quotidiana à volta da mesa familiar.' },
      { day: 4, title: 'Sabedoria e Virtude no Lar', passages: [{ bookId: 'proverbios', bookName: 'Provérbios', chapter: 31 }], summary: 'Força, dignidade e cuidado generoso pelos necessitados.' },
      { day: 5, title: 'Amor Sacrificial no Casamento', passages: [{ bookId: 'efesios', bookName: 'Efésios', chapter: 5 }], summary: 'Maridos e esposas refletindo o amor de Cristo pela igreja.' },
      { day: 6, title: 'Pais e Filhos em Graça', passages: [{ bookId: 'efesios', bookName: 'Efésios', chapter: 6 }], summary: 'Honra, instrução paciente e disciplina no Senhor.' },
      { day: 7, title: 'Fé Transmitida de Geração em Geração', passages: [{ bookId: 'deuteronomio', bookName: 'Deuteronómio', chapter: 6 }], summary: 'Conversar sobre a Palavra de Deus em casa e pelo caminho.' },
    ],
  },
  {
    id: 'esperanca-provacoes-7',
    title: 'Esperança e Fé nas Provações (7 Dias)',
    category: 'Temático · 7 Dias',
    durationDays: 7,
    description:
      'Consolo e firmeza bíblica para tempos de luto, cansaço ou incerteza, olhando para a eternidade.',
    days: [
      { day: 1, title: 'Alegria Pura nas Provações', passages: [{ bookId: 'tiago', bookName: 'Tiago', chapter: 1 }], summary: 'A prova da fé produz perseverança e maturidade.' },
      { day: 2, title: 'Herança Incorruptível', passages: [{ bookId: '1pedro', bookName: '1 Pedro', chapter: 1 }], summary: 'Nascidos de novo para uma esperança viva pela ressurreição.' },
      { day: 3, title: 'Tesouro em Vasos de Barro', passages: [{ bookId: '2corintios', bookName: '2 Coríntios', chapter: 4 }], summary: 'As aflições leves produzem um eterno peso de glória.' },
      { day: 4, title: 'Espera em Deus, Minha Alma', passages: [{ bookId: 'salmos', bookName: 'Salmos', chapter: 42 }], summary: 'Dialogar com a própria tristeza à luz da fidelidade divina.' },
      { day: 5, title: 'Quando Passares pelas Águas', passages: [{ bookId: 'isaias', bookName: 'Isaías', chapter: 43 }], summary: 'Eu estarei contigo; os rios não te submergirão.' },
      { day: 6, title: 'A Nuvem de Testemunhas', passages: [{ bookId: 'hebreus', bookName: 'Hebreus', chapter: 11 }], summary: 'Homens e mulheres que perseveraram vendo o Invisível.' },
      { day: 7, title: 'Novo Céu e Nova Terra', passages: [{ bookId: 'apocalipse', bookName: 'Apocalipse', chapter: 21 }], summary: 'Deus enxugará toda lágrima; já não haverá morte nem dor.' },
    ],
  },
];
