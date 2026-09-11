import React from 'react';

// Dashboard tab navigation. Presentational: parent owns the active tab.
const TabNav = ({ tabs, activeTab, onSelect }) => (
  <div className="gbx-tab-nav mb-8">
    <div className="flex w-full flex-wrap gap-1 rounded-2xl border p-1 tab-seg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`gbx-tab-btn gbx-tab-${tab.id} flex-1 min-w-[6.5rem] sm:min-w-[7.5rem] rounded-xl px-2.5 sm:px-4 py-2 font-semibold text-xs sm:text-sm flex items-center justify-center whitespace-nowrap transition ${
            activeTab === tab.id ? 'bg-amber-400 text-slate-900 shadow' : 'tab-seg-idle'
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.name}

          {tab.count !== undefined && tab.count > 0 && (
            <span
              className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-amber-900/15 text-amber-900' : 'bg-amber-500/15 text-amber-700'
              }`}
            >
              {tab.count}
            </span>
          )}

          {tab.badge !== undefined && tab.badge > 0 && (
            <span
              className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-rose-500 text-white' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  </div>
);

export default TabNav;
