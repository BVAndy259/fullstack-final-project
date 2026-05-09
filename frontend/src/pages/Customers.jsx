import { useEffect, useRef, useState } from 'react';
import anime from '../lib/anime';
import api from '../api/axios';

const EMPTY_FORM = { name: '', dni: '', phone: '', email: '' };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const titleRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    anime({ targets: titleRef.current, opacity: [0,1], translateY: [-20,0], duration: 500, easing: 'easeOutExpo' });
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const res = await api.get('/customers');
    setCustomers(res.data);
    setTimeout(() => {
      if (listRef.current) {
        anime({
          targets: listRef.current.querySelectorAll('tr'),
          opacity: [0, 1], translateY: [10, 0],
          delay: anime.stagger(40), duration: 300, easing: 'easeOutExpo',
        });
      }
    }, 50);
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.dni && customer.dni.includes(searchTerm))
  );

  const openModal = (customer = null) => {
    if (customer) {
      setForm({ name: customer.name, dni: customer.dni || '', phone: customer.phone || '', email: customer.email || '' });
      setEditId(customer.id);
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
        await api.put(`/customers/${editId}`, form);
      } else {
        await api.post('/customers', form);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar cliente.');
    }
  };

  return (
    <div className="font-['Syne',sans-serif]">
      <div ref={titleRef} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Clientes</h1>
          <p className="text-white/30 text-sm mt-1">Registro de clientes</p>
        </div>
        <button onClick={() => openModal()}
          className="bg-[#00e5a0] text-[#0f1117] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00e5a0]/90 active:scale-95 transition-all">
          + Nuevo cliente
        </button>
      </div>

      <input type="text" placeholder="Buscar por nombre o DNI..." value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e5a0]/50 mb-6 transition-colors" />

      <div className="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-4">Nombre</th>
              <th className="text-left px-6 py-4">DNI</th>
              <th className="text-left px-6 py-4">Teléfono</th>
              <th className="text-left px-6 py-4">Email</th>
              <th className="text-right px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody ref={listRef}>
            {filteredCustomers.map(c => (
              <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-6 py-4 text-sm text-white/80">{c.name}</td>
                <td className="px-6 py-4 text-sm text-white/40">{c.dni || '—'}</td>
                <td className="px-6 py-4 text-sm text-white/40">{c.phone || '—'}</td>
                <td className="px-6 py-4 text-sm text-white/40">{c.email || '—'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openModal(c)} className="text-xs text-white/40 hover:text-white transition-colors">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr><td colSpan={5} className="text-center text-white/20 text-sm py-10">Sin clientes</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13151f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-5">{editId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {[['Nombre *', 'name', 'text', true], ['DNI', 'dni', 'text', false], ['Teléfono', 'phone', 'text', false], ['Email', 'email', 'email', false]].map(([label, key, type, req]) => (
                <div key={key}>
                  <label className="text-xs text-white/30 uppercase tracking-widest block mb-1">{label}</label>
                  <input type={type} required={req} value={form[key]}
                    onChange={e => setForm({...form, [key]: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e5a0]/50" />
                </div>
              ))}
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

export default Customers;
