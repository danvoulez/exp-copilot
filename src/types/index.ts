// JSON✯Atomic Span types

export interface Rule {
  id: string;
  condition: string;
  action: string;
  parameters?: Record<string, any>;
  description?: string;
}

export interface Span {
  // Identificação única
  id: string;
  trace_id: string;
  parent_id?: string;
  
  // Tipo e metadados
  type: string;
  entity: string;
  
  // Conteúdo semântico
  body: {
    action: string;
    input: any;
    output?: any;
    rules?: Rule[];
    metadata?: Record<string, any>;
  };
  
  // Temporal
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  
  // Criptografia e Integridade
  this: {
    hash: string;
    version: string;
  };
  
  // Assinatura
  confirmed_by?: {
    signature: string;
    domain: string;
    timestamp: string;
    signer_id: string;
  };
}

export interface Party {
  name: string;
  role: string;
  id?: string;
}

export interface Contract {
  id: string;
  title: string;
  parties: Party[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  spans: string[];
  last_updated: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  created_at: string;
}

export interface Credential {
  user_id: string;
  encrypted_key: string;
  provider: 'anthropic' | 'openai' | 'ollama';
  created_at: string;
}

export interface Identity {
  id: 'self';
  user_id: string;
  public_key: JsonWebKey;
  private_key_handle: CryptoKey;
  created_at: string;
}

export interface Session {
  user_id: string;
  started_at: string;
  last_activity: string;
}

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'ollama';
  apiKey: string;
  model: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
