import { useEffect, useState } from 'react';
import CategoryFilter from '../components/CategoryFilter';
import LoadMoreButton from '../components/LoadMoreButton';
import ProductGrid from '../components/ProductGrid';
import { getProducts } from '../services/productService';

const defaultCategories = ['All', 'Electronics', 'Clothing', 'Books', 'Sports', 'Home'];

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [nextCursor, setNextCursor] = useState('');
  const [snapshotTime, setSnapshotTime] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadProducts = async () => {
      setLoading(true);
      setError('');
      setProducts([]);
      setNextCursor('');
      setSnapshotTime('');

      try {
        const response = await getProducts({ category });

        if (!isActive) {
          return;
        }

        setProducts(Array.isArray(response?.products) ? response.products : []);
        setNextCursor(response?.nextCursor || '');
        setSnapshotTime(response?.snapshotTime || '');
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        setError(requestError.message || 'Unable to load products.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isActive = false;
    };
  }, [category]);

  const handleCategoryChange = (selectedValue) => {
    setCategory(selectedValue);
  };

  const handleLoadMore = async () => {
    if (!nextCursor || loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await getProducts({
        category,
        cursor: nextCursor,
        snapshotTime
      });

      setProducts((currentProducts) => [
        ...currentProducts,
        ...(Array.isArray(response?.products) ? response.products : [])
      ]);
      setNextCursor(response?.nextCursor || '');
      setSnapshotTime(response?.snapshotTime || snapshotTime);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load more products.');
    } finally {
      setLoading(false);
    }
  };

  const hasProducts = products.length > 0;
  const isLoadingInitialPage = loading && !hasProducts;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-8 text-white sm:px-8 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              CodeVector Catalog
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Browse products with fast filtering and paginated loading
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              Select a category to refresh the list from the API, then load more results without
              losing what is already on screen.
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <CategoryFilter
              categories={defaultCategories}
              selectedCategory={category}
              onChange={handleCategoryChange}
            />

            <div className="text-sm text-slate-500 lg:text-right">
              <p>
                Showing <span className="font-semibold text-slate-900">{products.length}</span>{' '}
                product{products.length === 1 ? '' : 's'}
              </p>
              <p className="mt-1">
                {snapshotTime
                  ? `Snapshot locked at ${snapshotTime}`
                  : 'Snapshot will appear after the first request.'}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {isLoadingInitialPage ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
                  />
                ))}
              </div>
            ) : (
              <ProductGrid products={products} />
            )}

            {!isLoadingInitialPage && !hasProducts && !error ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
                No products available for this category.
              </div>
            ) : null}

            <div className="flex justify-center pt-2">
              <LoadMoreButton nextCursor={nextCursor} loading={loading} onClick={handleLoadMore} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Home;