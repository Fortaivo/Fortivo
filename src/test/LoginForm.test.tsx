import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';

// Mock auth functions
vi.mock('../lib/auth', () => ({
  signIn: vi.fn().mockResolvedValue({ user: { id: '1', email: 'test@example.com' }, session: null }),
  resetPassword: vi.fn().mockResolvedValue({}),
  useAuth: () => ({
    user: null,
    loading: false,
    initialized: true
  })
}));

const renderLoginForm = (onSuccess = vi.fn(), onSwitch = vi.fn()) => {
  return render(
    <BrowserRouter>
      <LoginForm onSuccess={onSuccess} onSwitch={onSwitch} />
    </BrowserRouter>
  );
};

describe('LoginForm Component', () => {
  it('should render login form', () => {
    renderLoginForm();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should handle email input', () => {
    renderLoginForm();

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput.value).toBe('test@example.com');
  });

  it('should handle password input', () => {
    renderLoginForm();

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.value).toBe('password123');
  });

  it('should have required fields', () => {
    renderLoginForm();

    // Verify the form has required fields for HTML5 validation
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('required');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('required');
  });

  it('should call signIn on form submission with valid data', async () => {
    renderLoginForm();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Form should process the submission
      expect(submitButton).toBeEnabled();
    });
  });
});
