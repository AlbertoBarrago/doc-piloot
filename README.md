# Doc-Pilot

Your AI copilot for project documentation. Doc-Pilot automatically generates comprehensive README files for GitHub repositories using AI.

## Features

- **Automated README Generation**: Analyzes your repository and generates a professional README.md file
- **GitHub Integration**: Works as a GitHub App or can be run locally
- **Smart Analysis**: Detects programming languages, frameworks, and project structure
- **Customizable**: Configure how the README is generated and pushed to your repository

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key
- GitHub personal access token (for local testing) or GitHub App credentials (for webhook integration)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/albertobarrago/doc-pilot.git
   cd doc-pilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   # Required for AI generation
   GEMINI_API_KEY=your_gemini_api_key

   # For local testing
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_REPO_TEST_OWNER=your_github_username
   GITHUB_REPO_TEST_NAME=your_repo_name

   # For GitHub App (webhook) integration
   APP_ID=your_github_app_id
   PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYour private key here\n-----END RSA PRIVATE KEY-----"
   WEBHOOK_SECRET=your_webhook_secret
   PORT=3000
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Local Testing

To test the README generation locally without pushing to GitHub:

```bash
npm run local:test
```

To generate and push the README to your repository:

```bash
npm run local:test:push
```

### GitHub App Integration

1. Create a GitHub App with the following permissions:
   - Repository contents: Read & write
   - Metadata: Read-only
   - Pull requests: Read & write

2. Set up a webhook URL pointing to your server's `/webhook` endpoint

3. Install the app on repositories where you want to generate READMEs

4. Start the server:
   ```bash
   npm start
   ```

5. Trigger the webhook by pushing to your repository or manually from GitHub's webhook settings

## How It Works

1. **Repository Analysis**: Doc-Pilot analyzes your repository's files, detecting languages, frameworks, and project structure
2. **Content Generation**: Using Google's Gemini AI, it generates a comprehensive README based on the analysis
3. **GitHub Integration**: The generated README is pushed to your repository as a pull request

## Development

### Project Structure

- `src/app/index.ts`: Main application entry point and webhook handler
- `src/app/analyzer.ts`: Repository analysis logic
- `src/app/gemini.ts`: AI-powered README generation
- `src/app/github.ts`: GitHub API integration
- `src/app/pushReadme.ts`: Logic for pushing README to GitHub
- `scripts/localTest.ts`: Script for local testing

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.