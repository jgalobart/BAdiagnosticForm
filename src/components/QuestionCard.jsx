import { CheckCircle2 } from 'lucide-react';

export default function QuestionCard({ question, answer, onSelect }) {
  const type = question.type || 'single_choice';

  const handleSingleChoice = (option) => {
    onSelect(question.id, {
      type: 'single_choice',
      optionId: option.id,
      score: option.score,
    });
  };

  const handleMultipleChoiceToggle = (option) => {
    const current = Array.isArray(answer?.optionIds) ? answer.optionIds : [];
    const isSelected = current.includes(option.id);
    const nextOptionIds = isSelected
      ? current.filter((id) => id !== option.id)
      : [...current, option.id];

    const scoreById = new Map(question.options.map((o) => [o.id, o.score]));
    const nextScore = nextOptionIds.reduce((sum, id) => sum + (scoreById.get(id) || 0), 0);

    onSelect(question.id, {
      type: 'multiple_choice',
      optionIds: nextOptionIds,
      score: nextScore,
    });
  };

  const handleTextChange = (value) => {
    onSelect(question.id, {
      type: 'text',
      text: value,
      score: 0,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-start gap-4 mb-6">
        <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm">
          {question.number}
        </span>
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 flex-1">
          {question.text}
        </h3>
      </div>

      {question.hints && question.hints.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          {question.hints.map((hint, idx) => (
            <p key={idx} className="text-amber-800 text-sm">{hint}</p>
          ))}
        </div>
      )}

      {type === 'text' ? (
        <div className="space-y-3">
          <textarea
            value={answer?.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={5}
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = type === 'multiple_choice'
              ? (Array.isArray(answer?.optionIds) ? answer.optionIds : []).includes(option.id)
              : answer?.optionId === option.id;

            const isMultiple = type === 'multiple_choice';

            const onClick = () => {
              if (type === 'multiple_choice') {
                handleMultipleChoiceToggle(option);
                return;
              }

              handleSingleChoice(option);
            };

            return (
              <button
                key={option.id}
                onClick={onClick}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 ${isMultiple ? 'rounded-md' : 'rounded-full'} border-2 flex items-center justify-center mt-0.5 ${
                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
