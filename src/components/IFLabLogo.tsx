import React from 'react';

interface IFLabLogoProps {
  className?: string;
  isLight?: boolean;
}

export default function IFLabLogo({ className = '', isLight = false }: IFLabLogoProps) {
  return (
    <div className={`font-sans font-extrabold tracking-tight text-2xl ${isLight ? 'text-white' : 'text-slate-900'} ${className} select-none`}>
      IFLab
    </div>
  );
}

