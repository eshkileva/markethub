import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ListingGallery } from './ListingGallery';

const images = [
  { id: 'a', url: 'https://example.com/a.jpg' },
  { id: 'b', url: 'https://example.com/b.jpg' },
];

describe('ListingGallery', () => {
  it('opens the cover photo in a dialog and closes on Escape', () => {
    render(<ListingGallery title="iPhone 13" images={images} />);

    fireEvent.click(screen.getByRole('button', { name: 'Открыть фото' }));
    expect(screen.getByRole('dialog', { name: 'iPhone 13' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
