import { Navigate, Route, Routes } from 'react-router'

import LoginPage from './pages/LoginPage/LoginPage.jsx'
import TaskListPage from './pages/TaskListPage/TaskListPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tasks" element={<TaskListPage />} />
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  )
}
