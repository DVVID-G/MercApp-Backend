/**
 * @module config/env
 * 
 * Loads dotenv and ensures environment variables are available throughout the application.
 * 
 * This module must be imported first in application entry points (e.g., `server.ts`, `app.ts`)
 * to guarantee that environment variables are loaded before any other code is evaluated.
 * 
 * @example
 * ```typescript
 * import './config/env';
 * import app from './app';
 * ```
 */
import dotenv from 'dotenv';

dotenv.config();

