// inventario/movimiento-inventario/index.js
// GET /api/inventario/movimientos
// Retorna el historial de movimientos de inventario.

const { pool }   = require('../shared/db');
const { ok, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const productoId = req.query.producto_id;

  try {
    const query = productoId
      ? `SELECT m.id, m.tipo, m.cantidad, m.motivo, m.creado_en,
                p.nombre AS producto
         FROM   movimientos_inventario m
         JOIN   productos p ON p.id = m.producto_id
         WHERE  m.producto_id = $1
         ORDER  BY m.creado_en DESC`
      : `SELECT m.id, m.tipo, m.cantidad, m.motivo, m.creado_en,
                p.nombre AS producto
         FROM   movimientos_inventario m
         JOIN   productos p ON p.id = m.producto_id
         ORDER  BY m.creado_en DESC`;

    const params = productoId ? [productoId] : [];
    const { rows } = await pool.query(query, params);
    context.res = ok(rows);
  } catch (error) {
    context.log.error('Error al obtener movimientos:', error.message);
    context.res = serverError(error);
  }
};
