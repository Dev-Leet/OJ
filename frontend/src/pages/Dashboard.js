import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const { data } = await api.get('/submissions');
                setSubmissions(data);
            } catch (error) {
                console.error('Error fetching submissions', error);
            }
        };
        fetchSubmissions();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">My Submissions</h1>
            <div className="bg-white shadow-md rounded my-6">
                <table className="min-w-max w-full table-auto">
                    <thead>
                        <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">Problem</th>
                            <th className="py-3 px-6 text-left">Verdict</th>
                            <th className="py-3 px-6 text-center">Submitted At</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                        {submissions.map(sub => (
                            <tr key={sub._id} className="border-b border-gray-200 hover:bg-gray-100">
                                <td className="py-3 px-6 text-left whitespace-nowrap">{sub.problemId.title}</td>
                                <td className="py-3 px-6 text-left">
                                    <span className={`py-1 px-3 rounded-full text-xs ${
                                        sub.verdict === 'Accepted' ? 'bg-green-200 text-green-600' :
                                        sub.verdict === 'Pending' ? 'bg-yellow-200 text-yellow-600' :
                                        'bg-red-200 text-red-600'
                                    }`}>
                                        {sub.verdict}
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center">{new Date(sub.submittedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;