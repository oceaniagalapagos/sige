import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const clientesRoutes = new Hono<{ Bindings: Env }>();

const createClienteSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().optional(),
  direccion_destino: z.string().optional(),
  whatsapp: z.string().optional(),
});

const updateClienteSchema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  direccion_destino: z.string().optional(),
  whatsapp: z.string().optional(),
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

// Listar todos los clientes (solo operadores y administradores)
clientesRoutes.get("/", authMiddleware, async (c) => {
  const usuario: any = await obtenerUsuarioConRol(c);

  // Solo operadores y administradores pueden listar clientes
  if (usuario.rol === "clientes") {
    return c.json({ error: "Acceso denegado" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM clientes ORDER BY nombre ASC"
  ).all();

  return c.json(results);
});

// Obtener un cliente por ID
clientesRoutes.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const usuario: any = await obtenerUsuarioConRol(c);

  // Solo operadores y administradores pueden ver detalles de clientes
  if (usuario.rol === "cliente") {
    return c.json({ error: "Acceso denegado" }, 403);
  }

  const cliente = await c.env.DB.prepare("SELECT * FROM clientes WHERE id = ?")
    .bind(id)
    .first();

  if (!cliente) {
    return c.json({ error: "Cliente no encontrado" }, 404);
  }

  // Obtener embarques del cliente
  const { results: embarques } = await c.env.DB.prepare(
    "SELECT * FROM embarques WHERE id_cliente = ? ORDER BY created_at DESC"
  )
    .bind(id)
    .all();

  return c.json({
    ...cliente,
    embarques,
  });
});

// Crear un nuevo cliente (solo operadores y administradores)
clientesRoutes.post(
  "/",
  authMiddleware,
  zValidator("json", createClienteSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");
    const usuario: any = await obtenerUsuarioConRol(c);

    // Solo operadores y administradores pueden crear clientes
    if (usuario.rol === "cliente") {
      return c.json({ error: "Acceso denegado" }, 403);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO clientes (nombre, email, telefono, direccion_destino, whatsapp) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        data.nombre,
        data.email,
        data.telefono || null,
        data.direccion_destino || null,
        data.whatsapp || null
      )
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "CREATE",
        "clientes",
        result.meta.last_row_id,
        JSON.stringify(data)
      )
      .run();

    const cliente = await c.env.DB.prepare(
      "SELECT * FROM clientes WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(cliente, 201);
  }
);

// Actualizar un cliente (solo operadores y administradores)
clientesRoutes.patch(
  "/:id",
  authMiddleware,
  zValidator("json", updateClienteSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user");
    const usuario: any = await obtenerUsuarioConRol(c);

    // Solo operadores y administradores pueden editar clientes
    if (usuario.rol === "cliente") {
      return c.json({ error: "Acceso denegado" }, 403);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.nombre !== undefined) {
      updates.push("nombre = ?");
      params.push(data.nombre);
    }

    if (data.email !== undefined) {
      updates.push("email = ?");
      params.push(data.email);
    }

    if (data.telefono !== undefined) {
      updates.push("telefono = ?");
      params.push(data.telefono);
    }

    if (data.direccion_destino !== undefined) {
      updates.push("direccion_destino = ?");
      params.push(data.direccion_destino);
    }

    if (data.whatsapp !== undefined) {
      updates.push("whatsapp = ?");
      params.push(data.whatsapp);
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await c.env.DB.prepare(
      `UPDATE clientes SET ${updates.join(", ")} WHERE id = ?`
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
        "clientes",
        id,
        JSON.stringify(data)
      )
      .run();

    const cliente = await c.env.DB.prepare(
      "SELECT * FROM clientes WHERE id = ?"
    )
      .bind(id)
      .first();

    return c.json(cliente);
  }
);

// Eliminar un cliente (solo operadores y administradores)
clientesRoutes.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const usuario: any = await obtenerUsuarioConRol(c);

  // Solo operadores y administradores pueden eliminar clientes
  if (usuario.rol === "cliente") {
    return c.json({ error: "Acceso denegado" }, 403);
  }

  // Verificar si el cliente tiene embarques
  const { results } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM embarques WHERE id_cliente = ?"
  )
    .bind(id)
    .all();

  if (results[0] && (results[0] as any).count > 0) {
    return c.json(
      { error: "No se puede eliminar un cliente con embarques activos" },
      400
    );
  }

  await c.env.DB.prepare("DELETE FROM clientes WHERE id = ?")
    .bind(id)
    .run();

  // Registrar en logs
  await c.env.DB.prepare(
    "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(user?.id || "system", "DELETE", "clientes", id, "{}")
    .run();

  return c.json({ success: true });
});
