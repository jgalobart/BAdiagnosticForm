import QuestionCard from './QuestionCard';

export default function AreaSection({ area, questions, answers, onAnswer }) {
  const answeredCount = questions.filter(q => answers[q.id]).length;
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
            selectedOption={answers[question.id]?.optionId}
            onSelect={onAnswer}
          />
        ))}
      </div>
    </div>
  );
}
