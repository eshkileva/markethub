import { describe, expect, it } from 'vitest';
import {
  buildRobotsTxt,
  buildSitemapXml,
  catalogCategoryUrl,
  escapeXml,
  isRobotsDisallowPath,
} from './seo';

describe('buildRobotsTxt', () => {
  it('is plain text with disallows and sitemap on the site host', () => {
    const txt = buildRobotsTxt('https://kupilko.store/');
    expect(txt).not.toContain('<html');
    expect(txt).toContain('Disallow: /auth');
    expect(txt).toContain('Disallow: /listings/create');
    expect(txt).toContain('Disallow: /*/edit');
    expect(txt).not.toContain('Disallow: /listings\n');
    expect(txt).toContain('Sitemap: https://kupilko.store/sitemap.xml');
  });
});

describe('buildSitemapXml', () => {
  it('escapes query strings and skips empty categories', () => {
    const xml = buildSitemapXml([
      { loc: 'https://kupilko.store/' },
      { loc: catalogCategoryUrl('https://kupilko.store', 'electronics'), lastmod: '2026-09-01' },
      { loc: 'https://kupilko.store/catalog?category=phones&city=Minsk' },
    ]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain(escapeXml('https://kupilko.store/catalog?category=electronics'));
    expect(xml).toContain('category=phones&amp;city=Minsk');
  });
});

describe('escapeXml', () => {
  it('escapes ampersands first', () => {
    expect(escapeXml('a&b<c')).toBe('a&amp;b&lt;c');
  });
});

describe('isRobotsDisallowPath', () => {
  it('does not block public listing cards', () => {
    expect(isRobotsDisallowPath('/listings/abc')).toBe(false);
    expect(isRobotsDisallowPath('/listings/abc/edit')).toBe(true);
    expect(isRobotsDisallowPath('/messages')).toBe(true);
  });
});
