// clientes/crear-cliente/index.js
// POST /api/clientes

const { pool }   = require('../shared/db');
const { created, badRequest, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const { nombre, email, telefono, direccion, ruc } = req.body || {};

  if (!nombre || !email) {
    context.res = badRequest('nombre y email son requeridos.');
    return;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono, direccion, ruc, creado_en)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [nombre, email, telefono, direccion, ruc]
    );
    context.res = created({ id: rows[0].id, message: 'Cliente creado exitosamente.' });
  } catch (error) {
    context.log.error('Error al crear cliente:', error.message);
    context.res = serverError(error);
  }
};
