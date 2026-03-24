// ventas/anular-venta/index.js
// DELETE /api/ventas/{id}/anular
// Anula una venta y revierte el stock descontado.

const { sql, poolPromise } = require('../shared/db');
const { ok, notFound, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const id = req.params.id;

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const ventaResult = await new sql.Request(transaction)
      .input('id', sql.Int, parseInt(id, 10))
      .query(`SELECT id, estado FROM ventas WHERE id = @id`);

    if (ventaResult.recordset.length === 0) {
      await transaction.rollback();
      context.res = notFound(`Venta con id ${id} no encontrada.`);
      return;
    }

    if (ventaResult.recordset[0].estado === 'ANULADA') {
      await transaction.rollback();
      context.res = notFound('La venta ya se encuentra anulada.');
      return;
    }

    // Revertir stock
    const detalleResult = await new sql.Request(transaction)
      .input('ventaId', sql.Int, parseInt(id, 10))
      .query(`SELECT producto_id, cantidad FROM detalle_venta WHERE venta_id = @ventaId`);

    for (const d of detalleResult.recordset) {
      await new sql.Request(transaction)
        .input('cantidad',   sql.Int, d.cantidad)
        .input('productoId', sql.Int, d.producto_id)
        .query(`UPDATE inventario SET stock = stock + @cantidad WHERE producto_id = @productoId`);
    }

    await new sql.Request(transaction)
      .input('id', sql.Int, parseInt(id, 10))
      .query(`UPDATE ventas SET estado = 'ANULADA' WHERE id = @id`);

    await transaction.commit();
    context.res = ok({ message: `Venta ${id} anulada y stock revertido.` });
  } catch (error) {
    await transaction.rollback();
    context.log.error('Error al anular venta:', error.message);
    context.res = serverError(error);
  }
};
