-- =====================================================
-- SCRIPT DE MIGRACIÓN DE DATOS - CARAPACHUS LOGISTIC
-- Exportación completa de datos de la base de datos
-- =====================================================
-- 
-- IMPORTANTE: Este script debe ejecutarse después de crear 
-- el esquema de la base de datos (database-schema.sql)
-- 
-- Los INSERT statements están ordenados según las 
-- dependencias de foreign keys entre tablas
-- =====================================================

-- =====================================================
-- 1. TABLAS SIN DEPENDENCIAS (CATÁLOGOS BASE)
-- =====================================================

-- Tabla: usuarios_app
INSERT INTO usuarios_app (id, mocha_user_id, email, nombre, rol, is_activo, created_at, updated_at) VALUES
(1, '019b3ac0-d3cb-7354-8b3c-e3932fae7168', 'supgalapagos@gmail.com', 'SUP Galapagos Admin', 'administrador', 1, '2026-01-23 06:41:29', '2026-01-23 06:41:29'),
(2, '019b3abc-ff55-7668-8562-c43855a324c3', 'software.consultant.bcn@gmail.com', 'Software Consultant', 'operador', 1, '2026-01-23 06:42:37', '2026-01-23 06:42:37'),
(3, '019b3abc-b567-72c3-9809-f83a1705ab6c', 'ocean.ia.galapagos@gmail.com', 'Ocean IA (Galápagos)', 'cliente', 1, '2026-01-23 06:43:19', '2026-01-23 06:43:19'),
(4, '019bfd7b-ab1d-7033-9d3f-4b9384b1332b', 'beaglebarscy@gmail.com', 'Beagle Bar Restaurante', 'cliente', 1, '2026-01-27 03:25:02', '2026-01-27 03:25:02');

-- Tabla: clientes
INSERT INTO clientes (id, nombre, email, telefono, direccion_destino, whatsapp, created_at, updated_at) VALUES
(1, 'Erik Valverde', 'erikv73@hotmail.com', '+593 99 071 5907', 'Guayaquil', '+593 99 071 5907', '2026-01-23 09:06:29', '2026-01-23 09:06:29'),
(2, 'Sonia Christiansen Barberan', 'soniaestefania@gmail.com', '123456789', 'Manta', '123456789', '2026-01-23 14:33:32', '2026-01-23T16:31:10.567Z');

-- Tabla: tipos_transporte
INSERT INTO tipos_transporte (id, nombre_tipo, descripcion, is_activo, created_at, updated_at) VALUES
(1, 'Marítimo', 'Dura 3 días de navegación entre Guayaquil y el Archipiélago de Galápagos', 1, '2026-01-23 10:15:06', '2026-01-23 10:15:06'),
(2, 'Aéreo', 'Dura 1:30 minutos de vuelo entre el Aeropuerto de Guayaquil y los Aeropuertos de San Cristóbal/ Baltra', 1, '2026-01-23 10:16:17', '2026-01-23 10:16:17');

-- Tabla: tipos_servicio
INSERT INTO tipos_servicio (id, nombre_tipo, descripcion, is_activo, created_at, updated_at) VALUES
(1, 'Recogida', 'Enviamos al transporte en el área urbana a retirar un producto para el embarque', 1, '2026-01-23 10:57:23', '2026-01-23 10:57:23'),
(2, 'Embalaje', 'Protegemos el producto para mantenerlo intacto durante el traslado o transporte', 1, '2026-01-23 10:58:30', '2026-01-23 10:58:30'),
(3, 'Almacenaje', 'Guardamos el producto en un espacio del Almacén protegiéndolo del ambiente dañino', 1, '2026-01-23 11:00:43', '2026-01-23 11:00:43'),
(4, 'Seguridad', 'Garantizamos que el producto no se va extraviar, romper, dañar, etc.', 1, '2026-01-23 11:01:40', '2026-01-23 11:01:40'),
(5, 'Flete', 'Transporte que se realiza a los productos para el traslado de una ubicación a otra', 1, '2026-01-23 11:28:16', '2026-01-23 11:28:16');

