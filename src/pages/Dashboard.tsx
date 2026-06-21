import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Package, ClipboardList, Receipt, DollarSign, ClipboardIcon } from "lucide-react";
import { dashboardApi } from "../api";
import type { DashboardData } from "../api";

const iconMap: Record<string, React.ReactNode> = {
  "Total Products": <Package size={20} />,
  "Inventory Items": <ClipboardList size={20} />,
  "Total Sales": <Receipt size={20} />,
  Revenue: <DollarSign size={20} />,
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

  const normalize = (d: DashboardData) => ({ ...d, recentSales: d.recentSales ?? [] });

  const load = () => {
    setLoading(true);
    setError("");
    dashboardApi
      .get()
      .then(d => setData(normalize(d)))
      .catch(() => setError("Could not load dashboard. Is the server running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .get()
      .then((d) => {
        if (!cancelled) setData(normalize(d));
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
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-7 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-5 py-4 border-b">
            <div className="h-5 w-28 bg-gray-200 rounded" />
          </div>
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 w-full bg-gray-200 rounded" />
            ))}
          </div>
        </div>
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
              {iconMap[card.label] || <DollarSign size={20} />}
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
          {(!data.recentSales || data.recentSales.length === 0) ? (
            <div className="p-8 text-center text-gray-400">
              <ClipboardIcon className="mx-auto mb-2 text-gray-300" size={40} aria-hidden="true" />
              <p className="text-sm">No sales yet. Head to <NavLink to="/pos" className="font-medium text-blue-600 hover:text-blue-800 underline">POS</NavLink> to make your first sale!</p>
            </div>
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
                {(data.recentSales ?? []).map((sale) => (
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
