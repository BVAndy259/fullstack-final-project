import { useEffect, useRef, useState } from 'react';
import anime from '../lib/anime';
import api from '../api/axios';

const StatCard = ({ label, value, sub, accent }) => {
  const ref = useRef(null);
  useEffect(() => {
    anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 500,
      easing: 'easeOutExpo',
    });
  }, []);
  return (
    <div ref={ref} className="bg-[#13151f] border border-white/5 rounded-2xl p-6">
      <div className="text-xs text-white/30 uppercase tracking-widest mb-3">{label}</div>
      <div className={`text-3xl font-black ${accent || 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const titleRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => {
    anime({
      targets: titleRef.current,
      opacity: [0, 1],
      translateY: [-20, 0],
      duration: 500,
      easing: 'easeOutExpo',
    });
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (data && tableRef.current) {
      anime({
        targets: tableRef.current.querySelectorAll('tr'),
        opacity: [0, 1],
        translateX: [-20, 0],
        delay: anime.stagger(60),
        duration: 400,
        easing: 'easeOutExpo',
      });
    }
  }, [data]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setData({
        today_sales: { quantity: 0, income: 0 },
        low_stock_count: 0,
        top_products: [],
        weekly_sales: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/30 text-sm animate-pulse">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="font-['Syne',sans-serif]">
      <div ref={titleRef} className="mb-8">
        <h1 className="text-3xl font-black text-white">Dashboard</h1>
        <p className="text-white/30 text-sm mt-1">Resumen del día</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Ventas hoy"
          value={data?.today_sales?.quantity ?? 0}
          sub="transacciones completadas"
        />
        <StatCard
          label="Ingresos hoy"
          value={`S/ ${Number(data?.today_sales?.income ?? 0).toFixed(2)}`}
          accent="text-[#00e5a0]"
        />
        <StatCard
          label="Alertas de stock"
          value={data?.low_stock_count ?? 0}
          sub="productos bajo mínimo"
          accent={data?.low_stock_count > 0 ? 'text-red-400' : 'text-white'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top productos */}
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
            Top productos (30 días)
          </h2>
          <table ref={tableRef} className="w-full">
            <thead>
              <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
                <th className="text-left pb-3">Producto</th>
                <th className="text-right pb-3">Vendidos</th>
                <th className="text-right pb-3">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {data?.top_products?.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-white/20 text-sm py-6">
                    Sin datos aún
                  </td>
                </tr>
              )}
              {data?.top_products?.map((p, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-sm text-white/80">{p.name}</td>
                  <td className="py-3 text-sm text-right text-white/60">{p.total_sold}</td>
                  <td className="py-3 text-sm text-right text-[#00e5a0]">
                    S/ {Number(p.income ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ventas últimos 7 días */}
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
            Ventas últimos 7 días
          </h2>
          {data?.weekly_sales?.length === 0 ? (
            <div className="text-white/20 text-sm text-center py-6">Sin datos aún</div>
          ) : (
            <div className="flex flex-col gap-3">
              {data?.weekly_sales?.map((d, i) => {
                const max = Math.max(...data.weekly_sales.map((x) => Number(x.income)));
                const pct = max > 0 ? (Number(d.income) / max) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="text-xs text-white/30 w-20 shrink-0">
                      {new Date(d.day).toLocaleDateString('es-PE', {
                        weekday: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-[#00e5a0] rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-white/50 w-20 text-right shrink-0">
                      S/ {Number(d.income).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
