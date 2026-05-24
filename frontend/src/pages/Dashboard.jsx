import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import {
    Monitor, UserCheck, Package, Tag,
    Loader2, BarChart3, ShieldCheck,
    Calendar as CalendarIcon, Clock, HardDrive,
    TrendingUp, Activity, Wrench, AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Reloj en tiempo real
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Consumo seguro de la API
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setData(res.data);
            } catch (err) {
                console.error('Error al cargar el dashboard:', err);
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [navigate]);

    // ─── OPTIMIZACIÓN CRÍTICA DE MONTAJE ─────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-bg-app space-y-4">
            <Loader2 className="animate-spin text-accent" size={60} />
            <p className="text-accent font-black uppercase tracking-[0.3em] animate-pulse text-sm">Sincronizando Sistema...</p>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen w-full flex items-center justify-center bg-bg-app">
            <p className="text-red-500 font-bold uppercase tracking-wider">Error crítico al sincronizar datos con el servidor.</p>
        </div>
    );
    // ─────────────────────────────────────────────────────────────────────────

    const tasaAsignacion = data.equipos_activos > 0
        ? ((data.asignados / data.equipos_activos) * 100).toFixed(1)
        : '0.0';

    return (
        <Sidebar>
            <div className="p-4 space-y-10 max-w-[1600px] mx-auto">

                {/* HEADER CON RELOJ ADAPTATIVO */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border-app pb-8">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-text-primary">
                            <span className="text-accent">DASHBOARD</span>
                        </h1>
                        <p className="text-text-secondary text-lg font-medium">PANEL PRINCIPAL · Gestión de Activos TI</p>
                    </div>
                    
                    <div className="bg-bg-card border border-border-app px-8 py-4 rounded-3xl flex items-center gap-8 backdrop-blur-xl shadow-sm">
                        <div className="flex items-center gap-3 text-accent">
                            <CalendarIcon size={24} />
                            <span className="text-lg font-bold uppercase tracking-widest text-text-primary">
                                {currentTime.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="w-[2px] h-8 bg-border-app" />
                        <div className="flex items-center gap-3 text-emerald-500">
                            <Clock size={24} />
                            <span className="text-2xl font-black font-mono text-text-primary tracking-tighter">
                                {currentTime.toLocaleTimeString('es-MX')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* KPI CARDS DINÁMICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Activos Totales */}
                    <div className="group bg-bg-card border border-border-app p-8 rounded-3xl shadow-sm hover:scale-105 hover:border-accent/40 transition-all duration-500">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Activos Totales</p>
                            <HardDrive size={28} className="text-text-muted opacity-60 group-hover:rotate-12 transition-transform" />
                        </div>
                        <h2 className="text-5xl font-black text-text-primary mt-4 tracking-tighter">{data.equipos_activos}</h2>
                        <p className="text-text-secondary text-xs mt-2 font-bold uppercase italic">Hardware Registrado</p>
                    </div>

                    {/* Disponibles */}
                    <div className="group bg-bg-card border border-border-app p-8 rounded-3xl shadow-sm hover:scale-105 hover:border-emerald-500/40 transition-all duration-500">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Disponibles</p>
                            <ShieldCheck size={28} className="text-emerald-500 opacity-60 group-hover:scale-110 transition-transform" />
                        </div>
                        <h2 className="text-5xl font-black text-text-primary mt-4 tracking-tighter">{data.disponibles}</h2>
                        <span className="mt-2 inline-block px-3 py-1 bg-emerald-500/10 rounded-full text-[10px] font-black text-emerald-500 uppercase">Stock Listo</span>
                    </div>

                    {/* Asignados */}
                    <div className="group bg-bg-card border border-border-app p-8 rounded-3xl shadow-sm hover:scale-105 hover:border-amber-500/40 transition-all duration-500">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-amber-500 uppercase tracking-[0.2em]">Asignados</p>
                            <UserCheck size={28} className="text-amber-500 opacity-60 group-hover:-translate-y-1 transition-transform" />
                        </div>
                        <h2 className="text-5xl font-black text-text-primary mt-4 tracking-tighter">{data.asignados}</h2>
                        <p className="text-text-secondary text-xs mt-2 font-bold uppercase italic">En Posesión</p>
                    </div>

                    {/* En Reparación */}
                    <div className="group bg-bg-card border border-border-app p-8 rounded-3xl shadow-sm hover:scale-105 hover:border-orange-500/40 transition-all duration-500">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-orange-400 uppercase tracking-[0.2em]">En Reparación</p>
                            <Wrench size={28} className="text-orange-500 opacity-60 group-hover:rotate-45 transition-transform" />
                        </div>
                        <h2 className="text-5xl font-black text-text-primary mt-4 tracking-tighter">{data.en_reparacion ?? 0}</h2>
                        <p className="text-text-secondary text-xs mt-2 font-bold uppercase italic">En Taller</p>
                    </div>

                    {/* Responsables */}
                    <div className="group bg-bg-card border border-border-app p-8 rounded-3xl shadow-sm hover:scale-105 hover:border-rose-500/40 transition-all duration-500">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-rose-400 uppercase tracking-[0.2em]">Responsables</p>
                            <Package size={28} className="text-rose-500 opacity-60 group-hover:rotate-12 transition-transform" />
                        </div>
                        <h2 className="text-5xl font-black text-text-primary mt-4 tracking-tighter">{data.responsables}</h2>
                        <span className="mt-2 inline-block px-3 py-1 bg-rose-500/10 rounded-full text-[10px] font-black text-rose-400 uppercase">Usuarios Activos</span>
                    </div>
                </div>

                {/* SECCIONES GRÁFICAS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Stock por Categoría */}
                    <div className="grid lg:col-span-5 bg-bg-card border border-border-app p-10 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-4 text-text-primary">
                                <BarChart3 size={24} className="text-accent" /> Stock por Categoría
                            </h3>
                            <span className="text-text-muted font-bold text-xs uppercase tracking-tighter">Disponibles</span>
                        </div>
                        
                        <div className="space-y-8">
                            {data.stock_categoria?.length > 0 ? data.stock_categoria.map((item, i) => (
                                <div key={i} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            <span className="text-base font-bold transition-colors uppercase text-text-primary group-hover:text-accent">{item.nombre}</span>
                                        </div>
                                        <span className="text-xl font-black text-accent font-mono">{item.stock} <span className="text-xs text-text-muted font-bold">U.</span></span>
                                    </div>
                                    
                                    <div className="h-3 bg-bg-input rounded-full overflow-hidden border border-border-app">
                                        <div
                                            className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${data.equipos_activos > 0 ? (item.stock / data.equipos_activos) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <p className="text-text-muted italic text-sm text-center py-8">Sin stock disponible por categoría</p>
                            )}
                        </div>
                    </div>

                    {/* Alertas de Taller */}
                    <div className="lg:col-span-4 bg-bg-card border border-border-app p-10 rounded-3xl shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-4 mb-8 text-text-primary">
                                <AlertTriangle size={24} className="text-orange-400" /> En Taller
                            </h3>
                            
                            {data.reps_en_proceso?.length > 0 ? (
                                <div className="space-y-4">
                                    {data.reps_en_proceso.map((r, i) => (
                                        <div key={i} className="bg-bg-card-hover border border-border-app rounded-2xl p-4 transition-all hover:brightness-95">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg mt-0.5">
                                                    <Wrench size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate text-text-primary">{r.equipo_nombre}</p>
                                                    <p className="text-[10px] font-mono text-text-muted">{r.equipo_codigo}</p>
                                                    <p className="text-xs mt-1 line-clamp-1 text-text-secondary">{r.motivo_falla}</p>
                                                </div>
                                                <span className="text-[10px] font-mono text-orange-400 font-bold whitespace-nowrap">{r.fecha_ingreso}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(data.en_reparacion ?? 0) > 5 && (
                                        <p className="text-center text-xs text-text-muted italic pt-2">
                                            +{data.en_reparacion - 5} más en taller
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-text-muted">
                                    <ShieldCheck size={40} className="mb-3 text-emerald-500/30" />
                                    <p className="text-sm font-bold">Sin equipos en taller</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rendimiento */}
                    <div className="lg:col-span-3 bg-bg-card border border-border-app p-10 rounded-3xl shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-4 mb-10 text-text-primary">
                                <Activity size={24} className="text-emerald-500" /> Rendimiento
                            </h3>
                            
                            <div className="space-y-8">
                                <div className="text-center p-6 bg-bg-card-hover border border-border-app rounded-3xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-text-muted">Tasa de Asignación</p>
                                    <div className="text-4xl font-black text-emerald-500 font-mono italic">{tasaAsignacion}%</div>
                                    <div className="w-full h-1.5 bg-emerald-500/10 mt-4 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${tasaAsignacion}%` }} />
                                    </div>
                                </div>
                                
                                <div className="text-center p-6 bg-bg-card-hover border border-border-app rounded-3xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-text-muted">Marcas Asociadas</p>
                                    <div className="text-4xl font-black text-accent font-mono italic">{data.marcas_total}</div>
                                    <p className="text-[10px] text-text-muted mt-2 font-bold uppercase tracking-tighter">Diversidad de Proveedores</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border-app mt-6">
                            <div className="flex items-center gap-3 text-emerald-500">
                                <TrendingUp size={20} />
                                <p className="text-xs font-black uppercase italic text-text-primary">Sistema Operativo</p>
                            </div>
                            <p className="text-[10px] text-text-muted mt-1 font-semibold">Datos en tiempo real desde el servidor</p>
                        </div>
                    </div>
                </div>

            </div>
        </Sidebar>
    );
};

export default Dashboard;