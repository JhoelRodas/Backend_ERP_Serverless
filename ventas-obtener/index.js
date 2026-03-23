// ventas/obtener-ventas/index.js
// GET /api/ventas
// Lista todas las ventas con datos del cliente y total.

const { pool }   = require('../shared/db');
const { ok, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  try {
    const { rows } = await pool.query(
      `SELECT v.id, v.total, v.estado, v.creado_en,
              c.nombre AS cliente
       FROM   ventas v
       JOIN   clientes c ON c.id = v.cliente_id
       ORDER  BY v.creado_en DESC`
    );
    context.res = ok(rows);
  } catch (error) {
    context.log.error('Error al obtener ventas:', error.message);
    context.res = serverError(error);
  }
};
