import React from 'react';

const WorkflowStepper = ({ status, theme = 'dark' }) => {
  const steps = [
    { label: 'Proposer', desc: 'Submit Request' },
    { label: 'Guide', desc: 'Mentor Review' },
    { label: 'Dept GM', desc: 'GM Sign-off' },
    { label: 'Training Officer', desc: 'Verify Info' },
    { label: 'HR GM', desc: 'Final Approval' },
  ];

  // Helper to determine the current active step index
  const getCurrentStepIndex = () => {
    switch (status) {
      case 'REJECTED':
        return 0; // Back to proposer for correction
      case 'PENDING_GUIDE':
        return 1;
      case 'PENDING_GGM':
        return 2;
      case 'PENDING_TO':
        return 3;
      case 'PENDING_HR':
        return 4;
      case 'APPROVED':
        return 5; // All steps completed
      default:
        return 0;
    }
  };

  const currentIdx = getCurrentStepIndex();
  const isRework = status === 'REJECTED';

  const containerClass = theme === 'light'
    ? 'w-full py-6 px-4 bg-slate-50 border border-slate-200/80 rounded-3xl shadow-sm my-6'
    : 'w-full py-6 px-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-lg my-6';

  const titleClass = theme === 'light'
    ? 'text-xs font-bold text-slate-550 uppercase tracking-widest mb-6 text-left'
    : 'text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left';

  return (
    <div className={containerClass}>
      <h4 className={titleClass}>
        File Routing Path (Status)
      </h4>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2 relative">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx && !isRework;
          const isCurrent = idx === currentIdx;
          const isUpcoming = idx > currentIdx;
          const isCurrentRework = isRework && idx === 0;

          return (
            <div key={idx} className="flex-1 flex md:flex-col items-center w-full relative group">
              {/* Connecting Line (hidden for the last step and vertical on small screens) */}
              {idx < steps.length - 1 && (
                <div 
                  className={`hidden md:block absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5 z-0 transition-all duration-500 ${
                    idx < currentIdx - 1 && !isRework
                      ? 'bg-emerald-500' 
                      : isCurrent && !isRework 
                      ? 'bg-gradient-to-r from-emerald-500 to-amber-500/50'
                      : theme === 'light'
                      ? 'bg-slate-200'
                      : 'bg-slate-800'
                  }`}
                />
              )}

              {/* Step indicator circle */}
              <div className="relative z-10 flex items-center justify-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-all duration-300 ${
                    isCompleted
                      ? theme === 'light'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm'
                        : 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-900/30'
                      : isCurrentRework
                      ? theme === 'light'
                        ? 'bg-red-50 border-red-500 text-red-600 shadow-sm animate-pulse'
                        : 'bg-red-950/60 border-red-500 text-red-400 shadow-md shadow-red-900/30 animate-pulse'
                      : isCurrent
                      ? theme === 'light'
                        ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-sm animate-pulse'
                        : 'bg-amber-950/60 border-amber-500 text-amber-400 shadow-md shadow-amber-900/30 animate-pulse'
                      : theme === 'light'
                      ? 'bg-white border-slate-200 text-slate-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrentRework ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
              </div>

              {/* Labels */}
              <div className="ml-4 md:ml-0 md:mt-3 text-left md:text-center flex-1 md:flex-none">
                <p
                  className={`font-semibold text-xs tracking-wide transition-all ${
                    isCompleted
                      ? 'text-emerald-500'
                      : isCurrentRework
                      ? 'text-red-500'
                      : isCurrent
                      ? 'text-amber-500'
                      : theme === 'light'
                      ? 'text-slate-550'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </p>
                <p className={`text-[10px] font-medium mt-0.5 uppercase tracking-wider ${
                  theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {isCurrentRework ? 'Rework Required' : step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Visual Indicator of approval state */}
      {status === 'APPROVED' && (
        <div className={`mt-4 p-3 border text-xs font-bold rounded-xl text-center uppercase tracking-widest ${
          theme === 'light'
            ? 'bg-emerald-50 border-emerald-250 text-emerald-600'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          🎉 Request Fully Approved & Intern Onboarded
        </div>
      )}
    </div>
  );
};

export default WorkflowStepper;
