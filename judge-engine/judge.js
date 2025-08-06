// judge-engine/judge.js
const { exec } = require('child_process');
const fs = 'fs';
const path = 'path';
const { v4: uuid } = require('uuid');

// Define the base path for temporary submission directories
const dirPath = path.join(__dirname, 'temp');

// Create the base 'temp' directory if it doesn't exist
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Executes the user's code in a secure Docker container.
 * @param {string} language - The programming language (e.g., 'cpp', 'python', 'java').
 * @param {string} code - The source code to be executed.
 * @param {string} input - The standard input to be passed to the code.
 * @returns {Promise<string>} A promise that resolves with the standard output of the code.
 */
const executeCode = (language, code, input) => {
  return new Promise((resolve, reject) => {
    // 1. Generate a unique ID for the submission to create an isolated directory
    const submissionId = uuid();
    const submissionPath = path.join(dirPath, submissionId);
    fs.mkdirSync(submissionPath, { recursive: true });

    // 2. Determine the filename based on the language
    const filename = language === 'java' ? 'Main.java' : `code.${language}`;
    const codeFilePath = path.join(submissionPath, filename);
    const inputFilePath = path.join(submissionPath, 'input.txt');

    // 3. Write the code and input to their respective files
    fs.writeFileSync(codeFilePath, code);
    fs.writeFileSync(inputFilePath, input);

    // 4. Construct the Docker command with resource limits
    // --rm: Automatically remove the container when it exits.
    // -v: Mount the submission directory into the container.
    // --memory="256m": Limit RAM to 256MB.
    // --cpus="0.5": Limit CPU usage to 50% of one core.
    const dockerCommand = `docker run --rm --memory="256m" --cpus="0.5" -v "${submissionPath}:/usr/src/app" -w /usr/src/app ${language}-compiler`;

    // 5. Execute the command with a timeout
    exec(
      dockerCommand,
      { timeout: 5000 }, // 5-second timeout for execution
      (error, stdout, stderr) => {
        // 6. Clean up the temporary directory after execution
        fs.rm(submissionPath, { recursive: true, force: true }, (err) => {
            if (err) console.error(`Failed to remove temp directory: ${submissionPath}`, err);
        });

        if (error) {
          // Handle different types of errors
          if (error.killed && error.signal === 'SIGTERM') {
            return reject({ message: 'Time Limit Exceeded', stderr: 'Execution took too long.' });
          }
          return reject({ error, stderr });
        }
        if (stderr) {
          // Some languages (like Java) might print warnings to stderr that aren't fatal.
          // Depending on strictness, you might resolve or reject here.
          // For a strict judge, any stderr is a potential issue.
          return reject({ stderr });
        }
        resolve(stdout);
      }
    );
  });
};

module.exports = { executeCode };
