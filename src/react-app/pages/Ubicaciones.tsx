import Layout from "@/react-app/components/Layout";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MapPin, Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, Globe, ArrowRight } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface Ubicacion {
  id: number;
  nombre_ubicacion: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

interface Destino {
  id: number;
  nombre_destino: string;
  isla: string;
}

export default function Ubicaciones() {
  const { usuario } = useCurrentUser();
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(null);
  const [formData, setFormData] = useState({
    nombre_ubicacion: "",
    descripcion: "",
  });
  const [expandedUbicaciones, setExpandedUbicaciones] = useState<Set<number>>(new Set());
  const [destinosPorUbicacion, setDestinosPorUbicacion] = useState<Record<number, Destino[]>>({});
  const [loadingDestinos, setLoadingDestinos] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchUbicaciones();
  }, []);

  const fetchUbicaciones = async () => {
    try {
      const response = await fetch("/api/ubicaciones");
      const data = await response.json();
      setUbicaciones(data);
    } catch (error) {
      console.error("Error fetching ubicaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDestinosPorUbicacion = async (ubicacionId: number) => {
    if (destinosPorUbicacion[ubicacionId]) return;
    
    setLoadingDestinos(prev => new Set([...prev, ubicacionId]));
    try {
      const response = await fetch(`/api/ubicaciones/${ubicacionId}/destinos`);
      const data = await response.json();
      setDestinosPorUbicacion(prev => ({ ...prev, [ubicacionId]: data }));
    } catch (error) {
      console.error("Error fetching destinos:", error);
    } finally {
      setLoadingDestinos(prev => {
        const next = new Set(prev);
        next.delete(ubicacionId);
        return next;
      });
    }
  };

  const toggleExpanded = (ubicacionId: number) => {
    setExpandedUbicaciones(prev => {
      const next = new Set(prev);
      if (next.has(ubicacionId)) {
        next.delete(ubicacionId);
      } else {
        next.add(ubicacionId);
        fetchDestinosPorUbicacion(ubicacionId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingUbicacion
        ? `/api/ubicaciones/${editingUbicacion.id}`
        : "/api/ubicaciones";
      const method = editingUbicacion ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_ubicacion: formData.nombre_ubicacion,
          descripcion: formData.descripcion || undefined,
        }),
      });

      if (response.ok) {
        fetchUbicaciones();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving ubicación:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta ubicación?")) return;

    try {
      const response = await fetch(`/api/ubicaciones/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUbicaciones();
        setDestinosPorUbicacion(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } else {
        const data = await response.json();
        alert(data.error || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error deleting ubicación:", error);
    }
  };

  const handleEdit = (ubicacion: Ubicacion) => {
    setEditingUbicacion(ubicacion);
    setFormData({
      nombre_ubicacion: ubicacion.nombre_ubicacion,
      descripcion: ubicacion.descripcion || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUbicacion(null);
    setFormData({ nombre_ubicacion: "", descripcion: "" });
  };

  if (usuario?.rol !== "administrador") {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Acceso denegado</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ubicaciones
            </h1>
            <p className="text-gray-600">
              Gestiona las ubicaciones y sus destinos asociados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/destinos"
              className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              Ver Destinos
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Ubicación
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {ubicaciones.map((ubicacion) => (
            <div key={ubicacion.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Cabecera de la ubicación */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(ubicacion.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Acciones primero */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(ubicacion)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ubicacion.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    {expandedUbicaciones.has(ubicacion.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  <Globe className="w-6 h-6 text-teal-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{ubicacion.nombre_ubicacion}</h3>
                    {ubicacion.descripcion && (
                      <p className="text-sm text-gray-500">{ubicacion.descripcion}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {destinosPorUbicacion[ubicacion.id]?.length ?? "..."} destinos
                  </span>
                </div>
              </div>

              {/* Lista de destinos (detalle) */}
              {expandedUbicaciones.has(ubicacion.id) && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  {loadingDestinos.has(ubicacion.id) ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Cargando destinos...</p>
                    </div>
                  ) : destinosPorUbicacion[ubicacion.id]?.length === 0 ? (
                    <div className="text-center py-4">
                      <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No hay destinos asociados a esta ubicación</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Destinos asociados:</h4>
                      <div className="grid gap-2">
                        {destinosPorUbicacion[ubicacion.id]?.map((destino) => (
                          <div 
                            key={destino.id} 
                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-teal-500" />
                              <span className="font-medium text-gray-900">{destino.nombre_destino}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{destino.isla}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {ubicaciones.length === 0 && !loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No hay ubicaciones registradas</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUbicacion ? "Editar Ubicación" : "Nueva Ubicación"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Ubicación
                </label>
                <input
                  type="text"
                  value={formData.nombre_ubicacion}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_ubicacion: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ej: Zona Norte, Región Central, Costa Este"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descripción opcional de la ubicación"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  {editingUbicacion ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
