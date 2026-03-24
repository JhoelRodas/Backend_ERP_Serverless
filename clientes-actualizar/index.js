// clientes/actualizar-cliente/index.js
// PUT /api/clientes/{id}

const { sql, poolPromise } = require('../shared/db');
const { ok, notFound, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const id = req.params.id;
  const { nombre, email, telefono, direccion, ruc } = req.body || {};

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('nombre',    sql.NVarChar, nombre    ?? null)
      .input('email',     sql.NVarChar, email     ?? null)
      .input('telefono',  sql.NVarChar, telefono  ?? null)
      .input('direccion', sql.NVarChar, direccion ?? null)
      .input('ruc',       sql.NVarChar, ruc       ?? null)
      .input('id',        sql.Int,      parseInt(id, 10))
      .query(`UPDATE clientes
              SET nombre    = COALESCE(@nombre,    nombre),
                  email     = COALESCE(@email,     email),
                  telefono  = COALESCE(@telefono,  telefono),
                  direccion = COALESCE(@direccion, direccion),
                  ruc       = COALESCE(@ruc,       ruc)
              WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      context.res = notFound(`Cliente con id ${id} no encontrado.`);
      return;
    }

    context.res = ok({ message: 'Cliente actualizado correctamente.' });
  } catch (error) {
    context.log.error('Error al actualizar cliente:', error.message);
    context.res = serverError(error);
  }
};
