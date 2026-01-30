import Layout from "@/react-app/components/Layout";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  Settings, 
  DollarSign, 
  Plus, 
  X, 
  Trash2, 
  Truck, 
  Briefcase, 
  Box, 
  ShoppingBag,
  ArrowRight,
  Globe,
  Edit2,
  FileText
} from "lucide-react";

interface ConfigCosto {
  id: number;
  tipo_servicio: string;
  tipo_transporte: string;
  tipo_embalaje: string;
  costo_base: number;
  unidad_medida: string;
  descripcion: string;
  is_activo: boolean;
}

interface EditingCosto extends ConfigCosto {}

interface TipoOption {
  id: number;
  nombre_tipo: string;
  descripcion: string;
}

type TabType = "ubicaciones" | "transportes" | "servicios" | "embalajes" | "productos" | "documentos" | "costos";
type GroupType = "logistica" | "servicios-embalaje" | "costos-documentos";

export default function Configuracion() {
  const [activeGroup, setActiveGroup] = useState<GroupType>("logistica");
  const [activeTab, setActiveTab] = useState<TabType>("ubicaciones");
  const [costos, setCostos] = useState<ConfigCosto[]>([]);
  const [tiposServicio, setTiposServicio] = useState<TipoOption[]>([]);
  const [tiposTransporte, setTiposTransporte] = useState<TipoOption[]>([]);
  const [tiposEmbalaje, setTiposEmbalaje] = useState<TipoOption[]>([]);
  const [tiposProductos, setTiposProductos] = useState<TipoOption[]>([]);
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoOption[]>([]);
  const [ubicaciones, setUbicaciones] = useState<TipoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCostoModal, setShowCostoModal] = useState(false);
  const [editingCosto, setEditingCosto] = useState<EditingCosto | null>(null);

  const [costoForm, setCostoForm] = useState({
    tipo_servicio: "",
    tipo_transporte: "",
    tipo_embalaje: "",
    costo_base: "",
    unidad_medida: "",
    descripcion: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [costosRes, tiposServicioRes, tiposTransporteRes, tiposEmbalajeRes, tiposProductosRes, tiposDocumentosRes, ubicacionesRes] = await Promise.all([
        fetch("/api/configuracion"),
        fetch("/api/tipos-servicio"),
        fetch("/api/tipos-transporte"),
        fetch("/api/tipos-embalaje"),
        fetch("/api/tipos-productos"),
        fetch("/api/tipos-documento"),
        fetch("/api/ubicaciones"),
      ]);

      const costosData = await costosRes.json();
      const tiposServicioData = await tiposServicioRes.json();
      const tiposTransporteData = await tiposTransporteRes.json();
      const tiposEmbalajeData = await tiposEmbalajeRes.json();
      const tiposProductosData = await tiposProductosRes.json();
      const tiposDocumentosData = await tiposDocumentosRes.json();
      const ubicacionesData = await ubicacionesRes.json();

      setCostos(costosData);
      setTiposServicio(tiposServicioData);
      setTiposTransporte(tiposTransporteData);
      setTiposEmbalaje(tiposEmbalajeData);
      setTiposProductos(tiposProductosData);
      setTiposDocumentos(tiposDocumentosData);
      setUbicaciones(ubicacionesData.map((u: any) => ({ id: u.id, nombre_tipo: u.nombre_ubicacion, descripcion: u.descripcion })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCostoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCosto 
        ? `/api/configuracion/${editingCosto.id}`
        : "/api/configuracion";
      const method = editingCosto ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...costoForm,
          costo_base: parseFloat(costoForm.costo_base),
        }),
      });

      if (response.ok) {
        handleCloseCostoModal();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving costo:", error);
    }
  };

  const handleEditCosto = (costo: ConfigCosto) => {
    setEditingCosto(costo);
    setCostoForm({
      tipo_servicio: costo.tipo_servicio,
      tipo_transporte: costo.tipo_transporte || "",
      tipo_embalaje: costo.tipo_embalaje || "",
      costo_base: costo.costo_base.toString(),
      unidad_medida: costo.unidad_medida,
      descripcion: costo.descripcion || "",
    });
    setShowCostoModal(true);
  };

  const handleCloseCostoModal = () => {
    setShowCostoModal(false);
    setEditingCosto(null);
    setCostoForm({
      tipo_servicio: "",
      tipo_transporte: "",
      tipo_embalaje: "",
      costo_base: "",
      unidad_medida: "",
      descripcion: "",
    });
  };

  const handleDeleteCosto = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta configuración?")) return;

    try {
      const response = await fetch(`/api/configuracion/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting costo:", error);
    }
  };

  const groups = [
    { 
      id: "logistica" as GroupType, 
      label: "Logística y Ubicaciones",
      tabs: [
        { id: "ubicaciones" as TabType, label: "Ubicaciones", icon: Globe },
        { id: "transportes" as TabType, label: "Transportes", icon: Truck },
      ]
    },
    { 
      id: "servicios-embalaje" as GroupType, 
      label: "Servicios y Embalaje",
      tabs: [
        { id: "servicios" as TabType, label: "Tipos de Servicio", icon: Briefcase },
        { id: "embalajes" as TabType, label: "Tipos de Embalaje", icon: Box },
        { id: "productos" as TabType, label: "Tipos de Productos", icon: ShoppingBag },
      ]
    },
    { 
      id: "costos-documentos" as GroupType, 
      label: "Costos y Documentos",
      tabs: [
        { id: "costos" as TabType, label: "Configuración de Costos", icon: DollarSign },
        { id: "documentos" as TabType, label: "Tipos de Documento", icon: FileText },
      ]
    },
  ];

  const handleGroupChange = (groupId: GroupType) => {
    setActiveGroup(groupId);
    const group = groups.find(g => g.id === groupId);
    if (group && group.tabs.length > 0) {
      setActiveTab(group.tabs[0].id);
    }
  };

  const activeGroupData = groups.find(g => g.id === activeGroup);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin">
            <Settings className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </Layout>
    );
  }

  const renderCategoryContent = (
    title: string,
    description: string,
    icon: React.ReactNode,
    items: TipoOption[],
    navigateTo: string,
    buttonLabel: string,
    color: string
  ) => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-gray-600">{description}</p>
            </div>
          </div>
          <Link
            to={navigateTo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            {buttonLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Preview of existing items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Registros existentes ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay registros. Haz clic en el botón de arriba para agregar.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <h4 className="font-medium text-gray-900">{item.nombre_tipo}</h4>
                {item.descripcion && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {item.descripcion}
                  </p>
                )}
              </div>
            ))}
            {items.length > 6 && (
              <Link
                to={navigateTo}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Ver todos ({items.length})
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuración
          </h1>
          <p className="text-gray-600">
            Gestión de tipos de transporte, servicios, embalajes, productos y tarifas
          </p>
        </div>

        {/* Two-level Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          {/* Level 1: Groups */}
          <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupChange(group.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeGroup === group.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          {/* Level 2: Tabs within group */}
          <div className="p-2">
            <div className="flex flex-wrap gap-1">
              {activeGroupData?.tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.replace('Tipos de ', '')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {/* Ubicaciones Tab */}
          {activeTab === "ubicaciones" &&
            renderCategoryContent(
              "Ubicaciones",
              "Gestiona las ubicaciones geográficas y sus destinos asociados",
              <Globe className="w-7 h-7 text-teal-600" />,
              ubicaciones,
              "/ubicaciones",
              "Gestionar Ubicaciones",
              "bg-teal-100"
            )}

          {/* Transportes Tab */}
          {activeTab === "transportes" &&
            renderCategoryContent(
              "Tipos de Transporte",
              "Gestiona los diferentes tipos de transporte disponibles",
              <Truck className="w-7 h-7 text-blue-600" />,
              tiposTransporte,
              "/tipos-transporte",
              "Tipos de Transporte",
              "bg-blue-100"
            )}

          {/* Servicios Tab */}
          {activeTab === "servicios" &&
            renderCategoryContent(
              "Tipos de Servicio",
              "Gestiona los diferentes tipos de servicio ofrecidos",
              <Briefcase className="w-7 h-7 text-purple-600" />,
              tiposServicio,
              "/tipos-servicio",
              "Tipos de Servicio",
              "bg-purple-100"
            )}

          {/* Embalajes Tab */}
          {activeTab === "embalajes" &&
            renderCategoryContent(
              "Tipos de Embalaje",
              "Gestiona los diferentes tipos de embalaje disponibles",
              <Box className="w-7 h-7 text-amber-600" />,
              tiposEmbalaje,
              "/tipos-embalaje",
              "Tipos de Embalaje",
              "bg-amber-100"
            )}

          {/* Productos Tab */}
          {activeTab === "productos" &&
            renderCategoryContent(
              "Tipos de Productos",
              "Gestiona las categorías de productos",
              <ShoppingBag className="w-7 h-7 text-emerald-600" />,
              tiposProductos,
              "/tipos-productos",
              "Tipos de Productos",
              "bg-emerald-100"
            )}

          {/* Documentos Tab */}
          {activeTab === "documentos" &&
            renderCategoryContent(
              "Tipos de Documento",
              "Gestiona los tipos de documento para embarques",
              <FileText className="w-7 h-7 text-rose-600" />,
              tiposDocumentos,
              "/tipos-documento",
              "Tipos de Documento",
              "bg-rose-100"
            )}

          {/* Costos Tab */}
          {activeTab === "costos" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Configuración de Costos
                </h2>
                <button
                  onClick={() => setShowCostoModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nueva Configuración
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Acciones
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Servicio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Transporte
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Embalaje
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Costo Base
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Unidad
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {costos.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 mb-4">
                              No hay configuraciones de costos
                            </p>
                            <button
                              onClick={() => setShowCostoModal(true)}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Crear primera configuración
                            </button>
                          </td>
                        </tr>
                      ) : (
                        costos.map((costo) => (
                          <tr key={costo.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditCosto(costo)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCosto(costo.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {costo.tipo_servicio}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {costo.tipo_transporte || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {costo.tipo_embalaje || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              ${costo.costo_base.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {costo.unidad_medida}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Costo Modal */}
      {showCostoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCosto ? "Editar Configuración de Costo" : "Nueva Configuración de Costo"}
              </h2>
              <button
                onClick={handleCloseCostoModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCostoSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Servicio *
                </label>
                <select
                  required
                  value={costoForm.tipo_servicio}
                  onChange={(e) =>
                    setCostoForm({ ...costoForm, tipo_servicio: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  {tiposServicio.map((tipo) => (
                    <option key={tipo.id} value={tipo.nombre_tipo}>
                      {tipo.nombre_tipo}
                    </option>
                  ))}
                </select>
                {tiposServicio.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No hay tipos de servicio. Créalos en la pestaña Tipos de Servicio.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Transporte
                </label>
                <select
                  value={costoForm.tipo_transporte}
                  onChange={(e) =>
                    setCostoForm({
                      ...costoForm,
                      tipo_transporte: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  {tiposTransporte.map((tipo) => (
                    <option key={tipo.id} value={tipo.nombre_tipo}>
                      {tipo.nombre_tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Embalaje
                </label>
                <select
                  value={costoForm.tipo_embalaje}
                  onChange={(e) =>
                    setCostoForm({ ...costoForm, tipo_embalaje: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  {tiposEmbalaje.map((tipo) => (
                    <option key={tipo.id} value={tipo.nombre_tipo}>
                      {tipo.nombre_tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Base ($) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={costoForm.costo_base}
                  onChange={(e) =>
                    setCostoForm({ ...costoForm, costo_base: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad de Medida *
                </label>
                <select
                  required
                  value={costoForm.unidad_medida}
                  onChange={(e) =>
                    setCostoForm({ ...costoForm, unidad_medida: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="m3">Metro cúbico (m³)</option>
                  <option value="unidad">Unidad</option>
                  <option value="fijo">Fijo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={costoForm.descripcion}
                  onChange={(e) =>
                    setCostoForm({ ...costoForm, descripcion: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseCostoModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCosto ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
