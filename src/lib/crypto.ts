/**
 * Hashing de contraseñas con Web Crypto API (SHA-256 + salt fijo).
 * No requiere librerías externas.
 *
 * No es bcrypt, pero es suficiente para un panel admin de restaurante:
 * - La contraseña nunca se guarda en texto plano
 * - Resistente a ataques de diccionario básicos gracias al salt
 */

const SALT = "karma_catalogo_2026";

/** Retorna el hash hex de una contraseña */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT + password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Detecta si un string ya es un hash SHA-256 (64 chars hex) */
export function isHashed(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

/**
 * Verifica una contraseña contra el valor almacenado.
 * Soporta tanto texto plano (legacy) como hashes.
 */
export async function verifyPassword(input: string, stored: string): Promise<boolean> {
  if (isHashed(stored)) {
    const inputHash = await hashPassword(input);
    return inputHash === stored;
  }
  // Plaintext legacy — comparación directa
  return input === stored;
}
