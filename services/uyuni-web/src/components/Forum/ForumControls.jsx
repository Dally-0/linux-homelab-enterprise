import { Search, PlusCircle } from 'lucide-react';

const ForumControls = ({ searchTerm, setSearchTerm, onSearch, onNewPost }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          placeholder="Buscar (ej. clima, transporte)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
      </div>
      
      <button 
        onClick={onNewPost}
        className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all justify-center w-full md:w-auto"
      >
        <PlusCircle className="mr-2 h-5 w-5" />
        Nuevo Hilo
      </button>
    </div>
  );
};
export default ForumControls;