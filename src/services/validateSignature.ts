import crypto from 'crypto';
import { Buffer } from 'node:buffer';

export function verifySignature(buffer: Buffer, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(buffer);
    const digest = `sha256=${hmac.digest("hex")}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}