import { useEffect, useMemo, useState } from 'react';
import CategoryFilter from '../components/CategoryFilter';
import PaginationControls from '../components/PaginationControls';
import ProductGrid from '../components/ProductGrid';
import { getProducts } from '../services/productService';

const defaultCategories = ['All', 'Electronics', 'Clothing', 'Books', 'Sports', 'Home'];
const PAGE_LIMIT = 20;
const limitOptions = [10, 20, 30, 50];

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(PAGE_LIMIT);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [snapshotTime, setSnapshotTime] = useState('');
  const [pageCursors, setPageCursors] = useState({ 1: '' });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / limit)), [totalCount, limit]);

  useEffect(() => {
    let isActive = true;

    const loadFirstPage = async () => {
      setLoading(true);
      setError('');
      setProducts([]);
      setCurrentPage(1);
      setTotalCount(0);
      setSnapshotTime('');
      setPageCursors({ 1: '' });

      try {
        const response = await getProducts({ category, limit });

        if (!isActive) {
          return;
        }

        const nextCursor = response?.pagination?.nextCursor ?? response?.nextCursor ?? '';
        const hasNextPage = Boolean(response?.pagination?.hasNextPage ?? nextCursor);
        const responseTotalCount = Number(response?.totalCount ?? 0);

        setProducts(Array.isArray(response?.products) ? response.products : []);
        setTotalCount(responseTotalCount || 0);
        setSnapshotTime(response?.snapshotTime || '');
        setPageCursors({
          1: '',
          ...(hasNextPage ? { 2: nextCursor } : {}),
        });
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

    loadFirstPage();

    return () => {
      isActive = false;
    };
  }, [category, limit]);

  const handleCategoryChange = (selectedValue) => {
    setCategory(selectedValue);
  };

  const handleLimitChange = (event) => {
    setLimit(Number(event.target.value));
  };

  const goToPage = async (targetPage) => {
    if (loading || targetPage < 1 || targetPage > totalPages || targetPage === currentPage) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (targetPage === 1) {
        setCurrentPage(1);
        const response = await getProducts({ category, limit });
        const nextCursor = response?.pagination?.nextCursor ?? response?.nextCursor ?? '';
        const hasNextPage = Boolean(response?.pagination?.hasNextPage ?? nextCursor);

        setProducts(Array.isArray(response?.products) ? response.products : []);
        setTotalCount(Number(response?.totalCount ?? 0));
        setSnapshotTime(response?.snapshotTime || '');
        setPageCursors({
          1: '',
          ...(hasNextPage ? { 2: nextCursor } : {}),
        });
        return;
      }

      if (pageCursors[targetPage] !== undefined) {
        const response = await getProducts({
          category,
          cursor: pageCursors[targetPage],
          snapshotTime,
          limit,
        });

        const nextCursor = response?.pagination?.nextCursor ?? response?.nextCursor ?? '';
        const hasNextPage = Boolean(response?.pagination?.hasNextPage ?? nextCursor);

        setProducts(Array.isArray(response?.products) ? response.products : []);
        setCurrentPage(targetPage);
        setSnapshotTime(response?.snapshotTime || snapshotTime);
        setTotalCount(Number(response?.totalCount ?? totalCount) || totalCount);
        setPageCursors((currentCursors) => ({
          ...currentCursors,
          [targetPage]: pageCursors[targetPage],
          ...(hasNextPage ? { [targetPage + 1]: nextCursor } : {}),
        }));
        return;
      }

      let nextPageNumber = currentPage + 1;
      let cursorForRequest = pageCursors[nextPageNumber] || '';

      while (nextPageNumber <= targetPage) {
        const latestResponse = await getProducts({
          category,
          cursor: cursorForRequest,
          snapshotTime,
          limit,
        });

        const nextCursor = latestResponse?.pagination?.nextCursor ?? latestResponse?.nextCursor ?? '';
        const hasNextPage = Boolean(latestResponse?.pagination?.hasNextPage ?? nextCursor);

        setPageCursors((currentCursors) => ({
          ...currentCursors,
          [nextPageNumber]: cursorForRequest,
          ...(hasNextPage ? { [nextPageNumber + 1]: nextCursor } : {}),
        }));

        if (nextPageNumber === targetPage) {
          setProducts(Array.isArray(latestResponse?.products) ? latestResponse.products : []);
          setCurrentPage(targetPage);
          setSnapshotTime(latestResponse?.snapshotTime || snapshotTime);
          setTotalCount(Number(latestResponse?.totalCount ?? totalCount) || totalCount);
          return;
        }

        cursorForRequest = nextCursor;
        nextPageNumber += 1;

        if (!hasNextPage) {
          break;
        }
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to change page.');
    } finally {
      setLoading(false);
    }
  };

  const hasProducts = products.length > 0;
  const isLoadingInitialPage = loading && !hasProducts;
  const startResult = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endResult = totalCount === 0 ? 0 : Math.min(currentPage * limit, totalCount);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-linear-to-r from-slate-950 to-slate-800 px-6 py-8 text-white sm:px-8 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              CodeVector Catalog
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Browse products with numbered cursor pagination
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              Page 1 loads the first limited set, and every next page request reuses the selected
              limit with the saved cursor.
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

            <div className="w-full max-w-sm">
              <label htmlFor="limit-select" className="mb-2 block text-sm font-medium text-slate-700">
                Products per page
              </label>
              <select
                id="limit-select"
                name="limit-select"
                value={limit}
                onChange={handleLimitChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {limitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-slate-500 lg:text-right">
              <p>
                Showing <span className="font-semibold text-slate-900">{startResult}</span> to{' '}
                <span className="font-semibold text-slate-900">{endResult}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalCount}</span> results
              </p>
              <p className="mt-1">
                Page <span className="font-semibold text-slate-900">{currentPage}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalPages}</span>
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

            <div className="mt-2">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                loading={loading}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Home;