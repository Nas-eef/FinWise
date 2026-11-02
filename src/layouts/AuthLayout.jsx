import React from 'react'
import { Outlet } from 'react-router-dom'
import { Wallet } from 'lucide-react'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#F7F9F7] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-brand-border/80 rounded-card-lg shadow-float p-6 sm:p-8">
        {/* Brand Header with Real FinWise Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-subtle mb-3 p-1 bg-white ring-2 ring-mint/40">
            <img
              src="/logo.png"
              alt="FinWise Logo"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-black text-forest tracking-tight">FinWise</h1>
          <p className="text-xs text-mutedgreen mt-1 font-semibold">FINANCIAL TRACKER</p>
        </div>

        <Outlet />
      </div>
    </div>
  )
}
