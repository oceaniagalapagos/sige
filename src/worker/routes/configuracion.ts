import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const configuracionRoutes = new Hono<{ Bindings: Env }>();

const createConfigSchema = z.object({
  tipo_servicio: z.string().min(1),
  tipo_transporte: z.string().optional(),
  tipo_embalaje: z.string().optional(),
  costo_base: z.number(),
  unidad_medida: z.string(),
  descripcion: z.string().optional(),
});

const updateConfigSchema = z.object({
  tipo_servicio: z.string().min(1).optional(),
  tipo_transporte: z.string().optional(),
  tipo_embalaje: z.string().optional(),
  costo_base: z.number().optional(),
  unidad_medida: z.string().optional(),
  descripcion: z.string().optional(),
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

// Listar configuraciones de costos (todos los usuarios pueden ver)
configuracionRoutes.get("/", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM configuracion_costos WHERE is_activo = 1 ORDER BY tipo_servicio ASC"
  ).all();

  return c.json(results);
});

// Obtener una configuración por ID (todos los usuarios pueden ver)
configuracionRoutes.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const config = await c.env.DB.prepare(
    "SELECT * FROM configuracion_costos WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!config) {
    return c.json({ error: "Configuración no encontrada" }, 404);
  }

  return c.json(config);
});

// Crear una nueva configuración (solo administradores)
configuracionRoutes.post(
  "/",
  authMiddleware,
  adminOnly,
  zValidator("json", createConfigSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");

    const result = await c.env.DB.prepare(
      "INSERT INTO configuracion_costos (tipo_servicio, tipo_transporte, tipo_embalaje, costo_base, unidad_medida, descripcion) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(
        data.tipo_servicio,
        data.tipo_transporte || null,
        data.tipo_embalaje || null,
        data.costo_base,
        data.unidad_medida,
        data.descripcion || null
      )
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "CREATE",
        "configuracion_costos",
        result.meta.last_row_id,
        JSON.stringify(data)
      )
      .run();

    const config = await c.env.DB.prepare(
      "SELECT * FROM configuracion_costos WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(config, 201);
  }
);

// Actualizar una configuración (solo administradores)
configuracionRoutes.patch(
  "/:id",
  authMiddleware,
  adminOnly,
  zValidator("json", updateConfigSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user");

    const updates: string[] = [];
    const params: any[] = [];

    if (data.tipo_servicio !== undefined) {
      updates.push("tipo_servicio = ?");
      params.push(data.tipo_servicio);
    }

    if (data.tipo_transporte !== undefined) {
      updates.push("tipo_transporte = ?");
      params.push(data.tipo_transporte);
    }

    if (data.tipo_embalaje !== undefined) {
      updates.push("tipo_embalaje = ?");
      params.push(data.tipo_embalaje);
    }

    if (data.costo_base !== undefined) {
      updates.push("costo_base = ?");
      params.push(data.costo_base);
    }

    if (data.unidad_medida !== undefined) {
      updates.push("unidad_medida = ?");
      params.push(data.unidad_medida);
    }

    if (data.descripcion !== undefined) {
      updates.push("descripcion = ?");
      params.push(data.descripcion);
    }

    if (data.is_activo !== undefined) {
      updates.push("is_activo = ?");
      params.push(data.is_activo ? 1 : 0);
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await c.env.DB.prepare(
      `UPDATE configuracion_costos SET ${updates.join(", ")} WHERE id = ?`
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
        "configuracion_costos",
        id,
        JSON.stringify(data)
      )
      .run();

    const config = await c.env.DB.prepare(
      "SELECT * FROM configuracion_costos WHERE id = ?"
    )
      .bind(id)
      .first();

    return c.json(config);
  }
);

// Eliminar una configuración (solo administradores)
configuracionRoutes.delete("/:id", authMiddleware, adminOnly, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  await c.env.DB.prepare("DELETE FROM configuracion_costos WHERE id = ?")
    .bind(id)
    .run();

  // Registrar en logs
  await c.env.DB.prepare(
    "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(
      user?.id || "system",
      "DELETE",
      "configuracion_costos",
      id,
      "{}"
    )
    .run();

  return c.json({ success: true });
});
