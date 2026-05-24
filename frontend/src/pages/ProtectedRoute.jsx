import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ adminOnly = false }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // 1. Si no hay token, el usuario NO está logueado
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. Validación de rol con tolerancia a formatos de Go
    const userRol = (user.rol || user.Rol || user.role || '').toUpperCase().trim();
    
    if (adminOnly && userRol !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    // 3. Outlet renderiza los componentes hijos (Dashboard, Inventario, etc.) 
    // de forma directa y sin re-validar el padre en cada movimiento.
    return <Outlet />;
};

export default ProtectedRoute;