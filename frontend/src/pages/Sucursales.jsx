import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2, Loader2, MapPin, X, Building2, Phone, Hash, CheckCircle2, XCircle } from 'lucide-react';

const Sucursales = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ 
        nombre: '', 
        prefix: '', 
        direccion: '', 
        telefono: '',
        estado: true 
    });

    const fetchData = async () => {
        try {
            const res = await api.get('/sucursales');
            setData(res.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = (sucursal = null) => {
        if (sucursal) {
            setEditId(sucursal.id);
            setFormData({ 
                nombre: sucursal.nombre, 
                prefix: sucursal.prefix, 
                direccion: sucursal.direccion,
                telefono: sucursal.telefono || '',
                estado: sucursal.estado
            });
        } else {
            setEditId(null);
            setFormData({ nombre: '', prefix: '', direccion: '', telefono: '', estado: true });
        }
        setIsModalOpen(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editId) {
                await api.put(`/sucursales/${editId}`, formData);
            } else {
                await api.post('/sucursales', formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) { alert("Error al procesar sucursal"); } finally { setIsSaving(false); }
    };

    const handleEliminar = async (id) => {
        if (window.confirm("¿Eliminar esta sucursal?")) {
            try { await api.delete(`/sucursales/${id}`); fetchData(); } catch (err) { alert("Error al eliminar"); }
        }
    };

    const filteredData = data.filter(s => 
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.prefix.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Sidebar>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Sucursales</h1>
                        <p className="text-slate-400 mt-1">Sedes físicas y centros de distribución del ITL.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                        <Plus size={20} /> Nueva Sucursal
                    </button>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Buscar por nombre o prefijo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner" />
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Prefijo</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Sucursal</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Contacto / Ubicación</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {loading ? (
                                <tr><td colSpan="5" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
                            ) : filteredData.map((s) => (
                                <tr key={s.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg font-mono text-xs font-bold border border-blue-500/20">
                                            {s.prefix}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-all shadow-inner"><Building2 size={18} /></div>
                                            <span className="text-slate-200 font-semibold">{s.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 space-y-1">
                                        <div className="flex items-center gap-2 text-slate-400 text-xs"><MapPin size={12} className="text-slate-600" /> {s.direccion}</div>
                                        <div className="flex items-center gap-2 text-slate-500 text-xs"><Phone size={12} className="text-slate-600" /> {s.telefono || 'Sin teléfono'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.estado ? (
                                            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-400/5 px-2.5 py-1 rounded-full border border-emerald-400/10">
                                                <CheckCircle2 size={12} /> Activa
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold bg-red-400/5 px-2.5 py-1 rounded-full border border-red-400/10">
                                                <XCircle size={12} /> Inactiva
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg transition-all"><Edit2 size={16} /></button>
                                            <button onClick={() => handleEliminar(s.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL AMPLIADO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0B0F1A] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                        
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{editId ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
                            <p className="text-slate-400 text-sm mt-1">Completa los datos de la sede física.</p>
                        </div>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre de Sede</label>
                                    <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-blue-500/50" placeholder="Ej. Campus Laguna" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Prefijo</label>
                                    <input type="text" maxLength={5} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-blue-500/50 uppercase font-mono" placeholder="TOR" value={formData.prefix} onChange={(e) => setFormData({...formData, prefix: e.target.value.toUpperCase()})} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Teléfono</label>
                                    <input type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-blue-500/50" placeholder="871 123 4567" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Estado Operativo</label>
                                    <select className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-blue-500/50 appearance-none" value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value === 'true'})}>
                                        <option value="true" className="bg-[#0B0F1A]">Activo</option>
                                        <option value="false" className="bg-[#0B0F1A]">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Dirección Completa</label>
                                <textarea className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-blue-500/50 h-24 resize-none shadow-inner" placeholder="Calle, número, colonia y ciudad..." value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} required />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold py-4 rounded-2xl transition-all">Cerrar</button>
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

export default Sucursales;