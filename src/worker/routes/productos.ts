import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";

export const productosRoutes = new Hono<{ Bindings: Env }>();

productosRoutes.use("*", authMiddleware);

// Get products for an embarque
productosRoutes.get("/:embarqueId", async (c) => {
  const embarqueId = c.req.param("embarqueId");

  try {
    const stmt = c.env.DB.prepare(`
      SELECT pe.*, 
        ce.fecha_embarque, 
        ce.fecha_arribo_puerto,
        b.nombre_barco,
        p.nombre_puerto as puerto_destino
      FROM productos_embarque pe
      LEFT JOIN calendario_embarques ce ON pe.id_calendario_embarque = ce.id
      LEFT JOIN barcos b ON ce.id_barco = b.id
      LEFT JOIN puertos p ON ce.id_puerto_destino = p.id
      WHERE pe.id_embarque = ?
      ORDER BY pe.created_at DESC
    `);

    const result = await stmt.bind(embarqueId).all();

    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching productos:", error);
    return c.json({ error: "Error al cargar productos" }, 500);
  }
});

// Helper function to check capacity
async function checkCalendarCapacity(db: any, calendarioId: number, newPeso: number, newVolumen: number, excludeProductId?: number) {
  // Get calendar capacity
  const calendario: any = await db.prepare(
    "SELECT cupo_total_peso, cupo_total_volumen FROM calendario_embarques WHERE id = ?"
  ).bind(calendarioId).first();

  if (!calendario) {
    return { valid: true }; // Calendar doesn't exist, let other validation handle it
  }

  // Get current usage (excluding the product being edited if applicable)
  let query = `
    SELECT 
      SUM(COALESCE(peso, 0)) as total_peso,
      SUM(COALESCE(volumen, 0)) as total_volumen
    FROM productos_embarque 
    WHERE id_calendario_embarque = ?
  `;
  const params: any[] = [calendarioId];

  if (excludeProductId) {
    query += " AND id != ?";
    params.push(excludeProductId);
  }

  const usage: any = await db.prepare(query).bind(...params).first();
  const currentPeso = usage?.total_peso || 0;
  const currentVolumen = usage?.total_volumen || 0;

  const newTotalPeso = currentPeso + newPeso;
  const newTotalVolumen = currentVolumen + newVolumen;

  const porcentajePeso = calendario.cupo_total_peso > 0 
    ? (newTotalPeso / calendario.cupo_total_peso) * 100 
    : 0;
  const porcentajeVolumen = calendario.cupo_total_volumen > 0 
    ? (newTotalVolumen / calendario.cupo_total_volumen) * 100 
    : 0;

  // Check if already at 100% before adding new product
  const currentPorcentajePeso = calendario.cupo_total_peso > 0 
    ? (currentPeso / calendario.cupo_total_peso) * 100 
    : 0;
  const currentPorcentajeVolumen = calendario.cupo_total_volumen > 0 
    ? (currentVolumen / calendario.cupo_total_volumen) * 100 
    : 0;

  // If calendar is already at 100%, don't allow new assignments
  if (currentPorcentajePeso >= 100 || currentPorcentajeVolumen >= 100) {
    const reasons = [];
    if (currentPorcentajePeso >= 100) reasons.push("PESO");
    if (currentPorcentajeVolumen >= 100) reasons.push("VOLUMEN");
    return {
      valid: false,
      error: `El embarque está lleno por ${reasons.join(" y ")}. No se pueden asignar más productos a este embarque programado.`,
      isFull: true,
      fullBy: reasons
    };
  }

  // Check if new product would exceed capacity
  if (porcentajePeso > 100 || porcentajeVolumen > 100) {
    const reasons = [];
    if (porcentajePeso > 100) reasons.push(`PESO (${porcentajePeso.toFixed(1)}%)`);
    if (porcentajeVolumen > 100) reasons.push(`VOLUMEN (${porcentajeVolumen.toFixed(1)}%)`);
    return {
      valid: false,
      error: `Capacidad excedida por ${reasons.join(" y ")}. No se puede superar el 100% de la capacidad.`
    };
  }

  return { valid: true };
}

