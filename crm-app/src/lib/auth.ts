// src/lib/auth.ts
export const AUTH_KEY = "pmc_auth_v1";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "asesor";
};

const USERS: Array<User & { password: string }> = [
  {
    id: "u_admin",
    name: "Asesor",
    email: "asesor@pmc.com",
    role: "asesor",
    password: "123456",
  },
  {
    id: "u_asesor",
    name: "Asesor",
    email: "asesor@pmc.com",
    role: "asesor",
    password: "123456",
  },
];

export function loginWithPassword(email: string, password: string): User | null {
  const u = USERS.find(
    (x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password
  );
  if (!u) return null;
  const { password: _pw, ...safe } = u;
  localStorage.setItem(AUTH_KEY, JSON.stringify(safe));
  return safe;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getUser();
}
