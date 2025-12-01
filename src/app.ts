import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
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

// Configure allowed origins from environment variable (comma-separated) or default
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];

// Enable CORS for allowed origins
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

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
