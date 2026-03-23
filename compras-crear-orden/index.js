// compras/crear-orden-compra/index.js
// POST /api/compras/ordenes
// Crea una nueva orden de compra en la base de datos.

const { pool }       = require('../shared/db');
const { created, badRequest, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const { proveedor_id, productos, fecha_entrega } = req.body || {};

  if (!proveedor_id || !Array.isArray(productos) || productos.length === 0) {
    context.res = badRequest('proveedor_id y productos son requeridos.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO ordenes_compra (proveedor_id, fecha_entrega, estado, creado_en)
       VALUES ($1, $2, 'PENDIENTE', NOW())
       RETURNING id`,
      [proveedor_id, fecha_entrega]
    );
    const ordenId = rows[0].id;

    for (const p of productos) {
      await client.query(
        `INSERT INTO detalle_orden_compra (orden_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [ordenId, p.producto_id, p.cantidad, p.precio_unitario]
      );
    }

    await client.query('COMMIT');
    context.res = created({ id: ordenId, message: 'Orden de compra creada exitosamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    context.log.error('Error al crear orden de compra:', error.message);
    context.res = serverError(error);
  } finally {
    client.release();
  }
};
