import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import AreaSection from './AreaSection';
import ProgressBar from './ProgressBar';
import { saveAnswer } from '../lib/supabase';

export default function QuestionnaireForm({ areas, questions, sessionId, onComplete, scoring }) {
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const currentArea = areas[currentAreaIndex];
  const areaQuestions = questions.filter(q => q.area === currentArea.area);
  
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;

  const handleAnswer = async (questionId, optionId, score) => {
    const question = questions.find(q => q.id === questionId);
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: { optionId, score }
    }));

    if (sessionId) {
      await saveAnswer(sessionId, questionId, optionId, score, question?.area);
    }
  };

  const isCurrentAreaComplete = () => {
    return areaQuestions.every(q => answers[q.id]);
  };

  const canGoNext = () => {
    return isCurrentAreaComplete() && currentAreaIndex < areas.length - 1;
  };

  const canSubmit = () => {
    return currentAreaIndex === areas.length - 1 && isCurrentAreaComplete();
  };

  const handleNext = () => {
    if (canGoNext()) {
      setCurrentAreaIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentAreaIndex > 0) {
      setCurrentAreaIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const calculateResults = useMemo(() => {
    const areaScores = {};
    
    areas.forEach(area => {
      const areaQuestions = questions.filter(q => q.area === area.area);
      const totalScore = areaQuestions.reduce((sum, q) => {
        return sum + (answers[q.id]?.score || 0);
      }, 0);
      areaScores[area.area] = {
        ...area,
        score: totalScore,
        maxScore: area.max_score,
        percentage: Math.round((totalScore / area.max_score) * 100)
      };
    });

    const totalScore = Object.values(areaScores).reduce((sum, a) => sum + a.score, 0);

    const getThreshold = (score, thresholds) => {
      return thresholds.find(t => 
        score >= t.range_inclusive[0] && score <= t.range_inclusive[1]
      );
    };

    const globalThreshold = getThreshold(totalScore, scoring.global.thresholds);
    
    const priorityAreas = Object.values(areaScores)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(a => ({ id: a.id, area: a.area, title: a.title, score: a.score }));

    return {
      areaScores,
      totalScore,
      globalThreshold,
      priorityAreas
    };
  }, [answers, areas, questions, scoring]);

  const handleSubmit = () => {
    if (canSubmit()) {
      onComplete(answers, calculateResults);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ProgressBar 
        current={answeredQuestions} 
        total={totalQuestions}
        areas={areas}
        currentAreaIndex={currentAreaIndex}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <AreaSection
          area={currentArea}
          questions={areaQuestions}
          answers={answers}
          onAnswer={handleAnswer}
        />

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentAreaIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              currentAreaIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          {canSubmit() ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
            >
              Veure resultats
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
                canGoNext()
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Següent
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {!isCurrentAreaComplete() && (
          <p className="text-center text-gray-500 mt-4 text-sm">
            Respon totes les preguntes d'aquesta àrea per continuar
          </p>
        )}
      </div>
    </div>
  );
}
