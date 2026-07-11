import { AlertCircle, CheckCircle2 } from 'lucide-react';

const variants = {
  error: {
    wrapper: 'border-danger/30 bg-danger/5 text-danger-dark',
    Icon: AlertCircle,
  },
  success: {
    wrapper: 'border-success/30 bg-success/5 text-success-dark',
    Icon: CheckCircle2,
  },
};

export default function Alert({ variant = 'error', children }) {
  const { wrapper, Icon } = variants[variant] ?? variants.error;

  return (
    <div role="alert" className={`flex items-start gap-2 rounded-card border px-4 py-3 text-sm font-medium ${wrapper}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
