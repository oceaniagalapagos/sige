
CREATE TABLE logs_sistema (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario TEXT,
  accion TEXT NOT NULL,
  tabla_afectada TEXT,
  registro_afectado INTEGER,
  detalles TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_usuario ON logs_sistema(id_usuario);
CREATE INDEX idx_logs_fecha ON logs_sistema(created_at);
