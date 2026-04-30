import { Link } from 'react-router-dom'
export default function NotFound() {
    return (
        <div className="auth-wrap">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <h1>404</h1>
                <p className="muted">Page not found</p>
                <Link to="/signin" className="btn btn-primary">Back to sign in</Link>
            </div>
        </div>
    )
}
