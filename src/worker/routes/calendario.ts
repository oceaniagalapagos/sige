import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const calendarioRoutes = new Hono<{ Bindings: Env }>();

const createCalendarioSchema = z.object({
  fecha_embarque: z.string(),
  id_barco: z.number(),
  tipos_productos_aceptados: z.string(),
  cupo_total_peso: z.number(),
  cupo_total_volumen: z.number(),
  id_puerto_destino: z.number().optional(),
  fecha_arribo_puerto: z.string().optional(),
  tipo_transporte: z.enum(["Marítimo", "Aéreo", "Terrestre"]).optional(),
});

const updateCalendarioSchema = z.object({
  fecha_embarque: z.string().optional(),
  id_barco: z.number().optional(),
  tipos_productos_aceptados: z.string().optional(),
  cupo_total_peso: z.number().optional(),
  cupo_total_volumen: z.number().optional(),
  cupo_utilizado_peso: z.number().optional(),
  cupo_utilizado_volumen: z.number().optional(),
  id_puerto_destino: z.number().optional(),
  fecha_arribo_puerto: z.string().optional(),
  tipo_transporte: z.enum(["Marítimo", "Aéreo", "Terrestre"]).optional(),
  is_activo: z.boolean().optional(),
});

// Obtener usuario actual con rol
async function obtenerUsuarioConRol(c: any) {
  const user = c.get("user");
  const usuario = await c.env.DB.prepare(
    "SELECT * FROM usuarios_app WHERE mocha_user_id = ?"
  )
    .bind(user.id)
    .first();

  if (!usuario) {
    const nombre = user.google_user_data?.name || user.email.split("@")[0];
    await c.env.DB.prepare(
      "INSERT INTO usuarios_app (mocha_user_id, email, nombre, rol) VALUES (?, ?, ?, ?)"
    )
      .bind(user.id, user.email, nombre, "cliente")
      .run();

    return await c.env.DB.prepare(
      "SELECT * FROM usuarios_app WHERE mocha_user_id = ?"
    )
      .bind(user.id)
      .first();
  }

  return usuario;
}

// Middleware para verificar rol de administrador
const adminOnly = async (c: any, next: any) => {
  const usuario: any = await obtenerUsuarioConRol(c);

  if (usuario.rol !== "administrador") {
    return c.json({ error: "Acceso denegado" }, 403);
  }

  await next();
};

// Listar calendario de embarques (todos los usuarios pueden ver)
calendarioRoutes.get("/", authMiddleware, async (c) => {
  const desde = c.req.query("desde");
  const hasta = c.req.query("hasta");

  let query =
    "SELECT ce.*, b.nombre_barco, tt.nombre_tipo as tipo_transporte_nombre, p.nombre_puerto as nombre_destino, p.isla FROM calendario_embarques ce LEFT JOIN barcos b ON ce.id_barco = b.id LEFT JOIN tipos_transporte tt ON b.id_tipo_transporte = tt.id LEFT JOIN puertos p ON ce.id_puerto_destino = p.id";
  const params: any[] = [];
  const conditions: string[] = [];

  if (desde) {
    conditions.push("ce.fecha_embarque >= ?");
    params.push(desde);
  }

  if (hasta) {
    conditions.push("ce.fecha_embarque <= ?");
    params.push(hasta);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY ce.fecha_embarque ASC";

  const { results } = await c.env.DB.prepare(query)
    .bind(...params)
    .all();

  return c.json(results);
});

// Obtener un evento del calendario
calendarioRoutes.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const evento = await c.env.DB.prepare(
    "SELECT ce.*, b.nombre_barco, tt.nombre_tipo as tipo_transporte_nombre, p.nombre_puerto as nombre_destino, p.isla FROM calendario_embarques ce LEFT JOIN barcos b ON ce.id_barco = b.id LEFT JOIN tipos_transporte tt ON b.id_tipo_transporte = tt.id LEFT JOIN puertos p ON ce.id_puerto_destino = p.id WHERE ce.id = ?"
  )
    .bind(id)
    .first();

  if (!evento) {
    return c.json({ error: "Evento no encontrado" }, 404);
  }

  return c.json(evento);
});

