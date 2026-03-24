// shared/db.js
// Conexión centralizada a Azure SQL Server mediante pool de conexiones.
// Todas las Azure Functions del proyecto importan este módulo para
// evitar abrir una conexión nueva en cada invocación.

const sql = require('mssql');

const config = {
  server:   process.env.DB_SERVER,
  port:     parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt:                process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
  },
  pool: {
    max:               10,
    idleTimeoutMillis: 30000,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .catch(err => {
    console.error('Error al conectar a Azure SQL Server:', err.message);
    throw err;
  });

module.exports = { sql, poolPromise };
