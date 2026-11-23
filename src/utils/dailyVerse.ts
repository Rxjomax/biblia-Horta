import { getBookMetaById } from '../data/bibleBooksCatalog';
import { getVerseFromCorpusOrFallback } from '../services/bibleLoader';
import type { BibleCorpus, BibleVersionId, VerseReference } from '../types';

export interface DailyVerseEntry extends VerseReference {
  verse: number;
  fallbackText: string;
}

/**
 * 60 curated daily verses spanning Old & New Testaments so the church receives
 * a fresh verse automatically every calendar day without repeating for two months.
 */
export const DAILY_VERSES: DailyVerseEntry[] = [
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 121,
    verse: 1,
    fallbackText: 'Levanto os meus olhos para os montes e pergunto: De onde me vem o socorro?',
  },
  {
    bookId: 'filipenses',
    bookName: 'Filipenses',
    chapter: 4,
    verse: 7,
    fallbackText: 'E a paz de Deus, que excede todo o entendimento, guardará o coração e a mente de vocês em Cristo Jesus.',
  },
  {
    bookId: 'romanos',
    bookName: 'Romanos',
    chapter: 8,
    verse: 28,
    fallbackText: 'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.',
  },
  {
    bookId: 'isaias',
    bookName: 'Isaías',
    chapter: 41,
    verse: 10,
    fallbackText: 'Por isso não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 23,
    verse: 1,
    fallbackText: 'O Senhor é o meu pastor; de nada terei falta.',
  },
  {
    bookId: 'proverbios',
    bookName: 'Provérbios',
    chapter: 3,
    verse: 5,
    fallbackText: 'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.',
  },
  {
    bookId: 'josue',
    bookName: 'Josué',
    chapter: 1,
    verse: 9,
    fallbackText: 'Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.',
  },
  {
    bookId: 'mateus',
    bookName: 'Mateus',
    chapter: 11,
    verse: 28,
    fallbackText: 'Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.',
  },
  {
    bookId: 'joao',
    bookName: 'João',
    chapter: 3,
    verse: 16,
    fallbackText: 'Porque Deus tanto amou o mundo que deu o seu Filho Unigénito, para que todo o que nele crer não pereça, mas tenha a vida eterna.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 46,
    verse: 1,
    fallbackText: 'Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na adversidade.',
  },
  {
    bookId: 'lamentacoes',
    bookName: 'Lamentações',
    chapter: 3,
    verse: 22,
    fallbackText: 'Graças ao grande amor do Senhor é que não somos consumidos, pois as suas misericórdias são inesgotáveis.',
  },
  {
    bookId: 'jeremias',
    bookName: 'Jeremias',
    chapter: 29,
    verse: 11,
    fallbackText: 'Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 119,
    verse: 105,
    fallbackText: 'A tua palavra é lâmpada que ilumina os meus passos e luz que clareia o meu caminho.',
  },
  {
    bookId: 'mateus',
    bookName: 'Mateus',
    chapter: 6,
    verse: 33,
    fallbackText: 'Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas serão acrescentadas a vocês.',
  },
  {
    bookId: 'isaias',
    bookName: 'Isaías',
    chapter: 40,
    verse: 31,
    fallbackText: 'Mas aqueles que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos, andam e não se cansam.',
  },
  {
    bookId: 'joao',
    bookName: 'João',
    chapter: 14,
    verse: 27,
    fallbackText: 'Deixo a paz a vocês; a minha paz dou a vocês. Não a dou como o mundo a dá. Não se perturbe o seu coração, nem tenham medo.',
  },
  {
    bookId: 'romanos',
    bookName: 'Romanos',
    chapter: 12,
    verse: 2,
    fallbackText: 'Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente, para que sejam capazes de experimentar e comprovar a boa, agradável e perfeita vontade de Deus.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 27,
    verse: 1,
    fallbackText: 'O Senhor é a minha luz e a minha salvação; de quem terei temor? O Senhor é o meu forte refúgio; de quem terei medo?',
  },
  {
    bookId: 'filipenses',
    bookName: 'Filipenses',
    chapter: 4,
    verse: 13,
    fallbackText: 'Tudo posso naquele que me fortalece.',
  },
  {
    bookId: '2corintios',
    bookName: '2 Coríntios',
    chapter: 12,
    verse: 9,
    fallbackText: 'Mas ele me disse: A minha graça é suficiente para você, pois o meu poder se aperfeiçoa na fraqueza.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 91,
    verse: 1,
    fallbackText: 'Aquele que habita no abrigo do Altíssimo e descansa à sombra do Todo-poderoso.',
  },
  {
    bookId: 'joao',
    bookName: 'João',
    chapter: 15,
    verse: 5,
    fallbackText: 'Eu sou a videira; vocês são os ramos. Se alguém permanecer em mim e eu nele, esse dará muito fruto; pois sem mim vocês não podem fazer coisa alguma.',
  },
  {
    bookId: 'efesios',
    bookName: 'Efésios',
    chapter: 2,
    verse: 8,
    fallbackText: 'Pois vocês são salvos pela graça, por meio da fé, e isto não vem de vocês, é dom de Deus.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 37,
    verse: 5,
    fallbackText: 'Entregue o seu caminho ao Senhor; confie nele, e ele agirá.',
  },
  {
    bookId: 'hebreus',
    bookName: 'Hebreus',
    chapter: 11,
    verse: 1,
    fallbackText: 'Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.',
  },
  {
    bookId: '1pedro',
    bookName: '1 Pedro',
    chapter: 5,
    verse: 7,
    fallbackText: 'Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 34,
    verse: 8,
    fallbackText: 'Provem, e vejam como o Senhor é bom. Como é feliz o homem que nele se refugia!',
  },
  {
    bookId: 'romanos',
    bookName: 'Romanos',
    chapter: 15,
    verse: 13,
    fallbackText: 'Que o Deus da esperança os encha de toda alegria e paz, por sua confiança nele, para que vocês transbordem de esperança, pelo poder do Espírito Santo.',
  },
  {
    bookId: 'galatas',
    bookName: 'Gálatas',
    chapter: 5,
    verse: 22,
    fallbackText: 'Mas o fruto do Espírito é amor, alegria, paz, paciência, amabilidade, bondade, fidelidade.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 139,
    verse: 14,
    fallbackText: 'Eu te louvo porque me fizeste de modo especial e admirável. Tuas obras são maravilhosas! Disso tenho plena certeza.',
  },
  {
    bookId: 'tiago',
    bookName: 'Tiago',
    chapter: 1,
    verse: 5,
    fallbackText: 'Se algum de vocês tem falta de sabedoria, peça-a a Deus, que a todos dá livremente, de boa vontade; e lhe será concedida.',
  },
  {
    bookId: 'colossenses',
    bookName: 'Colossenses',
    chapter: 3,
    verse: 23,
    fallbackText: 'Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 100,
    verse: 5,
    fallbackText: 'Pois o Senhor é bom e o seu amor leal é eterno; a sua fidelidade permanece por todas as gerações.',
  },
  {
    bookId: 'joao',
    bookName: 'João',
    chapter: 8,
    verse: 12,
    fallbackText: 'Falando novamente ao povo, Jesus disse: Eu sou a luz do mundo. Quem me segue, nunca andará em trevas, mas terá a luz da vida.',
  },
  {
    bookId: 'deuteronomio',
    bookName: 'Deuteronómio',
    chapter: 31,
    verse: 6,
    fallbackText: 'Sejam fortes e corajosos. Não tenham medo nem fiquem apavorados por causa delas, pois o Senhor, o seu Deus, vai com vocês; nunca os deixará, nunca os abandonará.',
  },
  {
    bookId: '1corintios',
    bookName: '1 Coríntios',
    chapter: 13,
    verse: 4,
    fallbackText: 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 51,
    verse: 10,
    fallbackText: 'Cria em mim um coração puro, ó Deus, e renova dentro de mim um espírito estável.',
  },
  {
    bookId: '2timoteo',
    bookName: '2 Timóteo',
    chapter: 1,
    verse: 7,
    fallbackText: 'Pois Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio.',
  },
  {
    bookId: 'proverbios',
    bookName: 'Provérbios',
    chapter: 16,
    verse: 3,
    fallbackText: 'Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.',
  },
  {
    bookId: '1tessalonicenses',
    bookName: '1 Tessalonicenses',
    chapter: 5,
    verse: 18,
    fallbackText: 'Deem graças em todas as circunstâncias, pois esta é a vontade de Deus para vocês em Cristo Jesus.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 118,
    verse: 24,
    fallbackText: 'Este é o dia em que o Senhor agiu; alegremo-nos e exultemos neste dia.',
  },
  {
    bookId: 'mateus',
    bookName: 'Mateus',
    chapter: 5,
    verse: 14,
    fallbackText: 'Vocês são a luz do mundo. Não se pode esconder uma cidade construída sobre um monte.',
  },
  {
    bookId: 'hebreus',
    bookName: 'Hebreus',
    chapter: 13,
    verse: 8,
    fallbackText: 'Jesus Cristo é o mesmo, ontem, hoje e para sempre.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 16,
    verse: 11,
    fallbackText: 'Tu me farás conhecer a vereda da vida, a alegria plena da tua presença, eterno prazer à tua direita.',
  },
  {
    bookId: '1joao',
    bookName: '1 João',
    chapter: 4,
    verse: 19,
    fallbackText: 'Nós amamos porque ele nos amou primeiro.',
  },
  {
    bookId: 'isaias',
    bookName: 'Isaías',
    chapter: 26,
    verse: 3,
    fallbackText: 'Tu guardarás em perfeita paz aquele cujo propósito está firme, porque em ti confia.',
  },
  {
    bookId: 'romanos',
    bookName: 'Romanos',
    chapter: 8,
    verse: 38,
    fallbackText: 'Pois estou convencido de que nem morte nem vida, nem anjos nem demónios, nem o presente nem o futuro, nem quaisquer poderes poderão separar-nos do amor de Deus.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 19,
    verse: 1,
    fallbackText: 'Os céus declaram a glória de Deus; o firmamento proclama a obra das suas mãos.',
  },
  {
    bookId: 'miqueias',
    bookName: 'Miqueias',
    chapter: 6,
    verse: 8,
    fallbackText: 'Ele mostrou a você, ó homem, o que é bom e o que o Senhor exige: pratique a justiça, ame a fidelidade e ande humildemente com o seu Deus.',
  },
  {
    bookId: '2corintios',
    bookName: '2 Coríntios',
    chapter: 5,
    verse: 17,
    fallbackText: 'Portanto, se alguém está em Cristo, é nova criação. As coisas antigas já passaram; eis que surgiram coisas novas!',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 103,
    verse: 2,
    fallbackText: 'Bendiga o Senhor a minha alma! Não esqueça nenhuma de suas bênçãos!',
  },
  {
    bookId: 'joao',
    bookName: 'João',
    chapter: 16,
    verse: 33,
    fallbackText: 'Eu disse essas coisas para que em mim vocês tenham paz. Neste mundo vocês terão aflições; contudo, tenham ânimo! Eu venci o mundo.',
  },
  {
    bookId: 'filipenses',
    bookName: 'Filipenses',
    chapter: 1,
    verse: 6,
    fallbackText: 'Estou convencido de que aquele que começou boa obra em vocês, vai completá-la até ao dia de Cristo Jesus.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 62,
    verse: 1,
    fallbackText: 'A minha alma descansa somente em Deus; dele vem a minha salvação.',
  },
  {
    bookId: 'neemias',
    bookName: 'Neemias',
    chapter: 8,
    verse: 10,
    fallbackText: 'Não se entristeçam, porque a alegria do Senhor os fortalecerá.',
  },
  {
    bookId: 'efesios',
    bookName: 'Efésios',
    chapter: 3,
    verse: 20,
    fallbackText: 'Àquele que é capaz de fazer infinitamente mais do que tudo o que pedimos ou pensamos, de acordo com o seu poder que atua em nós.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 145,
    verse: 18,
    fallbackText: 'O Senhor está perto de todos os que o invocam, de todos os que o invocam com sinceridade.',
  },
  {
    bookId: '1corintios',
    bookName: '1 Coríntios',
    chapter: 16,
    verse: 14,
    fallbackText: 'Façam tudo com amor.',
  },
  {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 86,
    verse: 5,
    fallbackText: 'Tu és bondoso e perdoador, Senhor, rico em graça para com todos os que te invocam.',
  },
  {
    bookId: 'apocalipse',
    bookName: 'Apocalipse',
    chapter: 21,
    verse: 4,
    fallbackText: 'Ele enxugará dos seus olhos toda lágrima. Não haverá mais morte, nem tristeza, nem choro, nem dor, pois a antiga ordem já passou.',
  },
];

