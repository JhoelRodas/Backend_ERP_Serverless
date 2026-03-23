// compras/actualizar-orden-compra/index.js
// PUT /api/compras/ordenes/{id}
// Actualiza el estado de una orden de compra (ej. PENDIENTE â†’ RECIBIDA).

const { pool }   = require('../shared/db');
const { ok, badRequest, notFound, serverError } = require('../shared/response');

const ESTADOS_VALIDOS = ['PENDIENTE', 'APROBADA', 'RECIBIDA', 'CANCELADA'];

module.exports = async function (context, req) {
  const id     = req.params.id;
  const { estado } = req.body || {};

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    context.res = badRequest(`estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
    return;
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE ordenes_compra SET estado = $1 WHERE id = $2`,
      [estado, id]
    );

    if (rowCount === 0) {
      context.res = notFound(`Orden de compra con id ${id} no encontrada.`);
      return;
    }

    context.res = ok({ message: `Orden ${id} actualizada a '${estado}'.` });
  } catch (error) {
    context.log.error('Error al actualizar orden de compra:', error.message);
    context.res = serverError(error);
  }
};
