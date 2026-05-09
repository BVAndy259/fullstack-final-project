import { useEffect, useRef, useState } from 'react';
import anime from '../lib/anime';
import api from '../api/axios';

const NewSale = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customerDni, setCustomerDni] = useState('');
  const [customerId, setCustomerId] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const titleRef = useRef(null);
  const cartRef = useRef(null);

  useEffect(() => {
    anime({ targets: titleRef.current, opacity: [0,1], translateY: [-20,0], duration: 500, easing: 'easeOutExpo' });
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await api.get('/products');
    setProducts(res.data);
  };

  const findCustomer = async () => {
    if (!customerDni) return;
    try {
      const res = await api.get(`/customers?search=${customerDni}`);
      if (res.data.length > 0) {
        setCustomerId(res.data[0].id);
        setCustomerName(res.data[0].name);
      } else {
        alert('Cliente no encontrado. Se usará Cliente General.');
        setCustomerId(1);
        setCustomerName('');
      }
    } catch {
      setCustomerId(1);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === product.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    anime({
      targets: cartRef.current,
      scale: [1, 1.02, 1],
      duration: 300,
      easing: 'easeOutExpo',
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const total = cart.reduce((acc, i) => acc + Number(i.sale_price) * i.quantity, 0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmSale = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);
    try {
      await api.post('/sales', {
        customer_id: customerId,
        items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      });
      setIsSuccess(true);
      setCart([]);
      setCustomerDni('');
      setCustomerId(1);
      setCustomerName('');
      fetchProducts();
      anime({
        targets: '.success-banner',
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 400,
        easing: 'easeOutExpo',
      });
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al registrar venta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-['Syne',sans-serif] h-full">
      <div ref={titleRef} className="mb-6">
        <h1 className="text-3xl font-black text-white">Nueva Venta</h1>
        <p className="text-white/30 text-sm mt-1">Punto de venta</p>
      </div>

      {isSuccess && (
        <div className="success-banner bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[#00e5a0] rounded-xl px-5 py-3 text-sm font-semibold mb-5">
          ✓ Venta registrada correctamente
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-120px)]">
        {/* Panel izquierdo — productos */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e5a0]/50 transition-colors"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.current_stock === 0}
                className="bg-[#13151f] border border-white/5 rounded-xl p-4 text-left hover:border-[#00e5a0]/30 hover:bg-[#00e5a0]/5 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="text-sm font-semibold text-white/80 leading-tight mb-2">{p.name}</div>
                <div className="text-[#00e5a0] font-black text-lg">S/ {Number(p.sale_price).toFixed(2)}</div>
                <div className="text-xs text-white/30 mt-1">Stock: {p.current_stock}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Panel derecho — carrito */}
        <div ref={cartRef} className="bg-[#13151f] border border-white/5 rounded-2xl p-5 flex flex-col">
          {/* Cliente */}
          <div className="mb-4">
            <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Cliente</div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="DNI del cliente"
                value={customerDni}
                onChange={(e) => setCustomerDni(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e5a0]/50"
              />
              <button
                onClick={findCustomer}
                className="bg-white/5 border border-white/10 text-white/60 rounded-lg px-3 py-2 text-xs hover:bg-white/10 transition-colors"
              >
                Buscar
              </button>
            </div>
            {customerName && (
              <div className="text-xs text-[#00e5a0] mt-1.5">✓ {customerName}</div>
            )}
            {!customerName && (
              <div className="text-xs text-white/20 mt-1.5">Cliente General</div>
            )}
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-4">
            {cart.length === 0 && (
              <div className="text-white/20 text-sm text-center py-8">
                Selecciona productos
              </div>
            )}
            {cart.map((item) => (
              <div key={item.id} className="bg-white/5 rounded-xl p-3">
                <div className="text-sm text-white/80 leading-tight mb-2">{item.name}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-lg leading-none transition-colors"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-white w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-lg leading-none transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-[#00e5a0] font-bold text-sm">
                    S/ {(Number(item.sale_price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total y botón */}
          <div className="border-t border-white/5 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/40 text-sm">Total</span>
              <span className="text-2xl font-black text-[#00e5a0]">S/ {total.toFixed(2)}</span>
            </div>
            <button
              onClick={confirmSale}
              disabled={cart.length === 0 || isLoading}
              className="w-full bg-[#00e5a0] text-[#0f1117] font-black py-3 rounded-xl text-sm hover:bg-[#00e5a0]/90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registrando...' : 'Confirmar venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSale;
