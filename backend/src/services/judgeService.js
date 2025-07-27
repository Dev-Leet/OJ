const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const docker = new Docker();

// Language configurations for Docker execution
const LANGUAGE_CONFIGS = {
  cpp: {
    image: 'gcc:latest',
    compileCommand: 'g++ -o solution solution.cpp -std=c++17 -O2',
    runCommand: './solution',
    fileName: 'solution.cpp',
    timeout: 10000 // 10 seconds
  },
  java: {
    image: 'openjdk:11',
    compileCommand: 'javac Solution.java',
    runCommand: 'java Solution',
    fileName: 'Solution.java',
    timeout: 15000 // 15 seconds (Java needs more time for JVM startup)
  },
  python: {
    image: 'python:3.9-slim',
    compileCommand: null, // Python doesn't need compilation
    runCommand: 'python3 solution.py',
    fileName: 'solution.py',
    timeout: 10000
  },
  javascript: {
    image: 'node:16-slim',
    compileCommand: null, // JavaScript doesn't need compilation
    runCommand: 'node solution.js',
    fileName: 'solution.js',
    timeout: 10000
  }
};

// Main function to execute code against test cases
const executeCode = async ({ code, language, testCases, constraints }) => {
  const executionId = uuidv4();
  const workDir = path.join('/tmp', `judge_${executionId}`);
  
  try {
    // Create working directory
    await fs.mkdir(workDir, { recursive: true });
    
    // Get language configuration
    const config = LANGUAGE_CONFIGS[language];
    if (!config) {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    // Write code to file
    const codeFilePath = path.join(workDir, config.fileName);
    await fs.writeFile(codeFilePath, code);
    
    // Compile code if needed
    let compilationResult = null;
    if (config.compileCommand) {
      compilationResult = await compileCode(workDir, config, constraints);
      if (!compilationResult.success) {
        return {
          status: 'compilation_error',
          verdict: 'Compilation Error',
          compilationError: compilationResult.error,
          totalExecutionTime: 0,
          maxMemoryUsed: 0,
          passedTestCases: 0,
          testCaseResults: []
        };
      }
    }
    
    // Execute code against all test cases
    const testCaseResults = [];
    let passedTestCases = 0;
    let totalExecutionTime = 0;
    let maxMemoryUsed = 0;
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        const result = await runTestCase(
          workDir,
          config,
          testCase.input,
          testCase.output,
          constraints,
          i
        );
        
        testCaseResults.push({
          testCaseId: testCase._id,
          passed: result.passed,
          actualOutput: result.actualOutput,
          expectedOutput: testCase.output,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          errorMessage: result.errorMessage
        });
        
        if (result.passed) {
          passedTestCases++;
        }
        
        totalExecutionTime += result.executionTime;
        maxMemoryUsed = Math.max(maxMemoryUsed, result.memoryUsed);
        
        // Stop execution on first failed test case for efficiency
        if (!result.passed && result.status !== 'runtime_error') {
          break;
        }
        
      } catch (error) {
        console.error(`Error running test case ${i}:`, error);
        
        testCaseResults.push({
          testCaseId: testCase._id,
          passed: false,
          actualOutput: '',
          expectedOutput: testCase.output,
          executionTime: 0,
          memoryUsed: 0,
          errorMessage: 'Internal execution error'
        });
        
        break;
      }
    }
    
    // Determine final status and verdict
    const result = determineVerdict(
      passedTestCases,
      testCases.length,
      testCaseResults,
      totalExecutionTime,
      maxMemoryUsed,
      constraints
    );
    
    return {
      ...result,
      totalExecutionTime,
      maxMemoryUsed,
      passedTestCases,
      testCaseResults: testCaseResults.slice(0, 10) // Limit stored results for performance
    };
    
  } catch (error) {
    console.error('Code execution error:', error);
    return {
      status: 'runtime_error',
      verdict: 'Runtime Error',
      runtimeError: 'Internal server error during execution',
      totalExecutionTime: 0,
      maxMemoryUsed: 0,
      passedTestCases: 0,
      testCaseResults: []
    };
  } finally {
    // Cleanup working directory
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
};

