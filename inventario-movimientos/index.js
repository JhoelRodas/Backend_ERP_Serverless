// inventario/movimiento-inventario/index.js
// GET /api/inventario/movimientos
// Retorna el historial de movimientos de inventario.

const { sql, poolPromise } = require('../shared/db');
const { ok, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const productoId = req.query.producto_id;

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query;

    if (productoId) {
      request.input('productoId', sql.Int, parseInt(productoId, 10));
      query = `SELECT m.id, m.tipo, m.cantidad, m.motivo, m.creado_en,
                      p.nombre AS producto
               FROM   movimientos_inventario m
               JOIN   productos p ON p.id = m.producto_id
               WHERE  m.producto_id = @productoId
               ORDER  BY m.creado_en DESC`;
    } else {
      query = `SELECT m.id, m.tipo, m.cantidad, m.motivo, m.creado_en,
                      p.nombre AS producto
               FROM   movimientos_inventario m
               JOIN   productos p ON p.id = m.producto_id
               ORDER  BY m.creado_en DESC`;
    }

    const result = await request.query(query);
    context.res = ok(result.recordset);
  } catch (error) {
    context.log.error('Error al obtener movimientos:', error.message);
    context.res = serverError(error);
  }
};
