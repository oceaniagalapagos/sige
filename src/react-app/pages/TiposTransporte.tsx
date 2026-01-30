import Layout from "@/react-app/components/Layout";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Truck, Plus, Pencil, Trash2, X, Ship, ChevronDown, ChevronRight, Plane, Train, Package, ArrowRight } from "lucide-react";

// Función para obtener el ícono según el tipo de transporte
const getTransportIcon = (nombreTipo: string, className: string = "w-6 h-6 text-blue-600") => {
  const nombre = nombreTipo.toLowerCase();
  if (nombre.includes("marítimo") || nombre.includes("maritimo") || nombre.includes("naval") || nombre.includes("barco")) {
    return <Ship className={className} />;
  }
  if (nombre.includes("aéreo") || nombre.includes("aereo") || nombre.includes("avión") || nombre.includes("avion")) {
    return <Plane className={className} />;
  }
  if (nombre.includes("ferroviario") || nombre.includes("tren") || nombre.includes("ferrocarril")) {
    return <Train className={className} />;
  }
  if (nombre.includes("terrestre") || nombre.includes("camión") || nombre.includes("camion") || nombre.includes("carretera")) {
    return <Truck className={className} />;
  }
  return <Package className={className} />;
};
import { useCurrentUser } from "../hooks/useCurrentUser";

interface TipoTransporte {
  id: number;
  nombre_tipo: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

interface Transporte {
  id: number;
  nombre_barco: string;
  capacidad_peso: number | null;
  capacidad_volumen: number | null;
}

export default function TiposTransporte() {
  const { usuario } = useCurrentUser();
  const [tiposTransporte, setTiposTransporte] = useState<TipoTransporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoTransporte | null>(null);
  const [formData, setFormData] = useState({
    nombre_tipo: "",
    descripcion: "",
  });
  const [expandedTipos, setExpandedTipos] = useState<Set<number>>(new Set());
  const [transportesPorTipo, setTransportesPorTipo] = useState<Record<number, Transporte[]>>({});
  const [loadingTransportes, setLoadingTransportes] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchTiposTransporte();
  }, []);

  const fetchTiposTransporte = async () => {
    try {
      const response = await fetch("/api/tipos-transporte");
      const data = await response.json();
      setTiposTransporte(data);
    } catch (error) {
      console.error("Error fetching tipos de transporte:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransportesPorTipo = async (tipoId: number) => {
    if (transportesPorTipo[tipoId]) return;
    
    setLoadingTransportes(prev => new Set([...prev, tipoId]));
    try {
      const response = await fetch(`/api/tipos-transporte/${tipoId}/transportes`);
      const data = await response.json();
      setTransportesPorTipo(prev => ({ ...prev, [tipoId]: data }));
    } catch (error) {
      console.error("Error fetching transportes:", error);
    } finally {
      setLoadingTransportes(prev => {
        const next = new Set(prev);
        next.delete(tipoId);
        return next;
      });
    }
  };

  const toggleExpanded = (tipoId: number) => {
    setExpandedTipos(prev => {
      const next = new Set(prev);
      if (next.has(tipoId)) {
        next.delete(tipoId);
      } else {
        next.add(tipoId);
        fetchTransportesPorTipo(tipoId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTipo
        ? `/api/tipos-transporte/${editingTipo.id}`
        : "/api/tipos-transporte";
      const method = editingTipo ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_tipo: formData.nombre_tipo,
          descripcion: formData.descripcion || undefined,
        }),
      });

      if (response.ok) {
        fetchTiposTransporte();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving tipo de transporte:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este tipo de transporte?")) return;

    try {
      const response = await fetch(`/api/tipos-transporte/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTiposTransporte();
        // Limpiar transportes en caché
        setTransportesPorTipo(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } else {
        const data = await response.json();
        alert(data.error || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error deleting tipo de transporte:", error);
    }
  };

  const handleEdit = (tipo: TipoTransporte) => {
    setEditingTipo(tipo);
    setFormData({
      nombre_tipo: tipo.nombre_tipo,
      descripcion: tipo.descripcion || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTipo(null);
    setFormData({ nombre_tipo: "", descripcion: "" });
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
              Tipos de Transporte
            </h1>
            <p className="text-gray-600">
              Gestiona los tipos de transporte y sus transportes asociados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/transportes"
              className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Ship className="w-5 h-5" />
              Ver Transportes
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Tipo
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {tiposTransporte.map((tipo) => (
            <div key={tipo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Cabecera del tipo de transporte */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(tipo.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Acciones primero */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(tipo)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tipo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    {expandedTipos.has(tipo.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {getTransportIcon(tipo.nombre_tipo, "w-6 h-6 text-blue-600")}
                  <div>
                    <h3 className="font-semibold text-gray-900">{tipo.nombre_tipo}</h3>
                    {tipo.descripcion && (
                      <p className="text-sm text-gray-500">{tipo.descripcion}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {transportesPorTipo[tipo.id]?.length ?? "..."} transportes
                  </span>
                </div>
              </div>

              {/* Lista de transportes (detalle) */}
              {expandedTipos.has(tipo.id) && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  {loadingTransportes.has(tipo.id) ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Cargando transportes...</p>
                    </div>
                  ) : transportesPorTipo[tipo.id]?.length === 0 ? (
                    <div className="text-center py-4">
                      {getTransportIcon(tipo.nombre_tipo, "w-8 h-8 text-gray-300 mx-auto mb-2")}
                      <p className="text-sm text-gray-500">No hay transportes asociados a este tipo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Transportes asociados:</h4>
                      <div className="grid gap-2">
                        {transportesPorTipo[tipo.id]?.map((transporte) => (
                          <div 
                            key={transporte.id} 
                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              {getTransportIcon(tipo.nombre_tipo, "w-5 h-5 text-blue-500")}
                              <span className="font-medium text-gray-900">{transporte.nombre_barco}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {transporte.capacidad_peso && (
                                <span>{transporte.capacidad_peso.toLocaleString()} kg</span>
                              )}
                              {transporte.capacidad_volumen && (
                                <span>{transporte.capacidad_volumen.toLocaleString()} m³</span>
                              )}
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

          {tiposTransporte.length === 0 && !loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No hay tipos de transporte registrados</p>
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
                {editingTipo ? "Editar Tipo de Transporte" : "Nuevo Tipo de Transporte"}
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
                  Nombre del Tipo
                </label>
                <input
                  type="text"
                  value={formData.nombre_tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_tipo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Marítimo, Aéreo, Terrestre"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descripción opcional del tipo de transporte"
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTipo ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