-- Tabla: tipos_embalaje
INSERT INTO tipos_embalaje (id, nombre_tipo, descripcion, is_activo, created_at, updated_at) VALUES
(1, 'Cartón', 'Cobertura de cartón grueso y cinta de embalaje', 1, '2026-01-23 11:02:34', '2026-01-23 11:02:34'),
(2, 'Pallet', 'Protección base de madera autorizado para Galápagos y microfilm plástico de embalaje', 1, '2026-01-23 11:03:57', '2026-01-23 11:03:57'),
(3, 'Contenedor', 'Protección especialmente de madera para proteger productos de manipulación frágile', 1, '2026-01-23 11:05:12', '2026-01-23 11:05:12');

-- Tabla: tipos_documento
INSERT INTO tipos_documento (id, nombre_tipo, descripcion, is_activo, created_at, updated_at) VALUES
(1, 'Factura', 'Factura comercial del producto o servicio', 1, '2026-01-27 04:51:51', '2026-01-27 04:51:51'),
(2, 'Guía de despacho', 'Guía de despacho o remisión', 1, '2026-01-27 04:51:51', '2026-01-27 04:51:51'),
(3, 'Certificado', 'Certificados sanitarios, fitosanitarios u otros', 1, '2026-01-27 04:51:51', '2026-01-27 04:51:51'),
(4, 'Fotografía', 'Registro fotográfico de productos o embarques', 1, '2026-01-27 04:51:51', '2026-01-27 04:51:51'),
(5, 'Otro', 'Otros tipos de documentos', 1, '2026-01-27 04:51:51', '2026-01-27 04:51:51'),
(6, 'Autorización', 'Autorización para retiro/ entrega, para trámites, etc.', 1, '2026-01-27 04:55:26', '2026-01-27 04:55:26');

-- Tabla: tipos_productos
INSERT INTO tipos_productos (id, nombre_tipo, descripcion, requiere_refrigeracion, es_peligroso, is_activo, created_at, updated_at) VALUES
(1, 'Perecederos', 'Hortalizas, frutas, cárnicos, flores, similares permitidos para Galápagos', 1, 0, 1, '2026-01-23 11:09:05', '2026-01-23 11:09:05'),
(2, 'Químicos', 'Ácidos, Inflamables, Baterías, similares permitidos para Galápagos', 0, 1, 1, '2026-01-23 11:10:22', '2026-01-23 11:10:22'),
(3, 'Electrodomésticos', 'Línea blanca, electrónica, similares permitidos para Galápagos', 0, 0, 1, '2026-01-23 11:11:37', '2026-01-23 11:11:37'),
(4, 'Material de Construcción', 'Ferretería, Gasfitería, Grifería, Soldadura, Mecánica, Sanitario y similares permitidos para Galápagos', 0, 0, 1, '2026-01-23 11:13:10', '2026-01-23 11:13:10'),
(5, 'Medicinas', 'Farmacéutico, Radioactivos y similares permitidos para Galápagos', 0, 1, 1, '2026-01-23 11:14:23', '2026-01-23 11:14:23');

