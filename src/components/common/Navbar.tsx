import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { LogOut, HeartHandshake, Eye, Sparkles, Database } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, role, signOut, isConfigured } = useAuth();
  const { textSize, setTextSize, highContrast, toggleHighContrast } = useAccessibility();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">SmritiSetu</span>
                <span className="text-xs px-2 py-0.5 font-medium rounded-full bg-teal-100 text-teal-800">
                  NER PS 26003
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                AI Cognitive & Reminiscence Platform for North East India
              </p>
            </div>
          </Link>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Supabase Status Indicator */}
            <div 
              className={`hidden md:flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                isConfigured 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={isConfigured ? 'Supabase connected' : 'Configure .env with Supabase credentials'}
            >
              <Database className="w-3.5 h-3.5 mr-1" />
              {isConfigured ? 'DB Ready' : 'Setup DB (.env)'}
            </div>

            {/* Accessibility Controls: Font Size */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200" title="Adjust text size for easier reading">
              <button
                type="button"
                onClick={() => setTextSize('normal')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  textSize === 'normal' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-label="Normal font size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setTextSize('large')}
                className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-colors ${
                  textSize === 'large' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-label="Large font size"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setTextSize('xlarge')}
                className={`px-2.5 py-1 text-base font-bold rounded-lg transition-colors ${
                  textSize === 'xlarge' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-label="Extra large font size"
              >
                A++
              </button>
            </div>

            {/* High Contrast Mode Toggle */}
            <button
              type="button"
              onClick={toggleHighContrast}
              className={`p-2 rounded-xl border transition-colors ${
                highContrast
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle high contrast for visual clarity"
              aria-label="Toggle High Contrast"
            >
              <Eye className="w-5 h-5" />
            </button>

            {/* User Session info */}
            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-slate-800 leading-tight">
                    {profile?.preferred_name || profile?.full_name || user.email?.split('@')[0]}
                  </div>
                  <span
                    className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      role === 'elderly'
                        ? 'bg-teal-100 text-teal-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {role === 'elderly' ? 'Elderly Patient' : 'Caregiver'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2.5 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                  title="Sign out of your account"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow transition"
                >
                  Get Started
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
