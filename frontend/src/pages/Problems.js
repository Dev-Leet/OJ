import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Problems = () => {
    const [problems, setProblems] = useState([]);

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const { data } = await api.get('/problems');
                setProblems(data);
            } catch (error) {
                console.error('Error fetching problems', error);
            }
        };
        fetchProblems();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Problem Set</h1>
            <div className="space-y-4">
                {problems.map(problem => (
                    <div key={problem._id} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">
                                <Link to={`/problem/${problem._id}`} className="text-blue-600 hover:underline">
                                    {problem.title}
                                </Link>
                            </h2>
                            <p className="text-gray-600">{problem.difficulty}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Problems;