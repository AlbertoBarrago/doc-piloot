# Doc-Pilot

Your AI copilot for project documentation. Doc-Pilot automatically generates comprehensive README files for GitHub repositories using AI.

## Features

- **Automated README Generation**: Analyzes your repository and generates a professional README.md file.
- **GitHub Integration**: Designed to work seamlessly as a GitHub App or can be run locally.
- **Smart Analysis**: Detects programming languages, frameworks, and project structure to provide accurate and relevant documentation.
- **Customizable Output**: Provides options to tailor the README content to your specific needs.
- **AI-Powered Insights**: Leverages advanced AI models to understand your code and generate insightful documentation.

## Installation

To install and run Doc-Pilot locally, follow these steps:

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

    Create a `.env` file in the root directory and add the necessary environment variables. Example:

    ```
    GITHUB_TOKEN=<your_github_token>
    GOOGLE_API_KEY=<your_google_api_key>
    ```
    *Note: Obtain a Github Token with appropriate permissions to interact with your repository and a Google API key that allows you to use the Google AI models.*

4.  **Compile TypeScript:**

    ```bash
    npm run build
    ```

## Usage

### Running Doc-Pilot

1.  **Start the server:**

    ```bash
    npm start
    ```

    This will start the Doc-Pilot server.

### Interacting with Doc-Pilot

*   **API Endpoints**:  Doc-Pilot exposes API endpoints to trigger README generation and retrieve documentation information. Refer to the API documentation (once created) for details on request formats and response structures.

Example API usage with `curl`:

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "repository_url": "<your_repository_url>"
}' http://localhost:3000/generate-readme
```

(Replace `<your_repository_url>` with the actual URL of your GitHub repository and `http://localhost:3000/generate-readme` with the actual API endpoint URL if it's different).

## Technologies Used

-   **Languages**:
    -   TypeScript
    -   HTML
-   **Frameworks**:
    -   Express.js
-   **Libraries**:
    -   `@google/genai`: For accessing Google AI models.
    -   `@octokit/rest`: For interacting with the GitHub API.
    -   `octokit`: For interacting with the GitHub API.
    -   `dotenv`: For managing environment variables.

## Project Structure

```
doc-pilot/
├── public/              # Static assets (e.g., HTML, CSS)
├── src/                 # Source code
│   ├── index.ts           # Main application entry point
│   ├── ...                # Other TypeScript files
├── tests/               # Unit and integration tests
├── README.md            # This file
├── package-lock.json    # Dependency lock file
├── package.json         # Project metadata and dependencies
├── tsconfig.json        # TypeScript configuration file
```

## Contributing

Contributions are welcome! Here's how you can contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes.
4.  Write tests for your changes.
5.  Submit a pull request.

Please ensure your code adheres to the project's coding standards and includes appropriate documentation.

## License

[Specify the license under which your project is released.  For example, if using the MIT license:]

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. [Create a LICENSE file in the repository root with the license text.]