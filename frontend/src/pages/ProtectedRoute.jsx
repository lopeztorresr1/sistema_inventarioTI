import { Navigate } from 'react-router-dom';

// ProtectedRoute valida que:
//   1. El usuario esté autenticado (tiene token)
//   2. Si la ruta requiere un rol específico (adminOnly), que el usuario lo tenga

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.rol !== 'ADMIN') {
        // El usuario está autenticado pero no tiene permisos: manda al dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;