// Crear un nuevo evento en el calendario (solo administradores)
calendarioRoutes.post(
  "/",
  authMiddleware,
  adminOnly,
  zValidator("json", createCalendarioSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");

    // Validar que la fecha de arribo sea posterior a la fecha de embarque
    if (data.fecha_arribo_puerto && data.fecha_embarque) {
      const fechaEmbarque = new Date(data.fecha_embarque);
      const fechaArribo = new Date(data.fecha_arribo_puerto);

      if (fechaArribo <= fechaEmbarque) {
        return c.json(
          {
            error:
              "La fecha de arribo debe ser posterior a la fecha de embarque",
          },
          400
        );
      }
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO calendario_embarques (fecha_embarque, id_barco, tipos_productos_aceptados, cupo_total_peso, cupo_total_volumen, id_puerto_destino, fecha_arribo_puerto, tipo_transporte) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(
        data.fecha_embarque,
        data.id_barco,
        data.tipos_productos_aceptados,
        data.cupo_total_peso,
        data.cupo_total_volumen,
        data.id_puerto_destino || null,
        data.fecha_arribo_puerto || null,
        data.tipo_transporte || "Marítimo"
      )
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "CREATE",
        "calendario_embarques",
        result.meta.last_row_id,
        JSON.stringify(data)
      )
      .run();

    const evento = await c.env.DB.prepare(
      "SELECT * FROM calendario_embarques WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(evento, 201);
  }
);

// Actualizar un evento del calendario (solo administradores)
calendarioRoutes.patch(
  "/:id",
  authMiddleware,
  adminOnly,
  zValidator("json", updateCalendarioSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user");

    // Validar fechas si se proporcionan ambas
    if (data.fecha_arribo_puerto || data.fecha_embarque) {
      const eventoActual: any = await c.env.DB.prepare(
        "SELECT fecha_embarque, fecha_arribo_puerto FROM calendario_embarques WHERE id = ?"
      )
        .bind(id)
        .first();

      const fechaEmbarque = new Date(
        data.fecha_embarque || eventoActual.fecha_embarque
      );
      const fechaArribo = new Date(
        data.fecha_arribo_puerto || eventoActual.fecha_arribo_puerto
      );

      if (
        data.fecha_arribo_puerto &&
        eventoActual.fecha_embarque &&
        fechaArribo <= fechaEmbarque
      ) {
        return c.json(
          {
            error:
              "La fecha de arribo debe ser posterior a la fecha de embarque",
          },
          400
        );
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.fecha_embarque !== undefined) {
      updates.push("fecha_embarque = ?");
      params.push(data.fecha_embarque);
    }

    if (data.id_barco !== undefined) {
      updates.push("id_barco = ?");
      params.push(data.id_barco);
    }

    if (data.tipos_productos_aceptados !== undefined) {
      updates.push("tipos_productos_aceptados = ?");
      params.push(data.tipos_productos_aceptados);
    }

    if (data.cupo_total_peso !== undefined) {
      updates.push("cupo_total_peso = ?");
      params.push(data.cupo_total_peso);
    }

    if (data.cupo_total_volumen !== undefined) {
      updates.push("cupo_total_volumen = ?");
      params.push(data.cupo_total_volumen);
    }

    if (data.cupo_utilizado_peso !== undefined) {
      updates.push("cupo_utilizado_peso = ?");
      params.push(data.cupo_utilizado_peso);
    }

    if (data.cupo_utilizado_volumen !== undefined) {
      updates.push("cupo_utilizado_volumen = ?");
      params.push(data.cupo_utilizado_volumen);
    }

    if (data.id_puerto_destino !== undefined) {
      updates.push("id_puerto_destino = ?");
      params.push(data.id_puerto_destino);
    }

    if (data.fecha_arribo_puerto !== undefined) {
      updates.push("fecha_arribo_puerto = ?");
      params.push(data.fecha_arribo_puerto);
    }

    if (data.tipo_transporte !== undefined) {
      updates.push("tipo_transporte = ?");
      params.push(data.tipo_transporte);
    }

    if (data.is_activo !== undefined) {
      updates.push("is_activo = ?");
      params.push(data.is_activo ? 1 : 0);
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await c.env.DB.prepare(
      `UPDATE calendario_embarques SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...params)
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "UPDATE",
        "calendario_embarques",
        id,
        JSON.stringify(data)
      )
      .run();

    const evento = await c.env.DB.prepare(
      "SELECT * FROM calendario_embarques WHERE id = ?"
    )
      .bind(id)
      .first();

    return c.json(evento);
  }
);

// Obtener capacidad utilizada por tipo de producto en cada calendario
calendarioRoutes.get("/:id/capacidad", authMiddleware, async (c) => {
  const id = c.req.param("id");

  // Get calendar info
  const calendario: any = await c.env.DB.prepare(
    "SELECT ce.*, b.nombre_barco FROM calendario_embarques ce LEFT JOIN barcos b ON ce.id_barco = b.id WHERE ce.id = ?"
  )
    .bind(id)
    .first();

  if (!calendario) {
    return c.json({ error: "Calendario no encontrado" }, 404);
  }

  // Get products assigned to this calendar grouped by product type
  const { results: productosAgrupados } = await c.env.DB.prepare(`
    SELECT 
      tipo_contenido,
      COUNT(*) as cantidad,
      SUM(COALESCE(peso, 0)) as total_peso,
      SUM(COALESCE(volumen, 0)) as total_volumen
    FROM productos_embarque 
    WHERE id_calendario_embarque = ?
    GROUP BY tipo_contenido
  `)
    .bind(id)
    .all();

  // Calculate totals
  const totalPeso = productosAgrupados.reduce((sum: number, p: any) => sum + (p.total_peso || 0), 0);
  const totalVolumen = productosAgrupados.reduce((sum: number, p: any) => sum + (p.total_volumen || 0), 0);

  return c.json({
    calendario: {
      id: calendario.id,
      fecha_embarque: calendario.fecha_embarque,
      nombre_barco: calendario.nombre_barco,
      cupo_total_peso: calendario.cupo_total_peso,
      cupo_total_volumen: calendario.cupo_total_volumen,
    },
    por_tipo_producto: productosAgrupados,
    totales: {
      peso_utilizado: totalPeso,
      volumen_utilizado: totalVolumen,
      porcentaje_peso: calendario.cupo_total_peso > 0 
        ? Math.round((totalPeso / calendario.cupo_total_peso) * 100) 
        : 0,
      porcentaje_volumen: calendario.cupo_total_volumen > 0 
        ? Math.round((totalVolumen / calendario.cupo_total_volumen) * 100) 
        : 0,
    }
  });
});

// Obtener resumen de capacidad de todos los calendarios activos
calendarioRoutes.get("/capacidad/resumen", authMiddleware, async (c) => {
  // Get all active calendars with their capacity
  const { results: calendarios } = await c.env.DB.prepare(`
    SELECT 
      ce.id,
      ce.fecha_embarque,
      ce.cupo_total_peso,
      ce.cupo_total_volumen,
      ce.tipos_productos_aceptados,
      ce.tipo_transporte,
      b.nombre_barco,
      p.nombre_puerto as destino
    FROM calendario_embarques ce
    LEFT JOIN barcos b ON ce.id_barco = b.id
    LEFT JOIN puertos p ON ce.id_puerto_destino = p.id
    WHERE ce.is_activo = 1 AND ce.fecha_embarque >= date('now')
    ORDER BY ce.fecha_embarque ASC
  `).all();

  // Get product totals for each calendar
  const { results: productosAgrupados } = await c.env.DB.prepare(`
    SELECT 
      id_calendario_embarque,
      tipo_contenido,
      SUM(COALESCE(peso, 0)) as total_peso,
      SUM(COALESCE(volumen, 0)) as total_volumen
    FROM productos_embarque 
    WHERE id_calendario_embarque IS NOT NULL
    GROUP BY id_calendario_embarque, tipo_contenido
  `).all();

  // Combine data
  const resultado = calendarios.map((cal: any) => {
    const productos = productosAgrupados.filter((p: any) => p.id_calendario_embarque === cal.id);
    const totalPeso = productos.reduce((sum: number, p: any) => sum + (p.total_peso || 0), 0);
    const totalVolumen = productos.reduce((sum: number, p: any) => sum + (p.total_volumen || 0), 0);

    return {
      ...cal,
      por_tipo_producto: productos,
      peso_utilizado: totalPeso,
      volumen_utilizado: totalVolumen,
      porcentaje_peso: cal.cupo_total_peso > 0 
        ? Math.round((totalPeso / cal.cupo_total_peso) * 100) 
        : 0,
      porcentaje_volumen: cal.cupo_total_volumen > 0 
        ? Math.round((totalVolumen / cal.cupo_total_volumen) * 100) 
        : 0,
    };
  });

  return c.json(resultado);
});

// Eliminar un evento del calendario (solo administradores)
calendarioRoutes.delete("/:id", authMiddleware, adminOnly, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  await c.env.DB.prepare("DELETE FROM calendario_embarques WHERE id = ?")
    .bind(id)
    .run();

  // Registrar en logs
  await c.env.DB.prepare(
    "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(user?.id || "system", "DELETE", "calendario_embarques", id, "{}")
    .run();

  return c.json({ success: true });
});
