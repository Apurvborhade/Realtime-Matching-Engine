import { API_GATEWAY_PORT } from './utils/constants.ts';
import app from './main.ts';
import { errorHandler } from './middleware/errorHandler.middleware.ts';
import userRoutes from './routes/user.routes.ts';


app.use('/api/users', userRoutes);

app.use(errorHandler);

app.listen(API_GATEWAY_PORT, () => {
  console.log(`API Gateway is listening on port ${API_GATEWAY_PORT}`);
});