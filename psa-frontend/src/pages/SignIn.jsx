import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function SignIn() {
    const { user, signIn } = useAuth()
    const nav = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    if (user) return <Navigate to="/dashboard" replace />

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')
        if (!email.trim() || !password.trim()) {
            setError('Please enter your credentials.')
            return
        }
        setLoading(true)
        setTimeout(() => {
            signIn(email.trim())
            nav('/dashboard', { replace: true })
        }, 500)
    }

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <img src="/logo.png" alt="ATS — About The Solution" className="auth-logo-img" />
                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-sub">Sign in to the <strong>ATS Employee Portal</strong> — your hub for projects, tasks, and time.</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label className="field">
                        <span>Work email</span>
                        <input
                            type="text"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                        />
                    </label>

                    <label className="field">
                        <span>Password</span>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>

                    <div className="row-between small">
                        <label className="check">
                            <input type="checkbox" defaultChecked /> Remember me
                        </label>
                        <a href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
                    </div>

                    {error && <div className="alert">{error}</div>}

                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>

                    <p className="hint">
                        Employees only. Contact your IT administrator if you don't have access.
                    </p>
                </form>
            </div>

            <div className="auth-footer">
                © {new Date().getFullYear()} ATS — About The Solution · Microsoft Dynamics 365 Partner
            </div>
        </div>
    )
}
