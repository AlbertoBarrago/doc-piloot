# Doc-Pilot

Your AI copilot for project documentation. Doc-Pilot automatically generates comprehensive README files for GitHub repositories using AI.

## Features

- **Automated README Generation**: Analyzes your repository and generates a professional README.md file.
- **GitHub Integration**: Designed to work seamlessly as a GitHub App or can be run locally.
- **Smart Analysis**: Detects programming languages, frameworks, and project structure to provide accurate and relevant documentation.
- **Customizable Output**:  Allows for some degree of customization (this could be further expanded in the future).
- **AI Powered**:  Uses Google Gemini AI to understand your project.

## Installation

To run Doc-Pilot locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd doc-pilot
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root directory with the following variables:

    ```
    GOOGLE_GENAI_API_KEY=<Your_Google_Gemini_API_Key>
    GITHUB_TOKEN=<Your_GitHub_Token>  # If using GitHub integration
    ```

    **Note:** Obtain your Google Gemini API Key from the Google AI Studio.  For GitHub integration, generate a personal access token with the appropriate permissions (e.g., `repo` for full repository access, or narrower permissions as required).

4.  **Build the project:**

    ```bash
    npm run build
    ```

## Usage

1.  **Run the application:**

    ```bash
    npm start
    ```

    This will start the Express.js server. You may need to configure the exact entrypoint based on how you intend to use Doc-Pilot (e.g., as a GitHub App responding to webhooks, or via a local API endpoint). The default setup likely expects certain environment variables to be set.

2. **Example - Calling the API**
   (Assuming you have an Express endpoint that takes the repository URL)

    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"repoUrl": "https://github.com/owner/repo"}' http://localhost:3000/generate-readme
    ```

    Replace `http://localhost:3000/generate-readme` with the actual endpoint if different. You'll need to implement the actual API endpoint using Express within the `src` directory.

## Technologies Used

*   **Programming Languages:** TypeScript, HTML
*   **Framework:** Express.js
*   **AI Library:** `@google/genai`
*   **GitHub API Library:** `@octokit/rest`, `octokit`
*   **Other Libraries:** `dotenv`, `cross-env`, `copyfiles`

## Project Structure

```
doc-pilot/
├── README.md             # This file
├── package-lock.json     # Records the exact versions of dependencies
├── package.json          # Project metadata and dependencies
├── tsconfig.json         # TypeScript compiler configuration
├── public/               # Static assets (e.g., HTML, CSS)
│   └── ...
├── src/                  # Source code
│   ├── index.ts          # Main application entry point (likely)
│   └── ...
├── tests/                # Unit and integration tests
│   └── ...
```

## Contributing

Contributions are welcome!  Here are the general guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Implement your changes.
4.  Write tests for your changes.
5.  Submit a pull request.

Please ensure your code adheres to the project's coding style and that all tests pass.

## License

[Choose a license and add it here, e.g., MIT License, Apache 2.0, etc. If no license is specified, then all rights are reserved.]

```
MIT License

Copyright (c) [Year] [Your Name]

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
```