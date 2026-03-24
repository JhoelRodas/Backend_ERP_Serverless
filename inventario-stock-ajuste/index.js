// inventario/ajustar-stock/index.js
// PUT /api/inventario/stock/ajuste
// Ajuste manual de stock (entrada/salida de almacÃ©n).

const { sql, poolPromise } = require('../shared/db');
const { ok, badRequest, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const { producto_id, cantidad, tipo, motivo } = req.body || {};

  if (!producto_id || cantidad === undefined || !tipo) {
    context.res = badRequest('producto_id, cantidad y tipo (ENTRADA|SALIDA) son requeridos.');
    return;
  }

  if (!['ENTRADA', 'SALIDA'].includes(tipo)) {
    context.res = badRequest("tipo debe ser 'ENTRADA' o 'SALIDA'.");
    return;
  }

  const delta = tipo === 'ENTRADA' ? cantidad : -cantidad;

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    await new sql.Request(transaction)
      .input('delta',      sql.Int, delta)
      .input('productoId', sql.Int, producto_id)
      .query(`UPDATE inventario SET stock = stock + @delta WHERE producto_id = @productoId`);

    await new sql.Request(transaction)
      .input('productoId', sql.Int,      producto_id)
      .input('tipo',       sql.NVarChar, tipo)
      .input('cantidad',   sql.Int,      cantidad)
      .input('motivo',     sql.NVarChar, motivo || 'Ajuste manual')
      .query(`INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, creado_en)
              VALUES (@productoId, @tipo, @cantidad, @motivo, GETDATE())`);

    await transaction.commit();
    context.res = ok({ message: `Stock ajustado correctamente (${tipo}: ${cantidad}).` });
  } catch (error) {
    await transaction.rollback();
    context.log.error('Error al ajustar stock:', error.message);
    context.res = serverError(error);
  }
};
