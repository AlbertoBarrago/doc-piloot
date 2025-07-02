
import crypto from 'crypto';

export function verifySignature(secret: string, payload: string, signature: string): boolean {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(payload).digest("hex");

    try {
        const actualSignature = signature.startsWith("sha256=") ? signature : "sha256=" + signature;

        console.log("Expected signature:", digest);
        console.log("Actual signature:", actualSignature);

        return crypto.timingSafeEqual(Buffer.from(actualSignature), Buffer.from(digest));
    } catch (error) {
        console.error("Error verifying signature:", error);
        return false;
    }
}