import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ThemeProvider from '../context/ThemeProvider';
import Home from '../FrontendJSX/Home';
import GuestFeatureGate from '../FrontendJSX/GuestFeatureGate';
import Simulator from '../FrontendJSX/Simulator';
import SwipeGame from '../FrontendJSX/SwipeGame';

const session = vi.hoisted(() => ({
  user: null,
  unsubscribe: vi.fn(),
  signOut: vi.fn(),
  getUserSavedPrograms: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, callback) => {
    callback(session.user);
    return session.unsubscribe;
  },
  signOut: session.signOut,
  deleteUser: vi.fn(),
  getIdTokenResult: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), deleteDoc: vi.fn(), doc: vi.fn(),
  getDocs: vi.fn(), query: vi.fn(), where: vi.fn(),
}));

vi.mock('../BackendFbase/Firebase', () => ({ auth: {}, db: {} }));
vi.mock('../BackendFbase/courseRecommendations', () => ({
  getUserSavedPrograms: session.getUserSavedPrograms,
}));
vi.mock('../context/useToast', () => ({ useToast: () => session.showToast }));

function renderFlow(path = '/home') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider userId={session.user?.uid}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<h1>Login screen</h1>} />
          <Route path="/results" element={session.user ? <h1>Saved assessments</h1> : <GuestFeatureGate feature="saved history" />} />
          <Route path="/swipe-match" element={<SwipeGame />} />
          <Route path="/day-in-the-life" element={<Simulator />} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

function openSettingsAction(name) {
  fireEvent.click(screen.getByRole('button', { name: 'Open settings menu' }));
  fireEvent.click(screen.getByRole('menuitem', { name }));
}

describe('guest and account navigation', () => {
  beforeEach(() => {
    session.user = null;
    session.getUserSavedPrograms.mockResolvedValue([{ id: 'assessment-1' }]);
    session.signOut.mockResolvedValue(undefined);
  });

  it('asks before leaving guest mode from Settings and stays on home when declined', () => {
    localStorage.setItem('theme:guest', 'dark');
    renderFlow();
    openSettingsAction('Sign in');

    const dialog = screen.getByRole('dialog', { name: 'Log in to your account?' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Continue as guest' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Who am I' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('theme:guest')).toBe('dark');
  });

  it('opens the same choice from the Guest profile button', () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('dialog', { name: 'Log in to your account?' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
  });

  it('lets a guest ask about history without sending them straight to login', () => {
    renderFlow();
    const history = screen.getByRole('button', { name: 'Saved history (0)' });
    expect(history).toBeEnabled();
    fireEvent.click(history);
    expect(screen.getByRole('dialog', { name: 'Log in to your account?' })).toBeInTheDocument();
    expect(session.getUserSavedPrograms).not.toHaveBeenCalled();
  });

  it('opens the light login page only after the guest confirms', () => {
    localStorage.setItem('theme:guest', 'dark');
    renderFlow();
    openSettingsAction('Sign in');
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem('theme:guest')).toBe('dark');
  });

  it.each([
    ['Preview Swipe Match', 'Swipe Match'],
    ['Preview Day in a Life', 'Day in a Life'],
  ])('opens %s and provides a way back', (link, title) => {
    renderFlow();
    fireEvent.click(screen.getByRole('link', { name: link }));
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText(/This mode is coming soon/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Back to CourseNFound' }));
    expect(screen.getByRole('link', { name: 'Start Who am I' })).toBeInTheDocument();
  });

  it('provides a guest exit when saved history is opened directly', () => {
    renderFlow('/results');
    fireEvent.click(screen.getByRole('button', { name: 'Continue as guest' }));
    expect(screen.getByRole('link', { name: 'Start Who am I' })).toBeInTheDocument();
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
  });

  it('lets the saved-history gate lead to login when requested', () => {
    renderFlow('/results');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to continue' }));
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });

  it('keeps the signed-in profile, history, and logout confirmation available', async () => {
    session.user = { uid: 'student-1', email: 'student@example.com', displayName: 'Student' };
    renderFlow();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Saved history (1)' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'View profile' }));
    expect(screen.getByRole('dialog', { name: 'Profile' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel profile edits' }));
    openSettingsAction('Logout');
    expect(session.signOut).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel logout' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Saved history (1)' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Saved history (1)' }));
    expect(screen.getByRole('heading', { name: 'Saved assessments' })).toBeInTheDocument();
  });

  it('signs out an account only after confirmation', async () => {
    session.user = { uid: 'student-1', email: 'student@example.com' };
    renderFlow();
    openSettingsAction('Logout');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm logout' }));
    await waitFor(() => expect(session.signOut).toHaveBeenCalledOnce());
    expect(await screen.findByText('Login screen')).toBeInTheDocument();
  });
});
