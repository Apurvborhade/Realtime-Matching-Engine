import { redis } from "../redis/client";
import { attemptDuoMatch } from "../engine/duo.engine";
import { prisma } from "../lib/prisma";
import { Region } from "../../generated/prisma/index";

export async function joinQueue(userId: string, mmr: number, region: Region) {
    const key = `queue:${region}:duo`;
    await redis.zAdd(key, { score: mmr, value: userId });

    const matchPreference = await prisma.matchPreference.findUnique({
        where: { userId },
    });
    
    await redis.hSet(`user:mm:${userId}`, {
        mmr: mmr.toString(),
        region,
        gender: matchPreference?.preferredGender || "any",
        preferredRole: matchPreference?.preferredRole || "any",
        minRank: matchPreference?.minRank || "any",
        maxRank: matchPreference?.maxRank || "any",
    });
    // Immediately attempt to find a match for the user after joining the queue
    await attemptDuoMatch(userId, mmr, region);

    return { success: true, message: "User added to queue" };
}

export async function getQueueSize(region: string) {
    const key = `queue:${region}:duo`;

    const size = await redis.zCard(key);

    return size;
}

export async function acquireLock(userId: string) {
    const result = await redis.set(`lock:user:${userId}`, "1", { NX: true, EX: 30 });

    return result === "OK";
}