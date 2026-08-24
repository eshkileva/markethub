import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders label', () => {
    render(<Button>Разместить</Button>);
    expect(screen.getByRole('button', { name: 'Разместить' })).toBeInTheDocument();
  });
});
