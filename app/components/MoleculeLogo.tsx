"use client"

import { useEffect, useState } from "react"

export function MoleculeLogo() {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 2000)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <svg width="80" height="80" viewBox="0 0 200 200" className="drop-shadow-lg">
        {/* Background glow */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </radialGradient>
          <filter id="blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        <circle cx="100" cy="100" r="90" fill="url(#glow)" />

        {/* Molecule structure */}
        {/* Central carbon */}
        <circle
          cx="100"
          cy="100"
          r="12"
          fill="#3b82f6"
          stroke="#1e40af"
          strokeWidth="2"
          className={`transition-all duration-500 ${isAnimating ? "animate-pulse" : ""}`}
        />

        {/* Top carbon */}
        <circle
          cx="100"
          cy="60"
          r="10"
          fill="#10b981"
          stroke="#059669"
          strokeWidth="2"
          className={`transition-all duration-500 ${isAnimating ? "animate-bounce" : ""}`}
        />

        {/* Right carbon */}
        <circle
          cx="140"
          cy="100"
          r="10"
          fill="#8b5cf6"
          stroke="#7c3aed"
          strokeWidth="2"
          className={`transition-all duration-700 ${isAnimating ? "animate-pulse" : ""}`}
        />

        {/* Bottom carbon */}
        <circle
          cx="100"
          cy="140"
          r="10"
          fill="#f59e0b"
          stroke="#d97706"
          strokeWidth="2"
          className={`transition-all duration-300 ${isAnimating ? "animate-bounce" : ""}`}
        />

        {/* Left carbon */}
        <circle
          cx="60"
          cy="100"
          r="10"
          fill="#ef4444"
          stroke="#dc2626"
          strokeWidth="2"
          className={`transition-all duration-900 ${isAnimating ? "animate-pulse" : ""}`}
        />

        {/* Bonds - these will break during animation */}
        <g
          className={`transition-all duration-1000 ${isAnimating ? "opacity-30 stroke-dasharray-[5,5]" : "opacity-100"}`}
        >
          {/* Central to top */}
          <line
            x1="100"
            y1="88"
            x2="100"
            y2="72"
            stroke="#64748b"
            strokeWidth="3"
            className={`${isAnimating ? "animate-pulse" : ""}`}
          />

          {/* Central to right */}
          <line
            x1="112"
            y1="100"
            x2="128"
            y2="100"
            stroke="#64748b"
            strokeWidth="3"
            className={`${isAnimating ? "animate-pulse" : ""}`}
          />

          {/* Central to bottom */}
          <line
            x1="100"
            y1="112"
            x2="100"
            y2="128"
            stroke="#64748b"
            strokeWidth="3"
            className={`${isAnimating ? "animate-pulse" : ""}`}
          />

          {/* Central to left */}
          <line
            x1="88"
            y1="100"
            x2="72"
            y2="100"
            stroke="#64748b"
            strokeWidth="3"
            className={`${isAnimating ? "animate-pulse" : ""}`}
          />
        </g>

        {/* Breaking effect particles */}
        {isAnimating && (
          <g className="animate-ping">
            <circle cx="100" cy="80" r="2" fill="#fbbf24" opacity="0.7" />
            <circle cx="120" cy="100" r="2" fill="#fbbf24" opacity="0.7" />
            <circle cx="100" cy="120" r="2" fill="#fbbf24" opacity="0.7" />
            <circle cx="80" cy="100" r="2" fill="#fbbf24" opacity="0.7" />
          </g>
        )}

        {/* Hydrogen atoms (smaller) */}
        <circle cx="100" cy="40" r="6" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
        <circle cx="160" cy="100" r="6" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
        <circle cx="100" cy="160" r="6" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
        <circle cx="40" cy="100" r="6" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />

        {/* H bonds */}
        <line x1="100" y1="54" x2="100" y2="46" stroke="#9ca3af" strokeWidth="2" />
        <line x1="146" y1="100" x2="154" y2="100" stroke="#9ca3af" strokeWidth="2" />
        <line x1="100" y1="146" x2="100" y2="154" stroke="#9ca3af" strokeWidth="2" />
        <line x1="54" y1="100" x2="46" y2="100" stroke="#9ca3af" strokeWidth="2" />
      </svg>
    </div>
  )
}
