import { Router } from "express"
import { acceptMatch, declineMatch } from "../engine/acceptance.engine"

const router = Router()

router.post("/accept", acceptMatch)
router.post("/decline", declineMatch)

export default router