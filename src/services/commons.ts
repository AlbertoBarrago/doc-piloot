
import crypto from 'crypto';

export function validateSignature(payload: Buffer, signature: string, secret: string): boolean {
    if (!payload || !signature || !secret) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    console.log("Computed signature:", digest);
    console.log("GitHub signature:", signature);

    // Use a safe string comparison instead of timing-safe equal for string comparison
    return signature.length === digest.length &&
        signature.split('').every((char, i) => char === digest[i]);
}