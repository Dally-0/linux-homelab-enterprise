import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Flame, Camera, Calendar, Check, MapPin
} from 'lucide-react';

// Importamos los datos
import { toursData } from '../data/tours';
// Importamos el componente
import TourCard from '../components/ui/TourCard';

// Categorías
const categories = [
    { id: 'todos', label: 'Todos' },
    { id: '1 dia', label: 'Full Day' },
    { id: '3 dias', label: 'Expediciones' },
    { id: 'especial', label: 'Especiales' },
];

const Tours = () => {
    const [activeCategory, setActiveCategory] = useState('todos');

    const filteredTours = activeCategory === 'todos'
        ? toursData
        : toursData.filter(tour => tour.category === activeCategory);

    return (
        <div className="bg-uyuni-white min-h-screen pt-20 pb-24 overflow-x-hidden">

            {/* --- 1. HERO SECTION CINEMATOGRÁFICO --- */}
            <div className="relative pt-4 pb-12 lg:pt-8 lg:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* Contenedor Principal con Imagen de Fondo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative rounded-[2.5rem] overflow-hidden h-[60vh] min-h-[500px] shadow-2xl shadow-blue-900/20 group"
                >
                    {/* Imagen de Fondo con efecto Parallax suave al hacer hover */}
                    <div className="absolute inset-0">
                        <img
                            src="https://www.lithiumaventura.com/uploads/packages/lX5vId0tjSegINcZVZKp1vT5IgYL343IK4aX0tYh.jpeg"
                            alt="Salar de Uyuni"
                            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                        />
                        {/* Gradiente Oscuro para que el texto se lea bien */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10"></div>
                    </div>

                    {/* Contenido Centrado */}
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 md:p-12">

                        {/* Badge Superior */}
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-block py-1.5 px-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs mb-6"
                        >
                            Destino #1 de Bolivia
                        </motion.span>

                        {/* Título Grande */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight drop-shadow-lg"
                        >
                            Salar de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">Uyuni</span>
                        </motion.h1>

                        {/* Descripción en Caja de Vidrio (Glassmorphism) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="max-w-2xl bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl"
                        >
                            <p className="text-gray-100 text-base md:text-lg leading-relaxed font-medium">
                                Descubre el espejo natural más grande del mundo.
                                Desde amaneceres mágicos hasta expediciones de 3 días cruzando lagunas de colores.
                            </p>
                        </motion.div>

                    </div>

                    {/* Datos Rápidos en la parte inferior (Solo visible en desktop/tablet) */}
                    <div className="absolute bottom-8 left-8 right-8 hidden md:flex justify-between items-end">
                        <div className="flex gap-4 text-white/80 text-sm font-medium">
                            <span className="flex items-center gap-2"><MapPin size={16} /> Potosí, Bolivia</span>
                            <span className="flex items-center gap-2"><Calendar size={16} /> Todo el año</span>
                        </div>
                        <div className="text-white/60 text-xs uppercase tracking-widest">
                            Scroll para descubrir
                        </div>
                    </div>

                </motion.div>
            </div>

            {/* --- 2. FILTROS (SCROLL HORIZONTAL EN MÓVIL) --- */}
            <div className="sticky top-20 z-30 mb-8 md:mb-12 px-0 md:px-4 pointer-events-none">
                <div className="max-w-fit mx-auto pointer-events-auto">
                    {/* Contenedor con scroll horizontal suave */}
                    <div className="flex overflow-x-auto pb-4 px-4 md:px-0 gap-2 md:gap-1 scrollbar-hide snap-x justify-start md:justify-center">
                        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-gray-100 flex gap-1 whitespace-nowrap">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 snap-center ${activeCategory === cat.id
                                            ? 'bg-black text-white shadow-md'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 3. GRID DE TOURS --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-32">
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    <AnimatePresence mode='popLayout'>
                        {filteredTours.map((tour) => (
                            <TourCard key={tour.id} tour={tour} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* --- 4. SECCIÓN "POR QUÉ NOSOTROS" (STACK EN MÓVIL) --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-uyuni-dark">Viaja con Confianza</h2>
                    <p className="text-gray-500 mt-2 text-sm md:text-base">Estándares internacionales de seguridad en el Altiplano.</p>
                </div>

                {/* Grid Responsivo: 1 columna en móvil, 3 en escritorio */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Tarjeta Principal (Grande) */}
                {/* Tarjeta Principal (Grande) */}
                    <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-6 md:p-12 relative overflow-hidden text-white flex flex-col justify-center min-h-[400px] md:min-h-[300px]">
                        {/* Mancha de color de fondo (opcional, se mezcla con la imagen) */}
                        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-uyuni-blue/30 rounded-full blur-[80px] -mr-10 -mt-10 z-0"></div>
                        
                        {/* IMAGEN DE FONDO COMPLETO */}
                        <img 
                            src="/jeep.webp" 
                            alt="Jeep" 
                            // CAMBIOS AQUÍ: inset-0, w-full, h-full y una opacidad baja y uniforme
                            className="absolute inset-0 w-full h-full object-cover opacity-70 z-0" 
                        />
                        
                        {/* Capa oscura extra para mejorar legibilidad (opcional) */}
                        <div className="absolute inset-0 bg-slate-900/40 z-0"></div>

                        <div className="relative z-10 max-w-md">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                                <ShieldCheck size={20} className="text-green-400 md:w-6 md:h-6"/>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Seguridad Garantizada</h3>
                            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                                Operamos con vehículos 4x4 propios (Toyota Land Cruiser) y choferes con mecánica básica y primeros auxilios.
                            </p>
                            <div className="flex flex-wrap gap-2 md:gap-4">
                                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold bg-white/10 px-3 py-1.5 rounded-lg"><Check size={12} className="text-green-400 md:w-3.5 md:h-3.5"/> Oxígeno</div>
                                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold bg-white/10 px-3 py-1.5 rounded-lg"><Check size={12} className="text-green-400 md:w-3.5 md:h-3.5"/> Botiquín</div>
                                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold bg-white/10 px-3 py-1.5 rounded-lg"><Check size={12} className="text-green-400 md:w-3.5 md:h-3.5"/> Satelital</div>
                            </div>
                        </div>
                    </div>

                    {/* Tarjetas Secundarias (Apiladas en móvil) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-6">
                        <div className="bg-blue-50 rounded-[2rem] p-6 md:p-8 border border-blue-100 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2.5 md:p-3 bg-white rounded-2xl shadow-sm text-blue-500"><Flame size={20} className="md:w-6 md:h-6" /></div>
                                <span className="text-3xl md:text-4xl font-black text-blue-200">01</span>
                            </div>
                            <h4 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Confort Total</h4>
                            <p className="text-xs md:text-sm text-gray-600">Calefacción en los autos y sacos de dormir de pluma.</p>
                        </div>

                        <div className="bg-orange-50 rounded-[2rem] p-6 md:p-8 border border-orange-100 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2.5 md:p-3 bg-white rounded-2xl shadow-sm text-orange-500"><Camera size={20} className="md:w-6 md:h-6" /></div>
                                <span className="text-3xl md:text-4xl font-black text-orange-200">02</span>
                            </div>
                            <h4 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Tiempo Extra</h4>
                            <p className="text-xs md:text-sm text-gray-600">Paramos donde tú quieras para la foto perfecta.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Tours;