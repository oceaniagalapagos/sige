
CREATE TABLE configuracion_costos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_servicio TEXT NOT NULL,
  tipo_transporte TEXT,
  tipo_embalaje TEXT,
  costo_base REAL NOT NULL,
  unidad_medida TEXT NOT NULL,
  descripcion TEXT,
  is_activo BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_config_tipo_servicio ON configuracion_costos(tipo_servicio);
