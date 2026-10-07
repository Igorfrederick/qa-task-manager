import { Navigate, Route, Routes } from 'react-router'

import LoginPage from './pages/LoginPage/LoginPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
