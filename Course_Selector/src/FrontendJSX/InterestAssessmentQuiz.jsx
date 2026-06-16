import '../FrontendCSS/InterestAssessmentQuiz.css';

import {
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  CATEGORY,
  getRecommendedPrograms,
  saveQuizResults,
} from '../BackendFbase/courseRecommendations';
import { auth } from '../BackendFbase/Firebase';
import { useToast } from '../context/ToastContext';
import { universities } from '../data/universities';

const quizQuestions = [
  { id: 'q1', text: '1. I enjoy setting up, configuring, and maintaining computer networks or systems.', category: 'COMPUTER / IT / TECHNOLOGY' },
  { id: 'q2', text: '2. I like spending hours debugging complex code or solving logic puzzles.', category: 'COMPUTER / IT / TECHNOLOGY' },
  { id: 'q3', text: '3. I am interested in protecting digital data and identifying security vulnerabilities.', category: 'COMPUTER / IT / TECHNOLOGY' },
  { id: 'q4', text: '4. I am comfortable handling large sums of money, managing a budget, and negotiating business deals.', category: 'BUSINESS / FINANCE / MANAGEMENT' },
  { id: 'q5', text: '5. I enjoy creating detailed financial statements, tracking expenses, and ensuring legal compliance.', category: 'BUSINESS / FINANCE / MANAGEMENT' },
  { id: 'q6', text: '6. I am skilled at leading teams, delegating tasks, and setting long-term organizational goals.', category: 'BUSINESS / FINANCE / MANAGEMENT' },
  { id: 'q7', text: '7. I am not easily disgusted by blood or injury situations, and I am willing to work in a high-pressure setting.', category: 'HEALTH / MEDICAL' },
  { id: 'q8', text: '8. I have a strong interest in human anatomy, disease diagnosis, and therapeutic treatments.', category: 'HEALTH / MEDICAL' },
  { id: 'q9', text: '9. I am patient and empathetic, and I can handle sensitive situations with people who are ill or injured.', category: 'HEALTH / MEDICAL' },
  { id: 'q10', text: '10. I enjoy explaining complex ideas clearly, and I am comfortable with public speaking in front of large groups.', category: 'EDUCATION' },
  { id: 'q11', text: '11. I have patience for guiding students of different ages and learning abilities.', category: 'EDUCATION' },
  { id: 'q12', text: '12. I believe my primary motivation is to shape the knowledge and skills of the next generation.', category: 'EDUCATION' },
  { id: 'q13', text: '13. I am interested in studying human behavior, politics, and social issues to find underlying causes and solutions.', category: 'CRIMINOLOGY / SOCIAL SCIENCE' },
  { id: 'q14', text: '14. I am methodical in gathering evidence, interviewing people, and following rules and procedures strictly.', category: 'CRIMINOLOGY / SOCIAL SCIENCE' },
  { id: 'q15', text: '15. I am interested in legal systems, criminal justice, and maintaining public safety and order.', category: 'CRIMINOLOGY / SOCIAL SCIENCE' },
  { id: 'q16', text: '16. I would enjoy a job that allows me to design things (visuals, architecture, clothing, media, etc.) for aesthetic and function.', category: 'ARTS / DESIGN / MEDIA' },
  { id: 'q17', text: '17. I enjoy expressing ideas through visual media like photography, drawing, or digital illustration.', category: 'ARTS / DESIGN / MEDIA' },
  { id: 'q18', text: '18. I am good at conceptualizing spaces, structures, or products that balance beauty and usability.', category: 'ARTS / DESIGN / MEDIA' },
  { id: 'q19', text: '19. I am interested in environmental issues, plant/animal life, and applying science to practical solutions in farming or natural resources.', category: 'AGRICULTURE / ENVIRONMENT' },
  { id: 'q20', text: '20. I am comfortable working outdoors in varying weather conditions and handling natural resources or livestock.', category: 'AGRICULTURE / ENVIRONMENT' },
  { id: 'q21', text: '21. I enjoy conducting research and experiments related to sustainable food production or ecological preservation.', category: 'AGRICULTURE / ENVIRONMENT' },
  { id: 'q22', text: '22. I enjoy planning events, accommodating guests, and providing high-quality service and cultural awareness.', category: 'HOSPITALITY / TOURISM' },
  { id: 'q23', text: '23. I am detail-oriented when it comes to organizing travel itineraries, reservations, or venue setups.', category: 'HOSPITALITY / TOURISM' },
  { id: 'q24', text: '24. I thrive in fast-paced, customer-facing roles where service quality is paramount.', category: 'HOSPITALITY / TOURISM' },
  { id: 'q25', text: '25. I prefer subjects focused on pure science, advanced mathematics, and statistics (like Physics, Chemistry, and Calculus).', category: 'PURE & APPLIED SCIENCES' },
  { id: 'q26', text: '26. I am fascinated by abstract concepts, complex mathematical theorems, and experimental research.', category: 'PURE & APPLIED SCIENCES' },
  { id: 'q27', text: '27. I enjoy using logical models and data analysis to predict outcomes and solve technical problems.', category: 'PURE & APPLIED SCIENCES' },
  { id: 'q28', text: '28. I can make important decisions with limited information and frequently engage in long-term planning.', category: 'General/Soft Skills' },
  { id: 'q29', text: '29. I am a strong communicator who can persuade others and handle conflict effectively.', category: 'General/Soft Skills' },
  { id: 'q30', text: '30. I adapt quickly to new tools and environments and value continuous learning and self-improvement.', category: 'General/Soft Skills' },
];

