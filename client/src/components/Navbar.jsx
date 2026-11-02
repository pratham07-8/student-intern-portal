import React from 'react'
import LOGO from '../assets/logo.png'

const Navbar = () => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src={LOGO} alt="Student Intern Portal" className="h-10 sm:h-12 w-auto object-contain" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          Vocational Training Portal
        </span>
      </div>
    </header>
  )
}

export default Navbar
