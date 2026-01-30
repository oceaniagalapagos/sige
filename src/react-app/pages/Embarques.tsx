import Layout from "@/react-app/components/Layout";
import { useState } from "react";
import { Link } from "react-router";
import { useEmbarques } from "@/react-app/hooks/useEmbarques";
import { useClientes } from "@/react-app/hooks/useClientes";
import { Package, Plus, Search, Ship, X } from "lucide-react";

export default function Embarques() {
  const { embarques, loading, refetch } = useEmbarques();
  const { clientes } = useClientes();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [formData, setFormData] = useState({
    id_cliente: "",
    notas: "",
  });

  const estados = [
    "Solicitado",
    "Retirado",
    "En Bodega",
    "Embarcado",
    "En Tránsito",
    "Entregado",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/embarques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cliente: parseInt(formData.id_cliente),
          notas: formData.notas,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({ id_cliente: "", notas: "" });
        refetch();
      }
    } catch (error) {
      console.error("Error creating embarque:", error);
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      Solicitado: "bg-amber-100 text-amber-800",
      Retirado: "bg-blue-100 text-blue-800",
      "En Bodega": "bg-purple-100 text-purple-800",
      Embarcado: "bg-indigo-100 text-indigo-800",
      "En Tránsito": "bg-orange-100 text-orange-800",
      Entregado: "bg-emerald-100 text-emerald-800",
    };
    return colors[estado] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredEmbarques = embarques.filter((embarque) => {
    const matchesSearch =
      embarque.codigo_embarque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      embarque.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado ? embarque.estado_actual === filterEstado : true;
    return matchesSearch && matchesEstado;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin">
            <Ship className="w-12 h-12 text-emerald-600" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Embarques</h1>
            <p className="text-sm sm:text-base text-gray-600">Gestión de embarques y envíos</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Nuevo Embarque</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los estados</option>
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Embarques List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {filteredEmbarques.length === 0 ? (
              <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  {searchTerm || filterEstado
                    ? "No se encontraron embarques"
                    : "No hay embarques registrados"}
                </p>
                {!searchTerm && !filterEstado && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-sm sm:text-base text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Crear primer embarque
                  </button>
                )}
              </div>
            ) : (
              filteredEmbarques.map((embarque) => (
                <Link
                  key={embarque.id}
                  to={`/embarques/${embarque.id}`}
                  className="block px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
                        <span className="text-base sm:text-lg font-semibold text-gray-900">
                          {embarque.codigo_embarque}
                        </span>
                        <span
                          className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getEstadoColor(
                            embarque.estado_actual
                          )}`}
                        >
                          {embarque.estado_actual}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <span className="truncate">Cliente: {embarque.nombre_cliente}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Creado: {formatDate(embarque.created_at)}</span>
                      </div>
                      {embarque.notas && (
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500 line-clamp-1">
                          {embarque.notas}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Nuevo Embarque
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <select
                  required
                  value={formData.id_cliente}
                  onChange={(e) =>
                    setFormData({ ...formData, id_cliente: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} - {cliente.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Información adicional sobre el embarque..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
