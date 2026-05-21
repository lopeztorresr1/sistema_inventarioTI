import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import {
    Plus, Search, Loader2, X, Wrench, CheckCircle2,
    AlertTriangle, Clock, DollarSign, Package, ChevronDown
} from 'lucide-react';

const estadoBadge = {
    PROCESO:     'text-amber-400 border-amber-400/20 bg-amber-400/10',
    REPARADO:    'text-emerald-400 border-emerald-400/20 bg-emerald-400/10',
    IRREPARABLE: 'text-red-400 border-red-400/20 bg-red-400/10',
};

const Reparaciones = () => {
    const [reparaciones, setReparaciones] = useState([]);
    const [equiposDisponibles, setEquiposDisponibles] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [activeTab, setActiveTab]       = useState('PROCESO');
    const [searchTerm, setSearchTerm]     = useState('');

    // Modal ingreso
    const [isIngresoOpen, setIsIngresoOpen] = useState(false);
    const [isSaving, setIsSaving]           = useState(false);
    const [ingresoData, setIngresoData]     = useState({
        equipo_id: '', motivo_falla: '', proveedor_servicio: ''
    });

    // Modal cierre
    const [isCierreOpen, setIsCierreOpen] = useState(false);
    const [selectedRep, setSelectedRep]   = useState(null);
    const [cierreData, setCierreData]     = useState({
        diagnostico: '', solucion: '', costo: 0, estado: 'REPARADO'
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [resRep, resEq] = await Promise.all([
                api.get('/reparaciones'),
                api.get('/equipos?activo=true&estado=DISPONIBLE&limit=200'),
            ]);
            setReparaciones(resRep.data);
            // El backend de equipos devuelve { data, total } con paginación
            setEquiposDisponibles(resEq.data.data ?? resEq.data);
        } catch (err) {
            console.error('Error cargando reparaciones:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtradas = reparaciones.filter(r => {
        const matchTab    = r.estado === activeTab;
        const matchSearch = r.equipo?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
            || r.motivo_falla?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchTab && matchSearch;
    });

    const stats = {
        proceso:     reparaciones.filter(r => r.estado === 'PROCESO').length,
        reparado:    reparaciones.filter(r => r.estado === 'REPARADO').length,
        irreparable: reparaciones.filter(r => r.estado === 'IRREPARABLE').length,
    };

    const handleIngreso = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/reparaciones', {
                ...ingresoData,
                equipo_id: Number(ingresoData.equipo_id),
            });
            setIsIngresoOpen(false);
            setIngresoData({ equipo_id: '', motivo_falla: '', proveedor_servicio: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al registrar ingreso');
        } finally { setIsSaving(false); }
    };

    const openCierre = (rep) => {
        setSelectedRep(rep);
        setCierreData({ diagnostico: '', solucion: '', costo: 0, estado: 'REPARADO' });
        setIsCierreOpen(true);
    };

    const handleCierre = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put(`/reparaciones/${selectedRep.id}/finalizar`, {
                ...cierreData,
                costo: Number(cierreData.costo),
            });
            setIsCierreOpen(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al cerrar reparación');
        } finally { setIsSaving(false); }
    };

    const inputCls = 'w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all';

    return (
        <Sidebar>
            <div className="space-y-6">
                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Reparaciones</h1>
                        <p className="text-slate-400 mt-1">Control de equipos en taller</p>
                    </div>
                    <button
                        onClick={() => setIsIngresoOpen(true)}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20 active:scale-95"
                    >
                        <Plus size={20} /> Ingreso a Taller
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-3xl flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Clock size={20} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">En Proceso</p>
                            <p className="text-xl font-bold text-white">{stats.proceso}</p>
                        </div>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><CheckCircle2 size={20} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Reparados</p>
                            <p className="text-xl font-bold text-white">{stats.reparado}</p>
                        </div>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-3xl flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-xl"><AlertTriangle size={20} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Irreparables</p>
                            <p className="text-xl font-bold text-white">{stats.irreparable}</p>
                        </div>
                    </div>
                </div>

                {/* TABS + BUSCAR */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                        {['PROCESO', 'REPARADO', 'IRREPARABLE'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                                    activeTab === tab
                                        ? 'bg-white/10 text-white shadow'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar equipo o falla..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* TABLA */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Equipo</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Motivo de Falla</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ingreso</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Proveedor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Estado</th>
                                {activeTab === 'PROCESO' && (
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                )}
                                {activeTab !== 'PROCESO' && (
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Costo</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {loading ? (
                                <tr><td colSpan="6" className="py-16 text-center"><Loader2 className="animate-spin mx-auto text-amber-500" size={32} /></td></tr>
                            ) : filtradas.length === 0 ? (
                                <tr><td colSpan="6" className="py-12 text-center text-slate-500 italic">Sin registros en esta categoría</td></tr>
                            ) : filtradas.map(r => (
                                <tr key={r.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Wrench size={16} /></div>
                                            <div>
                                                <p className="text-slate-200 font-semibold text-sm">{r.equipo?.nombre}</p>
                                                <p className="text-[10px] font-mono text-slate-500">{r.equipo?.codigo}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-xs max-w-[200px]">
                                        <p className="line-clamp-2">{r.motivo_falla}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                                        {new Date(r.fecha_ingreso).toLocaleDateString('es-MX')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-xs">
                                        {r.proveedor_servicio || <span className="opacity-30 italic">Interno</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase ${estadoBadge[r.estado]}`}>
                                            {r.estado}
                                        </span>
                                    </td>
                                    {activeTab === 'PROCESO' ? (
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openCierre(r)}
                                                className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
                                            >
                                                Cerrar
                                            </button>
                                        </td>
                                    ) : (
                                        <td className="px-6 py-4 text-right text-slate-300 text-xs font-mono">
                                            {r.costo > 0 ? `$${r.costo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: INGRESO A TALLER */}
            {isIngresoOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
                    <div className="bg-[#0B0F1A] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl"><Wrench size={20} /></div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Ingreso a Taller</h2>
                            </div>
                            <button onClick={() => setIsIngresoOpen(false)} className="text-white/20 hover:text-white transition-all"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleIngreso} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Equipo (solo disponibles)</label>
                                <select
                                    className={inputCls}
                                    value={ingresoData.equipo_id}
                                    onChange={e => setIngresoData({ ...ingresoData, equipo_id: e.target.value })}
                                    required
                                >
                                    <option value="" className="bg-[#0B0F1A]">Seleccionar equipo...</option>
                                    {equiposDisponibles.map(eq => (
                                        <option key={eq.id} value={eq.id} className="bg-[#0B0F1A]">
                                            {eq.nombre} — {eq.codigo}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Motivo de Falla *</label>
                                <textarea
                                    className={`${inputCls} h-24 resize-none`}
                                    placeholder="Describe el problema reportado..."
                                    value={ingresoData.motivo_falla}
                                    onChange={e => setIngresoData({ ...ingresoData, motivo_falla: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Proveedor de Servicio</label>
                                <input
                                    className={inputCls}
                                    placeholder="Ej: Taller Interno, Dell Support..."
                                    value={ingresoData.proveedor_servicio}
                                    onChange={e => setIngresoData({ ...ingresoData, proveedor_servicio: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all active:scale-95"
                            >
                                {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Registrar Ingreso'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CIERRE DE REPARACIÓN */}
            {isCierreOpen && selectedRep && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
                    <div className="bg-[#0B0F1A] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl"><CheckCircle2 size={20} /></div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Cerrar Reparación</h2>
                            </div>
                            <button onClick={() => setIsCierreOpen(false)} className="text-white/20 hover:text-white transition-all"><X size={24} /></button>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-5">
                            <p className="text-[10px] text-amber-400 font-black uppercase mb-1">Equipo en taller</p>
                            <p className="text-white font-bold text-sm">{selectedRep.equipo?.nombre}</p>
                            <p className="text-slate-500 text-xs mt-1 line-clamp-2">{selectedRep.motivo_falla}</p>
                        </div>

                        <form onSubmit={handleCierre} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Diagnóstico *</label>
                                <textarea
                                    className={`${inputCls} h-20 resize-none`}
                                    placeholder="Causa raíz del problema..."
                                    value={cierreData.diagnostico}
                                    onChange={e => setCierreData({ ...cierreData, diagnostico: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Solución aplicada</label>
                                <textarea
                                    className={`${inputCls} h-20 resize-none`}
                                    placeholder="Qué se hizo para resolverlo..."
                                    value={cierreData.solucion}
                                    onChange={e => setCierreData({ ...cierreData, solucion: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Costo ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className={inputCls}
                                        value={cierreData.costo}
                                        onChange={e => setCierreData({ ...cierreData, costo: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Resultado *</label>
                                    <select
                                        className={inputCls}
                                        value={cierreData.estado}
                                        onChange={e => setCierreData({ ...cierreData, estado: e.target.value })}
                                        required
                                    >
                                        <option value="REPARADO" className="bg-[#0B0F1A]">✅ Reparado</option>
                                        <option value="IRREPARABLE" className="bg-[#0B0F1A]">❌ Irreparable</option>
                                    </select>
                                </div>
                            </div>

                            {cierreData.estado === 'IRREPARABLE' && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400">
                                    <AlertTriangle size={14} className="inline mr-2" />
                                    El equipo pasará automáticamente a estado <strong>BAJA</strong> en el inventario.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`w-full text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all active:scale-95 ${
                                    cierreData.estado === 'IRREPARABLE'
                                        ? 'bg-red-600 hover:bg-red-500'
                                        : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                            >
                                {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Finalizar Reparación'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Sidebar>
    );
};

export default Reparaciones;
