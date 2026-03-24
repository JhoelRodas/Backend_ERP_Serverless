// inventario/obtener-stock/index.js
// GET /api/inventario/stock
// Retorna el stock actual de todos los productos.

const { poolPromise } = require('../shared/db');
const { ok, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(
      `SELECT i.id, i.stock, i.stock_minimo,
              p.nombre AS producto, p.codigo AS sku
       FROM   inventario i
       JOIN   productos p ON p.id = i.producto_id
       ORDER  BY p.nombre ASC`
    );
    context.res = ok(result.recordset);
  } catch (error) {
    context.log.error('Error al obtener stock:', error.message);
    context.res = serverError(error);
  }
};
