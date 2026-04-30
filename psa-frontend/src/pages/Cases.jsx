import { useMemo, useState } from 'react'

const TYPES = ['Question', 'Problem', 'Request', 'Incident']
const SUBJECTS = ['Default Subject', 'Hardware', 'Software', 'Network', 'Account / Access', 'Other']
const PRIORITIES = ['Low', 'Normal', 'High']
const STATUS_REASONS = ['In Progress', 'On Hold', 'Waiting for Details', 'Researching', 'Information Provided', 'Resolved', 'Cancelled']
const CHANNELS = ['Web', 'Email', 'Phone', 'Teams', 'In Person']

const SEED = []

const EMPTY = {
    title: '',
    typeop: '',
    subject: '',
    priority: 'Normal',
    statusReason: 'In Progress',
    reportingDate: '',
    channel: 'Web',
    customer: 'ATS Internal',
    contact: 'Shady Samir',
    description: '',
}

const fmt = (iso) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`
}

const fmtNow = () => {
    const d = new Date()
    let h = d.getHours()
    const min = String(d.getMinutes()).padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${h}:${min} ${ampm}`
}

const nextCaseNumber = (list) => {
    const n = (list?.length || 0) + 1
    return 'CAS-' + String(1000 + n)
}

export default function Cases() {
    const [cases, setCases] = useState(SEED)
    const [show, setShow] = useState(false)
    const [form, setForm] = useState(EMPTY)
    const [search, setSearch] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const stats = useMemo(() => {
        const total = cases.length
        const open = cases.filter(c => !['Resolved', 'Cancelled'].includes(c.statusReason)).length
        const high = cases.filter(c => c.priority === 'High').length
        const resolved = cases.filter(c => c.statusReason === 'Resolved').length
        return { total, open, high, resolved }
    }, [cases])

    const filtered = useMemo(() => cases.filter(c => {
        if (priorityFilter && c.priority !== priorityFilter) return false
        if (statusFilter && c.statusReason !== statusFilter) return false
        const q = search.trim().toLowerCase()
        if (q && !(`${c.caseNumber} ${c.title} ${c.subject}`.toLowerCase().includes(q))) return false
        return true
    }), [cases, search, priorityFilter, statusFilter])

    const update = (p) => setForm(f => ({ ...f, ...p }))

    const submit = (e) => {
        e.preventDefault()
        if (!form.title.trim() || !form.typeop || !form.subject || !form.reportingDate) return
        const newCase = {
            id: Date.now(),
            caseNumber: nextCaseNumber(cases),
            title: form.title.trim(),
            typeop: form.typeop,
            subject: form.subject,
            priority: form.priority,
            statusReason: form.statusReason,
            reportingDate: fmt(form.reportingDate),
            channel: form.channel,
            customer: form.customer,
            contact: form.contact,
            description: form.description,
            created: fmtNow(),
        }
        setCases([newCase, ...cases])
        setForm(EMPTY)
        setShow(false)
    }

    return (
        <div className="tasks-page">
            <header className="page-header">
                <h1>🗂️ ATS Cases</h1>
                <p className="muted">Internal support and case management.</p>
            </header>

            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card tone-indigo">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total cases</div>
                </div>
                <div className="stat-card tone-amber">
                    <div className="stat-value">{stats.open}</div>
                    <div className="stat-label">Open</div>
                </div>
                <div className="stat-card tone-red">
                    <div className="stat-value">{stats.high}</div>
                    <div className="stat-label">High priority</div>
                </div>
                <div className="stat-card tone-green">
                    <div className="stat-value">{stats.resolved}</div>
                    <div className="stat-label">Resolved</div>
                </div>
            </div>

            <div className="tasks-toolbar">
                <div className="select-wrap" style={{ minWidth: 160 }}>
                    <span className="select-icon">▾</span>
                    <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                        <option value="">All priorities</option>
                        {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                </div>
                <div className="select-wrap" style={{ minWidth: 200 }}>
                    <span className="select-icon">▾</span>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All statuses</option>
                        {STATUS_REASONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <div className="search-box">
                    <input
                        placeholder="Search case number, title, subject"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button className="search-btn" aria-label="Search">🔍</button>
                </div>
                <button className="btn btn-create" onClick={() => setShow(true)}>+ Create Case</button>
            </div>

            <div className="tasks-table-wrap">
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th>Case Number</th>
                            <th>Case Title</th>
                            <th>Typeop</th>
                            <th>Subject</th>
                            <th>Priority</th>
                            <th>Status Reason</th>
                            <th>Reporting Date <span className="sort-arrow">▼</span></th>
                            <th>Reporting Channel</th>
                            <th>Customer</th>
                            <th>Reporting Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id}>
                                <td><span className="link">{c.caseNumber}</span></td>
                                <td>{c.title}</td>
                                <td>{c.typeop}</td>
                                <td>{c.subject}</td>
                                <td>
                                    <span className={`pill ${c.priority === 'High' ? 'pill-red' : c.priority === 'Low' ? 'pill-green' : 'pill-amber'}`}>
                                        {c.priority}
                                    </span>
                                </td>
                                <td>
                                    <span className={`pill ${c.statusReason === 'Resolved' ? 'pill-green' : c.statusReason === 'Cancelled' ? 'pill-red' : 'pill-amber'}`}>
                                        {c.statusReason}
                                    </span>
                                </td>
                                <td>{c.reportingDate}</td>
                                <td>{c.channel}</td>
                                <td>{c.customer}</td>
                                <td>{c.contact}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan="10" className="muted" style={{ textAlign: 'center', padding: 20 }}>There are no records to display.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {show && (
                <div className="modal-backdrop" onClick={() => setShow(false)}>
                    <div className="modal modal-wide" onClick={ev => ev.stopPropagation()}>
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
                                <span>Case Title <em>*</em></span>
                                <input value={form.title} onChange={e => update({ title: e.target.value })} required />
                            </label>
                            <label className="field">
                                <span>Typeop <em>*</em></span>
                                <select value={form.typeop} onChange={e => update({ typeop: e.target.value })} required>
                                    <option value="" disabled>Select</option>
                                    {TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </label>

                            <label className="field">
                                <span>Subject <em>*</em></span>
                                <select value={form.subject} onChange={e => update({ subject: e.target.value })} required>
                                    <option value="" disabled>Select</option>
                                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </label>
                            <label className="field">
                                <span>Priority</span>
                                <select value={form.priority} onChange={e => update({ priority: e.target.value })}>
                                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </label>

                            <label className="field">
                                <span>Status Reason</span>
                                <select value={form.statusReason} onChange={e => update({ statusReason: e.target.value })}>
                                    {STATUS_REASONS.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </label>
                            <label className="field">
                                <span>Reporting Date <em>*</em></span>
                                <input type="date" value={form.reportingDate} onChange={e => update({ reportingDate: e.target.value })} required />
                            </label>

                            <label className="field">
                                <span>Reporting Channel</span>
                                <select value={form.channel} onChange={e => update({ channel: e.target.value })}>
                                    {CHANNELS.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </label>
                            <label className="field">
                                <span>Customer</span>
                                <input value={form.customer} onChange={e => update({ customer: e.target.value })} />
                            </label>

                            <label className="field full-row">
                                <span>Reporting Contact</span>
                                <input value={form.contact} onChange={e => update({ contact: e.target.value })} />
                            </label>

                            <label className="field full-row">
                                <span>Description</span>
                                <textarea rows={4} value={form.description} onChange={e => update({ description: e.target.value })} />
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
