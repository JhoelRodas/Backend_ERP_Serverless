// clientes/obtener-clientes/index.js
// GET /api/clientes

const { pool }   = require('../shared/db');
const { ok, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const search = req.query.q;

  try {
    const query = search
      ? `SELECT id, nombre, email, telefono, ruc, creado_en
         FROM clientes
         WHERE nombre ILIKE $1 OR email ILIKE $1 OR ruc ILIKE $1
         ORDER BY nombre ASC`
      : `SELECT id, nombre, email, telefono, ruc, creado_en
         FROM clientes
         ORDER BY nombre ASC`;

    const params = search ? [`%${search}%`] : [];
    const { rows } = await pool.query(query, params);
    context.res = ok(rows);
  } catch (error) {
    context.log.error('Error al obtener clientes:', error.message);
    context.res = serverError(error);
  }
};
