import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-gray-600 mt-2">That address doesn't exist.</p>
      <Link to="/" className="text-blue-600 mt-4 inline-block">Back to the dashboard</Link>
    </div>
  );
}