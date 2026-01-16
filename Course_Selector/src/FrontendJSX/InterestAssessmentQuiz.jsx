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
  const [animationClass, setAnimationClass] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();

  const progress = ((current + 1) / quizQuestions.length) * 100;

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const handleBackHome = () => navigate('/home');

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [quizQuestions[current].id]: value });
  };

  const triggerAnimation = (dir) => {
    setAnimationClass(dir === 'next' ? 'slide-next' : 'slide-prev');
    setTimeout(() => setAnimationClass(''), 500);
  };

  const handlePrev = () => {
    if (current > 0) {
      triggerAnimation('prev');
      setCurrent(current - 1);
    }
  };

  const handleNext = async () => {
    if (current === quizQuestions.length - 1) {
      // Auto submit on last question
      await handleSubmitQuiz();
    } else {
      triggerAnimation('next');
      setCurrent(current + 1);
    }
  };

  const calculateResults = () => {
    const categoryScores = {};
    Object.values(CATEGORY).forEach(cat => categoryScores[cat] = 0);

    quizQuestions.forEach(q => {
      const val = answers[q.id];
      if (val && q.category !== 'General/Soft Skills') {
        categoryScores[q.category] += val;
      }
    });

    const topCategory = Object.keys(categoryScores).reduce((a, b) => 
      categoryScores[a] > categoryScores[b] ? a : b
    );

    return { scores: categoryScores, recommendedCategory: topCategory };
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length < quizQuestions.length) {
      alert('Pakisagot muna ang lahat ng katanungan.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!auth.currentUser) throw new Error('Mangyaring mag-login muna.');
      
      const quizRes = calculateResults();
      const recommendedPrograms = await getRecommendedPrograms(quizRes.recommendedCategory);
      
      await saveQuizResults(auth.currentUser.uid, answers, quizRes.recommendedCategory, recommendedPrograms);
      
      setResults({ ...quizRes, recommendedPrograms });
      setQuizCompleted(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (quizCompleted && results) {
    return (
      <div className="quiz-page">
        <div className="quiz-container">
          <div className="quiz-results">
            <h2 style={{ textAlign: 'center', color: 'var(--primary)' }}>🎉 Quiz Completed!</h2>
            <div className="recommended-field">
              <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Recommended Field:</h3>
              <p className="field-name">{results.recommendedCategory}</p>
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
              }} className="nav-btn next-btn">Retake</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <div className="quiz-container">
        <div className="back-row">
          <button className="back-home" onClick={handleBackHome}>
            ← Back to Home
          </button>
        </div>
        {/* Progress Tracker */}
        <div className="progress-wrapper">
          <div className="progress-info">
            <span>Question {current + 1} of {quizQuestions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Animated Question Card */}
        <div className={`quiz-card ${animationClass}`}>
          <p className="question-text">{quizQuestions[current].text}</p>
          
          <div className="quiz-scale">
            <span>Hindi Sumasang-ayon</span>
            <span>Lubos na Sumasang-ayon</span>
          </div>

          <div className="quiz-options">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                className={`option-btn ${answers[quizQuestions[current].id] === val ? 'selected' : ''}`}
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
            disabled={current === 0 || isSubmitting}
          >
            Previous
          </button>

          <button 
            className="nav-btn next-btn" 
            onClick={handleNext}
            disabled={!answers[quizQuestions[current].id] || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : (current === quizQuestions.length - 1 ? 'Finish' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterestAssessmentQuiz;