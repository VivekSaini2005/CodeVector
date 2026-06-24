const defaultCategories = ['All', 'Electronics', 'Clothing', 'Books', 'Sports', 'Home'];

function CategoryFilter({
  categories = defaultCategories,
  selectedCategory = '',
  onChange = () => {}
}) {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <div className="w-full max-w-sm">
      <label htmlFor="category-filter" className="mb-2 block text-sm font-medium text-slate-700">
        Category
      </label>
      <select
        id="category-filter"
        name="category-filter"
        value={selectedCategory}
        onChange={handleChange}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      >
        {categories.map((category) => (
          <option key={category} value={category === 'All' ? '' : category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CategoryFilter;