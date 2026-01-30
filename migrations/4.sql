
CREATE TABLE documentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_embarque INTEGER NOT NULL,
  tipo_documento TEXT NOT NULL,
  archivo_url TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  estado_embarque_al_cargar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documentos_embarque ON documentos(id_embarque);
