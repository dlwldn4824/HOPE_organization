import hopeLogo from '../assets/hope-logo.png';

interface HopeLogoProps {
  className?: string;
  alt?: string;
}

/** HOPE 로고 — src/assets/hope-logo.png (Vite import) */
export function HopeLogo({ className = 'h-10 w-auto', alt = 'HOPE 로고' }: HopeLogoProps) {
  return (
    <img
      src={hopeLogo}
      alt={alt}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
