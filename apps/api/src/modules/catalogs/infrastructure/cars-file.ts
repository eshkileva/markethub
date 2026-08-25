import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type CarFileBrand = {
  id: string;
  name: string;
  cyrillic_name?: string;
  popular?: number;
  models?: Array<{
    id: string;
    name: string;
    cyrillic_name?: string;
  }>;
};

export async function loadCarsFile(): Promise<CarFileBrand[]> {
  const candidates = [
    path.resolve(process.cwd(), '../../docs/cars.json'),
    path.resolve(process.cwd(), 'docs/cars.json'),
  ];
  let lastError: unknown;
  for (const file of candidates) {
    try {
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw) as CarFileBrand[];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('cars.json not found');
}
