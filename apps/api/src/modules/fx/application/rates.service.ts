import { DEMO_RATES_TO_RUB, type CurrencyCode, type RatesToRub } from '@markethub/shared';
import type { AppConfig } from '../../../config/env.js';
import type { RedisClient } from '../../../infrastructure/redis/client.js';

const LIVE_KEY = 'fx:rates';
const LAST_KEY = 'fx:rates:last';
const OPEN_ER_API_URL = 'https://open.er-api.com/v6/latest/RUB';

type CurrencyApiResponse = {
  data?: Record<string, { code: string; value: number }>;
};

type OpenErApiResponse = {
  result?: string;
  rates?: Record<string, number>;
};

/** Quotes are "units of BYN/KZT per 1 RUB". Stored table is RUB per 1 unit. */
export function ratesFromPerRubQuotes(bynPerRub: number, kztPerRub: number): RatesToRub {
  if (!(bynPerRub > 0) || !(kztPerRub > 0)) {
    throw new Error('Incomplete FX quotes');
  }
  return {
    RUB: 1,
    BYN: 1 / bynPerRub,
    KZT: 1 / kztPerRub,
  };
}

export class RatesService {
  private refresh: Promise<RatesToRub> | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly redis: RedisClient,
  ) {}

  async getRates(): Promise<RatesToRub> {
    const live = await this.read(LIVE_KEY);
    if (live) return live;
    if (!this.refresh) {
      this.refresh = this.refreshRates().finally(() => {
        this.refresh = null;
      });
    }
    return this.refresh;
  }

  startHourlyRefresh() {
    const timer = setInterval(() => {
      void this.refreshRates().catch((error) => {
        console.warn('Currency rates refresh failed', error);
      });
    }, this.config.FX_CACHE_TTL_SECONDS * 1000);
    timer.unref();
    void this.refreshRates().catch((error) => {
      console.warn('Initial currency rates fetch failed', error);
    });
    return timer;
  }

  private async refreshRates(): Promise<RatesToRub> {
    try {
      const rates = await this.fetchLatest();
      const payload = JSON.stringify(rates);
      await this.redis.set(LIVE_KEY, payload, 'EX', this.config.FX_CACHE_TTL_SECONDS);
      await this.redis.set(LAST_KEY, payload);
      return rates;
    } catch (error) {
      console.warn('Live FX request failed', error);
      return this.fallback();
    }
  }

  private async fallback(): Promise<RatesToRub> {
    return (await this.read(LAST_KEY)) ?? DEMO_RATES_TO_RUB;
  }

  private async read(key: string): Promise<RatesToRub | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as RatesToRub;
      if (parsed.RUB && parsed.BYN && parsed.KZT) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  private async fetchLatest(): Promise<RatesToRub> {
    try {
      return await this.fetchOpenErApi();
    } catch (error) {
      if (!this.config.CURRENCYAPI_KEY) throw error;
      console.warn('open.er-api.com failed, trying CurrencyAPI', error);
      return this.fetchCurrencyApi();
    }
  }

  private async fetchOpenErApi(): Promise<RatesToRub> {
    const response = await fetch(OPEN_ER_API_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`open.er-api.com HTTP ${response.status}`);
    }
    const payload = (await response.json()) as OpenErApiResponse;
    if (payload.result && payload.result !== 'success') {
      throw new Error(`open.er-api.com result ${payload.result}`);
    }
    return ratesFromPerRubQuotes(payload.rates?.BYN ?? 0, payload.rates?.KZT ?? 0);
  }

  private async fetchCurrencyApi(): Promise<RatesToRub> {
    const url = new URL('https://api.currencyapi.com/v3/latest');
    url.searchParams.set('base_currency', 'RUB');
    url.searchParams.set('currencies', 'BYN,KZT,RUB');
    const response = await fetch(url, {
      headers: {
        apikey: this.config.CURRENCYAPI_KEY!,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`CurrencyAPI HTTP ${response.status}`);
    }
    const payload = (await response.json()) as CurrencyApiResponse;
    return ratesFromPerRubQuotes(payload.data?.BYN?.value ?? 0, payload.data?.KZT?.value ?? 0);
  }
}

export function asCurrency(value: string): CurrencyCode {
  return value as CurrencyCode;
}
