import express from 'express';
import { API_GATEWAY_PORT } from './utils/constants.ts';
import { limiter } from './middleware/rateLimit.middleware.ts';
const app = express();


app.use(express.json());
app.use(limiter);


// Health check endpoint
app.get('/health', (req, res) => {
    res.send("Health Check OK");
})


export default app;