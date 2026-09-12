// netlify/functions/signup.js
// Crea una cuenta nueva (correo + contraseña) para un docente.

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
  const nombre = String(body.nombre || '').trim();

  if (!correo || !password) {
    return jsonResponse(400, { error: 'Completa correo y contraseña.' });
  }
  if (password.length < 4) {
    return jsonResponse(400, { error: 'La contraseña debe tener al menos 4 caracteres.' });
  }

  try {
    const store = usersStore();
    const existente = await store.get(correo, { type: 'json' });
    if (existente) {
      return jsonResponse(409, { error: 'Ya existe una cuenta con ese correo.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const registro = {
      correo,
      nombre,
      passwordHash,
      state: null, // aquí se guardarán los datos de la app (cursos, estudiantes, etc.)
      creadoEn: new Date().toISOString()
    };

    await store.setJSON(correo, registro);

    const token = firmarToken(correo);
    return jsonResponse(200, { token, perfil: { correo, nombre } });
  } catch (e) {
    return jsonResponse(500, { error: 'Error del servidor: ' + e.message });
  }
};
