
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.routes.js';
import { verifyJwtOptional } from './middleware/auth.middleware.js';

const app = express();
app.use(cors());
// app.use(express.json());
app.use(morgan('dev'));

// Optional verification for public routes; can be required in specific routes
app.use(verifyJwtOptional);

app.use('/', routes);

export default app;
