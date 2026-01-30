import Layout from "@/react-app/components/Layout";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  Ship,
  AlertCircle,
  Calendar,
  Scale,
  Box,
} from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface Embarque {
  id: number;
  codigo_embarque: string;
  estado_actual: string;
  nombre_cliente: string;
  created_at: string;
}

interface Stats {
  total: number;
  solicitados: number;
  en_transito: number;
  entregados: number;
}

interface CapacidadCalendario {
  id: number;
  fecha_embarque: string;
  nombre_barco: string;
  destino: string;
  tipo_transporte: string;
  tipos_productos_aceptados: string;
  cupo_total_peso: number;
  cupo_total_volumen: number;
  peso_utilizado: number;
  volumen_utilizado: number;
  porcentaje_peso: number;
  porcentaje_volumen: number;
  por_tipo_producto: Array<{
    tipo_contenido: string;
    total_peso: number;
    total_volumen: number;
  }>;
}

export default function Dashboard() {
  const { usuario } = useCurrentUser();
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    solicitados: 0,
    en_transito: 0,
    entregados: 0,
  });
  const [capacidades, setCapacidades] = useState<CapacidadCalendario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (usuario) {
      fetchData();
    }
  }, [usuario]);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/embarques");
      const data = await response.json();
      setEmbarques(data.slice(0, 10));

      // Stats según rol
      if (usuario?.rol === "cliente") {
        const newStats = {
          total: data.length,
          solicitados: data.filter((e: Embarque) => e.estado_actual === "En proceso")
            .length,
          en_transito: 0,
          entregados: data.filter((e: Embarque) => e.estado_actual === "Entregado")
            .length,
        };
        setStats(newStats);
      } else {
        const newStats = {
          total: data.length,
          solicitados: data.filter(
            (e: Embarque) => e.estado_actual === "Solicitado"
          ).length,
          en_transito: data.filter(
            (e: Embarque) =>
              e.estado_actual === "En Tránsito" ||
              e.estado_actual === "Embarcado" ||
              e.estado_actual === "Retirado" ||
              e.estado_actual === "En Bodega"
          ).length,
          entregados: data.filter(
            (e: Embarque) => e.estado_actual === "Entregado"
          ).length,
        };
        setStats(newStats);

        // Fetch capacity data for admin/operator
        try {
          const capacidadRes = await fetch("/api/calendario/capacidad/resumen");
          const capacidadData = await capacidadRes.json();
          setCapacidades(capacidadData);
        } catch (err) {
          console.error("Error fetching capacity:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      Solicitado: "bg-amber-100 text-amber-800",
      Retirado: "bg-blue-100 text-blue-800",
      "En Bodega": "bg-purple-100 text-purple-800",
      Embarcado: "bg-indigo-100 text-indigo-800",
      "En Tránsito": "bg-orange-100 text-orange-800",
      "En proceso": "bg-blue-100 text-blue-800",
      Entregado: "bg-emerald-100 text-emerald-800",
    };
    return colors[estado] || "bg-gray-100 text-gray-800";
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 70) return "bg-red-500";
    return "bg-emerald-500";
  };

  const getCapacityTextColor = (percentage: number) => {
    if (percentage >= 100) return "text-red-600";
    if (percentage >= 70) return "text-red-600";
    return "text-emerald-600";
  };

  const getCapacityBgColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-50 border-red-200";
    if (percentage >= 70) return "bg-red-50 border-red-200";
    return "bg-emerald-50 border-emerald-200";
  };

  if (loading || !usuario) {
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

  // Dashboard personalizado por rol
  const getDashboardTitle = () => {
    if (usuario.rol === "cliente") return "Mis Embarques";
    if (usuario.rol === "operador") return "Panel de Operaciones";
    return "Panel de Administración";
  };

  const getDashboardDescription = () => {
    if (usuario.rol === "cliente")
      return "Visualiza el estado de tus envíos y documentos";
    if (usuario.rol === "operador")
      return "Gestiona embarques y clientes del sistema";
    return "Gestión completa del sistema de logística";
  };

  const isAdminOrOperador = usuario.rol === "administrador" || usuario.rol === "operador";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            {getDashboardTitle()}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">{getDashboardDescription()}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  {usuario.rol === "cliente"
                    ? "Mis Embarques"
                    : "Total Embarques"}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  {usuario.rol === "cliente" ? "En Proceso" : "Solicitados"}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">
                  {stats.solicitados}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {usuario.rol !== "cliente" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">En Tránsito</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {stats.en_transito}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Entregados</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {stats.entregados}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Counters for Admin/Operator */}
        {isAdminOrOperador && capacidades.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Capacidad de Embarques Programados
              </h2>
              <Link
                to="/calendario"
                className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Ver calendario
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {capacidades.map((cal) => {
                const maxPercentage = Math.max(cal.porcentaje_peso, cal.porcentaje_volumen);
                
                return (
                  <div
                    key={cal.id}
                    className={`rounded-xl border p-4 sm:p-5 ${getCapacityBgColor(maxPercentage)}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          maxPercentage >= 70 ? 'bg-red-100' : 'bg-emerald-100'
                        }`}>
                          <Calendar className={`w-5 h-5 ${
                            maxPercentage >= 70 ? 'text-red-600' : 'text-emerald-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">
                            {cal.nombre_barco}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatDate(cal.fecha_embarque)}
                            {cal.destino && ` → ${cal.destino}`}
                          </p>
                        </div>
                      </div>
                      {maxPercentage >= 100 && (
                        <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
                          LLENO
                        </span>
                      )}
                    </div>

                    {/* Capacity Bars */}
                    <div className="space-y-3">
                      {/* Weight */}
                      <div>
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                          <div className="flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-gray-600">Peso</span>
                          </div>
                          <span className={`font-medium ${getCapacityTextColor(cal.porcentaje_peso)}`}>
                            {cal.peso_utilizado.toFixed(1)} / {cal.cupo_total_peso} kg ({cal.porcentaje_peso}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${getCapacityColor(cal.porcentaje_peso)}`}
                            style={{ width: `${Math.min(cal.porcentaje_peso, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Volume */}
                      <div>
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                          <div className="flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-gray-600">Volumen</span>
                          </div>
                          <span className={`font-medium ${getCapacityTextColor(cal.porcentaje_volumen)}`}>
                            {cal.volumen_utilizado.toFixed(2)} / {cal.cupo_total_volumen} m³ ({cal.porcentaje_volumen}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${getCapacityColor(cal.porcentaje_volumen)}`}
                            style={{ width: `${Math.min(cal.porcentaje_volumen, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Product types breakdown */}
                    {cal.por_tipo_producto && cal.por_tipo_producto.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-2">Por tipo de producto:</p>
                        <div className="space-y-1">
                          {cal.por_tipo_producto.map((producto, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700">{producto.tipo_contenido || "Sin tipo"}</span>
                              <span className="text-gray-500">
                                {producto.total_peso?.toFixed(1) || 0} kg / {producto.total_volumen?.toFixed(2) || 0} m³
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alert if near or at capacity */}
                    {maxPercentage >= 70 && maxPercentage < 100 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-100 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Capacidad por encima del 70%</span>
                      </div>
                    )}
                    {maxPercentage >= 100 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-white bg-red-600 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>No se permiten más productos en este embarque</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Embarques */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                {usuario.rol === "cliente"
                  ? "Mis Embarques Recientes"
                  : "Embarques Recientes"}
              </h2>
              <Link
                to="/embarques"
                className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Ver todos
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {embarques.length === 0 ? (
              <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm sm:text-base text-gray-600">
                  {usuario.rol === "cliente"
                    ? "No tienes embarques registrados"
                    : "No hay embarques registrados"}
                </p>
                {usuario.rol === "cliente" && (
                  <Link
                    to="/embarques"
                    className="mt-3 sm:mt-4 inline-block text-sm sm:text-base text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Solicitar embarque
                  </Link>
                )}
              </div>
            ) : (
              embarques.map((embarque) => (
                <Link
                  key={embarque.id}
                  to={`/embarques/${embarque.id}`}
                  className="block px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {embarque.codigo_embarque}
                        </span>
                        <span
                          className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getEstadoColor(
                            embarque.estado_actual
                          )}`}
                        >
                          {embarque.estado_actual}
                        </span>
                      </div>
                      {usuario.rol !== "cliente" && (
                        <p className="text-xs sm:text-sm text-gray-600">
                          {embarque.nombre_cliente}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm text-gray-500">
                        {formatDate(embarque.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
