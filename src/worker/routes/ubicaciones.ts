import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const ubicacionesRoutes = new Hono<{ Bindings: Env }>();

const createUbicacionSchema = z.object({
  nombre_ubicacion: z.string().min(1),
  descripcion: z.string().optional(),
});

const updateUbicacionSchema = z.object({
  nombre_ubicacion: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  is_activo: z.boolean().optional(),
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

// Listar ubicaciones
ubicacionesRoutes.get("/", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM ubicaciones WHERE is_activo = 1 ORDER BY nombre_ubicacion ASC"
  ).all();

  return c.json(results);
});

// Obtener una ubicación por ID
ubicacionesRoutes.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const ubicacion = await c.env.DB.prepare(
    "SELECT * FROM ubicaciones WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!ubicacion) {
    return c.json({ error: "Ubicación no encontrada" }, 404);
  }

  return c.json(ubicacion);
});

// Obtener destinos por ubicación
ubicacionesRoutes.get("/:id/destinos", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    "SELECT id, nombre_puerto as nombre_destino, isla, is_activo FROM puertos WHERE id_ubicacion = ? AND is_activo = 1 ORDER BY nombre_puerto ASC"
  )
    .bind(id)
    .all();

  return c.json(results);
});

// Crear ubicación (solo admin)
ubicacionesRoutes.post(
  "/",
  authMiddleware,
  adminOnly,
  zValidator("json", createUbicacionSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");

    const result = await c.env.DB.prepare(
      "INSERT INTO ubicaciones (nombre_ubicacion, descripcion) VALUES (?, ?)"
    )
      .bind(data.nombre_ubicacion, data.descripcion || null)
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "CREATE",
        "ubicaciones",
        result.meta.last_row_id,
        JSON.stringify(data)
      )
      .run();

    const ubicacion = await c.env.DB.prepare(
      "SELECT * FROM ubicaciones WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(ubicacion, 201);
  }
);

// Actualizar ubicación (solo admin)
ubicacionesRoutes.patch(
  "/:id",
  authMiddleware,
  adminOnly,
  zValidator("json", updateUbicacionSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user");

    const updates: string[] = [];
    const params: any[] = [];

    if (data.nombre_ubicacion !== undefined) {
      updates.push("nombre_ubicacion = ?");
      params.push(data.nombre_ubicacion);
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
      `UPDATE ubicaciones SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...params)
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(user?.id || "system", "UPDATE", "ubicaciones", id, JSON.stringify(data))
      .run();

    const ubicacion = await c.env.DB.prepare(
      "SELECT * FROM ubicaciones WHERE id = ?"
    )
      .bind(id)
      .first();

    return c.json(ubicacion);
  }
);

// Eliminar ubicación (solo admin)
ubicacionesRoutes.delete("/:id", authMiddleware, adminOnly, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  // Verificar si hay destinos asociados
  const destinos = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM puertos WHERE id_ubicacion = ?"
  )
    .bind(id)
    .first();

  if (destinos && (destinos as any).count > 0) {
    return c.json(
      { error: "No se puede eliminar: hay destinos asociados a esta ubicación" },
      400
    );
  }

  await c.env.DB.prepare("DELETE FROM ubicaciones WHERE id = ?").bind(id).run();

  // Registrar en logs
  await c.env.DB.prepare(
    "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(user?.id || "system", "DELETE", "ubicaciones", id, "{}")
    .run();

  return c.json({ success: true });
});
