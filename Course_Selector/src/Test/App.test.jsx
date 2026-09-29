import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  act,
  render,
  screen,
} from '@testing-library/react';

import App from '../App';

const authState = vi.hoisted(() => ({
  callback: null,
  unsubscribe: vi.fn(),
  onIdTokenChanged: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onIdTokenChanged: authState.onIdTokenChanged,
}));

vi.mock('../BackendFbase/Firebase', () => ({
  auth: { name: 'test-auth' },
}));

vi.mock('../context/ToastContext', () => ({
  ToastProvider: ({ children }) => children,
}));

vi.mock('../FrontendJSX/OrbitLoader', () => ({
  default: ({ label }) => <div>{label}</div>,
}));

vi.mock('../FrontendJSX/LoginRegister', () => ({
  default: () => <div>Login screen</div>,
}));

vi.mock('../FrontendJSX/Home', () => ({
  default: () => <div>Home screen</div>,
}));

vi.mock('../FrontendJSX/CareerLibrary', () => ({
  default: () => <div>Career Library screen</div>,
}));

vi.mock('../FrontendJSX/Results', () => ({
  default: () => <div>Results screen</div>,
}));

vi.mock('../FrontendJSX/InterestAssessmentQuiz', () => ({
  default: () => <div>Quiz screen</div>,
}));

vi.mock('../FrontendJSX/GameModePlaceholder', () => ({
  default: ({ title }) => <div>{title}</div>,
}));

describe('App route protection', () => {
  beforeEach(() => {
    authState.callback = null;
    authState.onIdTokenChanged.mockImplementation((_auth, callback) => {
      authState.callback = callback;
      return authState.unsubscribe;
    });
  });

  it('shows a session loader while Firebase is checking the user', () => {
    window.history.replaceState({}, '', '/');
    render(<App />);

    expect(screen.getByText('Restoring your session')).toBeInTheDocument();
  });

  it('redirects an unverified user to the login screen', async () => {
    window.history.replaceState({}, '', '/home');
    render(<App />);

    await act(async () => {
      authState.callback({
        uid: 'unverified-user',
        emailVerified: false,
      });
    });

    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Home screen')).not.toBeInTheDocument();
  });

  it('allows a verified user to open the protected home route', async () => {
    window.history.replaceState({}, '', '/home');
    render(<App />);

    await act(async () => {
      authState.callback({
        uid: 'verified-user',
        emailVerified: true,
      });
    });

    expect(screen.getByText('Home screen')).toBeInTheDocument();
  });
});