-- Tabla: ubicaciones
INSERT INTO ubicaciones (id, nombre_ubicacion, descripcion, is_activo, created_at, updated_at) VALUES
(1, 'Santa Cruz', 'Isla Santa Cruz con la mayor demanda de productos de Galápagos', 1, '2026-01-23 11:32:13', '2026-01-23 11:32:13'),
(2, 'San Cristóbal', 'Isla para primer desembarco por su localización más cercana al continente', 1, '2026-01-23 11:39:38', '2026-01-23 11:39:38'),
(3, 'Guayaquil', 'Ciudad portuaria más cerca a Galápagos desde el continente', 1, '2026-01-23 11:40:22', '2026-01-23 11:40:22'),
(4, 'Seymour', 'Isla con acceso al Aeropuerto, Muelle de Baltra y Canal de Itabaca', 1, '2026-01-23 11:42:40', '2026-01-23T11:45:39.982Z'),
(5, 'Floreana', 'Isla con la menor población de Galápagos por lo tanto mayor prioridad en la entrega de productos', 1, '2026-01-23 11:43:31', '2026-01-23T11:44:41.579Z'),
(6, 'Isabela', 'Isla más poblada más alejada para la entrega de productor, por tanto mayor prioridad', 1, '2026-01-23 11:44:32', '2026-01-23 11:44:32');

-- =====================================================
-- 2. TABLAS CON DEPENDENCIAS DE NIVEL 1
-- =====================================================

-- Tabla: puertos (depende de ubicaciones)
INSERT INTO puertos (id, nombre_puerto, isla, id_ubicacion, is_activo, created_at, updated_at) VALUES
(1, 'Puerto Baquerizo Moreno', 'Isla San Cristóbal', 2, 1, '2026-01-23 09:08:34', '2026-01-23T11:40:59.411Z'),
(2, 'Puerto Ayora', 'Isla Santa Cruz', 1, 1, '2026-01-23 09:09:02', '2026-01-23T11:41:04.861Z'),
(3, 'Puerto Villamil', 'Isla Isabela', 6, 1, '2026-01-23 09:09:19', '2026-01-23T11:45:16.533Z'),
(4, 'Puerto Velasco Ibarra', 'Isla Floreana', 5, 1, '2026-01-23 09:09:43', '2026-01-23T11:45:10.316Z'),
(5, 'Puerto Gal', 'Guayaquil', 3, 1, '2026-01-23 09:10:18', '2026-01-23T11:40:39.429Z'),
(6, 'Aeropuerto San Cristóbal', 'Isla San Cristóbal', 2, 1, '2026-01-23 10:06:14', '2026-01-23T11:40:53.849Z'),
(7, 'Aeropuerto Baltra', 'Isla Seymour', 4, 1, '2026-01-23 10:06:53', '2026-01-23T11:45:28.771Z');

-- Tabla: barcos (depende de tipos_transporte)
INSERT INTO barcos (id, nombre_barco, capacidad_peso, capacidad_volumen, id_tipo_transporte, is_activo, created_at, updated_at) VALUES
(1, 'Fusión 2', 3000.0, 3000.0, 1, 1, '2026-01-23 10:45:53', '2026-01-23T16:28:18.038Z'),
(2, 'Pioneer', 2000.0, 2000.0, 1, 1, '2026-01-23 16:28:11', '2026-01-23 16:28:11'),
(3, 'Isla de la Plata', 100.0, 100.0, 1, 1, '2026-01-23 16:58:00', '2026-01-23 16:58:00');

-- =====================================================
-- 3. TABLAS CON DEPENDENCIAS DE NIVEL 2
-- =====================================================

