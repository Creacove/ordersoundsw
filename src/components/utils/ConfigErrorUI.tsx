
import React from 'react';

interface ConfigErrorProps {
  issues: string[];
}

export const ConfigErrorUI: React.FC<ConfigErrorProps> = ({ issues }) => {
  return (
    <div className="min-h-screen bg-[#030407] text-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
            <svg 
              className="w-6 h-6 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter">Configuration Error</h1>
            <p className="text-white/40 text-sm">Deployment setup incomplete</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-sm text-white/60">
            The application is missing required environment variables needed to connect to the database.
          </p>
          
          <div className="bg-black/40 rounded-xl p-4 border border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Missing Variables:</h2>
            <ul className="space-y-1">
              {issues.map((issue, i) => (
                <li key={i} className="text-red-400 text-sm font-mono flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {issue.replace("- ", "")}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-white/30 italic">
            Check your project settings and ensure these are set with the <strong>VITE_</strong> prefix.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-white text-black rounded-2xl font-black uppercase italic tracking-tighter hover:bg-white/90 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};
