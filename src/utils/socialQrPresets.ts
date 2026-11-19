import { CHURCH_INFO, OFFICIAL_APP_URL } from '../data/churchData';

export interface SocialQRMessagePreset {
  id: string;
  label: string;
  kicker: string;
  headline: string;
  body: string;
  cta: string;
}

export interface SocialQRThemePreset {
  id: string;
  label: string;
  bgGradient: [string, string, string];
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isLight: boolean;
  imageUrl?: string;
  scrimColor?: string;
}

export const SOCIAL_QR_URL = OFFICIAL_APP_URL;
export const SOCIAL_QR_DISPLAY_DOMAIN = 'biblia-horta.vercel.app';

export const SOCIAL_QR_MESSAGES: SocialQRMessagePreset[] = [
  {
    id: 'palavra-no-bolso',
    label: 'Convite Geral',
    kicker: 'IEB Horta · Aplicação Oficial',
    headline: 'A Palavra no teu bolso, todos os dias.',
    body: 'Bíblia completa em 7 traduções, planos de leitura e mural de oração da nossa igreja na Horta.',
    cta: 'Aponta a câmara para abrir o site',
  },
  {
    id: 'caminha-com-a-igreja',
    label: 'Comunidade & Culto',
    kicker: 'Igreja Evangélica Baptista da Horta',
    headline: 'Lê, anota e caminha com a igreja.',
    body: 'Acompanha as leituras da semana, guarda apontamentos dos sermões e ora pela nossa comunidade no Faial.',
    cta: 'Lê o QR Code para aceder agora',
  },
  {
    id: 'comeca-o-dia',
    label: 'Devocional Diário',
    kicker: 'Pausa Diária nas Escrituras',
    headline: 'Começa o dia com um versículo.',
    body: 'Um minuto de quietude diante da Bíblia antes da correria. Gratuita, sem anúncios e pronta para ler offline.',
    cta: 'Aponta a câmara do telemóvel',
  },
  {
    id: 'boas-vindas',
    label: 'Boas-Vindas',
    kicker: 'Horta · Ilha do Faial · Açores',
    headline: 'Vem conhecer a IEB Horta.',
    body: 'Horários dos cultos, eventos da semana, pedidos de oração e leitura bíblica num só lugar.',
    cta: 'Digitaliza para visitar o nosso site',
  },
  {
    id: 'partilha-esperanca',
    label: 'Partilha nas Redes',
    kicker: 'Fé no Quotidiano · @iebhorta',
    headline: 'Partilha a Esperança com alguém hoje.',
    body: 'Cria cartões com versículos, lê em família e segue planos bíblicos completos em português.',
    cta: 'Aponta a câmara e experimenta',
  },
  {
    id: 'instala-no-telemovel',
    label: 'Instalar App',
    kicker: 'Android & iPhone · Acesso Direto',
    headline: 'Leva a Bíblia da IEB Horta contigo.',
    body: 'Instala gratuitamente no ecrã inicial do teu telemóvel e lê mesmo sem ligação à internet.',
    cta: 'Digitaliza para abrir e instalar',
  },
];

export const SOCIAL_QR_THEMES: SocialQRThemePreset[] = [
  {
    id: 'atlantico',
    label: 'Atlântico',
    bgGradient: ['#0B1B34', '#13294B', '#1C3966'],
    textColor: '#FAF8F4',
    mutedColor: '#D6DDEA',
    accentColor: '#E0B45A',
    isLight: false,
  },
  {
    id: 'marfim',
    label: 'Marfim Editorial',
    bgGradient: ['#FAF8F4', '#F4EFE4', '#ECE4D3'],
    textColor: '#13294B',
    mutedColor: '#435065',
    accentColor: '#8C6218',
    isLight: true,
  },
  {
    id: 'faial',
    label: 'Costa do Faial',
    bgGradient: ['#0B182C', '#13294B', '#18365D'],
    textColor: '#FAF8F4',
    mutedColor: '#E2E7F0',
    accentColor: '#E5BC66',
    isLight: false,
    imageUrl: CHURCH_INFO.images.heroVerse,
    scrimColor: 'rgba(10, 21, 39, 0.72)',
  },
  {
    id: 'biblia',
    label: 'Bíblia Aberta',
    bgGradient: ['#1C150F', '#2B2016', '#3B2C1E'],
    textColor: '#FAF8F4',
    mutedColor: '#EAE1D5',
    accentColor: '#E5BC66',
    isLight: false,
    imageUrl: CHURCH_INFO.images.shareOpenBible,
    scrimColor: 'rgba(20, 14, 9, 0.72)',
  },
];

export function buildSocialCaption(headline: string, body: string): string {
  const cleanHeadline = headline.trim();
  const cleanBody = body.trim();
  return [
    cleanHeadline,
    cleanBody,
    '',
    `Acede já em: ${SOCIAL_QR_URL}`,
    `${CHURCH_INFO.name} (${CHURCH_INFO.handle}) · ${CHURCH_INFO.city}`,
    '#IEBHorta #Bíblia #IgrejaNosAçores #Faial',
  ]
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n');
}

export function getNextMessagePreset(
  currentId: string,
  presets: SocialQRMessagePreset[] = SOCIAL_QR_MESSAGES
): SocialQRMessagePreset {
  const idx = presets.findIndex((p) => p.id === currentId);
  if (idx === -1 || presets.length === 0) {
    return presets[0];
  }
  return presets[(idx + 1) % presets.length];
}
