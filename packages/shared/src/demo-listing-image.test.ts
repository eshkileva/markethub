import {
  demoListingImageDataUri,
  demoListingImageSvg,
  isHotlinkPlaceholder,
} from './demo-listing-image.js';

describe('demoListingImageSvg', () => {
  it('escapes title text and keeps a valid svg', () => {
    const svg = demoListingImageSvg('Кофе & чай <test>', 'coffee');
    expect(svg).toContain('<svg');
    expect(svg).toContain('Кофе &amp; чай &lt;test&gt;');
    expect(svg).not.toContain('Кофе & чай <test>');
  });
});

describe('demoListingImageDataUri', () => {
  it('encodes the svg as a data uri', () => {
    const uri = demoListingImageDataUri('iPhone 13', 'iphone13');
    expect(uri.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(decodeURIComponent(uri.split(',')[1] ?? '')).toContain('iPhone 13');
  });
});

describe('isHotlinkPlaceholder', () => {
  it('detects picsum seed urls', () => {
    expect(isHotlinkPlaceholder('https://picsum.photos/seed/mh-coffee/800/600')).toBe(true);
    expect(isHotlinkPlaceholder('https://media.kupilko.store/markethub/seed/coffee.svg')).toBe(
      false,
    );
  });
});
