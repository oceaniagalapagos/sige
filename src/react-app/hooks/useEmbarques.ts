import { useState, useEffect } from "react";

interface Embarque {
  id: number;
  codigo_embarque: string;
  id_cliente: number;
  estado_actual: string;
  notas: string;
  fecha_completado: string | null;
  created_at: string;
  updated_at: string;
  nombre_cliente?: string;
  email_cliente?: string;
}

export function useEmbarques(estado?: string) {
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmbarques = async () => {
    try {
      setLoading(true);
      const url = estado
        ? `/api/embarques?estado=${encodeURIComponent(estado)}`
        : "/api/embarques";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error al cargar embarques");
      }

      const data = await response.json();
      setEmbarques(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmbarques();
  }, [estado]);

  return { embarques, loading, error, refetch: fetchEmbarques };
}
