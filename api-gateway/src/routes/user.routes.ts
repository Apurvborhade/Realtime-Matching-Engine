import express from 'express';
import { getCurrentUserController, loginUserController, createUserController,logoutUserController } from '../controller/user.controller'


const app = express();

app.post('/signup', createUserController);
app.post('/login', loginUserController);
app.post('/logout',logoutUserController);
app.get('/me', getCurrentUserController);   

export default app;