import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const transportesRoutes = new Hono<{ Bindings: Env }>();

const createBarcoSchema = z.object({
  nombre_barco: z.string().min(1),
  capacidad_peso: z.number().optional(),
  capacidad_volumen: z.number().optional(),
  id_tipo_transporte: z.number().optional(),
});

const updateBarcoSchema = z.object({
  nombre_barco: z.string().min(1).optional(),
  capacidad_peso: z.number().optional(),
  capacidad_volumen: z.number().optional(),
  id_tipo_transporte: z.number().nullable().optional(),
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

// Listar todos los transportes (todos los usuarios pueden ver)
transportesRoutes.get("/", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT b.*, tt.nombre_tipo as tipo_transporte_nombre 
     FROM barcos b 
     LEFT JOIN tipos_transporte tt ON b.id_tipo_transporte = tt.id 
     ORDER BY b.nombre_barco ASC`
  ).all();

  return c.json(results);
});

// Obtener un transporte por ID (todos los usuarios pueden ver)
transportesRoutes.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const barco = await c.env.DB.prepare(
    `SELECT b.*, tt.nombre_tipo as tipo_transporte_nombre 
     FROM barcos b 
     LEFT JOIN tipos_transporte tt ON b.id_tipo_transporte = tt.id 
     WHERE b.id = ?`
  )
    .bind(id)
    .first();

  if (!barco) {
    return c.json({ error: "Transporte no encontrado" }, 404);
  }

  return c.json(barco);
});

// Crear un nuevo transporte (solo administradores)
transportesRoutes.post(
  "/",
  authMiddleware,
  adminOnly,
  zValidator("json", createBarcoSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");

    const result = await c.env.DB.prepare(
      "INSERT INTO barcos (nombre_barco, capacidad_peso, capacidad_volumen, id_tipo_transporte) VALUES (?, ?, ?, ?)"
    )
      .bind(
        data.nombre_barco,
        data.capacidad_peso || null,
        data.capacidad_volumen || null,
        data.id_tipo_transporte || null
      )
      .run();

    // Registrar en logs
    await c.env.DB.prepare(
      "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        user?.id || "system",
        "CREATE",
        "barcos",
        result.meta.last_row_id,
        JSON.stringify(data)
      )
      .run();

    const barco = await c.env.DB.prepare("SELECT * FROM barcos WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return c.json(barco, 201);
  }
);

// Actualizar un transporte (solo administradores)
transportesRoutes.patch(
  "/:id",
  authMiddleware,
  adminOnly,
  zValidator("json", updateBarcoSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user");

    const updates: string[] = [];
    const params: any[] = [];

    if (data.nombre_barco !== undefined) {
      updates.push("nombre_barco = ?");
      params.push(data.nombre_barco);
    }

    if (data.capacidad_peso !== undefined) {
      updates.push("capacidad_peso = ?");
      params.push(data.capacidad_peso);
    }

    if (data.capacidad_volumen !== undefined) {
      updates.push("capacidad_volumen = ?");
      params.push(data.capacidad_volumen);
    }

    if (data.id_tipo_transporte !== undefined) {
      updates.push("id_tipo_transporte = ?");
      params.push(data.id_tipo_transporte);
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await c.env.DB.prepare(
      `UPDATE barcos SET ${updates.join(", ")} WHERE id = ?`
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
        "barcos",
        id,
        JSON.stringify(data)
      )
      .run();

    const barco = await c.env.DB.prepare("SELECT * FROM barcos WHERE id = ?")
      .bind(id)
      .first();

    return c.json(barco);
  }
);

// Eliminar un transporte (solo administradores)
transportesRoutes.delete("/:id", authMiddleware, adminOnly, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  await c.env.DB.prepare("DELETE FROM barcos WHERE id = ?")
    .bind(id)
    .run();

  // Registrar en logs
  await c.env.DB.prepare(
    "INSERT INTO logs_sistema (id_usuario, accion, tabla_afectada, registro_afectado, detalles) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(user?.id || "system", "DELETE", "barcos", id, "{}")
    .run();

  return c.json({ success: true });
});
