import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { 
    Plus, Search, Loader2, X, Wrench, CheckCircle2,
    AlertTriangle, Clock, ListFilter, LogOut
} from 'lucide-react';

const estadoBadge = {
    PROCESO:     'text-amber-500 border-amber-500/20 bg-amber-500/10',
    REPARADO:    'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
    IRREPARABLE: 'text-red-500 border-red-500/20 bg-red-500/10',
};

const Reparaciones = () => {
    const [reparaciones, setReparaciones]           = useState([]);
    const [equiposDisponibles, setEquiposDisponibles] = useState([]);
    const [loading, setLoading]                     = useState(true);
    const [activeTab, setActiveTab]                 = useState('PROCESO');
    const [searchTerm, setSearchTerm]               = useState('');

    const [isIngresoOpen, setIsIngresoOpen]         = useState(false);
    const [isSaving, setIsSaving]                   = useState(false);
    const [ingresoData, setIngresoData]             = useState({
        equipo_id: '', motivo_falla: '', proveedor_servicio: ''
    });

    const [isCierreOpen, setIsCierreOpen]           = useState(false);
    const [selectedRep, setSelectedRep]             = useState(null);
    const [cierreData, setCierreData]               = useState({
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

    return (
        <Sidebar>
            <div className="space-y-6">
                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Reparaciones</h1>
                        <p className="text-text-secondary mt-1">Control de equipos en taller</p>
                    </div>
                    <button
                        onClick={() => setIsIngresoOpen(true)}
                        className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-custom font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Plus size={20} /> Ingreso a Taller
                    </button>
                </div>

                {/* KPIs ADAPTATIVOS */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-bg-card border border-border-app p-5 rounded-custom flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Clock size={20} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-text-label uppercase tracking-widest">En Proceso</p>
                            <p className="text-xl font-bold text-text-primary">{stats.proceso}</p>
                        </div>
                    </div>
                    <div className="bg-bg-card border border-border-app p-5 rounded-custom flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle2 size={20} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-text-label uppercase tracking-widest">Reparados</p>
                            <p className="text-xl font-bold text-text-primary">{stats.reparado}</p>
                        </div>
                    </div>
                    <div className="bg-bg-card border border-border-app p-5 rounded-custom flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><AlertTriangle size={20} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-text-label uppercase tracking-widest">Irreparables</p>
                            <p className="text-xl font-bold text-text-primary">{stats.irreparable}</p>
                        </div>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex gap-2 p-1 bg-bg-card-hover w-fit rounded-2xl border border-border-app">
                        {['PROCESO', 'REPARADO', 'IRREPARABLE'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === tab ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar equipo o falla..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-bg-input border border-border-app rounded-xl py-2.5 pl-10 pr-4 text-text-primary text-sm focus:outline-none focus:border-accent transition-all placeholder:text-text-muted"
                        />
                    </div>
                </div>

                {/* TABLA */}
                <div className="bg-bg-card border border-border-app rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border-app bg-bg-card-hover">
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Equipo</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Motivo de Falla</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Ingreso</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Proveedor</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-app">
                            {loading ? (
                                <tr><td colSpan="6" className="py-16 text-center"><Loader2 className="animate-spin mx-auto text-accent" size={32} /></td></tr>
                            ) : filtradas.length === 0 ? (
                                <tr><td colSpan="6" className="py-12 text-center text-text-muted italic">Sin registros.</td></tr>
                            ) : filtradas.map(r => (
                                <tr key={r.id} className="hover:bg-bg-card-hover transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-accent/10 text-accent rounded-lg"><Wrench size={16} /></div>
                                            <div>
                                                <p className="text-text-primary font-semibold text-sm">{r.equipo?.nombre}</p>
                                                <p className="text-[10px] font-mono text-text-muted">{r.equipo?.codigo}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary text-xs">{r.motivo_falla}</td>
                                    <td className="px-6 py-4 text-text-muted text-xs font-mono">{new Date(r.fecha_ingreso).toLocaleDateString('es-MX')}</td>
                                    <td className="px-6 py-4 text-text-secondary text-xs">{r.proveedor_servicio || 'Interno'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase ${estadoBadge[r.estado]}`}>
                                            {r.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {activeTab === 'PROCESO' && (
                                            <button onClick={() => openCierre(r)} className="text-xs font-bold bg-bg-card-hover border border-border-app text-text-primary px-4 py-2 rounded-lg hover:bg-accent hover:text-white transition-all cursor-pointer">
                                                Cerrar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALES ADAPTATIVOS */}
            {isIngresoOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
                    <div className="bg-bg-card border border-border-app w-full max-w-md rounded-custom p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-text-primary uppercase tracking-tight">Ingreso a Taller</h2>
                            <button onClick={() => setIsIngresoOpen(false)} className="text-text-muted hover:text-text-primary"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleIngreso} className="space-y-4">
                            <select className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-4 text-text-primary outline-none focus:border-accent cursor-pointer" value={ingresoData.equipo_id} onChange={e => setIngresoData({ ...ingresoData, equipo_id: e.target.value })} required>
                                <option value="" className="bg-bg-card text-text-primary">Seleccionar equipo...</option>
                                {equiposDisponibles.map(eq => <option key={eq.id} value={eq.id} className="bg-bg-card text-text-primary">{eq.nombre} — {eq.codigo}</option>)}
                            </select>
                            <textarea className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-4 text-text-primary outline-none h-24 resize-none placeholder:text-text-muted" placeholder="Falla reportada..." value={ingresoData.motivo_falla} onChange={e => setIngresoData({ ...ingresoData, motivo_falla: e.target.value })} required />
                            <input className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-4 text-text-primary" placeholder="Proveedor..." value={ingresoData.proveedor_servicio} onChange={e => setIngresoData({ ...ingresoData, proveedor_servicio: e.target.value })} />
                            <button type="submit" disabled={isSaving} className="w-full bg-accent text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs cursor-pointer active:scale-95 transition-all">
                                {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Registrar Ingreso'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Sidebar>
    );
};

export default Reparaciones;
