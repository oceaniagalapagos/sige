import Layout from "@/react-app/components/Layout";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, X, Ship, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { useTiposProductos } from "@/react-app/hooks/useTiposProductos";
import { useUserRole } from "@/react-app/hooks/useUserRole";

interface TipoTransporte {
  id: number;
  nombre_tipo: string;
  descripcion?: string;
}

interface Transporte {
  id: number;
  nombre_barco: string;
  id_tipo_transporte?: number;
  tipo_transporte_nombre?: string;
}

interface CalendarioEvento {
  id: number;
  fecha_embarque: string;
  id_barco: number;
  nombre_barco: string;
  tipo_transporte_nombre?: string;
  nombre_destino?: string;
  isla?: string;
  tipos_productos_aceptados: string;
  cupo_total_peso: number;
  cupo_total_volumen: number;
  cupo_utilizado_peso: number;
  cupo_utilizado_volumen: number;
  is_activo: boolean;
}

export default function Calendario() {
  const { tiposProductos } = useTiposProductos();
  const { isAdministrador } = useUserRole();
  const [eventos, setEventos] = useState<CalendarioEvento[]>([]);
  const [tiposTransporte, setTiposTransporte] = useState<TipoTransporte[]>([]);
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [transportesFiltrados, setTransportesFiltrados] = useState<Transporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState<CalendarioEvento | null>(null);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    fecha_embarque: "",
    id_tipo_transporte: "",
    id_transporte: "",
    cupo_total_peso: "",
    cupo_total_volumen: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrar transportes cuando cambia el tipo de transporte seleccionado
  useEffect(() => {
    if (formData.id_tipo_transporte) {
      const tipoId = parseInt(formData.id_tipo_transporte);
      const filtrados = transportes.filter(t => t.id_tipo_transporte === tipoId);
      setTransportesFiltrados(filtrados);
      // Si el transporte seleccionado no está en los filtrados, resetear
      if (formData.id_transporte && !filtrados.find(t => t.id.toString() === formData.id_transporte)) {
        setFormData(prev => ({ ...prev, id_transporte: "" }));
      }
    } else {
      setTransportesFiltrados([]);
      setFormData(prev => ({ ...prev, id_transporte: "" }));
    }
  }, [formData.id_tipo_transporte, transportes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventosRes, transportesRes, tiposTransporteRes] = await Promise.all([
        fetch("/api/calendario"),
        fetch("/api/transportes"),
        fetch("/api/tipos-transporte"),
      ]);

      const eventosData = await eventosRes.json();
      const transportesData = await transportesRes.json();
      const tiposTransporteData = await tiposTransporteRes.json();

      setEventos(eventosData);
      setTransportes(transportesData);
      setTiposTransporte(tiposTransporteData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingEvento
        ? `/api/calendario/${editingEvento.id}`
        : "/api/calendario";
      const method = editingEvento ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_embarque: formData.fecha_embarque,
          id_barco: parseInt(formData.id_transporte),
          tipos_productos_aceptados: selectedProductTypes.join(","),
          cupo_total_peso: parseFloat(formData.cupo_total_peso),
          cupo_total_volumen: parseFloat(formData.cupo_total_volumen),
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingEvento(null);
        setFormData({
          fecha_embarque: "",
          id_tipo_transporte: "",
          id_transporte: "",
          cupo_total_peso: "",
          cupo_total_volumen: "",
        });
        setSelectedProductTypes([]);
        fetchData();
      }
    } catch (error) {
      console.error("Error saving evento:", error);
    }
  };

  const handleEdit = (evento: CalendarioEvento) => {
    setEditingEvento(evento);
    // Buscar el transporte para obtener su tipo
    const transporte = transportes.find(t => t.id === evento.id_barco);
    setFormData({
      fecha_embarque: evento.fecha_embarque,
      id_tipo_transporte: transporte?.id_tipo_transporte?.toString() || "",
      id_transporte: evento.id_barco.toString(),
      cupo_total_peso: evento.cupo_total_peso.toString(),
      cupo_total_volumen: evento.cupo_total_volumen.toString(),
    });
    setSelectedProductTypes(evento.tipos_productos_aceptados.split(",").map(t => t.trim()));
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este evento del calendario?")) return;

    try {
      const response = await fetch(`/api/calendario/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || "Error al eliminar evento");
      }
    } catch (error) {
      console.error("Error deleting evento:", error);
      alert("Error al eliminar evento");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvento(null);
    setFormData({
      fecha_embarque: "",
      id_tipo_transporte: "",
      id_transporte: "",
      cupo_total_peso: "",
      cupo_total_volumen: "",
    });
    setSelectedProductTypes([]);
  };

  const toggleProductType = (tipo: string) => {
    setSelectedProductTypes((prev) =>
      prev.includes(tipo)
        ? prev.filter((t) => t !== tipo)
        : [...prev, tipo]
    );
  };

  const calculatePercentage = (usado: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((usado / total) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-emerald-500";
  };

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Calendario de Embarques
            </h1>
            <p className="text-gray-600">
              Planificación de fechas y capacidad de embarques
            </p>
          </div>
          {isAdministrador && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Programar Embarque
            </button>
          )}
        </div>

        {/* Calendario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                No hay embarques programados
              </p>
              {isAdministrador && (
                <button
                  onClick={() => setShowModal(true)}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Programar primer embarque
                </button>
              )}
            </div>
          ) : (
            eventos.map((evento) => {
              const pesoPercentage = calculatePercentage(
                evento.cupo_utilizado_peso,
                evento.cupo_total_peso
              );
              const volumenPercentage = calculatePercentage(
                evento.cupo_utilizado_volumen,
                evento.cupo_total_volumen
              );

              return (
                <div
                  key={evento.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Date and Actions */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        {new Date(evento.fecha_embarque).toLocaleDateString(
                          "es-ES",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {evento.nombre_barco}
                        {evento.tipo_transporte_nombre && (
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            ({evento.tipo_transporte_nombre})
                          </span>
                        )}
                      </p>
                    </div>
                    {isAdministrador && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(evento)}
                          className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(evento.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Productos */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">
                      Productos aceptados:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {evento.tipos_productos_aceptados
                        .split(",")
                        .map((tipo, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {tipo.trim()}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Cupo Peso */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Peso</span>
                      <span className="font-medium text-gray-900">
                        {evento.cupo_utilizado_peso} / {evento.cupo_total_peso}{" "}
                        kg
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getStatusColor(
                          pesoPercentage
                        )}`}
                        style={{ width: `${pesoPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Cupo Volumen */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Volumen</span>
                      <span className="font-medium text-gray-900">
                        {evento.cupo_utilizado_volumen} /{" "}
                        {evento.cupo_total_volumen} m³
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getStatusColor(
                          volumenPercentage
                        )}`}
                        style={{ width: `${volumenPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Alert if near capacity */}
                  {(pesoPercentage >= 90 || volumenPercentage >= 90) && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span>Cupo casi completo</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingEvento ? "Editar Embarque" : "Programar Embarque"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Embarque *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha_embarque}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_embarque: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Transporte *
                </label>
                <select
                  required
                  value={formData.id_tipo_transporte}
                  onChange={(e) =>
                    setFormData({ ...formData, id_tipo_transporte: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar tipo de transporte</option>
                  {tiposTransporte.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre_tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transportes *
                </label>
                <select
                  required
                  value={formData.id_transporte}
                  onChange={(e) =>
                    setFormData({ ...formData, id_transporte: e.target.value })
                  }
                  disabled={!formData.id_tipo_transporte}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!formData.id_tipo_transporte 
                      ? "Primero seleccione un tipo de transporte" 
                      : transportesFiltrados.length === 0 
                        ? "No hay transportes para este tipo" 
                        : "Seleccionar transporte"}
                  </option>
                  {transportesFiltrados.map((transporte) => (
                    <option key={transporte.id} value={transporte.id}>
                      {transporte.nombre_barco}
                    </option>
                  ))}
                </select>
                {formData.id_tipo_transporte && transportesFiltrados.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No hay transportes registrados para este tipo. Agregue transportes en el menú Maestros → Transportes.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipos de Productos Aceptados *
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {tiposProductos.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay tipos de productos disponibles</p>
                  ) : (
                    <div className="space-y-2">
                      {tiposProductos.map((tipo) => (
                        <label
                          key={tipo.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedProductTypes.includes(tipo.nombre_tipo)}
                            onChange={() => toggleProductType(tipo.nombre_tipo)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-900">{tipo.nombre_tipo}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona uno o más tipos de productos
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cupo Peso (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.cupo_total_peso}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cupo_total_peso: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cupo Volumen (m³) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.cupo_total_volumen}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cupo_total_volumen: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
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
                  disabled={!formData.id_transporte}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {editingEvento ? "Guardar Cambios" : "Programar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
