import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './pages/ProtectedRoute';
import { IdleTimeoutHandler } from './components/IdleTimeoutHandler';
import Dashboard from './pages/Dashboard';
import Marcas from './pages/Marcas';
import Sucursales from './pages/Sucursales';
import Modelos from './pages/Modelos';
import Grupos from './pages/Grupos';
import Areas from './pages/Areas';
import Empleados from './pages/Empleados';
import TiposEquipo from './pages/TiposEquipo';
import Inventario from './pages/Inventario';
import Asignaciones from './pages/Asignaciones';
import Reparaciones from './pages/Reparaciones';
import Usuarios from './pages/Usuarios';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                {/* ESTRUCTURA DE LAYOUT ANIDADO */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<IdleTimeoutHandler />}>
                        <Route path="/dashboard"    element={<Dashboard />} />
                        <Route path="/inventario"   element={<Inventario />} />
                        <Route path="/asignaciones" element={<Asignaciones />} />
                        <Route path="/reparaciones" element={<Reparaciones />} />
                        <Route path="/empleados"    element={<Empleados />} />
                        <Route path="/areas"        element={<Areas />} />
                        <Route path="/sucursales"   element={<Sucursales />} />
                        <Route path="/grupos"       element={<Grupos />} />
                        <Route path="/marcas"       element={<Marcas />} />
                        <Route path="/modelos"      element={<Modelos />} />
                        <Route path="/tipos-equipo" element={<TiposEquipo />} />
                    </Route>
                </Route>

                <Route element={<ProtectedRoute adminOnly />}>
                    <Route element={<IdleTimeoutHandler />}>
                        <Route path="/usuarios" element={<Usuarios />} />
                    </Route>
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;