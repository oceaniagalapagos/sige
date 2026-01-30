import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const tiposProductosRoutes = new Hono<{ Bindings: Env }>();

const createTipoProductoSchema = z.object({
  nombre_tipo: z.string().min(1),
  descripcion: z.string().optional(),
  requiere_refrigeracion: z.boolean().optional(),
  es_peligroso: z.boolean().optional(),
});

const updateTipoProductoSchema = z.object({
  nombre_tipo: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  requiere_refrigeracion: z.boolean().optional(),
  es_peligroso: z.boolean().optional(),
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

// Listar tipos de productos (todos los usuarios autenticados)
tiposProductosRoutes.get("/", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tipos_productos WHERE is_activo = 1 ORDER BY nombre_tipo ASC"
  ).all();

  return c.json(results);
});

// Obtener un tipo de producto por ID
tiposProductosRoutes.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const tipo = await c.env.DB.prepare(
    "SELECT * FROM tipos_productos WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!tipo) {
    return c.json({ error: "Tipo de producto no encontrado" }, 404);
  }

  return c.json(tipo);
});

// Crear tipo de producto (solo admin)
tiposProductosRoutes.post(
  "/",
  authMiddleware,
  adminOnly,
  zValidator("json", createTipoProductoSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");

    const result = await c.env.DB.prepare(
      "INSERT INTO tipos_productos (nombre_tipo, descripcion, requiere_refrigeracion, es_peligroso) VALUES (?, ?, ?, ?)"
    )
      .bind(
        data.nombre_tipo,
        data.descripcion || null,
        data.requiere_refrigeracion ? 1 : 0,
        data.es_peligroso ? 1 : 0
      )
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "CREATE",
        "tipos_productos",
        result.meta.last_row_id,
        JSON.stringify(data)
      )
      .run();

    const tipo = await c.env.DB.prepare(
      "SELECT * FROM tipos_productos WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(tipo, 201);
  }
);

// Actualizar tipo de producto (solo admin)
tiposProductosRoutes.patch(
  "/:id",
  authMiddleware,
  adminOnly,
  zValidator("json", updateTipoProductoSchema),
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

    if (data.requiere_refrigeracion !== undefined) {
      updates.push("requiere_refrigeracion = ?");
      params.push(data.requiere_refrigeracion ? 1 : 0);
    }

    if (data.es_peligroso !== undefined) {
      updates.push("es_peligroso = ?");
      params.push(data.es_peligroso ? 1 : 0);
    }

    if (data.is_activo !== undefined) {
      updates.push("is_activo = ?");
      params.push(data.is_activo ? 1 : 0);
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await c.env.DB.prepare(
      `UPDATE tipos_productos SET ${updates.join(", ")} WHERE id = ?`
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
        "tipos_productos",
        id,
        JSON.stringify(data)
      )
      .run();

    const tipo = await c.env.DB.prepare(
      "SELECT * FROM tipos_productos WHERE id = ?"
    )
      .bind(id)
      .first();

    return c.json(tipo);
  }
);

// Eliminar tipo de producto (solo admin)
tiposProductosRoutes.delete("/:id", authMiddleware, adminOnly, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  await c.env.DB.prepare("DELETE FROM tipos_productos WHERE id = ?")
    .bind(id)
    .run();

  // Registrar en logs
  await c.env.DB.prepare(
    "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(user?.id || "system", "DELETE", "tipos_productos", id, "{}")
    .run();

  return c.json({ success: true });
});
