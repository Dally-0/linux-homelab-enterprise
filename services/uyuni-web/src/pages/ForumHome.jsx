import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext'; // <--- Importamos Auth
import { useNavigate } from 'react-router-dom';   // <--- Para redirigir si no está logueado

// Componentes
import ForumHeader from '../components/Forum/ForumHeader';
import ForumControls from '../components/Forum/ForumControls';
import ForumFilters from '../components/Forum/ForumFilters';
import ForumFeed from '../components/Forum/ForumFeed';
import CreatePostModal from '../components/Forum/CreatePostModal'; // <--- Importamos el Modal

export default function ForumHome() {
  const { user } = useAuth(); // Obtenemos usuario
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = ["Todos", "Logística", "Fotografía", "Tours", "Hospedaje"];
// En src/pages/ForumHome.jsx

const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // AGREGAMOS "comments ( count )" A LA CONSULTA
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles ( username, avatar_url ),
          comments ( count ) 
        `)
        .order('created_at', { ascending: false });

      if (filter !== "Todos") query = query.eq('category', filter);
      if (searchTerm) query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
      
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
};

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]); 

  // --- LÓGICA DEL BOTÓN NUEVO HILO ---
  const handleNewPostClick = () => {
    if (!user) {
      alert("Debes iniciar sesión para publicar en el foro.");
      navigate('/login');
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSearch = () => fetchPosts();
  const handleClear = () => { setFilter("Todos"); setSearchTerm(""); fetchPosts(); };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        <ForumHeader />

        <ForumControls 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleSearch}
          onNewPost={handleNewPostClick} // <--- Pasamos la nueva función
        />

        <ForumFilters 
          categories={categories}
          currentFilter={filter}
          setFilter={setFilter}
        />

        <ForumFeed 
          posts={posts}
          loading={loading}
          onClearFilters={handleClear}
        />

        {/* Renderizamos el Modal */}
        <CreatePostModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onPostCreated={() => fetchPosts()} // Recargar posts al crear uno nuevo
        />

      </div>
    </div>
  );
}
