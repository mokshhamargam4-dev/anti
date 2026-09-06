import React from 'react';
import { CaregiverAlert, NON_MEDICAL_ALERT_DISCLAIMER } from '../../services/caregiverAlerts';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Bell } from 'lucide-react';

interface CaregiverAlertsBannerProps {
  alerts: CaregiverAlert[];
}

export const CaregiverAlertsBanner: React.FC<CaregiverAlertsBannerProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
          <Bell className="w-4 h-4 text-blue-700" />
          <span>Engagement Observations & Alerts</span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          Activity patterns only • Non-medical
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {alerts.map(alert => {
          const styles = {
            warning: 'bg-amber-50/80 border-amber-200 text-amber-900',
            info: 'bg-blue-50/80 border-blue-200 text-blue-900',
            success: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
          };

          const icons = {
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />,
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />,
          };

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border ${styles[alert.severity]} shadow-sm flex items-start space-x-3`}
            >
              {icons[alert.severity]}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">{alert.title}</h4>
                  {alert.metric && (
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-white/80 border border-current">
                      {alert.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm mt-1 leading-relaxed">{alert.message}</p>
                {alert.suggestion && (
                  <p className="text-xs font-medium opacity-85 mt-1.5 pt-1.5 border-t border-current/10">
                    💡 <em>Suggestion:</em> {alert.suggestion}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory Non-Medical Disclaimer Footnote */}
      <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500 text-center flex items-center justify-center space-x-1.5">
        <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
        <span>{NON_MEDICAL_ALERT_DISCLAIMER}</span>
      </div>
    </div>
  );
};
