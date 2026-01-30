import Layout from "@/react-app/components/Layout";
import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Edit2, 
  UserCheck, 
  UserX, 
  Shield, 
  Briefcase, 
  User,
  X,
  Check
} from "lucide-react";

interface Usuario {
  id: number;
  mocha_user_id: string;
  email: string;
  nombre: string;
  rol: "cliente" | "operador" | "administrador";
  is_activo: boolean;
  created_at: string;
  updated_at: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState<string>("todos");
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", rol: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch("/api/usuarios");
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error("Error fetching usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (usuario: Usuario) => {
    setEditingUser(usuario);
    setEditForm({ nombre: usuario.nombre, rol: usuario.rol });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/usuarios/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await fetchUsuarios();
        setEditingUser(null);
      }
    } catch (error) {
      console.error("Error updating usuario:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (usuario: Usuario) => {
    try {
      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_activo: !usuario.is_activo }),
      });

      if (response.ok) {
        await fetchUsuarios();
      }
    } catch (error) {
      console.error("Error toggling usuario status:", error);
    }
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRol = filterRol === "todos" || usuario.rol === filterRol;
    return matchesSearch && matchesRol;
  });

  const getRolIcon = (rol: string) => {
    switch (rol) {
      case "administrador":
        return <Shield className="w-4 h-4" />;
      case "operador":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case "administrador":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "operador":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter((u) => u.is_activo).length,
    admins: usuarios.filter((u) => u.rol === "administrador").length,
    operadores: usuarios.filter((u) => u.rol === "operador").length,
    clientes: usuarios.filter((u) => u.rol === "cliente").length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              Gestión de Usuarios
            </h1>
            <p className="text-slate-500 mt-1">Administra los usuarios del sistema</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-500">Total</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-emerald-600">{stats.activos}</div>
            <div className="text-sm text-slate-500">Activos</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-teal-600">{stats.admins}</div>
            <div className="text-sm text-slate-500">Admins</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-blue-600">{stats.operadores}</div>
            <div className="text-sm text-slate-500">Operadores</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 col-span-2 sm:col-span-1">
            <div className="text-2xl font-bold text-emerald-600">{stats.clientes}</div>
            <div className="text-sm text-slate-500">Clientes</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todos">Todos los roles</option>
              <option value="administrador">Administradores</option>
              <option value="operador">Operadores</option>
              <option value="cliente">Clientes</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Acciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Registro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(usuario)}
                          className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(usuario)}
                          className={`p-2 rounded-lg transition-colors ${
                            usuario.is_activo
                              ? "text-red-500 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={usuario.is_activo ? "Desactivar" : "Activar"}
                        >
                          {usuario.is_activo ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                          {usuario.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{usuario.nombre}</div>
                          <div className="text-sm text-slate-500">{usuario.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getRolBadgeColor(usuario.rol)}`}>
                        {getRolIcon(usuario.rol)}
                        {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {usuario.is_activo ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <UserCheck className="w-4 h-4" />
                          <span className="text-sm font-medium">Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500">
                          <UserX className="w-4 h-4" />
                          <span className="text-sm font-medium">Inactivo</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(usuario.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-200">
            {filteredUsuarios.map((usuario) => (
              <div key={usuario.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                      {usuario.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{usuario.nombre}</div>
                      <div className="text-sm text-slate-500">{usuario.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditClick(usuario)}
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActivo(usuario)}
                      className={`p-2 rounded-lg transition-colors ${
                        usuario.is_activo
                          ? "text-red-500 hover:bg-red-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {usuario.is_activo ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${getRolBadgeColor(usuario.rol)}`}>
                    {getRolIcon(usuario.rol)}
                    {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                  </span>
                  {usuario.is_activo ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Activo
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1">
                      <UserX className="w-3 h-3" /> Inactivo
                    </span>
                  )}
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{formatDate(usuario.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredUsuarios.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Editar Usuario</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rol
                </label>
                <select
                  value={editForm.rol}
                  onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="cliente">Cliente</option>
                  <option value="operador">Operador</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
