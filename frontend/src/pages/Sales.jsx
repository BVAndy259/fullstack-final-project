import { useEffect, useRef, useState } from 'react';
import anime from '../lib/anime';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saleDetail, setSaleDetail] = useState(null);
  const { user } = useAuth();
  const titleRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    anime({ targets: titleRef.current, opacity: [0,1], translateY: [-20,0], duration: 500, easing: 'easeOutExpo' });
    fetchSales();
  }, []);

  useEffect(() => {
    if (!isLoading && listRef.current) {
      anime({
        targets: listRef.current.querySelectorAll('tr'),
        opacity: [0, 1],
        translateX: [-16, 0],
        delay: anime.stagger(50),
        duration: 350,
        easing: 'easeOutExpo',
      });
    }
  }, [isLoading]);

  const fetchSales = async () => {
    try {
      const res = await api.get('/sales');
      setSales(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  const viewDetail = async (id) => {
    const res = await api.get(`/sales/${id}`);
    setSaleDetail(res.data);
  };

  const voidSale = async (id) => {
    const reason = prompt('Motivo de anulación:');
    if (!reason) return;
    try {
      await api.put(`/sales/${id}/anular`, { motivo: reason });
      fetchSales();
      setSaleDetail(null);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al anular.');
    }
  };

  return (
    <div className="font-['Syne',sans-serif]">
      <div ref={titleRef} className="mb-8">
        <h1 className="text-3xl font-black text-white">Ventas</h1>
        <p className="text-white/30 text-sm mt-1">Historial de transacciones</p>
      </div>

      <div className="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-4">#</th>
              <th className="text-left px-6 py-4">Fecha</th>
              <th className="text-left px-6 py-4">Cliente</th>
              <th className="text-left px-6 py-4">Vendedor</th>
              <th className="text-right px-6 py-4">Total</th>
              <th className="text-center px-6 py-4">Estado</th>
              <th className="text-right px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody ref={listRef}>
            {sales.map((v) => (
              <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-6 py-4 text-sm text-white/30">#{v.id}</td>
                <td className="px-6 py-4 text-sm text-white/60">
                  {new Date(v.sale_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-sm text-white/80">{v.customers?.name}</td>
                <td className="px-6 py-4 text-sm text-white/40">{v.users?.name}</td>
                <td className="px-6 py-4 text-sm text-right text-[#00e5a0] font-bold">
                  S/ {Number(v.total).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    v.status === 'completada'
                      ? 'bg-[#00e5a0]/10 text-[#00e5a0]'
                      : 'bg-red-400/10 text-red-400'
                  }`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => viewDetail(v.id)} className="text-xs text-white/40 hover:text-white mr-3 transition-colors">
                    Ver
                  </button>
                  {(user?.role ?? user?.rol) === 'admin' && v.status === 'completada' && (
                    <button onClick={() => voidSale(v.id)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                      Anular
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {sales.length === 0 && !isLoading && (
              <tr><td colSpan={7} className="text-center text-white/20 text-sm py-10">Sin ventas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal detalle */}
      {saleDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13151f] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-white">Venta #{saleDetail.id}</h2>
              <button onClick={() => setSaleDetail(null)} className="text-white/30 hover:text-white transition-colors text-xl">×</button>
            </div>
            <div className="text-xs text-white/30 mb-4">
              {new Date(saleDetail.sale_date).toLocaleString('es-PE')} · {saleDetail.customers?.name} · {saleDetail.users?.name}
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {saleDetail.sale_details?.map((d) => (
                <div key={d.id} className="flex justify-between text-sm">
                  <span className="text-white/70">{d.products?.name} × {d.quantity}</span>
                  <span className="text-white/50">S/ {Number(d.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 pt-4 flex justify-between">
              <span className="text-white/40">Total</span>
              <span className="text-[#00e5a0] font-black text-xl">S/ {Number(saleDetail.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
