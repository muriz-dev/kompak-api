import type { Context } from "hono";
import rewardRedemptionRepository from "./reward-redemption.repository";
import type { ClaimRedemptionSchema, CreateRedemptionSchema, UpdateRedemptionStatusSchema } from "./reward-redemption.schema";
import { ApiError } from "../../utils/api-error";
import rewardRepository from "../rewards/reward.repository";
import userRepository from "../users/user.repository";
import providerRepository from "../providers/provider.repository";
import { sign, verify } from "hono/jwt";

type RedemptionRecord = NonNullable<Awaited<ReturnType<typeof rewardRedemptionRepository.getById>>>;
type PresentableRedemption = Pick<
    RedemptionRecord,
    "id" | "providerId" | "status" | "expiresAt"
>;

const presentRedemption = async (c: Context, redemption: PresentableRedemption) => {
    const expiresAt = new Date(redemption.expiresAt).getTime();
    const canClaim = redemption.status === "PENDING" && expiresAt > Date.now();
    const claimToken = canClaim
        ? await sign({
            type: "REWARD_CLAIM",
            redemptionId: redemption.id,
            providerId: redemption.providerId,
            exp: Math.floor(expiresAt / 1000),
        }, c.env.JWT_SECRET as string)
        : null;

    return {
        ...redemption,
        claimToken,
        isExpired: redemption.status === "CANCELLED" && expiresAt <= Date.now(),
    };
};

const expireIfNeeded = async (c: Context, redemption: PresentableRedemption) => {
    if (redemption.status !== "PENDING" || new Date(redemption.expiresAt).getTime() > Date.now()) {
        return redemption;
    }

    await rewardRedemptionRepository.updateStatus(c, redemption.id, "CANCELLED");
    return (await rewardRedemptionRepository.getById(c, redemption.id))!;
};

const canManageProvider = async (c: Context, providerId: string) => {
    const currentUser = c.get("currentUser") as any;
    if (currentUser.role === "ADMIN") return true;

    const provider = await providerRepository.getById(c, providerId);
    return provider?.ownerId === currentUser.id;
};

const ensureCanRead = async (c: Context, redemption: RedemptionRecord) => {
    const currentUser = c.get("currentUser") as any;
    if (
        currentUser.role === "ADMIN" ||
        redemption.userId === currentUser.id ||
        await canManageProvider(c, redemption.providerId)
    ) return;

    throw ApiError.forbidden("You do not have permission to view this redemption");
};

export const getAllRedemptions = async (c: Context) => {
    return rewardRedemptionRepository.getAll(c);
};

export const getRedemptionById = async (c: Context, redemptionId: string) => {
    const redemption = await rewardRedemptionRepository.getById(c, redemptionId);
    if (!redemption) throw ApiError.notFound(`Redemption with ID ${redemptionId} not found`);
    await ensureCanRead(c, redemption);
    const currentRedemption = await expireIfNeeded(c, redemption);
    return presentRedemption(c, currentRedemption);
};

export const getMyRedemptions = async (c: Context) => {
    const user = c.get("jwtPayload") as any;
    const redemptions = await rewardRedemptionRepository.getByUserId(c, user.id);
    return Promise.all(redemptions.map(async (redemption) =>
        presentRedemption(c, await expireIfNeeded(c, redemption))
    ));
};

export const getProviderRedemptions = async (c: Context, providerId: string) => {
    if (!await canManageProvider(c, providerId)) {
        throw ApiError.forbidden("You do not have permission to view this provider's redemptions");
    }

    const redemptions = await rewardRedemptionRepository.getByProviderId(c, providerId);
    return Promise.all(redemptions.map(async (redemption) =>
        presentRedemption(c, await expireIfNeeded(c, redemption))
    ));
};

