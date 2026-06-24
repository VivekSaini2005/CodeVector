function LoadMoreButton({ nextCursor = '', loading = false, onClick }) {
  if (!nextCursor) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {loading ? 'Loading...' : 'Load More'}
    </button>
  );
}

export default LoadMoreButton;