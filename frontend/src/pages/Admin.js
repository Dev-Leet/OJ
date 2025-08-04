import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Admin = () => {
    const [problems, setProblems] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '', difficulty: 'Easy', testCases: [{ input: '', output: '' }] });

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        const { data } = await api.get('/problems');
        setProblems(data);
    };

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleTestCaseChange = (index, e) => {
        const newTestCases = formData.testCases.map((tc, i) => i === index ? { ...tc, [e.target.name]: e.target.value } : tc);
        setFormData({ ...formData, testCases: newTestCases });
    };

    const addTestCase = () => {
        setFormData({ ...formData, testCases: [...formData.testCases, { input: '', output: '' }] });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await api.post('/problems', formData);
            fetchProblems();
            setFormData({ title: '', description: '', difficulty: 'Easy', testCases: [{ input: '', output: '' }] });
        } catch (error) {
            console.error('Error creating problem', error);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Admin Panel - Manage Problems</h1>
            
            <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-gray-50">
                <h2 className="text-xl font-semibold mb-2">Create New Problem</h2>
                <input name="title" value={formData.title} onChange={handleChange} placeholder="Title" className="w-full p-2 mb-2 border rounded" required />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="w-full p-2 mb-2 border rounded" required />
                <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full p-2 mb-2 border rounded">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                </select>

                <h3 className="font-semibold mt-4 mb-2">Test Cases</h3>
                {formData.testCases.map((tc, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <textarea name="input" value={tc.input} onChange={e => handleTestCaseChange(index, e)} placeholder={`Input ${index + 1}`} className="w-1/2 p-2 border rounded" />
                        <textarea name="output" value={tc.output} onChange={e => handleTestCaseChange(index, e)} placeholder={`Output ${index + 1}`} className="w-1/2 p-2 border rounded" />
                    </div>
                ))}
                <button type="button" onClick={addTestCase} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">Add Test Case</button>
                
                <button type="submit" className="mt-4 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Create Problem</button>
            </form>

            <div>
                <h2 className="text-xl font-semibold mb-2">Existing Problems</h2>
                {/* List of problems could be displayed here for editing/deleting */}
            </div>
        </div>
    );
};

export default Admin;
