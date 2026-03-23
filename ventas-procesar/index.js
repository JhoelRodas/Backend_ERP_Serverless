// ventas/procesar-venta/index.js
// POST /api/ventas
// Registra una venta, descuenta stock y genera la factura.

const { pool }   = require('../shared/db');
const { created, badRequest, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const { cliente_id, items } = req.body || {};

  if (!cliente_id || !Array.isArray(items) || items.length === 0) {
    context.res = badRequest('cliente_id e items son requeridos.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Calcular total
    let total = 0;
    for (const item of items) {
      total += item.cantidad * item.precio_unitario;
    }

    // Insertar cabecera de venta
    const { rows } = await client.query(
      `INSERT INTO ventas (cliente_id, total, estado, creado_en)
       VALUES ($1, $2, 'COMPLETADA', NOW())
       RETURNING id`,
      [cliente_id, total]
    );
    const ventaId = rows[0].id;

    // Insertar detalle y descontar stock
    for (const item of items) {
      await client.query(
        `INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [ventaId, item.producto_id, item.cantidad, item.precio_unitario]
      );

      await client.query(
        `UPDATE inventario SET stock = stock - $1 WHERE producto_id = $2`,
        [item.cantidad, item.producto_id]
      );
    }

    await client.query('COMMIT');
    context.res = created({ id: ventaId, total, message: 'Venta procesada exitosamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    context.log.error('Error al procesar venta:', error.message);
    context.res = serverError(error);
  } finally {
    client.release();
  }
};
