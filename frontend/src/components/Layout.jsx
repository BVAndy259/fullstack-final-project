import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import anime from '../lib/anime';
import useAuth from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',    icon: '▦',  adminOnly: true  },
  { to: '/ventas/nueva',  label: 'Nueva Venta',  icon: '＋',  adminOnly: false },
  { to: '/ventas',        label: 'Ventas',       icon: '◈',  adminOnly: false },
  { to: '/productos',     label: 'Productos',    icon: '◉',  adminOnly: true  },
  { to: '/clientes',      label: 'Clientes',     icon: '◎',  adminOnly: false },
  { to: '/inventario',    label: 'Inventario',   icon: '◫',  adminOnly: true  },
  { to: '/usuarios',      label: 'Usuarios',     icon: '◬',  adminOnly: true  },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    anime({
      targets: sidebarRef.current,
      translateX: [-280, 0],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutExpo',
    });
    anime({
      targets: contentRef.current,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 500,
      delay: 200,
      easing: 'easeOutExpo',
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || (user?.role ?? user?.rol) === 'admin'
  );

  return (
    <div className="flex h-screen bg-[#0f1117] text-white font-['Syne',sans-serif] overflow-hidden">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className="w-64 flex flex-col bg-[#13151f] border-r border-white/5 px-4 py-6 shrink-0"
      >
        {/* Logo */}
        <div className="mb-10 px-2">
          <div className="text-2xl font-black tracking-tight text-white">
            Nova<span className="text-[#00e5a0]">Salud</span>
          </div>
          <div className="text-xs text-white/30 mt-1 tracking-widest uppercase">
            Sistema de Gestión
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-[#00e5a0]/10 text-[#00e5a0] font-semibold'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-white/5 pt-4 mt-4">
          <div className="px-2 mb-3">
            <div className="text-sm font-semibold text-white/80">{user?.name ?? user?.nombre}</div>
            <div className="text-xs text-white/30 capitalize">{user?.role ?? user?.rol}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs text-white/30 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all duration-200"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main ref={contentRef} className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
