import { Link } from 'react-router-dom'; // <--- Importar Link
import { toursData } from '../../data/tours';
import TourCard from '../ui/TourCard';

const ToursList = () => {
    return (
        <section className="py-20 bg-gray-50 ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* TITULO DE SECCIÓN */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-uyuni-dark mb-2">
                            Experiencias Destacadas
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Los tours mejor valorados por viajeros de todo el mundo.
                        </p>
                    </div>
                    
                    {/* Botón funcional que lleva a la página /tours */}
                    <Link 
                        to="/tours" 
                        className="text-uyuni-blue font-semibold hover:text-uyuni-dark transition-colors flex items-center gap-2"
                    >
                        Ver todos los tours &rarr;
                    </Link>
                </div>

                {/* GRID DE TOURS (SOLO LOS PRIMEROS 3) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Aquí usamos .slice(0, 3) para cortar el array */}
                    {toursData.slice(0, 3).map((tour) => (
                        <TourCard key={tour.id} tour={tour} />
                    ))}
                </div>

            </div>
        </section>
    );
};

export default ToursList;