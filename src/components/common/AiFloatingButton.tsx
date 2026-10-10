import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall } from 'lucide-react';
import { STORE_ASSETS } from '../../assets/images';

// Geometric Cognivo orange logo icon matching the reference design
export const CognivoGeometricLogo: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-5 h-5',
  size,
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Geometric woven cross pattern in brand orange */}
    <rect x="5" y="11" width="17" height="5" rx="1.5" fill="#E06518" />
    <rect x="11" y="5" width="5" height="17" rx="1.5" fill="#E06518" />
    <rect x="18" y="24" width="17" height="5" rx="1.5" fill="#E06518" />
    <rect x="24" y="18" width="5" height="17" rx="1.5" fill="#E06518" />
    <rect x="24" y="11" width="11" height="5" rx="1.5" fill="#E06518" />
    <rect x="5" y="24" width="11" height="5" rx="1.5" fill="#E06518" />
    <rect x="11" y="24" width="5" height="11" rx="1.5" fill="#E06518" />
    <rect x="24" y="5" width="5" height="11" rx="1.5" fill="#E06518" />
  </svg>
);

export const AiFloatingButton: React.FC = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isCallHovered, setIsCallHovered] = useState(false);

  const handleOpenConsult = () => {
    navigate('/ai-consult');
  };

  const handleOpenForzaCall = () => {
    navigate('/ai-forza');
  };

  return (
    <div
      className="fixed bottom-20 lg:bottom-7 left-3 lg:left-7 z-40 flex items-center gap-2 select-none group"
      dir="rtl"
    >
      {/* Light Desktop Tooltip */}
      <div
        className={`hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] text-[#2B313A] text-xs font-bold shadow-lg shadow-black/5 border border-[#CBD2D8] backdrop-blur-md transition-all duration-200 pointer-events-none ${
          isCallHovered || isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#E06518] animate-pulse" />
        <span>
          {isCallHovered
            ? 'مکالمه زنده تصویری با FORZA'
            : 'میزکار هوشمند FORZA'}
        </span>
      </div>

      {/* 1. Quick Voice Call with AI FORZA */}
      <button
        type="button"
        onClick={handleOpenForzaCall}
        onMouseEnter={() => setIsCallHovered(true)}
        onMouseLeave={() => setIsCallHovered(false)}
        aria-label="تماس زنده با هوش مصنوعی FORZA"
        title="تماس چهره به چهره با هوش مصنوعی FORZA"
        className="relative flex items-center gap-1.5 p-2 lg:p-2.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#DEE2E5] text-[#55565A] hover:text-[#2B313A] shadow-md border border-[#CBD2D8] hover:border-[#E06518] cursor-pointer active:scale-95 transition-all duration-200 hover:scale-105"
      >
        {/* Pulsing Orange Live Call Ping */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E06518] opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E06518] border-2 border-white" />
        </span>

        <div className="w-7 h-7 rounded-xl overflow-hidden flex items-center justify-center bg-[#DEE2E5] border border-[#CBD2D8] relative shrink-0">
          <img
            src={STORE_ASSETS.aiForzaCyborg}
            alt="FORZA AI"
            className="w-full h-full object-cover object-top"
          />
        </div>

        <div className="flex items-center gap-1 text-[#55565A] pr-0.5">
          <PhoneCall className="w-4 h-4 text-[#E06518] animate-pulse" />
          <span className="text-[11px] font-black tracking-tight hidden sm:inline">
            تماس FORZA
          </span>
        </div>
      </button>

      {/* 2. Main Smart AI Advisor Button (FORZA Workspace) */}
      <button
        type="button"
        onClick={handleOpenConsult}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="میزکار هوشمند FORZA"
        className="relative flex items-center gap-2.5 p-2.5 lg:px-4 lg:py-3 rounded-2xl bg-[#FFFFFF] hover:bg-[#DEE2E5] text-[#55565A] shadow-lg border-2 border-[#CBD2D8] hover:border-[#E06518] cursor-pointer active:scale-95 transition-all duration-200 hover:scale-105"
      >
        {/* Brand Geometric Icon */}
        <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-[#DEE2E5] border border-[#CBD2D8] flex items-center justify-center shrink-0">
          <CognivoGeometricLogo className="w-5 h-5 text-[#E06518]" />
        </div>

        <div className="flex flex-col text-right leading-tight">
          <span className="font-black text-xs text-[#2B313A] tracking-tight flex items-center gap-1.5">
            میزکار FORZA
            <span className="px-1.5 py-0.2 rounded-md bg-[#E06518] text-white text-[9px] font-black tracking-normal">
              مشاور
            </span>
          </span>
          <span className="text-[10px] text-[#777A7D] font-medium hidden md:inline">
            مشاوره و محاسبات صنعتی
          </span>
        </div>
      </button>
    </div>
  );
};

