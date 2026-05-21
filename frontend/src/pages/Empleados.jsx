import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { 
    Plus, Search, Edit2, Loader2, X, 
    Briefcase, MapPin, Users, Layers, UserCheck, UserMinus, ShieldCheck, ShieldAlert 
} from 'lucide-react';

const Empleados = () => {
    const [empleados, setEmpleados] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('activos'); // 'activos' o 'bajas'
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ 
        nombre: '', apellido: '', cargo: '', 
        sucursal_id: '', grupo_id: '', area_id: '', estado: true 
    });

    const fetchData = async () => {
        try {
            const [resEmp, resSuc, resGru, resArea] = await Promise.all([
                api.get('/empleados'),
                api.get('/sucursales'),
                api.get('/grupos'),
                api.get('/areas')
            ]);
            setEmpleados(resEmp.data);
            setSucursales(resSuc.data);
            setGrupos(resGru.data);
            setAreas(resArea.data);
        } catch (err) { 
            console.error("Error al cargar datos:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Lógica de filtrado por Pestaña y por Búsqueda
    const filteredData = empleados.filter(e => {
        const matchesTab = activeTab === 'activos' ? e.estado === true : e.estado === false;
        const matchesSearch = (e.nombre + " " + e.apellido).toLowerCase().includes(searchTerm.toLowerCase()) ||
                             e.cargo.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // Lógica de filtrado para el Modal (Cascada)
    const gruposFiltrados = grupos.filter(g => g.sucursal_id === Number(formData.sucursal_id));
    const areasFiltradas = areas.filter(a => a.grupo_id === Number(formData.grupo_id));

    const handleOpenModal = (emp = null) => {
        if (emp) {
            setEditId(emp.id);
            setFormData({ 
                nombre: emp.nombre, apellido: emp.apellido, cargo: emp.cargo,
                sucursal_id: emp.sucursal_id, grupo_id: emp.grupo_id, 
                area_id: emp.area_id, estado: emp.estado 
            });
        } else {
            setEditId(null);
            setFormData({ nombre: '', apellido: '', cargo: '', sucursal_id: '', grupo_id: '', area_id: '', estado: true });
        }
        setIsModalOpen(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const payload = {
            ...formData,
            sucursal_id: Number(formData.sucursal_id),
            grupo_id: Number(formData.grupo_id),
            area_id: Number(formData.area_id)
        };

        try {
            if (editId) await api.put(`/empleados/${editId}`, payload);
            else await api.post('/empleados', payload);
            setIsModalOpen(false);
            fetchData();
        } catch (err) { 
            alert("Error al procesar la solicitud"); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleToggleEstado = async (empleado) => {
        const nuevoEstado = !empleado.estado;
        const mensaje = nuevoEstado 
            ? `¿Deseas reactivar a ${empleado.nombre}? Volverá a aparecer en la lista de activos.`
            : `¿Confirmar baja de ${empleado.nombre}? Se moverá al historial de bajas.`;

        if (window.confirm(mensaje)) {
            try {
                // Si el backend usa el Delete para baja, lo llamamos. Si es reactivación, usamos PUT.
                if (!nuevoEstado) {
                    await api.delete(`/empleados/${empleado.id}`);
                } else {
                    await api.put(`/empleados/${empleado.id}`, { ...empleado, estado: true });
                }
                fetchData();
            } catch (err) { 
                alert("Error al cambiar el estado del empleado"); 
            }
        }
    };

    return (
        <Sidebar>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Empleados</h1>
                        <p className="text-slate-400 mt-1">Control y trazabilidad de colaboradores del ITL.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                        <Plus size={20} /> Nuevo Colaborador
                    </button>
                </div>

                {/* SELECTOR DE PESTAÑAS (TABS) */}
                <div className="flex gap-2 p-1 bg-white/5 w-fit rounded-2xl border border-white/10">
                    <button 
                        onClick={() => setActiveTab('activos')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'activos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ShieldCheck size={16} /> Activos
                    </button>
                    <button 
                        onClick={() => setActiveTab('bajas')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bajas' ? 'bg-red-600/20 text-red-400 border border-red-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ShieldAlert size={16} /> Historial de Bajas
                    </button>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Buscar por nombre o cargo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Colaborador</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ubicación</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Departamento</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {loading ? (
                                <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="4" className="py-10 text-center text-slate-500 text-sm">No se encontraron colaboradores en esta sección.</td></tr>
                            ) : filteredData.map((e) => (
                                <tr key={e.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${e.estado ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-slate-700 opacity-50'}`}>
                                                {e.nombre[0]}{e.apellido[0]}
                                            </div>
                                            <div>
                                                <p className="text-slate-200 font-semibold">{e.nombre} {e.apellido}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1"><Briefcase size={10}/> {e.cargo}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin size={14} className={e.estado ? "text-red-400/50" : "text-slate-600"} /> {e.sucursal?.nombre}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="text-xs text-slate-300 flex items-center gap-1"><Users size={12} className={e.estado ? "text-blue-400" : "text-slate-600"} /> {e.grupo?.nombre}</div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-tighter font-medium"><Layers size={10} /> {e.area?.nombre}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(e)} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg transition-all" title="Editar"><Edit2 size={16} /></button>
                                            {e.estado ? (
                                                <button onClick={() => handleToggleEstado(e)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-all" title="Dar de baja"><UserMinus size={16} /></button>
                                            ) : (
                                                <button onClick={() => handleToggleEstado(e)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all" title="Reactivar"><UserCheck size={16} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0B0F1A] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                        <h2 className="text-2xl font-bold text-white mb-8 tracking-tight flex items-center gap-3">
                            {editId ? <UserCheck className="text-blue-500" /> : <Plus className="text-blue-500" />}
                            {editId ? 'Editar Perfil del Colaborador' : 'Registrar Nuevo Empleado'}
                        </h2>

                        <form onSubmit={handleGuardar} className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                                <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500/50 transition-all" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Apellido</label>
                                <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500/50 transition-all" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} required />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cargo / Puesto Administrativo</label>
                                <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500/50 transition-all" placeholder="Ej. Jefe de Soporte Técnico" value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} required />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Sede / Sucursal</label>
                                <select className="w-full bg-[#161B26] border border-white/10 rounded-2xl py-4 px-5 text-white appearance-none outline-none focus:border-blue-500/50" value={formData.sucursal_id} onChange={(e) => setFormData({...formData, sucursal_id: e.target.value, grupo_id: '', area_id: ''})} required>
                                    <option value="">Seleccionar sede...</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Grupo Organizacional</label>
                                <select className="w-full bg-[#161B26] border border-white/10 rounded-2xl py-4 px-5 text-white appearance-none outline-none focus:border-blue-500/50 disabled:opacity-30" value={formData.grupo_id} onChange={(e) => setFormData({...formData, grupo_id: e.target.value, area_id: ''})} disabled={!formData.sucursal_id} required>
                                    <option value="">Seleccionar grupo...</option>
                                    {gruposFiltrados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                                </select>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Área Funcional</label>
                                <select className="w-full bg-[#161B26] border border-white/10 rounded-2xl py-4 px-5 text-white appearance-none outline-none focus:border-blue-500/50 disabled:opacity-30" value={formData.area_id} onChange={(e) => setFormData({...formData, area_id: e.target.value})} disabled={!formData.grupo_id} required>
                                    <option value="">Seleccionar área...</option>
                                    {areasFiltradas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                </select>
                            </div>

                            <div className="col-span-2 flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold py-4 rounded-2xl transition-all active:scale-95">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : (editId ? 'Guardar Cambios' : 'Finalizar Registro')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Sidebar>
    );
};

export default Empleados;