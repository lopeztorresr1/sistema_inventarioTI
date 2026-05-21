import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Monitor, Users, Settings, LogOut, ChevronLeft,
    Box, MapPin, Tags, Cpu, Wrench, Layers, Users2, Sun, Moon, UserCog
} from 'lucide-react';
import api from '../api/axios';

const Sidebar = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDarkMode, setIsDarkMode]   = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true;
    });

    const navigate  = useNavigate();
    const location  = useLocation();
    const user      = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin   = user.rol === 'ADMIN';

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

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
        // El grupo de Administración solo aparece si el usuario es ADMIN
        ...(isAdmin ? [{
            label: 'Administración',
            items: [
                { name: 'Usuarios', icon: <UserCog size={20}/>, path: '/usuarios' },
            ]
        }] : []),
    ];

    const handleLogout = async () => {
        try {
            // Registra el cierre de sesión en el backend antes de limpiar el token
            await api.post('/auth/logout');
        } catch {
            // Si falla (token ya expirado, etc.) continuamos con el logout local
        } finally {
            localStorage.clear();
            navigate('/login');
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#030712] text-slate-300' : 'bg-slate-50 text-slate-900'}`}>

            {/* SIDEBAR */}
            <aside className={`relative border-r transition-all duration-500 ease-in-out flex flex-col shadow-2xl z-20 ${
                isCollapsed ? 'w-20' : 'w-64'
            } ${isDarkMode ? 'bg-white/[0.02] border-white/[0.05] backdrop-blur-xl' : 'bg-white border-slate-200'}`}>

                {/* LOGO */}
                <div className={`p-6 flex items-center gap-3 border-b h-20 shrink-0 ${isDarkMode ? 'border-white/[0.05]' : 'border-slate-100'}`}>
                    <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/30 shrink-0">
                        <Box size={24}/>
                    </div>
                    {!isCollapsed && (
                        <span className={`font-black tracking-tighter text-lg whitespace-nowrap italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            ACTIVOS <span className="text-blue-500">TI</span>
                        </span>
                    )}
                </div>

                {/* NAV */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 custom-scrollbar scroll-smooth">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="mb-8">
                            {!isCollapsed && (
                                <p className={`px-8 mb-3 text-[10px] font-black uppercase tracking-[0.25em] ${
                                    group.label === 'Administración'
                                        ? 'text-amber-600/70'
                                        : isDarkMode ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                    {group.label}
                                </p>
                            )}
                            <div className="px-4 space-y-1.5">
                                {group.items.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => navigate(item.path)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group relative ${
                                            isActive(item.path)
                                                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[inset_0_0_15px_rgba(37,99,235,0.05)]'
                                                : isDarkMode
                                                    ? 'text-slate-500 hover:text-white hover:bg-white/[0.04]'
                                                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {isActive(item.path) && (
                                            <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full shadow-[0_0_10px_#2563eb]"/>
                                        )}
                                        <span className={`shrink-0 transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110 group-hover:text-blue-600'}`}>
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

                {/* FOOTER */}
                <div className={`p-4 border-t shrink-0 ${isDarkMode ? 'border-white/[0.05] bg-white/[0.01]' : 'border-slate-100 bg-slate-50/50'}`}>
                    {!isCollapsed && (
                        <div className="px-4 mb-4">
                            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Operador</p>
                            <p className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {user.nombre || '—'}
                            </p>
                            {/* Badge de rol en el footer */}
                            <span className={`mt-1 inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isAdmin
                                    ? 'text-amber-400 bg-amber-400/10'
                                    : 'text-blue-400 bg-blue-400/10'
                            }`}>
                                {isAdmin ? '⚡ Admin' : '👁 Solo lectura'}
                            </span>
                        </div>
                    )}

                    {/* THEME TOGGLE */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-full flex items-center gap-3 p-3 mb-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isDarkMode
                            ? <Sun size={20} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]"/>
                            : <Moon size={20} className="text-blue-600"/>
                        }
                        {!isCollapsed && <span className="font-black text-[11px] uppercase tracking-widest">Modo {isDarkMode ? 'Claro' : 'Oscuro'}</span>}
                    </button>

                    {/* LOGOUT */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/>
                        {!isCollapsed && <span className="font-black text-[11px] uppercase tracking-widest">Cerrar Sesión</span>}
                    </button>
                </div>

                {/* TOGGLE BUTTON */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-10 bg-blue-600 text-white rounded-full p-1.5 border-2 border-slate-50 dark:border-[#030712] hover:scale-110 transition-all z-50 shadow-xl"
                >
                    {isCollapsed ? <ChevronLeft size={12} className="rotate-180"/> : <ChevronLeft size={12}/>}
                </button>
            </aside>

            {/* MAIN */}
            <main className={`flex-1 h-screen overflow-auto relative transition-colors duration-500 ${isDarkMode ? 'bg-[#030712]' : 'bg-slate-50'}`}>
                <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000 ${isDarkMode ? 'bg-blue-600/5 opacity-100' : 'bg-blue-600/10 opacity-40'}`}/>
                <div className={`relative z-10 p-10 max-w-[1600px] mx-auto transition-all duration-500
                    ${isDarkMode
                        ? '[&_h1]:text-white [&_h2]:text-white [&_p]:text-slate-400 [&_td]:text-slate-300'
                        : '[&_h1]:text-slate-900 [&_h2]:text-slate-900 [&_p]:text-slate-600 [&_td]:text-slate-800'}`}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Sidebar;