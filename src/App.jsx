import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnalysisProvider } from './context/AnalysisContext';
import { Layout } from './components/layout/Layout';

// Pages
import { Dashboard } from './pages/Dashboard/Dashboard';
import { UrlAnalysisPage } from './pages/UrlAnalysisPage';
import { ReportPage } from './pages/ReportPage';
import { TechnicalPage } from './pages/TechnicalPage';
import { QrScannerPage } from './pages/QrScannerPage';
import { EmailAnalyzerPage } from './pages/EmailAnalyzerPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AttackReplayPage } from './pages/AttackReplayPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <AnalysisProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analyze" element={<UrlAnalysisPage />} />
            <Route path="url-analysis" element={<Navigate to="/analyze" replace />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="technical" element={<TechnicalPage />} />
            <Route path="qr-scanner" element={<QrScannerPage />} />
            <Route path="email-analyzer" element={<EmailAnalyzerPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="attack-replay" element={<AttackReplayPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AnalysisProvider>
  );
}

export default App;
