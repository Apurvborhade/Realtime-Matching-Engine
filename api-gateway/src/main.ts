import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { limiter } from './middleware/rateLimit.middleware';
const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';


app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: frontendOrigin,
    credentials: true,
}));
app.use(limiter);


// Health check endpoint
app.get('/health', (req, res) => {
    res.send("Health Check OK");
})


export default app;
