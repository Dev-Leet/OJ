import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ProblemDetail = () => {
    const { id } = useParams();
    const [problem, setProblem] = useState(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [submissionResult, setSubmissionResult] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const { data } = await api.get(`/problems/${id}`);
                setProblem(data);
            } catch (error) {
                console.error('Error fetching problem', error);
            }
        };
        fetchProblem();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmissionResult({ verdict: 'Submitting...' });
        try {
            const { data } = await api.post('/submissions', {
                problemId: id,
                code,
                language,
            });
            // The initial response just confirms submission. The verdict will update.
            // For a real-time experience, you'd use WebSockets to get updates.
            // For now, we'll just show the initial status.
            setSubmissionResult({ verdict: `Submitted! Initial status: ${data.verdict}`});
        } catch (error) {
            setSubmissionResult({ verdict: 'Error', output: 'Error submitting code.' });
            console.error('Error submitting code', error);
        }
    };

    if (!problem) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">{problem.title}</h1>
            <p className="mb-4">{problem.description}</p>
            
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="language" className="block mb-2">Language:</label>
                    <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-2 border rounded">
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                    </select>
                </div>
                <div className="mb-4">
                    <label htmlFor="code" className="block mb-2">Your Code:</label>
                    <textarea id="code" value={code} onChange={(e) => setCode(e.target.value)} rows="20" className="w-full p-2 border rounded font-mono bg-gray-900 text-white"></textarea>
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Submit</button>
            </form>

            {submissionResult && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <h3 className="font-bold">Result:</h3>
                    <p>Verdict: {submissionResult.verdict}</p>
                    {submissionResult.output && <pre className="bg-gray-200 p-2 mt-2 rounded">{submissionResult.output}</pre>}
                </div>
            )}
        </div>
    );
};

export default ProblemDetail;
