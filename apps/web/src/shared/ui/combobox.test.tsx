import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Combobox } from './combobox';

describe('Combobox', () => {
  it('portals the listbox to document.body so overflow parents cannot clip it', () => {
    const { container } = render(
      <div style={{ overflow: 'hidden', height: 24 }}>
        <Combobox
          value="BY"
          onChange={() => undefined}
          options={[
            { value: 'BY', label: 'BY' },
            { value: 'RU', label: 'RU' },
          ]}
          aria-label="Страна"
        />
      </div>,
    );

    fireEvent.focus(screen.getByRole('combobox', { name: 'Страна' }));

    const list = screen.getByRole('listbox');
    expect(list.parentElement).toBe(document.body);
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(screen.getByRole('option', { name: 'RU' })).toBeInTheDocument();
  });
});
