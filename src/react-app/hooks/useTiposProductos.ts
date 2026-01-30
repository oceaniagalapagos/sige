import { useState, useEffect } from "react";

interface TipoProducto {
  id: number;
  nombre_tipo: string;
  descripcion: string | null;
  requiere_refrigeracion: boolean;
  es_peligroso: boolean;
  is_activo: boolean;
  created_at: string;
  updated_at: string;
}

export function useTiposProductos() {
  const [tiposProductos, setTiposProductos] = useState<TipoProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTiposProductos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tipos-productos");

      if (!response.ok) {
        throw new Error("Error al cargar tipos de productos");
      }

      const data = await response.json();
      setTiposProductos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiposProductos();
  }, []);

  return { tiposProductos, loading, error, refetch: fetchTiposProductos };
}
