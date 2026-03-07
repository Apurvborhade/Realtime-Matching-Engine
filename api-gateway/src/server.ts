import { API_GATEWAY_PORT } from './utils/constants';
import app from './main';
import { errorHandler } from './middleware/errorHandler.middleware';
import userRoutes from './routes/user.routes';


app.use('/api/users', userRoutes);

app.use(errorHandler);

app.listen(API_GATEWAY_PORT, () => {
  console.log(`API Gateway is listening on port ${API_GATEWAY_PORT}`);
});