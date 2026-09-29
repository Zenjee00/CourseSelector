import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import CareerLibrary from '../FrontendJSX/CareerLibrary';

const testData = vi.hoisted(() => ({
  programs: [
    'Bachelor of Science in Computer Science',
    'Bachelor of Science in Accountancy',
    'Bachelor of Science in Nursing',
    'Bachelor of Early Childhood Education',
  ],
  navigate: vi.fn(),
  getCareerInfo: vi.fn(),
  getProgramDetails: vi.fn(),
  getProgramKey: vi.fn(),
  getSchoolsForProgram: vi.fn(),
  getUserLocation: vi.fn(),
  sortUniversitiesByDistance: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal()

  return {
    ...original,
    useNavigate: () => testData.navigate,
  }
})

vi.mock('../components/OrbitLoader', () => ({
  default: ({ label }) => (
    <div role="status">{label}</div>
  ),
}))

vi.mock('../data/careerLibrary', () => ({
  careerPrograms: testData.programs,

  getCareerInfo: testData.getCareerInfo,

  getProgramDetails: testData.getProgramDetails,
}))

vi.mock('../utils/location', () => ({
  getUserLocation: testData.getUserLocation,

  sortUniversitiesByDistance:
    testData.sortUniversitiesByDistance,
}))

vi.mock('../utils/programCatalog', () => ({
  getProgramKey: testData.getProgramKey,

  getSchoolsForProgram:
    testData.getSchoolsForProgram,
}))

const getProgramWrapper = (programName) => {
  const heading = screen.getByRole('heading', {
    name: programName,
  })

  return heading.closest('.library-card-wrapper')
}

describe('CareerLibrary', () => {
  beforeEach(() => {
    testData.getProgramKey.mockImplementation(
      (programName) => programName.toLowerCase(),
    )

    testData.getCareerInfo.mockImplementation(
      (programName) => ({
        jobs: [
          `${programName} Assistant`,
          'Management Trainee',
        ],
        salary: 'PHP 15,000 - PHP 28,000',
      }),
    )

    testData.getProgramDetails.mockReturnValue({
      duration: '4 years',
      status: 'Verified',
    })

    testData.getUserLocation.mockRejectedValue(
      new Error('Location unavailable'),
    )

    testData.sortUniversitiesByDistance.mockImplementation(
      (schools) => schools,
    )

    testData.getSchoolsForProgram.mockImplementation(
      (programName) => {
        if (programName === 'Bachelor of Science in Computer Science') {
          return [
            {
              name: 'National University - DasmariÃ±as',
              campus: 'DasmariÃ±as, Cavite',
              region: 'Calabarzon',
              matchedProgram: 'Bachelor of Science in Computer Science',
              details: {
                duration: '4 years',
                status: 'Verified',
              },
              distance: 8.4,
            },
          ]
        }

        return []
      },
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays all available programs', () => {
    render(<CareerLibrary />)

    expect(
      screen.getByText('Showing 4 of 4 programs'),
    ).toBeInTheDocument()

    testData.programs.forEach((programName) => {
      expect(
        screen.getByRole('heading', {
          name: programName,
        }),
      ).toBeInTheDocument()
    })
  })

  it('filters programs using the search input', () => {
    render(<CareerLibrary />)

    fireEvent.change(
      screen.getByPlaceholderText(
        'Try Computer Science',
      ),
      {
        target: {
          value: 'computer',
        },
      },
    )

    expect(
      screen.getByRole('heading', {
        name: 'Bachelor of Science in Computer Science',
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Bachelor of Science in Accountancy',
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.getByText('Showing 1 of 4 programs'),
    ).toBeInTheDocument()
  })

  it('shows an empty message for an unknown search', () => {
    render(<CareerLibrary />)

    fireEvent.change(
      screen.getByPlaceholderText(
        'Try Computer Science',
      ),
      {
        target: {
          value: 'Unknown Program XYZ',
        },
      },
    )

    expect(
      screen.getByText('No matching programs found.'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Showing 0 of 4 programs'),
    ).toBeInTheDocument()
  })

  it('filters programs by category', () => {
    render(<CareerLibrary />)

    fireEvent.change(
      screen.getByRole('combobox'),
      {
        target: {
          value: 'Business',
        },
      },
    )

    expect(
      screen.getByRole('heading', {
        name: 'Bachelor of Science in Accountancy',
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Bachelor of Science in Computer Science',
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.getByText('Showing 1 of 4 programs'),
    ).toBeInTheDocument()
  })

  it('adds and removes a program from favorites', async () => {
    render(<CareerLibrary />)

    const computerWrapper = getProgramWrapper(
      'Bachelor of Science in Computer Science',
    )

    fireEvent.click(
      within(computerWrapper).getByRole(
        'button',
        { name: 'Favorite' },
      ),
    )

    expect(
      within(computerWrapper).getByRole(
        'button',
        { name: 'Remove favorite' },
      ),
    ).toBeInTheDocument()

    await waitFor(() => {
      const storedFavorites = JSON.parse(
        localStorage.getItem(
          'course_selector_favorites',
        ),
      )

      expect(storedFavorites).toContain(
        'bachelor of science in computer science',
      )
    })

    fireEvent.click(
      within(computerWrapper).getByRole(
        'button',
        { name: 'Remove favorite' },
      ),
    )

    expect(
      within(computerWrapper).getByRole(
        'button',
        { name: 'Favorite' },
      ),
    ).toBeInTheDocument()
  })

  it('shows only favorite programs', () => {
    localStorage.setItem(
      'course_selector_favorites',
      JSON.stringify(['bachelor of science in computer science']),
    )

    render(<CareerLibrary />)

    fireEvent.change(
      screen.getByRole('combobox'),
      {
        target: {
          value: 'Favorites',
        },
      },
    )

    expect(
      screen.getByRole('heading', {
        name: 'Bachelor of Science in Computer Science',
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Bachelor of Science in Nursing',
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.getByText('Showing 1 of 4 programs'),
    ).toBeInTheDocument()
  })

  it('opens and closes the recommended-school dialog', () => {
    render(<CareerLibrary />)

    const computerHeading = screen.getByRole(
      'heading',
      { name: 'Bachelor of Science in Computer Science' },
    )

    fireEvent.click(
      computerHeading.closest('.library-card'),
    )

    expect(
      screen.getByRole('dialog', {
        name: 'Bachelor of Science in Computer Science',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'National University - DasmariÃ±as',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText('8 km away'),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Close school list',
      }),
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('closes the school dialog when Escape is pressed', () => {
    render(<CareerLibrary />)

    fireEvent.click(
      screen
        .getByRole('heading', {
          name: 'Bachelor of Science in Computer Science',
        })
        .closest('.library-card'),
    )

    expect(
      screen.getByRole('dialog'),
    ).toBeInTheDocument()

    fireEvent.keyDown(document, {
      key: 'Escape',
    })

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('compares two selected programs', () => {
    vi.useFakeTimers()

    render(<CareerLibrary />)

    const computerWrapper = getProgramWrapper(
      'Bachelor of Science in Computer Science',
    )

    fireEvent.click(
      within(computerWrapper).getByRole(
        'button',
        { name: 'Compare' },
      ),
    )

    expect(
      screen.getByText(
        'Select one more course to open the comparison.',
      ),
    ).toBeInTheDocument()

    const accountancyWrapper = getProgramWrapper(
      'Bachelor of Science in Accountancy',
    )

    fireEvent.click(
      within(accountancyWrapper).getByRole(
        'button',
        { name: 'Compare' },
      ),
    )

    expect(
      screen.getByRole('status', {
        name: 'Preparing comparison',
      }),
    ).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(700)
    })

    expect(
      screen.getByRole('dialog', {
        name: 'Compare your courses',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Bachelor of Science in Computer Science',
        level: 3,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Bachelor of Science in Accountancy',
        level: 3,
      }),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Close comparison',
      }),
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('navigates back to the dashboard', () => {
    render(<CareerLibrary />)

    fireEvent.click(
      screen.getByRole('button', {
        name: /back to dashboard/i,
      }),
    )

    expect(
      testData.navigate,
    ).toHaveBeenCalledWith('/home')
  })
})
