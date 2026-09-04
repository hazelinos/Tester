import { useState } from 'react';

export default function MontraLogo({ size = 32, showName = false, className = '', src = '/montra-logo.jpg' }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!imageFailed ? (
        <img
          src={src}
          alt="MontraApp logo"
          width={size}
          height={size}
          className="object-contain shrink-0"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="MontraApp logo"
        >
          <defs>
            <linearGradient id="montra-gradient" x1="12" y1="52" x2="52" y2="8" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399" />
              <stop offset="1" stopColor="#A8E6CF" />
            </linearGradient>
          </defs>
          <path
            d="M10 48L27 20L38 38L49 20V48"
            stroke="url(#montra-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="12" r="5" fill="#34D399" />
        </svg>
      )}
      {showName && (
        <span className="font-bold text-text-primary whitespace-nowrap">
          Montra<span className="text-primary">App</span>
        </span>
      )}
    </div>
  );
}
