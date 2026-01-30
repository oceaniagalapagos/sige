import { useAuth } from "@getmocha/users-service/react";
import { useState, useEffect } from "react";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/usuarios/me");
        if (response.ok) {
          const data = await response.json();
          setRole(data.rol);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user?.id]);

  return { 
    role, 
    loading, 
    isCliente: role === "cliente", 
    isOperador: role === "operador",
    isAdministrador: role === "administrador"
  };
}
