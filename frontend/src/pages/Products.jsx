import { useEffect, useRef, useState } from 'react';
import anime from '../lib/anime';
import api from '../api/axios';

const EMPTY_FORM = {
  name: '', description: '', category_id: '',
};
const EMPTY_CATEGORY_FORM = { name: '', description: '' };

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('true');
  const listRef = useRef(null);
  const titleRef = useRef(null);

  const fetchData = async (activeValue = 'true') => {
    setIsLoading(true);
    try {
      const productParams = activeValue === 'all' ? {} : { active: activeValue };
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params: productParams }),
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

  useEffect(() => {
    anime({ targets: titleRef.current, opacity: [0,1], translateY: [-20,0], duration: 500, easing: 'easeOutExpo' });
    fetchData(activeFilter);
  }, [activeFilter]);

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

  const filteredProducts = products.filter((product) => {
    const text = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(text) ||
      (product.description || '').toLowerCase().includes(text) ||
      (product.categories?.name || '').toLowerCase().includes(text)
    );
  });

  const openModal = (product = null) => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || '',
        category_id: product.category_id,
      });
      setEditId(product.id);
    } else {
      setForm(EMPTY_FORM);
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); setForm(EMPTY_FORM); };
  const closeCategoryModal = () => { setIsCategoryModalOpen(false); setCategoryForm(EMPTY_CATEGORY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category_id: form.category_id,
      };

      if (editId) {
        await api.put(`/products/${editId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      closeModal();
      fetchData(activeFilter);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar producto.');
    }
  };

  const toggleProductStatus = async (product) => {
    if (product.active) {
      if (!confirm('¿Desactivar este producto?')) return;
      await api.delete(`/products/${product.id}`);
    } else {
      if (!confirm('¿Activar este producto?')) return;
      await api.put(`/products/${product.id}`, { active: true });
    }
    fetchData(activeFilter);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/categories', categoryForm);
      setCategories((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((prev) => ({ ...prev, category_id: res.data.id }));
      closeCategoryModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear categoría.');
    }
  };

  return (
    <div className="font-['Syne',sans-serif]">
      <div ref={titleRef} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Productos</h1>
          <p className="text-white/30 text-sm mt-1">Gestión de inventario</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="border border-white/10 text-white/70 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-all"
          >
            + Nueva categoría
          </button>
          <button
            onClick={() => openModal()}
            className="bg-[#00e5a0] text-[#0f1117] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00e5a0]/90 active:scale-95 transition-all"
          >
            + Nuevo producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:max-w-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
        />
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="w-full md:w-52 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
        >
          <option value="true" className="text-[#0f1117] bg-white">Solo activos</option>
          <option value="false" className="text-[#0f1117] bg-white">Solo inactivos</option>
          <option value="all" className="text-[#0f1117] bg-white">Todos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-4">ID</th>
              <th className="text-left px-6 py-4">Nombre</th>
              <th className="text-left px-6 py-4">Categoría</th>
              <th className="text-right px-6 py-4">Precio compra</th>
              <th className="text-right px-6 py-4">Precio venta</th>
              <th className="text-right px-6 py-4">Stock</th>
              <th className="text-right px-6 py-4">Stock mínimo</th>
              <th className="text-left px-6 py-4">Unidad</th>
              <th className="text-left px-6 py-4">Vence</th>
              <th className="text-center px-6 py-4">Estado</th>
              <th className="text-right px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody ref={listRef}>
            {filteredProducts.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-6 py-4 text-sm text-white/40">#{p.id}</td>
                <td className="px-6 py-4 text-sm text-white/80">{p.name}</td>
                <td className="px-6 py-4 text-sm text-white/40">{p.categories?.name}</td>
                <td className="px-6 py-4 text-sm text-right text-white/50">
                  S/ {Number(p.purchase_price).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-right text-[#00e5a0]">
                  S/ {Number(p.sale_price).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <span className={p.current_stock <= p.min_stock ? 'text-red-400 font-bold' : 'text-white/60'}>
                    {p.current_stock}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right text-white/40">{p.min_stock}</td>
                <td className="px-6 py-4 text-sm text-white/40">{p.unit_of_measure}</td>
                <td className="px-6 py-4 text-sm text-white/40">
                  {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('es-PE') : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    p.active ? 'bg-[#00e5a0]/10 text-[#00e5a0]' : 'bg-red-400/10 text-red-400'
                  }`}>
                    {p.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openModal(p)} className="text-xs text-white/40 hover:text-white mr-3 transition-colors">Editar</button>
                  <button
                    onClick={() => toggleProductStatus(p)}
                    className={`text-xs transition-colors ${p.active ? 'text-red-400/60 hover:text-red-400' : 'text-[#00e5a0]/60 hover:text-[#00e5a0]'}`}
                  >
                    {p.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr><td colSpan={11} className="text-center text-white/20 text-sm py-10">Sin productos</td></tr>
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
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="self-start text-xs text-[#00e5a0]/80 hover:text-[#00e5a0] transition-colors"
              >
                + Agregar categoría
              </button>

              <div className="text-xs text-white/40 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                Aquí solo registras el catálogo base. Precio, stock, stock mínimo y vencimiento se cargan por lote en Inventario.
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

      {/* Modal categoría */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13151f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-5">Nueva categoría</h2>
            <form onSubmit={handleCreateCategory} className="flex flex-col gap-3">
              <input
                required
                placeholder="Nombre de categoría"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50"
              />
              <input
                placeholder="Descripción (opcional)"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50"
              />
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="flex-1 border border-white/10 text-white/50 rounded-lg py-2.5 text-sm hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#00e5a0] text-[#0f1117] font-bold rounded-lg py-2.5 text-sm hover:bg-[#00e5a0]/90 active:scale-95 transition-all"
                >
                  Crear categoría
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
