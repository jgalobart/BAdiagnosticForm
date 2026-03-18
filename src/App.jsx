import { useState, useEffect, useMemo } from 'react';
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
  const urlTicketId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('idTiquet') || '';
  }, []);

  const [currentStep, setCurrentStep] = useState(urlTicketId ? STEPS.QUESTIONNAIRE : STEPS.INTRO);
  const [introData, setIntroData] = useState({});
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const initSession = async () => {
      const session = await createSession(urlTicketId);
      if (session) {
        setSessionId(session.id);
      }
    };
    initSession();
  }, [urlTicketId]);

  const handleIntroComplete = async (data) => {
    setIntroData(data);
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {urlTicketId && (
            <div className="max-w-3xl mx-auto px-4 pt-6">
              <div className="bg-white border border-blue-200 rounded-2xl shadow-sm p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">idTiquet:</span> {urlTicketId}
                </p>
              </div>
            </div>
          )}

          <QuestionnaireForm
            areas={formData.areas}
            questions={formData.questions}
            sessionId={sessionId}
            onComplete={handleQuestionnaireComplete}
            scoring={formData.scoring}
          />
        </div>
      )}

      {currentStep === STEPS.RESULTS && (
        <ResultsReport
          answers={answers}
          areas={formData.areas}
          questions={formData.questions}
          scoring={formData.scoring}
          sessionId={sessionId}
          idTiquet={urlTicketId}
          introData={introData}
        />
      )}
    </>
  );
}

export default App;
