import { useEffect, useState } from "react";
import { dashboardApi } from "../api";
import type { DashboardData } from "../api";

const iconMap: Record<string, string> = {
  "Total Products": "📦",
  "Inventory Items": "📋",
  "Total Sales": "🧾",
  Revenue: "💰",
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return "-";
  }
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError("");
    dashboardApi
      .get()
      .then(setData)
      .catch(() => setError("Could not load dashboard. Is the server running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .get()
      .then((data) => {
        if (!cancelled) setData(data);
      })
      .catch(() => {
        if (!cancelled)
          setError("Could not load dashboard. Is the server running?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
        <p>{error}</p>
        <button
          onClick={load}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const revenue = Number(data.totalRevenue);
  const cards = [
    {
      label: "Total Products",
      value: data.totalProducts,
      color: "bg-blue-500",
    },
    {
      label: "Inventory Items",
      value: data.totalInventory,
      color: "bg-green-500",
    },
    { label: "Total Sales", value: data.totalSales, color: "bg-purple-500" },
    {
      label: "Revenue",
      value: isNaN(revenue) ? "$0.00" : `$${revenue.toFixed(2)}`,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border p-5"
          >
            <div
              className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-white text-lg mb-3`}
            >
              {iconMap[card.label] || "📊"}
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
                {data.recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b last:border-0">
                    <td className="px-5 py-3 font-mono text-gray-800">
                      {sale.receipt_number}
                    </td>
                    <td className="px-5 py-3 text-gray-800">
                      ${Number(sale.total).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatDate(sale.created_at)}
                    </td>
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
