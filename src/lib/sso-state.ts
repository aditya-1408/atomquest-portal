import crypto from "node:crypto";

function ssoSecret() {
  const secret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("SESSION_SECRET or NEXTAUTH_SECRET is required.");
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", ssoSecret()).update(value).digest("base64url");
}

export function createSsoState() {
  const nonce = crypto.randomBytes(24).toString("base64url");
  const issuedAt = Date.now().toString(36);
  const payload = `${nonce}.${issuedAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySsoState(state: string) {
  const [nonce, issuedAt, signature] = state.split(".");
  if (!nonce || !issuedAt || !signature) return false;

  const payload = `${nonce}.${issuedAt}`;
  if (signature !== sign(payload)) return false;

  const issuedAtMs = Number.parseInt(issuedAt, 36);
  if (!Number.isFinite(issuedAtMs)) return false;

  return Date.now() - issuedAtMs < 10 * 60 * 1000;
}
