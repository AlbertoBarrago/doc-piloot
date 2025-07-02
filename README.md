# Doc-Pilot
Your AI copilot for project documentation. Doc-Pilot automatically generates comprehensive README files for GitHub repositories using AI.

## Features

- **Automated README Generation**: Analyzes your repository and generates a professional README.md file.
- **GitHub Integration**: Designed to work seamlessly as a GitHub App or can be run locally.
- **Smart Analysis**: Detects programming languages, frameworks, and project structure to provide accurate and relevant documentation.
- **Customizable**: Offers configuration options to tailor the README generation process to your specific needs.
- **Comprehensive Documentation**: Generates detailed documentation covering project setup, usage, technologies, and more.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd doc-pilot
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

    or

    ```bash
    yarn install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root directory and add the following variables:

    ```
    # Example .env file
    GITHUB_TOKEN=<your_github_token>
    GOOGLE_API_KEY=<your_google_api_key>  # Required if using Google's GenAI
    # Other environment variables if needed
    ```

    **Note:** You will need a GitHub token with the necessary permissions to access and modify repositories. You'll also need a Google API key if leveraging the Google GenAI functionality.  Obtain these credentials from the respective platforms.

4.  **Compile the TypeScript code:**

    ```bash
    npm run build
    ```

    or

    ```bash
    yarn build
    ```

## Usage

### Running the Application

1.  **Start the server:**

    ```bash
    npm start
    ```

    or

    ```bash
    yarn start
    ```

    This will start the Express.js server, and you can interact with the Doc-Pilot through its API endpoints.

### Example: Triggering README Generation (Illustrative)

(This section is illustrative since we don't have concrete API details.  It should be adapted to reflect the actual API.)

Assuming you have an API endpoint to trigger README generation for a specific repository, you might interact with it like this:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"repository_url": "https://github.com/your-username/your-repo"}' \
  http://localhost:3000/generate-readme
```

This command sends a POST request to the `/generate-readme` endpoint (example) with the repository URL. The server will then process the request and generate the README.md file.  The specifics of this will depend on how the Express routes are configured.

## Technologies Used

-   **TypeScript**: Primary programming language for the project.
-   **Express.js**: Web application framework for building the API.
-   **@google/genai**:  (Potentially) Google's GenAI library for AI-powered content generation.
-   **@octokit/rest & octokit**:  Libraries for interacting with the GitHub API.
-   **dotenv**: For managing environment variables.

## Project Structure

```
doc-pilot/
├── README.md          # This file
├── package-lock.json  # Records the exact versions of dependencies
├── package.json       # Project metadata and dependencies
├── tsconfig.json      # TypeScript compiler configuration
└── src/               # Source code directory
    ├── index.ts         # Entry point of the application
    └── ...              # Other source files (e.g., API routes, utility functions)
```

## Contributing!

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, descriptive commit messages.
4.  Submit a pull request.
