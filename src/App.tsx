import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Navbar } from './components/common/Navbar';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors">
            <Navbar />
            <main className="flex-1">
              <AppRoutes />
            </main>
            <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4">
                <p className="font-semibold text-slate-700">
                  SmritiSetu (স্মৃতি সেতু) • SIH PS 26003
                </p>
                <p className="mt-1">
                  AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER)
                </p>
              </div>
            </footer>
          </div>
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
