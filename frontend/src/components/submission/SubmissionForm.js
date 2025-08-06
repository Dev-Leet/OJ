// frontend/src/components/submission/SubmissionForm.js
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import submissionService from '../../services/submissionService';

const SubmissionForm = ({ problemId }) => {
  // State for code, language, submission result, AI analysis, and loading statuses
  const [code, setCode] = useState('// Write your code here');
  const [language, setLanguage] = useState('cpp');
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle changes in the code editor
  const handleEditorChange = (value) => {
    setCode(value);
  };

  // Handle form submission for evaluation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setAnalysis('');
    try {
      const data = await submissionService.createSubmission({ problemId, language, code });
      setResult(data);
    } catch (error) {
      console.error('Submission error:', error);
      setResult({ status: 'Error', resultDetails: { error: 'Failed to submit. Please try again.' } });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle request for AI code analysis
  const handleAnalyze = async () => {
      setIsAnalyzing(true);
      setAnalysis('');
      setResult(null);
      try {
          const data = await submissionService.analyzeCode({ language, code });
          setAnalysis(data.analysis);
      } catch (error) {
          console.error('Analysis error:', error);
          setAnalysis('Failed to analyze code. Please try again.');
      } finally {
          setIsAnalyzing(false);
      }
  };

  // Helper to style the submission status badge
  const getStatusClass = (status) => {
    switch (status) {
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Wrong Answer': return 'bg-red-100 text-red-800';
      case 'Runtime Error': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
          Language
        </label>
        <select
          id="language"
          name="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>
      </div>

      <div className="w-full h-96">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            selectOnLineNumbers: true,
            fontSize: 14,
          }}
        />
      </div>

      <div className="p-4 bg-gray-50 flex items-center justify-end space-x-4">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isAnalyzing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      {/* Display Submission Result or AI Analysis */}
      {(result || analysis) && (
        <div className="p-4 border-t">
          <h3 className="text-lg font-semibold mb-2">
            {result ? 'Submission Result' : 'AI Code Analysis'}
          </h3>
          {result && (
              <div className="p-4 rounded-md bg-gray-50">
                  <p>Status: <span className={`font-bold px-2 py-1 rounded-full text-sm ${getStatusClass(result.status)}`}>{result.status}</span></p>
                  {result.status !== 'Accepted' && result.resultDetails?.error && <pre className="mt-2 bg-red-50 p-2 rounded text-red-700 text-sm">Error: {result.resultDetails.error}</pre>}
                  {result.status === 'Wrong Answer' && (
                      <div className="mt-2 text-sm">
                          <p><strong>Input:</strong> {result.resultDetails.testCase.input}</p>
                          <p><strong>Expected:</strong> {result.resultDetails.testCase.expectedOutput}</p>
                          <p><strong>Your Output:</strong> {result.resultDetails.actualOutput}</p>
                      </div>
                  )}
              </div>
          )}
          {analysis && (
              <div className="p-4 rounded-md bg-blue-50 prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">{analysis}</pre>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubmissionForm;
