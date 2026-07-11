const TOKEN_KEY = 'autocells_token';

// Placeholder de autenticación: sin backend real todavía.
export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function login() {
  localStorage.setItem(TOKEN_KEY, 'demo-token');
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}
