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
} from '@testing-library/react';

import OfflineBanner from '../FrontendJSX/OfflineBanner';

const setOnlineStatus = (status) => {
  Object.defineProperty(
    navigator,
    'onLine',
    {
      configurable: true,
      value: status,
    },
  )
}

describe('OfflineBanner', () => {
  beforeEach(() => {
    setOnlineStatus(true)
  })

  it('does not display a warning while online', () => {
    render(<OfflineBanner />)

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('displays a warning when the page starts offline', () => {
    setOnlineStatus(false)

    render(<OfflineBanner />)

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No internet connection. Some features may be unavailable.',
    )
  })

  it('displays the warning when the browser goes offline', () => {
    render(<OfflineBanner />)

    setOnlineStatus(false)

    fireEvent(
      window,
      new Event('offline'),
    )

    expect(
      screen.getByRole('alert'),
    ).toBeInTheDocument()
  })

  it('removes the warning when the connection returns', () => {
    setOnlineStatus(false)

    render(<OfflineBanner />)

    expect(
      screen.getByRole('alert'),
    ).toBeInTheDocument()

    setOnlineStatus(true)

    fireEvent(
      window,
      new Event('online'),
    )

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('removes its event listeners when unmounted', () => {
    const removeListenerSpy = vi.spyOn(
      window,
      'removeEventListener',
    )

    const { unmount } = render(
      <OfflineBanner />,
    )

    unmount()

    expect(
      removeListenerSpy,
    ).toHaveBeenCalledWith(
      'online',
      expect.any(Function),
    )

    expect(
      removeListenerSpy,
    ).toHaveBeenCalledWith(
      'offline',
      expect.any(Function),
    )
  })
})