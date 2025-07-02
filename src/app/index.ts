import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import { getRepoFilesAnalysis } from "./analyzer.js";
import { generateReadmeFromAnalysis } from "./gemini.js";
import { pushReadme } from "../services/pushReadme.js";
import path from 'path';
import {verifySignature} from "../services/commons.js";


dotenv.config();

const app = express();


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

app.use(express.json({
    verify: (req: Request, res: Response, buf: Buffer) => {
        req.rawBody = buf;
    }
}));

const publicPath = path.join(process.cwd(), 'public');

app.use(express.static(publicPath));

app.get('/', (req: Request, res: Response) => {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath);
});


// @ts-ignore
app.post("/webhook", async (req: Request, res: Response) => {
    try {
        const signature = req.headers["x-hub-signature-256"];
        if (!signature || Array.isArray(signature)) {
            return res.status(401).send("Missing or invalid signature");
        }

        const rawBody = req.rawBody?.toString("utf-8");
        if (!rawBody) {
            return res.status(400).send("Missing raw request body");
        }

        if (!verifySignature(WEBHOOK_SECRET, rawBody, signature)) {
            return res.status(401).send("Invalid signature");
        }

        const payload = req.body;

        if (!payload.installation) {
            return res.status(400).send("No installation info in payload");
        }

        if (!payload.repository) {
            return res.status(400).send("No repository info in payload");
        }

        const installationId: number | undefined = payload.installation.id;
        const owner: string | undefined = payload.repository.owner?.login;
        const repo: string | undefined = payload.repository.name;

        if (!installationId || !owner || !repo) {
            return res.status(400).send("Missing installationId, owner, or repo");
        }

        const octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: Number(process.env.APP_ID),
                privateKey: process.env.PRIVATE_KEY!.replace(/\\n/g, "\n"),
                installationId,
            },
        });

        const analysisText = await getRepoFilesAnalysis(octokit, owner, repo);
        const readmeContent = await generateReadmeFromAnalysis(analysisText);

        console.log(`=== GENERATED README for ${owner}/${repo} ===\n`, readmeContent);

        if (!readmeContent) {
            throw new Error("Generated README content is empty or undefined");
        }

        await pushReadme({
            octokit,
            owner,
            repo,
            content: readmeContent,
        });

        res.status(200).send("README generated and pushed successfully");
    } catch (error) {
        console.error("Error handling webhook:", error);
        res.status(500).send("Internal Server Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`GitHub App listening on port ${PORT}`);
});
