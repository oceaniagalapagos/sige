import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const documentosRoutes = new Hono<{ Bindings: Env }>();

const createDocumentoSchema = z.object({
  id_embarque: z.number(),
  tipo_documento: z.string(),
  archivo_url: z.string(),
  nombre_archivo: z.string(),
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

// Listar documentos de un embarque
documentosRoutes.get("/", authMiddleware, async (c) => {
  const id_embarque = c.req.query("id_embarque");
  const usuario: any = await obtenerUsuarioConRol(c);

  if (!id_embarque) {
    return c.json({ error: "id_embarque es requerido" }, 400);
  }

  // Verificar permisos: clientes solo ven documentos de sus embarques
  if (usuario.rol === "cliente") {
    const embarque: any = await c.env.DB.prepare(
      "SELECT id_usuario_cliente FROM embarques WHERE id = ?"
    )
      .bind(parseInt(id_embarque))
      .first();

    if (!embarque || embarque.id_usuario_cliente !== usuario.mocha_user_id) {
      return c.json({ error: "Acceso denegado" }, 403);
    }
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM documentos WHERE id_embarque = ? ORDER BY created_at DESC"
  )
    .bind(parseInt(id_embarque))
    .all();

  return c.json(results);
});

// Crear un nuevo documento
documentosRoutes.post(
  "/",
  authMiddleware,
  zValidator("json", createDocumentoSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");
    const usuario: any = await obtenerUsuarioConRol(c);

    // Obtener el embarque para verificar permisos
    const embarque: any = await c.env.DB.prepare(
      "SELECT estado_actual, id_usuario_cliente FROM embarques WHERE id = ?"
    )
      .bind(data.id_embarque)
      .first();

    if (!embarque) {
      return c.json({ error: "Embarque no encontrado" }, 404);
    }

    // Clientes solo pueden subir documentos a sus propios embarques
    if (
      usuario.rol === "cliente" &&
      embarque.id_usuario_cliente !== usuario.mocha_user_id
    ) {
      return c.json({ error: "Acceso denegado" }, 403);
    }

    const estado_embarque_al_cargar = embarque.estado_actual;

    const result = await c.env.DB.prepare(
      "INSERT INTO documentos (id_embarque, tipo_documento, archivo_url, nombre_archivo, estado_embarque_al_cargar) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        data.id_embarque,
        data.tipo_documento,
        data.archivo_url,
        data.nombre_archivo,
        estado_embarque_al_cargar
      )
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "CREATE",
        "documentos",
        result.meta.last_row_id,
        JSON.stringify(data)
      )
      .run();

    const documento = await c.env.DB.prepare(
      "SELECT * FROM documentos WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json(documento, 201);
  }
);

// Eliminar un documento (solo operadores y administradores)
documentosRoutes.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const usuario: any = await obtenerUsuarioConRol(c);

  // Solo operadores y administradores pueden eliminar documentos
  if (usuario.rol === "cliente") {
    return c.json({ error: "Acceso denegado" }, 403);
  }

  await c.env.DB.prepare("DELETE FROM documentos WHERE id = ?")
    .bind(id)
    .run();

  // Registrar en logs
  await c.env.DB.prepare(
    "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(user?.id || "system", "DELETE", "documentos", id, "{}")
    .run();

  return c.json({ success: true });
});
