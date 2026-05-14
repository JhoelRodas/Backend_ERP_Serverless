// clientes/crear-cliente/index.js
// POST /api/clientes

const { sql, poolPromise } = require('../shared/db');
const { created, badRequest, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const { nombre, email, telefono, direccion } = req.body || {};

  if (!nombre || !email) {
    context.res = badRequest('nombre y email son requeridos.');
    return;
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('nombre',    sql.NVarChar, nombre)
      .input('email',     sql.NVarChar, email)
      .input('telefono',  sql.NVarChar, telefono  ?? null)
      .input('direccion', sql.NVarChar, direccion ?? null)
      .query(`INSERT INTO clientes (nombre, email, telefono, direccion, creado_en)
              OUTPUT INSERTED.id
              VALUES (@nombre, @email, @telefono, @direccion, GETDATE())`);

    context.res = created({ id: result.recordset[0].id, message: 'Cliente creado exitosamente.' });
  } catch (error) {
    context.log.error('Error al crear cliente:', error.message);
    context.res = serverError(error);
  }
};
