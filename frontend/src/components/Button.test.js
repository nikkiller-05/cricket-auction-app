import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

test('renders its children', () => {
  render(<Button>Place Bid</Button>);
  expect(screen.getByRole('button', { name: /place bid/i })).toBeInTheDocument();
});

test('fires onClick when pressed', () => {
  const onClick = jest.fn();
  render(<Button onClick={onClick}>Sell</Button>);
  fireEvent.click(screen.getByRole('button', { name: /sell/i }));
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('is disabled when disabled or loading', () => {
  const { rerender } = render(<Button disabled>Undo</Button>);
  expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
  rerender(<Button loading>Undo</Button>);
  expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
});
