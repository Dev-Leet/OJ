import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-xl mt-4 mb-8">Page Not Found</p>
      <Link
        to="/"
        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;