import { z } from 'zod';

export const listEventsSchema = z.object({
  search: z.string().optional(),
  category: z.enum(['music','sports','theater','comedy','festival','conference','other']).optional(),
  status: z.enum(['draft','published','on_sale','sold_out','completed','cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(['newest','soonest','price_asc','price_desc','trending']).default('soonest'),
});

export const suggestionsSchema = z.object({
  q: z.string().min(2, 'Tối thiểu 2 ký tự'),
});

export const eventParamSchema = z.object({
  idOrSlug: z.string().min(1),
});

export type ListEventsQuery = z.infer<typeof listEventsSchema>;
