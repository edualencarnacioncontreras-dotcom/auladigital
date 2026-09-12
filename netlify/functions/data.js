// netlify/functions/data.js
// GET  -> devuelve el estado guardado del docente (cursos, estudiantes, etc.)
// POST -> guarda/actualiza ese estado.
// Requiere el header Authorization: Bearer <token> obtenido en login/signup.

const { usersStore, correoDesdeToken, jsonResponse } = require('./auth');

exports.handler = async (event) => {
  const correo = correoDesdeToken(event);
  if (!correo) {
    return jsonResponse(401, { error: 'Sesión inválida o expirada. Inicia sesión de nuevo.' });
  }

  const store = usersStore();

  try {
    if (event.httpMethod === 'GET') {
      const registro = await store.get(correo, { type: 'json' });
      if (!registro) {
        return jsonResponse(404, { error: 'Cuenta no encontrada.' });
      }
      return jsonResponse(200, { state: registro.state || null });
    }

    if (event.httpMethod === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch (e) {
        return jsonResponse(400, { error: 'Solicitud inválida.' });
      }

      const registro = await store.get(correo, { type: 'json' });
      if (!registro) {
        return jsonResponse(404, { error: 'Cuenta no encontrada.' });
      }

      registro.state = body.state || null;
      registro.actualizadoEn = new Date().toISOString();
      await store.setJSON(correo, registro);

      return jsonResponse(200, { ok: true });
    }

    return jsonResponse(405, { error: 'Método no permitido.' });
  } catch (e) {
    return jsonResponse(500, { error: 'Error del servidor: ' + e.message });
  }
};
