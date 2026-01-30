
CREATE TABLE tipos_productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_tipo TEXT NOT NULL,
  descripcion TEXT,
  requiere_refrigeracion BOOLEAN DEFAULT 0,
  es_peligroso BOOLEAN DEFAULT 0,
  is_activo BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tipos_productos_nombre ON tipos_productos(nombre_tipo);
