import { Loader2 } from 'lucide-react';
import { ForumCard } from './ForumCard';// Asegúrate que la ruta a ForumCard sea correcta

const ForumFeed = ({ posts, loading, onClearFilters }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 p-8">
        <p className="text-slate-500">No encontramos discusiones.</p>
        <button 
          onClick={onClearFilters}
          className="mt-4 text-blue-600 font-medium hover:underline"
        >
          Limpiar filtros
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <ForumCard key={post.id} post={post} />
      ))}
    </div>
  );
};
export default ForumFeed;