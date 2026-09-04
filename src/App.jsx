import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Tracks from './pages/Tracks'
import Schedule from './pages/Schedule'
import Prizes from './pages/Prizes'
import Register from './pages/Register'
import Rules from './pages/Rules'
import Dashboard from './pages/Dashboard'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="tracks" element={<Tracks />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="prizes" element={<Prizes />} />
            <Route path="register" element={<Register />} />
            <Route path="rules" element={<Rules />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
