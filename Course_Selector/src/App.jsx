import './App.css';

import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Home from './FrontendJSX/Home';
import InterestAssessmentQuiz from './FrontendJSX/InterestAssessmentQuiz';
import LoginRegister from './FrontendJSX/LoginRegister';
import Results from './FrontendJSX/Results';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/home" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/quiz" element={<InterestAssessmentQuiz />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;