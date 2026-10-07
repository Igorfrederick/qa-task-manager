import { Navigate, Route, Routes } from 'react-router'

import AppLayout from './components/AppLayout/AppLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage/LoginPage.jsx'
import TaskFormPage from './pages/TaskFormPage/TaskFormPage.jsx'
import TaskListPage from './pages/TaskListPage/TaskListPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/tasks/new" element={<TaskFormPage />} />
          <Route path="/tasks/:id" element={<TaskFormPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  )
}
