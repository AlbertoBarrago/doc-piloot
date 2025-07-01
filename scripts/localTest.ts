import dotenv from "dotenv";
import { Octokit } from "octokit";
import { getRepoFilesAnalysis } from "../src/app/analyzer.js";
import { generateReadmeFromAnalysis } from "../src/app/gemini.js";

dotenv.config();

async function test() {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw new Error("GITHUB_TOKEN missing");

    const octokit = new Octokit({ auth: githubToken });

    const owner = "albertobarrago";
    const repo = "doc-pilot";

    const analysis = await getRepoFilesAnalysis(octokit, owner, repo);
    const readme = await generateReadmeFromAnalysis(analysis);

    console.log("=== GENERATED README ===\n", readme);
}

test().catch(console.error);
