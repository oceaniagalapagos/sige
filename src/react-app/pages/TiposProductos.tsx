import Layout from "@/react-app/components/Layout";
import { useEffect, useState } from "react";
import { ShoppingBag, Plus, Pencil, Trash2, X } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface TipoProducto {
  id: number;
  nombre_tipo: string;
  descripcion: string;
  requiere_refrigeracion: boolean;
  es_peligroso: boolean;
  is_activo: boolean;
  created_at: string;
  updated_at: string;
}

export default function TiposProductos() {
  const { usuario } = useCurrentUser();
  const [tipos, setTipos] = useState<TipoProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoProducto | null>(null);
  const [formData, setFormData] = useState({
    nombre_tipo: "",
    descripcion: "",
    requiere_refrigeracion: false,
    es_peligroso: false,
  });

  useEffect(() => {
    fetchTipos();
  }, []);

  const fetchTipos = async () => {
    try {
      const response = await fetch("/api/tipos-productos");
      const data = await response.json();
      setTipos(data);
    } catch (error) {
      console.error("Error fetching tipos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTipo
        ? `/api/tipos-productos/${editingTipo.id}`
        : "/api/tipos-productos";
      const method = editingTipo ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTipos();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving tipo:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este tipo de producto?")) return;

    try {
      const response = await fetch(`/api/tipos-productos/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTipos();
      }
    } catch (error) {
      console.error("Error deleting tipo:", error);
    }
  };

  const handleEdit = (tipo: TipoProducto) => {
    setEditingTipo(tipo);
    setFormData({
      nombre_tipo: tipo.nombre_tipo,
      descripcion: tipo.descripcion || "",
      requiere_refrigeracion: tipo.requiere_refrigeracion,
      es_peligroso: tipo.es_peligroso,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTipo(null);
    setFormData({
      nombre_tipo: "",
      descripcion: "",
      requiere_refrigeracion: false,
      es_peligroso: false,
    });
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
              Tipos de Productos
            </h1>
            <p className="text-gray-600">
              Gestiona los tipos de productos aceptados para transporte
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Tipo
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
                    Tipo de Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Características
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tipos.map((tipo) => (
                  <tr key={tipo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
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
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">
                          {tipo.nombre_tipo}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {tipo.descripcion || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {tipo.requiere_refrigeracion && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Refrigeración
                          </span>
                        )}
                        {tipo.es_peligroso && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Peligroso
                          </span>
                        )}
                        {!tipo.requiere_refrigeracion && !tipo.es_peligroso && (
                          <span className="text-gray-500 text-sm">
                            Estándar
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {tipos.length === 0 && !loading && (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  No hay tipos de productos registrados
                </p>
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
                {editingTipo ? "Editar Tipo" : "Nuevo Tipo de Producto"}
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
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requiere_refrigeracion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requiere_refrigeracion: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Requiere refrigeración
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.es_peligroso}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        es_peligroso: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Producto peligroso
                  </span>
                </label>
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
