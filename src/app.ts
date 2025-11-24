import express from 'express';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import authRouter from './routes/auth.routes';
import purchasesRouter from './routes/purchases.routes';

dotenv.config();

const app = express();

app.use(express.json({ limit: '1mb' }));

// DB connection is performed by the server bootstrap to allow tests to control connections
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/purchases', purchasesRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'MercApp' });
});

export default app;
