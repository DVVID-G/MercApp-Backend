import { Schema, model, Document } from 'mongoose';

export interface IDeviceInfo {
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  platform: string; // 'iOS', 'Android', 'Windows', etc.
  browser: string;  // 'Chrome', 'Safari', etc.
}

export interface ISession extends Document {
  userId: string;
  refreshToken: string;
  deviceInfo: IDeviceInfo;
  ipAddress: string;
  location?: string; // Can be added later with geolocation
  status: 'active' | 'revoked' | 'expired';
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  refreshToken: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
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
  location: { type: String },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  createdAt: { 
    type: Date, 
    default: () => new Date() 
  },
  lastActivityAt: { 
    type: Date, 
    default: () => new Date() 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  }
});

const Session = model<ISession>('Session', SessionSchema);

export default Session;

