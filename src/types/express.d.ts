import { IDeviceInfo } from '../models/session.model';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      deviceInfo?: IDeviceInfo;
      ipAddress?: string;
    }
  }
}

export {};

