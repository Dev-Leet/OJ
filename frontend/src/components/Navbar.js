import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">
          OnlineJudge
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/problems" className="text-gray-600 hover:text-primary">
            Problems
          </Link>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-primary"
              >
                Dashboard
              </Link>
              <Link to="/profile" className="text-gray-600 hover:text-primary">
                Profile
              </Link>
              {user.isAdmin && (
                <Link to="/admin" className="text-gray-600 hover:text-primary">
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-primary">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;