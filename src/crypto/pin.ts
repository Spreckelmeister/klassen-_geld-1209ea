// PBKDF2-basiertes PIN-Hashing (Upgrade von SHA-256 + fester Salt)

export async function hashPinPBKDF2(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );

  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Format: pbkdf2$salt$hash (damit wir alte SHA-256 Hashes erkennen)
  return `pbkdf2$${saltHex}$${hashHex}`;
}

export async function verifyPinPBKDF2(pin: string, storedHash: string): Promise<boolean> {
  // Alte SHA-256 Hashes (ohne Prefix) abwärtskompatibel prüfen
  if (!storedHash.startsWith('pbkdf2$')) {
    return verifyLegacyPin(pin, storedHash);
  }

  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;

  const saltHex = parts[1]!;
  const expectedHash = parts[2]!;

  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );

  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex === expectedHash;
}

// Abwärtskompatibilität: alte SHA-256 + "klassenkasse-salt" Hashes
async function verifyLegacyPin(pin: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'klassenkasse-salt');
  const buffer = await crypto.subtle.digest('SHA-256', data);
  const hash = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hash === storedHash;
}
