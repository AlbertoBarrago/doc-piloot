import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import { getRepoFilesAnalysis } from "./analyzer.js";
import { generateReadmeFromAnalysis } from "./gemini.js";
import { pushReadme } from "../services/pushReadme.js";
import path from "path";
import { verifySignature } from "../services/validateSignature.js";
import { captureRawBody } from "../middleware/index.js";

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

app.use("/webhook", captureRawBody);

app.use(express.json({
    verify: (req: Request, _res: Response, buf: Buffer) => {
        req.rawBody = buf;
    }
}));

app.get("/", (_req: Request, res: Response) => {
    const indexPath = path.join(publicPath, "index.html");
    res.sendFile(indexPath);
});

app.post("/webhook", express.raw({ type: "*/*" }), async (req: Request, res: Response): Promise<any> => {
    try {
        console.log("=== Incoming GitHub Webhook ===");
        const signature = req.headers["x-hub-signature-256"] as string;
        const eventType = req.headers["x-github-event"] as string;

        if (signature && req.rawBody) {
            verifySignature(req.rawBody, signature, WEBHOOK_SECRET);
        } else {
            console.warn("⚠️ Missing signature or raw body — skipping validation.");
        }

        if (eventType === "ping") {
            console.log("✅ Ping event received.");
            return res.status(200).send("Webhook configured successfully!");
        }

        let payload = req.body;

        if (!payload || Object.keys(payload).length === 0) {
            if (req.rawBody && req.rawBody.length > 0) {
                try {
                    payload = JSON.parse(req.rawBody.toString("utf8"));
                    console.log("✅ Manual parsing successful");
                } catch (err) {
                    console.error("❌ Manual parse failed:", err);
                    return res.status(400).send("Invalid JSON payload");
                }
            } else {
                return res.status(400).send("Empty payload received");
            }
        }

        const { installation, repository } = payload;
        if (!installation?.id || !repository?.name || !repository?.owner?.login) {
            console.error("❌ Missing installation or repo info");
            return res.status(400).send("Missing installation or repository information");
        }

        const installationId = installation.id;
        const owner = repository.owner.login;
        const repo = repository.name;

        const octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: Number(APP_ID),
                privateKey: PRIVATE_KEY.replace(/\\n/g, "\n"),
                installationId,
            },
        });

        if (eventType === "workflow_run") {
            const workflowRun = payload.workflow_run;
            let workflowName;

            if (workflowRun?.workflow_id) {
                try {
                    const { data } = await octokit.rest.actions.getWorkflow({
                        owner,
                        repo,
                        workflow_id: workflowRun.workflow_id,
                    });
                    workflowName = data.name;
                } catch (err) {
                    console.warn("⚠️ Failed to fetch workflow name:", err);
                }
            }

            const shouldProcess = req.query.doc === 'true' ||
                (workflowName && workflowName.toLowerCase().includes("documentation"));

            if (!shouldProcess) {
                return res.status(200).send("Skipping non-documentation workflow");
            }
        }

        // === Push Event ===
        else if (eventType === "push") {
            const branch = payload.ref?.replace("refs/heads/", "");

            if (!branch || branch !== "main") {
                return res.status(200).send("Skipping: Not on main branch");
            }

            const shouldGenerateDoc = req.query.doc === "true" ||
                payload.head_commit?.message?.includes("--doc");

            if (!shouldGenerateDoc) {
                return res.status(200).send("Skipping: Use ?doc=true or add --doc to commit message");
            }
        }

        else {
            console.log(`Skipping unsupported event type: ${eventType}`);
            return res.status(200).send(`Unsupported event type: ${eventType}`);
        }

        console.log(`Generating README for ${owner}/${repo}`);
        const analysisText = await getRepoFilesAnalysis(octokit, owner, repo);
        const readmeContent = await generateReadmeFromAnalysis(analysisText);

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
