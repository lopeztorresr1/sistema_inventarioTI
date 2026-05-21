import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { 
    Plus, Search, Edit2, Trash2, Loader2, X, 
    Settings, Tags, Cpu, CheckCircle2 
} from 'lucide-react';

// CAMBIO AQUÍ: Nombre con Mayúscula
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
                        <h1 className="text-3xl font-bold text-white tracking-tight">Catálogo de Modelos</h1>
                        <p className="text-slate-400 mt-1">Especificaciones técnicas por fabricante y categoría.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                        <Plus size={20} /> Nuevo Modelo
                    </button>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Filtrar por modelo, marca o tipo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Modelo Técnico</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Fabricante (Marca)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Categoría (Tipo)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {loading ? (
                                <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
                            ) : filteredData.map((m) => (
                                <tr key={m.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 transition-all shadow-inner"><Settings size={18} /></div>
                                            <span className="text-slate-200 font-semibold">{m.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Tags size={14} className="text-slate-600" />
                                            {m.marca?.nombre || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-400 bg-white/5 w-fit px-3 py-1 rounded-full border border-white/5">
                                            <Cpu size={14} className="text-blue-400" />
                                            <span className="text-xs uppercase font-bold tracking-tighter">{m.tipo_equipo?.nombre || 'Genérico'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(m)} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg transition-all"><Edit2 size={16} /></button>
                                            <button onClick={() => handleEliminar(m.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-all"><Trash2 size={16} /></button>
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
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={24} /></button>
                        <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">{editId ? 'Editar Modelo' : 'Nuevo Modelo'}</h2>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre del Modelo</label>
                                <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-blue-500/50 outline-none" placeholder="Ej. Latitude 5420, ThinkPad X1..." value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Marca / Fabricante</label>
                                    <select className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-blue-500/50 appearance-none outline-none" value={formData.marca_id} onChange={(e) => setFormData({...formData, marca_id: e.target.value})} required>
                                        <option value="" className="bg-[#0B0F1A]">Seleccionar...</option>
                                        {marcas.map(m => <option key={m.id} value={m.id} className="bg-[#0B0F1A]">{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Equipo</label>
                                    <select className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-blue-500/50 appearance-none outline-none" value={formData.tipo_equipo_id} onChange={(e) => setFormData({...formData, tipo_equipo_id: e.target.value})} required>
                                        <option value="" className="bg-[#0B0F1A]">Seleccionar...</option>
                                        {tipos.map(t => <option key={t.id} value={t.id} className="bg-[#0B0F1A]">{t.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold py-4 rounded-2xl transition-all">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
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

// CAMBIO AQUÍ: Exportar con Mayúscula
export default Modelos;