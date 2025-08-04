import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to the Online Judge</h1>
            <p className="text-lg mb-8">Hone your coding skills by solving a variety of problems.</p>
            <Link to="/problems" className="bg-blue-600 text-white px-6 py-3 rounded-lg text-xl hover:bg-blue-700">
                Browse Problems
            </Link>
        </div>
    );
};

export default Home;
