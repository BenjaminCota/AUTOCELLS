import { useEffect, useState } from 'react';
import logoFull from '../assets/logo-full.png';

// Cuánto tiempo permanece visible el splash antes de empezar a desvanecerse.
const VISIBLE_MS = 2000;
// Duración del fade-out; debe coincidir con --animate-splash-out en index.css.
const FADE_MS = 400;

export default function SplashScreen({ onFinish }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const doneTimer = setTimeout(onFinish, VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      role="status"
      aria-label="Cargando AUTOCELLS"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-bg ${
        leaving ? 'animate-splash-out' : ''
      }`}
    >
      <img
        src={logoFull}
        alt="AUTOCELLS"
        className="w-52 animate-splash-logo sm:w-64"
      />
      <div className="flex gap-2" aria-hidden="true">
        <span className="h-2.5 w-2.5 animate-splash-dot rounded-full bg-primary" />
        <span className="h-2.5 w-2.5 animate-splash-dot rounded-full bg-primary [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 animate-splash-dot rounded-full bg-primary [animation-delay:300ms]" />
      </div>
    </div>
  );
}
