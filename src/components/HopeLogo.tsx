import hopeLogo from '../assets/hope-logo.png';

interface HopeLogoProps {
  className?: string;
  alt?: string;
}

/** 앱 로고 — src/assets/hope-logo.png (Vite import) */
export function HopeLogo({ className = 'h-10 w-auto', alt = '또박또박' }: HopeLogoProps) {
  return (
    <img
      src={hopeLogo}
      alt={alt}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
