import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Span, Contract, User, Credential, Identity, Session } from '../types';

interface MinicontratosDB extends DBSchema {
  spans: {
    key: string;
    value: Span;
    indexes: {
      'by-trace': string;
      'by-type': string;
      'by-entity': string;
      'by-time': string;
    };
  };
  contracts: {
    key: string;
    value: Contract;
  };
  users: {
    key: string;
    value: User;
  };
  credentials: {
    key: string;
    value: Credential;
  };
  identity: {
    key: 'self';
    value: Identity;
  };
  session: {
    key: 'current';
    value: Session;
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbInstance: IDBPDatabase<MinicontratosDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<MinicontratosDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<MinicontratosDB>('minicontratos', 1, {
    upgrade(db) {
      // Spans store with indexes
      if (!db.objectStoreNames.contains('spans')) {
        const spanStore = db.createObjectStore('spans', { keyPath: 'id' });
        spanStore.createIndex('by-trace', 'trace_id');
        spanStore.createIndex('by-type', 'type');
        spanStore.createIndex('by-entity', 'entity');
        spanStore.createIndex('by-time', 'started_at');
      }

      // Contracts store
      if (!db.objectStoreNames.contains('contracts')) {
        db.createObjectStore('contracts', { keyPath: 'id' });
      }

      // Users store
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }

      // Credentials store
      if (!db.objectStoreNames.contains('credentials')) {
        db.createObjectStore('credentials', { keyPath: 'user_id' });
      }

      // Identity store
      if (!db.objectStoreNames.contains('identity')) {
        db.createObjectStore('identity', { keyPath: 'id' });
      }

      // Session store
      if (!db.objectStoreNames.contains('session')) {
        db.createObjectStore('session', { keyPath: 'id' });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });

  return dbInstance;
}

export async function appendToLedger(span: Span): Promise<void> {
  const db = await getDB();
  await db.add('spans', span);
}

export async function queryLedger(filter: {
  trace_id?: string;
  type?: string;
  entity?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<Span[]> {
  const db = await getDB();
  
  let spans: Span[];
  
  if (filter.trace_id) {
    spans = await db.getAllFromIndex('spans', 'by-trace', filter.trace_id);
  } else if (filter.type) {
    spans = await db.getAllFromIndex('spans', 'by-type', filter.type);
  } else if (filter.entity) {
    spans = await db.getAllFromIndex('spans', 'by-entity', filter.entity);
  } else {
    spans = await db.getAll('spans');
  }
  
  // Apply additional filters
  let filtered = spans;
  
  if (filter.from) {
    filtered = filtered.filter(s => s.started_at >= filter.from!);
  }
  
  if (filter.to) {
    filtered = filtered.filter(s => s.started_at <= filter.to!);
  }
  
  if (filter.limit) {
    filtered = filtered.slice(0, filter.limit);
  }
  
  return filtered;
}

export async function getAllContracts(): Promise<Contract[]> {
  const db = await getDB();
  return await db.getAll('contracts');
}

export async function getContract(id: string): Promise<Contract | undefined> {
  const db = await getDB();
  return await db.get('contracts', id);
}

export async function saveContract(contract: Contract): Promise<void> {
  const db = await getDB();
  await db.put('contracts', contract);
}

export async function getCurrentUser(): Promise<User | undefined> {
  const db = await getDB();
  const session = await db.get('session', 'current');
  if (!session) return undefined;
  return await db.get('users', session.user_id);
}

export async function saveUser(user: User): Promise<void> {
  const db = await getDB();
  await db.put('users', user);
}

export async function getCredential(userId: string): Promise<Credential | undefined> {
  const db = await getDB();
  return await db.get('credentials', userId);
}

export async function saveCredential(credential: Credential): Promise<void> {
  const db = await getDB();
  await db.put('credentials', credential);
}

export async function getIdentity(): Promise<Identity | undefined> {
  const db = await getDB();
  return await db.get('identity', 'self');
}

export async function saveIdentity(identity: Identity): Promise<void> {
  const db = await getDB();
  await db.put('identity', identity);
}

export async function getCurrentSession(): Promise<Session | undefined> {
  const db = await getDB();
  return await db.get('session', 'current');
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDB();
  await db.put('session', { ...session, id: 'current' } as any);
}

export async function clearSession(): Promise<void> {
  const db = await getDB();
  await db.delete('session', 'current');
}

export async function exportLedger(format: 'ndjson' | 'json' | 'csv'): Promise<Blob> {
  const db = await getDB();
  const allSpans = await db.getAll('spans');
  
  switch (format) {
    case 'ndjson':
      const ndjson = allSpans.map(s => JSON.stringify(s)).join('\n') + '\n';
      return new Blob([ndjson], { type: 'application/x-ndjson' });
    
    case 'json':
      return new Blob([JSON.stringify(allSpans, null, 2)], { type: 'application/json' });
    
    case 'csv':
      const headers = ['id', 'trace_id', 'type', 'entity', 'started_at', 'hash', 'signature'];
      const rows = allSpans.map(s => [
        s.id,
        s.trace_id,
        s.type,
        s.entity,
        s.started_at,
        s.this.hash,
        s.confirmed_by?.signature || ''
      ]);
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      return new Blob([csv], { type: 'text/csv' });
    
    default:
      throw new Error(`Formato não suportado: ${format}`);
  }
}
