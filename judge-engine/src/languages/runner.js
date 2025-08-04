const fs = require('fs');
const path = require('path');

const languageConfigs = {
    javascript: {
        image: 'node:18-alpine',
        fileName: 'index.js',
        command: (fileName) => ['node', fileName],
    },
    python: {
        image: 'python:3.10-alpine',
        fileName: 'main.py',
        command: (fileName) => ['python', fileName],
    },
    cpp: {
        image: 'gcc:latest',
        fileName: 'main.cpp',
        compile: (fileName) => ['g++', fileName, '-o', 'main'],
        command: () => ['./main'],
    },
};

async function runCodeInContainer(docker, language, code, testCases) {
    const config = languageConfigs[language];
    if (!config) {
        throw new Error(`Language ${language} not supported.`);
    }

    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    const filePath = path.join(tempDir, config.fileName);
    fs.writeFileSync(filePath, code);

    for (const testCase of testCases) {
        const input = testCase.input;
        const expectedOutput = testCase.output.trim();

        const container = await docker.createContainer({
            Image: config.image,
            Cmd: config.command(config.fileName),
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: false,
            OpenStdin: true,
            StdinOnce: false,
            HostConfig: {
                Binds: [`${tempDir}:/usr/src/app`],
                Memory: 256 * 1024 * 1024, // 256MB
            },
            WorkingDir: '/usr/src/app',
        });

        await container.start();

        const stream = await container.attach({
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true,
        });

        stream.write(input + '\n');
        stream.end();

        const output = await new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';
            stream.on('data', (chunk) => {
                // This is a simplified way to separate stdout and stderr
                // A more robust solution would inspect the chunk header
                stdout += chunk.toString('utf8');
            });
            stream.on('end', () => resolve({ stdout, stderr }));
            stream.on('error', reject);
        });

        await container.wait();
        await container.remove();

        const actualOutput = output.stdout.trim();

        if (output.stderr) {
            fs.unlinkSync(filePath);
            return { verdict: 'Runtime Error', output: output.stderr };
        }
        if (actualOutput !== expectedOutput) {
            fs.unlinkSync(filePath);
            return { verdict: 'Wrong Answer', output: `Expected: ${expectedOutput}, Got: ${actualOutput}` };
        }
    }

    fs.unlinkSync(filePath);
    return { verdict: 'Accepted', output: 'All test cases passed!' };
}

module.exports = { runCodeInContainer };
