import { CHURCH_INFO } from '../data/churchData';

export type ShareCategoryFilter = 'all' | 'photo' | 'theme';

export interface ShareBackgroundPreset {
  id: string;
  label: string;
  subtitle: string;
  type: 'photo' | 'theme';
  imageUrl?: string;
  isLight?: boolean;
  keywords: string[];
  bgGradient: [string, string, string];
  scrim: [string, string, string];
  accentColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  swatchStyle: string;
}

export const SHARE_QUICK_TOPICS: Array<{ label: string; query: string }> = [
  { label: 'Paz', query: 'paz' },
  { label: 'Luz', query: 'luz' },
  { label: 'Esperança', query: 'esperança' },
  { label: 'Pastor', query: 'pastor' },
  { label: 'Noite', query: 'noite' },
  { label: 'Caminho', query: 'caminho' },
  { label: 'Mar', query: 'mar' },
  { label: 'Gratidão', query: 'gratidão' },
];

export const SHARE_BACKGROUNDS: ShareBackgroundPreset[] = [
  {
    id: 'amanhecer-pico',
    label: 'Amanhecer',
    subtitle: 'Nascer do Sol',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareDawn,
    keywords: [
      'amanhecer',
      'manha',
      'nascer',
      'esperanca',
      'renovacao',
      'misericordia',
      'novo',
      'dia',
      'sol',
      'horizonte',
      'alvorada',
      'pico',
    ],
    bgGradient: ['#2B1E19', '#191417', '#0D1320'],
    scrim: ['rgba(16, 20, 30, 0.68)', 'rgba(18, 22, 34, 0.56)', 'rgba(10, 14, 24, 0.86)'],
    accentColor: '#ECCB7B',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(236, 203, 123, 0.48)',
    swatchStyle: 'from-[#A66E4E] to-[#1D2538]',
  },
  {
    id: 'luz-montanhas',
    label: 'Montanhas',
    subtitle: 'Montes e Mar',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareMountainLight,
    keywords: [
      'montes',
      'montanha',
      'socorro',
      'olhos',
      'rocha',
      'refugio',
      'forca',
      'salmos',
      'elevo',
      'criacao',
      'monte',
    ],
    bgGradient: ['#14262E', '#0F1E28', '#09131C'],
    scrim: ['rgba(10, 20, 28, 0.68)', 'rgba(12, 24, 34, 0.56)', 'rgba(8, 16, 24, 0.88)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(212, 168, 78, 0.48)',
    swatchStyle: 'from-[#2D4D3E] to-[#102030]',
  },
  {
    id: 'farol-atlantico',
    label: 'Farol',
    subtitle: 'Luz na Costa',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareLighthouse,
    keywords: [
      'farol',
      'luz',
      'lampada',
      'direcao',
      'guia',
      'tempestade',
      'ancora',
      'fe',
      'vigilia',
      'firmeza',
      'esperanca',
      'mateus',
    ],
    bgGradient: ['#1B2430', '#111824', '#080E17'],
    scrim: ['rgba(12, 18, 28, 0.66)', 'rgba(14, 20, 32, 0.56)', 'rgba(8, 12, 20, 0.88)'],
    accentColor: '#ECCB7B',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(236, 203, 123, 0.48)',
    swatchStyle: 'from-[#3A4D63] to-[#111926]',
  },
  {
    id: 'por-do-sol',
    label: 'Pôr do Sol',
    subtitle: 'Mar Sereno',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareCalmSunset,
    keywords: [
      'paz',
      'descanso',
      'serenidade',
      'calma',
      'coracao',
      'mansidao',
      'entardecer',
      'filipenses',
      'ansiedade',
      'quietude',
      'lagrimas',
      'consolo',
    ],
    bgGradient: ['#36241B', '#211B24', '#0F1622'],
    scrim: ['rgba(20, 18, 26, 0.64)', 'rgba(18, 20, 28, 0.52)', 'rgba(10, 14, 22, 0.88)'],
    accentColor: '#F2CF81',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(242, 207, 129, 0.48)',
    swatchStyle: 'from-[#9E613E] to-[#1A2438]',
  },
  {
    id: 'pastos-verdes',
    label: 'Pastos',
    subtitle: 'Vale Verdejante',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.sharePastures,
    keywords: [
      'pastor',
      'pastos',
      'ovelhas',
      'verde',
      'provisao',
      'graca',
      'cuidado',
      'salmos 23',
      'rebanho',
      'descanso',
      'vida',
      'natureza',
    ],
    bgGradient: ['#1B2E22', '#122118', '#0A140F'],
    scrim: ['rgba(12, 24, 16, 0.66)', 'rgba(12, 22, 16, 0.54)', 'rgba(8, 16, 12, 0.88)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(212, 168, 78, 0.48)',
    swatchStyle: 'from-[#3D6649] to-[#132419]',
  },
  {
    id: 'noite-estrelada',
    label: 'Noite Estrelada',
    subtitle: 'Céu e Oceano',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareStarryNight,
    keywords: [
      'noite',
      'estrelas',
      'ceu',
      'ceus',
      'promessa',
      'gloria',
      'oracao',
      'silencio',
      'abraao',
      'eternidade',
      'dormir',
      'guarda',
    ],
    bgGradient: ['#0B1424', '#0F1C33', '#070D17'],
    scrim: ['rgba(8, 14, 26, 0.66)', 'rgba(10, 18, 32, 0.54)', 'rgba(6, 10, 20, 0.88)'],
    accentColor: '#ECCB7B',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(236, 203, 123, 0.48)',
    swatchStyle: 'from-[#182E52] to-[#080F1D]',
  },
  {
    id: 'hortensias-faial',
    label: 'Hortênsias',
    subtitle: 'Flores dos Açores',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareHydrangeas,
    keywords: [
      'flores',
      'alegria',
      'gratidao',
      'louvor',
      'amor',
      'familia',
      'primavera',
      'lirios',
      'beleza',
      'horta',
      'coracao',
      'gracas',
    ],
    bgGradient: ['#192B3D', '#162530', '#0D1720'],
    scrim: ['rgba(12, 22, 34, 0.66)', 'rgba(14, 24, 34, 0.56)', 'rgba(8, 14, 22, 0.88)'],
    accentColor: '#ECCB7B',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(236, 203, 123, 0.48)',
    swatchStyle: 'from-[#4473A6] to-[#192E38]',
  },
  {
    id: 'trilho-costa',
    label: 'Caminho',
    subtitle: 'Trilho na Falésia',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareCoastalPath,
    keywords: [
      'caminho',
      'caminhada',
      'passos',
      'pes',
      'jornada',
      'perseveranca',
      'seguir',
      'verdade',
      'vereda',
      'coragem',
      'firme',
      'andar',
    ],
    bgGradient: ['#162936', '#14222B', '#0B131A'],
    scrim: ['rgba(12, 22, 30, 0.68)', 'rgba(14, 24, 32, 0.56)', 'rgba(9, 15, 22, 0.88)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(212, 168, 78, 0.48)',
    swatchStyle: 'from-[#2F5B78] to-[#1A2D28]',
  },
  {
    id: 'biblia-janela',
    label: 'Palavra',
    subtitle: 'Bíblia e Oceano',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareOpenBible,
    keywords: [
      'biblia',
      'palavra',
      'escrituras',
      'leitura',
      'sabedoria',
      'ensino',
      'meditar',
      'lei',
      'verbo',
      'evangelho',
      'promessa',
    ],
    bgGradient: ['#1E1915', '#141316', '#0B0E14'],
    scrim: ['rgba(15, 14, 16, 0.72)', 'rgba(16, 16, 20, 0.60)', 'rgba(10, 12, 18, 0.90)'],
    accentColor: '#ECCB7B',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(236, 203, 123, 0.45)',
    swatchStyle: 'from-[#4F3B27] to-[#131722]',
  },
  {
    id: 'faial-mar',
    label: 'Mar do Faial',
    subtitle: 'Costa Atlântica',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.heroVerse,
    keywords: [
      'mar',
      'oceano',
      'ondas',
      'agua',
      'atlantico',
      'faial',
      'rio',
      'fidelidade',
      'profundo',
      'baptismo',
    ],
    bgGradient: ['#0E1C33', '#13294B', '#091324'],
    scrim: ['rgba(10, 20, 36, 0.72)', 'rgba(12, 24, 44, 0.56)', 'rgba(9, 18, 34, 0.88)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.80)',
    borderColor: 'rgba(212, 168, 78, 0.45)',
    swatchStyle: 'from-[#173763] to-[#0C1A30]',
  },
  {
    id: 'capela-horta',
    label: 'Comunidade',
    subtitle: 'Templo na Horta',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.sanctuary,
    keywords: [
      'igreja',
      'comunidade',
      'irmandade',
      'irmaos',
      'culto',
      'adoracao',
      'casa',
      'santuario',
      'comunhao',
      'servir',
      'hospitalidade',
    ],
    bgGradient: ['#231A12', '#17120D', '#0F0B08'],
    scrim: ['rgba(20, 15, 10, 0.74)', 'rgba(24, 18, 12, 0.58)', 'rgba(15, 11, 8, 0.88)'],
    accentColor: '#ECCB7B',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.80)',
    borderColor: 'rgba(236, 203, 123, 0.45)',
    swatchStyle: 'from-[#4A3520] to-[#1F160E]',
  },
  {
    id: 'escrituras',
    label: 'Estudo',
    subtitle: 'Mesa de Estudo',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.studyStill,
    keywords: [
      'estudo',
      'discipulado',
      'oracao',
      'diario',
      'devocional',
      'notas',
      'silencio',
      'manha',
      'reflexao',
      'meditacao',
    ],
    bgGradient: ['#1E242B', '#141A22', '#0D1117'],
    scrim: ['rgba(16, 22, 31, 0.76)', 'rgba(18, 25, 35, 0.62)', 'rgba(12, 17, 25, 0.90)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.80)',
    borderColor: 'rgba(212, 168, 78, 0.45)',
    swatchStyle: 'from-[#3B4754] to-[#171E26]',
  },
  // 6 Refined Editorial Canvas Themes
  {
    id: 'atlantico-profundo',
    label: 'Atlântico',
    subtitle: 'Azul Marinho',
    type: 'theme',
    keywords: ['atlantico', 'azul', 'mar', 'noite', 'profundo', 'iebh', 'editorial', 'solene'],
    bgGradient: ['#193A69', '#13294B', '#091527'],
    scrim: ['rgba(19, 41, 75, 0.15)', 'rgba(15, 31, 58, 0.25)', 'rgba(9, 21, 39, 0.45)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.78)',
    borderColor: 'rgba(212, 168, 78, 0.42)',
    swatchStyle: 'from-[#193A69] to-[#0B192E]',
  },
  {
    id: 'papel-marfim',
    label: 'Papel Marfim',
    subtitle: 'Papel Clássico',
    type: 'theme',
    isLight: true,
    keywords: ['papel', 'marfim', 'claro', 'classico', 'impresso', 'livro', 'leitura', 'minimal'],
    bgGradient: ['#FAF8F4', '#F3EFE6', '#EAE3D5'],
    scrim: ['rgba(250, 248, 244, 0)', 'rgba(243, 239, 230, 0)', 'rgba(234, 227, 213, 0)'],
    accentColor: '#8C6218',
    textColor: '#13294B',
    mutedColor: 'rgba(20, 30, 46, 0.72)',
    borderColor: 'rgba(19, 41, 75, 0.22)',
    swatchStyle: 'from-[#FAF8F4] to-[#E5DEC9]',
  },
  {
    id: 'basalto-vulcanico',
    label: 'Basalto',
    subtitle: 'Pedra Escura',
    type: 'theme',
    keywords: ['basalto', 'pedra', 'rocha', 'escuro', 'firmeza', 'forca', 'minimal', 'sobrio'],
    bgGradient: ['#272B33', '#191C22', '#0E1014'],
    scrim: ['rgba(20, 24, 30, 0.10)', 'rgba(14, 16, 20, 0.22)', 'rgba(8, 10, 14, 0.40)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.76)',
    borderColor: 'rgba(229, 190, 109, 0.36)',
    swatchStyle: 'from-[#343A45] to-[#111318]',
  },
  {
    id: 'verde-faja',
    label: 'Verde Fajã',
    subtitle: 'Cedro Açoriano',
    type: 'theme',
    keywords: ['verde', 'faja', 'cedro', 'vida', 'esperanca', 'descanso', 'natureza', 'oliveira'],
    bgGradient: ['#1B3C2F', '#122920', '#0A1812'],
    scrim: ['rgba(16, 40, 30, 0.12)', 'rgba(12, 30, 22, 0.24)', 'rgba(8, 20, 14, 0.42)'],
    accentColor: '#ECCB7B',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.78)',
    borderColor: 'rgba(236, 203, 123, 0.38)',
    swatchStyle: 'from-[#224A3B] to-[#0D1E17]',
  },
  {
    id: 'ouro-antigo',
    label: 'Ouro Antigo',
    subtitle: 'Bronze Quente',
    type: 'theme',
    keywords: ['ouro', 'dourado', 'luz', 'gloria', 'louvor', 'reino', 'gratidao', 'honra'],
    bgGradient: ['#4A3316', '#2D1E0D', '#1A1107'],
    scrim: ['rgba(45, 30, 12, 0.12)', 'rgba(30, 20, 8, 0.22)', 'rgba(18, 12, 5, 0.40)'],
    accentColor: '#F4D58D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.80)',
    borderColor: 'rgba(244, 213, 141, 0.42)',
    swatchStyle: 'from-[#6B4B21] to-[#26190A]',
  },
  {
    id: 'terracota-horta',
    label: 'Terracota',
    subtitle: 'Terra Quente',
    type: 'theme',
    keywords: ['terracota', 'amor', 'acolhimento', 'casa', 'familia', 'fogo', 'espirito'],
    bgGradient: ['#543023', '#361E15', '#1F100B'],
    scrim: ['rgba(46, 26, 18, 0.12)', 'rgba(32, 18, 12, 0.24)', 'rgba(18, 10, 7, 0.42)'],
    accentColor: '#F2CF81',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.78)',
    borderColor: 'rgba(242, 207, 129, 0.40)',
    swatchStyle: 'from-[#7A4430] to-[#2B1710]',
  },
];

export function normalizeShareText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function filterShareBackgrounds(
  query: string,
  category: ShareCategoryFilter,
  presets: ShareBackgroundPreset[] = SHARE_BACKGROUNDS
): ShareBackgroundPreset[] {
  const byCategory =
    category === 'all' ? presets : presets.filter((preset) => preset.type === category);

  const normalizedQuery = normalizeShareText(query);
  if (!normalizedQuery) {
    return byCategory;
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  const scored = byCategory
    .map((preset, index) => {
      const normalizedLabel = normalizeShareText(preset.label);
      const normalizedSubtitle = normalizeShareText(preset.subtitle);
      const normalizedKeywords = preset.keywords.map(normalizeShareText);

      let score = 0;
      for (const term of queryTerms) {
        if (normalizedLabel === term) score += 10;
        else if (normalizedLabel.includes(term)) score += 6;

        for (const kw of normalizedKeywords) {
          if (kw === term) score += 8;
          else if (kw.startsWith(term) || kw.includes(term)) score += 4;
        }

        if (normalizedSubtitle.includes(term)) score += 3;
      }

      return { preset, score, index };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return scored.map((entry) => entry.preset);
}

export function suggestBackgroundForVerse(
  verseText: string,
  referenceLabel: string,
  presets: ShareBackgroundPreset[] = SHARE_BACKGROUNDS
): { preset: ShareBackgroundPreset; matchedKeyword: string | null } {
  const combined = normalizeShareText(`${verseText} ${referenceLabel}`);
  if (!combined) {
    return { preset: presets[0], matchedKeyword: null };
  }

  const words = new Set(combined.split(/[^a-z0-9]+/).filter((w) => w.length >= 3));

  let bestPreset: ShareBackgroundPreset = presets[0];
  let bestScore = 0;
  let bestKeyword: string | null = null;

  for (const preset of presets) {
    // Prefer rich photography for automatic verse suggestions unless no photo matches
    const typeBonus = preset.type === 'photo' ? 1 : 0;
    let score = 0;
    let hitKeyword: string | null = null;

    for (const rawKw of preset.keywords) {
      const kw = normalizeShareText(rawKw);
      if (kw.includes(' ')) {
        if (combined.includes(kw)) {
          score += 12 + typeBonus;
          hitKeyword = hitKeyword ?? rawKw;
        }
        continue;
      }

      if (words.has(kw)) {
        score += 10 + typeBonus;
        hitKeyword = hitKeyword ?? rawKw;
      } else if (kw.length >= 4 && combined.includes(kw)) {
        score += 5 + typeBonus;
        hitKeyword = hitKeyword ?? rawKw;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestPreset = preset;
      bestKeyword = hitKeyword;
    }
  }

  return { preset: bestPreset, matchedKeyword: bestKeyword };
}
