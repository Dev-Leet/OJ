const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Get the Gemini model for code analysis
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Analyze code and provide complexity analysis and suggestions
const analyzeCode = async (code, language) => {
  try {
    // Create a comprehensive prompt for code analysis
    const prompt = `
    Analyze the following ${language.toUpperCase()} code and provide:

    1. Time Complexity (Big O notation)
    2. Space Complexity (Big O notation)
    3. Code Quality Assessment (scale 1-10 with brief explanation)
    4. Up to 3 specific suggestions for improvement
    5. Brief explanation of the algorithm approach

    Code to analyze:
    \`\`\`${language}
    ${code}
    \`\`\`

    Please provide your response in the following JSON format:
    {
      "timeComplexity": "O(...)",
      "spaceComplexity": "O(...)",
      "codeQuality": "X/10 - Brief explanation",
      "algorithmApproach": "Brief description of the approach used",
      "suggestions": [
        "Suggestion 1",
        "Suggestion 2",
        "Suggestion 3"
      ]
    }

    Focus on:
    - Accuracy of complexity analysis
    - Practical improvement suggestions
    - Code readability and efficiency
    - Best practices for the specific language
    `;

    // Generate analysis using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    // Try to parse JSON response
    let analysis;
    try {
      // Extract JSON from the response (sometimes it's wrapped in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON, using fallback parsing');
      analysis = parseAnalysisText(analysisText);
    }

    // Validate and clean the analysis
    const cleanedAnalysis = {
      timeComplexity: analysis.timeComplexity || 'O(n) - Unable to determine',
      spaceComplexity: analysis.spaceComplexity || 'O(1) - Unable to determine',
      codeQuality: analysis.codeQuality || '7/10 - Code appears functional',
      algorithmApproach: analysis.algorithmApproach || 'Standard approach used',
      suggestions: Array.isArray(analysis.suggestions) 
        ? analysis.suggestions.slice(0, 3) 
        : ['Consider adding comments for better readability']
    };

    return cleanedAnalysis;

  } catch (error) {
    console.error('AI analysis error:', error);
    
    // Return fallback analysis if AI service fails
    return getFallbackAnalysis(code, language);
  }
};

// Fallback analysis when AI service is unavailable
const getFallbackAnalysis = (code, language) => {
  const codeLength = code.length;
  const lines = code.split('\n').length;
  
  // Basic heuristic analysis
  let timeComplexity = 'O(n)';
  let spaceComplexity = 'O(1)';
  let quality = '6/10';
  
  // Simple pattern detection for complexity
  if (code.includes('for') && code.includes('for')) {
    timeComplexity = 'O(n²)';
  } else if (code.includes('while') || code.includes('for')) {
    timeComplexity = 'O(n)';
  } else {
    timeComplexity = 'O(1)';
  }
  
  // Check for additional space usage
  if (code.includes('vector') || code.includes('array') || code.includes('list')) {
    spaceComplexity = 'O(n)';
  }
  
  // Basic quality assessment
  if (codeLength < 50) {
    quality = '5/10 - Very short solution, might be incomplete';
  } else if (codeLength > 500) {
    quality = '7/10 - Comprehensive solution';
  } else {
    quality = '6/10 - Standard solution length';
  }

  const suggestions = [
    'Add comments to explain complex logic',
    'Consider edge cases and input validation',
    'Optimize for better time or space complexity if possible'
  ];

  return {
    timeComplexity,
    spaceComplexity,
    codeQuality: quality,
    algorithmApproach: 'Standard implementation approach',
    suggestions
  };
};

