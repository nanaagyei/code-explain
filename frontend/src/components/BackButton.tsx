import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  to: string;
  label: string;
  className?: string;
}

export function BackButton({ to, label, className }: BackButtonProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors min-h-[44px]',
        className
      )}
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
