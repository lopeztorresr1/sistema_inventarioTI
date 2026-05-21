import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Loader2, 
    ShieldCheck, 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

/**
 * Componente de Login Profesional
 * Maneja: Validaciones, Estados de Carga, Animaciones y Persistencia
 */
const Login = () => {
    const navigate = useNavigate();

    // --- Estados del Formulario ---
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // --- Estados de UI / Feedback ---
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');

    // --- Efecto de limpieza de errores ---
    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => setErrorMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    // --- Manejadores ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.email.includes('@')) {
            setErrorMessage('Por favor, ingresa un correo electrónico válido.');
            return false;
        }
        if (formData.password.length < 3) {
            setErrorMessage('La contraseña es demasiado corta.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password
            });

            // Guardar sesión
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            setStatus('success');

            // Redirección elegante tras éxito
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (err) {
            setStatus('error');
            const msg = err.response?.data?.error || 'Error de conexión con el servidor';
            setErrorMessage(msg);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] relative overflow-hidden font-sans selection:bg-blue-500/30">
            
            {/* BACKGROUND ELEMENTS - Luces volumétricas sutiles */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[440px] px-6"
            >
                {/* CABECERA - LOGO Y TÍTULO */}
                <div className="text-center mb-10">
                    <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/20 mb-6"
                    >
                        <ShieldCheck className="text-white" size={32} />
                    </motion.div>
                    
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                        Bienvenido de nuevo
                    </h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
                        Gestión de Activos TI
                    </p>
                </div>

                {/* CONTENEDOR DEL FORMULARIO */}
                <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    
                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center py-10 text-center"
                            >
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                                    <CheckCircle2 className="text-green-500" size={40} />
                                </div>
                                <h2 className="text-xl font-semibold text-white">¡Acceso Correcto!</h2>
                                <p className="text-slate-400 mt-2">Preparando tu panel de control...</p>
                            </motion.div>
                        ) : (
                            <motion.form 
                                key="form"
                                onSubmit={handleSubmit} 
                                className="space-y-6"
                            >
                                {/* Notificación de Error */}
                                <AnimatePresence>
                                    {errorMessage && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm"
                                        >
                                            <AlertCircle size={18} className="shrink-0" />
                                            {errorMessage}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Campo Email */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                                        Correo Corporativo
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input 
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="nombre@empresa.com"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Campo Password */}
                                <div className="space-y-2">
                                    <div className="flex justify-between px-1">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            Contraseña
                                        </label>
                                        <button type="button" className="text-xs text-blue-500 hover:text-blue-400 font-bold transition-colors">
                                            ¿Olvidaste la clave?
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input 
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            placeholder="••••••••"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all outline-none"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember Me */}
                                <div className="flex items-center gap-2 px-1">
                                    <input 
                                        type="checkbox" 
                                        id="remember"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/10 bg-black/20 text-blue-600 focus:ring-offset-0 focus:ring-0"
                                    />
                                    <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none">
                                        Recordar sesión en este equipo
                                    </label>
                                </div>

                                {/* Botón de Acción */}
                                <button 
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
                                >
                                    <span className={`flex items-center justify-center gap-2 transition-transform duration-300 ${status === 'loading' ? '-translate-y-10' : ''}`}>
                                        Ingresar al Sistema
                                    </span>
                                    
                                    {status === 'loading' && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="animate-spin" size={24} />
                                        </div>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer del Login */}
                <footer className="mt-10 text-center">
                    <p className="text-slate-600 text-xs">
                        &copy; 2026 ITL - Departamento de Infraestructura <br />
                        Versión de Producción 1.0.4
                    </p>
                </footer>
            </motion.div>
        </div>
    );
};

export default Login;