const DEVICE_ID_KEY = 'lll_device_id'; // lll = LetsLearnLead

/**
 * Get or generate a stable, unique device identifier for this browser.
 *
 * - Uses `crypto.randomUUID()` (available in all modern browsers).
 * - Stored in localStorage so the same browser always produces the same ID
 *   across page reloads and sessions.
 * - This UUID is sent with every login and embedded in the JWT so the server
 *   can recompute the SHA-256 device fingerprint on each request.
 */
export const getDeviceId = (): string => {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        // Generate a new UUID for this browser
        deviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
};

/**
 * Returns a human-readable summary of the current device/browser.
 * Sent to the server so admins can identify which device is logged in.
 */
export const getDeviceInfo = (): string => {
    return navigator.userAgent;
};

/**
 * Clear the device ID (e.g., if the user wants a completely fresh identity).
 * Normally you should NOT call this on logout — the UUID should persist so
 * the user can log back in on the same device.
 */
export const clearDeviceId = (): void => {
    localStorage.removeItem(DEVICE_ID_KEY);
};
