import React from 'react'

export const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-50 bg-[#F7F9F7] flex flex-col items-center justify-between p-8 select-none safe-top safe-bottom">
      {/* Top spacer */}
      <div className="w-full flex justify-center pt-8">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-mutedgreen/80">
          Personal Wealth & Finance
        </span>
      </div>

      {/* Center Branding with Real Logo */}
      <div className="flex flex-col items-center text-center animate-fade-in">
        <div className="relative mb-5">
          <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-float ring-4 ring-mint/40 bg-white p-1 transition-transform transform active:scale-95">
            <img
              src="/logo.png"
              alt="FinWise Logo"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
          {/* Subtle animated glowing ring */}
          <div className="absolute -inset-1 rounded-3xl bg-mint/30 blur-md -z-10 animate-pulse" />
        </div>

        <h1 className="text-3xl font-black text-forest tracking-tight">FinWise</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-sage mt-1">
          Financial Tracker
        </p>

        {/* Micro Loader */}
        <div className="mt-8 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-forest animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-forest animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-forest animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="text-center pb-4">
        <p className="text-[11px] font-semibold text-mutedgreen">
          Secure & Offline Ready
        </p>
        <p className="text-[9px] text-mutedgreen/60 mt-0.5">
          v1.0.0 • Mobile Finance Edition
        </p>
      </div>
    </div>
  )
}

