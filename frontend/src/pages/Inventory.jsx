import { useEffect, useRef, useState } from 'react';
import anime from '../lib/anime';
import api from '../api/axios';
import LowStockAlert from '../components/LowStockAlert';

const Inventory = () => {
  const [movements, setMovements] = useState([]);
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState('movimientos'); // 'movimientos' | 'lotes' | 'entrada' | 'ajuste' | 'alertas'
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({
    product_id: '',
    quantity: '',
    min_stock: '',
    new_stock: '',
    reason: '',
    purchase_price: '',
    sale_price: '',
    expiry_date: '',
    lot_code: '',
  });
  const titleRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    anime({ targets: titleRef.current, opacity: [0,1], translateY: [-20,0], duration: 500, easing: 'easeOutExpo' });
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [movRes, batchRes, prodRes, alertRes] = await Promise.all([
      api.get('/inventory/movements'),
      api.get('/inventory/batches'),
      api.get('/products'),
      api.get('/products/low-stock'),
    ]);
    setMovements(movRes.data);
    setBatches(batchRes.data);
    setProducts(prodRes.data);
    setAlerts(alertRes.data);
  };

  const handleStockEntry = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/entry', {
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        min_stock: Number(form.min_stock),
        purchase_price: Number(form.purchase_price),
        sale_price: Number(form.sale_price),
        expiry_date: form.expiry_date,
        lot_code: form.lot_code,
        reason: form.reason,
      });
      setForm({
        product_id: '',
        quantity: '',
        min_stock: '',
        new_stock: '',
        reason: '',
        purchase_price: '',
        sale_price: '',
        expiry_date: '',
        lot_code: '',
      });
      fetchAll();
      setTab('movimientos');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al registrar entrada.');
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjustment', {
        product_id: Number(form.product_id),
        new_stock: Number(form.new_stock),
        reason: form.reason,
      });
      setForm({
        product_id: '',
        quantity: '',
        min_stock: '',
        new_stock: '',
        reason: '',
        purchase_price: '',
        sale_price: '',
        expiry_date: '',
        lot_code: '',
      });
      fetchAll();
      setTab('movimientos');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al registrar ajuste.');
    }
  };

  const movementTypeClass = { entrada: 'text-[#00e5a0]', salida: 'text-red-400', ajuste: 'text-yellow-400' };

  const tabs = [
    { key: 'movimientos', label: 'Movimientos' },
    { key: 'lotes',       label: 'Lotes' },
    { key: 'alertas',     label: `Alertas ${alerts.length > 0 ? `(${alerts.length})` : ''}` },
    { key: 'entrada',     label: 'Registrar entrada' },
    { key: 'ajuste',      label: 'Ajuste de stock' },
  ];

  return (
    <div className="font-['Syne',sans-serif]">
      <div ref={titleRef} className="mb-6">
        <h1 className="text-3xl font-black text-white">Inventario</h1>
        <p className="text-white/30 text-sm mt-1">Movimientos y control de stock</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === t.key ? 'bg-[#00e5a0] text-[#0f1117]' : 'text-white/40 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Movimientos */}
      {tab === 'movimientos' && (
        <div className="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
                <th className="text-left px-6 py-4">Fecha</th>
                <th className="text-left px-6 py-4">Producto</th>
                <th className="text-left px-6 py-4">Tipo</th>
                <th className="text-right px-6 py-4">Cantidad</th>
                <th className="text-right px-6 py-4">Stock antes</th>
                <th className="text-right px-6 py-4">Stock después</th>
                <th className="text-left px-6 py-4">Usuario</th>
              </tr>
            </thead>
            <tbody ref={listRef}>
              {movements.map(m => (
                <tr key={m.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-6 py-3 text-xs text-white/30">
                    {new Date(m.movement_date).toLocaleString('es-PE')}
                  </td>
                  <td className="px-6 py-3 text-sm text-white/70">{m.products?.name}</td>
                  <td className={`px-6 py-3 text-xs font-bold capitalize ${movementTypeClass[m.type] || 'text-white'}`}>{m.type}</td>
                  <td className="px-6 py-3 text-sm text-right text-white/60">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                  <td className="px-6 py-3 text-sm text-right text-white/30">{m.stock_before}</td>
                  <td className="px-6 py-3 text-sm text-right text-white/60">{m.stock_after}</td>
                  <td className="px-6 py-3 text-xs text-white/30">{m.users?.name}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={7} className="text-center text-white/20 text-sm py-10">Sin movimientos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Lotes */}
      {tab === 'lotes' && (
        <div className="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
                <th className="text-left px-6 py-4">Producto</th>
                <th className="text-left px-6 py-4">Categoría</th>
                <th className="text-left px-6 py-4">Lote</th>
                <th className="text-right px-6 py-4">Precio compra</th>
                <th className="text-right px-6 py-4">Precio venta</th>
                <th className="text-right px-6 py-4">Stock lote</th>
                <th className="text-right px-6 py-4">Stock mínimo</th>
                <th className="text-left px-6 py-4">Vence</th>
                <th className="text-center px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-b border-white/5 last:border-0">
                  <td className="px-6 py-4 text-sm text-white/80">{b.products?.name}</td>
                  <td className="px-6 py-4 text-sm text-white/40">{b.products?.categories?.name}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{b.lot_code}</td>
                  <td className="px-6 py-4 text-sm text-right text-white/50">S/ {Number(b.purchase_price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-right text-[#00e5a0]">S/ {Number(b.sale_price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-right text-white/60">{b.quantity_available}</td>
                  <td className="px-6 py-4 text-sm text-right text-white/40">{b.products?.min_stock}</td>
                  <td className="px-6 py-4 text-sm text-white/40">{new Date(b.expiry_date).toLocaleDateString('es-PE')}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      b.active && Number(b.quantity_available) > 0
                        ? 'bg-[#00e5a0]/10 text-[#00e5a0]'
                        : 'bg-red-400/10 text-red-400'
                    }`}>
                      {b.active && Number(b.quantity_available) > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr><td colSpan={9} className="text-center text-white/20 text-sm py-10">Sin lotes registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Alertas */}
      {tab === 'alertas' && (
        <LowStockAlert alerts={alerts} showTitle={false} />
      )}

      {/* Entrada de stock */}
      {tab === 'entrada' && (
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6 max-w-md">
          <h2 className="text-base font-bold text-white mb-4">Registrar entrada de stock</h2>
          <form onSubmit={handleStockEntry} className="flex flex-col gap-3">
            <select required value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e5a0]/50">
              <option value="" className="text-[#0f1117] bg-white">Selecciona producto</option>
              {products.map(p => <option key={p.id} value={p.id} className="text-[#0f1117] bg-white">{p.name} (stock: {p.current_stock})</option>)}
            </select>
            <input required type="number" min="1" placeholder="Cantidad a ingresar" value={form.quantity}
              onChange={e => setForm({...form, quantity: e.target.value})}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
            <input required type="number" min="1" placeholder="Stock mínimo del producto" value={form.min_stock}
              onChange={e => setForm({...form, min_stock: e.target.value})}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
            <div className="grid grid-cols-2 gap-3">
              <input required type="number" min="0" step="0.01" placeholder="Precio compra lote" value={form.purchase_price}
                onChange={e => setForm({...form, purchase_price: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
              <input required type="number" min="0" step="0.01" placeholder="Precio venta lote" value={form.sale_price}
                onChange={e => setForm({...form, sale_price: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input required type="date" value={form.expiry_date}
                onChange={e => setForm({...form, expiry_date: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e5a0]/50" />
              <input required placeholder="Código de lote" value={form.lot_code}
                onChange={e => setForm({...form, lot_code: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
            </div>
            <input placeholder="Motivo (opcional)" value={form.reason}
              onChange={e => setForm({...form, reason: e.target.value})}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
            <button type="submit"
              className="bg-[#00e5a0] text-[#0f1117] font-bold py-2.5 rounded-lg text-sm hover:bg-[#00e5a0]/90 active:scale-95 transition-all mt-2">
              Registrar entrada
            </button>
          </form>
        </div>
      )}

      {/* Ajuste de stock */}
      {tab === 'ajuste' && (
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6 max-w-md">
          <h2 className="text-base font-bold text-white mb-4">Ajuste manual de stock</h2>
          <p className="text-xs text-white/30 mb-4">Usa esto después de un inventario físico para corregir el stock al valor real.</p>
          <form onSubmit={handleStockAdjustment} className="flex flex-col gap-3">
            <select required value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e5a0]/50">
              <option value="" className="text-[#0f1117] bg-white">Selecciona producto</option>
              {products.map(p => <option key={p.id} value={p.id} className="text-[#0f1117] bg-white">{p.name} (stock actual: {p.current_stock})</option>)}
            </select>
            <input required type="number" min="0" placeholder="Nuevo stock real" value={form.new_stock}
              onChange={e => setForm({...form, new_stock: e.target.value})}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
            <input placeholder="Motivo del ajuste" value={form.reason}
              onChange={e => setForm({...form, reason: e.target.value})}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5a0]/50" />
            <button type="submit"
              className="bg-yellow-400 text-[#0f1117] font-bold py-2.5 rounded-lg text-sm hover:bg-yellow-400/90 active:scale-95 transition-all mt-2">
              Aplicar ajuste
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Inventory;
