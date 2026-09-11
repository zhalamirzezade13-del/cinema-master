import { Injectable } from '@angular/core';
import { DocumentData, addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../core/firebase';

export type AdminCollection = 'movies' | 'halls' | 'sessions' | 'messages' | 'users' | 'bookings' | 'comments';
export type AdminRecord = Record<string, unknown> & { id: string };

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  async list(name: AdminCollection): Promise<AdminRecord[]> {
    const snapshot = await getDocs(collection(db, name));
    return snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
  }
  async save(name: AdminCollection, id: string | null, data: DocumentData): Promise<string> {
    if (id) {
      await updateDoc(doc(db, name, id), data);
      return id;
    }
    return (await addDoc(collection(db, name), data)).id;
  }
  async remove(name: AdminCollection, id: string): Promise<void> {
    await deleteDoc(doc(db, name, id));
  }
}

export function adminError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'permission-denied') return 'admin.permissionError';
  if (code === 'unauthenticated') return 'admin.authError';
  if (code === 'unavailable') return 'admin.networkError';
  if (code === 'not-found') return 'admin.notFoundError';
  return 'admin.genericError';
}
