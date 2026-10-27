import { ArrowRight } from 'lucide-react';

const Hero = () => {
    return (
        <div className="relative h-screen w-full overflow-hidden">

            {/* IMAGEN DE FONDO */}
            <div className="absolute inset-0 overflow-hidden position-video">
                <video
                    className="w-full h-full object-cover transform scale-105"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/hasd.webp"
                >
                    
                </video>

                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-uyuni-white/10"></div>
            </div>

            {/* CONTENIDO TEXTUAL */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-10">

                <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold mb-6 border border-white/30 animate-fade-in-up">
                    🇧🇴 El espejo natural más grande del mundo
                </span>

                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                    Descubre la magia infinita del <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-white">
                        Salar de Uyuni
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl font-light">
                    La guía definitiva para tu aventura en Bolivia. Itinerarios, consejos de altura y los mejores operadores turísticos en un solo lugar.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button className="bg-uyuni-blue hover:bg-sky-500 text-white text-lg px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-sky-500/50 flex items-center justify-center gap-2">
                        Ver Tours Disponibles <ArrowRight size={20} />
                    </button>

                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-lg px-8 py-4 rounded-full font-bold transition-all border border-white/30">
                        Descargar Guía Gratis
                    </button>
                </div>

            </div>

            {/* SCROLL INDICATOR */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
                    <div className="w-1 h-2 bg-white rounded-full mt-2"></div>
                </div>
            </div>
        </div>
    );
};

export default Hero;