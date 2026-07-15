const TOKEN_KEY = 'autocells_token';

// Sesión: {token, name, email, phone, role} como JSON en localStorage. El
// `token` viene del server al iniciar sesión y autoriza el API (authHeaders);
// name/role solo pintan la interfaz — los permisos reales los decide el
// server contra su tabla de sesiones, así que editar el localStorage a mano
// no da acceso a nada.
export function login(user) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(user));
}

export function getToken() {
  return getCurrentUser()?.token ?? null;
}

// Header Authorization para los clientes del API (src/data/*). Si no hay
// sesión regresa {} — los endpoints públicos no lo necesitan.
export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    // Sesiones viejas guardaban el string 'demo-token'; se descartan.
    return typeof user === 'object' && user !== null ? user : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}

export function isAdmin() {
  return getCurrentUser()?.role === 'admin';
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}
