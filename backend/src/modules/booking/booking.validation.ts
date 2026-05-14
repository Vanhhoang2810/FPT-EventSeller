import { z } from 'zod';

export const lockSeatsSchema = z.object({
  eventId: z.number().int().positive(),
  seatIds: z.array(z.number().int().positive()).min(1).max(10).transform((ids) => [...new Set(ids)]),
});

export const checkoutSchema = z.object({
  method: z.enum(['simulated', 'vnpay', 'momo']).default('simulated'),
  promoCode: z.string().optional(),
});

export type LockSeatsInput = z.infer<typeof lockSeatsSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
