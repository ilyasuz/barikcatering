import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Login } from './components/Login';
import { Dashboard } from './pages/Dashboard';
import { IncomePage } from './modules/income/pages/IncomePage';
import { IncomeDetailPage } from './modules/income/pages/IncomeDetailPage';
import { ExpensesPage } from './modules/expenses/pages/ExpensesPage';
import { ExpenseDetailPage } from './modules/expenses/pages/ExpenseDetailPage';
import { CompaniesPage } from './modules/companies/pages/CompaniesPage';
import { CompanyDetailPage } from './modules/companies/pages/CompanyDetailPage';
import { AccountsPage } from './modules/accounts/pages/AccountsPage';
import { AccountDetailPage } from './modules/accounts/pages/AccountDetailPage';
import { ReportsPage } from './pages/ReportsPage';
import { FilesPage } from './pages/FilesPage';
import { SettingsPage } from './pages/SettingsPage';
import { MealsPage } from './modules/meals/pages/MealsPage';
import './App.css';

import { RegionProvider } from './core/contexts/RegionContext';
import { ExchangeRatesProvider } from './core/contexts/ExchangeRatesContext';
import { NotificationProvider } from './core/contexts/NotificationContext';
import { AuthProvider, useAuth } from './core/contexts/AuthContext';

function GlobalShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          case '1': e.preventDefault(); navigate('/dashboard'); break;
          case '2': e.preventDefault(); navigate('/income'); break;
          case '3': e.preventDefault(); navigate('/expenses'); break;
          case '4': e.preventDefault(); navigate('/companies'); break;
          case '5': e.preventDefault(); navigate('/accounts'); break;
          case '6': e.preventDefault(); navigate('/meals'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  return null;
}

function MainApp() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.loading', 'Yükleniyor...')}</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <GlobalShortcuts />
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/income" element={<IncomePage />} />
              <Route path="/income/:id" element={<IncomeDetailPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/:id" element={<CompanyDetailPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/accounts/group/:baseName" element={<AccountDetailPage />} />
              <Route path="/meals" element={<MealsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ExchangeRatesProvider>
        <RegionProvider>
          <NotificationProvider>
            <MainApp />
          </NotificationProvider>
        </RegionProvider>
      </ExchangeRatesProvider>
    </AuthProvider>
  );
}

export default App;
