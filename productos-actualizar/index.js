// productos/actualizar-producto/index.js
// PUT /api/productos/{id}

const { pool }   = require('../shared/db');
const { ok, notFound, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const id = req.params.id;
  const { nombre, codigo, descripcion, precio, categoria_id } = req.body || {};

  try {
    const { rowCount } = await pool.query(
      `UPDATE productos
       SET nombre       = COALESCE($1, nombre),
           codigo       = COALESCE($2, codigo),
           descripcion  = COALESCE($3, descripcion),
           precio       = COALESCE($4, precio),
           categoria_id = COALESCE($5, categoria_id)
       WHERE id = $6`,
      [nombre, codigo, descripcion, precio, categoria_id, id]
    );

    if (rowCount === 0) {
      context.res = notFound(`Producto con id ${id} no encontrado.`);
      return;
    }

    context.res = ok({ message: 'Producto actualizado correctamente.' });
  } catch (error) {
    context.log.error('Error al actualizar producto:', error.message);
    context.res = serverError(error);
  }
};
