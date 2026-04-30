import { Routes, Route, Navigate } from 'react-router-dom'
import SignIn from './pages/SignIn.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Projects from './pages/Projects.jsx'
import Tasks from './pages/Tasks.jsx'
import TimeEntries from './pages/TimeEntries.jsx'
import Profile from './pages/Profile.jsx'
import Vacation from './pages/Vacation.jsx'
import Request from './pages/Request.jsx'
import Expense from './pages/Expense.jsx'
import Cases from './pages/Cases.jsx'
import Policy from './pages/Policy.jsx'
import Placeholder from './pages/Placeholder.jsx'
import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

export default function App() {
    return (
        <ToastProvider>
            <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/time-entries" element={<TimeEntries />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/vacation" element={<Vacation />} />
                    <Route path="/request" element={<Request />} />
                    <Route path="/expense" element={<Expense />} />
                    <Route path="/cases" element={<Cases />} />
                    <Route path="/policy" element={<Policy />} />
                </Route>
                <Route path="/" element={<Navigate to="/signin" replace />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </ToastProvider>
    )
}
