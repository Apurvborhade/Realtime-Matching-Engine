import app from "./app"
import { connectRedis } from "./redis/client"

const PORT = process.env.PORT || 4002;

async function start() {
  await connectRedis()
  app.listen(PORT, () => {
    console.log(`Matching service running on ${PORT}`)
  })
}

start()