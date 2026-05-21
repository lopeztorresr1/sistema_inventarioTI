import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2, Loader2, Tag, X, AlertTriangle } from 'lucide-react';

const Marcas = () => {
    const [marcas, setMarcas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para el Modal (Sirve para Crear y Editar)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editId, setEditId] = useState(null); // Si es null, estamos creando. Si tiene ID, estamos editando.
    const [nombreMarca, setNombreMarca] = useState('');

    const fetchMarcas = async () => {
        try {
            const response = await api.get('/marcas');
            setMarcas(response.data);
        } catch (error) {
            console.error("Error al obtener marcas", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarcas();
    }, []);

    // Abrir modal para Crear
    const handleAdd = () => {
        setEditId(null);
        setNombreMarca('');
        setIsModalOpen(true);
    };

    // Abrir modal para Editar
    const handleEdit = (marca) => {
        setEditId(marca.id);
        setNombreMarca(marca.nombre);
        setIsModalOpen(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editId) {
                // Lógica de Actualización (PUT)
                await api.put(`/marcas/${editId}`, { nombre: nombreMarca });
            } else {
                // Lógica de Creación (POST)
                await api.post('/marcas', { nombre: nombreMarca });
            }
            setIsModalOpen(false);
            fetchMarcas();
        } catch (error) {
            alert("Error al procesar la solicitud");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar esta marca? Esto podría afectar a los modelos vinculados.")) {
            try {
                await api.delete(`/marcas/${id}`);
                fetchMarcas();
            } catch (error) {
                alert("Error al eliminar la marca. Verifica que no tenga modelos asociados.");
            }
        }
    };

    const filteredMarcas = marcas.filter(m => 
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Sidebar>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Catálogo de Marcas</h1>
                        <p className="text-slate-400 mt-1">Gestiona los fabricantes registrados en el sistema.</p>
                    </div>
                    <button 
                        onClick={handleAdd}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Plus size={20} />
                        Nueva Marca
                    </button>
                </div>

                {/* Buscador */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text"
                        placeholder="Filtrar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                    />
                </div>

                {/* Tabla */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nombre</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-10 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
                                    </td>
                                </tr>
                            ) : filteredMarcas.length > 0 ? (
                                filteredMarcas.map((marca) => (
                                    <tr key={marca.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">#{marca.id}</td>
                                        <td className="px-6 py-4 text-slate-200 font-medium tracking-wide">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                    <Tag size={14} />
                                                </div>
                                                {marca.nombre}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEdit(marca)}
                                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleEliminar(marca.id)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-slate-500 italic">
                                        No se encontraron registros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL (Crear / Editar) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0B0F1A] border border-white/10 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {editId ? 'Editar Marca' : 'Nueva Marca'}
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                {editId ? 'Modifica el nombre del fabricante seleccionado.' : 'Registra un nuevo fabricante en el sistema.'}
                            </p>
                        </div>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Nombre Comercial</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                                    placeholder="Ej. Dell, Cisco, Apple..."
                                    value={nombreMarca}
                                    onChange={(e) => setNombreMarca(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold py-4 rounded-2xl transition-all"
                                >
                                    Cerrar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : (editId ? 'Actualizar' : 'Guardar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Sidebar>
    );
};

export default Marcas;