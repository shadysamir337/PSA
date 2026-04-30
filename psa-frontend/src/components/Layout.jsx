import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Layout() {
    const { user, signOut } = useAuth()
    const nav = useNavigate()

    const handleLogout = () => {
        signOut()
        nav('/signin', { replace: true })
    }

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <img src="/logo.png" alt="ATS — About The Solution" className="brand-logo-img" />
                    <div>
                        <div className="brand-title">Employee Portal</div>
                        <div className="brand-sub">Projects · Tasks · Time</div>
                    </div>
                </div>
                <nav className="nav">
                    <NavLink to="/dashboard" className="nav-link">📊 Dashboard</NavLink>
                    <NavLink to="/projects" className="nav-link">📁 Projects</NavLink>
                    <NavLink to="/tasks" className="nav-link">✅ My Tasks</NavLink>
                    <NavLink to="/time-entries" className="nav-link">⏱️ My Time Entries</NavLink>
                    <div className="nav-section">More</div>
                    <NavLink to="/profile" className="nav-link">👤 Profile</NavLink>
                    <NavLink to="/vacation" className="nav-link">🏖️ Vacation</NavLink>
                    <NavLink to="/request" className="nav-link">📨 Request</NavLink>
                    <NavLink to="/expense" className="nav-link">💳 Expense</NavLink>
                    <NavLink to="/cases" className="nav-link">🗂️ ATS Cases</NavLink>
                    <NavLink to="/policy" className="nav-link">📜 Policy</NavLink>
                </nav>
                <div className="sidebar-footer">
                    <button
                        type="button"
                        className="user-chip"
                        onClick={() => nav('/profile')}
                        title="Open profile"
                    >
                        <div className="avatar">{(user?.name?.[0] || 'U').toUpperCase()}</div>
                        <div className="user-chip-text">
                            <div className="user-name">{user?.name}</div>
                            <div className="user-role">{user?.role}</div>
                        </div>
                    </button>
                    <button className="btn btn-signout" onClick={handleLogout}>
                        <svg
                            className="signout-icon"
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>
            <main className="main">
                <Outlet />
            </main>
        </div>
    )
}
