import { MessageSquare, Eye, Clock, User, ArrowRight } from 'lucide-react'; // Agregué ArrowRight
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const categoryColors = {
  Logística: "bg-blue-100 text-blue-700",
  Fotografía: "bg-purple-100 text-purple-700",
  Tours: "bg-green-100 text-green-700",
  Hospedaje: "bg-orange-100 text-orange-700",
  General: "bg-gray-100 text-gray-700",
};

export const ForumCard = ({ post }) => {
  // Manejo seguro de fechas
  const dateObj = new Date(post.created_at);
  const formattedDate = !isNaN(dateObj) 
    ? dateObj.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })
    : 'Reciente';

  const authorName = post.profiles?.username || 'Anónimo';
  
  // --- LÓGICA NUEVA PARA OBTENER EL NÚMERO DE COMENTARIOS ---
  // Supabase devuelve un array de objetos con el count, tomamos el primero o 0
  const commentsCount = post.comments?.[0]?.count || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow group"
    >
      <Link to={`/foro/${post.id}`} className="block">
        <div className="flex justify-between items-start mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[post.category] || categoryColors.General}`}>
            {post.category}
          </span>
          <div className="flex items-center text-slate-400 text-xs">
            <Clock size={14} className="mr-1" />
            {formattedDate}
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
            {post.title}
        </h3>
        
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
          {post.excerpt || post.content}
        </p>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-slate-500 text-sm">
          
          {/* SECCIÓN DE ESTADÍSTICAS (IZQUIERDA) */}
          <div className="flex items-center space-x-4">
            {/* Vistas */}
            <div className="flex items-center" title="Vistas">
              <Eye size={16} className="mr-1 text-slate-400" />
              <span>{post.views}</span>
            </div>

            {/* Comentarios (NUEVO) */}
            <div className="flex items-center text-blue-600 font-medium" title="Comentarios">
               <MessageSquare size={16} className="mr-1" />
               <span>{commentsCount}</span>
            </div>
          </div>
          
          {/* AUTOR Y VER HILO (DERECHA) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center text-slate-400 text-xs">

                Autor: <User size={14} className="mr-1" />
                {authorName}
            </div>
            
            <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:underline">
               Ver hilo
               <ArrowRight size={14} className="ml-1" />
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
};