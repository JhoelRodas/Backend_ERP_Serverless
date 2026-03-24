// compras/obtener-ordenes-compra/index.js
// GET /api/compras/ordenes
// Retorna todas las Ã³rdenes de compra con su estado y proveedor.

const { poolPromise } = require('../shared/db');
const { ok, serverError } = require('../shared/response');

module.exports = async function (context, req) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(
      `SELECT oc.id, oc.estado, oc.fecha_entrega, oc.creado_en,
              p.nombre AS proveedor
       FROM   ordenes_compra oc
       JOIN   proveedores p ON p.id = oc.proveedor_id
       ORDER  BY oc.creado_en DESC`
    );
    context.res = ok(result.recordset);
  } catch (error) {
    context.log.error('Error al obtener Ã³rdenes de compra:', error.message);
    context.res = serverError(error);
  }
};
