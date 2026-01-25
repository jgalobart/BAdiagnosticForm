import { useState } from 'react';
import IntroForm from './components/IntroForm';
import QuestionnaireForm from './components/QuestionnaireForm';
import ResultsReport from './components/ResultsReport';
import formData from './data/diagnosticForm.json';

const STEPS = {
  INTRO: 'intro',
  QUESTIONNAIRE: 'questionnaire',
  RESULTS: 'results'
};

function App() {
  const [currentStep, setCurrentStep] = useState(STEPS.INTRO);
  const [userData, setUserData] = useState({});
  const [answers, setAnswers] = useState({});

  const handleIntroComplete = (data) => {
    setUserData(data);
    setCurrentStep(STEPS.QUESTIONNAIRE);
  };

  const handleQuestionnaireComplete = (questionAnswers) => {
    setAnswers(questionAnswers);
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
          onComplete={handleQuestionnaireComplete}
        />
      )}

      {currentStep === STEPS.RESULTS && (
        <ResultsReport
          formData={userData}
          answers={answers}
          areas={formData.areas}
          questions={formData.questions}
          scoring={formData.scoring}
        />
      )}
    </>
  );
}

export default App;
