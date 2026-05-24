import { useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const FIVE_MINUTES = 5 * 60 * 1000;

export const IdleTimeoutHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const timerRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        navigate('/login', { replace: true });
    };

    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (window.location.pathname === '/login') {
            return;
        }

        timerRef.current = setTimeout(handleLogout, FIVE_MINUTES);
    };

    useEffect(() => {
        if (location.pathname === '/login') {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        resetTimer();

        events.forEach((event) => {
            window.addEventListener(event, resetTimer, { passive: true });
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, []);

    return <Outlet />;
};