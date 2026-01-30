
CREATE TABLE calendario_embarques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_embarque DATE NOT NULL,
  id_barco INTEGER NOT NULL,
  tipos_productos_aceptados TEXT,
  cupo_total_peso REAL,
  cupo_total_volumen REAL,
  cupo_utilizado_peso REAL DEFAULT 0,
  cupo_utilizado_volumen REAL DEFAULT 0,
  is_activo BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendario_fecha ON calendario_embarques(fecha_embarque);
CREATE INDEX idx_calendario_barco ON calendario_embarques(id_barco);
