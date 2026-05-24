import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { 
    Plus, Search, Edit2, Loader2, X, 
    Monitor, UserCheck, UserMinus, ShieldCheck, ShieldAlert 
} from 'lucide-react';

const TiposEquipo = () => {
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('activos'); 
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', estado: true });

    const fetchData = async () => {
        try {
            const res = await api.get('/tipos-equipo');
            setTipos(res.data);
        } catch (err) { 
            console.error("Error al cargar categorías:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredData = tipos.filter(t => {
        const matchesTab = activeTab === 'activos' ? t.estado === true : t.estado === false;
        const matchesSearch = t.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleOpenModal = (tipo = null) => {
        if (tipo) {
            setEditId(tipo.id);
            setFormData({ nombre: tipo.nombre, estado: tipo.estado });
        } else {
            setEditId(null);
            setFormData({ nombre: '', estado: true });
        }
        setIsModalOpen(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editId) await api.put(`/tipos-equipo/${editId}`, formData);
            else await api.post('/tipos-equipo', formData);
            setIsModalOpen(false);
            fetchData();
        } catch (err) { 
            alert("Error al guardar la categoría."); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleToggleEstado = async (tipo) => {
        const nuevoEstado = !tipo.estado;
        const mensaje = nuevoEstado 
            ? `¿Reactivar la categoría "${tipo.nombre}"?`
            : `¿Dar de baja la categoría "${tipo.nombre}"?`;

        if (window.confirm(mensaje)) {
            try {
                if (!nuevoEstado) await api.delete(`/tipos-equipo/${tipo.id}`);
                else await api.put(`/tipos-equipo/${tipo.id}`, { ...tipo, estado: true });
                fetchData();
            } catch (err) { 
                alert("Error al cambiar el estado"); 
            }
        }
    };

    return (
        <Sidebar>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Tipos de Equipo</h1>
                        <p className="text-text-secondary mt-1">Categorización global de activos de TI.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-custom font-bold transition-all shadow-lg active:scale-95 cursor-pointer">
                        <Plus size={20} /> Nueva Categoría
                    </button>
                </div>

                {/* TABS VARIABLES */}
                <div className="flex gap-2 p-1 bg-bg-card-hover w-fit rounded-2xl border border-border-app">
                    <button 
                        onClick={() => setActiveTab('activos')} 
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'activos' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        <ShieldCheck size={16} /> Activos
                    </button>
                    <button 
                        onClick={() => setActiveTab('bajas')} 
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'bajas' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        <ShieldAlert size={16} /> Inactivos
                    </button>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input type="text" placeholder="Buscar categoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-bg-input border border-border-app rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:border-accent transition-all placeholder:text-text-muted" />
                </div>

                <div className="bg-bg-card border border-border-app rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border-app bg-bg-card-hover">
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Nombre de Categoría</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-app">
                            {loading ? (
                                <tr><td colSpan="2" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" size={32} /></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="2" className="py-10 text-center text-text-muted italic">No hay categorías en esta sección.</td></tr>
                            ) : filteredData.map((t) => (
                                <tr key={t.id} className="hover:bg-bg-card-hover transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.estado ? 'bg-accent/10 text-accent' : 'bg-bg-input text-text-muted'}`}>
                                                <Monitor size={18} />
                                            </div>
                                            <span className="text-text-primary font-semibold">{t.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(t)} className="p-2 text-text-muted hover:text-accent rounded-lg transition-all cursor-pointer"><Edit2 size={16} /></button>
                                            {t.estado ? (
                                                <button onClick={() => handleToggleEstado(t)} className="p-2 text-text-muted hover:text-red-500 rounded-lg transition-all cursor-pointer"><UserMinus size={16} /></button>
                                            ) : (
                                                <button onClick={() => handleToggleEstado(t)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all cursor-pointer"><UserCheck size={16} /></button>
                                            )}
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
                        <h2 className="text-2xl font-bold text-text-primary mb-8 tracking-tight">{editId ? 'Editar Categoría' : 'Nueva Categoría de Equipo'}</h2>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Nombre de la Categoría</label>
                                <input type="text" className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary focus:border-accent outline-none placeholder:text-text-muted transition-all" placeholder="Ej. Laptops, Monitores..." value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
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

export default TiposEquipo;