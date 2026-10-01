export default function FlashMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4 flex justify-between">
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}