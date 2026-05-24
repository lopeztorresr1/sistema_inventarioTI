import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2, Loader2, Layers, X, Users2, CheckCircle2, XCircle } from 'lucide-react';

const Areas = () => {
    const [areas, setAreas] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ 
        nombre: '', 
        grupo_id: '',
        estado: true 
    });

    const fetchData = async () => {
        try {
            const [resAreas, resGrupos] = await Promise.all([
                api.get('/areas'),
                api.get('/grupos')
            ]);
            setAreas(resAreas.data);
            setGrupos(resGrupos.data);
        } catch (err) { 
            console.error("Error al cargar datos:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = (area = null) => {
        if (area) {
            setEditId(area.id);
            setFormData({ 
                nombre: area.nombre, 
                grupo_id: area.grupo_id,
                estado: area.estado
            });
        } else {
            setEditId(null);
            setFormData({ nombre: '', grupo_id: '', estado: true });
        }
        setIsModalOpen(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        const payload = { ...formData, grupo_id: Number(formData.grupo_id) };
        
        setIsSaving(true);
        try {
            if (editId) {
                await api.put(`/areas/${editId}`, payload);
            } else {
                await api.post('/areas', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) { 
            alert("Error al procesar el área."); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm("¿Deseas eliminar esta área?")) {
            try { 
                await api.delete(`/areas/${id}`); 
                fetchData(); 
            } catch (err) { 
                alert("No se pudo eliminar el área. Verifica si tiene activos asignados."); 
            }
        }
    };

    const filteredData = areas.filter(a => 
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.grupo?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Sidebar>
            <div className="space-y-6">
                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Áreas Operativas</h1>
                        <p className="text-text-secondary mt-1">Subdivisiones de los grupos de trabajo del ITL.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-custom font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Plus size={20} /> Nueva Área
                    </button>
                </div>

                {/* BUSCADOR */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por área o grupo..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-bg-input border border-border-app rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:border-accent transition-all placeholder:text-text-muted" 
                    />
                </div>

                {/* TABLA DE CONTENIDO */}
                <div className="bg-bg-card border border-border-app rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border-app bg-bg-card-hover">
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Área</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Grupo Perteneciente</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-app">
                            {loading ? (
                                <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" size={32} /></td></tr>
                            ) : filteredData.length > 0 ? filteredData.map((a) => (
                                <tr key={a.id} className="hover:bg-bg-card-hover transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all"><Layers size={18} /></div>
                                            <span className="text-text-primary font-semibold">{a.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <Users2 size={14} className="text-text-muted" /> 
                                            <span className="text-sm">{a.grupo?.nombre || 'Sin grupo'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            {a.estado ? (
                                                <CheckCircle2 size={18} className="text-emerald-500/60" />
                                            ) : (
                                                <XCircle size={18} className="text-red-500/60" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(a)} className="p-2 text-text-muted hover:text-accent rounded-lg transition-all cursor-pointer"><Edit2 size={16} /></button>
                                            <button onClick={() => handleEliminar(a.id)} className="p-2 text-text-muted hover:text-red-500 rounded-lg transition-all cursor-pointer"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="py-12 text-center text-text-muted font-medium italic">No hay áreas que mostrar.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* WINDOWS EMERGENTE / MODAL — COMPLETAMENTE ADAPTATIVO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                    <div className="bg-bg-card border border-border-app w-full max-w-md rounded-custom p-10 shadow-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-text-muted hover:text-text-primary transition-colors cursor-pointer"><X size={24} /></button>
                        
                        <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-8">{editId ? 'Editar Área' : 'Nueva Área'}</h2>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            {/* INPUT DE NOMBRE */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Nombre del Área</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary focus:border-accent transition-all outline-none placeholder:text-text-muted" 
                                    placeholder="Ej. Redes y Telecomunicaciones" 
                                    value={formData.nombre} 
                                    onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                                    required 
                                />
                            </div>

                            {/* SELECT DE GRUPO */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Asignar a Grupo</label>
                                <select 
                                    className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary focus:border-accent appearance-none outline-none cursor-pointer"
                                    value={formData.grupo_id} 
                                    onChange={(e) => setFormData({...formData, grupo_id: e.target.value})} 
                                    required
                                >
                                    <option value="" className="bg-bg-card text-text-primary">Seleccionar grupo...</option>
                                    {grupos.map(g => (
                                        <option key={g.id} value={g.id} className="bg-bg-card text-text-primary font-bold">
                                            {g.nombre} {g.sucursal?.prefix ? `(${g.sucursal.prefix})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* SWITCH DE ESTADO */}
                            <div className="flex items-center gap-3 px-1 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, estado: !formData.estado})}
                                    className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${formData.estado ? 'bg-accent' : 'bg-bg-input border border-border-app'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${formData.estado ? 'left-7 bg-white' : 'left-1 bg-text-muted'}`} />
                                </button>
                                <span className="text-sm font-medium text-text-secondary">Área Operativa Activa</span>
                            </div>

                            {/* BOTONES DE ACCIÓN */}
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="flex-1 bg-bg-card-hover border border-border-app text-text-primary font-bold py-4 rounded-2xl transition-all cursor-pointer hover:brightness-95"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving} 
                                    className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                                >
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

export default Areas;