// clientes/obtener-clientes/index.js
// GET /api/clientes

const { sql, poolPromise } = require('../shared/db');
const { ok, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const search = req.query.q;

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query;

    if (search) {
      request.input('search', sql.NVarChar, `%${search}%`);
      query = `SELECT id, nombre, email, telefono, ruc, creado_en
               FROM clientes
               WHERE nombre LIKE @search OR email LIKE @search OR ruc LIKE @search
               ORDER BY nombre ASC`;
    } else {
      query = `SELECT id, nombre, email, telefono, ruc, creado_en
               FROM clientes
               ORDER BY nombre ASC`;
    }

    const result = await request.query(query);
    context.res = ok(result.recordset);
  } catch (error) {
    context.log.error('Error al obtener clientes:', error.message);
    context.res = serverError(error);
  }
};
