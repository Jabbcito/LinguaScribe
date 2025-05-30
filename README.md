# Firebase Studio

This is a NextJS starter in Firebase Studio.
To get started, take a look at src/app/page.tsx.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/): It's recommended to use the latest LTS version.
- [npm](https://www.npmjs.com/): npm is installed with Node.js.

## Running the application locally

Follow these steps to get your development environment running:

1.  **Clone the repository:**
    If you haven't already, clone the project to your local machine.
    ```bash
    git clone <repository-url>
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd <project-name> 
    ```
    (Replace `<project-name>` with the actual name of the cloned folder).

3.  **Install dependencies:**
    This command will install all the necessary packages defined in `package.json`.
    ```bash
    npm install
    ```

4.  **Set up environment variables (Optional):**
    This project uses a `.env` file for environment variables. While it's currently empty, you might need to add API keys or other configurations here in the future (e.g., for Firebase services or Genkit API keys).
    You can create a `.env` file in the root of the project by copying from a template if one exists, or create it manually.
    ```
    # .env
    # Example: GOOGLE_API_KEY=your_api_key_here 
    ```

5.  **Run the Next.js development server:**
    This command starts the Next.js application in development mode. By default, it will run on port 9002.
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

6.  **Run the Genkit development server (for AI features):**
    Genkit is used for AI-related functionalities. To run Genkit flows and make them available to your Next.js app, you need to start its development server. This typically runs on a different port (often 3400).
    
    To start Genkit and have it automatically reload on changes:
    ```bash
    npm run genkit:watch
    ```
    Alternatively, to just start it once:
    ```bash
    npm run genkit:dev
    ```
    You'll need this running if you are working with or testing any AI features within the app.

You should now have the application running locally! The Next.js app will handle the frontend and general backend logic, while Genkit will handle specific AI tasks.
```
