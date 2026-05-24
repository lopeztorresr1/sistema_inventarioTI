import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Monitor, Users, Settings, LogOut, ChevronLeft,
    Box, MapPin, Tags, Cpu, Wrench, Layers, Users2, UserCog, Palette
} from 'lucide-react';
import api from '../api/axios';
import { applyTheme, THEMES } from '../theme/themes'; 

const Sidebar = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved && THEMES[saved] ? saved : 'dark';
    });

    const navigate  = useNavigate();
    const location  = useLocation();

    // ─── CORRECCIÓN CRÍTICA DE ALMACENAMIENTO Y TOLERANCIA DE GO ───────────
    const user      = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Mapeo seguro del rol (acepta 'rol', 'Rol', 'role') y lo fuerza a mayúsculas
    const userRol   = (user.rol || user.Rol || user.role || user.Role || '').toUpperCase().trim();
    const isAdmin   = userRol === 'ADMIN';

    // Mapeo seguro del nombre del operador logueado
    const userName  = user.nombre || user.Nombre || user.username || user.Username || user.email || 'Operador';
    // ───────────────────────────────────────────────────────────────────────

    useEffect(() => {
        applyTheme(currentTheme);
    }, [currentTheme]);

    const menuGroups = [
        {
            label: 'Principal',
            items: [
                { name: 'Resumen',    icon: <LayoutDashboard size={20}/>, path: '/dashboard' },
                { name: 'Inventario', icon: <Monitor size={20}/>,         path: '/inventario' },
            ]
        },
        {
            label: 'Organización',
            items: [
                { name: 'Empleados',  icon: <Users size={20}/>,   path: '/empleados' },
                { name: 'Sucursales', icon: <MapPin size={20}/>,   path: '/sucursales' },
                { name: 'Grupos',     icon: <Users2 size={20}/>,   path: '/grupos' },
                { name: 'Áreas',      icon: <Layers size={20}/>,   path: '/areas' },
            ]
        },
        {
            label: 'Configuración TI',
            items: [
                { name: 'Tipos de Equipo', icon: <Cpu size={20}/>,      path: '/tipos-equipo' },
                { name: 'Marcas',          icon: <Tags size={20}/>,     path: '/marcas' },
                { name: 'Modelos',         icon: <Settings size={20}/>, path: '/modelos' },
            ]
        },
        {
            label: 'Operaciones',
            items: [
                { name: 'Asignaciones', icon: <Box size={20}/>,   path: '/asignaciones' },
                { name: 'Reparaciones', icon: <Wrench size={20}/>, path: '/reparaciones' },
            ]
        },
        ...(isAdmin ? [{
            label: 'Administración',
            items: [
                { name: 'Usuarios', icon: <UserCog size={20}/>, path: '/usuarios' },
            ]
        }] : []),
    ];

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Continuar con borrado local si falla la red
        } finally {
            // ─── CORRECCIÓN DE LOGOUT LIMPIO ───────────────────────────────
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear(); // Por seguridad si quedaban rastros viejos
            navigate('/login');
        }
    };

    const rotateTheme = () => {
        const order = ['dark', 'light', 'matrix'];
        const nextIndex = (order.indexOf(currentTheme) + 1) % order.length;
        setCurrentTheme(order[nextIndex]);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex min-h-screen transition-colors duration-500 bg-bg-app text-text-primary">

            {/* BARRA LATERAL */}
            <aside className={`relative border-r transition-all duration-500 ease-in-out flex flex-col shadow-2xl z-20 ${
                isCollapsed ? 'w-20' : 'w-64'
            } bg-bg-sidebar border-border-app`}>

                {/* LOGO INSTITUCIONAL */}
                <div className="p-6 flex items-center gap-3 border-b border-border-app h-20 shrink-0">
                    <div className="bg-accent p-2 rounded-xl text-white shadow-lg shadow-accent/30 shrink-0 transition-colors duration-500">
                        <Box size={24}/>
                    </div>
                    {!isCollapsed && (
                        <span className="font-black tracking-tighter text-lg whitespace-nowrap italic text-text-primary">
                            INVENTARIO <span className="text-accent transition-colors duration-500">TI</span>
                        </span>
                    )}
                </div>

                {/* MENÚS DE NAVEGACIÓN */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 custom-scrollbar scroll-smooth">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="mb-8">
                            {!isCollapsed && (
                                <p className={`px-8 mb-3 text-[10px] font-black uppercase tracking-[0.25em] ${
                                    group.label === 'Administración' ? 'text-amber-500' : 'text-text-muted'
                                }`}>
                                    {group.label}
                                </p>
                            )}
                            <div className="px-4 space-y-1.5">
                                {group.items.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => navigate(item.path)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-custom transition-all duration-300 group relative cursor-pointer ${
                                            isActive(item.path)
                                                ? 'bg-accent/10 text-accent border border-accent/20'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
                                        }`}
                                    >
                                        {isActive(item.path) && (
                                            <div className="absolute left-0 w-1 h-6 bg-accent rounded-r-full shadow-[0_0_10px_var(--accent)]"/>
                                        )}
                                        <span className={`shrink-0 transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                                            {item.icon}
                                        </span>
                                        {!isCollapsed && (
                                            <span className="font-bold text-sm tracking-tight">{item.name}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* PIE DE PÁGINA (OPERADOR VINCULADO AL LOCALSTORAGE) */}
                <div className="p-4 border-t border-border-app bg-bg-card-hover shrink-0">
                    {!isCollapsed && (
                        <div className="px-4 mb-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Operador</p>
                            <p className="text-sm font-black truncate text-text-primary">
                                {userName}
                            </p>
                            <span className={`mt-1 inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isAdmin ? 'text-amber-400 bg-amber-400/10' : 'text-accent bg-accent/10'
                            }`}>
                                {isAdmin ? '⚡ Admin' : '👁 Solo lectura'}
                            </span>
                        </div>
                    )}

                    {/* SELECTOR DE TEMAS */}
                    <div className="mb-2 px-2">
                        {isCollapsed ? (
                            <button
                                onClick={rotateTheme}
                                className="w-full flex items-center justify-center p-3 rounded-xl bg-bg-input border border-border-app text-accent hover:bg-bg-app transition-all shadow-sm cursor-pointer"
                                title={`Tema actual: ${THEMES[currentTheme]?.label}`}
                            >
                                <span className="text-lg leading-none">{THEMES[currentTheme]?.emoji}</span>
                            </button>
                        ) : (
                            <div className="relative flex items-center bg-bg-input border border-border-app rounded-xl px-3 py-2.5 focus-within:border-accent transition-all">
                                <Palette size={16} className="text-text-muted mr-2 shrink-0" />
                                <select
                                    value={currentTheme}
                                    onChange={(e) => setCurrentTheme(e.target.value)}
                                    className="w-full bg-transparent text-xs font-bold uppercase tracking-wider text-text-primary outline-none appearance-none pr-4 cursor-pointer"
                                >
                                    {Object.entries(THEMES).map(([key, t]) => (
                                        <option key={key} value={key} className="bg-bg-card text-text-primary font-bold">
                                            {t.emoji} {t.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 pointer-events-none text-[8px] text-text-muted">▼</div>
                            </div>
                        )}
                    </div>

                    {/* BOTÓN DE CIERRE DE SESIÓN */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all group cursor-pointer"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/>
                        {!isCollapsed && <span className="font-black text-[11px] uppercase tracking-widest">Cerrar Sesión</span>}
                    </button>
                </div>

                {/* BOTÓN DE COLAPSADO */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-10 bg-accent text-white rounded-full p-1.5 border-2 border-bg-app hover:scale-110 transition-all z-50 shadow-xl cursor-pointer"
                >
                    {isCollapsed ? <ChevronLeft size={12} className="rotate-180"/> : <ChevronLeft size={12}/>}
                </button>
            </aside>

            {/* CONTENEDOR PRINCIPAL */}
            <main className="flex-1 h-screen overflow-auto relative transition-colors duration-500 bg-bg-app">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000 bg-accent/5 opacity-40"/>
                <div className="relative z-10 p-10 max-w-[1600px] mx-auto transition-all duration-500 text-text-primary
                    [&_h1]:text-text-primary [&_h2]:text-text-primary [&_p]:text-text-secondary [&_td]:text-text-secondary [&_th]:text-text-primary">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Sidebar;