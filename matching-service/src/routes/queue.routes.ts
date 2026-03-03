import { Router } from "express"
import { joinQueue } from "../queue/queue.service"

const router = Router()

router.post("/join", async (req, res) => {
  const { userId, mmr, region } = req.body

  const result = await joinQueue(userId, mmr, region)

  res.json(result)
})

export default router