// Compile code for languages that require compilation
const compileCode = async (workDir, config, constraints) => {
  try {
    const container = await docker.createContainer({
      Image: config.image,
      Cmd: ['sh', '-c', config.compileCommand],
      WorkingDir: '/app',
      HostConfig: {
        AutoRemove: true,
        Memory: constraints.memoryLimit * 1024 * 1024, // Convert MB to bytes
        CpuQuota: 50000, // Limit CPU usage
        NetworkMode: 'none', // No network access
        Binds: [`${workDir}:/app`]
      }
    });
    
    await container.start();
    
    // Wait for compilation with timeout
    const result = await container.wait();
    
    if (result.StatusCode !== 0) {
      // Get compilation error
      const logs = await container.logs({
        stdout: true,
        stderr: true
      });
      
      return {
        success: false,
        error: logs.toString()
      };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Compilation error:', error);
    return {
      success: false,
      error: 'Compilation failed due to internal error'
    };
  }
};

// Run code against a single test case
const runTestCase = async (workDir, config, input, expectedOutput, constraints, testCaseIndex) => {
  try {
    // Write input to file
    const inputFile = path.join(workDir, `input_${testCaseIndex}.txt`);
    await fs.writeFile(inputFile, input);
    
    const startTime = Date.now();
    
    // Create and run container
    const container = await docker.createContainer({
      Image: config.image,
      Cmd: ['sh', '-c', `${config.runCommand} < input_${testCaseIndex}.txt`],
      WorkingDir: '/app',
      HostConfig: {
        AutoRemove: true,
        Memory: constraints.memoryLimit * 1024 * 1024, // Convert MB to bytes
        CpuQuota: 50000, // Limit CPU usage
        NetworkMode: 'none', // No network access
        Binds: [`${workDir}:/app`]
      }
    });
    
    await container.start();
    
    // Wait for execution with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIME_LIMIT_EXCEEDED')), constraints.timeLimit);
    });
    
    const executionPromise = container.wait();
    
    let result;
    try {
      result = await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      // Kill container if timeout
      try {
        await container.kill();
      } catch (killError) {
        console.error('Error killing container:', killError);
      }
      
      return {
        passed: false,
        status: 'time_limit_exceeded',
        actualOutput: '',
        executionTime: constraints.timeLimit,
        memoryUsed: 0,
        errorMessage: 'Time limit exceeded'
      };
    }
    
    const executionTime = Date.now() - startTime;
    
    // Get container stats for memory usage
    let memoryUsed = 0;
    try {
      const stats = await container.stats({ stream: false });
      memoryUsed = stats.memory_stats.usage || 0;
    } catch (statsError) {
      console.error('Error getting container stats:', statsError);
    }
    
    // Check if execution was successful
    if (result.StatusCode !== 0) {
      // Get error logs
      const logs = await container.logs({
        stdout: true,
        stderr: true
      });
      
      return {
        passed: false,
        status: 'runtime_error',
        actualOutput: '',
        executionTime,
        memoryUsed,
        errorMessage: logs.toString().substring(0, 1000) // Limit error message length
      };
    }
    
    // Get output
    const logs = await container.logs({
      stdout: true,
      stderr: false
    });
    
    const actualOutput = logs.toString().trim();
    const expectedOutputTrimmed = expectedOutput.trim();
    
    // Compare outputs
    const passed = actualOutput === expectedOutputTrimmed;
    
    return {
      passed,
      status: passed ? 'accepted' : 'wrong_answer',
      actualOutput,
      executionTime,
      memoryUsed,
      errorMessage: passed ? null : 'Output does not match expected result'
    };
    
  } catch (error) {
    console.error('Test case execution error:', error);
    
    if (error.message === 'TIME_LIMIT_EXCEEDED') {
      return {
        passed: false,
        status: 'time_limit_exceeded',
        actualOutput: '',
        executionTime: constraints.timeLimit,
        memoryUsed: 0,
        errorMessage: 'Time limit exceeded'
      };
    }
    
    return {
      passed: false,
      status: 'runtime_error',
      actualOutput: '',
      executionTime: 0,
      memoryUsed: 0,
      errorMessage: 'Internal execution error'
    };
  }
};

// Determine the final verdict based on test case results
const determineVerdict = (passedTestCases, totalTestCases, testCaseResults, totalTime, maxMemory, constraints) => {
  // Check for compilation errors (handled earlier)
  if (testCaseResults.length === 0) {
    return {
      status: 'runtime_error',
      verdict: 'Runtime Error'
    };
  }
  
  // Check for time limit exceeded
  const hasTimeLimit = testCaseResults.some(result => 
    result.executionTime > constraints.timeLimit || 
    result.errorMessage === 'Time limit exceeded'
  );
  
  if (hasTimeLimit) {
    return {
      status: 'time_limit_exceeded',
      verdict: 'Time Limit Exceeded'
    };
  }
  
  // Check for memory limit exceeded
  const hasMemoryLimit = testCaseResults.some(result => 
    result.memoryUsed > constraints.memoryLimit * 1024 * 1024
  );
  
  if (hasMemoryLimit) {
    return {
      status: 'memory_limit_exceeded',
      verdict: 'Memory Limit Exceeded'
    };
  }
  
  // Check for runtime errors
  const hasRuntimeError = testCaseResults.some(result => 
    result.errorMessage && result.errorMessage !== 'Output does not match expected result'
  );
  
  if (hasRuntimeError) {
    return {
      status: 'runtime_error',
      verdict: 'Runtime Error'
    };
  }
  
  // Check if all test cases passed
  if (passedTestCases === totalTestCases) {
    return {
      status: 'accepted',
      verdict: 'Accepted'
    };
  }
  
  // Otherwise, it's a wrong answer
  return {
    status: 'wrong_answer',
    verdict: 'Wrong Answer'
  };
};

