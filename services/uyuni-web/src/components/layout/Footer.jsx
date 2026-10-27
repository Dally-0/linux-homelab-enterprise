import { MapPin, Mail, Phone, Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-uyuni-night text-gray-300 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* COLUMNA 1: MARCA */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-white">
                            <MapPin className="h-6 w-6 text-uyuni-blue" />
                            <span className="text-xl font-bold tracking-tighter">
                                Uyuni<span className="text-uyuni-blue">Way</span>
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed mb-6 text-gray-400">
                            La plataforma comunitaria definitiva para explorar el Salar de Uyuni. Conectamos viajeros con experiencias locales auténticas y seguras.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com" className="hover:text-uyuni-blue transition-colors"><Facebook size={20} /></a>
                            <a href="https://www.instagram.com" className="hover:text-uyuni-blue transition-colors"><Instagram size={20} /></a>
                            <a href="https://www.x.com" className="hover:text-uyuni-blue transition-colors"><Twitter size={20} /></a>
                        </div>
                    </div>

                    {/* COLUMNA 2: ENLACES RÁPIDOS */}
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Explorar</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/" className="hover:text-uyuni-blue transition-colors">Inicio</Link></li>
                            <li><a href="/guia" className="hover:text-uyuni-blue transition-colors">Guía del Salar</a></li>
                            <li><a href="/tours" className="hover:text-uyuni-blue transition-colors">Mejores Tours</a></li>
                            <li><a href="/foro" className="hover:text-uyuni-blue transition-colors">Foro</a></li>
                            <li><a href="/noticias" className="hover:text-uyuni-blue transition-colors">Noticias</a></li>
                        </ul>
                    </div>

                    {/* COLUMNA 3: LEGAL & SOPORTE */}
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Soporte</h3>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-uyuni-blue transition-colors">Centro de Ayuda</a></li>
                            <li><a href="#" className="hover:text-uyuni-blue transition-colors">Términos y Condiciones</a></li>
                            <li><a href="#" className="hover:text-uyuni-blue transition-colors">Política de Privacidad</a></li>
                            <li><a href="#" className="hover:text-uyuni-blue transition-colors">Trabaja con nosotros</a></li>
                        </ul>
                    </div>

                    {/* COLUMNA 4: CONTACTO */}
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Contacto</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-uyuni-blue mt-1 shrink-0" />
                                <span>Av. Ferroviaria, Uyuni, Bolivia</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-uyuni-blue shrink-0" />
                                <span>+591 6000 0000</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-uyuni-blue shrink-0" />
                                <span>hola@uyuniway.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* COPYRIGHT */}
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>© 2025 UyuniWay.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <span>Español</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;