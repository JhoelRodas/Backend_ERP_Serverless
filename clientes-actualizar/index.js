// clientes/actualizar-cliente/index.js
// PUT /api/clientes/{id}

const { pool }   = require('../shared/db');
const { ok, notFound, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const id = req.params.id;
  const { nombre, email, telefono, direccion, ruc } = req.body || {};

  try {
    const { rowCount } = await pool.query(
      `UPDATE clientes
       SET nombre    = COALESCE($1, nombre),
           email     = COALESCE($2, email),
           telefono  = COALESCE($3, telefono),
           direccion = COALESCE($4, direccion),
           ruc       = COALESCE($5, ruc)
       WHERE id = $6`,
      [nombre, email, telefono, direccion, ruc, id]
    );

    if (rowCount === 0) {
      context.res = notFound(`Cliente con id ${id} no encontrado.`);
      return;
    }

    context.res = ok({ message: 'Cliente actualizado correctamente.' });
  } catch (error) {
    context.log.error('Error al actualizar cliente:', error.message);
    context.res = serverError(error);
  }
};
