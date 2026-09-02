import { useLayoutEffect } from 'react';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '@markethub/shared';

type SeoHeadProps = {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string | null;
  ogType?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

const JSON_LD_ID = 'kupilko-jsonld';

export function SeoHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonical,
  noindex = false,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  jsonLd,
}: SeoHeadProps) {
  useLayoutEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');
    upsertMeta('property', 'og:title', ogTitle ?? title);
    upsertMeta('property', 'og:description', ogDescription ?? description);
    upsertMeta('property', 'og:type', ogType);
    if (canonical) {
      upsertLink('canonical', canonical);
      upsertMeta('property', 'og:url', canonical);
    }
    if (ogImage) {
      upsertMeta('property', 'og:image', ogImage);
    }
    const existing = document.getElementById(JSON_LD_ID);
    if (jsonLd) {
      const script = existing ?? document.createElement('script');
      script.id = JSON_LD_ID;
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(jsonLd);
      if (!existing) document.head.appendChild(script);
    } else if (existing) {
      existing.remove();
    }
  }, [
    title,
    description,
    canonical,
    noindex,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    jsonLd,
  ]);

  return null;
}

export function siteOrigin(): string {
  if (typeof window === 'undefined') return 'https://kupilko.store';
  return window.location.origin;
}
