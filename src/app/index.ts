import dotenv from "dotenv";
import { getRepoFilesAnalysis } from "./analyzer";
import { generateReadmeFromAnalysis } from "./gemini";
import { Octokit } from "octokit";

dotenv.config();

async function main() {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
        throw new Error("GITHUB_TOKEN missing from .env");
    }

    const octokit = new Octokit({ auth: githubToken });

    // Example: analyze current repo files (you can replace with dynamic repo)
    const owner = "your-github-username";
    const repo = "your-repo-name";

    // 1. Get source code analysis summary
    const analysisText = await getRepoFilesAnalysis(octokit, owner, repo);

    // 2. Generate README from Gemini
    const readmeContent = await generateReadmeFromAnalysis(analysisText);

    console.log("=== GENERATED README ===\n", readmeContent);

    // TODO: Push readmeContent back to GitHub repo or open a PR
}

main().catch(console.error);
