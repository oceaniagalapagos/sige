-- =====================================================
-- ESQUEMA DE BASE DE DATOS - CARAPACHUS LOGISTIC
-- Sistema de Gestión de Embarques a las Islas Galápagos
-- =====================================================

-- Tabla: usuarios_app
-- Almacena los usuarios del sistema con sus roles
CREATE TABLE usuarios_app (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    mocha_user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'cliente',        -- Roles: 'admin', 'cliente'
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: clientes
-- Información de clientes y destinatarios
CREATE TABLE clientes (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    direccion_destino TEXT,
    whatsapp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: tipos_transporte
-- Catálogo de tipos de transporte (Marítimo, Aéreo, Terrestre)
CREATE TABLE tipos_transporte (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    nombre_tipo TEXT NOT NULL,
    descripcion TEXT,
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: ubicaciones
-- Catálogo de ubicaciones físicas para almacenamiento
CREATE TABLE ubicaciones (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    nombre_ubicacion TEXT NOT NULL,
    descripcion TEXT,
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: puertos
-- Catálogo de puertos de destino en las Galápagos
CREATE TABLE puertos (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    nombre_puerto TEXT NOT NULL,
    isla TEXT NOT NULL,
    id_ubicacion INTEGER,                       -- FK: ubicaciones.id
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: barcos
-- Catálogo de barcos/vehículos de transporte
CREATE TABLE barcos (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    nombre_barco TEXT NOT NULL,
    capacidad_peso REAL,
    capacidad_volumen REAL,
    id_tipo_transporte INTEGER,                 -- FK: tipos_transporte.id
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: calendario_embarques
-- Calendario de fechas de embarque programadas
CREATE TABLE calendario_embarques (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    fecha_embarque DATE NOT NULL,
    id_barco INTEGER NOT NULL,                  -- FK: barcos.id
    id_puerto_destino INTEGER,                  -- FK: puertos.id
    fecha_arribo_puerto DATE,
    tipo_transporte TEXT DEFAULT 'Marítimo',
    tipos_productos_aceptados TEXT,
    cupo_total_peso REAL,
    cupo_total_volumen REAL,
    cupo_utilizado_peso REAL DEFAULT 0,
    cupo_utilizado_volumen REAL DEFAULT 0,
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: embarques
-- Registro principal de embarques
CREATE TABLE embarques (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    codigo_embarque TEXT NOT NULL UNIQUE,
    id_cliente INTEGER NOT NULL,                -- FK: clientes.id
    id_usuario_cliente TEXT,                    -- FK: usuarios_app.mocha_user_id
    estado_actual TEXT NOT NULL DEFAULT 'Solicitado',  -- Estados: Solicitado, En Preparación, Documentado, etc.
    notas TEXT,
    fecha_completado DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: tipos_productos
-- Catálogo de tipos de productos
CREATE TABLE tipos_productos (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    nombre_tipo TEXT NOT NULL,
    descripcion TEXT,
    requiere_refrigeracion BOOLEAN DEFAULT 0,
    es_peligroso BOOLEAN DEFAULT 0,
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: productos_embarque
-- Productos/paquetes asociados a cada embarque
CREATE TABLE productos_embarque (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    id_embarque INTEGER NOT NULL,               -- FK: embarques.id
    id_calendario_embarque INTEGER,             -- FK: calendario_embarques.id
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

-- Tabla: tipos_documento
-- Catálogo de tipos de documentos
CREATE TABLE tipos_documento (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    nombre_tipo TEXT NOT NULL,
    descripcion TEXT,
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: documentos
-- Documentos adjuntos a embarques
CREATE TABLE documentos (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    id_embarque INTEGER NOT NULL,               -- FK: embarques.id
    tipo_documento TEXT NOT NULL,
    archivo_url TEXT NOT NULL,
    nombre_archivo TEXT NOT NULL,
    estado_embarque_al_cargar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: tipos_servicio
-- Catálogo de tipos de servicios
CREATE TABLE tipos_servicio (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    nombre_tipo TEXT NOT NULL,
    descripcion TEXT,
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: tipos_embalaje
-- Catálogo de tipos de embalaje
CREATE TABLE tipos_embalaje (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    nombre_tipo TEXT NOT NULL,
    descripcion TEXT,
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: configuracion_costos
-- Configuración de costos de servicios
CREATE TABLE configuracion_costos (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    tipo_servicio TEXT NOT NULL,
    tipo_transporte TEXT,
    tipo_embalaje TEXT,
    costo_base REAL NOT NULL,
    unidad_medida TEXT NOT NULL,               -- kg, m³, unidad, etc.
    descripcion TEXT,
    is_activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: embarques_servicios
-- Servicios aplicados a cada embarque
CREATE TABLE embarques_servicios (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    id_embarque INTEGER NOT NULL,               -- FK: embarques.id
    id_servicio INTEGER NOT NULL,               -- FK: configuracion_costos.id
    cantidad REAL NOT NULL DEFAULT 1,
    costo_unitario REAL NOT NULL,
    costo_total REAL NOT NULL,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: logs_sistema
-- Registro de auditoría del sistema
CREATE TABLE logs_sistema (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    id_usuario TEXT,                            -- FK: usuarios_app.mocha_user_id
    accion TEXT NOT NULL,
    tabla_afectada TEXT,
    registro_afectado INTEGER,
    detalles TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- RELACIONES ENTRE TABLAS (Foreign Keys)
-- =====================================================
-- 
-- usuarios_app.mocha_user_id → Sistema de autenticación Mocha
-- 
-- clientes.id → embarques.id_cliente
-- 
-- usuarios_app.mocha_user_id → embarques.id_usuario_cliente
-- 
-- barcos.id_tipo_transporte → tipos_transporte.id
-- 
-- puertos.id_ubicacion → ubicaciones.id
-- 
-- calendario_embarques.id_barco → barcos.id
-- calendario_embarques.id_puerto_destino → puertos.id
-- 
-- embarques.id_cliente → clientes.id
-- embarques.id_usuario_cliente → usuarios_app.mocha_user_id
-- 
-- productos_embarque.id_embarque → embarques.id
-- productos_embarque.id_calendario_embarque → calendario_embarques.id
-- 
-- documentos.id_embarque → embarques.id
-- 
-- embarques_servicios.id_embarque → embarques.id
-- embarques_servicios.id_servicio → configuracion_costos.id
-- 
-- logs_sistema.id_usuario → usuarios_app.mocha_user_id
-- 
-- =====================================================
-- FLUJO PRINCIPAL DEL SISTEMA
-- =====================================================
-- 
-- 1. Un usuario_app (cliente o admin) crea un embarque
-- 2. El embarque se asocia con un cliente
-- 3. Se agregan productos_embarque al embarque
-- 4. Se asigna el embarque a un calendario_embarques
-- 5. Se cargan documentos relacionados al embarque
-- 6. Se aplican servicios y se calculan costos en embarques_servicios
-- 7. El embarque transita por diferentes estados hasta completarse
-- 8. Todas las acciones se registran en logs_sistema
-- 
-- =====================================================
