import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY missing in .env");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function generateReadmeFromAnalysis(analysisText: string): Promise<string> {
    const prompt = `You're an AI assistant helping developers generate clear README.md files.

Context:
- Detected language: JavaScript
- Framework: Express.js
- Entrypoint: index.js
- Description: Simple REST API for user management

Source files:
[...main code snippets...]

Generate a README including:
1. Project name and summary
2. Features
3. How to run it locally
4. Technologies used
5. Optional: Example usage

${analysisText}

README:
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
}
