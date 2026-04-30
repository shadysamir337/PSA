import { useMemo, useState } from 'react'

const SEED_VACATIONS = [
    { id: 1, user: 'Shady Samir', from: '4/14/2026', to: '4/16/2026', approved: 'Yes', type: 'Annual', days: 3, created: '4/13/2026 9:12 PM' },
    { id: 2, user: 'Shady Samir', from: '2/5/2026', to: '2/5/2026', approved: 'Yes', type: 'Annual', days: 1, created: '2/5/2026 8:58 AM' },
    { id: 3, user: 'Shady Samir', from: '1/18/2026', to: '1/18/2026', approved: 'Yes', type: 'Annual', days: 1, created: '1/22/2026 4:23 PM' },
]

const VACATION_TYPES = [
    'Annual',
    'None Paid',
    'Casual\\Sick Leave (un-certified)',
    'Sick Leave (Official Certificate)',
    'Maternity Leave',
]

// Types that count against the casual balance
const CASUAL_TYPES = new Set(['Casual\\Sick Leave (un-certified)'])

const PUBLIC_HOLIDAYS = [
    { name: 'Coptic Christmas Day', date: 'Wednesday, January 7th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'January 25th Revolution and National Police Day', date: 'Sunday, January 25th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Eid Al-Fitr', date: 'Thursday, March 19th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Eid Al-Fitr', date: 'Friday, March 20th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Eid Al-Fitr', date: 'Saturday, March 21st, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Eid Al-Fitr', date: 'Sunday, March 22nd, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Eid Al-Fitr', date: 'Monday, March 23rd, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Christants Vacation', date: 'Monday, April 13th, 2026', group: 'Christian,' },
    { name: 'Sham El-Nessim', date: 'Monday, April 13th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Christants Vacation', date: 'Friday, April 17th, 2026', group: 'Christian,' },
    { name: 'Christants Vacation', date: 'Monday, April 20th, 2026', group: 'Christian,' },
    { name: 'Sinai Liberation Day (April 25, 1982)', date: 'Saturday, April 25th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Labor Day', date: 'Friday, May 1st, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: "Arafat's Day", date: 'Tuesday, May 26th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Eid Al-Adha', date: 'Wednesday, May 27th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Eid Al-Adha', date: 'Thursday, May 28th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Eid Al-Adha', date: 'Friday, May 29th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Islamic New Year', date: 'Wednesday, June 17th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'June 30 Revolution', date: 'Tuesday, June 30th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'The July 23 Revolution Day (July 23, 1952)', date: 'Thursday, July 23rd, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: "Prophet Muhammad's Birthday (Mawlid Al-Nabi)", date: 'Wednesday, August 26th, 2026', group: 'Christian, Hindu, Muslim,' },
    { name: 'Armed Forces Day (October 6, 1973)', date: 'Tuesday, October 6th, 2026', group: 'Christian, Hindu, Muslim,' },
]

const formatDate = (iso) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`
}

const dayDiff = (a, b) => {
    if (!a || !b) return 0
    const diff = (new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24)
    return Math.max(1, Math.round(diff) + 1)
}

export default function Vacation() {
    const [vacations, setVacations] = useState(SEED_VACATIONS)
    const [show, setShow] = useState(false)
    const [form, setForm] = useState({ from: '', to: '', type: 'Annual', reason: '' })
    const [holidaySearch, setHolidaySearch] = useState('')

    const consumedAnnual = useMemo(
        () => vacations.filter(v => v.type === 'Annual').reduce((s, v) => s + v.days, 0),
        [vacations]
    )
    const consumedCasual = useMemo(
        () => vacations.filter(v => CASUAL_TYPES.has(v.type)).reduce((s, v) => s + v.days, 0),
        [vacations]
    )

    const totals = {
        availableAnnual: 16 - consumedAnnual,
        consumedAnnual,
        availableCasual: 6 - consumedCasual,
        consumedCasual,
    }
    totals.totalAvailable = totals.availableAnnual + totals.availableCasual

    const filteredHolidays = useMemo(
        () => PUBLIC_HOLIDAYS.filter(h =>
            !holidaySearch || h.name.toLowerCase().includes(holidaySearch.toLowerCase())
        ),
        [holidaySearch]
    )

    const submit = (e) => {
        e.preventDefault()
        if (!form.from || !form.to) return
        const days = dayDiff(form.from, form.to)
        const now = new Date()
        const created =
            `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ` +
            `${((now.getHours() + 11) % 12 + 1)}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`
        setVacations([
            { id: Date.now(), user: 'Shady Samir', from: formatDate(form.from), to: formatDate(form.to), approved: 'Pending', type: form.type, days, created },
            ...vacations
        ])
        setForm({ from: '', to: '', type: 'Annual', reason: '' })
        setShow(false)
    }

    return (
        <div className="tasks-page profile-page">
            <header className="page-header">
                <h1>🏖️ Vacation</h1>
                <p className="muted">Track your leave balance, view past vacations, and request new ones.</p>
            </header>

            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="stat-card tone-indigo">
                    <div className="stat-value">{totals.totalAvailable}</div>
                    <div className="stat-label">Total available leave</div>
                </div>
                <div className="stat-card tone-green">
                    <div className="stat-value">{totals.availableAnnual}</div>
                    <div className="stat-label">Available annual</div>
                </div>
                <div className="stat-card tone-amber">
                    <div className="stat-value">{totals.consumedAnnual}</div>
                    <div className="stat-label">Consumed annual</div>
                </div>
                <div className="stat-card tone-green">
                    <div className="stat-value">{totals.availableCasual}</div>
                    <div className="stat-label">Available casual</div>
                </div>
                <div className="stat-card tone-red">
                    <div className="stat-value">{totals.consumedCasual}</div>
                    <div className="stat-label">Consumed casual</div>
                </div>
            </div>

            <div className="vacation-grid">
                {/* My Vacations */}
                <section className="vacation-card">
                    <div className="vacation-header">
                        <h3>My Vacations</h3>
                        <button className="btn btn-create" onClick={() => setShow(true)}>+ Request Vacation</button>
                    </div>
                    <div className="tasks-table-wrap" style={{ maxHeight: 220 }}>
                        <table className="tasks-table">
                            <thead>
                                <tr>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Type</th>
                                    <th>Days</th>
                                    <th>Approved</th>
                                    <th>Created On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vacations.map(v => (
                                    <tr key={v.id}>
                                        <td>{v.from}</td>
                                        <td>{v.to}</td>
                                        <td>{v.type}</td>
                                        <td><strong>{v.days}</strong></td>
                                        <td>
                                            <span className={`pill ${v.approved === 'Yes' ? 'pill-green' : v.approved === 'Pending' ? 'pill-amber' : 'pill-red'}`}>
                                                {v.approved}
                                            </span>
                                        </td>
                                        <td className="muted">{v.created}</td>
                                    </tr>
                                ))}
                                {vacations.length === 0 && (
                                    <tr><td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 16 }}>No vacations yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Public Holidays */}
                <section className="vacation-card">
                    <div className="vacation-header">
                        <h3>All Public Holidays</h3>
                        <div className="search-box" style={{ height: 32, minWidth: 220 }}>
                            <input
                                placeholder="Search holiday"
                                value={holidaySearch}
                                onChange={e => setHolidaySearch(e.target.value)}
                            />
                            <button className="search-btn" style={{ width: 36 }}>🔍</button>
                        </div>
                    </div>
                    <div className="tasks-table-wrap" style={{ maxHeight: 220 }}>
                        <table className="tasks-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Date</th>
                                    <th>Religious Group</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHolidays.map((h, i) => (
                                    <tr key={i}>
                                        <td>{h.name}</td>
                                        <td className="muted">{h.date}</td>
                                        <td>{h.group}</td>
                                    </tr>
                                ))}
                                {filteredHolidays.length === 0 && (
                                    <tr><td colSpan="3" className="muted" style={{ textAlign: 'center', padding: 16 }}>No holidays match.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {show && (
                <div className="modal-backdrop" onClick={() => setShow(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
                        <h3>Request Vacation</h3>
                        <form onSubmit={submit} className="task-form-grid">
                            <label className="field">
                                <span>From <em>*</em></span>
                                <input type="date" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} required />
                            </label>
                            <label className="field">
                                <span>To <em>*</em></span>
                                <input type="date" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} required min={form.from} />
                            </label>
                            <label className="field">
                                <span>Type <em>*</em></span>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                                    <option value="" disabled>Select</option>
                                    {VACATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </label>
                            <label className="field">
                                <span>Days</span>
                                <input value={form.from && form.to ? dayDiff(form.from, form.to) : ''} disabled />
                            </label>
                            <label className="field full-row">
                                <span>Reason</span>
                                <textarea rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                            </label>
                            <div className="form-actions full-row">
                                <button type="button" className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
                                <button type="submit" className="btn-submit-dark">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
