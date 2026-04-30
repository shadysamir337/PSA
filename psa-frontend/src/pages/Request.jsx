import { useMemo, useState } from 'react'

const REQUEST_TYPES = [
    'Early Leave Permission Request',
    'Work from Home Request',
    'Late Arrival Permission',
    'Excuse Permission',
    'Other',
]

const SEED = [
    { id: 1, employee: 'Shady Samir', date: '4/8/2026 2:43 PM', approved: 'Yes', type: 'Early Leave Permission Request', created: '4/8/2026 2:43 PM' },
    { id: 2, employee: 'Shady Samir', date: '1/6/2026 3:40 PM', approved: 'No', type: 'Work from Home Request', created: '1/5/2026 3:41 PM' },
    { id: 3, employee: 'Shady Samir', date: '9/28/2025 1:49 PM', approved: 'Yes', type: 'Early Leave Permission Request', created: '9/28/2025 1:49 PM' },
    { id: 4, employee: 'Shady Samir', date: '9/16/2025 9:15 AM', approved: 'No', type: 'Work from Home Request', created: '9/16/2025 9:16 AM' },
    { id: 5, employee: 'Shady Samir', date: '7/1/2025 3:26 PM', approved: 'No', type: 'Early Leave Permission Request', created: '7/1/2025 3:29 PM' },
    { id: 6, employee: 'Shady Samir', date: '6/30/2025 10:09 AM', approved: 'No', type: 'Work from Home Request', created: '6/30/2025 10:10 AM' },
    { id: 7, employee: 'Shady Samir', date: '5/6/2025 10:49 AM', approved: 'No', type: 'Work from Home Request', created: '5/6/2025 10:50 AM' },
]

const EMPTY = { type: '', date: '', reason: '', file: null }

const fmtDateTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const m = d.getMonth() + 1
    const day = d.getDate()
    const y = d.getFullYear()
    let h = d.getHours()
    const min = String(d.getMinutes()).padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${m}/${day}/${y} ${h}:${min} ${ampm}`
}

export default function Request() {
    const [requests, setRequests] = useState(SEED)
    const [show, setShow] = useState(false)
    const [form, setForm] = useState(EMPTY)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')

    const stats = useMemo(() => {
        const total = requests.length
        const approved = requests.filter(r => r.approved === 'Yes').length
        const pending = requests.filter(r => r.approved === 'Pending').length
        const rejected = requests.filter(r => r.approved === 'No').length
        return { total, approved, pending, rejected }
    }, [requests])

    const filtered = useMemo(() => requests.filter(r => {
        if (typeFilter && r.type !== typeFilter) return false
        if (search.trim() && !r.type.toLowerCase().includes(search.trim().toLowerCase())) return false
        return true
    }), [requests, typeFilter, search])

    const update = (p) => setForm(f => ({ ...f, ...p }))

    const submit = (e) => {
        e.preventDefault()
        if (!form.type || !form.date || !form.reason.trim()) return
        const now = fmtDateTime(new Date().toISOString())
        setRequests([
            { id: Date.now(), employee: 'Shady Samir', date: fmtDateTime(form.date), approved: 'Pending', type: form.type, created: now },
            ...requests
        ])
        setForm(EMPTY)
        setShow(false)
    }

    return (
        <div className="tasks-page">
            <header className="page-header">
                <h1>📨 Requests</h1>
                <p className="muted">Submit and track your HR / IT requests.</p>
            </header>

            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card tone-indigo">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total requests</div>
                </div>
                <div className="stat-card tone-green">
                    <div className="stat-value">{stats.approved}</div>
                    <div className="stat-label">Approved</div>
                </div>
                <div className="stat-card tone-amber">
                    <div className="stat-value">{stats.pending}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card tone-red">
                    <div className="stat-value">{stats.rejected}</div>
                    <div className="stat-label">Rejected</div>
                </div>
            </div>

            <div className="tasks-toolbar">
                <div className="select-wrap" style={{ minWidth: 240 }}>
                    <span className="select-icon">▾</span>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                        <option value="">All request types</option>
                        {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="search-box">
                    <input
                        placeholder="Search request type"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button className="search-btn" aria-label="Search">🔍</button>
                </div>
                <button className="btn btn-create" onClick={() => setShow(true)}>+ Create Request</button>
            </div>

            <div className="tasks-table-wrap">
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Date/Time</th>
                            <th>Approved</th>
                            <th>Request Type</th>
                            <th>Created On <span className="sort-arrow">▼</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r.id}>
                                <td>{r.employee}</td>
                                <td>{r.date}</td>
                                <td>
                                    <span className={`pill ${r.approved === 'Yes' ? 'pill-green' : r.approved === 'Pending' ? 'pill-amber' : 'pill-red'}`}>
                                        {r.approved}
                                    </span>
                                </td>
                                <td>{r.type}</td>
                                <td className="muted">{r.created}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan="5" className="muted" style={{ textAlign: 'center', padding: 20 }}>No requests match.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {show && (
                <div className="modal-backdrop" onClick={() => setShow(false)}>
                    <div className="modal modal-wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>✏️ Create</h2>
                            <button
                                onClick={() => setShow(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}
                                aria-label="Close"
                            >✕</button>
                        </div>
                        <h3 className="section-title" style={{ fontSize: 20, marginBottom: 14 }}>General</h3>

                        <form onSubmit={submit} className="task-form-grid">
                            <label className="field">
                                <span>Employee <em>*</em></span>
                                <input value="Shady Samir" disabled />
                            </label>
                            <label className="field">
                                <span>Request Type <em>*</em></span>
                                <select value={form.type} onChange={e => update({ type: e.target.value })} required>
                                    <option value="" disabled>Select</option>
                                    {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </label>

                            <label className="field full-row">
                                <span>Date/Time <em>*</em></span>
                                <input
                                    type="datetime-local"
                                    value={form.date}
                                    onChange={e => update({ date: e.target.value })}
                                    required
                                />
                            </label>

                            <label className="field full-row">
                                <span>Reason <em>*</em></span>
                                <textarea rows={5} value={form.reason} onChange={e => update({ reason: e.target.value })} required />
                            </label>

                            <label className="field full-row">
                                <span>Attach a file</span>
                                <input
                                    type="file"
                                    onChange={e => update({ file: e.target.files?.[0] || null })}
                                    style={{ padding: 6 }}
                                />
                            </label>

                            <div className="form-actions full-row">
                                <button type="button" className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
                                <button type="submit" className="btn-submit-dark">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
