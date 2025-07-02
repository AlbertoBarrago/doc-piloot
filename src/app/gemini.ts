import {GoogleGenAI} from '@google/genai';
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY missing in .env");

const ai = new GoogleGenAI({apiKey});

export async function generateReadmeFromAnalysis(analysisText: string): Promise<string | undefined> {
    const prompt = `You're an AI assistant helping developers generate clear README.md files.

Here's the analysis of the repository:

${analysisText}

Based on the analysis above, generate a comprehensive README.md file for this project. Include:
1. Project name and description
2. Features and capabilities
3. Installation instructions
4. Usage examples
5. Technologies used
6. Project structure
7. Contributing guidelines (if applicable)
8. License information (if available)

Format the README with proper Markdown syntax, including:
- Headers (# for main title, ## for sections, etc.)
- Code blocks with appropriate language syntax highlighting
- Lists and tables where appropriate
- Links to relevant resources

IMPORTANT: Do not wrap the entire README content in triple backticks. Start directly with the content.

The README should be professional, clear, and provide all necessary information for users to understand and use the project.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
    });

    let content = response.text;

    content = content?.replace(/^```\s*(?:markdown)?\s*\n?/, '');
    content = content?.replace(/\n?```\s*$/, '');

    return content;
}

