// productos/actualizar-producto/index.js
// PUT /api/productos/{id}

const { sql, poolPromise } = require('../shared/db');
const { ok, notFound, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const id = req.params.id;
  const { nombre, codigo, descripcion, precio, categoria_id } = req.body || {};

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('nombre',      sql.NVarChar,      nombre       ?? null)
      .input('codigo',      sql.NVarChar,      codigo       ?? null)
      .input('descripcion', sql.NVarChar,      descripcion  ?? null)
      .input('precio',      sql.Decimal(10,2), precio       ?? null)
      .input('categoriaId', sql.Int,           categoria_id ?? null)
      .input('id',          sql.Int,           parseInt(id, 10))
      .query(`UPDATE productos
              SET nombre       = COALESCE(@nombre,      nombre),
                  codigo       = COALESCE(@codigo,      codigo),
                  descripcion  = COALESCE(@descripcion, descripcion),
                  precio       = COALESCE(@precio,      precio),
                  categoria_id = COALESCE(@categoriaId, categoria_id)
              WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      context.res = notFound(`Producto con id ${id} no encontrado.`);
      return;
    }

    context.res = ok({ message: 'Producto actualizado correctamente.' });
  } catch (error) {
    context.log.error('Error al actualizar producto:', error.message);
    context.res = serverError(error);
  }
};
