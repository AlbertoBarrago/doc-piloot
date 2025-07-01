import { Octokit } from "octokit";

export async function getRepoFiles(octokit: Octokit, owner: string, repo: string, path = ""): Promise<{ path: string; content: string }[]> {
    const files: { path: string; content: string }[] = [];

    const res = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
    });

    if (Array.isArray(res.data)) {
        for (const file of res.data) {
            if (file.type === "dir") {
                const innerFiles = await getRepoFiles(octokit, owner, repo, file.path);
                files.push(...innerFiles);
            } else if (file.type === "file") {
                const contentRes = await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path: file.path,
                });

                if ("content" in contentRes.data && contentRes.data.content) {
                    const buff = Buffer.from(contentRes.data.content, "base64");
                    files.push({ path: file.path, content: buff.toString("utf-8") });
                }
            }
        }
    }

    return files;
}
