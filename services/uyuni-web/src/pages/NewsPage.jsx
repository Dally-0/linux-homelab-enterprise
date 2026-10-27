import { useState } from 'react';
import newsData from '../data/newsData.json';
import NewsModal from '../components/news/NewsModal';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const NewsPage = () => {
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openNews = (newsItem) => {
    setSelectedNews(newsItem);
    setIsModalOpen(true);
  };

  const closeNews = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedNews(null), 200); // Limpiar estado después de la animación
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="text-center mb-12 mt-5 pt-5">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Actualidad Uyuni<span className="text-blue-600">Way</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Entérate de las últimas novedades, clima, eventos y actualizaciones importantes para tu viaje al Salar.
          </p>
        </div>

        {/* Grid de Noticias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col group cursor-pointer"
              onClick={() => openNews(item)}
            >
              {/* Imagen de la tarjeta */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-blue-700 uppercase tracking-wide">
                  {item.category}
                </div>
              </div>

              {/* Contenido de la tarjeta */}
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center text-slate-400 text-xs mb-3">
                  <Calendar size={14} className="mr-1" />
                  {new Date(item.date).toLocaleDateString()}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                
                <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">
                  {item.summary}
                </p>

                <div className="flex items-center text-blue-600 font-semibold text-sm mt-auto">
                  Leer completa 
                  <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Renderizamos el Modal */}
      <NewsModal 
        news={selectedNews} 
        isOpen={isModalOpen} 
        onClose={closeNews} 
      />
    </div>
  );
};

export default NewsPage;