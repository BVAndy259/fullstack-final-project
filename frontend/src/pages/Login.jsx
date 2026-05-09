import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from '../lib/anime';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (user) {
      const role = user.role ?? user.rol;
      navigate(role === 'admin' ? '/dashboard' : '/ventas/nueva');
    }
  }, [user, navigate]);

  useEffect(() => {
    anime({
      targets: titleRef.current,
      opacity: [0, 1],
      translateY: [-30, 0],
      duration: 800,
      easing: 'easeOutExpo',
    });
    anime({
      targets: cardRef.current,
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 700,
      delay: 200,
      easing: 'easeOutExpo',
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Shake animation for invalid credentials.
    const shake = () => {
      anime({
        targets: cardRef.current,
        translateX: [-10, 10, -8, 8, -4, 4, 0],
        duration: 400,
        easing: 'easeInOutSine',
      });
    };

    try {
      const res = await api.post('/auth/login', { email, password });
      const authUser = res.data.user ?? res.data.usuario;
      const role = authUser?.role ?? authUser?.rol;
      login(res.data.token, authUser);
      navigate(role === 'admin' ? '/dashboard' : '/ventas/nueva');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión.');
      shake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4 font-['Syne',sans-serif]">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#00e5a0]/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00e5a0]/3 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Título */}
        <div ref={titleRef} className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight">
            Nova<span className="text-[#00e5a0]">Salud</span>
          </h1>
          <p className="text-white/30 text-sm mt-2 tracking-wide">
            Sistema de Gestión de Inventario
          </p>
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          className="bg-[#13151f] border border-white/5 rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-lg font-bold text-white mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
                placeholder="admin@novasalud.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 uppercase tracking-widest">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 bg-[#00e5a0] text-[#0f1117] font-bold py-3 rounded-lg text-sm hover:bg-[#00e5a0]/90 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
