import { useState, useEffect } from 'react';
import {
    CloudRain, Thermometer, Wind, Mountain, Camera, Map,
    HeartPulse, Sun, ShieldAlert, Droplets, Backpack,
    CheckCircle2, Binoculars, Sparkles, Aperture,
    Maximize, Sliders, Calendar, Lightbulb, ShieldCheck, Flame, Clock, Zap, Leaf,
    Cloud, CloudSun, CloudLightning, Snowflake, CloudFog, X, ZoomIn, Plane, TrainFront, BusFront, MapPin, Navigation
} from 'lucide-react';

const Guide = () => {
    // ESTADO: Clima en tiempo real
    const [weather, setWeather] = useState(null);
    const [loadingWeather, setLoadingWeather] = useState(true);

    // ESTADO: Pestañas de equipaje
    const [activeTab, setActiveTab] = useState('basic');

    // EFECTO: Obtener clima
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const API_KEY = '009bf61135d8f900c663e2d11e4f992b';
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Uyuni,BO&units=metric&lang=es&appid=${API_KEY}`); // Agregué &lang=es para descripciones en español

                if (!response.ok) throw new Error('Error al obtener clima');

                const data = await response.json();
                setWeather({
                    temp: Math.round(data.main.temp),
                    desc: data.weather[0].description,
                    humidity: data.main.humidity,
                    wind: Math.round(data.wind.speed * 3.6),
                    iconCode: data.weather[0].icon,
                    feels_like: Math.round(data.main.feels_like),
                    min: Math.round(data.main.temp_min),
                    max: Math.round(data.main.temp_max),
                    visibility: (data.visibility / 1000).toFixed(1)
                });
            } catch (error) {
                console.log("Error API, usando fallback");
                setWeather({
                    temp: 18, desc: "Cielo despejado", humidity: 20, wind: 25, iconCode: "01d",
                    feels_like: 16, min: 5, max: 20, visibility: 10
                });
            } finally {
                setLoadingWeather(false);
            }
        };

        fetchWeather();
    }, []);
    // Helper para elegir el ícono correcto de Lucide
    const getWeatherIcon = (code) => {
        if (!code) return <Sun size={300} />;
        if (code.includes('01')) return <Sun size={300} />; // Cielo limpio
        if (code.includes('02')) return <CloudSun size={300} />; // Pocas nubes
        if (code.includes('03') || code.includes('04')) return <Cloud size={300} />; // Nublado
        if (code.includes('09') || code.includes('10')) return <CloudRain size={300} />; // Lluvia
        if (code.includes('11')) return <CloudLightning size={300} />; // Tormenta
        if (code.includes('13')) return <Snowflake size={300} />; // Nieve
        return <CloudFog size={300} />; // Niebla/Otros
    };
    // DATOS: Distancias
    const distances = [
        { from: "La Paz", km: 540, time: "10h - Bus / 1h - Vuelo", type: "Bus/Avión" },
        { from: "Sucre", km: 361, time: "8h - Bus", type: "Bus" },
        { from: "Potosí", km: 204, time: "4h - Bus", type: "Bus" },
        { from: "Villazón", km: 298, time: "9h - Tren", type: "Tren Wara Wara" },
    ];
    // ESTADO: Ruta seleccionada
    const [selectedRoute, setSelectedRoute] = useState('La Paz');

    // DATOS: Rutas detalladas
    const routeDetails = {
        "La Paz": [
            { type: "Bus Nocturno", time: "10 - 12 horas", price: "$15 - $30 USD", icon: <BusFront />, desc: "La opción más popular. Ahorras una noche de hotel. Busca buses 'Cama' (160° reclinación)." },
            { type: "Vuelo", time: "45 min - 1 hora", price: "$80 - $130 USD", icon: <Plane />, desc: "Vuelos diarios con BoA. Vistas aéreas espectaculares del Altiplano. Aterrizas en el aeropuerto Joya Andina." }
        ],
        "Sucre": [
            { type: "Bus Directo", time: "8 horas", price: "$10 - $20 USD", icon: <BusFront />, desc: "Carretera asfaltada y paisajes bonitos. Recomendado viajar de día para ver el paisaje." },
            { type: "Transporte Privado", time: "6 horas", price: "$150+ USD", icon: <Navigation />, desc: "Ideal para grupos. Permite paradas fotográficas en el camino." }
        ],
        "Villazón": [
            { type: "Tren Wara Wara", time: "9 horas", price: "$10 - $25 USD", icon: <TrainFront />, desc: "Una experiencia clásica. Sale desde la frontera con Argentina. Revisa los días de salida (no es diario)." }
        ],
        "San Pedro (Chile)": [
            { type: "Tour 3 Días", time: "3 días", price: "$200+ USD", icon: <MapPin />, desc: "La forma más aventurera. Cruzas la Reserva Eduardo Avaroa, lagunas de colores y géiseres hasta llegar al Salar." }
        ]
    };

    // ESTADO: Modal de imagen
    const [selectedItem, setSelectedItem] = useState(null); // Nuevo estado para el modal

    // DATOS: Equipaje CON IMÁGENES
    const packingList = {
        basic: [
            {
                name: "Gafas de Sol",
                desc: "Filtro UV 400 Real",
                img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800",
                tips: [
                    { icon: <ShieldCheck size={16} />, text: "El reflejo en la sal aumenta la radiación un 80%." },
                    { icon: <Wind size={16} />, text: "Usa correa, el viento en Isla Incahuasi es fuerte." }
                ]
            },
            {
                name: "Bloqueador Solar",
                desc: "Factor 50+ (Indispensable)",
                img: "https://www.laroche-posay.cl/-/media/project/loreal/brand-sites/lrp/america/latam/products/anthelios/shaka-fluid/shaka-fluid-spf50-plus-non-perfumed/lrp-anthelios-fluido-invisible-1200x1200-v2.png",
                tips: [
                    { icon: <Clock size={16} />, text: "Reaplicar cada 2 horas debido a la sudoración." },
                    { icon: <Lightbulb size={16} />, text: "No olvides orejas, labios y detrás del cuello." }
                ]
            },
            {
                name: "Hidratación",
                desc: "2 Litros por persona",
                img: "https://farmacorp.com/cdn/shop/files/909706_d78249d4-ece6-4b1a-bba0-626bdfc2a5d2.jpg?v=1759537974&width=800",
                tips: [
                    { icon: <Leaf size={16} />, text: "Usa botella reutilizable para no dejar plástico." },
                    { icon: <HeartPulse size={16} />, text: "La altura deshidrata el doble de rápido." }
                ]
            },
            {
                name: "Ropa en Capas",
                desc: "Térmica + Ligera",
                img: "/capas.webp",
                tips: [
                    { icon: <Flame size={16} />, text: "Primera capa térmica ajustada al cuerpo." },
                    { icon: <Wind size={16} />, text: "Cortavientos indispensable para la tarde." }
                ]
            },
            {
                name: "Botas Trekking",
                desc: "Suela antideslizante",
                img: "/botas.webp",
                tips: [
                    { icon: <ShieldAlert size={16} />, text: "La sal corroe el cuero, límpialas al volver." },
                    { icon: <Mountain size={16} />, text: "Suela con agarre para escalar la isla." }
                ]
            },
            {
                name: "Powerbank",
                desc: "El frío agota baterías",
                img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800",
                tips: [
                    { icon: <Zap size={16} />, text: "Mínimo 10,000 mAh para 2-3 cargas." },
                    { icon: <Thermometer size={16} />, text: "Guárdala dentro de tu ropa o bolsa de dormir." }
                ]
            }
        ],
        photo: [
            {
                name: "Trípode Robusto",
                desc: "Resistente al viento",
                img: "https://m.media-amazon.com/images/I/71GVn4b2TyL._AC_UF894,1000_QL80_.jpg",
                tips: [
                    { icon: <Wind size={16} />, text: "El viento nocturno puede derribar trípodes ligeros." },
                    { icon: <ShieldCheck size={16} />, text: "Lávalo luego, la sal oxida las patas metálicas." }
                ]
            },
            // ... puedes agregar tips a los demás ítems de foto igual ...
            { name: "Filtro Polarizador", desc: "Para el reflejo", img: "https://static.fnac-static.com/multimedia/Images/ES/NR/1d/51/04/282909/1540-1/tsp20170906110127/Hama-Filtro-Polarizador-Circular-72mm.jpg", tips: [{ icon: <Sun size={16} />, text: "Elimina el brillo blanco excesivo a mediodía." }] },
            { name: "Gran Angular", desc: "Para la inmensidad", img: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?q=80&w=800", tips: [{ icon: <Maximize size={16} />, text: "Ideal para capturar la Vía Láctea completa." }] },
            { name: "Kit de Limpieza", desc: "Sal y polvo dañan lentes", img: "https://tecnoplanet.mx/media/catalog/product/cache/8cd5a230797067cb5ac02bf70ef67749/1/6/1655402069.jpeg", tips: [{ icon: <ShieldAlert size={16} />, text: "Nunca limpies el lente con la polera, usa microfibra." }] },
            { name: "Baterías Extra", desc: "Mínimo 3 unidades", img: "https://www.camaralia.com/34422-home_default/anton-bauer-titon-base-kit-para-baterias-f-550.jpg", tips: [{ icon: <Thermometer size={16} />, text: "El frío descarga las baterías un 40% más rápido." }] },
            { name: "Disparador", desc: "Para fotos nocturnas", img: "https://www.fotomecanica.mx/media/catalog/product/cache/42278286db7a024dd142634a8b52937a/0/0/0000582_1.jpg", tips: [{ icon: <Sparkles size={16} />, text: "Evita la trepidación en largas exposiciones." }] }
        ]
    };
    return (
        <div className="bg-uyuni-white min-h-screen pt-20 pb-20">

            <div className="relative h-[60vh] w-full overflow-hidden mb-16 group">

                <div className="absolute inset-0 bg-black/30 z-10"></div>

                <img
                    src="/headerGuia.webp"
                    alt="Expedición Uyuni"
                    className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105"
                />

                <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center text-white p-4">
                    <span className="bg-uyuni-blue/80 backdrop-blur-md px-6 py-2 rounded-full text-xs font-bold mb-6 uppercase tracking-[0.2em] border border-white/20 animate-fade-in-up">
                        Manual de Supervivencia 2025
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black mb-6 drop-shadow-2xl tracking-tight">
                        GUÍA TOTAL
                    </h1>
                    <div className="flex gap-4 text-sm md:text-base font-light bg-black/40 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                        <span className="flex items-center gap-2"><Map size={18} /> 3,656 m.s.n.m</span>
                        <span className="w-px h-6 bg-white/30"></span>
                        <span className="flex items-center gap-2"><Thermometer size={18} /> -5°C a 20°C</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* BARRA LATERAL PEGAJOSA */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-28 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="font-bold text-uyuni-dark mb-6 text-sm uppercase tracking-wider text-gray-400">Índice</h3>
                            <nav className="space-y-2">
                                {[
                                    { id: 'clima', icon: <CloudRain size={18} />, label: 'Clima en Vivo' },
                                    { id: 'equipaje', icon: <Backpack size={18} />, label: 'Qué llevar' },
                                    { id: 'historia', icon: <Mountain size={18} />, label: 'Historia y Mitos' },
                                    { id: 'naturaleza', icon: <Binoculars size={18} />, label: 'Flora y Fauna' },
                                    { id: 'astro', icon: <Sparkles size={18} />, label: 'Astroturismo' },
                                    { id: 'foto', icon: <Aperture size={18} />, label: 'Tips Foto' },
                                    { id: 'tips', icon: <HeartPulse size={18} />, label: 'Salud y Altura' },
                                    { id: 'ubicacion', icon: <Map size={18} />, label: 'Mapas' },
                                ].map((item) => (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        className="flex items-center gap-3 p-3 rounded-xl text-gray-600 hover:bg-uyuni-blue hover:text-white transition-all group font-medium text-sm"
                                    >
                                        {item.icon}
                                        {item.label}
                                    </a>
                                ))}
                            </nav>

                            {/* Widget Resumen */}
                            <div className="mt-8 bg-gradient-to-br from-uyuni-dark to-slate-900 rounded-2xl p-4 text-white">
                                <p className="text-xs text-gray-400 mb-1">Estado del Parque</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="font-bold text-black">Abierto</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* CONTENIDO PRINCIPAL */}
                    <div id="clima" className="lg:col-span-9 space-y-24">

                        <div className="bg-gradient-to-r from-uyuni-blue to-sky-400 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden transition-all hover:scale-[1.01]">
                            {/* Ícono de fondo dinámico */}
                            <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                                {loadingWeather ? <Sun size={300} /> : getWeatherIcon(weather.iconCode)}
                            </div>

                            {loadingWeather ? (
                                <div className="animate-pulse flex gap-4 h-40">
                                    {/* Skeleton loader simple */}
                                    <div className="w-full bg-white/20 rounded-3xl"></div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
                                    {/* Columna Izquierda: Principal */}
                                    <div className="text-center md:text-left mb-8 md:mb-0">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2 opacity-90">
                                            <Map size={16} />
                                            <span className="uppercase tracking-widest text-sm font-bold">Uyuni, Bolivia</span>
                                        </div>
                                        <div className="text-9xl font-black tracking-tighter leading-none mb-2">
                                            {weather.temp}°
                                        </div>
                                        <p className="text-2xl font-medium capitalize flex items-center justify-center md:justify-start gap-2">
                                            {weather.desc}
                                        </p>
                                        <p className="text-sm mt-2 opacity-80">
                                            Sensación térmica: <strong>{weather.feels_like}°</strong>
                                        </p>
                                    </div>

                                    {/* Columna Derecha: Detalles Grid */}
                                    <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 w-full md:w-auto min-w-[300px]">
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                                            <div className="text-center">
                                                <Wind className="mx-auto mb-2 opacity-80" size={24} />
                                                <p className="text-xs uppercase tracking-wider opacity-70">Viento</p>
                                                <p className="font-bold text-xl">{weather.wind} <span className="text-sm font-normal">km/h</span></p>
                                            </div>
                                            <div className="text-center border-l border-white/20">
                                                <Droplets className="mx-auto mb-2 opacity-80" size={24} />
                                                <p className="text-xs uppercase tracking-wider opacity-70">Humedad</p>
                                                <p className="font-bold text-xl">{weather.humidity}<span className="text-sm font-normal">%</span></p>
                                            </div>
                                            <div className="text-center border-t border-white/20 pt-4">
                                                <Thermometer className="mx-auto mb-2 opacity-80" size={24} />
                                                <p className="text-xs uppercase tracking-wider opacity-70">Min / Max</p>
                                                <p className="font-bold text-lg">{weather.min}° / {weather.max}°</p>
                                            </div>
                                            <div className="text-center border-t border-l border-white/20 pt-4">
                                                <div className="mx-auto mb-2 opacity-80 text-center"><Sun size={24} className="mx-auto" /></div> {/* Usando Sun como icono genérico de visibilidad */}
                                                <p className="text-xs uppercase tracking-wider opacity-70">Visibilidad</p>
                                                <p className="font-bold text-lg">{weather.visibility} <span className="text-sm font-normal">km</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* --- SUB-SECCIÓN: TEMPORADAS Y RECOMENDACIONES --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                            {/* Card: Temporada de Lluvia (Espejo) */}
                            <div className="bg-white border border-blue-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                {/* Decoración de fondo */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full blur-3xl -z-10 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm">
                                        <CloudRain size={28} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-xl">Efecto Espejo</h3>
                                        <p className="text-blue-500 font-bold text-sm uppercase tracking-wide">Enero - Marzo</p>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                    El agua cubre el salar creando el espejo natural más grande del mundo. Caminarás sobre el cielo.
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl">
                                        <CheckCircle2 size={18} className="text-blue-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-700"><strong>Lo mejor:</strong> Atardeceres y fotos surrealistas con reflejos.</span>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl">
                                        <ShieldAlert size={18} className="text-amber-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-700"><strong>Ojo:</strong> Acceso restringido a Isla Incahuasi por exceso de agua.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Temporada Seca (Hexágonos) */}
                            <div className="bg-white border border-orange-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                {/* Decoración de fondo */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-full blur-3xl -z-10 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-sm">
                                        <Sun size={28} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-xl">Desierto Blanco</h3>
                                        <p className="text-orange-500 font-bold text-sm uppercase tracking-wide">Abril - Diciembre</p>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                    El suelo se seca y cristaliza formando patrones hexagonales geométricos perfectos hasta el horizonte.
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-orange-50/50 rounded-xl">
                                        <CheckCircle2 size={18} className="text-orange-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-700"><strong>Lo mejor:</strong> Acceso total a islas y fotos de "perspectiva forzada" (dinosaurios).</span>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl">
                                        <Thermometer size={18} className="text-blue-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-700"><strong>Ojo:</strong> Junio y Julio son los meses más fríos (noches de -15°C).</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* SECCIÓN 2: EQUIPAJE VISUAL (GALERÍA MODAL) */}
                        <section id="equipaje" className="scroll-mt-32">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                                    <Backpack size={32} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-bold text-uyuni-dark">Tu Mochila Ideal</h2>
                                    <p className="text-gray-500">Haz clic en los ítems para ver detalles.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden relative">
                                {/* Pestañas Superiores */}
                                <div className="flex border-b border-gray-100">
                                    <button
                                        onClick={() => setActiveTab('basic')}
                                        className={`flex-1 py-6 text-center font-bold text-lg transition-all ${activeTab === 'basic' ? 'bg-indigo-50 text-indigo-700 border-b-4 border-indigo-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                            }`}
                                    >
                                        Básico Esencial
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('photo')}
                                        className={`flex-1 py-6 text-center font-bold text-lg transition-all ${activeTab === 'photo' ? 'bg-indigo-50 text-indigo-700 border-b-4 border-indigo-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                            }`}
                                    >
                                        Kit Fotógrafo
                                    </button>
                                </div>

                                {/* Grid de Imágenes */}
                                <div className="p-8 md:p-10 bg-gray-50/50">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        {packingList[activeTab].map((item, index) => (
                                            <div
                                                key={index}
                                                onClick={() => setSelectedItem(item)}
                                                className="group bg-white rounded-2xl p-2 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border border-gray-100"
                                            >
                                                <div className="aspect-square rounded-xl overflow-hidden mb-3 relative">
                                                    <img
                                                        src={item.img}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ZoomIn className="text-white drop-shadow-md" />
                                                    </div>
                                                </div>
                                                <div className="text-center px-1 pb-2">
                                                    <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{item.name}</h4>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {selectedItem && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-uyuni-dark/90 backdrop-blur-sm animate-in fade-in duration-300"
                                    onClick={() => setSelectedItem(null)}
                                >
                                    <div
                                        className="bg-white rounded-[2rem] overflow-hidden max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col md:flex-row"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => setSelectedItem(null)}
                                            className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-all z-20"
                                        >
                                            <X size={20} />
                                        </button>

                                        {/* COLUMNA IMAGEN */}
                                        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                                            <img
                                                src={selectedItem.img}
                                                alt={selectedItem.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r"></div>
                                            <div className="absolute bottom-0 left-0 p-6 text-white">
                                                <h3 className="text-3xl font-bold mb-1 leading-tight">{selectedItem.name}</h3>
                                                <span className="inline-flex items-center gap-1 bg-indigo-500/90 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                                                    <CheckCircle2 size={12} /> Recomendado
                                                </span>
                                            </div>
                                        </div>

                                        {/* COLUMNA INFORMACIÓN */}
                                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-between bg-white">
                                            <div>
                                                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Función Principal</h4>
                                                <p className="text-gray-700 text-lg leading-relaxed mb-8 font-medium">
                                                    {selectedItem.desc}.
                                                </p>

                                                {/* SECCIÓN DE TIPS CON ICONOS */}
                                                {selectedItem.tips && (
                                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                                        <h5 className="text-indigo-600 font-bold text-sm mb-3 flex items-center gap-2">
                                                            <Lightbulb size={18} className="fill-indigo-100" /> Tips de Experto
                                                        </h5>
                                                        <ul className="space-y-3">
                                                            {selectedItem.tips.map((tip, idx) => (
                                                                <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                                                                    <div className="mt-0.5 text-indigo-400 bg-indigo-50 p-1 rounded-md">
                                                                        {tip.icon}
                                                                    </div>
                                                                    <span className="leading-snug">{tip.text}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-gray-100 text-right">
                                                <button
                                                    onClick={() => setSelectedItem(null)}
                                                    className="text-gray-500 font-semibold hover:text-indigo-600 hover:bg-indigo-50 px-6 py-2 rounded-xl transition-all text-sm"
                                                >
                                                    Cerrar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                        {/* SECCIÓN: HISTORIA Y LEYENDAS (ESTILO STORYTELLING) */}
                        <section id="historia" className="scroll-mt-32">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-orange-50 rounded-2xl text-orange-600">
                                    <Mountain size={32} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-bold text-uyuni-dark">Origen Sagrado</h2>
                                    <p className="text-gray-500">Donde la mitología y la geología se encuentran.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
                                <div className="grid grid-cols-1 lg:grid-cols-2">

                                    {/* COLUMNA VISUAL (FOTO TUNUPA) */}
                                    <div className="relative h-[500px] lg:h-auto group">
                                        <img
                                            src="/tunupa.webp"
                                            alt="Volcán Tunupa"
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10">
                                            <div className="bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit mb-3">
                                                Cosmovisión Andina
                                            </div>
                                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">La Tristeza de Tunupa</h3>
                                            <p className="text-orange-100 text-sm italic">
                                                "Las montañas antes caminaban, hablaban y amaban..."
                                            </p>
                                        </div>
                                    </div>

                                    {/* COLUMNA TEXTO (MITO VS CIENCIA) */}
                                    <div className="p-8 md:p-12 flex flex-col justify-center">

                                        {/* El Mito */}
                                        <div className="mb-10">
                                            <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm">1</span>
                                                La Leyenda
                                            </h4>
                                            <p className="text-gray-600 leading-relaxed">
                                                Cuentan los abuelos que <strong>Tunupa</strong> (el volcán) era una mujer hermosa casada con <strong>Kusku</strong>. Cuando él la traicionó y huyó con otra montaña (Cousiña), Tunupa lloró desconsoladamente mientras amamantaba a su hijo.
                                            </p>
                                            <p className="text-gray-600 leading-relaxed mt-4 border-l-4 border-orange-200 pl-4 italic">
                                                Sus lágrimas saladas se mezclaron con la leche materna y derramaron sobre la árida planicie, formando así el inmaculado manto blanco que hoy conocemos como el Salar.
                                            </p>
                                        </div>

                                        {/* La Ciencia (Contrastada) */}
                                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                            <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2 relative z-10">
                                                <span className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs">2</span>
                                                La Realidad Geológica
                                            </h4>
                                            <p className="text-sm text-slate-600 leading-relaxed relative z-10">
                                                Hace <strong>40.000 años</strong>, esta zona era parte del gigantesco lago prehistórico <strong>Minchin</strong>. Al evaporarse debido al cambio climático y la falta de desagües al mar, dejó capas de sal de hasta 120 metros de profundidad, ricas en litio, potasio y magnesio.
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </section>
                        {/* SECCIÓN 3: FLORA Y FAUNA (GUÍA DE CAMPO PRO) */}
                        <section id="naturaleza" className="scroll-mt-32">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                                    <Binoculars size={32} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-bold text-uyuni-dark">Vida en el Desierto</h2>
                                    <p className="text-gray-500">Un ecosistema frágil y único en el mundo.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* 1. TARJETA DESTACADA: LOS FLAMENCOS (Ocupa 8 columnas) */}
                                <div className="md:col-span-8 group relative h-[500px] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-xl">
                                    <img
                                        src="https://gouyuni.com/wp-content/uploads/2017/06/FLAMENCO-LAGUNA-COLORADA-TOUR-SALAR-DE-UYUNI.jpg"
                                        alt="Flamencos"
                                        className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-10">
                                        <div className="mb-4">
                                            <span className="bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                Ave Emblemática
                                            </span>
                                        </div>
                                        <h3 className="text-4xl font-bold text-white mb-2">La Danza Rosa</h3>
                                        <p className="text-white text-lg leading-relaxed max-w-2xl mb-6">
                                            No es solo uno, son <strong>tres tipos de flamencos</strong> los que tiñen las lagunas. Su color proviene de la <strong>artemia salina</strong>, un crustáceo microscópico rico en betacarotenos que habita estas aguas volcánicas.
                                        </p>

                                        <div className="grid grid-cols-3 gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                            <div>
                                                <p className="text-pink-300 text-xs font-bold uppercase">Más Común</p>
                                                <p className="text-white font-semibold">Flamenco Chileno</p>
                                            </div>
                                            <div>
                                                <p className="text-pink-300 text-xs font-bold uppercase">Más Grande</p>
                                                <p className="text-white font-semibold">Flamenco Andino</p>
                                            </div>
                                            <div>
                                                <p className="text-pink-300 text-xs font-bold uppercase">Más Raro</p>
                                                <p className="text-white font-semibold">Flamenco de James</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. TARJETA LATERAL: CACTUS (Ocupa 4 columnas) */}
                                <div className="md:col-span-4 rounded-[2.5rem] relative overflow-hidden shadow-xl group">
                                    {/* 1. IMAGEN ORIGINAL LIMPIA (Sin efectos de mezcla) */}
                                    <img
                                        src="https://thumbs.dreamstime.com/b/cactus-uyuni-salt-flats-bolivia-island-incahuasi-visible-below-51711470.jpg"
                                        alt="Cactus"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />

                                    {/* 2. FILTRO GRADIENTE (Para que se lean las letras) */}
                                    {/* Capa oscura transparente que va de abajo (90% negro) hacia arriba (20% negro) */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20"></div>

                                    {/* CONTENIDO DE TEXTO (Sin cambios, solo asegurando z-10) */}
                                    <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                                        <div>
                                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-300 mb-4 backdrop-blur-sm">
                                                <Mountain size={24} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-sm">Guardianes Espinosos</h3>
                                            <p className="text-emerald-100 text-sm drop-shadow-sm">
                                                Los <strong>Trichocereus Pasacana</strong> de la Isla Incahuasi son fósiles vivientes.
                                            </p>
                                        </div>
                                        <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border-l-4 border-emerald-500">
                                            <p className="text-4xl font-bold text-white">1 cm</p>
                                            <p className="text-xs text-gray-300 uppercase tracking-widest">Crecimiento por año</p>
                                            <p className="text-xs text-emerald-300 mt-2">¡Un cactus de 12m tiene 1,200 años!</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. TARJETAS INFERIORES: FAUNA ANDINA */}
                                <div className="md:col-span-4 bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4 mb-4">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Vicu%C3%B1a_standing.svg/1707px-Vicu%C3%B1a_standing.svg.png" alt="Vicuña" className="w-12 h-12 opacity-80" />
                                        <div>
                                            <h4 className="font-bold text-gray-800">Vicuña</h4>
                                            <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Protegida</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">Posee la lana más fina del mundo. Son salvajes y viven en manadas cerca de los volcanes.</p>
                                </div>

                                <div className="md:col-span-4 bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4 mb-4">
                                        <img src="https://scontent.fcbb1-1.fna.fbcdn.net/v/t1.6435-9/69542378_2240237419437881_4699502723647668224_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=0b6b33&_nc_ohc=IismxDrpVmsQ7kNvwGwtty6&_nc_oc=Adn3JTQ165DmRvGooo6JNq01r4RmzwEug2JTAJUknYoiW4qJx3TDPqOkmfp9FUpLxEY&_nc_zt=23&_nc_ht=scontent.fcbb1-1.fna&_nc_gid=q13mJNlBIpZSAM4GkKGevw&oh=00_AfnGwC2xky4HwllMD9qyOLDWRyhJ2ga2DERB9X2nbr8BYw&oe=696CB6F5" alt="Zorro" className="w-12 h-12 opacity-80" />
                                        <div>
                                            <h4 className="font-bold text-gray-800">Zorro Culpeo</h4>
                                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Oportunista</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">A menudo se acercan a los jeeps turísticos buscando comida. ¡Por favor, no los alimentes!</p>
                                </div>

                                <div className="md:col-span-4 bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4 mb-4">
                                        <img src="https://png.pngtree.com/png-clipart/20230813/original/pngtree-cartoon-funny-viscacha-comic-animal-character-vector-gray-rodents-vector-picture-image_10555296.png" alt="Viscacha" className="w-12 h-12 opacity-80" />
                                        <div>
                                            <h4 className="font-bold text-gray-800">Viscacha</h4>
                                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Roedor</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">Parece un conejo con cola de ardilla. Se la pasa tomando sol sobre las rocas de las islas.</p>
                                </div>
                            </div>

                            {/* WIDGET: CALENDARIO */}
                            <div className="mt-8 bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Calendar className="text-uyuni-blue" /> Calendario de Vida Silvestre
                                </h4>
                                <div className="grid grid-cols-4 md:grid-cols-12 gap-2 text-center text-xs">
                                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month, i) => (
                                        <div key={month} className={`p-3 rounded-xl flex flex-col gap-1 items-center justify-center border transition-all ${[10, 11, 0, 1].includes(i) // Nov, Dic, Ene, Feb (Flamencos)
                                            ? 'bg-pink-100 border-pink-200 text-pink-700 font-bold shadow-sm scale-105'
                                            : 'bg-white border-gray-100 text-gray-400'
                                            }`}>
                                            <span>{month}</span>
                                            {[10, 11, 0, 1].includes(i) && <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-center text-xs text-gray-400 mt-4">
                                    <span className="inline-block w-2 h-2 bg-pink-500 rounded-full mr-1"></span>
                                    Temporada alta de Flamencos (Migración y Cría)
                                </p>
                            </div>
                        </section>

                        {/* SECCIÓN 4: ASTROTURISMO */}
                        <section id="astro" className="scroll-mt-32">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-slate-800 rounded-2xl text-yellow-400">
                                    <Sparkles size={32} />
                                </div>
                                <h2 className="text-4xl font-bold text-uyuni-dark">Cielos Infinitos</h2>
                            </div>

                            <div className="bg-slate-900 rounded-[2rem] overflow-hidden relative shadow-2xl">
                                <div className="absolute inset-0 opacity-40">
                                    <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200" className="w-full h-full object-cover" alt="Estrellas" />
                                </div>
                                <div className="relative z-10 p-10 md:p-14 text-white">
                                    <h3 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                                        Astroturismo en Uyuni
                                    </h3>
                                    <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">
                                        Sin contaminación lumínica y a 3.600 metros de altura, Uyuni ofrece una ventana directa al cosmos. Es uno de los pocos lugares en el mundo donde puedes ver tu sombra proyectada solo por la luz de la Vía Láctea.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                                            <h4 className="font-bold text-yellow-400 mb-2">🔭 Invierno (Jun-Ago)</h4>
                                            <p className="text-sm text-slate-300">Cielos cristalinos. Perfecto para ver el centro galáctico de la Vía Láctea con máxima claridad.</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                                            <h4 className="font-bold text-blue-300 mb-2">💧 Verano (Ene-Mar)</h4>
                                            <p className="text-sm text-slate-300">Si llueve, el agua refleja las estrellas. Caminarás literalmente "sobre el cielo".</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 5: TIPS DE FOTOGRAFÍA (MASTERCLASS COMPLETA) */}
                        <section id="foto" className="scroll-mt-32">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-pink-50 rounded-2xl text-pink-600">
                                    <Aperture size={32} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-bold text-uyuni-dark">Masterclass de Fotografía</h2>
                                    <p className="text-gray-500">Cómo lograr las fotos icónicas del Salar.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* COLUMNA IZQUIERDA: GUÍA TÉCNICA */}
                                <div className="lg:col-span-7 space-y-8">
                                    <div className="bg-white border border-gray-100 p-8 rounded-[2rem] shadow-lg relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Maximize size={100} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            🦖 El Truco de la Perspectiva
                                        </h3>
                                        <p className="text-gray-600 mb-6 leading-relaxed">
                                            Al no haber horizonte visible, el cerebro pierde la referencia de profundidad. Para lograr la foto donde un juguete parece gigante y devora a tus amigos, sigue esta fórmula:
                                        </p>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                                                <div className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">Posición de la Cámara</h4>
                                                    <p className="text-sm text-gray-600">Coloca la cámara o celular <strong>a ras del suelo</strong>. Es vital para fusionar el primer plano con el fondo.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                                                <div className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">La Distancia</h4>
                                                    <p className="text-sm text-gray-600">Objeto pequeño (dinosaurio) muy cerca del lente. Persona lejos (a unos 5-10 metros).</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                                                <div className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">El Enfoque (Vital)</h4>
                                                    <p className="text-sm text-gray-600">Si usas cámara profesional, usa una apertura cerrada (f/11 o f/16) para que tanto el juguete como la persona salgan nítidos.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: CHEAT SHEET & EJEMPLOS */}
                                <div className="lg:col-span-5 space-y-6">
                                    <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500 rounded-full blur-[60px] opacity-20"></div>
                                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                            <Sliders size={20} className="text-pink-400" /> Ajustes Pro
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                                <span className="text-gray-400 text-sm">Apertura (Día)</span>
                                                <span className="font-mono font-bold text-pink-300">f/8 - f/16</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                                <span className="text-gray-400 text-sm">ISO (Día)</span>
                                                <span className="font-mono font-bold text-pink-300">100</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                                <span className="text-gray-400 text-sm">Velocidad (Salto)</span>
                                                <span className="font-mono font-bold text-pink-300">1/500s +</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-gray-400 text-sm">Estrellas (Noche)</span>
                                                <span className="font-mono font-bold text-yellow-300">f/2.8, 20s, ISO 3200</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-[2rem] p-8 text-white shadow-lg relative overflow-hidden group">
                                        <img src="https://www.photopills.com/sites/default/files/articles/2024/day_7.6-salar-uyuni-sunset.jpg" alt="Sunset" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                                        <div className="relative z-10">
                                            <h4 className="font-bold text-xl mb-2">Hora Dorada</h4>
                                            <p className="text-sm opacity-90 mb-4">El atardecer crea texturas en los hexágonos de sal que no se ven al mediodía.</p>
                                            <div className="flex gap-2">
                                                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">Contraluz</span>
                                                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">Sombras Largas</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 6: SALUD Y ALTURA (#tips) */}
                        <section id="tips" className="scroll-mt-32">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-red-50 rounded-2xl text-red-500">
                                    <HeartPulse size={32} />
                                </div>
                                <h2 className="text-4xl font-bold text-uyuni-dark">Salud y Altura</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-1 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                                    <div>
                                        <h4 className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-1">Oxígeno Relativo</h4>
                                        <p className="text-4xl font-bold text-red-400">65%</p>
                                        <p className="text-sm opacity-60">vs Nivel del mar</p>
                                    </div>
                                    <div className="mt-8">
                                        <div className="flex items-end gap-2 h-32 border-b border-white/20 pb-2">
                                            <div className="w-1/3 bg-gray-600 rounded-t-lg h-[20%] relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Lima</span></div>
                                            <div className="w-1/3 bg-gray-500 rounded-t-lg h-[60%] relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Cusco</span></div>
                                            <div className="w-1/3 bg-red-500 rounded-t-lg h-[100%] relative shadow-[0_0_20px_rgba(239,68,68,0.5)]"><span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold bg-white text-red-600 px-2 py-1 rounded">Uyuni</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-lg">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <ShieldAlert className="text-red-500" /> Protocolo Anti-Sorojchi
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">1</div>
                                                <div><h5 className="font-bold text-gray-800">Aclimatación</h5><p className="text-sm text-gray-600">Pasa al menos 1 día en La Paz o Sucre antes.</p></div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">2</div>
                                                <div><h5 className="font-bold text-gray-800">Hidratación</h5><p className="text-sm text-gray-600">Bebe 3L de agua. El aire seco deshidrata.</p></div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-2xl">
                                            <h5 className="font-bold text-gray-800 mb-2">Botiquín</h5>
                                            <ul className="space-y-2 text-sm text-gray-600">
                                                <li className="flex items-center gap-2">🍃 <strong>Mate de Coca:</strong> Ayuda mucho.</li>
                                                <li className="flex items-center gap-2">💊 <strong>Sorojchi Pills:</strong> En farmacias locales.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 7: MAPAS (#ubicacion) */}
                        {/* SECCIÓN 7: MAPAS Y RUTAS (CENTRO DE PLANIFICACIÓN) */}
                        <section id="ubicacion" className="scroll-mt-32">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-purple-50 rounded-2xl text-purple-600">
                                        <Map size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-bold text-uyuni-dark">Cómo Llegar</h2>
                                        <p className="text-gray-500">Planifica tu ruta desde las principales ciudades.</p>
                                    </div>
                                </div>
                                {/* Botón externo a Google Maps */}
                                <a
                                    href="https://www.google.com/maps/dir//Salar+de+Uyuni,+Bolivia"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden md:flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                                >
                                    <Navigation size={18} /> Ver Ruta en GPS
                                </a>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                                {/* COLUMNA IZQUIERDA: SELECTOR Y DETALLES */}
                                <div className="lg:col-span-5 space-y-6">
                                    {/* Selector de Ciudad */}
                                    <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 flex flex-wrap gap-1">
                                        {Object.keys(routeDetails).map((city) => (
                                            <button
                                                key={city}
                                                onClick={() => setSelectedRoute(city)}
                                                className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${selectedRoute === city
                                                    ? 'bg-purple-100 text-purple-700 shadow-sm'
                                                    : 'text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tarjetas de Opciones de Transporte */}
                                    <div className="space-y-4">
                                        {routeDetails[selectedRoute].map((option, idx) => (
                                            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                                                            {option.icon}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-800">{option.type}</h4>
                                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tiempo Aprox.</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block font-bold text-lg text-purple-600">{option.price}</span>
                                                        <span className="text-xs text-gray-400">{option.time}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed border border-gray-100">
                                                    💡 {option.desc}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: MAPA INTERACTIVO REAL */}
                                <div className="lg:col-span-7">
                                    <div className="bg-white p-2 rounded-[2.5rem] shadow-xl border border-gray-100 h-full min-h-[500px] relative group overflow-hidden">
                                        <iframe
                                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d238128.5623694065!2d-67.7558004924712!3d-20.26786523932731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91552861c2957b93%3A0x6730303620302030!2sSalar%20de%20Uyuni!5e0!3m2!1ses!2sbo!4v1708456789012!5m2!1ses!2sbo"
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0, borderRadius: '2rem' }}
                                            allowFullScreen=""
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
                                        ></iframe>

                                        {/* Overlay Informativo (Flotante) */}
                                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg flex items-center justify-between pointer-events-none">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm font-bold text-gray-700">Ubicación Satelital en Vivo</span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-mono">20°08'01.6"S 67°29'20.9"W</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Guide;