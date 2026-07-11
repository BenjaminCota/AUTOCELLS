import logoIcon from '../assets/logo-icon.png';

// El gris del ícono coincide casi exactamente con --color-secondary, así que sin una
// placa clara detrás se vuelve invisible sobre fondos oscuros (footer, sidebar admin).
// La placa blanca garantiza contraste en cualquier fondo, claro u oscuro.
export default function Logo({ className = '', size = 36 }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-secondary/10 bg-white p-1.5 ${className}`}
      style={{ width: size, height: size }}
    >
      <img src={logoIcon} alt="AUTOCELLS" className="h-full w-full object-contain" />
    </span>
  );
}
