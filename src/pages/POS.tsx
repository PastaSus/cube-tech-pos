import { useEffect, useState } from 'react';
import { productsApi, salesApi } from '../api';
import type { Product } from '../api';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    productsApi.list().then(setProducts);
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCheckoutMessage(null);
  };

  const updateQty = (productId: number, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (qty <= 0) {
      setCart(prev => prev.filter(c => c.product.id !== productId));
      return;
    }
    if (qty > product.stock) qty = product.stock;
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, quantity: qty } : c));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const total = cart.reduce((sum, c) => sum + Number(c.product.price) * c.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const items = cart.map(c => ({ product_id: c.product.id, quantity: c.quantity }));
      const sale = await salesApi.create(items);
      setCheckoutMessage({ type: 'success', text: `Sale complete! Receipt: ${sale.receipt_number}` });
      setCart([]);
      const updated = await productsApi.list();
      setProducts(updated);
    } catch (err) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { data: { error: string } } }).response.data.error
        : 'Checkout failed';
      setCheckoutMessage({ type: 'error', text: msg });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Point of Sale</h2>

        {checkoutMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            checkoutMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {checkoutMessage.text}
            <button onClick={() => setCheckoutMessage(null)} className="float-right font-bold">&times;</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {products.filter(p => p.stock > 0).map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white border rounded-xl p-4 text-left hover:shadow-md hover:border-blue-300 transition-all"
            >
              <p className="font-semibold text-gray-800">{product.name}</p>
              <p className="text-lg font-bold text-blue-600">${Number(product.price).toFixed(2)}</p>
              <p className="text-xs text-gray-400">{product.stock} in stock</p>
            </button>
          ))}
          {products.filter(p => p.stock > 0).length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-8">No products available.</p>
          )}
        </div>
      </div>

      <div className="lg:w-80 bg-white rounded-xl shadow-sm border flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Cart ({cart.length})</h3>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex items-center gap-3 pb-3 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">${Number(item.product.price).toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded border text-sm hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 rounded border text-sm hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm font-semibold text-gray-800 w-16 text-right">
                  ${(Number(item.product.price) * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-red-400 hover:text-red-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className="text-xl font-bold text-gray-800">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
