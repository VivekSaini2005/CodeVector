function PaginationControls({ currentPage, totalPages, onPageChange, loading = false }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const items = [];

  const pushPage = (pageNumber) => {
    if (!items.includes(pageNumber)) {
      items.push(pageNumber);
    }
  };

  pushPage(1);

  if (totalPages <= 7) {
    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
      pushPage(pageNumber);
    }
  } else if (currentPage <= 3) {
    pushPage(2);
    pushPage(3);
    items.push('ellipsis-right');
    pushPage(totalPages);
  } else if (currentPage >= totalPages - 2) {
    items.push('ellipsis-left');
    pushPage(totalPages - 2);
    pushPage(totalPages - 1);
    pushPage(totalPages);
  } else {
    items.push('ellipsis-left');
    pushPage(currentPage - 1);
    pushPage(currentPage);
    pushPage(currentPage + 1);
    items.push('ellipsis-right');
    pushPage(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={loading || currentPage === 1}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      {items.map((item) =>
        item === 'ellipsis-left' || item === 'ellipsis-right' ? (
          <span key={item} className="px-2 text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            disabled={loading}
            className={`min-w-10 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              item === currentPage
                ? 'bg-violet-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={loading || currentPage === totalPages}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export default PaginationControls;