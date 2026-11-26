import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import AuthPage from './pages/AuthPage.jsx';
import HomePage from './pages/HomePage.jsx';
import QuestsPage from './pages/QuestsPage.jsx';
import GamesPage from './pages/GamesPage.jsx';
import BuildPlatePage from './pages/BuildPlatePage.jsx';
import DetectiveGamePage from './pages/DetectiveGamePage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import RewardsPage from './pages/RewardsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nq-bg-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-nq-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-nq-text-muted text-sm font-medium">Loading NutriQuest...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nq-bg-dark">
        <div className="w-16 h-16 border-4 border-nq-green border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quests"
          element={
            <ProtectedRoute>
              <QuestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <GamesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/build-your-plate"
          element={
            <ProtectedRoute>
              <BuildPlatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/food-detective"
          element={
            <ProtectedRoute>
              <DetectiveGamePage slug="food-detective" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/sugar-detective"
          element={
            <ProtectedRoute>
              <DetectiveGamePage slug="sugar-detective" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learn"
          element={
            <ProtectedRoute>
              <LearnPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute>
              <RewardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
