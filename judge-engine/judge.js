// /judge-engine/judge.js
const { exec } = require('child_process');
const fs = require('fs'); // Corrected: require the module
const path = require('path'); // Corrected: require the module
const { v4: uuid } = require('uuid');

const dirPath = path.join(__dirname, 'temp');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const executeCode = (language, code, input) => {
  return new Promise((resolve, reject) => {
    const submissionId = uuid();
    const submissionPath = path.join(dirPath, submissionId);
    fs.mkdirSync(submissionPath, { recursive: true });

    const filename = language === 'java' ? 'Main.java' : `code.${language}`;
    const codeFilePath = path.join(submissionPath, filename);
    const inputFilePath = path.join(submissionPath, 'input.txt');

    fs.writeFileSync(codeFilePath, code);
    fs.writeFileSync(inputFilePath, input);

    const dockerCommand = `docker run --rm --memory="256m" --cpus="0.5" -v "${submissionPath}:/usr/src/app" -w /usr/src/app ${language}-compiler`;

    exec(
      dockerCommand,
      { timeout: 5000 },
      (error, stdout, stderr) => {
        fs.rm(submissionPath, { recursive: true, force: true }, (err) => {
            if (err) console.error(`Failed to remove temp directory: ${submissionPath}`, err);
        });

        if (error) {
          if (error.killed && error.signal === 'SIGTERM') {
            return reject({ message: 'Time Limit Exceeded', stderr: 'Execution took too long.' });
          }
          return reject({ error, stderr });
        }
        if (stderr) {
          return reject({ stderr });
        }
        resolve(stdout);
      }
    );
  });
};

module.exports = { executeCode };
