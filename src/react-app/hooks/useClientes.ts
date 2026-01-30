import { useState, useEffect } from "react";

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  direccion_destino: string | null;
  whatsapp: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clientes");

      if (!response.ok) {
        throw new Error("Error al cargar clientes");
      }

      const data = await response.json();
      setClientes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return { clientes, loading, error, refetch: fetchClientes };
}
