import { X, Calendar, Tag, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NewsModal = ({ news, isOpen, onClose }) => {
  if (!news) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo oscuro (Backdrop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Contenido del Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()} // Evitar cierre al clic dentro
              className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative"
            >
              
              {/* Botón Cerrar */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-all z-10"
              >
                <X size={24} />
              </button>

              {/* Imagen Grande */}
              <div className="h-64 sm:h-80 w-full relative">
                <img 
                  src={news.image} 
                  alt={news.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6 sm:p-8 text-white">
                    <span className="inline-block bg-blue-600 px-3 py-1 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
                      {news.category}
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-bold leading-tight">
                      {news.title}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Cuerpo de la Noticia */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar size={16} className="mr-2" />
                    {new Date(news.date).toLocaleDateString('es-BO', { dateStyle: 'long' })}
                  </div>
                  <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                    <Share2 size={16} className="mr-2" />
                    Compartir
                  </button>
                </div>

                <div className="prose max-w-none text-gray-700 leading-relaxed text-lg">
                  <p className="font-medium text-xl text-gray-900 mb-4">{news.summary}</p>
                  <p>{news.content}</p>
                  <p className="mt-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </div>
              </div>

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewsModal;