import { useState, useEffect } from 'react';
import IntroForm from './components/IntroForm';
import QuestionnaireForm from './components/QuestionnaireForm';
import ResultsReport from './components/ResultsReport';
import formData from './data/diagnosticForm.json';
import { createSession, saveIntroData, completeSession } from './lib/supabase';

const STEPS = {
  INTRO: 'intro',
  QUESTIONNAIRE: 'questionnaire',
  RESULTS: 'results'
};

function App() {
  const [currentStep, setCurrentStep] = useState(STEPS.INTRO);
  const [userData, setUserData] = useState({});
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const initSession = async () => {
      const session = await createSession();
      if (session) {
        setSessionId(session.id);
      }
    };
    initSession();
  }, []);

  const handleIntroComplete = async (data) => {
    setUserData(data);
    if (sessionId) {
      await saveIntroData(sessionId, data);
    }
    setCurrentStep(STEPS.QUESTIONNAIRE);
  };

  const handleQuestionnaireComplete = async (questionAnswers, results) => {
    setAnswers(questionAnswers);
    if (sessionId && results) {
      await completeSession(sessionId, results);
    }
    setCurrentStep(STEPS.RESULTS);
  };

  return (
    <>
      {currentStep === STEPS.INTRO && (
        <IntroForm 
          intro={formData.intro} 
          onComplete={handleIntroComplete} 
        />
      )}

      {currentStep === STEPS.QUESTIONNAIRE && (
        <QuestionnaireForm
          areas={formData.areas}
          questions={formData.questions}
          sessionId={sessionId}
          onComplete={handleQuestionnaireComplete}
          scoring={formData.scoring}
        />
      )}

      {currentStep === STEPS.RESULTS && (
        <ResultsReport
          formData={userData}
          answers={answers}
          areas={formData.areas}
          questions={formData.questions}
          scoring={formData.scoring}
          sessionId={sessionId}
        />
      )}
    </>
  );
}

export default App;
