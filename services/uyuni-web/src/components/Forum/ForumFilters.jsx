import { Filter } from 'lucide-react';

const ForumFilters = ({ currentFilter, setFilter, categories }) => {
  return (
    <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <Filter className="h-4 w-4 text-slate-500 mr-2 flex-shrink-0" />
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setFilter(cat)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            currentFilter === cat 
              ? 'bg-slate-800 text-white' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};
export default ForumFilters;