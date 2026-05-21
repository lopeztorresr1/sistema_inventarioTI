import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import {
    Monitor, UserCheck, Package, Tag,
    Loader2, BarChart3, ShieldCheck,
    Calendar as CalendarIcon, Clock, HardDrive,
    TrendingUp, Activity, Wrench, AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
    const [data, setData]               = useState(null);
    const [loading, setLoading]         = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setData(res.data);
            } catch (err) {
                console.error('Error al cargar el dashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <Sidebar>
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-blue-500" size={60} />
                <p className="text-blue-400 font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Sistema...</p>
            </div>
        </Sidebar>
    );

    if (!data) return (
        <Sidebar>
            <div className="h-full flex items-center justify-center">
                <p className="text-red-400 font-bold">Error al cargar datos del dashboard.</p>
            </div>
        </Sidebar>
    );

    const tasaAsignacion = data.equipos_activos > 0
        ? ((data.asignados / data.equipos_activos) * 100).toFixed(1)
        : '0.0';

    return (
        <Sidebar>
            <div className="p-4 space-y-10 max-w-[1600px] mx-auto">

                {/* HEADER CON RELOJ */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                            <span className="text-blue-500" style={{ textShadow: '0 0 20px rgba(59,130,246,0.5)' }}>DASHBOARD</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium">PANEL PRINCIPAL · Gestión de Activos TI</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-[2rem] flex items-center gap-8 backdrop-blur-xl shadow-2xl">
                        <div className="flex items-center gap-3 text-blue-400">
                            <CalendarIcon size={28} />
                            <span className="text-xl font-bold uppercase tracking-widest text-white">
                                {currentTime.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="w-[2px] h-10 bg-white/10" />
                        <div className="flex items-center gap-3 text-emerald-400">
                            <Clock size={28} />
                            <span className="text-3xl font-black font-mono text-white tracking-tighter">
                                {currentTime.toLocaleTimeString('es-MX')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── KPI CARDS — ahora son 5 incluyendo En Reparación ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Activos Totales */}
                    <div className="group bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/30 p-8 rounded-[3rem] shadow-2xl hover:scale-105 transition-all duration-500">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Activos Totales</p>
                            <HardDrive size={32} className="text-blue-500 opacity-50 group-hover:rotate-12 transition-transform" />
                        </div>
                        <h2 className="text-6xl font-black text-white mt-4 tracking-tighter">{data.equipos_activos}</h2>
                        <p className="text-slate-500 text-sm mt-2 font-bold uppercase italic">Hardware Registrado</p>
                    </div>

                    {/* Disponibles */}
                    <div className="group bg-gradient-to-br from-emerald-600/20 to-transparent border border-emerald-500/30 p-8 rounded-[3rem] shadow-2xl hover:scale-105 transition-all duration-500">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">Disponibles</p>
                            <ShieldCheck size={32} className="text-emerald-500 opacity-50 group-hover:scale-110 transition-transform" />
                        </div>
                        <h2 className="text-6xl font-black text-white mt-4 tracking-tighter">{data.disponibles}</h2>
                        <span className="mt-2 inline-block px-3 py-1 bg-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase">Stock Listo</span>
                    </div>

                    {/* Asignados */}
                    <div className="group bg-gradient-to-br from-amber-600/20 to-transparent border border-amber-500/30 p-8 rounded-[3rem] shadow-2xl hover:scale-105 transition-all duration-500">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-amber-400 uppercase tracking-[0.2em]">Asignados</p>
                            <UserCheck size={32} className="text-amber-500 opacity-50 group-hover:-translate-y-2 transition-transform" />
                        </div>
                        <h2 className="text-6xl font-black text-white mt-4 tracking-tighter">{data.asignados}</h2>
                        <p className="text-slate-500 text-sm mt-2 font-bold uppercase italic">En Posesión</p>
                    </div>

                    {/* En Reparación — NUEVO */}
                    <div className="group bg-gradient-to-br from-orange-600/20 to-transparent border border-orange-500/30 p-8 rounded-[3rem] shadow-2xl hover:scale-105 transition-all duration-500">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-orange-400 uppercase tracking-[0.2em]">En Reparación</p>
                            <Wrench size={32} className="text-orange-500 opacity-50 group-hover:rotate-45 transition-transform" />
                        </div>
                        <h2 className="text-6xl font-black text-white mt-4 tracking-tighter">{data.en_reparacion ?? 0}</h2>
                        <p className="text-slate-500 text-sm mt-2 font-bold uppercase italic">En Taller</p>
                    </div>

                    {/* Responsables */}
                    <div className="group bg-gradient-to-br from-rose-600/20 to-transparent border border-rose-500/30 p-8 rounded-[3rem] shadow-2xl hover:scale-105 transition-all duration-500">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-rose-400 uppercase tracking-[0.2em]">Responsables</p>
                            <Package size={32} className="text-rose-500 opacity-50 group-hover:rotate-12 transition-transform" />
                        </div>
                        <h2 className="text-6xl font-black text-white mt-4 tracking-tighter">{data.responsables}</h2>
                        <span className="mt-2 inline-block px-3 py-1 bg-rose-500/20 rounded-full text-[10px] font-black text-rose-400 uppercase">Usuarios Activos</span>
                    </div>
                </div>

                {/* ── PANELES SECUNDARIOS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Stock por Categoría */}
                    <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 p-10 rounded-[4rem] shadow-inner">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4">
                                <BarChart3 size={28} className="text-blue-500" /> Stock por Categoría
                            </h3>
                            <span className="text-slate-500 font-bold text-sm uppercase tracking-tighter">Disponibles</span>
                        </div>
                        <div className="space-y-8">
                            {data.stock_categoria?.length > 0 ? data.stock_categoria.map((item, i) => (
                                <div key={i} className="group">
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                                            <span className="text-lg font-black text-white group-hover:text-blue-400 transition-colors uppercase">{item.nombre}</span>
                                        </div>
                                        <span className="text-2xl font-black text-blue-500 tabular-nums">{item.stock} <span className="text-xs text-slate-500 font-bold">U.</span></span>
                                    </div>
                                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                            style={{ width: `${data.equipos_activos > 0 ? (item.stock / data.equipos_activos) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <p className="text-slate-500 italic text-sm text-center py-8">Sin stock disponible por categoría</p>
                            )}
                        </div>
                    </div>

                    {/* Equipos en Reparación — Alertas */}
                    <div className="lg:col-span-4 bg-orange-500/5 border border-orange-500/10 p-10 rounded-[4rem]">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4 mb-8">
                            <AlertTriangle size={28} className="text-orange-400" /> En Taller
                        </h3>
                        {data.reps_en_proceso?.length > 0 ? (
                            <div className="space-y-4">
                                {data.reps_en_proceso.map((r, i) => (
                                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg mt-0.5">
                                                <Wrench size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-slate-200 font-semibold text-sm truncate">{r.equipo_nombre}</p>
                                                <p className="text-[10px] font-mono text-slate-500">{r.equipo_codigo}</p>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{r.motivo_falla}</p>
                                            </div>
                                            <span className="text-[10px] font-mono text-orange-400 whitespace-nowrap">{r.fecha_ingreso}</span>
                                        </div>
                                    </div>
                                ))}
                                {(data.en_reparacion ?? 0) > 5 && (
                                    <p className="text-center text-xs text-slate-500 italic pt-2">
                                        +{data.en_reparacion - 5} más en taller
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                                <ShieldCheck size={40} className="mb-3 text-emerald-500/30" />
                                <p className="text-sm font-bold">Sin equipos en taller</p>
                            </div>
                        )}
                    </div>

                    {/* Panel de Rendimiento */}
                    <div className="lg:col-span-3 bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 p-10 rounded-[4rem]">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4 mb-10">
                            <Activity size={28} className="text-emerald-400" /> Rendimiento
                        </h3>
                        <div className="space-y-8">
                            <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tasa de Asignación</p>
                                <div className="text-4xl font-black text-emerald-400 italic">{tasaAsignacion}%</div>
                                <div className="w-full h-1 bg-emerald-500/20 mt-4 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${tasaAsignacion}%` }} />
                                </div>
                            </div>
                            <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Marcas Asociadas</p>
                                <div className="text-4xl font-black text-blue-400 italic">{data.marcas_total}</div>
                                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Diversidad de Proveedores</p>
                            </div>
                            <div className="pt-6 border-t border-white/5">
                                <div className="flex items-center gap-4 text-emerald-400">
                                    <TrendingUp size={24} />
                                    <p className="text-sm font-black text-white uppercase italic">Sistema Activo</p>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2">Datos en tiempo real desde el backend</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
};

export default Dashboard;
