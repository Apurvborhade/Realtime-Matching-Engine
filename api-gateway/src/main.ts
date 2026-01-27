import express from 'express';
import { API_GATEWAY_PORT } from './utils/constants.ts';

const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
    res.send("Health Check OK");
})


export default app;