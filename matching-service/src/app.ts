import express from "express"
import cors from "cors"
import queueRoutes from "./routes/queue.routes"
import matchRoutes from "./routes/match.routes"

const app = express()
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173"

app.use(express.json())
app.use(cors({
  origin: frontendOrigin,
  credentials: true,
}))
app.use("/queue", queueRoutes)
app.use("/match", matchRoutes)

export default app
