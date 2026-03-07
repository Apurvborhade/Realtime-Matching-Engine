import { Router } from "express"
import { acceptMatch, declineMatch } from "../engine/acceptance.engine.js"

const router = Router()

router.post("/accept", acceptMatch)
router.post("/decline", declineMatch)

export default router