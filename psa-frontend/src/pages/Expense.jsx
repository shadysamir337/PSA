import { useMemo, useState } from 'react'

const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED']

const SEED = [
    // start empty to mirror "There are no records to display."
]

const EMPTY = { purpose: '', date: '', amount: '', currency: '', file: null }

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

export default function Expense() {
    const [expenses, setExpenses] = useState(SEED)
    const [show, setShow] = useState(false)
    const [form, setForm] = useState(EMPTY)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const stats = useMemo(() => {
        const total = expenses.length
        const approved = expenses.filter(e => e.status === 'Approved').length
        const pending = expenses.filter(e => e.status === 'Pending').length
        const totalAmt = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
        return { total, approved, pending, totalAmt }
    }, [expenses])

    const filtered = useMemo(() => expenses.filter(e => {
        if (statusFilter && e.status !== statusFilter) return false
        if (search.trim() && !e.purpose.toLowerCase().includes(search.trim().toLowerCase())) return false
        return true
    }), [expenses, statusFilter, search])

    const update = (p) => setForm(f => ({ ...f, ...p }))

    const submit = (e) => {
        e.preventDefault()
        if (!form.purpose.trim() || !form.date || !form.amount || !form.currency) return
        setExpenses([
            {
                id: Date.now(),
                user: 'Shady Samir',
                purpose: form.purpose.trim(),
                status: 'Pending',
                date: fmt(form.date),
                amount: Number(form.amount),
                currency: form.currency,
                created: fmtNow(),
            },
            ...expenses,
        ])
        setForm(EMPTY)
        setShow(false)
    }

    return (
        <div className="tasks-page">
            <header className="page-header">
                <h1>💳 Expense</h1>
                <p className="muted">Submit and track expense claims with receipts.</p>
            </header>

            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card tone-indigo">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total expenses</div>
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
                    <div className="stat-value">{stats.totalAmt.toLocaleString()}</div>
                    <div className="stat-label">Total amount</div>
                </div>
            </div>

            <div className="tasks-toolbar">
                <div className="select-wrap" style={{ minWidth: 200 }}>
                    <span className="select-icon">▾</span>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All statuses</option>
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Rejected</option>
                    </select>
                </div>
                <div className="search-box">
                    <input
                        placeholder="Search expense purpose"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button className="search-btn" aria-label="Search">🔍</button>
                </div>
                <button className="btn btn-create" onClick={() => setShow(true)}>+ Add Expense</button>
            </div>

            <div className="tasks-table-wrap">
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th>ATS User</th>
                            <th>Expense Purpose</th>
                            <th>Expense Status</th>
                            <th>Transaction Date <span className="sort-arrow">▼</span></th>
                            <th>Amount</th>
                            <th>Currency</th>
                            <th>Created On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(e => (
                            <tr key={e.id}>
                                <td>{e.user}</td>
                                <td>{e.purpose}</td>
                                <td>
                                    <span className={`pill ${e.status === 'Approved' ? 'pill-green' : e.status === 'Pending' ? 'pill-amber' : 'pill-red'}`}>
                                        {e.status}
                                    </span>
                                </td>
                                <td>{e.date}</td>
                                <td><strong>{Number(e.amount).toLocaleString()}</strong></td>
                                <td>{e.currency}</td>
                                <td className="muted">{e.created}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 20 }}>There are no records to display.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {show && (
                <div className="modal-backdrop" onClick={() => setShow(false)}>
                    <div className="modal modal-wide" onClick={ev => ev.stopPropagation()} style={{ maxWidth: 760 }}>
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
                                <span>Expense Purpose <em>*</em></span>
                                <input
                                    value={form.purpose}
                                    onChange={e => update({ purpose: e.target.value })}
                                    required
                                />
                            </label>
                            <label className="field">
                                <span>Transaction Date <em>*</em></span>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => update({ date: e.target.value })}
                                    required
                                />
                            </label>
                            <label className="field">
                                <span>Amount <em>*</em></span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={e => update({ amount: e.target.value })}
                                    required
                                />
                            </label>
                            <label className="field">
                                <span>Currency <em>*</em></span>
                                <select value={form.currency} onChange={e => update({ currency: e.target.value })} required>
                                    <option value="" disabled>Select</option>
                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </label>
                            <label className="field full-row">
                                <span>Attach a file <em>*</em></span>
                                <input
                                    type="file"
                                    onChange={e => update({ file: e.target.files?.[0] || null })}
                                    style={{ padding: 6 }}
                                    required
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