/**
 * Deterministic daily index based on the user's local calendar date (YYYY-MM-DD),
 * ensuring a fresh verse automatically at local midnight every day.
 */
export function getDailyVerseIndex(
  date: Date = new Date(),
  total: number = DAILY_VERSES.length
): number {
  if (total <= 0) return 0;
  const localDayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  );
  return ((localDayNumber % total) + total) % total;
}

export function getDailyVerseForDate(date: Date = new Date()): DailyVerseEntry {
  const index = getDailyVerseIndex(date, DAILY_VERSES.length);
  return DAILY_VERSES[index] ?? DAILY_VERSES[0];
}

export function formatDailyVerseReference(entry: {
  bookName: string;
  chapter: number;
  verse: number;
}): string {
  return `${entry.bookName} ${entry.chapter}:${entry.verse}`;
}

export function resolveDailyVerseText(
  entry: DailyVerseEntry,
  bibleVersion: BibleVersionId,
  primaryCorpus?: BibleCorpus
): string {
  if (primaryCorpus) {
    const meta = getBookMetaById(entry.bookId);
    const direct = meta
      ? primaryCorpus[meta.index]?.[entry.chapter - 1]?.[entry.verse - 1]
      : undefined;
    if (direct && direct.trim()) {
      return direct.trim();
    }
  }

  const fromLoader = getVerseFromCorpusOrFallback(
    bibleVersion,
    entry.bookId,
    entry.chapter,
    entry.verse
  );
  if (fromLoader && fromLoader.trim()) {
    return fromLoader.trim();
  }

  return entry.fallbackText;
}
