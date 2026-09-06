import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface AlertBannerProps {
  type?: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'warning',
  title,
  message,
  actionText,
  onAction,
}) => {
  const styles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-teal-50 border-teal-200 text-teal-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  };

  const icons = {
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-teal-600 flex-shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
  };

  return (
    <div className={`p-4 rounded-2xl border ${styles[type]} shadow-sm mb-6`}>
      <div className="flex items-start space-x-3">
        {icons[type]}
        <div className="flex-1">
          <h4 className="font-bold text-sm tracking-wide">{title}</h4>
          <p className="text-xs sm:text-sm mt-0.5 opacity-90">{message}</p>
        </div>
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="text-xs font-bold underline hover:opacity-80 px-2 py-1"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};
