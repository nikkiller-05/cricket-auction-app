import React from 'react';

// Spectator player-filter chips. Captains/Retentions chips appear only when the
// matching feature is enabled. Presentational: parent owns the active filter.
const PlayerFilterChips = ({
  totalPlayers = 0,
  sold = 0,
  available = 0,
  unsold = 0,
  captains = 0,
  retained = 0,
  enableCaptains = true,
  enableRetention = false,
  active,
  onSelect,
}) => {
  const filters = [
    { id: 'all', name: 'All Players', icon: '👥', count: totalPlayers },
    { id: 'sold', name: 'Sold', icon: '✅', count: sold },
    { id: 'available', name: 'Available', icon: '🔄', count: available },
    { id: 'unsold', name: 'Unsold', icon: '❌', count: unsold },
    ...(enableCaptains ? [{ id: 'captains', name: 'Captains', icon: '👑', count: captains }] : []),
    ...(enableRetention
      ? [{ id: 'retained', name: 'Retentions', icon: '🔒', count: retained }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-900 tracking-wide">All Players</h3>

      {/* Modern Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onSelect(filter.id)}
            className={`tab-button ${active === filter.id ? 'active' : ''} ${
              active === filter.id
                ? 'bg-blue-500 text-white shadow-xl border-2 border-blue-600'
                : 'bg-white bg-opacity-25 text-gray-800 hover:text-gray-900 hover:bg-white hover:bg-opacity-35 border-2 border-white border-opacity-50 hover:border-opacity-70'
            } whitespace-nowrap py-2 px-4 font-medium text-sm flex items-center rounded-lg shadow-lg min-w-fit transition-colors duration-150`}
          >
            <span className="mr-2">{filter.icon}</span>
            {filter.name}
            {filter.count > 0 && (
              <span
                className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${
                  active === filter.id
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'bg-white bg-opacity-40 text-gray-700'
                }`}
              >
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlayerFilterChips;
