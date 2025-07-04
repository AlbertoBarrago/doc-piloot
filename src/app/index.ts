import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import { getRepoFilesAnalysis } from "./analyzer.js";
import { pushReadme } from "../services/pushReadme.js";
import path from "path";
import { verifySignature } from "../services/validateSignature.js";
import {generateReadmeWithRetries} from "../services/generateContent.js";

dotenv.config();

const {
    APP_ID,
    PRIVATE_KEY,
    WEBHOOK_SECRET,
    PORT = 3000,
} = process.env;

if (!APP_ID || !PRIVATE_KEY || !WEBHOOK_SECRET) {
    throw new Error("Missing required environment variables: APP_ID, PRIVATE_KEY, or WEBHOOK_SECRET.");
}

declare global {
    namespace Express {
        interface Request {
            rawBody?: Buffer;
        }
    }
}

const app = express();
const publicPath = path.join(process.cwd(), "public");

app.use(express.static(publicPath));

app.use((req, res, next) => {
    if (req.path === "/webhook") {
        return next();
    }
    express.json({
        verify: (req: Request, _res: Response, buf: Buffer) => {
            req.rawBody = buf;
        },
    })(req, res, next);
});

app.get("/", (_req: Request, res: Response) => {
    const indexPath = path.join(publicPath, "index.html");
    res.sendFile(indexPath);
});

app.post("/webhook", express.raw({ type: "*/*" }), async (req: Request, res: Response): Promise<any> => {
    try {
        const rawBody = req.body;
        const signature = req.headers["x-hub-signature-256"] as string | undefined;
        const eventType = req.headers["x-github-event"] as string | undefined;

        if (!signature || !rawBody) {
            console.warn("⚠️ Missing signature or raw body — skipping validation.");
            return res.status(400).send("Missing signature or raw body");
        }

        verifySignature(rawBody, signature, WEBHOOK_SECRET);

        if (eventType === "ping") {
            console.log("✅ Ping event received.");
            return res.status(200).send("Webhook configured successfully!");
        }

        let payload;
        try {
            payload = JSON.parse(rawBody.toString("utf8"));
            console.log("✅ Payload parsed");
        } catch (err) {
            console.error("❌ Failed to parse JSON payload:", err);
            return res.status(400).send("Invalid JSON payload");
        }

        const { installation, repository } = payload;
        if (!installation?.id || !repository?.name || !repository?.owner?.login) {
            console.error("❌ Missing installation or repository info");
            return res.status(400).send("Missing installation or repository information");
        }

        const installationId = installation.id;
        const owner = repository.owner.login;
        const repo = repository.name;

        console.log(`Processing repo: ${owner}/${repo}, Installation ID: ${installationId}`);

        const octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: Number(APP_ID),
                privateKey: PRIVATE_KEY.replace(/\\n/g, "\n"),
                installationId,
            },
        });

        console.log("✅ Octokit instance created");

        const branch= payload.ref.replace('refs/heads/', '');

        console.log("branch:", branch);

        if (!branch || branch !== "main") {
            console.log("Skipping: Not on main branch", branch ?? null);
            return res.status(200).send("Skipping: Not on main branch");
        }

        let commitMessage = payload.head_commit?.message;

        if (!commitMessage) {
            const { data: commits } = await octokit.rest.repos.listCommits({
                owner,
                repo,
                sha: branch,
                per_page: 1,
            });
            commitMessage = commits[0]?.commit?.message || "";
        }

        const shouldGenerateDoc = commitMessage.includes("--doc");

        console.log("shouldGenerateDoc:", shouldGenerateDoc);

        if (!shouldGenerateDoc) {
            return res.status(200).send("Skipping: Use ?doc=true or add --doc to commit message");
        }

        console.log(`Generating README for ${owner}/${repo}`);

        const analysisText = await getRepoFilesAnalysis(octokit, owner, repo);
        let readmeContent;
        try {
            readmeContent = await generateReadmeWithRetries(analysisText);
        } catch (e) {
            console.error("❌ Failed to generate README due to API error:", e);
            return res.status(503).send("Model is currently overloaded, please try again later.");
        }
        if (!readmeContent) {
            console.warn("⚠️ Empty README content generated");
            return res.status(200).send("Empty README generated");
        }

        await pushReadme({ octokit, owner, repo, content: readmeContent });

        console.log("✅ README generated and pushed");
        return res.status(200).send("README successfully generated and pushed");
    } catch (error) {
        console.error("❌ Error in webhook handler:", error);
        return res.status(500).send("Internal Server Error");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 GitHub App listening on port ${PORT}`);
});
