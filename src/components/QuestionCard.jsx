import { CheckCircle2 } from 'lucide-react';

export default function QuestionCard({ question, selectedOption, onSelect }) {
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

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOption === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(question.id, option.id, option.score)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
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
    </div>
  );
}
