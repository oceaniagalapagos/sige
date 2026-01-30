import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const destinosRoutes = new Hono<{ Bindings: Env }>();

const createDestinoSchema = z.object({
  nombre_destino: z.string().min(1),
  isla: z.string().min(1),
  id_ubicacion: z.number().optional(),
});

const updateDestinoSchema = z.object({
  nombre_destino: z.string().min(1).optional(),
  isla: z.string().min(1).optional(),
  id_ubicacion: z.number().nullable().optional(),
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

// Listar destinos (todos los usuarios autenticados)
destinosRoutes.get("/", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.nombre_puerto as nombre_destino, p.isla, p.id_ubicacion, p.is_activo, p.created_at, p.updated_at,
     u.nombre_ubicacion
     FROM puertos p
     LEFT JOIN ubicaciones u ON p.id_ubicacion = u.id
     WHERE p.is_activo = 1 ORDER BY p.isla, p.nombre_puerto ASC`
  ).all();

  return c.json(results);
});

// Obtener un destino por ID
destinosRoutes.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const destino = await c.env.DB.prepare(
    `SELECT p.id, p.nombre_puerto as nombre_destino, p.isla, p.id_ubicacion, p.is_activo, p.created_at, p.updated_at,
     u.nombre_ubicacion
     FROM puertos p
     LEFT JOIN ubicaciones u ON p.id_ubicacion = u.id
     WHERE p.id = ?`
  )
    .bind(id)
    .first();

  if (!destino) {
    return c.json({ error: "Destino no encontrado" }, 404);
  }

  return c.json(destino);
});

// Crear destino (solo admin)
destinosRoutes.post(
  "/",
  authMiddleware,
  adminOnly,
  zValidator("json", createDestinoSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");

    const result = await c.env.DB.prepare(
      "INSERT INTO puertos (nombre_puerto, isla, id_ubicacion) VALUES (?, ?, ?)"
    )
      .bind(data.nombre_destino, data.isla, data.id_ubicacion || null)
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "CREATE",
        "puertos",
        result.meta.last_row_id,
        JSON.stringify(data)
      )
      .run();

    const destino = await c.env.DB.prepare(
      `SELECT p.id, p.nombre_puerto as nombre_destino, p.isla, p.id_ubicacion, p.is_activo, p.created_at, p.updated_at,
       u.nombre_ubicacion
       FROM puertos p
       LEFT JOIN ubicaciones u ON p.id_ubicacion = u.id
       WHERE p.id = ?`
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(destino, 201);
  }
);

// Actualizar destino (solo admin)
destinosRoutes.patch(
  "/:id",
  authMiddleware,
  adminOnly,
  zValidator("json", updateDestinoSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user");

    const updates: string[] = [];
    const params: any[] = [];

    if (data.nombre_destino !== undefined) {
      updates.push("nombre_puerto = ?");
      params.push(data.nombre_destino);
    }

    if (data.isla !== undefined) {
      updates.push("isla = ?");
      params.push(data.isla);
    }

    if (data.is_activo !== undefined) {
      updates.push("is_activo = ?");
      params.push(data.is_activo ? 1 : 0);
    }

    if (data.id_ubicacion !== undefined) {
      updates.push("id_ubicacion = ?");
      params.push(data.id_ubicacion);
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await c.env.DB.prepare(
      `UPDATE puertos SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...params)
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(user?.id || "system", "UPDATE", "puertos", id, JSON.stringify(data))
      .run();

    const destino = await c.env.DB.prepare(
      `SELECT p.id, p.nombre_puerto as nombre_destino, p.isla, p.id_ubicacion, p.is_activo, p.created_at, p.updated_at,
       u.nombre_ubicacion
       FROM puertos p
       LEFT JOIN ubicaciones u ON p.id_ubicacion = u.id
       WHERE p.id = ?`
    )
      .bind(id)
      .first();

    return c.json(destino);
  }
);

// Eliminar destino (solo admin)
destinosRoutes.delete("/:id", authMiddleware, adminOnly, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  await c.env.DB.prepare("DELETE FROM puertos WHERE id = ?").bind(id).run();

  // Registrar en logs
  await c.env.DB.prepare(
    "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(user?.id || "system", "DELETE", "puertos", id, "{}")
    .run();

  return c.json({ success: true });
});
