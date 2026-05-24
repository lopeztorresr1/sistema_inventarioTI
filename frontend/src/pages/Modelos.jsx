import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2, Loader2, Settings, Tags, Cpu, X } from 'lucide-react';

const Modelos = () => {
    const [modelos, setModelos] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ 
        nombre: '', 
        marca_id: '',
        tipo_equipo_id: ''
    });

    const fetchData = async () => {
        try {
            const [resModelos, resMarcas, resTipos] = await Promise.all([
                api.get('/modelos'),
                api.get('/marcas'),
                api.get('/tipos-equipo')
            ]);
            setModelos(resModelos.data);
            setMarcas(resMarcas.data);
            setTipos(resTipos.data);
        } catch (err) { 
            console.error("Error al cargar catálogos:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = (modelo = null) => {
        if (modelo) {
            setEditId(modelo.id);
            setFormData({ 
                nombre: modelo.nombre, 
                marca_id: modelo.marca_id,
                tipo_equipo_id: modelo.tipo_equipo_id
            });
        } else {
            setEditId(null);
            setFormData({ nombre: '', marca_id: '', tipo_equipo_id: '' });
        }
        setIsModalOpen(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        const payload = { 
            ...formData, 
            marca_id: Number(formData.marca_id),
            tipo_equipo_id: Number(formData.tipo_equipo_id)
        };
        
        setIsSaving(true);
        try {
            if (editId) {
                await api.put(`/modelos/${editId}`, payload);
            } else {
                await api.post('/modelos', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) { 
            alert("Error al procesar el modelo técnico."); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm("¿Deseas eliminar este modelo? Esto podría afectar al inventario.")) {
            try { 
                await api.delete(`/modelos/${id}`); 
                fetchData(); 
            } catch (err) { 
                alert("No se puede eliminar el modelo; probablemente tiene equipos registrados."); 
            }
        }
    };

    const filteredData = modelos.filter(m => 
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.marca?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.tipo_equipo?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Sidebar>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Catálogo de Modelos</h1>
                        <p className="text-text-secondary mt-1">Especificaciones técnicas por fabricante y categoría.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-custom font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Plus size={20} /> Nuevo Modelo
                    </button>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filtrar por modelo, marca o tipo..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-bg-input border border-border-app rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:border-accent transition-all placeholder:text-text-muted" 
                    />
                </div>

                <div className="bg-bg-card border border-border-app rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border-app bg-bg-card-hover">
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Modelo Técnico</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Fabricante (Marca)</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Categoría (Tipo)</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-app">
                            {loading ? (
                                <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" size={32} /></td></tr>
                            ) : filteredData.map((m) => (
                                <tr key={m.id} className="hover:bg-bg-card-hover transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-all shadow-inner"><Settings size={18} /></div>
                                            <span className="text-text-primary font-semibold">{m.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary">
                                        <div className="flex items-center gap-2">
                                            <Tags size={14} className="text-text-muted" />
                                            {m.marca?.nombre || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-text-secondary bg-bg-badge w-fit px-3 py-1 rounded-full border border-border-app">
                                            <Cpu size={14} className="text-accent" />
                                            <span className="text-xs uppercase font-bold tracking-tighter">{m.tipo_equipo?.nombre || 'Genérico'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(m)} className="p-2 text-text-muted hover:text-accent rounded-lg transition-all cursor-pointer"><Edit2 size={16} /></button>
                                            <button onClick={() => handleEliminar(m.id)} className="p-2 text-text-muted hover:text-red-500 rounded-lg transition-all cursor-pointer"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL VARIABLE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                    <div className="bg-bg-card border border-border-app w-full max-w-md rounded-custom p-10 shadow-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-text-muted hover:text-text-primary transition-colors cursor-pointer"><X size={24} /></button>
                        <h2 className="text-2xl font-bold text-text-primary mb-8 tracking-tight">{editId ? 'Editar Modelo' : 'Nuevo Modelo'}</h2>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Nombre del Modelo</label>
                                <input type="text" className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary focus:border-accent outline-none placeholder:text-text-muted transition-all" placeholder="Ej. Latitude 5420, ThinkPad X1..." value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Marca</label>
                                    <select className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none cursor-pointer" value={formData.marca_id} onChange={(e) => setFormData({...formData, marca_id: e.target.value})} required>
                                        <option value="" className="bg-bg-card text-text-primary">Seleccionar...</option>
                                        {marcas.map(m => <option key={m.id} value={m.id} className="bg-bg-card text-text-primary">{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Tipo</label>
                                    <select className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none cursor-pointer" value={formData.tipo_equipo_id} onChange={(e) => setFormData({...formData, tipo_equipo_id: e.target.value})} required>
                                        <option value="" className="bg-bg-card text-text-primary">Seleccionar...</option>
                                        {tipos.map(t => <option key={t.id} value={t.id} className="bg-bg-card text-text-primary">{t.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-bg-card-hover border border-border-app text-text-primary font-bold py-4 rounded-2xl transition-all cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : (editId ? 'Actualizar' : 'Registrar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Sidebar>
    );
};

export default Modelos; 