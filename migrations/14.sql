
CREATE TABLE embarques_servicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_embarque INTEGER NOT NULL,
  id_servicio INTEGER NOT NULL,
  cantidad REAL NOT NULL DEFAULT 1,
  costo_unitario REAL NOT NULL,
  costo_total REAL NOT NULL,
  notas TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_embarques_servicios_embarque ON embarques_servicios(id_embarque);
