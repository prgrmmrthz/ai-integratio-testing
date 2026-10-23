import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ScanResult } from '../features/scan/scanModel';

export type ScanHistoryItem = {
  id: string;
  createdAt: string;
  imageName: string;
  result: ScanResult;
};

export type UserProfile = {
  id: 'current';
  name: string;
  location: string;
};

interface RiceGuardDB extends DBSchema {
  scans: {
    key: string;
    value: ScanHistoryItem;
    indexes: { 'by-createdAt': string };
  };
  profiles: {
    key: string;
    value: UserProfile;
  };
}

let dbPromise: Promise<IDBPDatabase<RiceGuardDB>> | undefined;

function getDatabase() {
  dbPromise ??= openDB<RiceGuardDB>('riceguard', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('scans')) {
        const scans = db.createObjectStore('scans', { keyPath: 'id' });
        scans.createIndex('by-createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
    },
  });

  return dbPromise;
}

export async function listScans(): Promise<ScanHistoryItem[]> {
  const scans = await (await getDatabase()).getAll('scans');
  return scans.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveScan(item: ScanHistoryItem): Promise<void> {
  await (await getDatabase()).put('scans', item);
}

export async function removeScan(id: string): Promise<void> {
  await (await getDatabase()).delete('scans', id);
}

export async function getProfile(): Promise<UserProfile | undefined> {
  return (await getDatabase()).get('profiles', 'current');
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await (await getDatabase()).put('profiles', profile);
}