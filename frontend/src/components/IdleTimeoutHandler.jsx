import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const FIVE_MINUTES = 5 * 60 * 1000; // 300,000 milisegundos

export const IdleTimeoutHandler = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const timerRef = useRef(null);

    const handleLogout = () => {
        // 1. Limpiamos el token y usuario de esta pestaña
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        // 2. Redirigimos al login
        navigate('/login', { replace: true });
    };

    const resetTimer = () => {
        // Si hay un temporizador corriendo, lo cancelamos para iniciar uno nuevo
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        
        // Solo activamos el contador si el usuario NO está en la página de login
        if (location.pathname !== '/login') {
            timerRef.current = setTimeout(handleLogout, FIVE_MINUTES);
        }
    };

    useEffect(() => {
        // Eventos del navegador que indican que el usuario está activo
        const events = [
            'mousemove',
            'keydown',
            'click',
            'scroll',
            'touchstart'
        ];

        // Arrancamos el temporizador la primera vez
        resetTimer();

        // Escuchamos los eventos en la ventana del navegador
        events.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        // Limpieza de eventos y timers cuando el componente se desmonte
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [location.pathname]); // Se reinicia el efecto de forma segura si cambia la ruta

    return children;
};