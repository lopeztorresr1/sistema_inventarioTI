import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2, Loader2, Users2, X, Building2, CheckCircle2, XCircle } from 'lucide-react';

const Grupos = () => {
    const [grupos, setGrupos] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ 
        nombre: '', 
        sucursal_id: '',
        estado: true 
    });

    const fetchData = async () => {
        try {
            const [resGrupos, resSucursales] = await Promise.all([
                api.get('/grupos'),
                api.get('/sucursales')
            ]);
            setGrupos(resGrupos.data);
            setSucursales(resSucursales.data);
        } catch (err) { 
            console.error("Error al cargar datos:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = (grupo = null) => {
        if (grupo) {
            setEditId(grupo.id);
            setFormData({ 
                nombre: grupo.nombre, 
                sucursal_id: grupo.sucursal_id,
                estado: grupo.estado
            });
        } else {
            setEditId(null);
            setFormData({ nombre: '', sucursal_id: '', estado: true });
        }
        setIsModalOpen(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        // Validación básica: GORM necesita el ID como número
        const payload = { ...formData, sucursal_id: Number(formData.sucursal_id) };
        
        setIsSaving(true);
        try {
            if (editId) {
                await api.put(`/grupos/${editId}`, payload);
            } else {
                await api.post('/grupos', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) { 
            alert("Error al procesar el grupo. Verifica que hayas seleccionado una sucursal."); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm("¿Deseas eliminar este grupo?")) {
            try { 
                await api.delete(`/grupos/${id}`); 
                fetchData(); 
            } catch (err) { 
                alert("Error al eliminar"); 
            }
        }
    };

    const filteredData = grupos.filter(g => 
        g.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.sucursal?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Sidebar>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Grupos de Trabajo</h1>
                        <p className="text-slate-400 mt-1">Organiza a los empleados por equipos y sedes.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                        <Plus size={20} /> Nuevo Grupo
                    </button>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Buscar por grupo o sucursal..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner" />
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nombre del Grupo</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Sucursal Asignada</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {loading ? (
                                <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
                            ) : filteredData.length > 0 ? filteredData.map((g) => (
                                <tr key={g.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-all"><Users2 size={18} /></div>
                                            <span className="text-slate-200 font-semibold">{g.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Building2 size={14} className="text-slate-600" /> 
                                            <span className="text-sm">{g.sucursal?.nombre || 'Sin sucursal'}</span>
                                            {g.sucursal?.prefix && <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 font-mono">{g.sucursal.prefix}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            {g.estado ? (
                                                <CheckCircle2 size={18} className="text-emerald-500/50" />
                                            ) : (
                                                <XCircle size={18} className="text-red-500/50" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(g)} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg transition-all"><Edit2 size={16} /></button>
                                            <button onClick={() => handleEliminar(g.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="py-12 text-center text-slate-500">No se encontraron grupos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0B0F1A] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                        
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-8">{editId ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre del Grupo</label>
                                <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-blue-500/50" placeholder="Ej. Soporte Técnico" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Sede / Sucursal</label>
                                <select 
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-blue-500/50 appearance-none outline-none"
                                    value={formData.sucursal_id} 
                                    onChange={(e) => setFormData({...formData, sucursal_id: e.target.value})} 
                                    required
                                >
                                    <option value="" className="bg-[#0B0F1A]">Seleccionar sede...</option>
                                    {sucursales.map(s => (
                                        <option key={s.id} value={s.id} className="bg-[#0B0F1A]">
                                            {s.nombre} ({s.prefix})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3 px-1 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, estado: !formData.estado})}
                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.estado ? 'bg-blue-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.estado ? 'left-7' : 'left-1'}`} />
                                </button>
                                <span className="text-sm font-medium text-slate-300">Grupo Activo</span>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold py-4 rounded-2xl transition-all">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : (editId ? 'Actualizar' : 'Crear')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Sidebar>
    );
};

export default Grupos;