export default function ProgressBar({ current, total, areas, currentAreaIndex }) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Progrés: {current} de {total} preguntes
          </span>
          <span className="text-sm font-bold text-blue-600">{percentage}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex gap-1 mt-3 overflow-x-auto pb-2">
          {areas.map((area, idx) => (
            <button
              key={area.id}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                idx === currentAreaIndex
                  ? 'bg-blue-600 text-white'
                  : idx < currentAreaIndex
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              Àrea {area.area}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
