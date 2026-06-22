import crypto from 'crypto';
import { Request } from 'express';

/**
 * Extract the best-available IP address from an Express request.
 * Handles reverse-proxy setups (nginx sets x-real-ip or x-forwarded-for).
 */
export const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || 'unknown';
};

/**
 * Build a short readable device-info string from the User-Agent header.
 * We truncate to 256 chars to avoid storing arbitrary large strings.
 */
export const getDeviceInfo = (req: Request): string => {
    const ua = req.headers['user-agent'] || 'Unknown';
    return ua.substring(0, 256);
};

/**
 * Create a deterministic server-side device fingerprint by hashing the
 * client-supplied deviceId (UUID) with the IP + user-agent.
 *
 * Why include client UUID?
 *   → The client generates a stable UUID per browser via crypto.randomUUID()
 *     and persists it in localStorage. This ensures the same browser always
 *     produces the same fingerprint even across IPs (mobile networks etc.).
 *
 * Why include IP + UA?
 *   → Adds an extra layer; a stolen UUID alone isn't enough to match.
 *
 * The result is stored in `user.currentDeviceId`.
 */
export const buildServerDeviceFingerprint = (
    clientDeviceId: string,
    req: Request
): string => {
    const ip = getClientIp(req);
    const ua = getDeviceInfo(req);
    return crypto
        .createHash('sha256')
        .update(`${clientDeviceId}:${ip}:${ua}`)
        .digest('hex');
};
