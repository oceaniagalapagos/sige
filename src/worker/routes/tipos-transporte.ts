import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const tiposTransporteRoutes = new Hono<{ Bindings: Env }>();

const createTipoTransporteSchema = z.object({
  nombre_tipo: z.string().min(1),
  descripcion: z.string().optional(),
});

const updateTipoTransporteSchema = z.object({
  nombre_tipo: z.string().min(1).optional(),
  descripcion: z.string().optional(),
});

// Middleware para verificar rol de administrador
const adminOnly = async (c: any, next: any) => {
  const user = c.get("user");
  const usuario = await c.env.DB.prepare(
    "SELECT rol FROM usuarios_app WHERE mocha_user_id = ?"
  )
    .bind(user.id)
    .first();

  if (!usuario || (usuario as any).rol !== "administrador") {
    return c.json({ error: "Acceso denegado" }, 403);
  }

  await next();
};

// Listar tipos de transporte
tiposTransporteRoutes.get("/", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tipos_transporte ORDER BY nombre_tipo ASC"
  ).all();

  return c.json(results);
});

// Obtener transportes asociados a un tipo
tiposTransporteRoutes.get("/:id/transportes", authMiddleware, async (c) => {
  const id = c.req.param("id");
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM barcos WHERE id_tipo_transporte = ? ORDER BY nombre_barco ASC"
  )
    .bind(id)
    .all();

  return c.json(results);
});

// Obtener un tipo de transporte por ID
tiposTransporteRoutes.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const tipoTransporte = await c.env.DB.prepare(
    "SELECT * FROM tipos_transporte WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!tipoTransporte) {
    return c.json({ error: "Tipo de transporte no encontrado" }, 404);
  }

  return c.json(tipoTransporte);
});

// Crear tipo de transporte (solo admin)
tiposTransporteRoutes.post(
  "/",
  authMiddleware,
  adminOnly,
  zValidator("json", createTipoTransporteSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");

    const result = await c.env.DB.prepare(
      "INSERT INTO tipos_transporte (nombre_tipo, descripcion) VALUES (?, ?)"
    )
      .bind(data.nombre_tipo, data.descripcion || null)
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "CREATE",
        "tipos_transporte",
        result.meta.last_row_id,
        JSON.stringify(data)
      )
      .run();

    const tipoTransporte = await c.env.DB.prepare(
      "SELECT * FROM tipos_transporte WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(tipoTransporte, 201);
  }
);

// Actualizar tipo de transporte (solo admin)
tiposTransporteRoutes.patch(
  "/:id",
  authMiddleware,
  adminOnly,
  zValidator("json", updateTipoTransporteSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user");

    const updates: string[] = [];
    const params: any[] = [];

    if (data.nombre_tipo !== undefined) {
      updates.push("nombre_tipo = ?");
      params.push(data.nombre_tipo);
    }

    if (data.descripcion !== undefined) {
      updates.push("descripcion = ?");
      params.push(data.descripcion);
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await c.env.DB.prepare(
      `UPDATE tipos_transporte SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...params)
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(user?.id || "system", "UPDATE", "tipos_transporte", id, JSON.stringify(data))
      .run();

    const tipoTransporte = await c.env.DB.prepare(
      "SELECT * FROM tipos_transporte WHERE id = ?"
    )
      .bind(id)
      .first();

    return c.json(tipoTransporte);
  }
);

// Eliminar tipo de transporte (solo admin)
tiposTransporteRoutes.delete("/:id", authMiddleware, adminOnly, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  // Verificar si hay transportes asociados
  const transportesAsociados = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM barcos WHERE id_tipo_transporte = ?"
  )
    .bind(id)
    .first();

  if (transportesAsociados && (transportesAsociados as any).count > 0) {
    return c.json({ error: "No se puede eliminar: hay transportes asociados a este tipo" }, 400);
  }

  await c.env.DB.prepare("DELETE FROM tipos_transporte WHERE id = ?").bind(id).run();

  // Registrar en logs
  await c.env.DB.prepare(
    "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(user?.id || "system", "DELETE", "tipos_transporte", id, "{}")
    .run();

  return c.json({ success: true });
});