function InterestAssessmentQuiz() {
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [stage, setStage] = useState('main');
  const [tieCategories, setTieCategories] = useState([]);
  const [tieQuestions, setTieQuestions] = useState([]);
  const [tieAnswers, setTieAnswers] = useState({});
  const [tieCurrent, setTieCurrent] = useState(0);
  const [baseResults, setBaseResults] = useState(null);
  const [animationClass, setAnimationClass] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();
  const showToast = useToast();

  const isTieBreaker = stage === 'tiebreaker';
  const questions = isTieBreaker ? tieQuestions : quizQuestions;
  const currentIndex = isTieBreaker ? tieCurrent : current;
  const activeAnswers = isTieBreaker ? tieAnswers : answers;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = questions.length ? currentIndex === questions.length - 1 : false;
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const nextLabel = isSubmitting
    ? 'Submitting...'
    : isLastQuestion
      ? (isTieBreaker ? 'Finish Tie-Breaker' : 'Finish')
      : 'Next';
  const nextAriaLabel = isLastQuestion
    ? (isTieBreaker ? 'Finish tie-breaker quiz' : 'Finish quiz')
    : 'Next question';

    // Skeleton Loader Component
    const SkeletonLoader = () => (
        <div className="quiz-page">
            <div className="quiz-container">
                <div className="back-row" style={{ marginBottom: '20px' }}>
                    <div className="skeleton-text" style={{ width: '120px', height: '40px', borderRadius: '12px' }}></div>
                </div>

                <div className="progress-wrapper">
                    <div className="progress-info">
                        <div className="skeleton-text" style={{ width: '150px', height: '16px' }}></div>
                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="skeleton-text" style={{ width: '100%', height: '100%', borderRadius: '20px' }}></div>
                    </div>
                </div>

                <div className="quiz-card" style={{ minHeight: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="skeleton-text" style={{ width: '90%', height: '32px', marginBottom: '12px' }}></div>
                    <div className="skeleton-text" style={{ width: '70%', height: '32px', marginBottom: '36px' }}></div>
                    
                    <div className="quiz-scale">
                        <div className="skeleton-text" style={{ width: '120px', height: '12px' }}></div>
                        <div className="skeleton-text" style={{ width: '150px', height: '12px' }}></div>
                    </div>

                    <div className="quiz-options">
                        {[1, 2, 3, 4, 5].map((val) => (
                            <div key={val} className="skeleton-text" style={{ flex: 1, height: '78px', borderRadius: '18px' }}></div>
                        ))}
                    </div>
                </div>

                <div className="quiz-nav">
                    <div className="skeleton-text" style={{ flex: 1, height: '54px', borderRadius: '14px' }}></div>
                    <div className="skeleton-text" style={{ flex: 1, height: '54px', borderRadius: '14px' }}></div>
                </div>
            </div>
        </div>
    );

  const getUniversitiesForProgram = (programName) => {
      if (!programName) return [];
      return universities.filter((uni) => uni.programs.includes(programName));
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const handleBackHome = () => navigate('/home');

  const handleAnswer = (value) => {
    if (!currentQuestion) return;
    const setter = isTieBreaker ? setTieAnswers : setAnswers;
    setter((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const triggerAnimation = (dir) => {
    setAnimationClass(dir === 'next' ? 'slide-next' : 'slide-prev');
    setTimeout(() => setAnimationClass(''), 500);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      triggerAnimation('prev');
      if (isTieBreaker) {
        setTieCurrent((prev) => prev - 1);
      } else {
        setCurrent((prev) => prev - 1);
      }
    }
  };

  const handleNext = async () => {
    if (!currentQuestion) return;

    if (currentIndex === questions.length - 1) {
      if (isTieBreaker) {
        await handleSubmitTieBreaker();
      } else {
        await handleSubmitQuiz();
      }
    } else {
      triggerAnimation('next');
      if (isTieBreaker) {
        setTieCurrent((prev) => prev + 1);
      } else {
        setCurrent((prev) => prev + 1);
      }
    }
  };

  const calculateResults = (questionsList, answersMap, limitedCategories = null) => {
    const categoryScores = {};
    Object.values(CATEGORY).forEach((cat) => { categoryScores[cat] = 0; });

    questionsList.forEach((q) => {
      if (q.category === 'General/Soft Skills') return;
      if (limitedCategories && !limitedCategories.includes(q.category)) return;

      const val = answersMap[q.id];
      if (val) {
        categoryScores[q.category] += val;
      }
    });

    const relevantEntries = limitedCategories
      ? limitedCategories.map((cat) => [cat, categoryScores[cat]])
      : Object.entries(categoryScores);

    const entries = relevantEntries.length ? relevantEntries : Object.entries(categoryScores);
    const topScore = Math.max(...entries.map(([, score]) => score));
    const topCategories = entries
      .filter(([, score]) => score === topScore)
      .map(([cat]) => cat);
    const recommendedCategory = topCategories[0];

    return { scores: categoryScores, recommendedCategory, topCategories, topScore };
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length < quizQuestions.length) {
      showToast('Pakisagot muna ang lahat ng katanungan.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!auth.currentUser) throw new Error('Mangyaring mag-login muna.');

      const quizRes = calculateResults(quizQuestions, answers);

      if (quizRes.topCategories.length > 1) {
        const tiedQs = quizQuestions.filter((q) => quizRes.topCategories.includes(q.category));
        setBaseResults(quizRes);
        setTieCategories(quizRes.topCategories);
        setTieQuestions(tiedQs);
        setTieAnswers({});
        setTieCurrent(0);
        setStage('tiebreaker');
        showToast('Tie detected. Answer the tie-breaker questions for the tied fields.', 'warning');
        return;
      }

      const recommendedPrograms = await getRecommendedPrograms(quizRes.recommendedCategory);

      await saveQuizResults(auth.currentUser.uid, answers, quizRes.recommendedCategory, recommendedPrograms);

      setResults({ ...quizRes, recommendedPrograms, tieBreakerUsed: false });
      setQuizCompleted(true);
      setBaseResults(null);
      showToast('Quiz results saved successfully.', 'success');
    } catch (error) {
      showToast(error.message || 'Hindi ma-save ang iyong resulta.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTieBreaker = async () => {
    if (Object.keys(tieAnswers).length < tieQuestions.length) {
      showToast('Sagutin muna ang lahat ng tie-breaker questions.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!auth.currentUser) throw new Error('Mangyaring mag-login muna.');

      const tieRes = calculateResults(tieQuestions, tieAnswers, tieCategories);
      const winningCategories = tieRes.topCategories;
      const finalCategory = winningCategories[0];

      if (winningCategories.length > 1) {
        showToast('Pantay pa rin ang scores. Pinili ang unang field bilang default.', 'warning');
      }

      const finalScores = { ...(baseResults?.scores || {}) };
      tieCategories.forEach((cat) => {
        finalScores[cat] = tieRes.scores[cat];
      });

      const recommendedPrograms = await getRecommendedPrograms(finalCategory);

      await saveQuizResults(
        auth.currentUser.uid,
        { ...answers, ...tieAnswers },
        finalCategory,
        recommendedPrograms,
      );

      setResults({
        scores: finalScores,
        recommendedCategory: finalCategory,
        recommendedPrograms,
        tieBreakerUsed: true,
        tieBreakerCategories: tieCategories,
      });
      setQuizCompleted(true);
      setStage('main');
      setBaseResults(null);
      showToast('Tie-breaker completed. Results saved.', 'success');
    } catch (error) {
      showToast(error.message || 'Hindi ma-save ang iyong tie-breaker resulta.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (quizCompleted && results) {
    const topScoreValue = Math.max(...Object.values(results.scores || {}));

    return (
      <div className="quiz-page">
        <div className="quiz-container">
          <div className="quiz-results">
            <h2 style={{ textAlign: 'center', color: 'var(--primary)' }}>🎉 Quiz Completed!</h2>
            <div className="recommended-field">
              <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Recommended Field:</h3>
              <p className="field-name">{results.recommendedCategory}</p>
            </div>
            {results.tieBreakerUsed && results.tieBreakerCategories && (
              <p className="tie-note">Tie-breaker applied for {results.tieBreakerCategories.join(' • ')}.</p>
            )}
            <p className="top-score">Highest score: {topScoreValue}/15</p>

            <div className="recommended-programs">
              <h3>Recommended Programs and Schools</h3>
              {results.recommendedPrograms?.length ? (
                <div className="program-list">
                  {results.recommendedPrograms.map((programName) => (
                    <div key={`program-${programName}`} className="program-card">
                      <div className="program-title">{programName}</div>
                      {getUniversitiesForProgram(programName).length ? (
                        <ul className="program-schools">
                          {getUniversitiesForProgram(programName).map((school) => (
                            <li key={`${programName}-${school.name}`}>
                              <span className="quiz-school-name">{school.name}</span>
                              <span className="quiz-school-location">{school.location}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="quiz-no-schools">No school matches yet.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="quiz-no-schools">No recommended programs found.</p>
              )}
            </div>
            
            <div className="category-scores">
              <h3>Interest Breakdown:</h3>
              {Object.entries(results.scores).sort(([,a],[,b]) => b-a).map(([cat, score]) => (
                <div key={cat} className="score-item">
                  <span>{cat}</span>
                  <strong>{score}/15</strong>
                </div>
              ))}
            </div>

            <div className="quiz-nav">
              <button onClick={() => navigate('/home')} className="nav-btn prev-btn">Home</button>
              <button onClick={() => {
                  setQuizCompleted(false);
                  setCurrent(0);
                  setAnswers({});
                  setTieAnswers({});
                  setTieCategories([]);
                  setTieQuestions([]);
                  setTieCurrent(0);
                  setStage('main');
                  setBaseResults(null);
              }} className="nav-btn next-btn">Retake</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

    if (!currentQuestion) {
        return <SkeletonLoader />;
    }

  return (
    <div className="quiz-page">
      <div className="quiz-container">
        <div className="back-row">
          <button className="back-home" onClick={handleBackHome} aria-label="Go back to home">
            ← Back to Home
          </button>
        </div>
        {isTieBreaker && (
          <div className="tie-banner">
            <div className="tie-banner-title">Tie-breaker round</div>
            <div className="tie-banner-body">Fields: {tieCategories.join(' • ')}</div>
          </div>
        )}
        {/* Progress Tracker */}
        <div className="progress-wrapper">
          <div className="progress-info">
            <span>Question {questions.length ? currentIndex + 1 : 0} of {questions.length}</span>
            <span aria-live="polite">{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Animated Question Card */}
        <div className={`quiz-card ${animationClass}`}>
          <p className="question-text">{currentQuestion?.text}</p>
          
          <div className="quiz-scale">
            <span>Agree</span>
            <span>Disagree</span>
          </div>

          <div className="quiz-options">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                className={`option-btn ${currentQuestion && activeAnswers[currentQuestion.id] === val ? 'selected' : ''}`}
                aria-pressed={currentQuestion ? activeAnswers[currentQuestion.id] === val : false}
                aria-label={`Select score ${val}`}
                onClick={() => handleAnswer(val)}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="quiz-nav">
          <button 
            className="nav-btn prev-btn" 
            onClick={handlePrev} 
            disabled={currentIndex === 0 || isSubmitting}
            aria-label="Previous question"
          >
            Previous
          </button>

          <button 
            className="nav-btn next-btn" 
            onClick={handleNext}
            disabled={!currentQuestion || !activeAnswers[currentQuestion.id] || isSubmitting}
            aria-label={nextAriaLabel}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterestAssessmentQuiz;