import type { User, Credential, Identity, Session, Span } from '../types';
import {
  saveUser,
  saveCredential,
  saveIdentity,
  saveSession,
  appendToLedger,
} from './db';
import {
  generateId,
  encryptApiKey,
  generateKeyPair,
  detectProvider,
  calculateSpanHash,
  signSpan,
} from './crypto';

export async function registerUser(
  name: string,
  apiKey: string
): Promise<{ user: User; credential: Credential; identity: Identity }> {
  // Generate user ID
  const shortId = Math.random().toString(36).substring(2, 5);
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const userId = `user-${sanitizedName}-${shortId}`;
  
  // Create user
  const user: User = {
    id: userId,
    name,
    created_at: new Date().toISOString()
  };
  await saveUser(user);
  
  // Encrypt and save API key
  const encryptedKey = await encryptApiKey(apiKey, userId);
  const provider = detectProvider(apiKey);
  
  const credential: Credential = {
    user_id: userId,
    encrypted_key: encryptedKey,
    provider,
    created_at: new Date().toISOString()
  };
  await saveCredential(credential);
  
  // Generate Ed25519 keypair
  const keyPair = await generateKeyPair();
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  
  const identity: Identity = {
    id: 'self',
    user_id: userId,
    public_key: publicKeyJwk,
    private_key_handle: keyPair.privateKey,
    created_at: new Date().toISOString()
  };
  await saveIdentity(identity);
  
  // Create registration span
  const registrationSpan: Partial<Span> = {
    id: generateId(),
    trace_id: `onboarding-${userId}`,
    type: 'user.registered',
    entity: 'user',
    body: {
      action: 'register_user',
      input: { name, user_id: userId },
      output: { success: true, user_id: userId }
    },
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    this: {
      hash: '',
      version: '1.0.0'
    }
  };
  
  // Calculate hash
  registrationSpan.this!.hash = await calculateSpanHash(registrationSpan);
  
  // Sign span
  const signature = await signSpan(registrationSpan as Span, keyPair.privateKey);
  (registrationSpan as Span).confirmed_by = {
    signature,
    domain: 'minicontratos.local',
    timestamp: new Date().toISOString(),
    signer_id: userId
  };
  
  await appendToLedger(registrationSpan as Span);
  
  return { user, credential, identity };
}

export async function createSession(userId: string): Promise<Session> {
  const session: Session = {
    user_id: userId,
    started_at: new Date().toISOString(),
    last_activity: new Date().toISOString()
  };
  
  await saveSession(session);
  return session;
}

export async function login(): Promise<User | null> {
  try {
    // Try to find user by API key hash
    // Note: This is a simplified implementation
    // In a real app, you'd need to iterate through credentials
    
    return null; // Will be implemented with proper lookup
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}
