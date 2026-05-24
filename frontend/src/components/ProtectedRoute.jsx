import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // CAMBIO: Ahora leemos el token desde sessionStorage para aislar cada pestaña
    const token = sessionStorage.getItem('token');
    
    if (!token) {
        // Si no hay token en esta pestaña, lo manda al login
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;