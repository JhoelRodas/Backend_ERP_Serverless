// productos/obtener-productos/index.js
// GET /api/productos

const { pool }   = require('../shared/db');
const { ok, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.codigo, p.descripcion, p.precio,
              c.nombre AS categoria,
              COALESCE(i.stock, 0) AS stock
       FROM   productos p
       LEFT   JOIN categorias c    ON c.id = p.categoria_id
       LEFT   JOIN inventario i    ON i.producto_id = p.id
       ORDER  BY p.nombre ASC`
    );
    context.res = ok(rows);
  } catch (error) {
    context.log.error('Error al obtener productos:', error.message);
    context.res = serverError(error);
  }
};
