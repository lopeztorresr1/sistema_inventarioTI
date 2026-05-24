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
                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Gestión de Empleados</h1>
                        <p className="text-text-secondary mt-1">Control y trazabilidad de colaboradores del ITL.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-custom font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Plus size={20} /> Nuevo Colaborador
                    </button>
                </div>

                {/* SELECTOR DE PESTAÑAS (TABS) VARIABLES */}
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
                        <ShieldAlert size={16} /> Historial de Bajas
                    </button>
                </div>

                {/* BUSCADOR */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o cargo..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-bg-input border border-border-app rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:border-accent transition-all placeholder:text-text-muted" 
                    />
                </div>

                {/* TABLA ADAPTATIVA */}
                <div className="bg-bg-card border border-border-app rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border-app bg-bg-card-hover">
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Colaborador</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Ubicación</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Departamento</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-app">
                            {loading ? (
                                <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" size={32} /></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="4" className="py-10 text-center text-text-muted text-sm italic">No se encontraron colaboradores en esta sección.</td></tr>
                            ) : filteredData.map((e) => (
                                <tr key={e.id} className="hover:bg-bg-card-hover transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar Semántico */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${e.estado ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-bg-input text-text-muted border border-border-app'}`}>
                                                {e.nombre[0]}{e.apellido[0]}
                                            </div>
                                            <div>
                                                <p className="text-text-primary font-semibold">{e.nombre} {e.apellido}</p>
                                                <p className="text-xs text-text-secondary flex items-center gap-1"><Briefcase size={10} className="text-text-muted"/> {e.cargo}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary">
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin size={14} className="text-text-muted" /> {e.sucursal?.nombre}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="text-xs text-text-primary font-semibold flex items-center gap-1">
                                                <Users size={12} className="text-text-muted" /> {e.grupo?.nombre}
                                            </div>
                                            <div className="text-[10px] text-text-muted flex items-center gap-1 uppercase tracking-tight font-medium">
                                                <Layers size={10} /> {e.area?.nombre}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(e)} className="p-2 text-text-muted hover:text-accent rounded-lg transition-all cursor-pointer" title="Editar"><Edit2 size={16} /></button>
                                            {e.estado ? (
                                                <button onClick={() => handleToggleEstado(e)} className="p-2 text-text-muted hover:text-red-500 rounded-lg transition-all cursor-pointer" title="Dar de baja"><UserMinus size={16} /></button>
                                            ) : (
                                                <button onClick={() => handleToggleEstado(e)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all cursor-pointer" title="Reactivar"><UserCheck size={16} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL / REGISTRO FLOTANTE VARIABLE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                    <div className="bg-bg-card border border-border-app w-full max-w-2xl rounded-custom p-10 shadow-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-text-muted hover:text-text-primary transition-colors cursor-pointer"><X size={24} /></button>
                        <h2 className="text-2xl font-bold text-text-primary mb-8 tracking-tight flex items-center gap-3">
                            {editId ? 'Editar Perfil del Colaborador' : 'Registrar Nuevo Empleado'}
                        </h2>

                        <form onSubmit={handleGuardar} className="grid grid-cols-2 gap-6">
                            {/* NOMBRE */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Nombre</label>
                                <input type="text" className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent transition-all placeholder:text-text-muted" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                            </div>
                            {/* APELLIDO */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Apellido</label>
                                <input type="text" className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent transition-all placeholder:text-text-muted" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} required />
                            </div>
                            {/* CARGO */}
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Cargo / Puesto Administrativo</label>
                                <input type="text" className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent transition-all placeholder:text-text-muted" placeholder="Ej. Jefe de Soporte Técnico" value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} required />
                            </div>

                            {/* SELECT SUCURSAL */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Sede / Sucursal</label>
                                <select className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent cursor-pointer" value={formData.sucursal_id} onChange={(e) => setFormData({...formData, sucursal_id: e.target.value, grupo_id: '', area_id: ''})} required>
                                    <option value="" className="bg-bg-card text-text-primary">Seleccionar sede...</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id} className="bg-bg-card text-text-primary font-bold">{s.nombre}</option>)}
                                </select>
                            </div>

                            {/* SELECT GRUPO */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Grupo Organizacional</label>
                                <select className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent disabled:opacity-40 cursor-pointer" value={formData.grupo_id} onChange={(e) => setFormData({...formData, grupo_id: e.target.value, area_id: ''})} disabled={!formData.sucursal_id} required>
                                    <option value="" className="bg-bg-card text-text-primary">Seleccionar grupo...</option>
                                    {gruposFiltrados.map(g => <option key={g.id} value={g.id} className="bg-bg-card text-text-primary font-bold">{g.nombre}</option>)}
                                </select>
                            </div>

                            {/* SELECT AREA */}
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">Área Funcional</label>
                                <select className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary outline-none focus:border-accent disabled:opacity-40 cursor-pointer" value={formData.area_id} onChange={(e) => setFormData({...formData, area_id: e.target.value})} disabled={!formData.grupo_id} required>
                                    <option value="" className="bg-bg-card text-text-primary">Seleccionar área...</option>
                                    {areasFiltradas.map(a => <option key={a.id} value={a.id} className="bg-bg-card text-text-primary font-bold">{a.nombre}</option>)}
                                </select>
                            </div>

                            {/* BOTONES DE SALVADO */}
                            <div className="col-span-2 flex gap-4 pt-4">
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