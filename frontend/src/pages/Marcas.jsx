import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2, Loader2, Tag, X } from 'lucide-react';

const Marcas = () => {
    const [marcas, setMarcas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editId, setEditId] = useState(null);
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

    const handleAdd = () => {
        setEditId(null);
        setNombreMarca('');
        setIsModalOpen(true);
    };

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
                await api.put(`/marcas/${editId}`, { nombre: nombreMarca });
            } else {
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
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Catálogo de Marcas</h1>
                        <p className="text-text-secondary mt-1">Gestiona los fabricantes registrados en el sistema.</p>
                    </div>
                    <button 
                        onClick={handleAdd}
                        className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-custom font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Plus size={20} /> Nueva Marca
                    </button>
                </div>

                {/* Buscador Variable */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text"
                        placeholder="Filtrar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-input border border-border-app rounded-xl py-3 pl-12 pr-4 text-text-primary focus:outline-none focus:border-accent transition-all placeholder:text-text-muted"
                    />
                </div>

                {/* Tabla Adaptativa */}
                <div className="bg-bg-card border border-border-app rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-app bg-bg-card-hover">
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Nombre</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-app">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-10 text-center">
                                        <Loader2 className="animate-spin mx-auto text-accent" size={32} />
                                    </td>
                                </tr>
                            ) : filteredMarcas.length > 0 ? (
                                filteredMarcas.map((marca) => (
                                    <tr key={marca.id} className="hover:bg-bg-card-hover transition-colors group">
                                        <td className="px-6 py-4 text-sm text-text-muted font-mono">#{marca.id}</td>
                                        <td className="px-6 py-4 text-text-primary font-medium tracking-wide">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                                    <Tag size={14} />
                                                </div>
                                                {marca.nombre}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEdit(marca)}
                                                    className="p-2 text-text-muted hover:text-accent rounded-lg transition-all cursor-pointer"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleEliminar(marca.id)}
                                                    className="p-2 text-text-muted hover:text-red-500 rounded-lg transition-all cursor-pointer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-text-muted italic">
                                        No se encontraron registros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL ADAPTATIVO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                    <div className="bg-bg-card border border-border-app w-full max-w-md rounded-custom p-8 shadow-2xl relative">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                                {editId ? 'Editar Marca' : 'Nueva Marca'}
                            </h2>
                            <p className="text-text-secondary text-sm mt-1">
                                {editId ? 'Modifica el nombre del fabricante seleccionado.' : 'Registra un nuevo fabricante en el sistema.'}
                            </p>
                        </div>

                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-label uppercase tracking-[0.2em] ml-1">Nombre Comercial</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    className="w-full bg-bg-input border border-border-app rounded-2xl py-4 px-5 text-text-primary focus:outline-none focus:border-accent transition-all placeholder:text-text-muted"
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
                                    className="flex-1 bg-bg-card-hover border border-border-app text-text-primary font-bold py-4 rounded-2xl transition-all cursor-pointer hover:brightness-95"
                                >
                                    Cerrar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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