import express from 'express';
import { limiter } from './middleware/rateLimit.middleware';
const app = express();


app.use(express.json());
app.use(limiter);


// Health check endpoint
app.get('/health', (req, res) => {
    res.send("Health Check OK");
})


export default app;