// Parse analysis text when JSON parsing fails
const parseAnalysisText = (text) => {
  const analysis = {};
  
  // Extract time complexity
  const timeMatch = text.match(/time complexity[:\s]*([O\(][^,\n]*)/i);
  analysis.timeComplexity = timeMatch ? timeMatch[1].trim() : 'O(n)';
  
  // Extract space complexity
  const spaceMatch = text.match(/space complexity[:\s]*([O\(][^,\n]*)/i);
  analysis.spaceComplexity = spaceMatch ? spaceMatch[1].trim() : 'O(1)';
  
  // Extract code quality
  const qualityMatch = text.match(/code quality[:\s]*([^,\n]*)/i);
  analysis.codeQuality = qualityMatch ? qualityMatch[1].trim() : '7/10 - Good implementation';
  
  // Extract algorithm approach
  const approachMatch = text.match(/algorithm approach[:\s]*([^,\n]*)/i);
  analysis.algorithmApproach = approachMatch ? approachMatch[1].trim() : 'Standard approach';
  
  // Extract suggestions (look for numbered or bulleted lists)
  const suggestions = [];
  const suggestionMatches = text.match(/(?:^|\n)\s*(?:\d+\.|\-|\*)\s*([^\n]+)/gm);
  if (suggestionMatches) {
    suggestions.push(...suggestionMatches.slice(0, 3).map(match => 
      match.replace(/(?:^|\n)\s*(?:\d+\.|\-|\*)\s*/, '').trim()
    ));
  }
  
  analysis.suggestions = suggestions.length ? suggestions : [
    'Consider optimizing the algorithm',
    'Add error handling',
    'Improve code documentation'
  ];
  
  return analysis;
};

// Generate hints for a problem (for struggling users)
const generateHint = async (problemDescription, userCode, language) => {
  try {
    const prompt = `
    A user is trying to solve this problem:
    ${problemDescription}

    Their current attempt in ${language.toUpperCase()}:
    \`\`\`${language}
    ${userCode}
    \`\`\`

    Provide a helpful hint without giving away the complete solution. The hint should:
    1. Point out what they're doing right
    2. Suggest the next step or approach to consider
    3. Not provide the actual code solution
    4. Be encouraging and educational

    Respond with a JSON object:
    {
      "hint": "Your helpful hint here",
      "approach": "Suggested approach or algorithm",
      "encouragement": "Encouraging message"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const hintText = response.text();

    // Try to parse JSON response
    let hintData;
    try {
      const jsonMatch = hintText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        hintData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      hintData = {
        hint: "Try breaking down the problem into smaller steps. Consider what data structures might be most appropriate for this problem.",
        approach: "Step-by-step problem decomposition",
        encouragement: "You're on the right track! Keep working through the logic."
      };
    }

    return hintData;

  } catch (error) {
    console.error('Hint generation error:', error);
    
    return {
      hint: "Consider reviewing the problem constraints and think about what algorithm or data structure would be most efficient.",
      approach: "Systematic problem-solving approach",
      encouragement: "Every expert was once a beginner. Keep practicing!"
    };
  }
};

// Explain a solution (for educational purposes after solving)
const explainSolution = async (problemDescription, solutionCode, language) => {
  try {
    const prompt = `
    Explain this ${language.toUpperCase()} solution for the following problem:

    Problem:
    ${problemDescription}

    Solution:
    \`\`\`${language}
    ${solutionCode}
    \`\`\`

    Provide a clear explanation that covers:
    1. The overall approach and algorithm used
    2. Step-by-step breakdown of how the code works
    3. Why this approach is effective
    4. Time and space complexity
    5. Any clever techniques or optimizations used

    Make it educational and easy to understand.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    return {
      explanation: explanation.trim(),
      generated: true
    };

  } catch (error) {
    console.error('Solution explanation error:', error);
    
    return {
      explanation: "This solution implements a standard approach to solve the problem. The code uses appropriate data structures and algorithms to handle the given constraints efficiently.",
      generated: false
    };
  }
};

// Check if AI service is available
const healthCheck = async () => {
  try {
    const testPrompt = "Respond with exactly: 'AI service is working'";
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      available: true,
      response: text.trim(),
      working: text.includes('AI service is working')
    };
  } catch (error) {
    console.error('AI service health check failed:', error);
    
    return {
      available: false,
      error: error.message,
      working: false
    };
  }
};

// Get usage statistics (if available from the AI service)
const getUsageStats = async () => {
  try {
    // Note: This is a placeholder as Google AI doesn't provide usage stats directly
    // In a production environment, you might track usage in your own database
    
    return {
      totalAnalyses: 'Tracking not implemented',
      hintsGenerated: 'Tracking not implemented',
      solutionsExplained: 'Tracking not implemented',
      note: 'Usage tracking can be implemented by storing metrics in database'
    };
  } catch (error) {
    console.error('Error getting AI usage stats:', error);
    
    return {
      error: 'Unable to retrieve usage statistics',
      details: error.message
    };
  }
};

module.exports = {
  analyzeCode,
  generateHint,
  explainSolution,
  healthCheck,
  getUsageStats
};