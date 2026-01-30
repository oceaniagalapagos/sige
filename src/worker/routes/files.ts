import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";

export const filesRoutes = new Hono<{ Bindings: Env }>();

// Subir archivo a R2
filesRoutes.post("/upload", authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const embarqueId = formData.get("embarque_id") as string;

    if (!file) {
      return c.json({ error: "No se proporcionó archivo" }, 400);
    }

    if (!embarqueId) {
      return c.json({ error: "embarque_id es requerido" }, 400);
    }

    // Generar un nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `embarques/${embarqueId}/${timestamp}-${sanitizedFileName}`;

    // Subir archivo a R2
    await c.env.R2_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return c.json({
      success: true,
      key,
      filename: file.name,
      url: `/api/files/${key}`,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return c.json({ error: "Error al subir archivo" }, 500);
  }
});

// Descargar archivo de R2
filesRoutes.get("/*", async (c) => {
  try {
    const key = c.req.path.replace("/api/files/", "");
    
    const object = await c.env.R2_BUCKET.get(key);

    if (!object) {
      return c.json({ error: "Archivo no encontrado" }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    return c.body(object.body, { headers });
  } catch (error) {
    console.error("Error downloading file:", error);
    return c.json({ error: "Error al descargar archivo" }, 500);
  }
});

// Eliminar archivo de R2
filesRoutes.delete("/:key", authMiddleware, async (c) => {
  try {
    const key = decodeURIComponent(c.req.param("key"));
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autenticado" }, 401);
    }

    // Verificar que el usuario es operador o administrador
    const usuario: any = await c.env.DB.prepare(
      "SELECT rol FROM usuarios_app WHERE mocha_user_id = ?"
    )
      .bind(user.id)
      .first();

    if (!usuario || usuario.rol === "cliente") {
      return c.json({ error: "Acceso denegado" }, 403);
    }

    await c.env.R2_BUCKET.delete(key);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return c.json({ error: "Error al eliminar archivo" }, 500);
  }
});
