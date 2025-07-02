import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import { getRepoFilesAnalysis } from "./analyzer.js";
import { generateReadmeFromAnalysis } from "./gemini.js";
import { pushReadme } from "../services/pushReadme.js";
import path from 'path';
import { validateSignature } from "../services/validateSignature.js";
import { captureRawBody } from "../middleware/index.js";

dotenv.config();

const app = express();
const publicPath = path.join(process.cwd(), 'public');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET is not set in environment");
}

declare global {
    namespace Express {
        interface Request {
            rawBody?: Buffer;
        }
    }
}

app.use(captureRawBody);

app.use(express.json({
    verify: (req: Request, res: Response, buf: Buffer) => {
        req.rawBody = buf;
    }
}));

app.use(express.static(publicPath));

app.get('/', (req: Request, res: Response) => {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath);
});

app.post("/webhook", async (req: Request, res: Response): Promise<any> => {
    try {
        console.log("=== Webhook Request ===");
        console.log("Method:", req.method);
        console.log("URL:", req.url);
        console.log("Content-Type:", req.headers["content-type"]);
        console.log("Event Type:", req.headers["x-github-event"]);

        const signature = req.headers["x-hub-signature-256"] as string;
        if (signature && req.rawBody) {
            validateSignature(req.rawBody, signature, WEBHOOK_SECRET);
        } else {
            console.log("Skipping signature validation (missing signature or raw body)");
        }

        // Handle GitHub ping
        if (req.headers["x-github-event"] === "ping") {
            console.log("Received ping event from GitHub");
            return res.status(200).send("Webhook configured successfully!");
        }

        let payload = req.body;

        if (!payload || Object.keys(payload).length === 0) {
            console.log("Empty body, attempting manual parse");
            if (req.rawBody && req.rawBody.length > 0) {
                try {
                    const rawBodyStr = req.rawBody.toString('utf8');
                    console.log("Raw body (first 100 chars):", rawBodyStr.substring(0, 100));
                    payload = JSON.parse(rawBodyStr);
                    console.log("Manual parsing successful, keys:", Object.keys(payload));
                } catch (err) {
                    console.error("Manual parse failed:", err);
                    return res.status(200).send("Failed to parse webhook payload");
                }
            } else {
                return res.status(200).send("No payload received");
            }
        }

        const eventType = req.headers["x-github-event"] as string;
        console.log(`Processing ${eventType} event`);

        if (!payload.installation || !payload.repository) {
            console.error("Missing installation or repository info");
            return res.status(200).send("Missing installation or repository info");
        }

        const installationId = payload.installation.id;
        const owner = payload.repository.owner?.login;
        const repo = payload.repository.name;

        if (!installationId || !owner || !repo) {
            console.error("Missing required data:", { installationId, owner, repo });
            return res.status(200).send("Missing installationId, owner, or repo");
        }

        const octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: Number(process.env.APP_ID),
                privateKey: process.env.PRIVATE_KEY!.replace(/\\n/g, "\n"),
                installationId,
            },
        });

        // === Workflow Run ===
        if (eventType === "workflow_run") {
            console.log("Workflow run event received");

            const workflowRun = payload.workflow_run;
            let workflowName = undefined;

            if (workflowRun?.workflow_id) {
                console.log("Workflow ID:", workflowRun.workflow_id);
                try {
                    const workflowResp = await octokit.rest.actions.getWorkflow({
                        owner,
                        repo,
                        workflow_id: workflowRun.workflow_id,
                    });
                    workflowName = workflowResp.data.name;
                } catch (err) {
                    console.error("Failed to fetch workflow name:", err);
                }
            }

            console.log("Workflow name:", workflowName);

            const shouldProcess = req.query.doc === 'true' ||
                (workflowName && workflowName.includes('documentation'));

            if (!shouldProcess) {
                console.log("Skipping: Not a documentation workflow");
                return res.status(200).send("Skipping: Not a documentation workflow");
            }
        }

        // === Push Event ===
        else if (eventType === "push") {
            if (!payload.ref) {
                console.log("Missing ref field in push event");
                return res.status(200).send("Skipping: Missing ref field in push event");
            }

            const branch = payload.ref.replace('refs/heads/', '');
            console.log("Branch:", branch);

            if (branch !== 'main') {
                console.log("Not on main branch, skipping");
                return res.status(200).send("Skipping: Not on main branch");
            }

            const shouldGenerateDoc = req.query.doc === 'true' ||
                (payload.head_commit?.message?.includes('--doc'));

            console.log("Should generate documentation:", shouldGenerateDoc);
            if (!shouldGenerateDoc) {
                return res.status(200).send("Skipping documentation generation. Use ?doc=true or include --doc in commit message.");
            }
        }

        // === Unsupported Event ===
        else {
            console.log(`Skipping unsupported event type: ${eventType}`);
            return res.status(200).send(`Skipping unsupported event type: ${eventType}`);
        }

        // === Continue to Generate README ===
        console.log(`Starting README generation for ${owner}/${repo}`);

        console.log("Analyzing repository files...");
        const analysisText = await getRepoFilesAnalysis(octokit, owner, repo);

        console.log("Generating README content...");
        const readmeContent = await generateReadmeFromAnalysis(analysisText);

        if (!readmeContent) {
            console.error("Generated README is empty");
            return res.status(200).send("Empty README generated");
        }

        console.log("Pushing README to repository...");
        await pushReadme({
            octokit,
            owner,
            repo,
            content: readmeContent,
        });

        console.log("✅ README generated and pushed successfully");
        return res.status(200).send("README generated and pushed successfully");
    } catch (error) {
        console.error("❌ Error handling webhook:", error);
        return res.status(500).send("Internal Server Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`GitHub App listening on port ${PORT}`);
});
