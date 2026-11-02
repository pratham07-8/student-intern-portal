import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FormProvider } from './context/FormContext'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import ProposerDashboard from './pages/ProposerDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Form from './components/Form'
import GuideForm from './components/GuideForm'
import ReviewForm from './components/ReviewForm'

function App() {
  return (
    <AuthProvider>
      <FormProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected Proposer Routes */}
            <Route
              path="/proposer-dashboard"
              element={
                <ProtectedRoute allowedRoles={['PROPOSER']}>
                  <ProposerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/TraineeDetails"
              element={
                <ProtectedRoute allowedRoles={['PROPOSER']}>
                  <div className="w-full"><Form /></div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/GuideDetails"
              element={
                <ProtectedRoute allowedRoles={['PROPOSER']}>
                  <div className="w-full"><GuideForm /></div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Review"
              element={
                <ProtectedRoute allowedRoles={['PROPOSER']}>
                  <div className="w-full"><ReviewForm /></div>
                </ProtectedRoute>
              }
            />

            {/* Protected Reviewer Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['GUIDE', 'GUIDE_GM', 'TRAINING_OFFICER', 'HR_GM']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch all / fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </FormProvider>
    </AuthProvider>
  )
}

export default App


