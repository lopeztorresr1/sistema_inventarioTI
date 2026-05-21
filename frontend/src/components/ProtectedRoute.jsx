import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Si no hay token, lo manda al login
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;