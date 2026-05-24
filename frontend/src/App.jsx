import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { IdleTimeoutHandler } from './components/IdleTimeoutHandler'; // <-- AGREGADO: Importamos el detector
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

// Rutas normales (cualquier usuario autenticado)
const Protect = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

// Rutas exclusivas de administrador
const AdminRoute = ({ children }) => <ProtectedRoute adminOnly>{children}</ProtectedRoute>;

function App() {
    return (
        <BrowserRouter>
            {/* <-- AGREGADO: Envolvemos todas las rutas con el detector de inactividad */}
            <IdleTimeoutHandler>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/dashboard"    element={<Protect><Dashboard /></Protect>} />
                    <Route path="/inventario"   element={<Protect><Inventario /></Protect>} />
                    <Route path="/asignaciones" element={<Protect><Asignaciones /></Protect>} />
                    <Route path="/reparaciones" element={<Protect><Reparaciones /></Protect>} />
                    <Route path="/empleados"    element={<Protect><Empleados /></Protect>} />
                    <Route path="/areas"        element={<Protect><Areas /></Protect>} />
                    <Route path="/sucursales"   element={<Protect><Sucursales /></Protect>} />
                    <Route path="/grupos"       element={<Protect><Grupos /></Protect>} />
                    <Route path="/marcas"       element={<Protect><Marcas /></Protect>} />
                    <Route path="/modelos"      element={<Protect><Modelos /></Protect>} />
                    <Route path="/tipos-equipo" element={<Protect><TiposEquipo /></Protect>} />

                    {/* Solo ADMIN — VIEWER es redirigido al dashboard */}
                    <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </IdleTimeoutHandler>
        </BrowserRouter>
    );
}

export default App;