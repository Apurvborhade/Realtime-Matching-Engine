import express from "express"
import queueRoutes from "./routes/queue.routes"

const app = express()

app.use(express.json())
app.use("/queue", queueRoutes)

export default app