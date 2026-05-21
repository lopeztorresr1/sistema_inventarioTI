import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { 
    Plus, Search, Edit2, Loader2, X, 
    Monitor, Laptop, Smartphone, MousePointer2, 
    UserCheck, UserMinus, ShieldCheck, ShieldAlert 
} from 'lucide-react';

const TiposEquipo = () => {
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('activos'); // 'activos' o 'bajas'
    
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

    // Filtrado por Pestaña y Búsqueda
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
            alert("Error al guardar la categoría. Asegúrate de que el nombre no esté duplicado."); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleToggleEstado = async (tipo) => {
        const nuevoEstado = !tipo.estado;
        const mensaje = nuevoEstado 
            ? `¿Reactivar la categoría "${tipo.nombre}"?`
            : `¿Dar de baja la categoría "${tipo.nombre}"? No se eliminará, pero no aparecerá en nuevos registros.`;

        if (window.confirm(mensaje)) {
            try {
                if (!nuevoEstado) {
                    await api.delete(`/tipos-equipo/${tipo.id}`);
                } else {
                    await api.put(`/tipos-equipo/${tipo.id}`, { ...tipo, estado: true });
                }
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
                        <h1 className="text-3xl font-bold text-white tracking-tight">Tipos de Equipo</h1>
                        <p className="text-slate-400 mt-1">Categorización global de activos de TI.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                        <Plus size={20} /> Nueva Categoría
                    </button>
                </div>

                {/* TABS */}
                <div className="flex gap-2 p-1 bg-white/5 w-fit rounded-2xl border border-white/10">
                    <button onClick={() => setActiveTab('activos')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'activos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <ShieldCheck size={16} /> Activos
                    </button>
                    <button onClick={() => setActiveTab('bajas')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bajas' ? 'bg-red-600/20 text-red-400 border border-red-500/20' : 'text-slate-400 hover:text-white'}`}>
                        <ShieldAlert size={16} /> Inactivos
                    </button>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Buscar categoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nombre de Categoría</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {loading ? (
                                <tr><td colSpan="2" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="2" className="py-10 text-center text-slate-500 text-sm">No hay categorías en esta sección.</td></tr>
                            ) : filteredData.map((t) => (
                                <tr key={t.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.estado ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700/50 text-slate-500'}`}>
                                                <Monitor size={20} />
                                            </div>
                                            <span className="text-slate-200 font-semibold">{t.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(t)} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg transition-all" title="Editar"><Edit2 size={16} /></button>
                                            {t.estado ? (
                                                <button onClick={() => handleToggleEstado(t)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-all" title="Dar de baja"><UserMinus size={16} /></button>
                                            ) : (
                                                <button onClick={() => handleToggleEstado(t)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all" title="Reactivar"><UserCheck size={16} /></button>
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
                    <div className="bg-[#0B0F1A] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                        <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">
                            {editId ? 'Editar Categoría' : 'Nueva Categoría de Equipo'}
                        </h2>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre de la Categoría</label>
                                <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500/50 transition-all" placeholder="Ej. Laptops, Monitores, Impresoras..." value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold py-4 rounded-2xl transition-all active:scale-95">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95">
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