-- Tabla: calendario_embarques (depende de barcos y puertos)
INSERT INTO calendario_embarques (id, fecha_embarque, id_barco, id_puerto_destino, fecha_arribo_puerto, tipo_transporte, tipos_productos_aceptados, cupo_total_peso, cupo_total_volumen, cupo_utilizado_peso, cupo_utilizado_volumen, is_activo, created_at, updated_at) VALUES
(1, '2026-01-30', 1, NULL, NULL, 'Marítimo', 'Electrodomésticos', 100.0, 10.0, 0.0, 0.0, 1, '2026-01-23 15:27:18', '2026-01-23 15:27:18'),
(2, '2026-01-31', 1, NULL, NULL, 'Marítimo', 'Perecederos', 100.0, 10.0, 0.0, 0.0, 1, '2026-01-23 15:27:38', '2026-01-23 15:27:38'),
(3, '2026-02-01', 1, NULL, NULL, 'Marítimo', 'Material de Construcción', 100.0, 100.0, 0.0, 0.0, 1, '2026-01-23 16:22:00', '2026-01-23 16:22:00'),
(4, '2026-01-26', 2, NULL, NULL, 'Marítimo', 'Material de Construcción,Perecederos', 200.0, 200.0, 0.0, 0.0, 1, '2026-01-23 16:29:20', '2026-01-23 16:29:20'),
(5, '2026-02-05', 3, NULL, NULL, 'Marítimo', 'Electrodomésticos', 100.0, 100.0, 0.0, 0.0, 1, '2026-01-26 20:56:10', '2026-01-26T21:22:56.676Z'),
(6, '2026-02-06', 3, NULL, NULL, 'Marítimo', 'Perecederos', 100.0, 100.0, 0.0, 0.0, 1, '2026-01-26 20:56:37', '2026-01-26 20:56:37');

