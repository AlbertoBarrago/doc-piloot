
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import { getRepoFilesAnalysis } from "./analyzer.js";
import { generateReadmeFromAnalysis } from "./gemini.js";
import { pushReadme } from "../services/pushReadme.js";
import path from 'path';
import {validateSignature} from "../services/validateSignature.js";
import {captureRawBody} from "../middleware/index.js";
declare global {
    namespace Express {
        interface Request {
            rawBody?: Buffer;
        }
    }
}

dotenv.config();

const app = express();
const publicPath = path.join(process.cwd(), 'public');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET is not set in environment");
}

app.use(captureRawBody);

app.use(express.json({
    verify: (req: Request, res: Response, buf: Buffer) => {
        console.log("JSON parser processed body successfully");
    }
}));

app.use(express.static(publicPath));

app.get('/', (req: Request, res: Response) => {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath);
});

app.post("/webhook", async (req: express.Request, res: express.Response): Promise<any> => {
    try {
        console.log("=== Webhook Request ===");
        console.log("Method:", req.method);
        console.log("URL:", req.url);
        console.log("Content-Type:", req.headers["content-type"]);
        console.log("Event Type:", req.headers["x-github-event"]);

        const signature = req.headers["x-hub-signature-256"] as string;
        if (signature && req.rawBody) {
            validateSignature(req.rawBody, signature, WEBHOOK_SECRET);
            console.log("Signature validation completed");
        } else {
            console.log("Skipping signature validation (missing data)");
        }

        if (req.headers["x-github-event"] === "ping") {
            console.log("Received ping event from GitHub");
            return res.status(200).send("Webhook configured successfully!");
        }

        let payload = req.body;

        if (!payload || Object.keys(payload).length === 0) {
            console.log("Body is empty, attempting manual parsing");

            if (req.rawBody && req.rawBody.length > 0) {
                try {
                    const rawBodyStr = req.rawBody.toString('utf8');
                    console.log("Raw body string (first 100 chars):", rawBodyStr.substring(0, 100));
                    payload = JSON.parse(rawBodyStr);
                    console.log("Manual parsing successful, keys:", Object.keys(payload));
                } catch (parseError) {
                    console.error("Failed to parse JSON manually:", parseError);
                    return res.status(200).send("Failed to parse webhook payload");
                }
            } else {
                console.log("No raw body available");
                return res.status(200).send("No payload received");
            }
        }

        if (!payload || !payload.ref) {
            console.log("Not a push event or missing ref field");
            console.log("Event type:", req.headers["x-github-event"]);
            return res.status(200).send("Skipping: Not a push event or missing ref");
        }

        const branch = payload.ref.replace('refs/heads/', '');
        console.log("Branch:", branch);

        if (branch !== 'main') {
            console.log("Not on main branch, skipping");
            return res.status(200).send("Skipping: Not on main branch");
        }

        console.log("Checking commit message:", payload.head_commit?.message);
        const shouldGenerateDoc = req.query.doc === 'true' ||
            (payload.head_commit && payload.head_commit.message.includes('--doc'));

        console.log("Should generate documentation:", shouldGenerateDoc);
        if (!shouldGenerateDoc) {
            return res.status(200).send("Skipping documentation generation. Use ?doc=true parameter or include --doc in commit message.");
        }

        if (!payload.installation || !payload.repository) {
            console.error("Missing installation or repository info");
            return res.status(200).send("Missing installation or repository info");
        }

        const installationId: number | undefined = payload.installation.id;
        const owner: string | undefined = payload.repository.owner?.login;
        const repo: string | undefined = payload.repository.name;

        if (!installationId || !owner || !repo) {
            console.error("Missing required data:", { installationId, owner, repo });
            return res.status(200).send("Missing installationId, owner, or repo");
        }

        console.log(`Starting processing for ${owner}/${repo} with installationId ${installationId}`);

        const octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: Number(process.env.APP_ID),
                privateKey: process.env.PRIVATE_KEY!.replace(/\\n/g, "\n"),
                installationId,
            },
        });

        console.log("Analyzing repository files...");
        const analysisText = await getRepoFilesAnalysis(octokit, owner, repo);
        console.log("Repository analysis complete, generating README...");

        const readmeContent = await generateReadmeFromAnalysis(analysisText);
        if (!readmeContent) {
            console.error("Generated README content is empty");
            return res.status(200).send("Empty README generated");
        }

        console.log(`=== GENERATING README for ${owner}/${repo} ===`);
        console.log("Pushing README to repository...");

        await pushReadme({
            octokit,
            owner,
            repo,
            content: readmeContent,
        });

        console.log("README generated and pushed successfully!");
        return res.status(200).send("README generated and pushed successfully");
    } catch (error) {
        console.error("Error handling webhook:", error);
        return res.status(500).send("Internal Server Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`GitHub App listening on port ${PORT}`);
    console.log("⚠️ WARNING: Running with webhook signature validation disabled for production");
});