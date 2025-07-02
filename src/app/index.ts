import dotenv from "dotenv";
import util from 'node:util';
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

app.use((req: Request, res: Response, next) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', () => {
        req.rawBody = Buffer.from(data);
        next();
    });
});

app.use(express.json({
    verify: (req: Request, res: Response, buf: Buffer) => {
        req.rawBody = buf;
    }
}));

app.use((req: Request, res: Response, next) => {
    if (req.method === 'POST' && !req.body) {
        console.log('Raw payload:', req.rawBody?.toString());
        try {
            req.body = JSON.parse(req.rawBody?.toString() || '{}');
        } catch (e) {
            console.error('Errors parsing body:', e);
            console.log('Content not valid');
        }
    }
    next();
});

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
        console.log("Query params:", req.query);
        console.log("Content-Type:", req.headers["content-type"]);
        console.log("Content-Length:", req.headers["content-length"]);
        console.log("Event Type:", req.headers["x-github-event"]);
        console.log("Headers:", JSON.stringify(req.headers, null, 2));


        const signature = req.headers["x-hub-signature-256"];
        if (!signature || Array.isArray(signature)) {
            return console.error("Missing X-Hub-Signature-256 header");
        }

        const rawBody = req.rawBody?.toString("utf-8");
        if (!rawBody) {
            return console.error("Missing rawBody");
        }


        if (!verifySignature(WEBHOOK_SECRET, rawBody, signature)) {
            return console.error("Invalid signature");
        }

        const payload = req.body;

        if (payload.ref === undefined) {
            return res.status(200).send("Skipping: Not a push event");
        }

        const branch = payload.ref?.replace('refs/heads/', '');
        if (branch !== 'main') {
            res.status(200).send("Skipping: Not on main branch");
            return;
        }

        const shouldGenerateDoc = req.query.doc === 'true' ||
            (payload.head_commit && payload.head_commit.message.includes('--doc'));

        if (!shouldGenerateDoc) {
            res.status(200).send("Skipping documentation generation. Use ?doc=true parameter to generate README.");
            return;
        }

        if (!payload.installation || !payload.repository) {
            return res.status(400).send("Missing installation or repository info");
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

        console.log(`=== GENERATING README for ${owner}/${repo} ===`);

        await pushReadme({
            octokit,
            owner,
            repo,
            content: readmeContent ?? null,
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