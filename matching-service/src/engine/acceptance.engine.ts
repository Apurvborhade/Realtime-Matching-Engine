import { Request, Response } from "express"
import { redis } from "../redis/client"
import { prisma } from "../lib/prisma"

export async function acceptMatch(req: Request, res: Response) {
  const { matchId, userId } = req.body

  const status = await redis.get(`match:${matchId}:status`)

  if (!status) {
    return res.json({ error: "Match expired" })
  }

  // Add user to accepted set
  await redis.sAdd(`match:${matchId}:accepted`, userId)

  const acceptedUsers = await redis.sCard(`match:${matchId}:accepted`)

  if (acceptedUsers === 2) {

    await redis.set(`match:${matchId}:status`, "CONFIRMED")

    return res.json({ message: "Match confirmed" })
  }

  return res.json({ message: "Waiting for other player" })
}

export async function declineMatch(req: Request, res: Response) {
  const { matchId } = req.body

  try {

    //  Get match players from DB
    const matchPlayers = await prisma.matchPlayer.findMany({
      where: { matchId },
      include: { user: true }
    })

    if (!matchPlayers.length) {
      return res.json({ error: "Match not found" })
    }
    const declineQueKey1 = `decline:${matchPlayers[0].user.id}:${matchPlayers[1].user.id}`
    const declineQueKey2 = `decline:${matchPlayers[1].user.id}:${matchPlayers[0].user.id}`

    await redis.set(declineQueKey1, "1", { EX: 60 })
    await redis.set(declineQueKey2, "1", { EX: 60 })

    // Requeue all players
    for (const player of matchPlayers) {

      const queueKey = `queue:${player.user.region}:duo`

      await redis.zAdd(queueKey, {
        score: player.user.mmr,
        value: player.user.id
      })
    }

    // Delete DB records inside transaction
    await prisma.$transaction([
      prisma.matchPlayer.deleteMany({
        where: { matchId }
      }),
      prisma.match.delete({
        where: { id: matchId }
      })
    ])

    // Clean Redis match state
    await redis.del(`match:${matchId}:status`)
    await redis.del(`match:${matchId}:accepted`)

    console.log("Match deleted & players requeued:", matchId)

    return res.json({ message: "Match cancelled and players requeued" })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Something went wrong" })
  }
}