import { useEffect, useState } from "react";

interface Usuario {
  id: number;
  mocha_user_id: string;
  email: string;
  nombre: string;
  rol: "cliente" | "operador" | "administrador";
  is_activo: boolean;
  created_at: string;
  updated_at: string;
}

export function useCurrentUser() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/usuarios/me")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar usuario");
        return res.json();
      })
      .then((data) => {
        setUsuario(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { usuario, loading, error };
}
