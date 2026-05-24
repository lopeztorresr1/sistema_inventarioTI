import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import {
    Plus, Search, Loader2, X, ShieldCheck, ShieldAlert,
    Eye, EyeOff, KeyRound, Power, Trash2, Clock,
    Wifi, WifiOff, UserCog, RefreshCw, Crown, BookOpen,
    History, AlertTriangle, Edit2
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ROL_CONFIG = {
    ADMIN:  { label: 'Administrador', icon: Crown,    cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    VIEWER: { label: 'Solo Lectura',  icon: BookOpen, cls: 'text-accent bg-accent/10 border-accent/20'  },
};

const RolBadge = ({ rol }) => {
    const cfg = ROL_CONFIG[rol] ?? ROL_CONFIG.VIEWER;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase ${cfg.cls}`}>
            <Icon size={11} /> {cfg.label}
        </span>
    );
};

const fmtDuration = (minutes) => {
    if (minutes < 1)  return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

const inputCls = 'w-full bg-bg-input border border-border-app rounded-2xl py-3 px-4 text-text-primary text-sm outline-none focus:border-accent transition-all placeholder:text-text-muted';

// ── Componente principal ──────────────────────────────────────────────────────

const Usuarios = () => {
    const [usuarios, setUsuarios]       = useState([]);
    const [online, setOnline]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [searchTerm, setSearchTerm]   = useState('');
    const [activeTab, setActiveTab]     = useState('todos');

    // Modales
    const [modalCrear, setModalCrear]       = useState(false);
    const [modalEditar, setModalEditar]     = useState(null);   // usuario obj
    const [modalReset, setModalReset]       = useState(null);   // usuario obj
    const [modalSesiones, setModalSesiones] = useState(null);   // usuario obj
    const [sesiones, setSesiones]           = useState([]);
    const [isSaving, setIsSaving]           = useState(false);

    // Formulario crear
    const [formCrear, setFormCrear] = useState({ nombre: '', email: '', password: '', confirmar: '', rol: 'VIEWER' });
    const [showPwd, setShowPwd]     = useState(false);
    const [errCrear, setErrCrear]   = useState('');

    // Formulario reset
    const [newPwd, setNewPwd]       = useState('');
    const [showNewPwd, setShowNewPwd] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [resU, resO] = await Promise.all([
                api.get('/usuarios'),
                api.get('/usuarios/online'),
            ]);
            setUsuarios(resU.data);
            setOnline(resO.data);
        } catch (err) {
            console.error('Error cargando usuarios:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Refresca online cada 30 s automáticamente
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get('/usuarios/online');
                setOnline(res.data);
            } catch {}
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    const fetchSesiones = async (id) => {
        try {
            const res = await api.get(`/usuarios/${id}/sesiones`);
            setSesiones(res.data);
        } catch { setSesiones([]); }
    };

    // ── Filtros ──────────────────────────────────────────────────────────────
    const onlineIDs = new Set(online.map(o => o.usuario_id || o.usuarioId || o.UsuarioID));

    const filtrados = usuarios.filter(u => {
        const q = searchTerm.toLowerCase();
        const matchSearch = u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        if (activeTab === 'online')    return matchSearch && onlineIDs.has(u.id);
        if (activeTab === 'inactivos') return matchSearch && !u.activo;
        return matchSearch;
    });

    // ── Acciones ─────────────────────────────────────────────────────────────
    const handleCrear = async (e) => {
        e.preventDefault();
        setErrCrear('');
        if (formCrear.password !== formCrear.confirmar) {
            setErrCrear('Las contraseñas no coinciden');
            return;
        }
        if (formCrear.password.length < 8) {
            setErrCrear('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        setIsSaving(true);
        try {
            await api.post('/usuarios', {
                nombre:   formCrear.nombre,
                email:    formCrear.email,
                password: formCrear.password,
                rol:      formCrear.rol,
            });
            setModalCrear(false);
            setFormCrear({ nombre: '', email: '', password: '', confirmar: '', rol: 'VIEWER' });
            fetchAll();
        } catch (err) {
            setErrCrear(err.response?.data?.error || 'Error al crear usuario');
        } finally { setIsSaving(false); }
    };

    const handleEditar = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put(`/usuarios/${modalEditar.id}`, {
                nombre: modalEditar.nombre,
                email:  modalEditar.email,
                rol:    modalEditar.rol,
            });
            setModalEditar(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al actualizar');
        } finally { setIsSaving(false); }
    };

    const handleToggle = async (usuario) => {
        const accion = usuario.activo ? 'desactivar' : 'activar';
        if (!window.confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${usuario.nombre}?`)) return;
        try {
            await api.patch(`/usuarios/${usuario.id}/toggle`);
            fetchAll();
        } catch (err) { alert(err.response?.data?.error || 'Error'); }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (newPwd.length < 8) { alert('Mínimo 8 caracteres'); return; }
        setIsSaving(true);
        try {
            await api.put(`/usuarios/${modalReset.id}/reset-password`, { new_password: newPwd });
            setModalReset(null);
            setNewPwd('');
            alert('Contraseña restablecida correctamente');
        } catch (err) {
            alert(err.response?.data?.error || 'Error al restablecer');
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (usuario) => {
        if (!window.confirm(`¿Eliminar permanentemente a ${usuario.nombre}? Esta acción no se puede deshacer.`)) return;
        try {
            await api.delete(`/usuarios/${usuario.id}`);
            fetchAll();
        } catch (err) { alert(err.response?.data?.error || 'Error al eliminar'); }
    };

    const openSesiones = (usuario) => {
        setModalSesiones(usuario);
        fetchSesiones(usuario.id);
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <Sidebar>
            <div className="space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Usuarios del Sistema</h1>
                        <p className="text-text-secondary mt-1">Gestión de accesos y permisos</p>
                    </div>
                    <button
                        onClick={() => { setModalCrear(true); setErrCrear(''); }}
                        className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-custom font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Plus size={20} /> Nuevo Usuario
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-bg-card border border-border-app p-5 rounded-3xl shadow-sm">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">{usuarios.length}</p>
                    </div>
                    <div className="bg-bg-card border border-border-app p-5 rounded-3xl shadow-sm">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1"><Wifi size={10}/> En línea</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">{online.length}</p>
                    </div>
                    <div className="bg-bg-card border border-border-app p-5 rounded-3xl shadow-sm">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1"><Crown size={10}/> Admins</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">{usuarios.filter(u => u.rol === 'ADMIN').length}</p>
                    </div>
                    <div className="bg-bg-card border border-border-app p-5 rounded-3xl shadow-sm">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1"><Power size={10}/> Inactivos</p>
                        <p className="text-2xl font-bold text-text-primary mt-1">{usuarios.filter(u => !u.activo).length}</p>
                    </div>
                </div>

                {/* TABS + BUSCADOR */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex gap-1 p-1 bg-bg-card-hover rounded-2xl border border-border-app">
                        {[
                            { key: 'todos',    label: 'Todos' },
                            { key: 'online',   label: '🟢 En línea' },
                            { key: 'inactivos',label: 'Inactivos' },
                        ].map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === t.key ? 'bg-accent text-white shadow' : 'text-text-muted hover:text-text-primary'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                            type="text" placeholder="Buscar por nombre o correo..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-bg-input border border-border-app rounded-xl py-2 pl-9 pr-4 text-text-primary text-sm focus:outline-none focus:border-accent transition-all placeholder:text-text-muted"
                        />
                    </div>
                    <button onClick={fetchAll} className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-card-hover rounded-xl transition-all cursor-pointer" title="Refrescar">
                        <RefreshCw size={18} />
                    </button>
                </div>

                {/* TABLA */}
                <div className="bg-bg-card border border-border-app rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border-app bg-bg-card-hover">
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Usuario</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Rol</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">Conexión</th>
                                <th className="px-6 py-4 text-right text-text-muted font-bold text-xs uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-app">
                            {loading ? (
                                <tr><td colSpan="5" className="py-16 text-center"><Loader2 className="animate-spin mx-auto text-accent" size={32} /></td></tr>
                            ) : filtrados.length === 0 ? (
                                <tr><td colSpan="5" className="py-12 text-center text-text-muted italic">Sin usuarios en esta categoría</td></tr>
                            ) : filtrados.map(u => {
                                // Soporte para mapeo de sesión activa tanto en snake_case como CamelCase
                                const sesionActiva = online.find(o => (o.usuario_id === u.id) || (o.usuarioId === u.id) || (o.UsuarioID === u.id));
                                const esMismo = u.id === currentUser.id;
                                return (
                                    <tr key={u.id} className={`hover:bg-bg-card-hover transition-colors ${!u.activo ? 'opacity-40' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${u.rol === 'ADMIN' ? 'bg-amber-500/10 text-amber-500' : 'bg-accent/10 text-accent'}`}>
                                                    {u.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-text-primary font-semibold flex items-center gap-2">
                                                        {u.nombre}
                                                        {esMismo && <span className="text-[9px] bg-bg-badge text-text-secondary px-2 py-0.5 rounded-full font-bold">TÚ</span>}
                                                    </p>
                                                    <p className="text-[11px] text-text-muted">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><RolBadge rol={u.rol} /></td>
                                        <td className="px-6 py-4 text-center">
                                            {u.activo
                                                ? <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">Activo</span>
                                                : <span className="text-[10px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full uppercase">Inactivo</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {sesionActiva ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500">
                                                        <Wifi size={12} /> En línea
                                                    </span>
                                                    <span className="text-[10px] text-text-muted font-mono">
                                                        {fmtDuration(sesionActiva.minutos_conectado || sesionActiva.MinutosConectado)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="flex items-center justify-center gap-1 text-[10px] text-text-muted">
                                                    <WifiOff size={12} /> Offline
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => openSesiones(u)} className="p-2 text-text-muted hover:text-blue-500 transition-all cursor-pointer rounded-lg hover:bg-blue-500/5" title="Historial de sesiones"><History size={17} /></button>
                                                <button onClick={() => setModalEditar({ ...u })} className="p-2 text-text-muted hover:text-accent transition-all cursor-pointer rounded-lg hover:bg-accent/5" title="Editar"><Edit2 size={17} /></button>
                                                <button onClick={() => { setModalReset(u); setNewPwd(''); }} className="p-2 text-text-muted hover:text-purple-500 transition-all cursor-pointer rounded-lg hover:bg-purple-500/5" title="Restablecer contraseña"><KeyRound size={17} /></button>
                                                {!esMismo && (
                                                    <>
                                                        <button onClick={() => handleToggle(u)} className={`p-2 transition-all cursor-pointer rounded-lg ${u.activo ? 'text-text-muted hover:text-red-500 hover:bg-red-500/5' : 'text-text-muted hover:text-emerald-500 hover:bg-emerald-500/5'}`} title={u.activo ? 'Desactivar' : 'Activar'}><Power size={17} /></button>
                                                        <button onClick={() => handleDelete(u)} className="p-2 text-text-muted hover:text-red-600 transition-all cursor-pointer rounded-lg hover:bg-red-600/5" title="Eliminar"><Trash2 size={17} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODAL: CREAR USUARIO ───────────────────────────────────── */}
            {modalCrear && (
                <Modal title="Nuevo Usuario" icon={<UserCog size={20}/>} onClose={() => setModalCrear(false)}>
                    <form onSubmit={handleCrear} className="space-y-4">
                        <Field label="Nombre completo">
                            <input className={inputCls} placeholder="Ej: María González" required
                                value={formCrear.nombre} onChange={e => setFormCrear({ ...formCrear, nombre: e.target.value })} />
                        </Field>
                        <Field label="Correo electrónico">
                            <input className={inputCls} type="email" placeholder="correo@empresa.com" required
                                value={formCrear.email} onChange={e => setFormCrear({ ...formCrear, email: e.target.value })} />
                        </Field>

                        <Field label="Rol de acceso">
                            <div className="grid grid-cols-2 gap-3">
                                {['ADMIN', 'VIEWER'].map(r => {
                                    const cfg = ROL_CONFIG[r];
                                    const Icon = cfg.icon;
                                    const sel = formCrear.rol === r;
                                    return (
                                        <button type="button" key={r} onClick={() => setFormCrear({ ...formCrear, rol: r })}
                                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${sel ? 'border-accent bg-accent/10' : 'border-border-app bg-bg-input hover:border-text-muted'}`}>
                                            <Icon size={20} className={sel ? 'text-accent mb-2' : 'text-text-muted mb-2'} />
                                            <p className={`text-xs font-black uppercase ${sel ? 'text-text-primary' : 'text-text-secondary'}`}>{cfg.label}</p>
                                            <p className="text-[10px] text-text-muted mt-1">
                                                {r === 'ADMIN' ? 'Acceso total al sistema' : 'Solo puede consultar datos'}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </Field>

                        <Field label="Contraseña">
                            <div className="relative">
                                <input className={inputCls} type={showPwd ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" required
                                    value={formCrear.password} onChange={e => setFormCrear({ ...formCrear, password: e.target.value })} />
                                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
                                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>
                            </div>
                        </Field>
                        <Field label="Confirmar contraseña">
                            <input className={inputCls} type={showPwd ? 'text' : 'password'} placeholder="Repite la contraseña" required
                                value={formCrear.confirmar} onChange={e => setFormCrear({ ...formCrear, confirmar: e.target.value })} />
                        </Field>

                        <PasswordStrength password={formCrear.password} />

                        {errCrear && (
                            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <AlertTriangle size={14} /> {errCrear}
                            </div>
                        )}

                        <button type="submit" disabled={isSaving}
                            className="w-full bg-accent hover:bg-accent-hover text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all active:scale-95 cursor-pointer">
                            {isSaving ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Crear Usuario'}
                        </button>
                    </form>
                </Modal>
            )}

            {/* ── MODAL: EDITAR USUARIO ──────────────────────────────────── */}
            {modalEditar && (
                <Modal title="Editar Usuario" icon={<Edit2 size={20}/>} onClose={() => setModalEditar(null)}>
                    <form onSubmit={handleEditar} className="space-y-4">
                        <Field label="Nombre">
                            <input className={inputCls} required value={modalEditar.nombre}
                                onChange={e => setModalEditar({ ...modalEditar, nombre: e.target.value })} />
                        </Field>
                        <Field label="Correo">
                            <input className={inputCls} type="email" required value={modalEditar.email}
                                onChange={e => setModalEditar({ ...modalEditar, email: e.target.value })} />
                        </Field>
                        <Field label="Rol">
                            <div className="grid grid-cols-2 gap-3">
                                {['ADMIN', 'VIEWER'].map(r => {
                                    const cfg = ROL_CONFIG[r];
                                    const Icon = cfg.icon;
                                    const sel = modalEditar.rol === r;
                                    return (
                                        <button type="button" key={r} onClick={() => setModalEditar({ ...modalEditar, rol: r })}
                                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${sel ? 'border-accent bg-accent/10' : 'border-border-app bg-bg-input'}`}>
                                            <Icon size={16} className={sel ? 'text-accent mb-1' : 'text-text-muted mb-1'} />
                                            <p className={`text-[11px] font-black uppercase ${sel ? 'text-text-primary' : 'text-text-secondary'}`}>{cfg.label}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </Field>
                        <button type="submit" disabled={isSaving}
                            className="w-full bg-accent hover:bg-accent-hover text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all active:scale-95 cursor-pointer">
                            {isSaving ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Guardar Cambios'}
                        </button>
                    </form>
                </Modal>
            )}

            {/* ── MODAL: RESTABLECER CONTRASEÑA ─────────────────────────── */}
            {modalReset && (
                <Modal title={`Restablecer: ${modalReset.nombre}`} icon={<KeyRound size={20}/>} onClose={() => setModalReset(null)}>
                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-600 flex gap-2">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                            <span>El usuario deberá usar esta contraseña en su próximo inicio de sesión. Se recomienda que la cambie inmediatamente.</span>
                        </div>
                        <Field label="Nueva contraseña">
                            <div className="relative">
                                <input className={inputCls} type={showNewPwd ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" required
                                    value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                                <button type="button" onClick={() => setShowNewPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
                                    {showNewPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>
                            </div>
                        </Field>
                        <PasswordStrength password={newPwd} />
                        <button type="submit" disabled={isSaving}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all active:scale-95 cursor-pointer">
                            {isSaving ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Restablecer Contraseña'}
                        </button>
                    </form>
                </Modal>
            )}

            {/* ── MODAL: HISTORIAL DE SESIONES ──────────────────────────── */}
            {modalSesiones && (
                <Modal title={`Sesiones: ${modalSesiones.nombre}`} icon={<History size={20}/>} onClose={() => setModalSesiones(null)} wide>
                    <div className="space-y-3">
                        {sesiones.length === 0 ? (
                            <p className="text-center text-text-muted italic py-8">Sin sesiones registradas</p>
                        ) : sesiones.map((s, i) => (
                            <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${s.activa ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-bg-input border-border-app'}`}>
                                <div className={`p-2 rounded-xl ${s.activa ? 'bg-emerald-500/10 text-emerald-500' : 'bg-bg-card-hover text-text-muted'}`}>
                                    {s.activa ? <Wifi size={16}/> : <WifiOff size={16}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${s.activa ? 'text-emerald-500 bg-emerald-500/10' : 'text-text-muted bg-bg-badge'}`}>
                                            {s.activa ? 'En línea' : 'Cerrada'}
                                        </span>
                                        <span className="text-[11px] font-mono text-text-secondary">{s.ip}</span>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-1">
                                        <span className="text-text-muted">Entrada:</span> {new Date(s.login_at).toLocaleString('es-MX')}
                                    </p>
                                    {s.logout_at && (
                                        <p className="text-xs text-text-muted">
                                            <span>Salida:</span> {new Date(s.logout_at).toLocaleString('es-MX')}
                                        </p>
                                    )}
                                </div>
                                {s.activa && (
                                    <div className="text-right">
                                        <p className="text-[10px] text-text-muted uppercase font-bold">Tiempo</p>
                                        <p className="text-sm font-mono text-emerald-500 font-bold">
                                            {fmtDuration(s.minutos_conectado || s.minutosConectado || s.MinutosConectado || Math.floor((Date.now() - new Date(s.login_at)) / 60000))}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Modal>
            )}
        </Sidebar>
    );
};

// ── Subcomponentes reutilizables ──────────────────────────────────────────────

const Modal = ({ title, icon, onClose, children, wide = false }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
        <div className={`bg-bg-card border border-border-app rounded-[2.5rem] p-8 shadow-2xl relative my-auto w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
            <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-text-primary transition-all cursor-pointer"><X size={22}/></button>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-xl">{icon}</div>
                <h2 className="text-lg font-bold text-text-primary uppercase tracking-tight">{title}</h2>
            </div>
            {children}
        </div>
    </div>
);

const Field = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-text-label uppercase tracking-widest ml-1">{label}</label>
        {children}
    </div>
);

const PasswordStrength = ({ password }) => {
    if (!password) return null;
    const checks = [
        { label: '8+ caracteres', ok: password.length >= 8 },
        { label: 'Mayúscula',     ok: /[A-Z]/.test(password) },
        { label: 'Número',        ok: /\d/.test(password) },
        { label: 'Símbolo',       ok: /[^A-Za-z0-9]/.test(password) },
    ];
    const score = checks.filter(c => c.ok).length;
    const colors = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                {[0,1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-bg-input border border-border-app'}`}/>
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
                {checks.map((c, i) => (
                    <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.ok ? 'text-emerald-500 bg-emerald-500/10' : 'text-text-muted bg-bg-badge'}`}>
                        {c.ok ? '✓' : '○'} {c.label}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default Usuarios;