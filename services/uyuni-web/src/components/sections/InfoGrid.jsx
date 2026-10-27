import { Calendar, Mountain, Camera, HeartPulse, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const features = [
    {
        icon: <Calendar className="w-8 h-8 text-uyuni-blue" />,
        title: "Clima y Temporadas",
        desc: "¿Buscas el efecto espejo o el desierto blanco? Descubre cuándo ir.",
        color: "bg-blue-50",
        border: "border-blue-100",
        link: "/guia#clima" // Enlace directo a la sección #clima de la Guía
    },
    {
        icon: <Mountain className="w-8 h-8 text-uyuni-earth" />,
        title: "Historia y Leyendas",
        desc: "Conoce el mito de Tunupa y el origen sagrado del Salar.",
        color: "bg-orange-50",
        border: "border-orange-100",
        link: "/guia#historia" // Enlace directo a la sección #historia
    },
    {
        icon: <Camera className="w-8 h-8 text-green-600" />,
        title: "Flora y Fauna",
        desc: "Flamencos, cactus milenarios y la vida en el desierto.",
        color: "bg-green-50",
        border: "border-green-100",
        link: "/guia#naturaleza" // Enlace directo a la sección #naturaleza
    },
    {
        icon: <HeartPulse className="w-8 h-8 text-red-500" />,
        title: "Salud y Altura",
        desc: "Tips vitales para sobrevivir a los 3,600 msnm sin problemas.",
        color: "bg-red-50",
        border: "border-red-100",
        link: "/guia#tips" // Enlace a sección de tips (agregaremos esto a la guía abajo)
    }
];

// Animación del contenedor (efecto cascada)
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 }
    }
};

// Animación de cada tarjeta
const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

const InfoGrid = () => {
    return (
        <section className="py-24 bg-uyuni-white relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-100/50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-orange-100/40 rounded-full blur-3xl opacity-60"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* ENCABEZADO */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-uyuni-blue font-bold tracking-wider uppercase text-sm mb-2 block">
                        Información Esencial
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold text-uyuni-dark mb-6">
                        Todo lo que debes saber
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                        Prepara tu expedición con nuestra guía completa. Desde leyendas ancestrales hasta consejos de supervivencia.
                    </p>
                </motion.div>

                {/* GRID DE TARJETAS */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {features.map((item, index) => (
                        <motion.div variants={itemVariants} key={index} className="h-full">
                            {/* Usamos react-router-hash-link o Link normal con hash */}
                            <Link to={item.link} className="block h-full">
                                <div className={`h-full bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border ${item.border} group cursor-pointer relative overflow-hidden hover:-translate-y-2 flex flex-col`}>

                                    {/* Gradient Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                    <div className="relative z-10 flex flex-col h-full">
                                        {/* Icono */}
                                        <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner`}>
                                            {item.icon}
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-uyuni-blue transition-colors">
                                            {item.title}
                                        </h3>

                                        <p className="text-gray-500 leading-relaxed mb-6 text-sm flex-grow">
                                            {item.desc}
                                        </p>

                                        <div className="flex items-center text-uyuni-blue font-bold text-sm group-hover:translate-x-2 transition-transform duration-300 mt-auto">
                                            Leer artículo <ArrowRight size={16} className="ml-2" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

            </div>
        </section>
    );
};

export default InfoGrid;