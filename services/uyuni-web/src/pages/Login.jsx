import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login y Registro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '' // Solo para registro
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

// ... resto de imports

const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // --- LÓGICA DE REGISTRO ACTUALIZADA ---
        
        // 1. Enviamos el username dentro de 'options' > 'data'
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username, // <--- Pasamos el dato aquí
              // El avatar se generará automático en la base de datos
            }
          }
        });

        if (authError) throw authError;

        // 2. ¡YA NO HACEMOS EL INSERT MANUAL AQUÍ!
        // La base de datos lo hará por nosotros automáticamente.
        
        alert("¡Registro exitoso! Revisa tu correo para confirmar la cuenta.");
        setIsSignUp(false); 

      } else {
        // --- LÓGICA DE LOGIN (Sin cambios) ---
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });
        if (loginError) throw loginError;
        navigate('/foro');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 ">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            {isSignUp ? 'Únete a la aventura' : 'Bienvenido de nuevo'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isSignUp ? 'Crea tu cuenta para compartir en el foro' : 'Inicia sesión para continuar'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            
            {/* Campo Usuario (Solo Registro) */}
            {isSignUp && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="Nombre de usuario"
                  className="pl-10 block w-full border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                name="email"
                type="email"
                required
                placeholder="Correo electrónico"
                className="pl-10 block w-full border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                name="password"
                type="password"
                required
                placeholder="Contraseña"
                className="pl-10 block w-full border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            {isSignUp 
              ? '¿Ya tienes cuenta? Inicia sesión' 
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}