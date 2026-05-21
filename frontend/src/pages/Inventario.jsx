import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { QRCodeSVG } from 'qrcode.react';
import {
    Plus, Search, Monitor, History, Trash2, Edit2, X, Loader2,
    Eye, UserPlus, Save, ShieldCheck, AlertCircle, MapPin,
    Hash, Tag, Package, Info, DollarSign, FileText, Calendar,
    Clock, QrCode, ArrowLeftRight, ChevronLeft, ChevronRight
} from 'lucide-react';

const Inventario = () => {
    const [equipos, setEquipos]           = useState([]);
    const [sucursales, setSucursales]     = useState([]);
    const [marcas, setMarcas]             = useState([]);
    const [modelos, setModelos]           = useState([]);
    const [empleados, setEmpleados]       = useState([]);
    const [historial, setHistorial]       = useState([]);

    const [activeTab, setActiveTab]       = useState('activos');
    const [loading, setLoading]           = useState(true);
    const [searchTerm, setSearchTerm]     = useState('');
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [modalMode, setModalMode]       = useState('create');
    const [isSaving, setIsSaving]         = useState(false);

    // Paginación
    const [page, setPage]   = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const LIMIT = 20;

    const [formData, setFormData] = useState({
        id: null, nombre: '', serie: '', sucursal_id: '',
        modelo_id: '', marca_id: '', tipo_equipo_id: '',
        tipo_adquisicion: 'Compra', costo: 0, numero_factura: '',
        material: '', color: '', service_tag: '',
        caracteristicas: '', observaciones: '', estado: 'DISPONIBLE',
        created_at: null, updated_at: null
    });

    const [assignData, setAssignData] = useState({ empleado_id: '', notas: '' });

    // fetchData usa useCallback para poder llamarlo desde efectos con dependencias correctas
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const esActivo = activeTab === 'activos';
            const [resEq, resSuc, resMa, resMo, resEm] = await Promise.all([
                api.get(`/equipos?activo=${esActivo}&q=${searchTerm}&page=${page}&limit=${LIMIT}`),
                api.get('/sucursales'),
                api.get('/marcas'),
                api.get('/modelos'),
                api.get('/empleados'),
            ]);

            // El backend ahora devuelve { data, total, page, pages }
            setEquipos(resEq.data.data ?? resEq.data);
            setTotal(resEq.data.total ?? 0);
            setPages(resEq.data.pages ?? 1);
            setSucursales(resSuc.data);
            setMarcas(resMa.data);
            setModelos(resMo.data);
            setEmpleados(resEm.data);
        } catch (err) {
            console.error('Error cargando inventario:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, searchTerm, page]);

    // Reinicia a página 1 cuando cambian los filtros
    useEffect(() => { setPage(1); }, [activeTab, searchTerm]);
    useEffect(() => { fetchData(); }, [fetchData]);

    const modelosDisponibles = modelos.filter(m => m.marca_id === Number(formData.marca_id));

    const fetchHistorial = async (id) => {
        try {
            const res = await api.get(`/equipos/${id}/historial`);
            setHistorial(res.data);
        } catch (err) { console.error('Error historial', err); }
    };

    const openModal = async (mode, equipo = null) => {
        setModalMode(mode);
        setHistorial([]);
        if (equipo) {
            setFormData({
                ...equipo,
                marca_id: equipo.modelo?.marca_id || '',
                tipo_equipo_id: equipo.modelo?.tipo_equipo_id || ''
            });
            if (mode === 'view') fetchHistorial(equipo.id);
        } else {
            setFormData({
                nombre: '', serie: '', sucursal_id: '', marca_id: '', modelo_id: '',
                tipo_equipo_id: '', tipo_adquisicion: 'Compra', costo: 0,
                numero_factura: '', material: '', color: '', service_tag: '',
                caracteristicas: '', observaciones: '', estado: 'DISPONIBLE'
            });
        }
        setIsModalOpen(true);
    };

    const openAssignModal = (equipo) => {
        setFormData(equipo);
        setAssignData({ empleado_id: '', notas: '' });
        setIsAssignModalOpen(true);
    };

    const handleConfirmarAsignacion = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/asignaciones', {
                equipo_id: formData.id,
                empleado_id: Number(assignData.empleado_id),
                notas: assignData.notas
            });
            setIsAssignModalOpen(false);
            fetchData();
            alert('Asignación exitosa');
        } catch (err) {
            alert(err.response?.data?.error || 'Error al asignar');
        } finally { setIsSaving(false); }
    };

    const handleDesasignar = async (id) => {
        if (window.confirm('¿Retirar el equipo al usuario actual y marcarlo como Disponible?')) {
            try {
                await api.put(`/equipos/${id}/desasignar`);
                fetchData();
            } catch (err) { alert(err.response?.data?.error || 'Error al desasignar'); }
        }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                sucursal_id: Number(formData.sucursal_id),
                modelo_id: Number(formData.modelo_id)
            };
            if (modalMode === 'edit') await api.put(`/equipos/${formData.id}`, payload);
            else await api.post('/equipos', payload);
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al procesar el equipo');
        } finally { setIsSaving(false); }
    };

    const handleBajaLogica = async (id) => {
        if (window.confirm('¿Confirmar baja técnica del equipo?')) {
            try {
                await api.delete(`/equipos/${id}/baja`);
                fetchData();
            } catch (err) { alert('Error al procesar la baja'); }
        }
    };

    const handleReactivar = async (id) => {
        if (window.confirm('¿Reactivar este equipo?')) {
            try {
                await api.patch(`/equipos/${id}/reactivar`);
                fetchData();
            } catch (err) { alert('Error al reactivar'); }
        }
    };

    return (
        <Sidebar>
            <div className="space-y-6">
                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Inventario</h1>
                        <p className="text-slate-400 mt-1">
                            {total} equipo{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => openModal('create')}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Plus size={20} /> Nuevo Equipo
                    </button>
                </div>

                {/* TABS */}
                <div className="flex gap-2 p-1 bg-white/5 w-fit rounded-2xl border border-white/10">
                    {['activos', 'bajas'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* BUSCADOR */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, serie o código..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>

                {/* TABLA */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Equipo</th>
                                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Modelo</th>
                                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Ubicación</th>
                                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Estado</th>
                                <th className="p-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-500" size={40} />
                                    </td>
                                </tr>
                            ) : equipos.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center text-slate-500 italic">
                                        No se encontraron equipos
                                    </td>
                                </tr>
                            ) : equipos.map(e => (
                                <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="text-[10px] font-black opacity-20 w-8">#{e.id}</div>
                                            <div>
                                                <p className="font-bold text-sm leading-none mb-1 text-white">{e.nombre}</p>
                                                <p className="text-[10px] font-mono opacity-50">{e.codigo}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-xs font-bold text-slate-300">{e.modelo?.marca?.nombre} {e.modelo?.nombre}</p>
                                        <p className="text-[10px] opacity-40 uppercase">{e.modelo?.tipo_equipo?.nombre}</p>
                                    </td>
                                    <td className="p-6 text-xs font-medium opacity-60">
                                        <MapPin size={14} className="inline mr-1" /> {e.sucursal?.nombre}
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase ${
                                            e.estado === 'DISPONIBLE' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                                            : e.estado === 'ASIGNADO' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10'
                                            : e.estado === 'REPARACION' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10'
                                            : 'text-red-500 border-red-500/20 bg-red-500/10'
                                        }`}>
                                            {e.estado}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openModal('view', e)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg" title="Ficha Técnica"><Eye size={18} /></button>
                                            {activeTab === 'activos' ? (
                                                <>
                                                    {e.estado === 'DISPONIBLE' && (
                                                        <button onClick={() => openAssignModal(e)} className="p-2 hover:bg-purple-500/10 text-purple-500 rounded-lg" title="Asignar"><UserPlus size={18} /></button>
                                                    )}
                                                    {e.estado === 'ASIGNADO' && (
                                                        <button onClick={() => handleDesasignar(e.id)} className="p-2 hover:bg-orange-500/10 text-orange-500 rounded-lg" title="Desasignar"><ArrowLeftRight size={18} /></button>
                                                    )}
                                                    <button onClick={() => openModal('edit', e)} className="p-2 hover:bg-amber-500/10 text-amber-500 rounded-lg" title="Editar"><Edit2 size={18} /></button>
                                                    <button onClick={() => handleBajaLogica(e.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg" title="Baja"><Trash2 size={18} /></button>
                                                </>
                                            ) : (
                                                <button onClick={() => handleReactivar(e.id)} className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg" title="Reactivar"><ShieldCheck size={18} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* PAGINACIÓN */}
                    {pages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                            <span className="text-xs text-slate-500">
                                Página {page} de {pages} — {total} resultados
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                                    disabled={page === pages}
                                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL FICHA / EDITAR — sin cambios en su contenido interno */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
                    <div className="bg-[#0B0F1A] border border-white/10 w-full max-w-6xl rounded-[3rem] p-10 relative overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all"><X size={32} /></button>

                        <div className="flex items-center gap-4 mb-10">
                            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-600/30">
                                {modalMode === 'view' ? <FileText size={24} /> : <Package size={24} />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">
                                    {modalMode === 'create' ? 'Nuevo Ingreso' : modalMode === 'edit' ? 'Edición Técnica' : `Ficha: ${formData.codigo}`}
                                </h2>
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Mantenimiento de Activos</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                            <form onSubmit={handleGuardar} className="lg:col-span-3 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section className="space-y-4">
                                        <h3 className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Info size={14} /> Identificación</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Nombre</label>
                                                <input disabled={modalMode === 'view'} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-white/30 uppercase ml-1">S/N Serie</label>
                                                <input disabled={modalMode === 'view'} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500 font-mono" value={formData.serie} onChange={e => setFormData({ ...formData, serie: e.target.value })} required />
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h3 className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Tag size={14} /> Categorización</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Marca</label>
                                                <select disabled={modalMode === 'view'} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none appearance-none" value={formData.marca_id} onChange={e => setFormData({ ...formData, marca_id: e.target.value, modelo_id: '' })} required>
                                                    <option value="" className="bg-[#0B0F1A]">Marca...</option>
                                                    {marcas.map(m => <option key={m.id} value={m.id} className="bg-[#0B0F1A]">{m.nombre}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Modelo</label>
                                                <select disabled={modalMode === 'view' || !formData.marca_id} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none" value={formData.modelo_id} onChange={e => setFormData({ ...formData, modelo_id: e.target.value })} required>
                                                    <option value="" className="bg-[#0B0F1A]">Modelo...</option>
                                                    {modelosDisponibles.map(m => <option key={m.id} value={m.id} className="bg-[#0B0F1A]">{m.nombre}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Sucursal</label>
                                                <select disabled={modalMode === 'view'} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none" value={formData.sucursal_id} onChange={e => setFormData({ ...formData, sucursal_id: e.target.value })} required>
                                                    <option value="" className="bg-[#0B0F1A]">Ubicación...</option>
                                                    {sucursales.map(s => <option key={s.id} value={s.id} className="bg-[#0B0F1A]">{s.nombre}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <section className="space-y-4">
                                    <h3 className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} /> Detalles Físicos</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Material</label>
                                            <input disabled={modalMode === 'view'} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500" value={formData.material || ''} onChange={e => setFormData({ ...formData, material: e.target.value })} placeholder="Ej: Aluminio" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Color</label>
                                            <input disabled={modalMode === 'view'} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500" value={formData.color || ''} onChange={e => setFormData({ ...formData, color: e.target.value })} placeholder="Ej: Gris" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-white/30 uppercase ml-1">Service Tag</label>
                                            <input disabled={modalMode === 'view'} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500 font-mono" value={formData.service_tag || ''} onChange={e => setFormData({ ...formData, service_tag: e.target.value })} placeholder="Código fabricante" />
                                        </div>
                                    </div>
                                </section>

                                {modalMode === 'view' && (
                                    <section className="space-y-4">
                                        <h3 className="text-purple-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><History size={14} /> Historial de Uso</h3>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
                                            <table className="w-full text-left text-[11px]">
                                                <thead className="bg-white/5 text-white/30">
                                                    <tr>
                                                        <th className="p-4">Fecha</th>
                                                        <th className="p-4">Responsable</th>
                                                        <th className="p-4 text-right">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {historial.length > 0 ? historial.map((h, i) => (
                                                        <tr key={i} className="text-white/60">
                                                            <td className="p-4 font-mono">{new Date(h.fecha_entrega).toLocaleDateString()}</td>
                                                            <td className="p-4">{h.empleado?.nombre} {h.empleado?.apellido}</td>
                                                            <td className="p-4 text-right text-blue-400 font-bold uppercase">{h.estado}</td>
                                                        </tr>
                                                    )) : (
                                                        <tr><td colSpan="3" className="p-8 text-center opacity-20 italic">Sin movimientos registrados</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                )}

                                {modalMode !== 'view' && (
                                    <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-lg uppercase tracking-widest text-xs active:scale-95 transition-all">
                                        {isSaving ? <Loader2 className="animate-spin mx-auto" /> : (modalMode === 'edit' ? 'Guardar Cambios' : 'Registrar en Inventario')}
                                    </button>
                                )}
                            </form>

                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-[2.5rem] flex flex-col items-center justify-center shadow-xl">
                                    <p className="text-[10px] font-black text-black/30 uppercase mb-4 tracking-widest text-center">Identificación Digital</p>
                                    {formData.id ? (
                                        <QRCodeSVG value={`ITL-EQ-${formData.id}`} size={160} level="H" includeMargin />
                                    ) : (
                                        <div className="w-40 h-40 bg-black/5 rounded-2xl flex items-center justify-center"><QrCode className="opacity-10" size={48} /></div>
                                    )}
                                    <p className="text-[10px] font-mono text-black/40 mt-4 italic text-center">{formData.codigo || 'SISTEMA'}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
                                    <h3 className="text-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> Trazabilidad</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[9px] text-white/20 uppercase font-bold">Registro Inicial</p>
                                            <p className="text-xs text-white/60 font-mono">{formData.created_at ? new Date(formData.created_at).toLocaleString() : '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-white/20 uppercase font-bold">Último Cambio</p>
                                            <p className="text-xs text-blue-400 font-mono">{formData.updated_at ? new Date(formData.updated_at).toLocaleString() : '---'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE ASIGNACIÓN */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
                    <div className="bg-[#0B0F1A] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 text-white">
                            <h2 className="text-xl font-bold uppercase italic tracking-tighter">Asignar Equipo</h2>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-white/20 hover:text-white transition-all"><X size={24} /></button>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl mb-6 border border-white/5">
                            <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Activo</p>
                            <p className="text-white font-bold text-sm">{formData.nombre}</p>
                            <p className="text-[10px] font-mono text-white/30">{formData.codigo}</p>
                        </div>
                        <form onSubmit={handleConfirmarAsignacion} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Colaborador</label>
                                <select className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-purple-500 transition-all" value={assignData.empleado_id} onChange={e => setAssignData({ ...assignData, empleado_id: e.target.value })} required>
                                    <option value="" className="bg-[#0B0F1A]">Seleccionar responsable...</option>
                                    {empleados.filter(e => e.estado).map(emp => (
                                        <option key={emp.id} value={emp.id} className="bg-[#0B0F1A]">{emp.nombre} {emp.apellido} — {emp.area?.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Observaciones</label>
                                <textarea className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-white outline-none h-24 resize-none" placeholder="Estado físico, accesorios incluidos..." value={assignData.notas} onChange={e => setAssignData({ ...assignData, notas: e.target.value })} />
                            </div>
                            <button type="submit" disabled={isSaving} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl shadow-lg uppercase tracking-widest text-xs transition-all active:scale-95">
                                {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar Asignación'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Sidebar>
    );
};

export default Inventario;
