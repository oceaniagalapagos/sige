import { useAuth } from "@getmocha/users-service/react";
import { Link, useLocation } from "react-router";
import {
  Package,
  Users,
  Calendar,
  Settings,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  UserCog,
} from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { usuario } = useCurrentUser();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navegación según rol
  const getNavigation = () => {
    const baseNav = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ];

    if (usuario?.rol === "cliente") {
      return [
        ...baseNav,
        { name: "Mis Embarques", href: "/embarques", icon: Package },
      ];
    }

    if (usuario?.rol === "operador") {
      return [
        ...baseNav,
        { name: "Embarques", href: "/embarques", icon: Package },
        { name: "Clientes", href: "/clientes", icon: Users },
      ];
    }

    if (usuario?.rol === "administrador") {
      return [
        ...baseNav,
        { name: "Embarques", href: "/embarques", icon: Package },
        { name: "Clientes", href: "/clientes", icon: Users },
        { name: "Usuarios", href: "/usuarios", icon: UserCog },
        { name: "Calendario", href: "/calendario", icon: Calendar },
        { name: "Configuración", href: "/configuracion", icon: Settings },
      ];
    }

    return baseNav;
  };

  const navigation = getNavigation();
  const isActive = (path: string) => location.pathname === path;

  // Mostrar rol con badge de color
  const getRolBadge = () => {
    const roles = {
      cliente: { label: "Cliente", color: "bg-emerald-600" },
      operador: { label: "Operador", color: "bg-blue-600" },
      administrador: { label: "Admin", color: "bg-teal-600" },
    };
    return roles[usuario?.rol || "cliente"];
  };

  const rolBadge = getRolBadge();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-emerald-700 to-teal-800 shadow-lg z-40 flex items-center justify-between px-4">
        <img 
          src="https://019b3aba-9218-7379-898e-b7b8fbf96367.mochausercontent.com/Logo-CarapachusLogistic2.png" 
          alt="Carapachus Logistic" 
          className="h-10 w-auto object-contain"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
        />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white p-2 hover:bg-emerald-600 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-16"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-emerald-700 via-teal-800 to-blue-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:block`}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Hidden on mobile (shown in header instead) */}
          <div className="hidden lg:flex items-center justify-center px-6 py-6 border-b border-emerald-600/30">
            <img 
              src="https://019b3aba-9218-7379-898e-b7b8fbf96367.mochausercontent.com/Logo-CarapachusLogistic2.png" 
              alt="Carapachus Logistic" 
              className="h-16 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))' }}
            />
          </div>

          {/* Mobile: Add top padding to account for mobile header */}
          <div className="lg:hidden h-4" />

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.href)
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "text-emerald-50 hover:bg-emerald-600/50 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="border-t border-emerald-600/30 px-4 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {usuario?.nombre || user?.email}
                  </p>
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full text-white ${rolBadge.color}`}
                  >
                    {rolBadge.label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  closeMobileMenu();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-emerald-100 hover:text-white hover:bg-emerald-600 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
