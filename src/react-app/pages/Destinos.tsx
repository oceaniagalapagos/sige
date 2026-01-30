import Layout from "@/react-app/components/Layout";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MapPin, Plus, Pencil, Trash2, X, Globe, ArrowLeft } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface Ubicacion {
  id: number;
  nombre_ubicacion: string;
}

interface Destino {
  id: number;
  nombre_destino: string;
  id_ubicacion: number | null;
  nombre_ubicacion: string | null;
  is_activo: boolean;
  created_at: string;
  updated_at: string;
}

export default function Destinos() {
  const { usuario } = useCurrentUser();
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDestino, setEditingDestino] = useState<Destino | null>(null);
  const [formData, setFormData] = useState({
    nombre_destino: "",
    id_ubicacion: "",
  });

  useEffect(() => {
    fetchDestinos();
    fetchUbicaciones();
  }, []);

  const fetchDestinos = async () => {
    try {
      const response = await fetch("/api/destinos");
      const data = await response.json();
      setDestinos(data);
    } catch (error) {
      console.error("Error fetching destinos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUbicaciones = async () => {
    try {
      const response = await fetch("/api/ubicaciones");
      const data = await response.json();
      setUbicaciones(data);
    } catch (error) {
      console.error("Error fetching ubicaciones:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingDestino
        ? `/api/destinos/${editingDestino.id}`
        : "/api/destinos";
      const method = editingDestino ? "PATCH" : "POST";

      const payload: any = {
        nombre_destino: formData.nombre_destino,
      };

      if (formData.id_ubicacion) {
        payload.id_ubicacion = parseInt(formData.id_ubicacion);
      } else if (editingDestino) {
        payload.id_ubicacion = null;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchDestinos();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving destino:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este destino?")) return;

    try {
      const response = await fetch(`/api/destinos/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchDestinos();
      }
    } catch (error) {
      console.error("Error deleting destino:", error);
    }
  };

  const handleEdit = (destino: Destino) => {
    setEditingDestino(destino);
    setFormData({
      nombre_destino: destino.nombre_destino,
      id_ubicacion: destino.id_ubicacion?.toString() || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDestino(null);
    setFormData({ nombre_destino: "", id_ubicacion: "" });
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
              Destinos
            </h1>
            <p className="text-gray-600">
              Gestiona los destinos disponibles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/ubicaciones"
              className="flex items-center gap-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <Globe className="w-5 h-5" />
              Ver Ubicaciones
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Destino
            </button>
          </div>
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
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {destinos.map((destino) => (
                  <tr key={destino.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(destino)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(destino.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">
                          {destino.nombre_destino}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {destino.nombre_ubicacion ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">
                          <Globe className="w-3 h-3" />
                          {destino.nombre_ubicacion}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin asignar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {destinos.length === 0 && !loading && (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No hay destinos registrados</p>
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
                {editingDestino ? "Editar Destino" : "Nuevo Destino"}
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
                  Nombre del Destino
                </label>
                <input
                  type="text"
                  value={formData.nombre_destino}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_destino: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <select
                  value={formData.id_ubicacion}
                  onChange={(e) =>
                    setFormData({ ...formData, id_ubicacion: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin asignar</option>
                  {ubicaciones.map((ubicacion) => (
                    <option key={ubicacion.id} value={ubicacion.id}>
                      {ubicacion.nombre_ubicacion}
                    </option>
                  ))}
                </select>
                {ubicaciones.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No hay ubicaciones disponibles. Créalas primero en Configuración → Ubicaciones.
                  </p>
                )}
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
                  {editingDestino ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
