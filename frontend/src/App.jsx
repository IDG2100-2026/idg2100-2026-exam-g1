import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppearanceProvider } from './context/AppearanceContext'

// Layout
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Pages
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import CreateGamePage from './pages/CreateGamePage'
import GamePage from './pages/GamePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ResendVerificationPage from './pages/ResendVerificationPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import UserProfilePage from './pages/UserProfilePage'
import UserGamesPage from './pages/UserGamesPage'
import TournamentsPage from './pages/TournamentsPage'
import IndividualTournamentPage from './pages/IndividualTournamentPage'
import AboutUsPage from './pages/AboutUsPage'
import AboutSpanishDicePage from './pages/AboutSpanishDicePage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import NotFoundPage from './pages/NotFoundPage'

// Admin
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminCommentsPage from './pages/admin/AdminCommentsPage'
import AdminTournamentCreatePage from './pages/admin/AdminTournamentCreatePage'

function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppearanceProvider>
          <Routes>
            {/* Pages with Header + Footer */}
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/create-game" element={<CreateGamePage />} />
              <Route path="/games/:id" element={<GamePage />} />
              <Route path="/profile/:id" element={<UserProfilePage />} />
              <Route path="/profile/:id/games" element={<UserGamesPage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/tournaments/:id" element={<IndividualTournamentPage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/about-dice" element={<AboutSpanishDicePage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Route>

            {/* Auth pages — no Header/Footer */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify/:code" element={<VerifyEmailPage />} />
            <Route path="/resend-verification" element={<ResendVerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:code" element={<ResetPasswordPage />} />

            {/* Admin pages — own layout with role guard */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/comments" element={<AdminCommentsPage />} />
              <Route path="/admin/tournaments/create"  element={<AdminTournamentCreatePage />} />
              <Route path="/admin/tournaments/:id/edit" element={<AdminTournamentCreatePage />} />
            </Route>

            {/* 404 — catch-all, must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppearanceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
