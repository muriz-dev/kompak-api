import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcryptjs.
 */
export async function hashPassword(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Compares a plaintext password with a hashed password.
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
}
