// Use direct imports without path extensions
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import type { Span } from '../types';

// Generate UUID v7 (timestamp-based)
export function generateId(): string {
  const timestamp = Date.now();
  const randomBytes = crypto.getRandomValues(new Uint8Array(10));
  
  // Convert timestamp to hex (48 bits)
  const timestampHex = timestamp.toString(16).padStart(12, '0');
  
  // Convert random bytes to hex
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Format as UUID
  const uuid = `${timestampHex.slice(0, 8)}-${timestampHex.slice(8, 12)}-7${randomHex.slice(0, 3)}-${randomHex.slice(3, 7)}-${randomHex.slice(7, 19)}`;
  
  return uuid;
}

// Calculate BLAKE3 hash of a span
export async function calculateSpanHash(span: Partial<Span>): Promise<string> {
  // Create a canonical representation for hashing
  const canonical = {
    id: span.id,
    trace_id: span.trace_id,
    parent_id: span.parent_id,
    type: span.type,
    entity: span.entity,
    body: span.body,
    started_at: span.started_at,
    completed_at: span.completed_at,
  };
  
  const jsonString = JSON.stringify(canonical, Object.keys(canonical).sort());
  const hash = blake3(new TextEncoder().encode(jsonString));
  return 'blake3:' + bytesToHex(hash);
}

// Sign a span using Ed25519
export async function signSpan(span: Span, privateKey: CryptoKey): Promise<string> {
  const canonical = JSON.stringify({
    id: span.id,
    trace_id: span.trace_id,
    type: span.type,
    entity: span.entity,
    body: span.body,
    started_at: span.started_at,
    hash: span.this.hash,
  }, Object.keys(span).sort());
  
  const data = new TextEncoder().encode(canonical);
  
  const signature = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    data
  );
  
  return 'ed25519:' + bytesToHex(new Uint8Array(signature));
}

// Verify a span signature
export async function verifySignature(
  span: Span,
  signature: string,
  publicKey: JsonWebKey
): Promise<boolean> {
  try {
    const signatureHex = signature.replace('ed25519:', '');
    const signatureBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    const canonical = JSON.stringify({
      id: span.id,
      trace_id: span.trace_id,
      type: span.type,
      entity: span.entity,
      body: span.body,
      started_at: span.started_at,
      hash: span.this.hash,
    }, Object.keys(span).sort());
    
    const data = new TextEncoder().encode(canonical);
    
    const publicCryptoKey = await crypto.subtle.importKey(
      'jwk',
      publicKey,
      'Ed25519',
      false,
      ['verify']
    );
    
    return await crypto.subtle.verify(
      'Ed25519',
      publicCryptoKey,
      signatureBytes,
      data
    );
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

// Encrypt API key using PBKDF2 + AES-GCM
export async function encryptApiKey(apiKey: string, userId: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(userId),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const encryptionKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    encryptionKey,
    new TextEncoder().encode(apiKey)
  );
  
  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return bytesToHex(combined);
}

// Decrypt API key
export async function decryptApiKey(encrypted: string, userId: string): Promise<string> {
  const data = hexToBytes(encrypted);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(userId),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const decryptionKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    decryptionKey,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}

// Generate Ed25519 keypair
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    'Ed25519',
    false,
    ['sign', 'verify']
  );
}

// Hash API key for lookup
export async function hashApiKey(apiKey: string): Promise<string> {
  const hash = blake3(new TextEncoder().encode(apiKey));
  return bytesToHex(hash);
}

// Detect provider from API key format
export function detectProvider(apiKey: string): 'anthropic' | 'openai' | 'ollama' {
  if (apiKey.startsWith('sk-ant-')) {
    return 'anthropic';
  } else if (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) {
    return 'openai';
  } else {
    return 'ollama';
  }
}
