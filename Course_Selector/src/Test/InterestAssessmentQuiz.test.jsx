import { MemoryRouter } from 'react-router-dom';
import {
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

import InterestAssessmentQuiz from '../FrontendJSX/InterestAssessmentQuiz';

vi.mock('../BackendFbase/courseRecommendations', () => ({
  CATEGORY: {
    COMPUTER: 'COMPUTER / IT / TECHNOLOGY',
    BUSINESS: 'BUSINESS / FINANCE / MANAGEMENT',
    HEALTH: 'HEALTH / MEDICAL',
    EDUCATION: 'EDUCATION',
    SOCIAL: 'CRIMINOLOGY / SOCIAL SCIENCE',
    ARTS: 'ARTS / DESIGN / MEDIA',
    AGRICULTURE: 'AGRICULTURE / ENVIRONMENT',
    HOSPITALITY: 'HOSPITALITY / TOURISM',
    SCIENCE: 'PURE & APPLIED SCIENCES',
  },
  getRecommendedPrograms: vi.fn(),
  saveQuizResults: vi.fn(),
}));

vi.mock('../BackendFbase/Firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user',
    },
  },
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => vi.fn(),
}));

vi.mock('../data/universities', () => ({
  universities: [],
}));

vi.mock('../FrontendJSX/CareerLibrary', () => ({
  CareerInfo: ({ programName }) => <div>{programName}</div>,
}));

const renderQuiz = () => render(
  <MemoryRouter>
    <InterestAssessmentQuiz />
  </MemoryRouter>,
);

describe('InterestAssessmentQuiz', () => {
  it('shows the first question and starts at 3 percent', () => {
    renderQuiz();

    expect(screen.getByText(/setting up, configuring, and maintaining computer networks/i))
      .toBeInTheDocument();
    expect(screen.getByText('Question 1 of 30')).toBeInTheDocument();
    expect(screen.getByText('3%')).toBeInTheDocument();
  });

  it('disables Next until the user selects a score', () => {
    renderQuiz();

    const nextButton = screen.getByRole('button', { name: 'Next question' });
    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Select score 5' }));

    expect(nextButton).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Select score 5' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('moves to question 2 after answering question 1', () => {
    renderQuiz();

    fireEvent.click(screen.getByRole('button', { name: 'Select score 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));

    expect(screen.getByText(/debugging complex code or solving logic puzzles/i))
      .toBeInTheDocument();
    expect(screen.getByText('Question 2 of 30')).toBeInTheDocument();
  });
});
