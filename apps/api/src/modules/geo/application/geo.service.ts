import type { CountryCode } from '@markethub/shared';
import { MAX_COMBOBOX_VISIBLE, MAX_GEO_CITIES } from '@markethub/shared/limits';
import { ValidationError } from '../../../shared/errors/app-error.js';
import type { CitiesRepository } from '../infrastructure/cities.repository.js';

export class GeoService {
  constructor(private readonly cities: CitiesRepository) {}

  async listCities(country: CountryCode, query?: string) {
    const trimmed = query?.trim();
    const limit = trimmed ? MAX_GEO_CITIES : MAX_COMBOBOX_VISIBLE;
    const rows = await this.cities.list(country, trimmed || undefined, limit);
    return rows.map((row) => ({
      nameRu: row.nameRu,
      country: row.country as CountryCode,
    }));
  }

  async assertCity(country: CountryCode, city: string) {
    const normalized = city.trim();
    if (!normalized) {
      throw new ValidationError('Выберите город из списка страны');
    }
    const found = await this.cities.exists(country, normalized);
    if (!found) {
      throw new ValidationError('Выберите город из списка страны');
    }
  }
}
