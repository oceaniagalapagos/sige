import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

// Get services for an embarque
app.get("/:id_embarque", async (c) => {
  const { id_embarque } = c.req.param();
  
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        es.*,
        cc.tipo_servicio,
        cc.descripcion as descripcion_servicio,
        cc.unidad_medida
      FROM embarques_servicios es
      LEFT JOIN configuracion_costos cc ON es.id_servicio = cc.id
      WHERE es.id_embarque = ?
      ORDER BY es.created_at DESC
    `).bind(id_embarque).all();

    return c.json(result.results);
  } catch (error) {
    console.error("Error fetching embarque services:", error);
    return c.json({ error: "Error al obtener servicios" }, 500);
  }
});

// Add service to embarque
app.post("/", async (c) => {
  try {
    const { id_embarque, id_servicio, cantidad, costo_unitario, notas } = await c.req.json();
    
    const costo_total = cantidad * costo_unitario;

    const result = await c.env.DB.prepare(`
      INSERT INTO embarques_servicios (
        id_embarque, id_servicio, cantidad, costo_unitario, costo_total, notas
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id_embarque,
      id_servicio,
      cantidad,
      costo_unitario,
      costo_total,
      notas || null
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  } catch (error) {
    console.error("Error creating embarque service:", error);
    return c.json({ error: "Error al agregar servicio" }, 500);
  }
});

// Update service
app.patch("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const { cantidad, costo_unitario, notas } = await c.req.json();
    
    const costo_total = cantidad * costo_unitario;

    await c.env.DB.prepare(`
      UPDATE embarques_servicios 
      SET cantidad = ?, 
          costo_unitario = ?,
          costo_total = ?,
          notas = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(cantidad, costo_unitario, costo_total, notas || null, id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating embarque service:", error);
    return c.json({ error: "Error al actualizar servicio" }, 500);
  }
});

// Delete service
app.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    await c.env.DB.prepare(
      "DELETE FROM embarques_servicios WHERE id = ?"
    ).bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting embarque service:", error);
    return c.json({ error: "Error al eliminar servicio" }, 500);
  }
});

export default app;
