// netlify/functions/auth.js
// Utilidades compartidas por login.js, signup.js y data.js.
// Se encarga de firmar/verificar el token que identifica al docente
// y de dar acceso al "store" (Netlify Blobs) donde se guardan las cuentas.

const jwt = require('jsonwebtoken');
const { getStore, connectLambda } = require('@netlify/blobs');

// En producción, define la variable de entorno JWT_SECRET en Netlify
// (Site settings -> Environment variables). Si no existe, se usa un
// valor por defecto para que la app funcione igual, pero es más seguro
// configurar tu propia clave.
const JWT_SECRET = process.env.JWT_SECRET || 'aula-digital-clave-por-defecto-cambiar';

// Nuestras funciones usan el formato clásico "exports.handler = async
// (event) => {...}" (modo de compatibilidad con AWS Lambda). En ese modo,
// Netlify NO inyecta automáticamente el contexto de Blobs, así que hay que
// activarlo manualmente con connectLambda(event) antes de pedir el store.
// Por eso usersStore() recibe "event": lo necesita para esa conexión.
function usersStore(event) {
  connectLambda(event);
  return getStore('aula-digital-users');
}

function firmarToken(correo) {
  return jwt.sign({ correo }, JWT_SECRET, { expiresIn: '365d' });
}

// Extrae y valida el token del header Authorization: Bearer xxx
// Devuelve el correo del docente si es válido, o null si no lo es.
function correoDesdeToken(event) {
  try {
    const header = event.headers.authorization || event.headers.Authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    let token = match ? match[1] : null;
    if (!token && event.queryStringParameters && event.queryStringParameters.token) {
      token = event.queryStringParameters.token; // usado por sendBeacon en beforeunload
    }
    if (!token) return null;
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.correo || null;
  } catch (e) {
    return null;
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

module.exports = { usersStore, firmarToken, correoDesdeToken, jsonResponse };
