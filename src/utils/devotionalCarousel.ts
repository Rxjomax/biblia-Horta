import type { PastoralDevotional } from '../types';

export type DevotionalCarouselPageCount = 3 | 4;

export interface DevotionalCarouselSlide {
  pageNumber: number;
  totalPages: DevotionalCarouselPageCount;
  kind: 'cover' | 'reflection' | 'application' | 'prayer';
  eyebrow: string;
  headline: string;
  body: string;
  subnote?: string;
}

export function formatDevotionalReference(devotional: PastoralDevotional): string {
  const { bookName, chapter, verse } = devotional.reference;
  return verse ? `${bookName} ${chapter}:${verse}` : `${bookName} ${chapter}`;
}

export function getDailyDevotionalIndex(
  devotionals: PastoralDevotional[],
  date: Date = new Date()
): number {
  if (devotionals.length === 0) return 0;
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.abs(diffDays) % devotionals.length;
}

export function buildDevotionalCarouselSlides(
  devotional: PastoralDevotional,
  verseText: string,
  pageCount: DevotionalCarouselPageCount = 4
): DevotionalCarouselSlide[] {
  const refLabel = formatDevotionalReference(devotional);
  const firstParagraph = devotional.body[0] ?? '';
  const remainingParagraphs = devotional.body.slice(1).join('\n\n').trim();
  const applicationText =
    devotional.application?.trim() ||
    remainingParagraphs ||
    'Reserva alguns instantes de silêncio hoje para aplicar esta Palavra em oração.';

  if (pageCount === 3) {
    const reflectionMerged = [firstParagraph, remainingParagraphs]
      .filter(Boolean)
      .join('\n\n');
    return [
      {
        pageNumber: 1,
        totalPages: 3,
        kind: 'cover',
        eyebrow: 'Devocional Diário · IEB Horta',
        headline: devotional.title,
        body: `«${verseText.trim()}»`,
        subnote: refLabel,
      },
      {
        pageNumber: 2,
        totalPages: 3,
        kind: 'reflection',
        eyebrow: 'Reflexão',
        headline: refLabel,
        body: reflectionMerged,
      },
      {
        pageNumber: 3,
        totalPages: 3,
        kind: 'prayer',
        eyebrow: 'Passo Prático & Oração',
        headline: 'Oração de Hoje',
        body: `${applicationText}\n\n«${devotional.prayer}»`,
        subnote: 'Leia mais em biblia-horta.vercel.app',
      },
    ];
  }

  return [
    {
      pageNumber: 1,
      totalPages: 4,
      kind: 'cover',
      eyebrow: 'Devocional Diário · IEB Horta',
      headline: devotional.title,
      body: `«${verseText.trim()}»`,
      subnote: refLabel,
    },
    {
      pageNumber: 2,
      totalPages: 4,
      kind: 'reflection',
      eyebrow: 'Meditação na Palavra',
      headline: refLabel,
      body: [firstParagraph, remainingParagraphs].filter(Boolean).join('\n\n'),
    },
    {
      pageNumber: 3,
      totalPages: 4,
      kind: 'application',
      eyebrow: 'Aplicação para Hoje',
      headline: 'Viver o Evangelho no Dia a Dia',
      body: applicationText,
      subnote: `${devotional.title}`,
    },
    {
      pageNumber: 4,
      totalPages: 4,
      kind: 'prayer',
      eyebrow: 'Oração & Convite',
      headline: 'Oremos Juntos',
      body: `«${devotional.prayer}»`,
      subnote: 'Igreja Evangélica Baptista da Horta · biblia-horta.vercel.app',
    },
  ];
}

export function buildDevotionalShareCaption(
  devotional: PastoralDevotional,
  verseText: string
): string {
  const refLabel = formatDevotionalReference(devotional);
  const reflection = devotional.body.join('\n\n');
  const application = devotional.application ? `\n\nPasso de hoje: ${devotional.application}` : '';

  return [
    `Devocional Diário · IEB Horta`,
    `${devotional.title}`,
    ``,
    `«${verseText.trim()}» — ${refLabel}`,
    ``,
    reflection + application,
    ``,
    `Oração: ${devotional.prayer}`,
    ``,
    `Igreja Evangélica Baptista da Horta (@iebhorta)`,
    `Leia na íntegra em https://biblia-horta.vercel.app/`,
  ].join('\n');
}