// Add product to embarque
productosRoutes.post("/", async (c) => {
  const body = await c.req.json();

  try {
    // Check capacity if assigning to a calendar
    if (body.id_calendario_embarque) {
      const capacityCheck = await checkCalendarCapacity(
        c.env.DB,
        body.id_calendario_embarque,
        body.peso || 0,
        body.volumen || 0
      );

      if (!capacityCheck.valid) {
        return c.json({ error: capacityCheck.error }, 400);
      }
    }

    const stmt = c.env.DB.prepare(`
      INSERT INTO productos_embarque (
        id_embarque, descripcion, peso, volumen, 
        tipo_contenido, comercializadora, estado_producto, id_calendario_embarque
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt
      .bind(
        body.id_embarque,
        body.descripcion,
        body.peso || null,
        body.volumen || null,
        body.tipo_contenido || null,
        body.comercializadora || null,
        body.estado_producto || "Solicitado",
        body.id_calendario_embarque || null
      )
      .run();

    return c.json({ success: true }, 201);
  } catch (error) {
    console.error("Error creating producto:", error);
    return c.json({ error: "Error al crear producto" }, 500);
  }
});

// Update product
productosRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  try {
    // Get current product data
    const currentProduct: any = await c.env.DB.prepare(
      "SELECT * FROM productos_embarque WHERE id = ?"
    ).bind(id).first();

    if (!currentProduct) {
      return c.json({ error: "Producto no encontrado" }, 404);
    }

    // Check capacity if calendar assignment or weight/volume is changing
    const newCalendarioId = body.id_calendario_embarque !== undefined 
      ? body.id_calendario_embarque 
      : currentProduct.id_calendario_embarque;
    const newPeso = body.peso !== undefined ? body.peso : currentProduct.peso;
    const newVolumen = body.volumen !== undefined ? body.volumen : currentProduct.volumen;

    if (newCalendarioId) {
      const capacityCheck = await checkCalendarCapacity(
        c.env.DB,
        newCalendarioId,
        newPeso || 0,
        newVolumen || 0,
        parseInt(id)
      );

      if (!capacityCheck.valid) {
        return c.json({ error: capacityCheck.error }, 400);
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (body.descripcion !== undefined) {
      updates.push("descripcion = ?");
      values.push(body.descripcion);
    }
    if (body.peso !== undefined) {
      updates.push("peso = ?");
      values.push(body.peso);
    }
    if (body.volumen !== undefined) {
      updates.push("volumen = ?");
      values.push(body.volumen);
    }
    if (body.tipo_contenido !== undefined) {
      updates.push("tipo_contenido = ?");
      values.push(body.tipo_contenido);
    }
    if (body.comercializadora !== undefined) {
      updates.push("comercializadora = ?");
      values.push(body.comercializadora);
    }
    if (body.estado_producto !== undefined) {
      updates.push("estado_producto = ?");
      values.push(body.estado_producto);
    }
    if (body.id_calendario_embarque !== undefined) {
      updates.push("id_calendario_embarque = ?");
      values.push(body.id_calendario_embarque);
    }

    if (updates.length === 0) {
      return c.json({ error: "No hay campos para actualizar" }, 400);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = c.env.DB.prepare(`
      UPDATE productos_embarque 
      SET ${updates.join(", ")}
      WHERE id = ?
    `);

    await stmt.bind(...values).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating producto:", error);
    return c.json({ error: "Error al actualizar producto" }, 500);
  }
});

// Delete product
productosRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const stmt = c.env.DB.prepare("DELETE FROM productos_embarque WHERE id = ?");
    await stmt.bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting producto:", error);
    return c.json({ error: "Error al eliminar producto" }, 500);
  }
});
