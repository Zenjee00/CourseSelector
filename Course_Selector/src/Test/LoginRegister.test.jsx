import { MemoryRouter } from 'react-router-dom';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import LoginRegister from '../FrontendJSX/LoginRegister';

const authMocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  sendEmailVerification: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('firebase/auth', () => authMocks);
vi.mock('firebase/firestore', () => firestoreMocks);

vi.mock('../BackendFbase/Firebase', () => ({
  auth: { name: 'test-auth' },
  db: { name: 'test-db' },
  googleProvider: { name: 'test-google-provider' },
}));

const renderLogin = () => render(
  <MemoryRouter>
    <LoginRegister />
  </MemoryRouter>,
);

describe('LoginRegister', () => {
  beforeEach(() => {
    authMocks.reload.mockResolvedValue(undefined);
    authMocks.sendEmailVerification.mockResolvedValue(undefined);
    authMocks.signOut.mockResolvedValue(undefined);
    firestoreMocks.doc.mockReturnValue({ name: 'user-reference' });
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
  });

  it('shows an error when registration passwords do not match', async () => {
    renderLogin();

    fireEvent.click(screen.getByText('Register', { selector: '.toggle-link' }));
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'student@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'different123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Passwords do not match!')).toBeInTheDocument();
    expect(authMocks.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('signs out an email user whose account is not verified', async () => {
    const unverifiedUser = {
      uid: 'user-123',
      email: 'student@example.com',
      emailVerified: false,
    };

    authMocks.signInWithEmailAndPassword.mockResolvedValue({
      user: unverifiedUser,
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'student@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(authMocks.sendEmailVerification).toHaveBeenCalledWith(unverifiedUser);
      expect(authMocks.signOut).toHaveBeenCalled();
    });

    expect(await screen.findByText(/verification email sent/i)).toBeInTheDocument();
    expect(authMocks.getIdTokenResult).not.toHaveBeenCalled();
    expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
  });
});
