import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    // 🛠️ CORRECCIÓN: Desactivamos withCredentials porque usas Bearer Token manual
    // Esto evita que el navegador bloquee tu cabecera por políticas de CORS estrictas.
    withCredentials: false 
});

// Adjunta el token JWT en cada petición
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Manejo de respuestas globales blindado
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Solo redirigir si el error es 401 Y estamos seguros de que no es un error de carga inicial
        if (error.response?.status === 401) {
            const enLogin = window.location.pathname.includes('/login');
            
            if (!enLogin) {
                // Limpieza limpia
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Usamos replace en lugar de href para no contaminar el historial
                window.location.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default api;