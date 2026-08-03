import { z } from "zod";
import { BADGE_CATEGORY } from "../../db/schema";

export const createBadgeDefinitionSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().min(10),
    icon: z.url().optional(),
    category: z.enum(BADGE_CATEGORY),
    criteria: z.string(),
});

export const awardSpecialBadgeSchema = z.object({
    userId: z.uuid(),
    badgeDefinitionId: z.uuid(),
    reason: z.string().optional(),
});

export type CreateBadgeDefinitionInput = z.infer<typeof createBadgeDefinitionSchema>;
export type AwardSpecialBadgeInput = z.infer<typeof awardSpecialBadgeSchema>;
