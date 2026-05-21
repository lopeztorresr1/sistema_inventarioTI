import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import {
    Plus, Search, Loader2, X,
    Monitor, User, FileText, Printer,
    UploadCloud, ShieldCheck, ShieldAlert,
    Calendar, Clock, ListFilter, CheckCircle2,
    LogOut
} from 'lucide-react';

const Asignaciones = () => {
    const [asignaciones, setAsignaciones]           = useState([]);
    const [empleados, setEmpleados]                 = useState([]);
    const [equiposDisponibles, setEquiposDisponibles] = useState([]);
    const [loading, setLoading]                     = useState(true);
    const [isModalOpen, setIsModalOpen]             = useState(false);
    const [isSaving, setIsSaving]                   = useState(false);

    const fileInputRef             = useRef(null);
    const [selectedIdForUpload, setSelectedIdForUpload] = useState(null);

    const [activeTab, setActiveTab] = useState('ACTIVA');
    const [searchTerm, setSearchTerm] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    const [formData, setFormData] = useState({
        fecha_entrega: new Date().toISOString().split('T')[0],
        empleado_id: '', tecnico_id: '', equipo_id: '', notas: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resAsig, resEmp, resEq] = await Promise.all([
                api.get('/asignaciones'),
                api.get('/empleados'),
                // Con paginación: traemos hasta 200 disponibles para el selector
                api.get('/equipos?activo=true&estado=DISPONIBLE&limit=200&page=1'),
            ]);
            setAsignaciones(resAsig.data);
            setEmpleados(resEmp.data);
            // El endpoint paginado devuelve { data, total, ... }
            setEquiposDisponibles(resEq.data.data ?? resEq.data);
        } catch (err) {
            console.error('Error al cargar datos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const asignacionesFiltradas = asignaciones.filter(a => {
        const matchesTab    = a.estado === activeTab;
        const matchesSearch =
            `${a.empleado?.nombre} ${a.empleado?.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.equipo?.nombre ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        const fechaAsig   = new Date(a.fecha_entrega);
        const matchesDesde = fechaDesde ? fechaAsig >= new Date(fechaDesde) : true;
        const matchesHasta = fechaHasta ? fechaAsig <= new Date(fechaHasta) : true;
        return matchesTab && matchesSearch && matchesDesde && matchesHasta;
    });

    const stats = {
        total:      asignaciones.length,
        activas:    asignaciones.filter(a => a.estado === 'ACTIVA').length,
        finalizadas: asignaciones.filter(a => a.estado === 'FINALIZADA').length,
    };

    const tecnicosSistemas = empleados.filter(emp =>
        emp.area?.nombre?.toLowerCase().includes('sistemas')
    );

    const equipoSel  = equiposDisponibles.find(e => e.id === Number(formData.equipo_id));
    const empleadoSel = empleados.find(e => e.id === Number(formData.empleado_id));
    const tecnicoSel  = empleados.find(e => e.id === Number(formData.tecnico_id));

    // ── Upload de acta firmada ──────────────────────────────────────────────
    const handleUploadClick = (id) => {
        setSelectedIdForUpload(id);
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // BUG FIX: la variable se llamaba uploadFormData pero se declaraba como uploadData
        const uploadFormData = new FormData();
        uploadFormData.append('acta', file);

        try {
            await api.post(
                `/asignaciones/${selectedIdForUpload}/upload`,
                uploadFormData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            alert('Acta firmada subida correctamente.');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al subir archivo');
        } finally {
            // Limpia el input para que el mismo archivo pueda volver a seleccionarse
            e.target.value = '';
        }
    };

    // ── Finalizar asignación desde la tabla ────────────────────────────────
    const handleFinalizar = async (id) => {
        if (!window.confirm('¿Confirmar la devolución del equipo?')) return;
        try {
            await api.put(`/asignaciones/${id}/finalizar`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al finalizar asignación');
        }
    };

    // ── Guardar nueva asignación e imprimir responsiva ─────────────────────
    const handleGuardarEImprimir = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/asignaciones', {
                ...formData,
                empleado_id: Number(formData.empleado_id),
                equipo_id:   Number(formData.equipo_id),
                tecnico_id:  Number(formData.tecnico_id) || undefined,
            });
            setIsModalOpen(false);
            await fetchData();
            setTimeout(() => window.print(), 300);
        } catch (err) {
            alert(err.response?.data?.error || 'Error al registrar asignación');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {/* ── VISTA NORMAL (oculta al imprimir) ──────────────────────── */}
            <div className="print:hidden">
                <Sidebar>
                    {/* Input de archivo oculto para subir actas */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,image/*"
                    />

                    <div className="space-y-6">
                        {/* HEADER */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Asignaciones</h1>
                                <p className="text-slate-400 mt-1">Control responsivo de activos TI.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setFormData({ fecha_entrega: new Date().toISOString().split('T')[0], empleado_id: '', tecnico_id: '', equipo_id: '', notas: '' });
                                    setIsModalOpen(true);
                                }}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                            >
                                <Plus size={20} /> Nueva Responsiva
                            </button>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-3xl flex items-center gap-4">
                                <div className="p-3 bg-white/5 text-slate-400 rounded-xl"><ListFilter size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</p>
                                    <p className="text-xl font-bold text-white">{stats.total}</p>
                                </div>
                            </div>
                            <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-3xl flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Clock size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Vigentes</p>
                                    <p className="text-xl font-bold text-white">{stats.activas}</p>
                                </div>
                            </div>
                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><CheckCircle2 size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Cerradas</p>
                                    <p className="text-xl font-bold text-white">{stats.finalizadas}</p>
                                </div>
                            </div>
                        </div>

                        {/* TABS */}
                        <div className="flex gap-2 p-1 bg-white/5 w-fit rounded-2xl border border-white/10">
                            <button
                                onClick={() => setActiveTab('ACTIVA')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'ACTIVA' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                <ShieldCheck size={16} /> Vigentes
                            </button>
                            <button
                                onClick={() => setActiveTab('FINALIZADA')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'FINALIZADA' ? 'bg-slate-700/50 text-slate-200' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Clock size={16} /> Historial
                            </button>
                        </div>

                        {/* FILTROS */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative max-w-xs flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar colaborador o equipo..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2">
                                <Calendar size={14} className="text-slate-500" />
                                <input type="date" className="bg-transparent text-[11px] text-slate-300 outline-none" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                                <span className="text-slate-600">–</span>
                                <input type="date" className="bg-transparent text-[11px] text-slate-300 outline-none" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                            </div>
                        </div>

                        {/* TABLA */}
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Colaborador</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Activo Asignado</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Fecha Entrega</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    {loading ? (
                                        <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
                                    ) : asignacionesFiltradas.length === 0 ? (
                                        <tr><td colSpan="4" className="py-12 text-center text-slate-500 italic">Sin registros en esta categoría</td></tr>
                                    ) : asignacionesFiltradas.map(a => (
                                        <tr key={a.id} className="hover:bg-white/[0.01] transition-colors group text-sm">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><User size={18} /></div>
                                                    <div>
                                                        <p className="text-slate-200 font-semibold">{a.empleado?.nombre} {a.empleado?.apellido}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{a.empleado?.area?.nombre}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Monitor size={16} className="text-slate-500" />
                                                    <span className="text-slate-300">{a.equipo?.nombre}</span>
                                                    <span className="text-[10px] font-mono text-slate-600">[{a.equipo?.serie}]</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                                {new Date(a.fecha_entrega).toLocaleDateString('es-MX')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {activeTab === 'ACTIVA' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUploadClick(a.id)}
                                                                className="p-2 text-slate-400 hover:text-emerald-400 transition-all"
                                                                title="Subir acta firmada"
                                                            >
                                                                <UploadCloud size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleFinalizar(a.id)}
                                                                className="p-2 text-slate-400 hover:text-amber-400 transition-all"
                                                                title="Finalizar / devolver equipo"
                                                            >
                                                                <LogOut size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => { setFormData(a); setTimeout(() => window.print(), 100); }}
                                                        className="p-2 text-slate-400 hover:text-blue-400 transition-all"
                                                        title="Reimprimir responsiva"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MODAL: NUEVA ASIGNACIÓN */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                            <div className="bg-[#0B0F1A] border border-white/10 w-full max-w-4xl rounded-[2.5rem] p-10 shadow-2xl relative my-auto">
                                <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                                <h2 className="text-2xl font-bold text-white mb-8 tracking-tight italic uppercase">Generar Nueva Responsiva</h2>

                                <form onSubmit={handleGuardarEImprimir} className="grid grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha</label>
                                            <input type="date" required className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-blue-500/50" value={formData.fecha_entrega} onChange={e => setFormData({ ...formData, fecha_entrega: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Colaborador *</label>
                                            <select required className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3.5 text-white outline-none" value={formData.empleado_id} onChange={e => setFormData({ ...formData, empleado_id: e.target.value })}>
                                                <option value="">Seleccionar...</option>
                                                {empleados.filter(e => e.estado).map(e => (
                                                    <option key={e.id} value={e.id} className="bg-[#0B0F1A]">{e.nombre} {e.apellido} — {e.area?.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Técnico que Entrega</label>
                                            <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3.5 text-white outline-none" value={formData.tecnico_id} onChange={e => setFormData({ ...formData, tecnico_id: e.target.value })}>
                                                <option value="">Seleccionar...</option>
                                                {tecnicosSistemas.map(e => (
                                                    <option key={e.id} value={e.id} className="bg-[#0B0F1A]">{e.nombre} {e.apellido}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Activo Disponible *</label>
                                            <select required className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3.5 text-white outline-none" value={formData.equipo_id} onChange={e => setFormData({ ...formData, equipo_id: e.target.value })}>
                                                <option value="">Buscar activo disponible...</option>
                                                {equiposDisponibles.map(e => (
                                                    <option key={e.id} value={e.id} className="bg-[#0B0F1A]">{e.nombre} ({e.codigo})</option>
                                                ))}
                                            </select>
                                        </div>

                                        {equipoSel && (
                                            <div className="bg-white/5 border border-white/5 p-4 rounded-xl grid grid-cols-2 gap-2 text-[10px]">
                                                <div><p className="text-slate-500 uppercase font-bold">Serie</p><p className="text-blue-400 font-mono">{equipoSel.serie}</p></div>
                                                <div><p className="text-slate-500 uppercase font-bold">Service Tag</p><p className="text-blue-400 font-mono">{equipoSel.service_tag || 'N/A'}</p></div>
                                                <div><p className="text-slate-500 uppercase font-bold">Color</p><p className="text-slate-200">{equipoSel.color || '—'}</p></div>
                                                <div><p className="text-slate-500 uppercase font-bold">Material</p><p className="text-slate-200">{equipoSel.material || '—'}</p></div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Observaciones</label>
                                            <textarea className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3.5 text-white outline-none h-20 resize-none" placeholder="Estado físico, accesorios incluidos..." value={formData.notas} onChange={e => setFormData({ ...formData, notas: e.target.value })} />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="col-span-2 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all text-white flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Printer size={16} /> Guardar e Imprimir</>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </Sidebar>
            </div>

            {/* ── HOJA DE IMPRESIÓN ───────────────────────────────────────── */}
            <div className="hidden print:block bg-white text-black p-0 m-0 w-[216mm] font-serif">
                <div className="p-12 border-[10px] border-double border-gray-300 min-h-[279mm] relative">
                    <div className="text-center border-b-2 border-black pb-4 mb-8">
                        <h1 className="text-3xl font-bold uppercase tracking-tighter underline">Carta Responsiva de Equipo</h1>
                        <p className="text-sm font-bold uppercase mt-1">Dpto. Sistemas e Infraestructura TI</p>
                    </div>
                    <div className="flex justify-between text-sm mb-8 font-bold">
                        <p>FOLIO: ITL-RES-{formData.id || 'NEW'}</p>
                        <p>FECHA: {formData.fecha_entrega}</p>
                    </div>
                    <p className="text-justify text-sm leading-relaxed mb-6">
                        Por medio de la presente, se hace entrega formal del activo descrito a continuación al colaborador
                        <strong> {empleadoSel?.nombre} {empleadoSel?.apellido}</strong>. El usuario manifiesta recibirlo en
                        óptimas condiciones y se compromete a su resguardo exclusivo para fines laborales.
                    </p>
                    <h2 className="bg-gray-100 p-2 text-xs font-bold uppercase border border-black mb-4 tracking-widest">Especificaciones Técnicas</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm px-4 mb-8">
                        <p><strong>Equipo:</strong> {equipoSel?.nombre}</p>
                        <p><strong>ID Inventario:</strong> {equipoSel?.codigo}</p>
                        <p><strong>Serie:</strong> {equipoSel?.serie}</p>
                        <p><strong>Service Tag:</strong> {equipoSel?.service_tag || 'N/A'}</p>
                        <p><strong>Material / Color:</strong> {equipoSel?.material} / {equipoSel?.color}</p>
                        <p className="col-span-2"><strong>Observaciones:</strong><br />{formData.notas || 'N/A'}</p>
                    </div>
                    <div className="mt-36 grid grid-cols-2 gap-20 text-center text-xs">
                        <div><div className="border-t border-black pt-2 font-bold uppercase">ENTREGA (SISTEMAS)</div><p>{tecnicoSel?.nombre} {tecnicoSel?.apellido}</p></div>
                        <div><div className="border-t border-black pt-2 font-bold uppercase">RECIBE (USUARIO)</div><p>{empleadoSel?.nombre} {empleadoSel?.apellido}</p></div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: letter; margin: 0; }
                    body { margin: 0; padding: 0; background: white !important; }
                    .print\\:hidden { display: none !important; }
                    .hidden { display: block !important; }
                }
            ` }} />
        </>
    );
};

export default Asignaciones;
