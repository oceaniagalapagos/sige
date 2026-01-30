
ALTER TABLE calendario_embarques ADD COLUMN id_puerto_destino INTEGER;
ALTER TABLE calendario_embarques ADD COLUMN fecha_arribo_puerto DATE;
ALTER TABLE calendario_embarques ADD COLUMN tipo_transporte TEXT DEFAULT 'Marítimo';
