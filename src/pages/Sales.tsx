import { useEffect, useState } from 'react';
import { salesApi } from '../api';
import type { Sale } from '../api';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    salesApi.list()
      .then(setSales)
      .finally(() => setLoading(false));
  }, []);

  const viewDetails = async (sale: Sale) => {
    const detail = await salesApi.get(sale.id);
    setSelected(detail);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500"><p>Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Sales History</h2>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-5 py-3 font-medium">Receipt #</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">No sales recorded.</td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-gray-800">{sale.receipt_number}</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">${Number(sale.total).toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(sale.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => viewDetails(sale)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Sale Details</h3>
                <p className="text-sm text-gray-500 font-mono">{selected.receipt_number}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-gray-500">
              {new Date(selected.created_at).toLocaleString()}
            </p>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 font-medium">Qty</th>
                  <th className="py-2 font-medium text-right">Price</th>
                  <th className="py-2 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selected.items?.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 text-gray-800">{item.product_name}</td>
                    <td className="py-2 text-gray-600">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-600">${Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-2 text-right font-medium text-gray-800">${Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 text-right font-semibold text-gray-800">Total</td>
                  <td className="py-2 text-right font-bold text-gray-800">${Number(selected.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
