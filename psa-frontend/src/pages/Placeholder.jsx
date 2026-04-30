export default function Placeholder({ title, description, icon = '🚧' }) {
    return (
        <div>
            <header className="page-header">
                <h1>{icon} {title}</h1>
                <p className="muted">{description}</p>
            </header>
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
                <h2 style={{ margin: '0 0 6px' }}>{title} module</h2>
                <p className="muted" style={{ margin: 0 }}>This area is part of the ATS PSA Portal and is coming soon.</p>
            </div>
        </div>
    )
}
