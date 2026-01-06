import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

// Mock the auth hook at the top level
vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    initialized: true,
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);

    // App should render without throwing errors
    expect(container).toBeTruthy();
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('renders the main app structure', () => {
    const { container } = render(<App />);

    // Should have the ErrorBoundary wrapper
    expect(container.firstChild).toBeTruthy();
  });
});
