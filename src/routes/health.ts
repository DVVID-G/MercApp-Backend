import { Router, Request, Response } from 'express';
import mongoose from '../db/mongoose';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState;
    const dbConnected = dbStatus === 1; // 1 = connected
    
    const healthStatus = {
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      uptime: process.uptime()
    };

    // Return 200 OK even if DB is disconnected (for Render keep-alive)
    // but indicate degraded status in response
    res.status(200).json(healthStatus);
  } catch (error) {
    // Still return 200 for Render keep-alive, but indicate error
    res.status(200).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

export default router;
