import Layout from "@/react-app/components/Layout";
import { useState, useEffect } from "react";
import { Box, Plus, X, Trash2, Edit2, ChevronDown, ChevronRight } from "lucide-react";

interface TipoEmbalaje {
  id: number;
  nombre_tipo: string;
  descripcion: string;
  is_activo: boolean;
}

interface ConfigCosto {
  id: number;
  tipo_servicio: string;
  tipo_transporte: string;
  tipo_embalaje: string;
  costo_base: number;
  unidad_medida: string;
}

export default function TiposEmbalaje() {
  const [tipos, setTipos] = useState<TipoEmbalaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoEmbalaje | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [configsMap, setConfigsMap] = useState<Record<number, ConfigCosto[]>>({});
  const [loadingConfigs, setLoadingConfigs] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    nombre_tipo: "",
    descripcion: "",
  });

  useEffect(() => {
    fetchTipos();
  }, []);

  const fetchTipos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tipos-embalaje");
      const data = await response.json();
      setTipos(data);
    } catch (error) {
      console.error("Error fetching tipos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigsForTipo = async (tipoId: number, nombreTipo: string) => {
    try {
      setLoadingConfigs(tipoId);
      const response = await fetch("/api/configuracion");
      const allConfigs = await response.json();
      const filtered = allConfigs.filter((c: ConfigCosto) => c.tipo_embalaje === nombreTipo);
      setConfigsMap(prev => ({ ...prev, [tipoId]: filtered }));
    } catch (error) {
      console.error("Error fetching configs:", error);
    } finally {
      setLoadingConfigs(null);
    }
  };

  const toggleExpand = (tipo: TipoEmbalaje) => {
    if (expandedId === tipo.id) {
      setExpandedId(null);
    } else {
      setExpandedId(tipo.id);
      if (!configsMap[tipo.id]) {
        fetchConfigsForTipo(tipo.id, tipo.nombre_tipo);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTipo
        ? `/api/tipos-embalaje/${editingTipo.id}`
        : "/api/tipos-embalaje";
      const method = editingTipo ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingTipo(null);
        setForm({ nombre_tipo: "", descripcion: "" });
        fetchTipos();
      }
    } catch (error) {
      console.error("Error saving tipo:", error);
    }
  };

  const handleEdit = (tipo: TipoEmbalaje) => {
    setEditingTipo(tipo);
    setForm({
      nombre_tipo: tipo.nombre_tipo,
      descripcion: tipo.descripcion || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este tipo de embalaje?")) return;

    try {
      const response = await fetch(`/api/tipos-embalaje/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTipos();
      } else {
        const data = await response.json();
        alert(data.error || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error deleting tipo:", error);
    }
  };

  const openNewModal = () => {
    setEditingTipo(null);
    setForm({ nombre_tipo: "", descripcion: "" });
    setShowModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin">
            <Box className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tipos de Embalaje
            </h1>
            <p className="text-gray-600">
              Gestión de tipos de embalaje para configuración de costos
            </p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Tipo
          </button>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {tipos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <Box className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No hay tipos de embalaje registrados</p>
              <button
                onClick={openNewModal}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Crear primer tipo
              </button>
            </div>
          ) : (
            tipos.map((tipo) => {
              const isExpanded = expandedId === tipo.id;
              const configs = configsMap[tipo.id] || [];
              const isLoadingConfigs = loadingConfigs === tipo.id;

              return (
                <div
                  key={tipo.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Card Header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(tipo)}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(tipo);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(tipo.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Box className="w-5 h-5 text-amber-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {tipo.nombre_tipo}
                      </h3>
                      {tipo.descripcion && (
                        <p className="text-sm text-gray-500">{tipo.descripcion}</p>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Configuraciones de Costo Asociadas
                      </h4>
                      
                      {isLoadingConfigs ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin">
                            <Box className="w-6 h-6 text-amber-600" />
                          </div>
                        </div>
                      ) : configs.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay configuraciones usando este tipo de embalaje
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {configs.map((config) => (
                            <div
                              key={config.id}
                              className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-900">
                                  {config.tipo_servicio} / {config.tipo_transporte || "-"}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                ${config.costo_base.toFixed(2)} / {config.unidad_medida}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTipo ? "Editar Tipo de Embalaje" : "Nuevo Tipo de Embalaje"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre_tipo}
                  onChange={(e) => setForm({ ...form, nombre_tipo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Caja, Pallet, Contenedor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del tipo de embalaje..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTipo ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
