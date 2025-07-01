import {Octokit} from "octokit";
import {getRepoFiles} from "./github";

export async function getRepoFilesAnalysis(octokit: Octokit, owner: string, repo: string): Promise<string> {
    const files = await getRepoFiles(octokit, owner, repo);

    // Filter code files you care about
    const exts = [".js", ".ts", ".json", ".md"];
    const filteredFiles = files.filter(f => exts.some(ext => f.path.endsWith(ext)));

    // Build a textual summary (filename + first 100 chars)
    let analysis = "";
    for (const file of filteredFiles) {
        const snippet = file.content.slice(0, 100).replace(/\n/g, " ");
        analysis += `File: ${file.path}\nPreview: ${snippet}\n\n`;
    }

    return analysis;
}
