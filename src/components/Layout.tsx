import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Store,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/products", label: "Products", Icon: Package },
  { to: "/pos", label: "POS", Icon: ShoppingCart },
  { to: "/sales", label: "Sales", Icon: Receipt },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`fixed md:static md:flex flex-col w-64 bg-white border-r shadow-sm inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${
          menuOpen ? "translate-x-0 visible" : "-translate-x-full invisible"
        } md:translate-x-0 md:visible`}
      >
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Store size={18} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Cube POS</h1>
          <button
            onClick={() => setMenuOpen(false)}
            className="ml-auto p-1 rounded hover:bg-gray-100 md:hidden"
            aria-label="Close menu"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <item.Icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Cube POS</h1>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-6">{children}</main>
      </div>
    </div>
  );
}
