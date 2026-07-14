// Íconos de marca (Facebook/Instagram) como SVG propios: lucide-react ya no
// incluye logos de marcas, así que se mantienen aquí para compartirlos entre
// Footer y Contacto sin duplicarlos.
export function FacebookIcon({ className = 'h-4 w-4' }) {
  // Trazo oficial de la "f" (Font Awesome facebook-f, CC BY 4.0); el viewBox
  // alto conserva la proporción del logo dentro del cuadro del ícono.
  return (
    <svg viewBox="0 0 320 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
    </svg>
  );
}

export function InstagramIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
