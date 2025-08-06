// frontend/src/components/admin/ProblemEditor.js
import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import problemService from '../../services/problemService';

const ProblemEditor = () => {
  const { id: problemId } = useParams(); // Get problem ID from URL for editing
  const history = useHistory();
  const isEditMode = Boolean(problemId);

  // State for form data, loading, and errors
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    tags: '',
    constraints: '',
    testCases: [{ input: '', output: '' }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch problem data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchProblem = async () => {
        setLoading(true);
        try {
          const problem = await problemService.getProblemById(problemId);
          // Format tags array back into a comma-separated string for the input field
          setFormData({ ...problem, tags: problem.tags.join(', ') });
        } catch (err) {
          setError('Failed to load problem data.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchProblem();
    }
  }, [problemId, isEditMode]);

  // --- Handlers ---

  // Handle changes for simple input fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle changes within a specific test case
  const handleTestCaseChange = (index, e) => {
    const updatedTestCases = formData.testCases.map((tc, i) =>
      i === index ? { ...tc, [e.target.name]: e.target.value } : tc
    );
    setFormData({ ...formData, testCases: updatedTestCases });
  };

  // Add a new, empty test case field
  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', output: '' }],
    });
  };

  // Remove a test case by its index
  const removeTestCase = (index) => {
    const filteredTestCases = formData.testCases.filter((_, i) => i !== index);
    setFormData({ ...formData, testCases: filteredTestCases });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prepare payload, converting tags string to an array
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    try {
      if (isEditMode) {
        await problemService.updateProblem(problemId, payload);
      } else {
        await problemService.createProblem(payload);
      }
      history.push('/admin'); // Redirect to admin dashboard on success
    } catch (err) {
      setError('Failed to save the problem. Please check your input.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        {isEditMode ? 'Edit Problem' : 'Create New Problem'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
        {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}

        {/* --- Main Problem Fields --- */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" id="description" rows="4" value={formData.description} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
        </div>
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">Difficulty</label>
          <select name="difficulty" id="difficulty" value={formData.difficulty} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
          <input type="text" name="tags" id="tags" value={formData.tags} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
          <label htmlFor="constraints" className="block text-sm font-medium text-gray-700">Constraints</label>
          <textarea name="constraints" id="constraints" rows="3" value={formData.constraints} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
        </div>

        {/* --- Test Cases Section --- */}
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
          {formData.testCases.map((tc, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 p-4 border rounded-md">
              <div className="md:col-span-5">
                <label className="block text-sm font-medium text-gray-700">Input</label>
                <textarea name="input" rows="3" value={tc.input} onChange={(e) => handleTestCaseChange(index, e)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
              </div>
              <div className="md:col-span-5">
                <label className="block text-sm font-medium text-gray-700">Output</label>
                <textarea name="output" rows="3" value={tc.output} onChange={(e) => handleTestCaseChange(index, e)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
              </div>
              <div className="md:col-span-2 flex items-center justify-center">
                <button type="button" onClick={() => removeTestCase(index)} className="text-red-600 hover:text-red-800 font-medium">Remove</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addTestCase} className="mt-2 px-4 py-2 border border-dashed text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
            Add Test Case
          </button>
        </div>

        {/* --- Submission Button --- */}
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Problem'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProblemEditor;
