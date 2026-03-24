// ventas/procesar-venta/index.js
// POST /api/ventas
// Registra una venta, descuenta stock y genera la factura.

const { sql, poolPromise } = require('../shared/db');
const { created, badRequest, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const { cliente_id, items } = req.body || {};

  if (!cliente_id || !Array.isArray(items) || items.length === 0) {
    context.res = badRequest('cliente_id e items son requeridos.');
    return;
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    // Calcular total
    let total = 0;
    for (const item of items) {
      total += item.cantidad * item.precio_unitario;
    }

    // Insertar cabecera de venta
    const insertVenta = await new sql.Request(transaction)
      .input('clienteId', sql.Int,           cliente_id)
      .input('total',     sql.Decimal(10,2), total)
      .query(`INSERT INTO ventas (cliente_id, total, estado, creado_en)
              OUTPUT INSERTED.id
              VALUES (@clienteId, @total, 'COMPLETADA', GETDATE())`);
    const ventaId = insertVenta.recordset[0].id;

    // Insertar detalle y descontar stock
    for (const item of items) {
      await new sql.Request(transaction)
        .input('ventaId',        sql.Int,           ventaId)
        .input('productoId',     sql.Int,           item.producto_id)
        .input('cantidad',       sql.Int,           item.cantidad)
        .input('precioUnitario', sql.Decimal(10,2), item.precio_unitario)
        .query(`INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario)
                VALUES (@ventaId, @productoId, @cantidad, @precioUnitario)`);

      await new sql.Request(transaction)
        .input('cantidad',   sql.Int, item.cantidad)
        .input('productoId', sql.Int, item.producto_id)
        .query(`UPDATE inventario SET stock = stock - @cantidad WHERE producto_id = @productoId`);
    }

    await transaction.commit();
    context.res = created({ id: ventaId, total, message: 'Venta procesada exitosamente.' });
  } catch (error) {
    await transaction.rollback();
    context.log.error('Error al procesar venta:', error.message);
    context.res = serverError(error);
  }
};
