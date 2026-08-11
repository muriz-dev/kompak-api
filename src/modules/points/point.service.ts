import type { Context } from "hono";
import pointRepository from "./point.repository";

type PointEntry = {
    id: string;
    direction: "IN" | "OUT";
    points: number;
    title: string;
    occurredAt: Date | null;
    referenceType: "EVENT" | "REDEMPTION" | "REDEMPTION_REFUND";
    referenceId: string;
    status?: string;
};

export const getMyPointHistory = async (c: Context) => {
    const currentUser = c.get("currentUser");
    const [balance, events, redemptions] = await Promise.all([
        pointRepository.getBalance(c, currentUser.id),
        pointRepository.getEventEntries(c, currentUser.id),
        pointRepository.getRedemptionEntries(c, currentUser.id),
    ]);

    const entries: PointEntry[] = events.map((entry) => ({
        id: entry.id,
        direction: "IN",
        points: entry.points,
        title: entry.title,
        occurredAt: entry.occurredAt,
        referenceType: "EVENT",
        referenceId: entry.eventId,
    }));

    for (const redemption of redemptions) {
        if (redemption.points <= 0) continue;

        entries.push({
            id: redemption.id,
            direction: "OUT",
            points: redemption.points,
            title: redemption.title,
            occurredAt: redemption.occurredAt,
            referenceType: "REDEMPTION",
            referenceId: redemption.rewardId,
            status: redemption.status,
        });

        if (redemption.status === "REJECTED" || redemption.status === "CANCELLED") {
            entries.push({
                id: `${redemption.id}:refund`,
                direction: "IN",
                points: redemption.points,
                title: `Pengembalian poin ${redemption.title}`,
                occurredAt: redemption.updatedAt,
                referenceType: "REDEMPTION_REFUND",
                referenceId: redemption.id,
                status: redemption.status,
            });
        }
    }

    entries.sort((a, b) =>
        (b.occurredAt?.getTime() ?? 0) - (a.occurredAt?.getTime() ?? 0)
    );

    return {
        balance: balance?.balance ?? 0,
        entries,
    };
};

export default { getMyPointHistory };
