import Layout from "@/react-app/components/Layout";
import { useEffect, useState } from "react";
import { Ship, Plus, Pencil, Trash2, X, Truck, Plane, Train, Package } from "lucide-react";

// Función para obtener el ícono según el tipo de transporte
const getTransportIcon = (nombreTipo: string | null, className: string = "w-5 h-5 text-blue-600") => {
  if (!nombreTipo) return <Package className={className} />;
  
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
}

interface Transporte {
  id: number;
  nombre_barco: string;
  capacidad_peso: number | null;
  capacidad_volumen: number | null;
  id_tipo_transporte: number | null;
  tipo_transporte_nombre: string | null;
  created_at: string;
  updated_at: string;
}

export default function Transportes() {
  const { usuario } = useCurrentUser();
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [tiposTransporte, setTiposTransporte] = useState<TipoTransporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransporte, setEditingTransporte] = useState<Transporte | null>(null);
  const [formData, setFormData] = useState({
    nombre_barco: "",
    capacidad_peso: "",
    capacidad_volumen: "",
    id_tipo_transporte: "",
  });

  useEffect(() => {
    fetchTransportes();
    fetchTiposTransporte();
  }, []);

  const fetchTransportes = async () => {
    try {
      const response = await fetch("/api/transportes");
      const data = await response.json();
      setTransportes(data);
    } catch (error) {
      console.error("Error fetching transportes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposTransporte = async () => {
    try {
      const response = await fetch("/api/tipos-transporte");
      const data = await response.json();
      setTiposTransporte(data);
    } catch (error) {
      console.error("Error fetching tipos de transporte:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTransporte
        ? `/api/transportes/${editingTransporte.id}`
        : "/api/transportes";
      const method = editingTransporte ? "PATCH" : "POST";

      const payload = {
        nombre_barco: formData.nombre_barco,
        capacidad_peso: formData.capacidad_peso ? parseFloat(formData.capacidad_peso) : undefined,
        capacidad_volumen: formData.capacidad_volumen ? parseFloat(formData.capacidad_volumen) : undefined,
        id_tipo_transporte: formData.id_tipo_transporte ? parseInt(formData.id_tipo_transporte) : null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchTransportes();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving transporte:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este transporte?")) return;

    try {
      const response = await fetch(`/api/transportes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTransportes();
      }
    } catch (error) {
      console.error("Error deleting transporte:", error);
    }
  };

  const handleEdit = (transporte: Transporte) => {
    setEditingTransporte(transporte);
    setFormData({
      nombre_barco: transporte.nombre_barco,
      capacidad_peso: transporte.capacidad_peso?.toString() || "",
      capacidad_volumen: transporte.capacidad_volumen?.toString() || "",
      id_tipo_transporte: transporte.id_tipo_transporte?.toString() || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTransporte(null);
    setFormData({ nombre_barco: "", capacidad_peso: "", capacidad_volumen: "", id_tipo_transporte: "" });
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
              Transportes
            </h1>
            <p className="text-gray-600">
              Gestiona los transportes disponibles
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Transporte
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Transporte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacidad Peso (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacidad Volumen (m³)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transportes.map((transporte) => (
                  <tr key={transporte.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(transporte)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transporte.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTransportIcon(transporte.tipo_transporte_nombre, "w-5 h-5 text-blue-600")}
                        <span className="font-medium text-gray-900">
                          {transporte.nombre_barco}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {transporte.tipo_transporte_nombre ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {transporte.tipo_transporte_nombre}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {transporte.capacidad_peso ? transporte.capacidad_peso.toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {transporte.capacidad_volumen ? transporte.capacidad_volumen.toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {transportes.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No hay transportes registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTransporte ? "Editar Transporte" : "Nuevo Transporte"}
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
                  Nombre del Transporte
                </label>
                <input
                  type="text"
                  value={formData.nombre_barco}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_barco: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Transporte
                </label>
                <select
                  value={formData.id_tipo_transporte}
                  onChange={(e) =>
                    setFormData({ ...formData, id_tipo_transporte: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposTransporte.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre_tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad de Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capacidad_peso}
                  onChange={(e) =>
                    setFormData({ ...formData, capacidad_peso: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad de Volumen (m³)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capacidad_volumen}
                  onChange={(e) =>
                    setFormData({ ...formData, capacidad_volumen: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Opcional"
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
                  {editingTransporte ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
