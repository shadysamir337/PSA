import { Link } from 'react-router-dom'
import { ASSIGNED_PROJECTS } from '../data/projects.js'

const PROGRESS_BY_STATUS = {
    'Planning': 15,
    'In Progress': 55,
    'Review': 85,
    'Complete': 100,
}

export default function Projects() {
    const projects = ASSIGNED_PROJECTS.map(p => ({
        ...p,
        progress: PROGRESS_BY_STATUS[p.status] ?? 30,
    }))
    return (
        <div>
            <header className="page-header">
                <h1>My Projects</h1>
                <p className="muted">Click a project to view your tasks for it.</p>
            </header>
            <div className="card">
                <table className="table">
                    <thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Progress</th></tr></thead>
                    <tbody>
                        {projects.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <Link
                                        className="link"
                                        to={`/tasks?project=${encodeURIComponent(p.name)}`}
                                    >
                                        <strong>{p.name}</strong>
                                    </Link>
                                </td>
                                <td>{p.client}</td>
                                <td><span className="badge">{p.status}</span></td>
                                <td>
                                    <div className="progress"><div style={{ width: `${p.progress}%` }} /></div>
                                    <small className="muted">{p.progress}%</small>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
