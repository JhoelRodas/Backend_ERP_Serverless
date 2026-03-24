// productos/crear-producto/index.js
// POST /api/productos

const { sql, poolPromise } = require('../shared/db');
const { created, badRequest, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  const { nombre, codigo, descripcion, precio, categoria_id, stock_inicial } = req.body || {};

  if (!nombre || !codigo || precio === undefined) {
    context.res = badRequest('nombre, codigo y precio son requeridos.');
    return;
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const result = await new sql.Request(transaction)
      .input('nombre',      sql.NVarChar,      nombre)
      .input('codigo',      sql.NVarChar,      codigo)
      .input('descripcion', sql.NVarChar,      descripcion ?? null)
      .input('precio',      sql.Decimal(10,2), precio)
      .input('categoriaId', sql.Int,           categoria_id ?? null)
      .query(`INSERT INTO productos (nombre, codigo, descripcion, precio, categoria_id, creado_en)
              OUTPUT INSERTED.id
              VALUES (@nombre, @codigo, @descripcion, @precio, @categoriaId, GETDATE())`);

    const productoId = result.recordset[0].id;

    await new sql.Request(transaction)
      .input('productoId',   sql.Int, productoId)
      .input('stockInicial', sql.Int, stock_inicial || 0)
      .query(`INSERT INTO inventario (producto_id, stock, stock_minimo)
              VALUES (@productoId, @stockInicial, 0)`);

    await transaction.commit();
    context.res = created({ id: productoId, message: 'Producto creado exitosamente.' });
  } catch (error) {
    await transaction.rollback();
    context.log.error('Error al crear producto:', error.message);
    context.res = serverError(error);
  }
};
