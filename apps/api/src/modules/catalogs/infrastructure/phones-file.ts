import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type PhoneFileBrand = {
  id: string;
  name: string;
  models?: Array<{ id: string; name: string }>;
};

export async function loadDocsJson<T>(fileName: string): Promise<T> {
  const candidates = [
    path.resolve(process.cwd(), `../../docs/${fileName}`),
    path.resolve(process.cwd(), `docs/${fileName}`),
  ];
  let lastError: unknown;
  for (const file of candidates) {
    try {
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error(`${fileName} not found`);
}

export async function loadPhonesFile(): Promise<PhoneFileBrand[]> {
  return loadDocsJson<PhoneFileBrand[]>('phones.json');
}

export async function loadTabletsFile(): Promise<PhoneFileBrand[]> {
  return loadDocsJson<PhoneFileBrand[]>('tablets.json');
}
