import { Router } from "express"
import { acceptMatch, declineMatch, getPendingMatch } from "../engine/acceptance.engine.js"

const router = Router()

router.get("/pending/:userId", getPendingMatch)
router.post("/accept", acceptMatch)
router.post("/decline", declineMatch)

export default router
