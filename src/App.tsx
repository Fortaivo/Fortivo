import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './lib/auth';
import { ROUTES } from './lib/routes';
import { AuthScreen } from './components/auth/AuthScreen';
import { Navigation } from './components/layout/Navigation';
import { PrivateRoute } from './components/layout/PrivateRoute';
import { HomePage } from './pages/HomePage';
import { AssetsPage } from './pages/AssetsPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { ProfilePage } from './pages/ProfilePage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ChatButton } from './components/chat/ChatButton';
import { Logo } from './components/layout/Logo';
import { UserMenu } from './components/layout/UserMenu';
import ErrorBoundary from './components/ErrorBoundary';
  
function App() {
  const { user, loading: authLoading } = useAuth();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {authLoading ? (
          <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : !user ? (
          <AuthScreen onSuccess={() => {}} />
        ) : (
          <div className="min-h-screen bg-gray-50 relative">
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-64 bg-white shadow-sm lg:fixed lg:h-full">
                <div className="p-6">
                  <Logo />
                  <div className="mt-8">
                  <Navigation />
                  </div>
                  <div className="lg:absolute bottom-0 left-0 right-0 p-4 border-t">
                    <UserMenu />
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 lg:pl-64">
                <Routes>
                  <Route path={ROUTES.HOME} element={
                    <PrivateRoute>
                      <HomePage />
                    </PrivateRoute>
                  } />
                  <Route path={ROUTES.ASSETS} element={
                    <PrivateRoute>
                      <AssetsPage />
                    </PrivateRoute>
                  } />
                  <Route path={ROUTES.BENEFICIARIES} element={
                    <PrivateRoute>
                      <BeneficiariesPage />
                    </PrivateRoute>
                  } />
                  <Route path={ROUTES.PROFILE} element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  } />
                  <Route path={ROUTES.SUBSCRIPTION} element={
                    <PrivateRoute>
                      <SubscriptionPage />
                    </PrivateRoute>
                  } />
                  <Route path="/assets/:assetId/documents" element={
                    <PrivateRoute>
                      <DocumentsPage />
                    </PrivateRoute>
                  } />
                  <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
                </Routes>
              </div>
            </div>
            <ChatButton />
          </div>
        )}
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;