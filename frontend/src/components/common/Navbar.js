import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-gray-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold">OnlineJudge</Link>
                <div>
                    <Link to="/problems" className="px-3 hover:text-gray-300">Problems</Link>
                    {user ? (
                        <>
                            <Link to="/dashboard" className="px-3 hover:text-gray-300">Dashboard</Link>
                            {user.isAdmin && <Link to="/admin" className="px-3 hover:text-gray-300">Admin</Link>}
                            <button onClick={handleLogout} className="px-3 hover:text-gray-300">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="px-3 hover:text-gray-300">Login</Link>
                            <Link to="/register" className="px-3 hover:text-gray-300">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
