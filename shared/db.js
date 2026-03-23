// shared/db.js
// Conexión centralizada a PostgreSQL mediante Pool de conexiones.
// Todas las Azure Functions del proyecto importan este módulo para
// evitar abrir una conexión nueva en cada invocación.

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max:      10,           // máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
});

module.exports = { pool };
