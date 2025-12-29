import { Schema, model, Document } from 'mongoose';

export interface IDeviceInfo {
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  platform: string; // 'iOS', 'Android', 'Windows', etc.
  browser: string;  // 'Chrome', 'Safari', etc.
}

export interface IActivityLog extends Document {
  userId: string | null; // null for failed login attempts where user not found
  eventType: 'login' | 'logout' | 'session_revoked' | 'login_failed';
  sessionId?: string; // Optional, references Session
  deviceInfo: IDeviceInfo;
  ipAddress: string;
  success: boolean;
  reason?: string; // 'user_initiated', 'expired', 'revoked', 'invalid_credentials', etc.
  metadata?: Record<string, any>; // Additional context
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { 
    type: String, 
    index: true 
  },
  eventType: { 
    type: String, 
    required: true, 
    enum: ['login', 'logout', 'session_revoked', 'login_failed'],
    index: true
  },
  sessionId: { type: String },
  deviceInfo: {
    userAgent: { type: String, required: true },
    deviceType: { 
      type: String, 
      required: true, 
      enum: ['mobile', 'desktop', 'tablet'] 
    },
    platform: { type: String, required: true },
    browser: { type: String, required: true }
  },
  ipAddress: { type: String, required: true },
  success: { type: Boolean, required: true },
  reason: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { 
    type: Date, 
    default: () => new Date(),
    index: true
  }
});

const ActivityLog = model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;

