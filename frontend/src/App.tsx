import { Routes, Route, useNavigate } from 'react-router-dom'
import HomePage from './components/HomePage'
import DashboardPage from './components/DashboardPage'

function App() {
  const navigate = useNavigate()
  return (
    <Routes>
      <Route path="/" element={<HomePage onGetStarted={() => navigate('/dashboard')} />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/:sessionId" element={<DashboardPage />} />
    </Routes>
  )
}

export default App
