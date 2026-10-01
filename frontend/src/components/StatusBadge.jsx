const STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-600",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STYLES[status] ?? ""}`}>
      {status}
    </span>
  );
}