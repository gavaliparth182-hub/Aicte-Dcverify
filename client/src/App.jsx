import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Submit from './pages/Submit.jsx';
import Run from './pages/Run.jsx';
import Review from './pages/Review.jsx';
import Report from './pages/Report.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="submit" element={<Submit />} />
        <Route path="applications/:appId" element={<Review />} />
        <Route path="applications/:appId/analysis" element={<Run />} />
        <Route path="applications/:appId/report" element={<Report />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
