import { useEffect, useState } from 'react';
import { dashboardApi } from '../api';
import type { DashboardData } from '../api';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch(() => setError('Could not load dashboard. Is the server running?'));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Loading...</p>
      </div>
    );
  }

  const cards = [
    { label: 'Total Products', value: data.totalProducts, color: 'bg-blue-500' },
    { label: 'Inventory Items', value: data.totalInventory, color: 'bg-green-500' },
    { label: 'Total Sales', value: data.totalSales, color: 'bg-purple-500' },
    { label: 'Revenue', value: `$${Number(data.totalRevenue).toFixed(2)}`, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border p-5">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-white text-lg mb-3`}>
              {card.label === 'Total Products' ? '📦' : card.label === 'Inventory Items' ? '📋' : card.label === 'Total Sales' ? '🧾' : '💰'}
            </div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-800">Recent Sales</h3>
        </div>
        <div className="overflow-x-auto">
          {data.recentSales.length === 0 ? (
            <p className="p-5 text-gray-500 text-sm">No sales yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="px-5 py-3 font-medium">Receipt</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map(sale => (
                  <tr key={sale.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-gray-800">{sale.receipt_number}</td>
                    <td className="px-5 py-3 text-gray-800">${Number(sale.total).toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(sale.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
