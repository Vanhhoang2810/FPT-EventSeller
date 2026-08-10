import { z } from 'zod';

export const lockSeatsSchema = z.object({
  eventId: z.number().int().positive(),
  seatIds: z.array(z.number().int().positive()).max(10).transform((ids) => [...new Set(ids)]).default([]),
  standingSelections: z.array(
    z.object({
      zoneId: z.number().int().positive(),
      quantity: z.number().int().positive().max(10),
    })
  ).default([]),
}).refine(data => data.seatIds.length > 0 || data.standingSelections.length > 0, {
  message: "Phải chọn ít nhất 1 ghế hoặc 1 vé đứng",
});

export const checkoutSchema = z.object({
  method: z.enum(['simulated', 'vnpay', 'momo']).default('simulated'),
  promoCode: z.string().optional(),
});

export type LockSeatsInput = z.infer<typeof lockSeatsSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
