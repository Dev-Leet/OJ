import useAuth from "../hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      <p>
        <strong>Username:</strong> {user?.username}
      </p>
      <p>
        <strong>Email:</strong> {user?.email}
      </p>
    </div>
  );
};

export default Profile;