/**
 * Migration script to create session records for existing refresh tokens
 * 
 * This script should be run once after deploying the session management feature.
 * It creates session records for users who have active refresh tokens but no session records.
 * 
 * Usage: ts-node scripts/migrate-refresh-tokens-to-sessions.ts
 */

import mongoose from 'mongoose';
import User from '../src/models/user.model';
import Session from '../src/models/session.model';
import * as sessionService from '../src/services/session.service';
import { connectDb } from '../src/db/mongoose';

const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

async function migrateRefreshTokensToSessions() {
  try {
    console.log('Connecting to database...');
    await connectDb();
    console.log('Connected to database');

    // Find all users with refresh tokens
    const users = await User.find({ refreshTokens: { $exists: true, $ne: [] } }).exec();
    console.log(`Found ${users.length} users with refresh tokens`);

    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const user of users) {
      if (!user.refreshTokens || user.refreshTokens.length === 0) {
        continue;
      }

      console.log(`\nProcessing user: ${user.email} (${user.refreshTokens.length} tokens)`);

      for (const refreshToken of user.refreshTokens) {
        try {
          // Check if session already exists for this token
          const existingSession = await sessionService.findSessionByRefreshToken(refreshToken);
          if (existingSession) {
            console.log(`  ✓ Session already exists for token (skipping)`);
            totalSkipped++;
            continue;
          }

          // Create a session record with default device info
          // Note: We don't have historical device info, so we use defaults
          const defaultDeviceInfo = {
            userAgent: 'Migration Script',
            deviceType: 'desktop' as const,
            platform: 'Unknown',
            browser: 'Unknown'
          };

          const session = await sessionService.createSession({
            userId: user._id.toString(),
            refreshToken,
            deviceInfo: defaultDeviceInfo,
            ipAddress: 'Unknown'
          });

          console.log(`  ✓ Created session ${session._id} for token`);
          totalMigrated++;
        } catch (error) {
          console.error(`  ✗ Error creating session for token:`, error);
          totalErrors++;
        }
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total sessions created: ${totalMigrated}`);
    console.log(`Total sessions skipped (already exist): ${totalSkipped}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log('Migration completed');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateRefreshTokensToSessions();

