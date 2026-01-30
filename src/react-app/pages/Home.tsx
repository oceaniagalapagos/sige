import { useAuth } from "@getmocha/users-service/react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Package, Calendar, Settings } from "lucide-react";

export default function Home() {
  const { user, redirectToLogin, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isPending) {
      navigate("/dashboard");
    }
  }, [user, isPending, navigate]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700">
        <div className="animate-pulse">
          <img 
            src="https://019b3aba-9218-7379-898e-b7b8fbf96367.mochausercontent.com/Logo-CarapachusLogistic2.png" 
            alt="Loading" 
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-16">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <img 
                src="https://019b3aba-9218-7379-898e-b7b8fbf96367.mochausercontent.com/Logo-CarapachusLogistic2.png" 
                alt="Carapachus Logistic" 
                className="h-20 sm:h-32 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))' }}
              />
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-3 sm:mb-4 px-4">
              Carapachus Logistic
            </h1>
            <p className="text-base sm:text-xl text-emerald-100 mb-4 sm:mb-8 font-light px-4">
              Envíos seguros, Logística y Simplificado
            </p>
            <p className="text-sm sm:text-lg text-white/90 mb-6 sm:mb-10 max-w-2xl mx-auto px-4">
              Sistema integral de gestión de entregas a las Islas Galápagos
            </p>
            <button
              onClick={redirectToLogin}
              className="px-6 sm:px-10 py-3 sm:py-4 bg-white text-emerald-700 rounded-lg font-bold text-base sm:text-lg hover:bg-emerald-50 transition-all shadow-2xl hover:shadow-emerald-900/50 transform hover:-translate-y-1 hover:scale-105"
            >
              Iniciar Sesión con Google
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-16 px-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500/30 rounded-xl flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-sm border border-emerald-300/30">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                Gestión de Embarques
              </h3>
              <p className="text-sm sm:text-base text-emerald-50 leading-relaxed">
                Control completo del ciclo de vida de cada embarque con códigos
                únicos y seguimiento en tiempo real
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/30 rounded-xl flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-sm border border-blue-300/30">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                Calendario de Envíos
              </h3>
              <p className="text-sm sm:text-base text-emerald-50 leading-relaxed">
                Planificación de embarques marítimos y aéreos con control de
                cupos y capacidad
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 transition-all sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-500/30 rounded-xl flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-sm border border-teal-300/30">
                <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                Configuración Flexible
              </h3>
              <p className="text-sm sm:text-base text-emerald-50 leading-relaxed">
                Administración de costos, servicios, barcos y rutas según las
                necesidades del negocio
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
