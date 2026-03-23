// productos/crear-producto/index.js
// POST /api/productos

const { pool }   = require('../shared/db');
const { created, badRequest, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const { nombre, codigo, descripcion, precio, categoria_id, stock_inicial } = req.body || {};

  if (!nombre || !codigo || precio === undefined) {
    context.res = badRequest('nombre, codigo y precio son requeridos.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO productos (nombre, codigo, descripcion, precio, categoria_id, creado_en)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [nombre, codigo, descripcion, precio, categoria_id]
    );
    const productoId = rows[0].id;

    // Inicializar registro de inventario
    await client.query(
      `INSERT INTO inventario (producto_id, stock, stock_minimo)
       VALUES ($1, $2, 0)`,
      [productoId, stock_inicial || 0]
    );

    await client.query('COMMIT');
    context.res = created({ id: productoId, message: 'Producto creado exitosamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    context.log.error('Error al crear producto:', error.message);
    context.res = serverError(error);
  } finally {
    client.release();
  }
};