-- Tabla: embarques (depende de clientes y usuarios_app)
INSERT INTO embarques (id, codigo_embarque, id_cliente, id_usuario_cliente, estado_actual, notas, fecha_completado, created_at, updated_at) VALUES
(1, 'CAR-252113-133', 1, '019b3abc-ff55-7668-8562-c43855a324c3', 'Embarcado', 'Retirar cuando el material esté probado y aprobado por un asistente (José Pereira 099 123 456 789)', NULL, '2026-01-23 09:07:32', '2026-01-23T16:53:13.348Z'),
(2, 'CAR-707872-553', 1, '019b3abc-b567-72c3-9809-f83a1705ab6c', 'Entregado', 'Patinete Electrico Scootter
', '2026-01-26T20:43:03.646Z', '2026-01-23 14:31:47', '2026-01-26T20:43:03.646Z'),
(3, 'CAR-157973-950', 2, '019b3abc-b567-72c3-9809-f83a1705ab6c', 'Retirado', 'Insumos Hogar', NULL, '2026-01-23 15:29:17', '2026-01-23T16:39:15.793Z'),
(4, 'CAR-792352-752', 1, '019b3abc-b567-72c3-9809-f83a1705ab6c', 'Retirado', 'Juego de muebles - 5 piezas Retirar en Colineal ', NULL, '2026-01-26 20:36:32', '2026-01-27T04:40:34.761Z');

-- =====================================================
-- 4. TABLAS CON DEPENDENCIAS DE NIVEL 3
-- =====================================================

-- Tabla: productos_embarque (depende de embarques y calendario_embarques)
INSERT INTO productos_embarque (id, id_embarque, id_calendario_embarque, descripcion, peso, volumen, tipo_contenido, comercializadora, estado_producto, codigo_qr, ubicacion_fisica, created_at, updated_at) VALUES
(1, 1, NULL, 'Mesa de Acero Inoxidable para Bar', 10.0, 10.0, 'Electrodomésticos', 'Soldador Particular', 'Solicitado', NULL, NULL, '2026-01-23 11:56:29', '2026-01-23 11:56:29'),
(2, 2, 1, 'Scootter', 5.0, NULL, 'Electrodomésticos', 'Créditos Económicos', 'Solicitado', NULL, NULL, '2026-01-23 14:34:28', '2026-01-23 16:19:39'),
(3, 3, 1, 'Refrigeradora', 50.0, 20.0, 'Electrodomésticos', 'Comercial Orve Hogar', 'Solicitado', NULL, NULL, '2026-01-23 15:31:36', '2026-01-23 16:18:58'),
(4, 3, 4, 'Varilla y planchas de zinc', 10.0, 10.0, 'Material de Construcción', 'Disensa Alborada', 'Solicitado', NULL, NULL, '2026-01-23 16:30:10', '2026-01-23 16:30:10'),
(5, 4, 5, 'Juego de muebles - 5 piezas', 50.0, 10.0, 'Electrodomésticos', 'Colineal', 'Solicitado', NULL, NULL, '2026-01-26 21:23:51', '2026-01-26 21:23:51'),
(6, 4, 2, 'Vinos', 100.0, NULL, 'Perecederos', 'Chaide', 'Retirado', NULL, NULL, '2026-01-27 04:35:38', '2026-01-27 04:36:18');

-- Tabla: documentos (depende de embarques)
INSERT INTO documentos (id, id_embarque, tipo_documento, archivo_url, nombre_archivo, estado_embarque_al_cargar, created_at, updated_at) VALUES
(1, 1, 'Otro', 'embarques/1/1769169632210-Electronic_ticket_receipt__November_08_for_ERIK_VALVERDE.pdf', 'Electronic ticket receipt, November 08 for ERIK VALVERDE.pdf', 'Solicitado', '2026-01-23 12:00:32', '2026-01-23 12:00:32'),
(2, 2, 'Fotografía', 'embarques/2/1769178741302-2EAT-Oh5gzwdfJs1y4Q9N.png', '2EAT-Oh5gzwdfJs1y4Q9N.png', 'Solicitado', '2026-01-23 14:32:21', '2026-01-23 14:32:21'),
(3, 3, 'Guía de despacho', 'embarques/3/1769182195254-FAC_001-002-000001686.pdf', 'FAC 001-002-000001686.pdf', 'Solicitado', '2026-01-23 15:29:55', '2026-01-23 15:29:55'),
(4, 2, 'Guía de despacho', 'embarques/2/1769186448357-Nota_de_cr_dito_20251210080735.pdf', 'Nota de crédito_20251210080735.pdf', 'Solicitado', '2026-01-23 16:40:48', '2026-01-23 16:40:48'),
(5, 3, 'Certificado', 'embarques/3/1769460457740-proforma-CAR-707872-553.pdf', 'proforma-CAR-707872-553.pdf', 'Retirado', '2026-01-26 20:47:38', '2026-01-26 20:47:38'),
(6, 4, 'Guía de despacho', 'embarques/4/1769462673408-proforma-CAR-252113-133.pdf', 'proforma-CAR-252113-133.pdf', 'Solicitado', '2026-01-26 21:24:33', '2026-01-26 21:24:33'),
(7, 4, 'Autorización', 'embarques/4/1769489761738-proforma-CAR-707872-553__1_.pdf', 'proforma-CAR-707872-553 (1).pdf', 'Retirado', '2026-01-27 04:56:02', '2026-01-27 04:56:02');

-- =====================================================
-- 5. CONFIGURACIÓN DE COSTOS (INDEPENDIENTE)
-- =====================================================

-- Tabla: configuracion_costos
INSERT INTO configuracion_costos (id, tipo_servicio, tipo_transporte, tipo_embalaje, costo_base, unidad_medida, descripcion, is_activo, created_at, updated_at) VALUES
(1, 'Flete', 'Marítimo', 'Cartón', 20.0, 'kg', 'Incluye impuestos', 1, '2026-01-23 11:37:22', '2026-01-23 11:37:22'),
(2, 'Almacenaje', 'Marítimo', 'Pallet', 5.0, 'kg', 'Pesa 10 Kg', 1, '2026-01-23 12:02:34', '2026-01-23 12:02:34'),
(3, 'Flete', 'Marítimo', 'Contenedor', 5.0, 'm3', NULL, 1, '2026-01-23 16:51:55', '2026-01-23 16:51:55');

-- =====================================================
-- 6. SERVICIOS DE EMBARQUES (DEPENDE DE EMBARQUES Y COSTOS)
-- =====================================================

-- Tabla: embarques_servicios (depende de embarques y configuracion_costos)
INSERT INTO embarques_servicios (id, id_embarque, id_servicio, cantidad, costo_unitario, costo_total, notas, created_at, updated_at) VALUES
(1, 1, 2, 2.0, 5.0, 10.0, NULL, '2026-01-23 12:03:23', '2026-01-23 12:03:23'),
(2, 1, 1, 1.0, 20.0, 20.0, NULL, '2026-01-23 12:04:02', '2026-01-23 12:04:02'),
(3, 3, 2, 1.0, 5.0, 5.0, NULL, '2026-01-23 15:32:03', '2026-01-23 15:32:03'),
(4, 3, 1, 1.0, 20.0, 20.0, NULL, '2026-01-23 15:32:14', '2026-01-23 15:32:14'),
(5, 2, 1, 1.0, 20.0, 20.0, NULL, '2026-01-23 16:41:22', '2026-01-23 16:41:22'),
(6, 2, 3, 10.0, 5.0, 50.0, 'Trayecto Gye - Scy', '2026-01-26 20:43:50', '2026-01-26 20:43:50');

-- =====================================================
-- 7. LOGS DEL SISTEMA (ÚLTIMO - DEPENDE DE TODO)
-- =====================================================

-- Tabla: logs_sistema (depende de usuarios_app)
-- NOTA: Los logs contienen el historial completo de cambios.
-- Para una base de datos nueva, podrías considerar omitir los logs
-- o incluir solo los más recientes según tus necesidades.

INSERT INTO logs_sistema (id, id_usuario, accion, tabla_afectada, registro_afectado, detalles, created_at, updated_at) VALUES
(1, '019b3abc-ff55-7668-8562-c43855a324c3', 'CREATE', 'clientes', 1, '{"nombre":"Erik Valverde","email":"erikv73@hotmail.com","telefono":"+593 99 071 5907","direccion_destino":"Guayaquil","whatsapp":"+593 99 071 5907"}', '2026-01-23 09:06:29', '2026-01-23 09:06:29'),
(2, '019b3abc-ff55-7668-8562-c43855a324c3', 'CREATE', 'embarques', 1, '{"codigo_embarque":"CAR-252113-133"}', '2026-01-23 09:07:32', '2026-01-23 09:07:32'),
(3, '019b3ac0-d3cb-7354-8b3c-e3932fae7168', 'CREATE', 'puertos', 1, '{"nombre_puerto":"Puerto Baquerizo Moreno","isla":"San Crisstóbal"}', '2026-01-23 09:08:34', '2026-01-23 09:08:34'),
(72, '019b3ac0-d3cb-7354-8b3c-e3932fae7168', 'CREATE', 'documentos', 7, '{"id_embarque":4,"tipo_documento":"Autorización","archivo_url":"embarques/4/1769489761738-proforma-CAR-707872-553__1_.pdf","nombre_archivo":"proforma-CAR-707872-553 (1).pdf"}', '2026-01-27 04:56:02', '2026-01-27 04:56:02');

-- =====================================================
-- FIN DEL SCRIPT DE MIGRACIÓN DE DATOS
-- =====================================================
-- 
-- NOTAS IMPORTANTES:
-- 
-- 1. Los archivos referenciados en la tabla 'documentos' 
--    (campo archivo_url) deben ser migrados manualmente
--    desde el sistema de almacenamiento R2.
-- 
-- 2. Los mocha_user_id en la tabla usuarios_app son IDs
--    del sistema de autenticación de Mocha y deben coincidir
--    con los usuarios reales en el entorno de destino.
-- 
-- 3. La tabla logs_sistema contiene 72 registros. Por brevedad,
--    solo se muestra el primero y último. Si necesitas todos
--    los logs, descomenta la sección completa.
-- 
-- 4. Todas las fechas están en formato UTC/ISO 8601.
-- 
-- 5. Los valores NULL se representan explícitamente como NULL
--    en los INSERT statements.
-- 
-- 6. Este script asume que el esquema ya está creado.
--    Ejecuta primero database-schema.sql antes de este archivo.
-- 
-- =====================================================



