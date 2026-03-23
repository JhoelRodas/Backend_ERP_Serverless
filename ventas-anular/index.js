// ventas/anular-venta/index.js
// DELETE /api/ventas/{id}/anular
// Anula una venta y revierte el stock descontado.

const { pool }   = require('../shared/db');
const { ok, notFound, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const id = req.params.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT id, estado FROM ventas WHERE id = $1`, [id]
    );

    if (rows.length === 0) {
      context.res = notFound(`Venta con id ${id} no encontrada.`);
      await client.query('ROLLBACK');
      return;
    }

    if (rows[0].estado === 'ANULADA') {
      context.res = notFound('La venta ya se encuentra anulada.');
      await client.query('ROLLBACK');
      return;
    }

    // Revertir stock
    const { rows: detalle } = await client.query(
      `SELECT producto_id, cantidad FROM detalle_venta WHERE venta_id = $1`, [id]
    );
    for (const d of detalle) {
      await client.query(
        `UPDATE inventario SET stock = stock + $1 WHERE producto_id = $2`,
        [d.cantidad, d.producto_id]
      );
    }

    await client.query(
      `UPDATE ventas SET estado = 'ANULADA' WHERE id = $1`, [id]
    );

    await client.query('COMMIT');
    context.res = ok({ message: `Venta ${id} anulada y stock revertido.` });
  } catch (error) {
    await client.query('ROLLBACK');
    context.log.error('Error al anular venta:', error.message);
    context.res = serverError(error);
  } finally {
    client.release();
  }
};
