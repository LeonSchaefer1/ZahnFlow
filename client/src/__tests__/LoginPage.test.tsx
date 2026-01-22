import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { theme } from '../theme/theme';
import { AuthProvider } from '../contexts/AuthContext';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import LoginPage from '../pages/LoginPage';

// Mock the auth service
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    getCurrentUser: vi.fn().mockRejectedValue(new Error('Not authenticated')),
    logout: vi.fn(),
  },
}));

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <SnackbarProvider>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </SnackbarProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with title', () => {
    renderLoginPage();

    expect(screen.getByText('ZahnFlow')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anmelden/i })).toBeInTheDocument();
  });

  it('renders email input field', () => {
    renderLoginPage();

    const emailInput = screen.getByRole('textbox', { name: /E-Mail/i });
    expect(emailInput).toBeInTheDocument();
  });

  it('allows entering values in form fields', () => {
    renderLoginPage();

    const emailInput = screen.getByRole('textbox', { name: /E-Mail/i });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('displays DSGVO compliance text', () => {
    renderLoginPage();

    expect(screen.getByText(/DSGVO-konform/i)).toBeInTheDocument();
    expect(screen.getByText(/Self-Hosted/i)).toBeInTheDocument();
    expect(screen.getByText(/Made in Germany/i)).toBeInTheDocument();
  });
});
