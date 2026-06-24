import ProductCard from './ProductCard';

function ProductGrid({ products = [] }) {
  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Product list">
      {products.length > 0 ? (
        products.map((product) => (
          <ProductCard key={product.id || product._id || product.name} product={product} />
        ))
      ) : (
        <p className="text-sm text-slate-500">No products to display yet.</p>
      )}
    </section>
  );
}

export default ProductGrid;