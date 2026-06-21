import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const seoPageSchema = z.object({
  slug: z.string(),
  route: z.string().startsWith('/'),
  locale: z.string(),
  pageType: z.enum(['tool_hub', 'tool', 'platform_index', 'platform', 'article_index', 'article']),
  title: z.string().min(10),
  description: z.string().min(50),
  canonical: z.string().url(),
  primaryKeyword: z.string().min(2),
  draft: z.boolean().default(false),
  updatedAt: z.coerce.date().optional(),
  internalLinks: z.array(z.string().startsWith('/')).default([]),
});

const tools = defineCollection({
  loader: file('src/data/content/tools.json'),
  schema: seoPageSchema.extend({
    toolType: z.string(),
  }),
});

const platforms = defineCollection({
  loader: file('src/data/content/platforms.json'),
  schema: seoPageSchema.extend({
    platform: z.string(),
  }),
});

const articles = defineCollection({
  loader: file('src/data/content/articles.json'),
  schema: seoPageSchema.extend({
    topic: z.string(),
  }),
});

const experiments = defineCollection({
  loader: file('public/data/experiments.json'),
  schema: z.object({
    platform: z.string(),
    testDate: z.coerce.date(),
    fileFormat: z.string(),
    sampleCount: z.number().int().positive(),
    mainFindings: z.string().min(20),
    resultChanged: z.boolean(),
    parserVersion: z.string(),
    detailUrl: z.string().url(),
    researchUrl: z.string().startsWith('/research/'),
    sourceLicense: z.string(),
    environment: z.string(),
    expectedSignals: z.array(z.string()),
    actualSignals: z.array(z.string()),
    misses: z.array(z.string()),
    limitations: z.array(z.string()),
    reproSteps: z.array(z.string()),
    sampleRefs: z.array(z.string()),
    relatedLinks: z.array(z.object({
      href: z.string().startsWith('/'),
      label: z.string(),
    })),
  }),
});

const samples = defineCollection({
  loader: file('public/data/samples.json'),
  schema: z.object({
    title: z.string(),
    platform: z.string(),
    fileFormat: z.string(),
    processed: z.boolean(),
    source: z.string(),
    testDate: z.coerce.date(),
    signals: z.array(z.string()),
    knownLimits: z.array(z.string()),
    fileRef: z.string().startsWith('/samples/'),
  }),
});

export const collections = { tools, platforms, articles, experiments, samples };
