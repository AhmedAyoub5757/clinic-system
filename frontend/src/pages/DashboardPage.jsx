import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <p className="text-gray-600 mt-1">
        Role: <span className="font-medium">{user.role}</span> · {user.email}
      </p>
      <button onClick={logout} className="mt-6 bg-gray-800 text-white rounded px-4 py-2">
        Log out
      </button>
    </div>
  );
}