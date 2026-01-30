import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const embarquesRoutes = new Hono<{ Bindings: Env }>();

const createEmbarqueSchema = z.object({
  id_cliente: z.number(),
  notas: z.string().optional(),
});

const updateEmbarqueSchema = z.object({
  estado_actual: z.string().optional(),
  notas: z.string().optional(),
});

// Generar código de embarque único
function generarCodigoEmbarque(): string {
  const prefix = "CAR";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

// Obtener usuario actual con rol
async function obtenerUsuarioConRol(c: any) {
  const user = c.get("user");
  const usuario = await c.env.DB.prepare(
    "SELECT * FROM usuarios_app WHERE mocha_user_id = ?"
  )
    .bind(user.id)
    .first();

  if (!usuario) {
    // Crear usuario con rol cliente si no existe
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

// Listar todos los embarques según rol
embarquesRoutes.get("/", authMiddleware, async (c) => {
  const estado = c.req.query("estado");
  const id_cliente = c.req.query("id_cliente");
  const usuario: any = await obtenerUsuarioConRol(c);

  let query =
    "SELECT e.*, c.nombre as nombre_cliente, c.email as email_cliente FROM embarques e LEFT JOIN clientes c ON e.id_cliente = c.id";
  const params: any[] = [];
  const conditions: string[] = [];

  // Clientes solo ven sus propios embarques
  if (usuario.rol === "cliente") {
    conditions.push("e.id_usuario_cliente = ?");
    params.push(usuario.mocha_user_id);
  }

  if (estado) {
    conditions.push("e.estado_actual = ?");
    params.push(estado);
  }

  if (id_cliente) {
    conditions.push("e.id_cliente = ?");
    params.push(parseInt(id_cliente));
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY e.created_at DESC";

  const { results } = await c.env.DB.prepare(query)
    .bind(...params)
    .all();

  // Para clientes, solo mostrar estado final si está entregado
  if (usuario.rol === "cliente") {
    return c.json(
      results.map((e: any) => ({
        ...e,
        estado_actual:
          e.estado_actual === "Entregado" ? "Entregado" : "En proceso",
      }))
    );
  }

  return c.json(results);
});

// Obtener un embarque por ID
embarquesRoutes.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const usuario: any = await obtenerUsuarioConRol(c);

  const embarque = await c.env.DB.prepare(
    "SELECT e.*, c.nombre as nombre_cliente, c.email as email_cliente, c.telefono, c.direccion_destino FROM embarques e LEFT JOIN clientes c ON e.id_cliente = c.id WHERE e.id = ?"
  )
    .bind(id)
    .first();

  if (!embarque) {
    return c.json({ error: "Embarque no encontrado" }, 404);
  }

  // Verificar permisos: clientes solo ven sus propios embarques
  if (
    usuario.rol === "cliente" &&
    (embarque as any).id_usuario_cliente !== usuario.mocha_user_id
  ) {
    return c.json({ error: "Acceso denegado" }, 403);
  }

  // Obtener productos del embarque
  const { results: productos } = await c.env.DB.prepare(
    "SELECT * FROM productos_embarque WHERE id_embarque = ? ORDER BY created_at DESC"
  )
    .bind(id)
    .all();

  // Obtener documentos del embarque
  const { results: documentos } = await c.env.DB.prepare(
    "SELECT * FROM documentos WHERE id_embarque = ? ORDER BY created_at DESC"
  )
    .bind(id)
    .all();

  // Para clientes, filtrar el estado
  let embarqueData: any = { ...embarque, productos, documentos };
  if (usuario.rol === "cliente") {
    embarqueData.estado_actual =
      embarqueData.estado_actual === "Entregado" ? "Entregado" : "En proceso";
  }

  return c.json(embarqueData);
});

// Crear un nuevo embarque
embarquesRoutes.post(
  "/",
  authMiddleware,
  zValidator("json", createEmbarqueSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");
    const usuario: any = await obtenerUsuarioConRol(c);
    const codigo_embarque = generarCodigoEmbarque();

    // Clientes siempre crean embarques en estado "Solicitado"
    const estado_inicial = "Solicitado";

    const result = await c.env.DB.prepare(
      "INSERT INTO embarques (codigo_embarque, id_cliente, id_usuario_cliente, estado_actual, notas) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        codigo_embarque,
        data.id_cliente,
        usuario.mocha_user_id,
        estado_inicial,
        data.notas || ""
      )
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "CREATE",
        "embarques",
        result.meta.last_row_id,
        JSON.stringify({ codigo_embarque })
      )
      .run();

    const embarque = await c.env.DB.prepare(
      "SELECT * FROM embarques WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(embarque, 201);
  }
);

// Actualizar un embarque
embarquesRoutes.patch(
  "/:id",
  authMiddleware,
  zValidator("json", updateEmbarqueSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user");
    const usuario: any = await obtenerUsuarioConRol(c);

    // Verificar permisos
    const embarque: any = await c.env.DB.prepare(
      "SELECT * FROM embarques WHERE id = ?"
    )
      .bind(id)
      .first();

    if (!embarque) {
      return c.json({ error: "Embarque no encontrado" }, 404);
    }

    // Clientes no pueden modificar estados, solo operadores y administradores
    if (usuario.rol === "cliente") {
      return c.json(
        { error: "Los clientes no pueden modificar embarques" },
        403
      );
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.estado_actual !== undefined) {
      updates.push("estado_actual = ?");
      params.push(data.estado_actual);

      if (data.estado_actual === "Entregado") {
        updates.push("fecha_completado = ?");
        params.push(new Date().toISOString());
      }
    }

    if (data.notas !== undefined) {
      updates.push("notas = ?");
      params.push(data.notas);
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await c.env.DB.prepare(
      `UPDATE embarques SET ${updates.join(", ")} WHERE id = ?`
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
        "embarques",
        id,
        JSON.stringify(data)
      )
      .run();

    const embarqueActualizado = await c.env.DB.prepare(
      "SELECT * FROM embarques WHERE id = ?"
    )
      .bind(id)
      .first();

    return c.json(embarqueActualizado);
  }
);

// Eliminar un embarque (solo operadores y administradores)
embarquesRoutes.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const usuario: any = await obtenerUsuarioConRol(c);

  // Solo operadores y administradores pueden eliminar
  if (usuario.rol === "cliente") {
    return c.json({ error: "Acceso denegado" }, 403);
  }

  await c.env.DB.prepare("DELETE FROM embarques WHERE id = ?")
    .bind(id)
    .run();

  // Registrar en logs
  await c.env.DB.prepare(
    "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(user?.id || "system", "DELETE", "embarques", id, "{}")
    .run();

  return c.json({ success: true });
});
