import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import authRouter from './routes/auth.routes';
import purchasesRouter from './routes/purchases.routes';
import productsRouter from './routes/products.routes';

dotenv.config();

const app = express();

app.use(express.json({ limit: '1mb' }));

// HTTP request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Enable CORS for the frontend (default to http://localhost:5173)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

// DB connection is performed by the server bootstrap to allow tests to control connections
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/purchases', purchasesRouter);
app.use('/products', productsRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'MercApp' });
});

// Global error handler: send friendly JSON responses and hide stack traces in production
app.use((err: any, _req: any, res: any, _next: any) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : 'Internal server error';
  const details = process.env.NODE_ENV === 'production' ? undefined : (err && err.stack ? err.stack : undefined);
  const payload: any = { message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
});

export default app;
