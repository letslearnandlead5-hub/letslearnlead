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
 * Build the server-side device identifier.
 *
 * We use the client-supplied UUID directly (no IP / UA hashing) because:
 *  - The UUID is cryptographically random (128-bit) — it cannot be guessed.
 *  - It is persisted in localStorage, so the same browser always produces
 *    the same value across page reloads and token refreshes.
 *  - Including IP caused false DEVICE_MISMATCH logouts whenever the user's
 *    IP changed (mobile networks, DHCP reassignment, VPN, etc.).
 *  - Including UA in a hash broke token refresh: the refresh route embedded
 *    the stored fingerprint as the new token's deviceId, so the next request
 *    recomputed hash(fingerprint+IP+UA) which never matched the stored value.
 *
 * The result is stored in `user.currentDeviceId`.
 */
export const buildServerDeviceFingerprint = (
    clientDeviceId: string,
    _req: Request
): string => {
    // Return the UUID directly — it is already a secure, unique device token.
    return clientDeviceId;
};
