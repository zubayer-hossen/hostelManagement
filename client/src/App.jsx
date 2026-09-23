import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import Tracker from './components/Tracker.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeProvider>
          <AuthProvider>
            <MotionConfig reducedMotion="user">
              <BrowserRouter>
                <Tracker />
                <AppRoutes />
              </BrowserRouter>
              <Toaster position="top-right" toastOptions={{ duration: 4000, className: 'text-sm' }} />
            </MotionConfig>
          </AuthProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
