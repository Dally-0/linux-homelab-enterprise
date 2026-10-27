import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToHash() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        // Si la URL tiene un # (ej: #clima)
        if (hash) {
            // Esperamos un milisegundo para asegurar que la página cargó
            setTimeout(() => {
                const element = document.getElementById(hash.replace('#', ''));
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            // Si no hay hash, ir arriba de todo (cambio de página normal)
            window.scrollTo(0, 0);
        }
    }, [pathname, hash]);

    return null;
}