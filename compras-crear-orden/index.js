// compras/crear-orden-compra/index.js
// POST /api/compras/ordenes
// Crea una nueva orden de compra en la base de datos.

const { sql, poolPromise } = require('../shared/db');
const { created, badRequest, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const { proveedor_id, productos, fecha_entrega } = req.body || {};

  if (!proveedor_id || !Array.isArray(productos) || productos.length === 0) {
    context.res = badRequest('proveedor_id y productos son requeridos.');
    return;
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const result = await new sql.Request(transaction)
      .input('proveedorId',  sql.Int,      proveedor_id)
      .input('fechaEntrega', sql.DateTime, fecha_entrega ? new Date(fecha_entrega) : null)
      .query(`INSERT INTO ordenes_compra (proveedor_id, fecha_entrega, estado, creado_en)
              OUTPUT INSERTED.id
              VALUES (@proveedorId, @fechaEntrega, 'PENDIENTE', GETDATE())`);
    const ordenId = result.recordset[0].id;

    for (const p of productos) {
      await new sql.Request(transaction)
        .input('ordenId',        sql.Int,           ordenId)
        .input('productoId',     sql.Int,           p.producto_id)
        .input('cantidad',       sql.Int,           p.cantidad)
        .input('precioUnitario', sql.Decimal(10,2), p.precio_unitario)
        .query(`INSERT INTO detalle_orden_compra (orden_id, producto_id, cantidad, precio_unitario)
                VALUES (@ordenId, @productoId, @cantidad, @precioUnitario)`);
    }

    await transaction.commit();
    context.res = created({ id: ordenId, message: 'Orden de compra creada exitosamente.' });
  } catch (error) {
    await transaction.rollback();
    context.log.error('Error al crear orden de compra:', error.message);
    context.res = serverError(error);
  }
};
