const TOKEN_KEY = 'autocells_token';

// Sesión sin backend: se guarda el usuario {name, email, role} como JSON en
// localStorage. Con backend real aquí viviría el token JWT y el usuario se
// pediría a la API.
export function login(user) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(user));
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
