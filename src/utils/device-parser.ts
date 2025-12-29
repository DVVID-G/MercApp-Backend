import { UAParser } from 'ua-parser-js';
import { IDeviceInfo } from '../models/session.model';

/**
 * Parse User-Agent header to extract device information
 * @param userAgent - User-Agent string from request headers
 * @returns Device information object
 */
export function parseDeviceInfo(userAgent: string): IDeviceInfo {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Determine device type
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (result.device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (result.device.type === 'tablet') {
    deviceType = 'tablet';
  }

  // Get platform
  const platform = result.os.name || 'Unknown';

  // Get browser
  const browser = result.browser.name || 'Unknown';

  return {
    userAgent,
    deviceType,
    platform,
    browser
  };
}

/**
 * Extract IP address from request, handling proxy headers
 * @param req - Express request object
 * @returns IP address string
 */
export function extractIpAddress(req: any): string {
  // Check for X-Forwarded-For header (from proxy/load balancer)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return Array.isArray(forwardedFor) 
      ? forwardedFor[0].split(',')[0].trim()
      : forwardedFor.split(',')[0].trim();
  }

  // Check for X-Real-IP header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to connection remote address
  return req.ip || req.connection?.remoteAddress || 'Unknown';
}

