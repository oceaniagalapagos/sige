
CREATE TABLE embarques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_embarque TEXT NOT NULL UNIQUE,
  id_cliente INTEGER NOT NULL,
  estado_actual TEXT NOT NULL DEFAULT 'Solicitado',
  notas TEXT,
  fecha_completado DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_embarques_codigo ON embarques(codigo_embarque);
CREATE INDEX idx_embarques_cliente ON embarques(id_cliente);
CREATE INDEX idx_embarques_estado ON embarques(estado_actual);
