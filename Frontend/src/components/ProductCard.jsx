function ProductCard({ product }) {
  const formatDate = (value) => {
    if (!value) {
      return 'Not available';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Not available';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <article className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
            {product?.name || 'Product name'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">Product details at a glance</p>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              Category
            </span>
            <span className="mt-1 block font-medium text-slate-800">
              {product?.category || 'Not available'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              Price
            </span>
            <span className="mt-1 block font-medium text-slate-800">
              {product?.price != null ? `$${product.price}` : 'Not available'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
            <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              Updated Date
            </span>
            <span className="mt-1 block font-medium text-slate-800">
              {formatDate(product?.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;