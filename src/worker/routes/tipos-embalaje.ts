import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const tiposEmbalajeRoutes = new Hono<{ Bindings: Env }>();

const createTipoSchema = z.object({
  nombre_tipo: z.string().min(1),
  descripcion: z.string().optional(),
});

const updateTipoSchema = z.object({
  nombre_tipo: z.string().min(1).optional(),
  descripcion: z.string().optional(),
});

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

const adminOnly = async (c: any, next: any) => {
  const usuario: any = await obtenerUsuarioConRol(c);

  if (usuario.rol !== "administrador") {
    return c.json({ error: "Acceso denegado" }, 403);
  }

  await next();
};

// Listar tipos de embalaje
tiposEmbalajeRoutes.get("/", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tipos_embalaje ORDER BY nombre_tipo ASC"
  ).all();

  return c.json(results);
});

// Obtener un tipo por ID
tiposEmbalajeRoutes.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const tipo = await c.env.DB.prepare(
    "SELECT * FROM tipos_embalaje WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!tipo) {
    return c.json({ error: "Tipo de embalaje no encontrado" }, 404);
  }

  return c.json(tipo);
});

// Crear tipo de embalaje
tiposEmbalajeRoutes.post(
  "/",
  authMiddleware,
  adminOnly,
  zValidator("json", createTipoSchema),
  async (c) => {
    const data = c.req.valid("json");

    const result = await c.env.DB.prepare(
      "INSERT INTO tipos_embalaje (nombre_tipo, descripcion) VALUES (?, ?)"
    )
      .bind(data.nombre_tipo, data.descripcion || null)
      .run();

    const tipo = await c.env.DB.prepare(
      "SELECT * FROM tipos_embalaje WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(tipo, 201);
  }
);

// Actualizar tipo de embalaje
tiposEmbalajeRoutes.patch(
  "/:id",
  authMiddleware,
  adminOnly,
  zValidator("json", updateTipoSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

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
      `UPDATE tipos_embalaje SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...params)
      .run();

    const tipo = await c.env.DB.prepare(
      "SELECT * FROM tipos_embalaje WHERE id = ?"
    )
      .bind(id)
      .first();

    return c.json(tipo);
  }
);

// Eliminar tipo de embalaje
tiposEmbalajeRoutes.delete("/:id", authMiddleware, adminOnly, async (c) => {
  const id = c.req.param("id");

  // Verificar si hay configuraciones usando este tipo
  const configsUsando = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM configuracion_costos WHERE tipo_embalaje = (SELECT nombre_tipo FROM tipos_embalaje WHERE id = ?)"
  )
    .bind(id)
    .first<{ count: number }>();

  if (configsUsando && configsUsando.count > 0) {
    return c.json(
      { error: "No se puede eliminar: hay configuraciones de costos usando este tipo de embalaje" },
      400
    );
  }

  await c.env.DB.prepare("DELETE FROM tipos_embalaje WHERE id = ?")
    .bind(id)
    .run();

  return c.json({ success: true });
});
