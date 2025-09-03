# Doc-Pilot

Your AI copilot for project documentation. Doc-Pilot automatically generates comprehensive README files for GitHub repositories using AI.

## Note 
The app is named doc-piloot because `doc-pilot` is a reserved name...

## Features

- **Automated README Generation**: Analyzes your repository and generates a professional README.md file, saving you valuable time and effort.
- **GitHub Integration**: Designed to work seamlessly as a GitHub App or can be run locally for customized use cases.
- **Smart Analysis**: Detects programming languages, frameworks, and project structure to provide accurate and relevant documentation.
- **AI-Powered Content**: Leverages advanced AI models to generate accurate and informative descriptions for your project.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd doc-pilot
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root directory and add the necessary environment variables.  You will likely need API keys for the AI model and GitHub authentication tokens.  Example:

    ```
    GITHUB_TOKEN=<your_github_token>
    GOOGLE_API_KEY=<your_google_api_key>
    ```

    *Note:* You'll need to obtain a GitHub token with the appropriate permissions. You'll also need a Google Cloud project set up with the Gemini API enabled.

## Usage

### Running Locally

1.  **Start the development server:**

    ```bash
    npm run dev
    ```

    This command typically uses `ts-node` to run the `src/index.ts` file after compiling your TypeScript code.  Refer to your `package.json` scripts section for the exact command.

2.  **Access the application:**

    Open your web browser and navigate to `http://localhost:<port>` (The port is usually defined within your Express.js application, commonly 3000 or 8080).

### As a GitHub App (Future Development)

*This functionality is planned for future development.* Instructions on setting up Doc-Pilot as a GitHub App will be provided here once implemented. This will involve creating a GitHub App, configuring webhooks, and deploying the application to a suitable hosting platform.

## Technologies Used

-   **Language:** TypeScript, HTML
-   **AI Model:** Google Gemini (using `@google/genai`)
-   **GitHub API:** Octokit (`@octokit/rest` and `octokit`)
-   **Environment Variables:** dotenv
-   **Development Tools:** ts-node, typescript, copyfiles

## Project Structure

```
doc-pilot/
├── public/              # Static assets (e.g., HTML, CSS, JavaScript)
├── src/                 # Source code
│   ├── index.ts           # Main entry point of the application
│   └── ...                # Other TypeScript files
├── tests/               # Unit and integration tests
├── README.md            # This file
├── package.json         # Project metadata and dependencies
├── package-lock.json    # Dependency version locking
├── tsconfig.json        # TypeScript compiler configuration
└── .env                 # Environment variables (API keys, tokens)
```

## Contributing

We welcome contributions to Doc-Pilot!  Please follow these guidelines:

1.  **Fork the repository.**
2.  **Create a new branch for your feature or bug fix.**
3.  **Write clear and concise code with appropriate comments.**
4.  **Add tests to ensure your changes are working correctly.**
5.  **Submit a pull request with a detailed description of your changes.**

## License

MIT License

Copyright (c) 2025 Alberto Barrago

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
