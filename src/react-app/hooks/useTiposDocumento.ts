import { useState, useEffect } from "react";

interface TipoDocumento {
  id: number;
  nombre_tipo: string;
  descripcion: string | null;
  is_activo: boolean;
}

export function useTiposDocumento() {
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTiposDocumento = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/tipos-documento");
        if (!response.ok) {
          throw new Error("Error al cargar tipos de documento");
        }
        const data = await response.json();
        setTiposDocumento(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchTiposDocumento();
  }, []);

  return { tiposDocumento, loading, error };
}
