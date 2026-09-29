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

import Results from '../FrontendJSX/Results';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getUserSavedPrograms: vi.fn(),
  deleteUserProgram: vi.fn(),
  getUserLocation: vi.fn(),
  geocodeViaProxy: vi.fn(),
  getRoadDistanceViaProxy: vi.fn(),
  sortUniversitiesByDistance: vi.fn(),
  getSchoolsForProgram: vi.fn(),
  programsMatch: vi.fn(),
}))

const firebaseAuth = vi.hoisted(() => ({
  currentUser: {
    uid: 'test-user-123',
    email: 'student@example.com',
    emailVerified: true,
  },
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal()

  return {
    ...original,
    useNavigate: () => mocks.navigate,
  }
})

vi.mock('../BackendFbase/Firebase', () => ({
  auth: firebaseAuth,
}))

vi.mock('../BackendFbase/courseRecommendations', () => ({
  getUserSavedPrograms: mocks.getUserSavedPrograms,
  deleteUserProgram: mocks.deleteUserProgram,
}))

vi.mock('../FrontendJSX/OrbitLoader', () => ({
  default: ({ label }) => (
    <div role="status">{label}</div>
  ),
}))

vi.mock('../utils/location', () => ({
  getUserLocation: mocks.getUserLocation,
  geocodeViaProxy: mocks.geocodeViaProxy,
  getRoadDistanceViaProxy: mocks.getRoadDistanceViaProxy,
  sortUniversitiesByDistance: mocks.sortUniversitiesByDistance,
}))

vi.mock('../utils/programCatalog', async (importOriginal) => {
  const original = await importOriginal()

  return {
    ...original,
    getSchoolsForProgram: mocks.getSchoolsForProgram,
  }
})

vi.mock('../utils/programMatching', () => ({
  programsMatch: mocks.programsMatch,
}))

vi.mock('../data/universities', () => ({
  universities: [],
}))

vi.mock('../FrontendJSX/CareerLibrary', () => ({
  CareerInfo: ({ programName }) => (
    <div data-testid={`career-${programName}`}>
      Career information for {programName}
    </div>
  ),
}))

const createTimestamp = (milliseconds, date) => ({
  valueOf: () => milliseconds,
  toDate: () => date,
})

const savedProgram = {
  id: 'result-001',
  Score: 14,
  Recommended_Field: 'COMPUTER / IT / TECHNOLOGY',
  recommendedPrograms: [
    'Bachelor of Science in Information Technology',
    'Bachelor of Science in Computer Science',
  ],
  timestamp: createTimestamp(
    2000,
    new Date('2026-09-19T08:30:00'),
  ),
}

const secondSavedProgram = {
  id: 'result-002',
  Score: 12,
  Recommended_Field: 'BUSINESS / FINANCE / MANAGEMENT',
  recommendedPrograms: [
    'Bachelor of Science in Accountancy',
  ],
  timestamp: createTimestamp(
    1000,
    new Date('2026-09-18T08:30:00'),
  ),
}

describe('Results', () => {
  beforeEach(() => {
    firebaseAuth.currentUser = {
      uid: 'test-user-123',
      email: 'student@example.com',
      emailVerified: true,
    }

    mocks.getUserSavedPrograms.mockResolvedValue([])
    mocks.deleteUserProgram.mockResolvedValue(undefined)

    mocks.getUserLocation.mockRejectedValue(
      new Error('Location permission denied'),
    )

    mocks.geocodeViaProxy.mockResolvedValue(null)
    mocks.getRoadDistanceViaProxy.mockResolvedValue(null)

    mocks.sortUniversitiesByDistance.mockImplementation(
      (schools) => schools,
    )

    mocks.programsMatch.mockReturnValue(false)

    mocks.getSchoolsForProgram.mockImplementation((programName) => {
      if (programName === 'Bachelor of Science in Information Technology') {
        return [
          {
            name: 'National University - DasmariÃ±as',
            location: 'DasmariÃ±as, Cavite',
            campus: 'DasmariÃ±as, Cavite',
            region: 'Calabarzon',
            matchedProgram: 'Bachelor of Science in Information Technology',
            lat: 14.2995,
            lon: 120.9587,
            programDetails: {
              'Bachelor of Science in Information Technology': {
                duration: '4 years',
                status: 'Verified',
              },
            },
          },
        ]
      }

      return []
    })
  })

  it('shows the result loader while records are loading', () => {
    mocks.getUserSavedPrograms.mockImplementation(
      () => new Promise(() => {}),
    )

    render(<Results />)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent('Loading your results')
  })

  it('redirects unauthenticated users to the login page', async () => {
    firebaseAuth.currentUser = null

    render(<Results />)

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/login')
    })

    expect(
      mocks.getUserSavedPrograms,
    ).not.toHaveBeenCalled()
  })

  it('loads and displays saved results from Firebase', async () => {
    mocks.getUserSavedPrograms.mockResolvedValue([
      secondSavedProgram,
      savedProgram,
    ])

    render(<Results />)

    expect(
      await screen.findByText('COMPUTER / IT / TECHNOLOGY'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('BUSINESS / FINANCE / MANAGEMENT'),
    ).toBeInTheDocument()

    expect(
      mocks.getUserSavedPrograms,
    ).toHaveBeenCalledWith('test-user-123')

    expect(
      screen.getByText('RECORD #2'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('RECORD #1'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Bachelor of Science in Information Technology'),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Bachelor of Science in Computer Science',
        { selector: '.tag' },
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Bachelor of Science in Computer Science',
        { selector: '.suggestion-name' },
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText('National University - DasmariÃ±as'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('4 years'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Verified'),
    ).toBeInTheDocument()
  })

  it('displays an empty message when the user has no history', async () => {
    mocks.getUserSavedPrograms.mockResolvedValue([])

    render(<Results />)

    expect(
      await screen.findByText(
        'No records found yet. Start your journey today!',
      ),
    ).toBeInTheDocument()
  })

  it('deletes a confirmed history record', async () => {
    mocks.getUserSavedPrograms.mockResolvedValue([
      savedProgram,
    ])

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<Results />)

    const deleteButton = await screen.findByRole(
      'button',
      { name: 'Delete' },
    )

    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(
        mocks.deleteUserProgram,
      ).toHaveBeenCalledWith(
        'result-001',
        'test-user-123',
      )
    })

    expect(
      await screen.findByText(
        'No records found yet. Start your journey today!',
      ),
    ).toBeInTheDocument()
  })

  it('does not delete when confirmation is cancelled', async () => {
    mocks.getUserSavedPrograms.mockResolvedValue([
      savedProgram,
    ])

    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<Results />)

    fireEvent.click(
      await screen.findByRole(
        'button',
        { name: 'Delete' },
      ),
    )

    expect(
      mocks.deleteUserProgram,
    ).not.toHaveBeenCalled()

    expect(
      screen.getByText('COMPUTER / IT / TECHNOLOGY'),
    ).toBeInTheDocument()
  })

  it('shows a warning when location permission is denied', async () => {
    mocks.getUserSavedPrograms.mockResolvedValue([])

    render(<Results />)

    expect(
      await screen.findByText(
        /location not granted/i,
      ),
    ).toBeInTheDocument()
  })

  it('navigates back to the dashboard', async () => {
    render(<Results />)

    fireEvent.click(
      screen.getByRole('button', {
        name: /back to dashboard/i,
      }),
    )

    expect(
      mocks.navigate,
    ).toHaveBeenCalledWith('/home')
  })
})
