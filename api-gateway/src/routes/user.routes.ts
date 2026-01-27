import express from 'express';
import { getCurrentUserController, loginUserController, createUserController } from '../controller/user.controller.ts'
const app = express();

app.post('/signup', createUserController);
app.post('/login', loginUserController);
app.get('/me', getCurrentUserController);   

export default app;