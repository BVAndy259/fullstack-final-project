const LowStockAlert = ({ alerts = [], showTitle = true }) => {
  const hasAlerts = alerts.length > 0;

  return (
    <div className="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
      {showTitle && (
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-widest">
            Alertas de stock bajo
          </h2>
        </div>
      )}

      <table className="w-full">
        <thead>
          <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
            <th className="text-left px-6 py-4">Producto</th>
            <th className="text-left px-6 py-4">Categoría</th>
            <th className="text-right px-6 py-4">Stock actual</th>
            <th className="text-right px-6 py-4">Stock mínimo</th>
            <th className="text-right px-6 py-4">Faltan</th>
          </tr>
        </thead>
        <tbody>
          {hasAlerts &&
            alerts.map((a) => (
              <tr key={a.id} className="border-b border-white/5 last:border-0">
                <td className="px-6 py-4 text-sm text-white/80">{a.name}</td>
                <td className="px-6 py-4 text-sm text-white/40">{a.category}</td>
                <td className="px-6 py-4 text-sm text-right text-red-400 font-bold">{a.current_stock}</td>
                <td className="px-6 py-4 text-sm text-right text-white/40">{a.min_stock}</td>
                <td className="px-6 py-4 text-sm text-right text-yellow-400 font-bold">
                  {Number(a.missing_units)}
                </td>
              </tr>
            ))}

          {!hasAlerts && (
            <tr>
              <td colSpan={5} className="text-center text-[#00e5a0] text-sm py-10">
                ✓ Todo el stock está en niveles correctos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LowStockAlert;
