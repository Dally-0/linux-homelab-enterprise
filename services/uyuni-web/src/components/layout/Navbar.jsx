import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const Navbar = () => {
    // Nota: Si aún no tienes configurado AuthContext, estas líneas podrían dar error.
    // Asegúrate de tener el contexto creado o comenta las líneas de auth temporalmente.
    const { user, signOut } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [profile, setProfile] = useState(null);

    const location = useLocation();

    // --- AQUÍ ESTÁ EL CAMBIO PRINCIPAL ---
    const navLinks = [
        { name: 'Inicio', path: '/' },
        { name: 'Guía del Salar', path: '/guia' }, // <--- Ruta actualizada aquí
        { name: 'Tours', path: '/tours' },          // (Opcional) Preparado para futuro
        { name: 'Comunidad', path: '/foro' },
        { name: 'Noticias', path: '/noticias' },
    ];

    useEffect(() => {
        const getProfile = async () => {
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', user.id)
                    .single();

                setProfile(data);
            } else {
                setProfile(null);
            }
        };
        getProfile();
    }, [user]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) setScrolled(true);
            else setScrolled(false);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const useSolidStyle = scrolled || location.pathname !== '/';

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${useSolidStyle ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* LOGO */}
                    <Link to="/" className="flex items-center gap-2">
                        <MapPin className={`h-8 w-8 ${useSolidStyle ? 'text-uyuni-blue' : 'text-white'}`} />
                        <span className={`text-2xl font-bold tracking-tighter ${useSolidStyle ? 'text-uyuni-dark' : 'text-white'
                            }`}>
                            Uyuni<span className="text-uyuni-blue">Way</span>
                        </span>
                    </Link>

                    {/* DESKTOP MENU (Oculto en móvil) */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`font-medium hover:text-uyuni-blue transition-colors ${useSolidStyle ? 'text-gray-700' : 'text-white/90'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* INFO USUARIO DESKTOP */}
                        {user ? (
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-300">
                                {profile?.avatar_url && (
                                    <img
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                    />
                                )}
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold leading-tight ${useSolidStyle ? 'text-gray-800' : 'text-white'}`}>
                                        Hola, {profile?.username || 'Viajero'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => { setProfile(null); signOut(); }}
                                    className="ml-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-all shadow-sm"
                                    title="Cerrar sesión"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        ) : (
                            <Link to="/login">
                                <button className="bg-uyuni-blue hover:bg-sky-600 text-white px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2">
                                    <UserIcon size={18} />
                                    Ingresar
                                </button>
                            </Link>
                        )}
                    </div>

                    {/* MOBILE MENU BUTTON */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className={useSolidStyle ? 'text-gray-800' : 'text-white'}>
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* MENU MÓVIL DESPLEGABLE */}
            {isOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 animate-in slide-in-from-top-5 duration-200">
                    <div className="px-4 py-6 space-y-4 flex flex-col">

                        {/* Enlaces del menú */}
                        {navLinks.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsOpen(false)} // Cerrar menú al hacer clic
                                className="text-lg font-medium text-gray-700 hover:text-uyuni-blue py-2 border-b border-gray-50"
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Sección Usuario Móvil */}
                        <div className="pt-4 mt-2">
                            {user ? (
                                <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                                <UserIcon size={20} />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-gray-800">{profile?.username || 'Usuario'}</p>
                                            <p className="text-xs text-green-600 font-medium">● Conectado</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setIsOpen(false); signOut(); }}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" onClick={() => setIsOpen(false)}>
                                    <button className="w-full bg-uyuni-blue text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
                                        <UserIcon size={20} />
                                        Iniciar Sesión / Registro
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;