// Utility function to check if Docker image exists and pull if needed
const ensureDockerImage = async (imageName) => {
  try {
    // Check if image exists locally
    const images = await docker.listImages();
    const imageExists = images.some(image => 
      image.RepoTags && image.RepoTags.includes(imageName)
    );
    
    if (!imageExists) {
      console.log(`Pulling Docker image: ${imageName}`);
      
      // Pull the image
      const stream = await docker.pull(imageName);
      
      // Wait for pull to complete
      await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
      
      console.log(`Successfully pulled image: ${imageName}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring Docker image ${imageName}:`, error);
    return false;
  }
};

// Initialize judge service by ensuring all required Docker images are available
const initializeJudgeService = async () => {
  try {
    console.log('Initializing Judge Service...');
    
    // Ensure all language images are available
    const imagePromises = Object.values(LANGUAGE_CONFIGS).map(config => 
      ensureDockerImage(config.image)
    );
    
    const results = await Promise.all(imagePromises);
    
    const allImagesReady = results.every(result => result === true);
    
    if (allImagesReady) {
      console.log('Judge Service initialized successfully - all Docker images ready');
      return true;
    } else {
      console.error('Failed to initialize some Docker images');
      return false;
    }
    
  } catch (error) {
    console.error('Error initializing Judge Service:', error);
    return false;
  }
};

// Health check function to verify judge service is working
const healthCheck = async () => {
  try {
    // Test with a simple Hello World program in each language
    const testCases = [{
      input: '',
      output: 'Hello World',
      _id: 'test'
    }];
    
    const testPrograms = {
      cpp: '#include <iostream>\nusing namespace std;\nint main() { cout << "Hello World"; return 0; }',
      java: 'public class Solution { public static void main(String[] args) { System.out.print("Hello World"); } }',
      python: 'print("Hello World", end="")',
      javascript: 'process.stdout.write("Hello World");'
    };
    
    const constraints = {
      timeLimit: 5000,
      memoryLimit: 128
    };
    
    const results = {};
    
    for (const [language, code] of Object.entries(testPrograms)) {
      try {
        const result = await executeCode({
          code,
          language,
          testCases,
          constraints
        });
        
        results[language] = {
          status: result.status,
          working: result.status === 'accepted'
        };
      } catch (error) {
        results[language] = {
          status: 'error',
          working: false,
          error: error.message
        };
      }
    }
    
    return results;
  } catch (error) {
    console.error('Health check error:', error);
    return {
      error: 'Health check failed',
      details: error.message
    };
  }
};

// Clean up old containers and images (maintenance function)
const cleanup = async () => {
  try {
    console.log('Starting judge service cleanup...');
    
    // Remove stopped containers
    const containers = await docker.listContainers({ all: true });
    const stoppedContainers = containers.filter(container => 
      container.State === 'exited' && 
      container.Names.some(name => name.includes('judge_'))
    );
    
    for (const containerInfo of stoppedContainers) {
      try {
        const container = docker.getContainer(containerInfo.Id);
        await container.remove();
        console.log(`Removed stopped container: ${containerInfo.Id}`);
      } catch (error) {
        console.error(`Error removing container ${containerInfo.Id}:`, error);
      }
    }
    
    // Remove dangling images
    const images = await docker.listImages({ filters: { dangling: ['true'] } });
    for (const imageInfo of images) {
      try {
        const image = docker.getImage(imageInfo.Id);
        await image.remove();
        console.log(`Removed dangling image: ${imageInfo.Id}`);
      } catch (error) {
        console.error(`Error removing image ${imageInfo.Id}:`, error);
      }
    }
    
    console.log('Judge service cleanup completed');
    return true;
  } catch (error) {
    console.error('Cleanup error:', error);
    return false;
  }
};

// Get judge service statistics
const getJudgeStats = async () => {
  try {
    const containers = await docker.listContainers({ all: true });
    const images = await docker.listImages();
    
    // Count containers by state
    const containerStats = containers.reduce((acc, container) => {
      acc[container.State] = (acc[container.State] || 0) + 1;
      return acc;
    }, {});
    
    // Get system info
    const systemInfo = await docker.info();
    
    return {
      containers: {
        total: containers.length,
        byState: containerStats
      },
      images: {
        total: images.length
      },
      system: {
        version: systemInfo.ServerVersion,
        containers: systemInfo.Containers,
        images: systemInfo.Images,
        memoryLimit: systemInfo.MemTotal,
        cpus: systemInfo.NCPU
      },
      supportedLanguages: Object.keys(LANGUAGE_CONFIGS)
    };
  } catch (error) {
    console.error('Error getting judge stats:', error);
    return {
      error: 'Failed to get judge statistics',
      details: error.message
    };
  }
};

module.exports = {
  executeCode,
  initializeJudgeService,
  healthCheck,
  cleanup,
  getJudgeStats,
  LANGUAGE_CONFIGS
};