
CREATE TABLE productos_embarque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_embarque INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  peso REAL,
  volumen REAL,
  tipo_contenido TEXT,
  comercializadora TEXT,
  estado_producto TEXT,
  codigo_qr TEXT,
  ubicacion_fisica TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_productos_embarque ON productos_embarque(id_embarque);
CREATE INDEX idx_productos_codigo_qr ON productos_embarque(codigo_qr);
