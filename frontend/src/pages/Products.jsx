import { useEffect, useRef, useState } from 'react';
import anime from '../lib/anime';
import api from '../api/axios';

const EMPTY_FORM = {
  name: '', description: '', category_id: '', purchase_price: '',
  sale_price: '', current_stock: '', min_stock: '10', unit_of_measure: 'caja',
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    anime({ targets: titleRef.current, opacity: [0,1], translateY: [-20,0], duration: 500, easing: 'easeOutExpo' });
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading && listRef.current) {
      anime({
        targets: listRef.current.querySelectorAll('tr'),
        opacity: [0, 1],
        translateY: [10, 0],
        delay: anime.stagger(40),
        duration: 300,
        easing: 'easeOutExpo',
      });
    }
  }, [isLoading, products]);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (product = null) => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || '',
        category_id: product.category_id,
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        current_stock: product.current_stock,
        min_stock: product.min_stock,
        unit_of_measure: product.unit_of_measure,
      });
      setEditId(product.id);
    } else {
      setForm(EMPTY_FORM);
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/products/${editId}`, form);
      } else {
        await api.post('/products', form);
      }
      closeModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar producto.');
    }
  };

  const deactivateProduct = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return;
    await api.delete(`/products/${id}`);
    fetchData();
  };

  return (
    <div className="font-['Syne',sans-serif]">
      <div ref={titleRef} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Productos</h1>
          <p className="text-white/30 text-sm mt-1">Gestión de inventario</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#00e5a0] text-[#0f1117] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00e5a0]/90 active:scale-95 transition-all"
        >
          + Nuevo producto
        </button>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar producto..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e5a0]/50 mb-6 transition-colors"
      />

      {/* Tabla */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-4">Nombre</th>
              <th className="text-left px-6 py-4">Categoría</th>
              <th className="text-right px-6 py-4">Precio venta</th>
              <th className="text-right px-6 py-4">Stock</th>
              <th className="text-right px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody ref={listRef}>
            {filteredProducts.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-6 py-4 text-sm text-white/80">{p.name}</td>
                <td className="px-6 py-4 text-sm text-white/40">{p.categories?.name}</td>
                <td className="px-6 py-4 text-sm text-right text-[#00e5a0]">
                  S/ {Number(p.sale_price).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <span className={p.current_stock <= p.min_stock ? 'text-red-400 font-bold' : 'text-white/60'}>
                    {p.current_stock}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openModal(p)} className="text-xs text-white/40 hover:text-white mr-3 transition-colors">Editar</button>
                  <button onClick={() => deactivateProduct(p.id)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Desactivar</button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr><td colSpan={5} className="text-center text-white/20 text-sm py-10">Sin productos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13151f] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold text-white mb-5">
              {editId ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input required placeholder="Nombre" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
              <select required value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e5a0]/50">
                <option value="" className="text-[#0f1117] bg-white">Selecciona categoría</option>
                {categories.map(c => <option key={c.id} value={c.id} className="text-[#0f1117] bg-white">{c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" step="0.01" placeholder="Precio compra" value={form.purchase_price}
                  onChange={e => setForm({...form, purchase_price: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
                <input required type="number" step="0.01" placeholder="Precio venta" value={form.sale_price}
                  onChange={e => setForm({...form, sale_price: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
                <input required type="number" placeholder="Stock actual" value={form.current_stock}
                  onChange={e => setForm({...form, current_stock: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
                <input required type="number" placeholder="Stock mínimo" value={form.min_stock}
                  onChange={e => setForm({...form, min_stock: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
              </div>
              <input placeholder="Descripción (opcional)" value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-white/10 text-white/50 rounded-lg py-2.5 text-sm hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#00e5a0] text-[#0f1117] font-bold rounded-lg py-2.5 text-sm hover:bg-[#00e5a0]/90 active:scale-95 transition-all">
                  {editId ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
