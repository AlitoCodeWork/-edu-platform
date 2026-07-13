import { SignJWT, jwtVerify } from "jose";

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET || "dev-insecure-secret-change-me"
  );
}

export const SESSION_COOKIE = "edu_session";

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
