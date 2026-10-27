import { motion } from 'framer-motion';
import { Clock, Users, MessageCircle, Building2 } from 'lucide-react';

const TourCard = ({ tour }) => {

    // --- FUNCIÓN DE WHATSAPP MEJORADA ---
    const getWhatsAppLink = () => {
        const phone = "59172772345";

        // Creamos el mensaje con formato (saltos de línea y negritas)
        // --- FUNCIÓN DE WHATSAPP MEJORADA ---

        // Construimos el mensaje paso a paso para asegurar el formato
        let message = `*Hola, vengo de la web Uyuni Way*\n\n`;
        message += `Estoy interesado en reservar este tour:\n`;
        message += `__________________________\n\n`; // Línea separadora visual
        message += `*${tour.title}*\n`;
        message += `*Duración:* ${tour.duration}\n`;
        message += `*Precio:* ${tour.price} ${tour.currency} / persona\n`;
        message += `*Operador:* ${tour.company}\n`;
        message += `__________________________\n\n`;
        message += `¿Tienen disponibilidad para próximas fechas? Quedo atento.`;



        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    // Variantes de animación
    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 }
    };

    return (
        <motion.div
            layout
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border border-gray-100 flex flex-col h-full"
        >
            {/* --- IMAGEN CON OVERLAY --- */}
            <div className="relative h-72 overflow-hidden">
                <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradiente oscuro abajo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                {/* Etiquetas (Tags) */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="flex flex-wrap gap-2">
                        {tour.tags && tour.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="bg-white/95 backdrop-blur-md text-uyuni-dark text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Operadora */}
                <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-2 text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                        <Building2 size={12} className="text-blue-200" />
                        <span className="truncate max-w-[150px]">{tour.company}</span>
                    </div>
                </div>
            </div>

            {/* --- CONTENIDO --- */}
            <div className="p-8 flex-grow flex flex-col">
                {/* Título */}
                <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-4 group-hover:text-uyuni-blue transition-colors">
                    {tour.title}
                </h3>

                {/* Detalles */}
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Clock size={16} /></div>
                        {tour.duration}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-50 text-green-600 rounded-lg"><Users size={16} /></div>
                        Max 6
                    </div>
                </div>

                {/* Footer: Precio y Botón */}
                <div className="flex items-center justify-between mt-auto">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Por persona</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-uyuni-dark">{tour.price}</span>
                            <span className="text-sm font-bold text-gray-500">{tour.currency}</span>
                        </div>
                    </div>

                    {/* Botón con el link actualizado */}
                    {/* Botón con el link actualizado e Icono Real de WhatsApp */}
                    <a
                        href={getWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-2xl transition-all shadow-lg shadow-green-200 group-hover:scale-110 active:scale-95 flex items-center justify-center w-14 h-14"
                        title="Reservar por WhatsApp"
                    >
                        {/* SVG del Logo Oficial de WhatsApp */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28"
                            height="28"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                        >
                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                        </svg>
                    </a>
                </div>
            </div>
        </motion.div>
    );
};

export default TourCard;