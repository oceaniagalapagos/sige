import { Env, Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const usuariosRoutes = new Hono<{ Bindings: Env }>();

const createUsuarioSchema = z.object({
  mocha_user_id: z.string(),
  email: z.string().email(),
  nombre: z.string().min(1),
  rol: z.enum(["cliente", "operador", "administrador"]),
});

const updateUsuarioSchema = z.object({
  nombre: z.string().min(1).optional(),
  rol: z.enum(["cliente", "operador", "administrador"]).optional(),
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

// Obtener o crear usuario actual
usuariosRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Usuario no autenticado" }, 401);
  }

  let usuario = await c.env.DB.prepare(
    "SELECT * FROM usuarios_app WHERE mocha_user_id = ?"
  )
    .bind(user.id)
    .first();

  // Si no existe, crear usuario con rol "cliente" por defecto
  if (!usuario) {
    const nombre = user.google_user_data?.name || user.email.split("@")[0];
    await c.env.DB.prepare(
      "INSERT INTO usuarios_app (mocha_user_id, email, nombre, rol) VALUES (?, ?, ?, ?)"
    )
      .bind(user.id, user.email, nombre, "cliente")
      .run();

    usuario = await c.env.DB.prepare(
      "SELECT * FROM usuarios_app WHERE mocha_user_id = ?"
    )
      .bind(user.id)
      .first();
  }

  return c.json(usuario);
});

// Listar todos los usuarios (solo admin)
usuariosRoutes.get("/", authMiddleware, adminOnly, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM usuarios_app ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

// Crear usuario (solo admin)
usuariosRoutes.post(
  "/",
  authMiddleware,
  adminOnly,
  zValidator("json", createUsuarioSchema),
  async (c) => {
    const data = c.req.valid("json");

    const result = await c.env.DB.prepare(
      "INSERT INTO usuarios_app (mocha_user_id, email, nombre, rol) VALUES (?, ?, ?, ?)"
    )
      .bind(data.mocha_user_id, data.email, data.nombre, data.rol)
      .run();

    const usuario = await c.env.DB.prepare(
      "SELECT * FROM usuarios_app WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(usuario, 201);
  }
);

// Actualizar usuario (solo admin)
usuariosRoutes.patch(
  "/:id",
  authMiddleware,
  adminOnly,
  zValidator("json", updateUsuarioSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const updates: string[] = [];
    const params: any[] = [];

    if (data.nombre !== undefined) {
      updates.push("nombre = ?");
      params.push(data.nombre);
    }

    if (data.rol !== undefined) {
      updates.push("rol = ?");
      params.push(data.rol);
    }

    if (data.is_activo !== undefined) {
      updates.push("is_activo = ?");
      params.push(data.is_activo ? 1 : 0);
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await c.env.DB.prepare(
      `UPDATE usuarios_app SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...params)
      .run();

    const usuario = await c.env.DB.prepare(
      "SELECT * FROM usuarios_app WHERE id = ?"
    )
      .bind(id)
      .first();

    return c.json(usuario);
  }
);

// Eliminar usuario (solo admin)
usuariosRoutes.delete("/:id", authMiddleware, adminOnly, async (c) => {
  const id = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM usuarios_app WHERE id = ?")
    .bind(id)
    .run();

  return c.json({ success: true });
});
