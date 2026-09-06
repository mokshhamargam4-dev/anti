import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole, DementiaStage } from '../../types/database';
import { AlertBanner } from '../../components/common/AlertBanner';
import { UserCheck, Users, HeartHandshake, Shield, Sparkles, MapPin, Languages } from 'lucide-react';

const NER_STATES = [
  'Assam',
  'Meghalaya',
  'Manipur',
  'Mizoram',
  'Nagaland',
  'Tripura',
  'Arunachal Pradesh',
  'Sikkim',
];

const NER_LANGUAGES = [
  'Assamese',
  'Bengali',
  'Bodo',
  'Manipuri (Meitei)',
  'Khasi',
  'Garo',
  'Mizo',
  'Nagamese',
  'English',
  'Hindi',
];

export const Register: React.FC = () => {
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('elderly');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('Assam');
  const [primaryLanguage, setPrimaryLanguage] = useState('Assamese');
  const [dementiaStage, setDementiaStage] = useState<DementiaStage>('mild');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName || !email || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const { error, user } = await signUp({
      email,
      password,
      fullName,
      role,
      region,
      primaryLanguage,
      dementiaStage: role === 'elderly' ? dementiaStage : 'not_applicable',
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => {
        if (role === 'caregiver') {
          navigate('/caregiver');
        } else {
          navigate('/elderly');
        }
      }, 1200);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-700 flex items-center justify-center text-white shadow-md">
            <HeartHandshake className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-3xl font-extrabold text-slate-800 tracking-tight">
          Join SmritiSetu
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Tailored cognitive gaming & memory preservation for elderly in North East India
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-100 rounded-3xl border border-slate-200/80">
          
          {!isConfigured && (
            <AlertBanner
              type="warning"
              title="Supabase Setup Required"
              message="Add your Supabase project credentials to the .env file to enable live registration."
            />
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('elderly')}
                  className={`flex items-center p-4 rounded-2xl border-2 text-left transition-all ${
                    role === 'elderly'
                      ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl mr-3 ${role === 'elderly' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-800">Elderly Patient</span>
                    <span className="block text-xs text-slate-500">Accessible interface, games & memory recall</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={`flex items-center p-4 rounded-2xl border-2 text-left transition-all ${
                    role === 'caregiver'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl mr-3 ${role === 'caregiver' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-800">Caregiver / Family</span>
                    <span className="block text-xs text-slate-500">Analytics, routines & cognitive monitoring</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={role === 'elderly' ? 'e.g. Ramesh Chandra Baruah' : 'e.g. Ananya Baruah'}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 text-base"
              />
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-email" className="block text-sm font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 text-base"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-bold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 text-base"
                />
              </div>
            </div>

            {/* Regional NER Cultural Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="region" className="flex items-center text-sm font-bold text-slate-700 mb-1">
                  <MapPin className="w-4 h-4 mr-1 text-teal-600" />
                  NER State / Region
                </label>
                <select
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 text-base"
                >
                  {NER_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="language" className="flex items-center text-sm font-bold text-slate-700 mb-1">
                  <Languages className="w-4 h-4 mr-1 text-teal-600" />
                  Primary Language
                </label>
                <select
                  id="language"
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 text-base"
                >
                  {NER_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dementia Stage for Elderly profile */}
            {role === 'elderly' && (
              <div>
                <label htmlFor="stage" className="block text-sm font-bold text-slate-700 mb-1">
                  Dementia Severity Level (Optional / Clinical Assessment)
                </label>
                <select
                  id="stage"
                  value={dementiaStage}
                  onChange={(e) => setDementiaStage(e.target.value as DementiaStage)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 text-base"
                >
                  <option value="mild">Mild (Early stage, memory lapses)</option>
                  <option value="moderate">Moderate (Needs guided routines & reminders)</option>
                  <option value="severe">Severe (Advanced care requirements)</option>
                </select>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl text-lg font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-md focus:outline-none focus:ring-4 focus:ring-teal-200 transition-all disabled:opacity-60"
            >
              {loading ? 'Registering Account...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