export const createRedemption = async (c: Context, data: CreateRedemptionSchema) => {
    const jwtPayload = c.get("jwtPayload") as any;
    
    // 1. Validate Reward
    const reward = await rewardRepository.getById(c, data.rewardId);
    if (!reward) {
        throw ApiError.notFound("Reward not found");
    }
    if (reward.status !== "ACTIVE") {
        throw ApiError.badRequest("Reward is no longer active");
    }
    if (reward.source !== "POINT_SHOP") {
        throw ApiError.badRequest("Only Point Shop rewards can be redeemed manually");
    }
    if (reward.stock <= 0) {
        throw ApiError.badRequest("Reward is out of stock");
    }

    const provider = await providerRepository.getById(c, reward.providerId);
    if (!provider || provider.status !== "VERIFIED") {
        throw ApiError.badRequest("Reward provider is not verified");
    }
    
    // 2. Check User Balance
    const user = await userRepository.getById(c, jwtPayload.id);
    if (!user) {
        throw ApiError.notFound("User not found");
    }
    
    const currentBalance = user.balance ?? 0;
    if (currentBalance < reward.pointsRequired) {
        throw ApiError.badRequest(`Insufficient points. You need ${reward.pointsRequired} points but have ${currentBalance}.`);
    }

    const existing = await rewardRedemptionRepository.getByUserAndIdempotencyKey(
        c,
        user.id,
        data.idempotencyKey,
    );
    if (existing) {
        return {
            ...await presentRedemption(c, existing),
            balance: currentBalance,
        };
    }

    try {
        const created = await rewardRedemptionRepository.createWithTransaction(c, {
            userId: user.id,
            rewardId: reward.id,
            providerId: reward.providerId,
            pointsSpent: reward.pointsRequired,
            idempotencyKey: data.idempotencyKey,
            expiresAt: new Date(Date.now() + reward.validityDays * 86_400_000),
        });
        const redemption = await rewardRedemptionRepository.getById(c, created.id);
        const updatedUser = await userRepository.getById(c, user.id);

        return {
            ...await presentRedemption(c, redemption!),
            balance: updatedUser?.balance ?? currentBalance - reward.pointsRequired,
        };
    } catch (error) {
        const existingAfterConflict = await rewardRedemptionRepository.getByUserAndIdempotencyKey(
            c,
            user.id,
            data.idempotencyKey,
        );
        if (existingAfterConflict) {
            const latestUser = await userRepository.getById(c, user.id);
            return {
                ...await presentRedemption(c, existingAfterConflict),
                balance: latestUser?.balance ?? currentBalance,
            };
        }

        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("reward_out_of_stock")) throw ApiError.badRequest("Reward is out of stock");
        if (message.includes("insufficient_points")) throw ApiError.badRequest("Insufficient points");
        if (message.includes("reward_not_redeemable")) throw ApiError.badRequest("Reward is not redeemable");
        throw error;
    }
};

export const updateRedemptionStatus = async (c: Context, redemptionId: string, statusData: UpdateRedemptionStatusSchema) => {
    const redemption = await rewardRedemptionRepository.getById(c, redemptionId);
    if (!redemption) throw ApiError.notFound(`Redemption with ID ${redemptionId} not found`);
    const user = c.get("jwtPayload") as any;
    
    // Only Admin or the Provider who owns the reward can update the status
    if (user.role !== "ADMIN") {
        // Find if this provider belongs to the user
        // We'll need to fetch the provider directly, but for now we assume the caller has been validated
        // Let's implement a strict check: user.id must be the provider's ownerId
        const { getDb } = await import("../../db/connection");
        const { providers } = await import("../../db/schema");
        const { eq } = await import("drizzle-orm");
        const db = getDb(c.env.DB);
        
        const provider = await db.query.providers.findFirst({
            where: eq(providers.id, redemption.providerId)
        });
        
        if (!provider || provider.ownerId !== user.id) {
            throw ApiError.forbidden("You do not have permission to manage this redemption");
        }
    }
    
    // State machine logic
    if (redemption.status !== "PENDING") {
        throw ApiError.badRequest(`Cannot update status from ${redemption.status}`);
    }
    
    if (statusData.status === "PENDING") {
        throw ApiError.badRequest("Cannot update status to PENDING");
    }
    
    const completedAt = statusData.status === "COMPLETED" ? new Date() : undefined;
    
    const updated = await rewardRedemptionRepository.updateStatus(c, redemptionId, statusData.status, completedAt);
    if (!updated) throw ApiError.badRequest("Redemption status has already changed");
    return getRedemptionById(c, redemptionId);
};

export const claimRedemption = async (c: Context, data: ClaimRedemptionSchema) => {
    let payload: Awaited<ReturnType<typeof verify>>;
    try {
        payload = await verify(data.claimToken, c.env.JWT_SECRET as string, "HS256");
    } catch {
        throw ApiError.badRequest("Claim token is invalid or expired");
    }

    if (payload.type !== "REWARD_CLAIM" || typeof payload.redemptionId !== "string") {
        throw ApiError.badRequest("Claim token is invalid");
    }

    const redemption = await rewardRedemptionRepository.getById(c, payload.redemptionId);
    if (!redemption) throw ApiError.notFound("Redemption not found");
    if (!await canManageProvider(c, redemption.providerId)) {
        throw ApiError.forbidden("You do not have permission to claim this redemption");
    }
    if (redemption.status !== "PENDING") {
        throw ApiError.badRequest(`Cannot claim redemption with status ${redemption.status}`);
    }
    if (new Date(redemption.expiresAt).getTime() <= Date.now()) {
        await rewardRedemptionRepository.updateStatus(c, redemption.id, "CANCELLED");
        throw ApiError.badRequest("Redemption has expired");
    }

    const updated = await rewardRedemptionRepository.updateStatus(c, redemption.id, "COMPLETED", new Date());
    if (!updated) throw ApiError.badRequest("Redemption status has already changed");
    return getRedemptionById(c, redemption.id);
};

export default {
    getAllRedemptions,
    getRedemptionById,
    getMyRedemptions,
    getProviderRedemptions,
    createRedemption,
    updateRedemptionStatus,
    claimRedemption,
};
