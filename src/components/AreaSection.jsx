import QuestionCard from './QuestionCard';

export default function AreaSection({ area, questions, answers, onAnswer }) {
  const isQuestionAnswered = (question) => {
    const a = answers[question.id];
    if (!a) return false;
    const type = question.type || a.type || 'single_choice';

    if (type === 'text') {
      return typeof a.text === 'string' && a.text.trim().length > 0;
    }

    if (type === 'multiple_choice') {
      return Array.isArray(a.optionIds) && a.optionIds.length > 0;
    }

    return !!a.optionId;
  };

  const answeredCount = questions.filter((q) => isQuestionAnswered(q)).length;
  const totalQuestions = questions.length;
  const isComplete = answeredCount === totalQuestions;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">{area.title}</h2>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isComplete ? 'bg-green-500' : 'bg-white/20'
            }`}>
              {answeredCount}/{totalQuestions}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            answer={answers[question.id]}
            onSelect={onAnswer}
          />
        ))}
      </div>
    </div>
  );
}
