// inventario/ajustar-stock/index.js
// PUT /api/inventario/stock/ajuste
// Ajuste manual de stock (entrada/salida de almacÃ©n).

const { pool }   = require('../shared/db');
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE inventario SET stock = stock + $1 WHERE producto_id = $2`,
      [delta, producto_id]
    );

    await client.query(
      `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, creado_en)
       VALUES ($1, $2, $3, $4, NOW())`,
      [producto_id, tipo, cantidad, motivo || 'Ajuste manual']
    );

    await client.query('COMMIT');
    context.res = ok({ message: `Stock ajustado correctamente (${tipo}: ${cantidad}).` });
  } catch (error) {
    await client.query('ROLLBACK');
    context.log.error('Error al ajustar stock:', error.message);
    context.res = serverError(error);
  } finally {
    client.release();
  }
};
