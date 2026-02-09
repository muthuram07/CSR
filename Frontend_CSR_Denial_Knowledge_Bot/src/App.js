// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/App.css';
import { performanceUtils } from './utils/performance';

// Performance-optimized lazy loading
const LazyHomepage = lazy(() => 
  import('./pages/Homepage').catch(err => {
    console.error('Failed to load Homepage:', err);
    return { default: () => <div>Error loading homepage</div> };
  })
);

const LazySignInpage = lazy(() => 
  import('./pages/SignInpage').catch(err => {
    console.error('Failed to load SignInPage:', err);
    return { default: () => <div>Error loading sign in page</div> };
  })
);

const LazySignUppage = lazy(() => 
  import('./pages/SignUppage').catch(err => {
    console.error('Failed to load SignUpPage:', err);
    return { default: () => <div>Error loading sign up page</div> };
  })
);

const LazyChatBot = lazy(() => 
  import('./components/ChatBot/ChatBot').catch(err => {
    console.error('Failed to load ChatBot:', err);
    return { default: () => <div>Error loading chatbot</div> };
  })
);

/** Small accessible loading fallback for Suspense */
function LoadingFallback() {
  return (
    <div role="status" style={{ padding: 24, textAlign: 'center' }}>
      Loading…
    </div>
  );
}

/** Route that only allows guests (unauthenticated users) */
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

/** Route that requires authentication */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return isAuthenticated ? children : <Navigate to="/signin" replace />;
}

/**
 * App
 * - Lazy-loads large pages to reduce initial bundle.
 * - Wraps app in AuthProvider.
 * - Uses route guards (GuestRoute, ProtectedRoute).
 */
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LazyHomepage />} />

            <Route
              path="/chatbot"
              element={
                <ProtectedRoute>
                  <LazyChatBot />
                </ProtectedRoute>
              }
            />

            <Route
              path="/signin"
              element={
                <GuestRoute>
                  <LazySignInpage />
                </GuestRoute>
              }
            />

            <Route
              path="/signup"
              element={
                <GuestRoute>
                  <LazySignUppage />
                </GuestRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}
