import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import DashboardPage from "@/react-app/pages/Dashboard";
import EmbarquesPage from "@/react-app/pages/Embarques";
import EmbarqueDetailPage from "@/react-app/pages/EmbarqueDetail";
import ClientesPage from "@/react-app/pages/Clientes";
import CalendarioPage from "@/react-app/pages/Calendario";
import ConfiguracionPage from "@/react-app/pages/Configuracion";
import DestinosPage from "@/react-app/pages/Destinos";
import TiposProductosPage from "@/react-app/pages/TiposProductos";
import TransportesPage from "@/react-app/pages/Transportes";
import TiposTransportePage from "@/react-app/pages/TiposTransporte";
import TiposServicioPage from "@/react-app/pages/TiposServicio";
import TiposEmbalajePage from "@/react-app/pages/TiposEmbalaje";
import TiposDocumentoPage from "@/react-app/pages/TiposDocumento";
import UbicacionesPage from "@/react-app/pages/Ubicaciones";
import UsuariosPage from "@/react-app/pages/Usuarios";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthCallbackPage />} />
          <Route
            path="/dashboard"
            element={
              <DashboardPage />
            }
          />
          <Route
            path="/embarques"
            element={
              <ProtectedRoute>
                <EmbarquesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/embarques/:id"
            element={
              <ProtectedRoute>
                <EmbarqueDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <ClientesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario"
            element={
              <ProtectedRoute>
                <CalendarioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute>
                <ConfiguracionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/destinos"
            element={
              <ProtectedRoute>
                <DestinosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tipos-productos"
            element={
              <ProtectedRoute>
                <TiposProductosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transportes"
            element={
              <ProtectedRoute>
                <TransportesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tipos-transporte"
            element={
              <ProtectedRoute>
                <TiposTransportePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tipos-servicio"
            element={
              <ProtectedRoute>
                <TiposServicioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tipos-embalaje"
            element={
              <ProtectedRoute>
                <TiposEmbalajePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tipos-documento"
            element={
              <ProtectedRoute>
                <TiposDocumentoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ubicaciones"
            element={
              <ProtectedRoute>
                <UbicacionesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
