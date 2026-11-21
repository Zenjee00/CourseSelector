import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ThemeProvider from '../context/ThemeProvider';
import { useTheme } from '../context/useTheme';

function Controls() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  return <><output aria-label="Current theme">{theme}</output><button onClick={toggleTheme}>Toggle theme</button><button onClick={() => navigate('/login')}>Open login</button><button onClick={() => navigate('/home')}>Open home</button></>;
}
function ScopedApp({ userId }) {
  return <MemoryRouter initialEntries={['/home']}><ThemeProvider key={userId || 'guest'} userId={userId}><Controls /></ThemeProvider></MemoryRouter>;
}
function expectTheme(theme) {
  expect(screen.getByLabelText('Current theme')).toHaveTextContent(theme);
  expect(document.documentElement).toHaveAttribute('data-theme', theme);
  expect(document.body).toHaveAttribute('data-theme', theme);
}

describe('theme ownership', () => {
  it('does not copy a guest or legacy dark theme into an account', () => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('theme:guest', 'dark');
    render(<ScopedApp userId="alice" />);
    expectTheme('light');
    expect(localStorage.getItem('theme:alice')).toBeNull();
  });
  it('keeps login and registration light without overwriting the guest preference', () => {
    localStorage.setItem('theme:guest', 'dark');
    render(<ScopedApp />);
    expectTheme('dark');
    fireEvent.click(screen.getByText('Open login'));
    expectTheme('light');
    expect(localStorage.getItem('theme:guest')).toBe('dark');
    fireEvent.click(screen.getByText('Open home'));
    expectTheme('dark');
  });
  it('restores the account preference when the home route remounts', () => {
    localStorage.setItem('theme:alice', 'dark');
    const view = render(<ScopedApp userId="alice" />);
    expectTheme('dark');
    view.unmount();
    render(<ScopedApp userId="alice" />);
    expectTheme('dark');
    fireEvent.click(screen.getByText('Toggle theme'));
    expectTheme('light');
    expect(localStorage.getItem('theme:alice')).toBe('light');
    expect(localStorage.getItem('theme:guest')).toBeNull();
  });
  it('isolates successive users on a shared browser', () => {
    const view = render(<ScopedApp />);
    fireEvent.click(screen.getByText('Toggle theme'));
    expectTheme('dark');
    view.rerender(<ScopedApp userId="alice" />);
    expectTheme('light');
    fireEvent.click(screen.getByText('Toggle theme'));
    expect(localStorage.getItem('theme:alice')).toBe('dark');
    view.rerender(<ScopedApp userId="bob" />);
    expectTheme('light');
    view.rerender(<ScopedApp />);
    expectTheme('dark');
    expect(localStorage.getItem('theme:bob')).toBeNull();
  });
  it('does not crash when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
    render(<ScopedApp userId="alice" />);
    expectTheme('light');
    fireEvent.click(screen.getByText('Toggle theme'));
    expectTheme('dark');
  });
});
