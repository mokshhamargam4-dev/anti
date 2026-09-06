import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const { role } = useAuth();

  const destination = role === 'caregiver' ? '/caregiver' : '/elderly';

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Restricted Access</h2>
        <p className="text-slate-600 mb-6 text-sm">
          You are currently signed in as a <span className="font-bold text-slate-800">{role || 'guest'}</span>.
          This view is reserved for authorized role members to safeguard patient safety and privacy.
        </p>

        <div className="space-y-3">
          <Link
            to={destination}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl bg-teal-700 text-white font-bold hover:bg-teal-800 transition shadow"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to My Authorized Dashboard
          </Link>
          <Link
            to="/login"
            className="w-full flex items-center justify-center py-3 px-4 rounded-2xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Switch Account / Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
