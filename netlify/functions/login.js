// netlify/functions/login.js
// Verifica correo + contraseña y devuelve un token si son correctos.

const bcrypt = require('bcryptjs');
const { usersStore, firmarToken, jsonResponse } = require('./auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método no permitido.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return jsonResponse(400, { error: 'Solicitud inválida.' });
  }

  const correo = String(body.correo || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!correo || !password) {
    return jsonResponse(400, { error: 'Completa correo y contraseña.' });
  }

  try {
    const store = usersStore();
    const registro = await store.get(correo, { type: 'json' });
    if (!registro) {
      return jsonResponse(401, { error: 'Correo o contraseña incorrectos.' });
    }

    const coincide = await bcrypt.compare(password, registro.passwordHash);
    if (!coincide) {
      return jsonResponse(401, { error: 'Correo o contraseña incorrectos.' });
    }

    const token = firmarToken(correo);
    return jsonResponse(200, {
      token,
      perfil: { correo: registro.correo, nombre: registro.nombre || '' }
    });
  } catch (e) {
    return jsonResponse(500, { error: 'Error del servidor: ' + e.message });
  }
};
