import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2, Loader2, MapPin, X, Building2, Phone, CheckCircle2, XCircle } from 'lucide-react';

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
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Sucursales</h1>
                        <p className="text-text-secondary mt-1">Sedes físicas y centros de distribución del ITL.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-custom font-bold transition-all shadow-lg active:scale-95 cursor-pointer">
                        <Plus size={20} /> Nueva Sucursal
                    </button>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o prefijo..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-bg-input border border-border-app rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:border-accent transition-all placeholder:text-text-muted" 
                    />
                </div>

                <div className="bg-bg-card border border-border-app rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-app bg-bg-card-hover">
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">Prefijo</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Sucursal</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Contacto / Ubicación</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-app">
                            {loading ? (
                                <tr><td colSpan="5" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" size={32} /></td></tr>
                            ) : filteredData.map((s) => (
                                <tr key={s.id} className="hover:bg-bg-card-hover transition-colors group">
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-3 py-1 bg-accent/10 text-accent rounded-lg font-mono text-xs font-bold border border-accent/20">
                                            {s.prefix}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-all shadow-inner"><Building2 size={18} /></div>
                                            <span className="text-text-primary font-semibold">{s.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 space-y-1">
                                        <div className="flex items-center gap-2 text-text-secondary text-xs"><MapPin size={12} className="text-text-muted" /> {s.direccion}</div>
                                        <div className="flex items-center gap-2 text-text-muted text-xs"><Phone size={12} className="text-text-muted" /> {s.telefono || 'Sin teléfono'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.estado ? (
                                            <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 w-fit">
                                                <CheckCircle2 size={12} /> Activa
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-red-500 text-xs font-bold bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 w-fit">
                                                <XCircle size={12} /> Inactiva
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(s)} className="p-2 text-text-muted hover:text-accent rounded-lg transition-all cursor-pointer"><Edit2 size={16} /></button>
                                            <button onClick={() => handleEliminar(s.id)} className="p-2 text-text-muted hover:text-red-500 rounded-lg transition-all cursor-pointer"><Trash2 size={16} /></button>
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
                        
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary tracking-tight">{editId ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
                            <p className="text-text-secondary text-sm mt-1">Completa los datos de la sede física.</p>
                        </div>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Nombre de Sede</label>
                                    <input type="text" className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent transition-all placeholder:text-text-muted" placeholder="Ej. Campus Laguna" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Prefijo</label>
                                    <input type="text" maxLength={5} className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent uppercase font-mono transition-all" placeholder="TOR" value={formData.prefix} onChange={(e) => setFormData({...formData, prefix: e.target.value.toUpperCase()})} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Teléfono</label>
                                    <input type="text" className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent transition-all placeholder:text-text-muted" placeholder="871 123 4567" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Estado Operativo</label>
                                    <select className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent cursor-pointer" value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value === 'true'})}>
                                        <option value="true" className="bg-bg-card text-text-primary">Activo</option>
                                        <option value="false" className="bg-bg-card text-text-primary">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Dirección Completa</label>
                                <textarea className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent h-24 resize-none placeholder:text-text-muted transition-all" placeholder="Calle, número, colonia y ciudad..." value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} required />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-bg-card-hover border border-border-app text-text-primary font-bold py-4 rounded-2xl transition-all cursor-pointer">Cerrar</button>
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

export default Sucursales;