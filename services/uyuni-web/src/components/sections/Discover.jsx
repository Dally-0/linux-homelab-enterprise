import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowRight, PlayCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Discover = () => {
    // 1. Configuración del efecto de Zoom
    const sectionRef = useRef(null);
    const [isVideoOpen, setIsVideoOpen] = useState(false); // Estado para el modal de video

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });

    // 2. SUAVIZADOR (Física)
    const smoothScroll = useSpring(scrollYProgress, {
        mass: 0.1,
        stiffness: 50,
        damping: 20,
        restDelta: 0.001
    });

    // 3. ZOOM FUERTE (De 1 a 1.5 veces su tamaño - ajustado para que no sea tan agresivo)
    const scale = useTransform(smoothScroll, [0, 1], [1, 1.5]);

    return (
        <section
            ref={sectionRef}
            className="relative py-24 overflow-hidden bg-black"
        >

            {/* --- CAPA DE FONDO (IMAGEN CON ZOOM SUAVE Y FUERTE) --- */}
            <motion.div
                style={{ scale }}
                className="absolute inset-0 z-0 origin-center"
            >
                <img
                    // Asegúrate de que esta ruta sea correcta o usa una url absoluta si prefieres
                    src="/bgiolse.webp"
                    alt="Fondo Uyuni"
                    className="w-full h-full object-cover opacity-60 transition-transform will-change-transform"
                />
                {/* Gradiente Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
            </motion.div>


            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* COLUMNA IZQUIERDA: TEXTO Y ACCIONES */}
                    <div className="lg:w-1/2 text-left">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-block py-1 px-3 rounded-full bg-uyuni-blue/10 text-uyuni-blue text-sm font-bold mb-6 border border-uyuni-blue/20 backdrop-blur-sm"
                        >
                            Explora sin límites
                        </motion.span>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
                        >
                            Descubre las maravillas <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-uyuni-blue to-purple-400">
                                que esconde Uyuni
                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-300 text-lg mb-10 max-w-lg leading-relaxed"
                        >
                            Más allá del gran salar, te esperan lagunas de colores irreales, géiseres activos y un cielo nocturno que te hará tocar las estrellas. Conoce los destinos que hacen de Bolivia un lugar único.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-wrap gap-4"
                        >
                            {/* BOTÓN 1: VA A TOURS */}
                            <Link to="/tours">
                                <button className="bg-uyuni-blue hover:bg-sky-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] flex items-center gap-2 group">
                                    Ver Destinos <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>

                            {/* BOTÓN 2: ABRE MODAL VIDEO */}
                            <button
                                onClick={() => setIsVideoOpen(true)}
                                className="text-white hover:text-uyuni-blue font-semibold px-6 py-4 rounded-xl flex items-center gap-3 transition-colors group backdrop-blur-sm bg-white/5 hover:bg-white/10"
                            >
                                <PlayCircle size={24} className="group-hover:scale-110 transition-transform text-gray-300 group-hover:text-uyuni-blue" />
                                Ver Video Intro
                            </button>
                        </motion.div>
                    </div>

                    {/* COLUMNA DERECHA: GRID DE FOTOS TIPO MASONRY */}
                    <div className="lg:w-1/2 relative h-[600px] w-full flex gap-4 justify-center">
                        {/* Glow decorativo */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-uyuni-blue/20 blur-[100px] rounded-full -z-10" />

                        {/* Columna 1 */}
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            whileInView={{ y: 40, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col gap-4 mt-12 w-1/3"
                        >
                            <Link to="/tours" className="h-64 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group cursor-pointer block">
                                <img src="https://www.terresdesandes.org/images/uyuni_bolivia_coucher_de_soleil.jpeg" alt="Salar" className="w-full h-full object-cover group-hover:scale-110 transition-duration-700" />
                            </Link>
                            <div className="h-40 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                                <img src="https://www.machutravelperu.com/wp-content/uploads/2024/03/uyuni-bolivia-1.webp" alt="Flamencos" className="w-full h-full object-cover group-hover:scale-110 transition-duration-700" />
                            </div>
                        </motion.div>

                        {/* Columna 2 */}
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-col gap-4 w-1/3 -mt-8"
                        >
                            <div className="h-48 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                                <img src="https://www.fodors.com/wp-content/uploads/2018/10/03.2_Salar_Landscpes_SaltHotels_shutterstock_532537840.jpg" alt="Cielo" className="w-full h-full object-cover group-hover:scale-110 transition-duration-700" />
                            </div>
                            <Link to="/guia" className="h-72 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group relative block cursor-pointer">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs font-bold">Ver Guía de Viaje &rarr;</p>
                                </div>
                                <img src="https://media.gettyimages.com/id/1465352457/video/surreal-drone-video-of-a-4x4-driving-across-the-mirror-like-surface-of-the-worlds-largest.jpg?s=640x640&k=20&c=pYe3aTDQumLGKHTr3gCaKWG0KZlEIgzSnze8_caTTO4=" alt="Desierto" className="w-full h-full object-cover group-hover:scale-110 transition-duration-700" />
                            </Link>
                        </motion.div>

                        {/* Columna 3 */}
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            whileInView={{ y: 60, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="flex flex-col gap-4 mt-8 w-1/3 hidden md:flex"
                        >
                            <div className="h-80 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                                <img src="https://southamericantravelers.club/wp-content/uploads/2024/10/Salar-de-Uyuni-1024x682.webp" alt="Estrellas" className="w-full h-full object-cover group-hover:scale-110 transition-duration-700" />
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>

            {/* --- MODAL DE VIDEO (YOUTUBE) --- */}
            <AnimatePresence>
                {isVideoOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        onClick={() => setIsVideoOpen(false)} // Cerrar al hacer clic fuera
                    >
                        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                            <button
                                onClick={() => setIsVideoOpen(false)}
                                className="absolute top-4 right-4 text-white hover:text-red-500 z-10 p-2 bg-black/50 rounded-full"
                            >
                                <X size={24} />
                            </button>

                            <iframe
                                width="100%"
                                height="100%"
                                src="https://www.youtube.com/embed/PfRDCrfyyTU?autoplay=1"
                                title="Mini Video Salar de Uyuni"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

        </section>
    );
};

export default Discover;