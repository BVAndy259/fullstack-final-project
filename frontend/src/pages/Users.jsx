import { useEffect, useRef, useState } from 'react';
import anime from '../lib/anime';
import api from '../api/axios';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'vendedor' };

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const titleRef = useRef(null);
  const listRef = useRef(null);

  const fetchUsers = async () => {
    const res = await api.get('/users');
    setUsers(res.data);
    setTimeout(() => {
      if (listRef.current) {
        anime({
          targets: listRef.current.querySelectorAll('tr'),
          opacity: [0, 1], translateY: [10, 0],
          delay: anime.stagger(50), duration: 300, easing: 'easeOutExpo',
        });
      }
    }, 50);
  };

  useEffect(() => {
    anime({ targets: titleRef.current, opacity: [0,1], translateY: [-20,0], duration: 500, easing: 'easeOutExpo' });
    fetchUsers();
  }, []);

  const openModal = (user = null) => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: '', role: user.role });
      setEditId(user.id);
    } else {
      setForm(EMPTY_FORM);
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/users/${editId}`, { name: form.name, email: form.email, role: form.role });
      } else {
        await api.post('/users', form);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar usuario.');
    }
  };

  const toggleUserStatus = async (user) => {
    await api.put(`/users/${user.id}`, { active: !user.active });
    fetchUsers();
  };

  return (
    <div className="font-['Syne',sans-serif]">
      <div ref={titleRef} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Usuarios</h1>
          <p className="text-white/30 text-sm mt-1">Gestión de accesos</p>
        </div>
        <button onClick={() => openModal()}
          className="bg-[#00e5a0] text-[#0f1117] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00e5a0]/90 active:scale-95 transition-all">
          + Nuevo usuario
        </button>
      </div>

      <div className="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-4">Nombre</th>
              <th className="text-left px-6 py-4">Email</th>
              <th className="text-left px-6 py-4">Rol</th>
              <th className="text-center px-6 py-4">Estado</th>
              <th className="text-right px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody ref={listRef}>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-6 py-4 text-sm text-white/80">{u.name}</td>
                <td className="px-6 py-4 text-sm text-white/40">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    u.role === 'admin' ? 'bg-[#00e5a0]/10 text-[#00e5a0]' : 'bg-white/5 text-white/40'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    u.active ? 'bg-[#00e5a0]/10 text-[#00e5a0]' : 'bg-red-400/10 text-red-400'
                  }`}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openModal(u)} className="text-xs text-white/40 hover:text-white mr-3 transition-colors">Editar</button>
                  <button onClick={() => toggleUserStatus(u)} className={`text-xs transition-colors ${u.active ? 'text-red-400/60 hover:text-red-400' : 'text-[#00e5a0]/60 hover:text-[#00e5a0]'}`}>
                    {u.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13151f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-5">{editId ? 'Editar usuario' : 'Nuevo usuario'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input required placeholder="Nombre completo" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
              <input required type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
              {!editId && (
                <input required type="password" placeholder="Contraseña" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
              )}
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e5a0]/50">
                <option value="vendedor" className="text-[#0f1117] bg-white">Vendedor</option>
                <option value="admin" className="text-[#0f1117] bg-white">Administrador</option>
              </select>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-white/10 text-white/50 rounded-lg py-2.5 text-sm hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#00e5a0] text-[#0f1117] font-bold rounded-lg py-2.5 text-sm hover:bg-[#00e5a0]/90 active:scale-95 transition-all">
                  {editId ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
