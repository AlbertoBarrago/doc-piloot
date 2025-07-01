import {Octokit} from "octokit";
import {getRepoFiles} from "./github.js";

interface RepoAnalysis {
    languages: Set<string>;
    frameworks: Set<string>;
    entrypoint: string | null;
    packageInfo: {
        name?: string;
        description?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
    };
    files: Array<{path: string; content: string}>;
}

export async function getRepoFilesAnalysis(octokit: Octokit, owner: string, repo: string): Promise<string> {
    const files = await getRepoFiles(octokit, owner, repo);

    // Filter code files you care about
    const exts = [".js", ".ts", ".jsx", ".tsx", ".json", ".md", ".html", ".css", ".scss", ".py", ".rb", ".java", ".go"];
    const filteredFiles = files.filter(f => exts.some(ext => f.path.endsWith(ext)));

    // Analyze repository
    const analysis: RepoAnalysis = {
        languages: new Set<string>(),
        frameworks: new Set<string>(),
        entrypoint: null,
        packageInfo: {},
        files: filteredFiles
    };

    // Detect languages
    for (const file of filteredFiles) {
        if (file.path.endsWith(".js") || file.path.endsWith(".jsx")) {
            analysis.languages.add("JavaScript");
        } else if (file.path.endsWith(".ts") || file.path.endsWith(".tsx")) {
            analysis.languages.add("TypeScript");
        } else if (file.path.endsWith(".py")) {
            analysis.languages.add("Python");
        } else if (file.path.endsWith(".rb")) {
            analysis.languages.add("Ruby");
        } else if (file.path.endsWith(".java")) {
            analysis.languages.add("Java");
        } else if (file.path.endsWith(".go")) {
            analysis.languages.add("Go");
        } else if (file.path.endsWith(".html")) {
            analysis.languages.add("HTML");
        } else if (file.path.endsWith(".css")) {
            analysis.languages.add("CSS");
        } else if (file.path.endsWith(".scss")) {
            analysis.languages.add("SCSS");
        }
    }

    // Parse package.json if exists
    const packageJson = filteredFiles.find(f => f.path === "package.json");
    if (packageJson) {
        try {
            const packageData = JSON.parse(packageJson.content);
            analysis.packageInfo = {
                name: packageData.name,
                description: packageData.description,
                dependencies: packageData.dependencies || {},
                devDependencies: packageData.devDependencies || {}
            };

            // Detect frameworks from dependencies
            const allDeps = {...packageData.dependencies, ...packageData.devDependencies};
            if (allDeps) {
                if (allDeps.react) analysis.frameworks.add("React");
                if (allDeps.vue) analysis.frameworks.add("Vue.js");
                if (allDeps.angular || allDeps["@angular/core"]) analysis.frameworks.add("Angular");
                if (allDeps.express) analysis.frameworks.add("Express.js");
                if (allDeps.next) analysis.frameworks.add("Next.js");
                if (allDeps.nuxt) analysis.frameworks.add("Nuxt.js");
                if (allDeps.svelte) analysis.frameworks.add("Svelte");
            }

            // Detect entrypoint
            if (packageData.main) {
                analysis.entrypoint = packageData.main;
            }
        } catch (error) {
            console.error("Error parsing package.json:", error);
        }
    }

    // Check for Python requirements.txt
    const requirementsTxt = filteredFiles.find(f => f.path === "requirements.txt");
    if (requirementsTxt) {
        const requirements = requirementsTxt.content.split("\n").map(line => line.trim());
        if (requirements.some(r => r.startsWith("django"))) analysis.frameworks.add("Django");
        if (requirements.some(r => r.startsWith("flask"))) analysis.frameworks.add("Flask");
    }

    // Build a textual summary
    let textAnalysis = "";

    // Add repository info
    textAnalysis += "Repository Analysis:\n";
    textAnalysis += `Languages: ${Array.from(analysis.languages).join(", ") || "Unknown"}\n`;
    textAnalysis += `Frameworks: ${Array.from(analysis.frameworks).join(", ") || "None detected"}\n`;
    textAnalysis += `Entrypoint: ${analysis.entrypoint || "Unknown"}\n`;
    textAnalysis += `Project Name: ${analysis.packageInfo.name || "Unknown"}\n`;
    textAnalysis += `Description: ${analysis.packageInfo.description || "None provided"}\n\n`;

    // Add file structure
    textAnalysis += "File Structure:\n";
    const rootFiles = filteredFiles.filter(f => !f.path.includes("/"));
    const directories = new Set<string>();

    filteredFiles.forEach(f => {
        if (f.path.includes("/")) {
            const dir = f.path.split("/")[0];
            directories.add(dir);
        }
    });

    textAnalysis += "Root Files:\n";
    rootFiles.forEach(f => {
        textAnalysis += `- ${f.path}\n`;
    });

    textAnalysis += "\nDirectories:\n";
    directories.forEach(dir => {
        textAnalysis += `- ${dir}/\n`;
    });

    textAnalysis += "\nKey Files Content:\n";

    // Add README content if exists
    const readme = filteredFiles.find(f => f.path.toLowerCase() === "readme.md");
    if (readme) {
        textAnalysis += "README.md:\n";
        textAnalysis += `${readme.content.slice(0, 500)}${readme.content.length > 500 ? "..." : ""}\n\n`;
    }

    // Add package.json content if exists
    if (packageJson) {
        textAnalysis += "package.json (dependencies):\n";
        if (analysis.packageInfo.dependencies && Object.keys(analysis.packageInfo.dependencies).length > 0) {
            textAnalysis += "Dependencies:\n";
            Object.entries(analysis.packageInfo.dependencies).forEach(([name, version]) => {
                textAnalysis += `- ${name}: ${version}\n`;
            });
        }
        if (analysis.packageInfo.devDependencies && Object.keys(analysis.packageInfo.devDependencies).length > 0) {
            textAnalysis += "DevDependencies:\n";
            Object.entries(analysis.packageInfo.devDependencies).forEach(([name, version]) => {
                textAnalysis += `- ${name}: ${version}\n`;
            });
        }
        textAnalysis += "\n";
    }

    // Add main file content
    if (analysis.entrypoint) {
        const mainFile = filteredFiles.find(f => f.path === analysis.entrypoint);
        if (mainFile) {
            textAnalysis += `Main File (${analysis.entrypoint}):\n`;
            textAnalysis += `${mainFile.content.slice(0, 500)}${mainFile.content.length > 500 ? "..." : ""}\n\n`;
        }
    }

    return textAnalysis;
}
