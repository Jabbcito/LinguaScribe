
import type { Note } from '@/types/note';

const DB_NAME = 'LinguaScribeDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
        reject('IndexedDB is not supported or available.');
        return;
    }
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const tempDb = (event.target as IDBOpenDBRequest).result;
      if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
        tempDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject(new Error('Error opening IndexedDB: ' + (event.target as IDBOpenDBRequest).error?.message));
    };
  });
};

export const addNoteDB = async (note: Note): Promise<void> => {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(note);
    request.onsuccess = () => resolve();
    request.onerror = (event) => {
        console.error('Error adding note to IndexedDB:', (event.target as IDBRequest).error);
        reject(new Error('Error adding note: ' + (event.target as IDBRequest).error?.message));
    }
  });
};

export const getAllNotesDB = async (): Promise<Note[]> => {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Note[]);
    request.onerror = (event) => {
        console.error('Error getting all notes from IndexedDB:', (event.target as IDBRequest).error);
        reject(new Error('Error getting all notes: ' + (event.target as IDBRequest).error?.message));
    }
  });
};

export const getNoteDB = async (id: string): Promise<Note | undefined> => {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as Note | undefined);
    request.onerror = (event) => {
        console.error('Error getting note from IndexedDB:', (event.target as IDBRequest).error);
        reject(new Error('Error getting note: ' + (event.target as IDBRequest).error?.message));
    }
  });
};

export const updateNoteDB = async (note: Note): Promise<void> => {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(note); 
    request.onsuccess = () => resolve();
    request.onerror = (event) => {
        console.error('Error updating note in IndexedDB:', (event.target as IDBRequest).error);
        reject(new Error('Error updating note: ' + (event.target as IDBRequest).error?.message));
    }
  });
};

export const deleteNoteDB = async (id: string): Promise<void> => {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (event) => {
        console.error('Error deleting note from IndexedDB:', (event.target as IDBRequest).error);
        reject(new Error('Error deleting note: ' + (event.target as IDBRequest).error?.message));
    }
  });
};
