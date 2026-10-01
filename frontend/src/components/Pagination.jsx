export default function Pagination({ meta, loading, onPage, noun = "items" }) {
  if (!meta || meta.total === 0) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>Page {meta.current_page} of {meta.last_page} · {meta.total} {noun}</span>
      <div className="space-x-2">
        <button
          disabled={meta.current_page <= 1 || loading}
          onClick={() => onPage(meta.current_page - 1)}
          className="border rounded px-3 py-1 bg-white disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={meta.current_page >= meta.last_page || loading}
          onClick={() => onPage(meta.current_page + 1)}
          className="border rounded px-3 py-1 bg-white disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}