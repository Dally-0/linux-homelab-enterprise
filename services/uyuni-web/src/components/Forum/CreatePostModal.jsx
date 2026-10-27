import { useState } from 'react';
import { X, Loader2, Send, Image as ImageIcon, Trash2 } from 'lucide-react'; // Importamos iconos nuevos
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Nuevo estado para la imagen
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    content: ''
  });

  const categories = ["Logística", "Fotografía", "Tours", "Hospedaje", "General"];

  if (!isOpen) return null;

  // Manejar selección de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Límite de 5MB opcional
        return alert("La imagen es muy pesada (máx 5MB)");
      }
      setImageFile(file);
      // Crear URL temporal para previsualizar
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Quitar imagen seleccionada
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Debes iniciar sesión");

    setLoading(true);

    try {
      let uploadedImageUrl = null;

      // 1. SI HAY IMAGEN, LA SUBIMOS PRIMERO AL BUCKET
      if (imageFile) {
        // Crear nombre único: fecha-nombrearchivo
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('forum-images') // Nombre exacto de tu bucket
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // Obtener la URL pública para guardarla en la BD
        const { data: urlData } = supabase.storage
          .from('forum-images')
          .getPublicUrl(filePath);

        uploadedImageUrl = urlData.publicUrl;
      }

      // 2. Generar excerpt
      const excerpt = formData.content.length > 150 
        ? formData.content.substring(0, 150) + '...'
        : formData.content;

      // 3. Insertar el post con la URL de la imagen
      const { error } = await supabase.from('posts').insert([
        {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          user_id: user.id,
          excerpt: excerpt,
          views: 0,
          image_url: uploadedImageUrl // <--- Guardamos la URL aquí
        }
      ]);

      if (error) throw error;

      // 4. Limpieza
      setFormData({ title: '', category: 'General', content: '' });
      removeImage();
      onPostCreated(); 
      onClose(); 

    } catch (error) {
      console.error("Error al publicar:", error);
      alert("Hubo un error al publicar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Crear Nueva Discusión</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Formulario con Scroll si es muy largo */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título del tema</label>
            <input
              type="text"
              required
              placeholder="Ej: ¿Cuál es la mejor agencia..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu consulta o experiencia</label>
            <textarea
              required
              rows="5"
              placeholder="Escribe aquí los detalles..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            ></textarea>
          </div>

          {/* INPUT DE IMAGEN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agregar foto (Opcional)</label>
            
            {!imagePreview ? (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">Clic para subir imagen</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG (Máx. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            ) : (
              // VISTA PREVIA
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                  title="Eliminar imagen"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publicar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;