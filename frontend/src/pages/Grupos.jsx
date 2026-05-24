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
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Grupos de Trabajo</h1>
                        <p className="text-text-secondary mt-1">Organiza a los empleados por equipos y sedes.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-custom font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Plus size={20} /> Nuevo Grupo
                    </button>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por grupo o sucursal..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-bg-input border border-border-app rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:border-accent transition-all placeholder:text-text-muted" 
                    />
                </div>

                <div className="bg-bg-card border border-border-app rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border-app bg-bg-card-hover">
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Nombre del Grupo</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Sucursal Asignada</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-app">
                            {loading ? (
                                <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" size={32} /></td></tr>
                            ) : filteredData.length > 0 ? filteredData.map((g) => (
                                <tr key={g.id} className="hover:bg-bg-card-hover transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-all"><Users2 size={18} /></div>
                                            <span className="text-text-primary font-semibold">{g.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <Building2 size={14} className="text-text-muted" /> 
                                            <span className="text-sm">{g.sucursal?.nombre || 'Sin sucursal'}</span>
                                            {g.sucursal?.prefix && <span className="text-[10px] bg-bg-badge px-1.5 py-0.5 rounded text-text-muted font-mono">{g.sucursal.prefix}</span>}
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
                                            <button onClick={() => handleOpenModal(g)} className="p-2 text-text-muted hover:text-accent rounded-lg transition-all cursor-pointer"><Edit2 size={16} /></button>
                                            <button onClick={() => handleEliminar(g.id)} className="p-2 text-text-muted hover:text-red-500 rounded-lg transition-all cursor-pointer"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="py-12 text-center text-text-muted italic">No se encontraron grupos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL VARIABLE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                    <div className="bg-bg-card border border-border-app w-full max-w-md rounded-custom p-10 shadow-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-text-muted hover:text-text-primary transition-colors cursor-pointer"><X size={24} /></button>
                        
                        <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-8">{editId ? 'Editar Grupo' : 'Nuevo Grupo'}</h2>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Nombre del Grupo</label>
                                <input type="text" className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary focus:border-accent transition-all outline-none placeholder:text-text-muted" placeholder="Ej. Soporte Técnico" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Sede / Sucursal</label>
                                <select 
                                    className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary focus:border-accent appearance-none outline-none cursor-pointer"
                                    value={formData.sucursal_id} 
                                    onChange={(e) => setFormData({...formData, sucursal_id: e.target.value})} 
                                    required
                                >
                                    <option value="" className="bg-bg-card text-text-primary">Seleccionar sede...</option>
                                    {sucursales.map(s => (
                                        <option key={s.id} value={s.id} className="bg-bg-card text-text-primary">
                                            {s.nombre} ({s.prefix})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3 px-1 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, estado: !formData.estado})}
                                    className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${formData.estado ? 'bg-accent' : 'bg-bg-input border border-border-app'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${formData.estado ? 'left-7 bg-white' : 'left-1 bg-text-muted'}`} />
                                </button>
                                <span className="text-sm font-medium text-text-secondary">Grupo Activo</span>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-bg-card-hover border border-border-app text-text-primary font-bold py-4 rounded-2xl transition-all cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95">
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