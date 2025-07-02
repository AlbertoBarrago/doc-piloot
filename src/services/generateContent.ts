import {generateReadmeFromAnalysis} from "../app/gemini.js";

export async function generateReadmeWithRetries(analysisText: string, retries = 3, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await generateReadmeFromAnalysis(analysisText);
        } catch (error: any) {
            if (error?.status === 503 && attempt < retries) {
                console.warn(`Model overloaded, retrying attempt ${attempt} after delay...`);
                await new Promise(res => setTimeout(res, delayMs));
            } else {
                throw error;
            }
        }
    }
}