import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ASSIGNED_PROJECTS } from '../data/projects.js'
import { SEED_TASKS } from '../data/tasks.js'
import { SEED_TIME_ENTRIES } from '../data/timeEntries.js'

export default function Dashboard() {
    const { user } = useAuth()
    const nav = useNavigate()

    // ---- Real metrics derived from the same seed data the other pages use ----
    const activeProjects = ASSIGNED_PROJECTS.filter(p => p.status !== 'Complete').length
    const openTasks = SEED_TASKS.filter(t => !['Complete', 'Canceled'].includes(t.status)).length
    const completedTasks = SEED_TASKS.filter(t => t.status === 'Complete').length

    // Hours logged in the last 7 days (by entry date)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const minsThisWeek = SEED_TIME_ENTRIES
        .filter(e => {
            const d = new Date(e.date)
            return d >= weekAgo && d <= now
        })
        .reduce((s, e) => s + Number(e.durationMins || 0), 0)
    const hoursThisWeek = (minsThisWeek / 60).toFixed(1)

    const stats = [
        { label: 'Active Projects', value: activeProjects, tone: 'indigo', to: '/projects' },
        { label: 'Open Tasks', value: openTasks, tone: 'amber', to: '/tasks?status=open' },
        { label: 'Hours This Week', value: hoursThisWeek, tone: 'green', to: '/time-entries' },
        { label: 'Completed Tasks', value: completedTasks, tone: 'red', to: '/tasks?status=complete' }
    ]

    // ---- Real recent activity, derived from the seed data ----
    // Most recent completed task
    const lastCompleted = SEED_TASKS.filter(t => t.status === 'Complete')[0]
    // Most recent time entry (sorted by date desc)
    const lastEntry = [...SEED_TIME_ENTRIES].sort((a, b) => b.date.localeCompare(a.date))[0]
    // Most recent in-progress task
    const lastInProgress = SEED_TASKS.find(t => t.status === 'In Progress')

    const fmtH = (m) => `${(m / 60).toFixed(1)}h`

    const activities = [
        lastCompleted && {
            icon: '✅',
            text: 'Completed task',
            strong: `"${lastCompleted.name}"`,
            when: lastCompleted.start,
            to: `/tasks?project=${encodeURIComponent(lastCompleted.project)}`
        },
        lastEntry && {
            icon: '📝',
            text: `Logged ${fmtH(lastEntry.durationMins)} on`,
            strong: lastEntry.project,
            when: lastEntry.date,
            to: `/time-entries?project=${encodeURIComponent(lastEntry.project)}`
        },
        lastInProgress && {
            icon: '▶️',
            text: 'In Progress:',
            strong: `"${lastInProgress.name}"`,
            when: lastInProgress.start,
            to: `/tasks?project=${encodeURIComponent(lastInProgress.project)}`
        }
    ].filter(Boolean)

    const onKey = (to) => (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            nav(to)
        }
    }

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1>Welcome, {user?.name} 👋</h1>
                    <p className="muted">Here's a quick overview of your work today.</p>
                </div>
            </header>

            <section className="stat-grid">
                {stats.map(s => (
                    <div
                        key={s.label}
                        className={`stat-card tone-${s.tone}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => nav(s.to)}
                        onKeyDown={onKey(s.to)}
                        title={`Open ${s.label}`}
                    >
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </section>

            <section className="card dashboard-activity">
                <h3>Recent activity</h3>
                <ul className="activity">
                    {activities.map((a, i) => (
                        <li
                            key={i}
                            role="button"
                            tabIndex={0}
                            onClick={() => nav(a.to)}
                            onKeyDown={onKey(a.to)}
                            title={`Go to ${a.to}`}
                        >
                            {a.icon} {a.text} <strong>{a.strong}</strong> · {a.when}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}
