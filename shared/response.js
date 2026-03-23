// shared/response.js
// Helpers para construir respuestas HTTP uniformes en todas las funciones.

const ok = (data) => ({
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

const created = (data) => ({
  status: 201,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

const badRequest = (message) => ({
  status: 400,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error: message }),
});

const notFound = (message = 'Recurso no encontrado') => ({
  status: 404,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error: message }),
});

const serverError = (error) => ({
  status: 500,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    error: 'Error interno del servidor',
    detail: error.message,
  }),
});

module.exports = { ok, created, badRequest, notFound, serverError };
