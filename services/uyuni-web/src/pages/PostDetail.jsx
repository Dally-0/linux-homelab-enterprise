import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, User, MessageSquare, Loader2, MapPin, Send, Eye } from 'lucide-react';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const viewCounted = useRef(false);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`*, profiles ( username, avatar_url )`)
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (!error) setComments(data);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`*, profiles ( username, avatar_url )`)
        .eq('id', id)
        .single();

      if (postError) {
        console.error("Error cargando post:", postError);
      } else {
        setPost(postData);
        await fetchComments();

        if (!viewCounted.current) {
          await supabase.rpc('increment_views', { post_id: id });
          viewCounted.current = true;
        }
      }
      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert([
        { content: newComment, post_id: id, user_id: user.id }
      ]);
      if (error) throw error;
      setNewComment(""); 
      await fetchComments(); 
    } catch (error) {
      console.error(error);
      alert("Error al comentar.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  if (!post) return <div className="text-center py-20">Post no encontrado</div>;

  const formattedDate = new Date(post.created_at).toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/foro" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la comunidad
        </Link>

        {/* TARJETA DEL POST */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 sm:p-8 border-b border-slate-100">
            {/* Categoría y Fecha */}
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{post.category}</span>
              <span className="flex items-center text-slate-400 text-sm"><Calendar className="w-4 h-4 mr-1" /> {formattedDate}</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">{post.title}</h1>
            
            {/* Autor */}
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden mr-3 border border-slate-200">
                {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : <User className="h-full w-full p-2 text-slate-400" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{post.profiles?.username || 'Usuario Anónimo'}</p>
                <p className="text-xs text-slate-500">Autor del hilo</p>
              </div>
            </div>
          </div>



          {/* CONTENIDO TEXTO */}
          <div className="p-6 sm:p-8 bg-white">
            <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">{post.content}</div>
          </div>


          {/* IMAGEN DEL POST (NUEVO BLOQUE) */}
          {post.image_url && (
            <div className="w-full h-auto max-h-[500px] overflow-hidden bg-gray-100 border-b border-slate-100">
              <img 
                src={post.image_url} 
                alt={post.title} 
                className="w-full h-full object-contain mx-auto "
                loading="lazy"
              />
            </div>
          )}

          

          {/* Footer Stats */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-sm">
             <div className="flex items-center gap-6">
                <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> Uyuni, Bolivia</div>
                <div className="flex items-center"><MessageSquare className="w-4 h-4 mr-1" /> {comments.length} comentarios</div>
             </div>
             
             <div className="flex items-center text-slate-400 font-medium">
                <Eye className="w-4 h-4 mr-1" /> 
                {post.views + 1} vistas
             </div>
          </div>
        </div>

        {/* SECCIÓN DE COMENTARIOS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 sm:p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">Comentarios <span className="ml-2 text-sm font-normal text-slate-500">({comments.length})</span></h3>
          
          <div className="space-y-6 mb-8">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      {comment.profiles?.avatar_url ? <img src={comment.profiles.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : <User className="h-full w-full p-2 text-slate-400" />}
                    </div>
                  </div>
                  <div className="flex-grow bg-slate-50 rounded-2xl rounded-tl-none p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900 text-sm">{comment.profiles?.username || 'Usuario'}</span>
                      <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (<p className="text-slate-500 italic text-center py-4">No hay comentarios aún.</p>)}
          </div>

          {user ? (
            <form onSubmit={handleCommentSubmit} className="mt-6 border-t border-slate-100 pt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Escribe tu respuesta</label>
              <div className="relative">
                <textarea required rows="3" className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 focus:bg-white" placeholder="Comparte tu opinión..." value={newComment} onChange={(e) => setNewComment(e.target.value)}></textarea>
                <button type="submit" disabled={submitting || !newComment.trim()} className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all">
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center mt-6">
              <Link to="/login" className="text-blue-600 font-bold hover:underline text-sm">Inicia sesión para comentar</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}