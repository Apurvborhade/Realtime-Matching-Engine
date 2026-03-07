import { Region } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { redis } from "../redis/client";

async function acquireLock(userId: string) {
    const result = await redis.set(`lock:user:${userId}`, "1", { NX: true, EX: 30 });

    return result === "OK";
}

async function releaseLock(userId: string) {
    await redis.del(`lock:user:${userId}`)
}

export async function attemptDuoMatch(userId: string, mmr: number, region: Region) {
    const queueKey = `queue:${region}:duo`;
    const range = 100

    const candidates = await redis.zRangeByScore(
        queueKey,
        mmr - range,
        mmr + range
    )


    for (const candidateId of candidates) {
        if (candidateId === userId) continue;
        const blocked = await redis.get(`decline:${userId}:${candidateId}`);
        if (blocked) {
            continue;
        }

        const lock1 = await acquireLock(userId);
        if (!lock1) return;

        const lock2 = await acquireLock(candidateId);
        if (!lock2) {
            await releaseLock(userId);
            continue;
        }


        try {
            // Remove both from queue 
            await redis.zRem(queueKey, userId)
            await redis.zRem(queueKey, candidateId)

            // Create match in DB
            await createMatchInDB(userId, candidateId, region);

            console.log("Match created:", userId, candidateId)

        } catch (error) {
            console.error("Error creating match:", error);
        } finally {
            await releaseLock(userId)
            await releaseLock(candidateId)
        }
        return;
    }
}

async function createMatchInDB(
    user1: string,
    user2: string,
    region: string
) {

    const users = await prisma.user.findMany({
        where: {
            id: { in: [user1, user2] }
        }
    })

    const avgMMR =
        users.reduce((sum: any, u: any) => sum + u.mmr, 0) / users.length

    const match = await prisma.match.create({
        data: {
            region: region as any,
            type: "DUO",
            averageMMR: Math.round(avgMMR)
        }
    })

    await prisma.matchPlayer.createMany({
        data: [
            {
                userId: user1,
                matchId: match.id,
                team: 1
            },
            {
                userId: user2,
                matchId: match.id,
                team: 2
            }
        ]
    })

    await redis.set(`match:${match.id}:status`, "PENDING");
    await redis.del(`match:${match.id}:accepted`);

    await redis.expire(`match:${match.id}:status`, 15); // expire in 15s
    console.log("Match pending acceptance:", match.id)

    return match.id
}