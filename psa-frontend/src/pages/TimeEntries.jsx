import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ASSIGNED_PROJECTS } from '../data/projects.js'
import { SEED_TIME_ENTRIES } from '../data/timeEntries.js'
import { useToast } from '../context/ToastContext.jsx'
import { exportToXlsx, importFromXlsx, parseDurationMins, toIsoDate } from '../utils/excel.js'
import useEscape from '../utils/useEscape.js'

const TYPES = ['On Break', 'Travel', 'Overtime', 'Work']

// Quarter-hour increments up to 12 hours
const DURATIONS = (() => {
    const out = []
    for (let mins = 15; mins <= 12 * 60; mins += 15) {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        out.push({ value: mins, label: `${h}:${String(m).padStart(2, '0')}` })
    }
    return out
})()

const todayIso = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const EMPTY = { date: todayIso(), project: '', task: '', durationMins: '', type: 'Work', notes: '', completed: false }

const minsToLabel = (m) => {
    if (!m && m !== 0) return ''
    const h = Math.floor(m / 60)
    const min = m % 60
    return `${h}:${String(min).padStart(2, '0')}`
}

export default function TimeEntries() {
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const toast = useToast()
    const [entries, setEntries] = useState(SEED_TIME_ENTRIES)
    const [form, setForm] = useState(EMPTY)
    const [show, setShow] = useState(false)
    const [filterProject, setFilterProject] = useState(searchParams.get('project') || '')
    const [search, setSearch] = useState('')
    const [datePreset, setDatePreset] = useState('all') // 'all' | 'today' | 'week'
    const [showMoreMenu, setShowMoreMenu] = useState(false)

    // Esc closes any modal/menu
    useEscape(show, () => setShow(false))
    useEscape(showMoreMenu, () => setShowMoreMenu(false))

    useEffect(() => {
        const p = searchParams.get('project') || ''
        setFilterProject(p)
    }, [searchParams])

    useEffect(() => {
        const prefill = location.state?.prefill
        if (prefill) {
            setForm(f => ({
                ...EMPTY,
                project: prefill.project || '',
                task: prefill.task || '',
            }))
            setShow(true)
        }
    }, [location.state])

    const update = (p) => setForm(f => ({ ...f, ...p }))

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
        return entries.filter(e => {
            if (filterProject && e.project !== filterProject) return false
            if (q && !(`${e.task} ${e.notes || ''}`.toLowerCase().includes(q))) return false
            if (datePreset !== 'all') {
                const d = new Date(e.date)
                if (datePreset === 'today' && d < today) return false
                if (datePreset === 'week' && d < weekAgo) return false
            }
            return true
        })
    }, [entries, filterProject, search, datePreset])

    // Group filtered entries by day for cleaner scanning
    const grouped = useMemo(() => {
        const byDay = new Map()
        for (const e of filtered) {
            if (!byDay.has(e.date)) byDay.set(e.date, [])
            byDay.get(e.date).push(e)
        }
        return [...byDay.entries()]
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, items]) => ({
                date,
                items,
                totalMins: items.reduce((s, x) => s + Number(x.durationMins || 0), 0)
            }))
    }, [filtered])

    const fmtDayLabel = (iso) => {
        const d = new Date(iso)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        const dd = new Date(d); dd.setHours(0, 0, 0, 0)
        if (dd.getTime() === today.getTime()) return `Today · ${iso}`
        if (dd.getTime() === yesterday.getTime()) return `Yesterday · ${iso}`
        return d.toLocaleDateString(undefined, { weekday: 'long' }) + ` · ${iso}`
    }

    const totals = useMemo(() => {
        const totalMins = filtered.reduce((s, e) => s + Number(e.durationMins || 0), 0)
        const workMins = filtered.filter(e => e.type === 'Work').reduce((s, e) => s + Number(e.durationMins || 0), 0)
        const overtimeMins = filtered.filter(e => e.type === 'Overtime').reduce((s, e) => s + Number(e.durationMins || 0), 0)
        const totalH = (totalMins / 60).toFixed(2)
        const workH = (workMins / 60).toFixed(2)
        const overtimeH = (overtimeMins / 60).toFixed(2)
        return { totalH, workH, overtimeH, count: filtered.length }
    }, [filtered])

    const submit = (ev) => {
        ev.preventDefault()
        if (!form.date || !form.project || !form.task.trim() || !form.durationMins || !form.type) return
        setEntries([
            { id: Date.now(), ...form, durationMins: Number(form.durationMins) },
            ...entries
        ])
        setForm(EMPTY)
        setShow(false)
        toast(`Logged ${minsToLabel(Number(form.durationMins))} on ${form.project}`)
    }

    const recall = (id) => {
        const entry = entries.find(e => e.id === id)
        if (!entry) return
        if (entry.recalled) return
        if (!window.confirm(`Recall this time entry?\n\n"${entry.task}" — ${minsToLabel(entry.durationMins)}`)) return
        setEntries(entries.map(e => e.id === id ? { ...e, recalled: true } : e))
        toast('Time entry recalled')
    }

    // ===== Excel Import / Export =====
    const fileInputRef = useRef(null)

    const ENTRY_HEADERS = [
        'Date', 'Project', 'Task', 'Duration (HH:MM)', 'Duration (Minutes)',
        'Type', 'Completed', 'Description', 'Recalled'
    ]

    const handleExport = () => {
        setShowMoreMenu(false)
        const rows = filtered.map(e => ({
            'Date': e.date,
            'Project': e.project,
            'Task': e.task,
            'Duration (HH:MM)': minsToLabel(e.durationMins),
            'Duration (Minutes)': e.durationMins,
            'Type': e.type,
            'Completed': e.completed ? 'Yes' : 'No',
            'Description': e.notes || '',
            'Recalled': e.recalled ? 'Yes' : 'No',
        }))
        const stamp = new Date().toISOString().slice(0, 10)
        exportToXlsx(rows, ENTRY_HEADERS, `time_entries_${stamp}.xlsx`, 'Time Entries')
        toast(`Exported ${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}`)
    }

    const handleDownloadTemplate = () => {
        setShowMoreMenu(false)
        exportToXlsx([], ENTRY_HEADERS, 'time_entries_template.xlsx', 'Time Entries')
        toast('Template downloaded')
    }

    const handleImport = async (ev) => {
        const file = ev.target.files?.[0]
        if (!file) return
        ev.target.value = ''
        try {
            const rows = await importFromXlsx(file, {
                date: ['Date'],
                project: ['Project', 'Project Name'],
                task: ['Task', 'Description', 'Task Name'],
                durationLabel: ['Duration (HH:MM)', 'Duration', 'Hours'],
                durationMins: ['Duration (Minutes)', 'Minutes'],
                type: ['Type', 'Entry Type'],
                completed: ['Completed', 'Done'],
                notes: ['Description', 'Notes'],
                recalled: ['Recalled'],
            })

            const validProjects = new Set(ASSIGNED_PROJECTS.map(p => p.name))
            const validTypes = new Set(TYPES)
            let added = 0, skipped = 0
            const newEntries = []
            for (const r of rows) {
                if (!r.project || !r.date) { skipped++; continue }
                if (!validProjects.has(r.project)) { skipped++; continue }
                const mins = parseDurationMins(r.durationMins) ?? parseDurationMins(r.durationLabel)
                if (!mins || mins <= 0) { skipped++; continue }
                const isoDate = toIsoDate(r.date)
                const completed = String(r.completed || '').toLowerCase()
                const recalled = String(r.recalled || '').toLowerCase()
                newEntries.push({
                    id: Date.now() + Math.random(),
                    date: isoDate,
                    project: r.project,
                    task: String(r.task || '').trim(),
                    durationMins: mins,
                    type: validTypes.has(r.type) ? r.type : 'Work',
                    notes: r.notes || '',
                    completed: completed === 'yes' || completed === 'true' || completed === '1',
                    recalled: recalled === 'yes' || recalled === 'true' || recalled === '1',
                })
                added++
            }
            if (added) setEntries([...newEntries, ...entries])
            toast(
                `Imported ${added} entr${added === 1 ? 'y' : 'ies'}` +
                (skipped ? ` · skipped ${skipped}` : ''),
                { type: skipped && !added ? 'error' : 'success' }
            )
        } catch (err) {
            console.error(err)
            toast('Import failed: ' + err.message, { type: 'error' })
        }
    }

    return (
        <div className="tasks-page">
            <header className="page-header">
                <h1>My Time Entries</h1>
                <p className="muted">Log the hours you spent on tasks across your assigned projects. <span style={{ color: '#92400e', fontWeight: 600 }}>🔒 Once an entry is created it cannot be edited — only recalled.</span></p>
            </header>

            <div className="stat-grid">
                <div className="stat-card tone-indigo">
                    <div className="stat-value">{totals.totalH}</div>
                    <div className="stat-label">Total hours</div>
                </div>
                <div className="stat-card tone-green">
                    <div className="stat-value">{totals.workH}</div>
                    <div className="stat-label">Work hours</div>
                </div>
                <div className="stat-card tone-amber">
                    <div className="stat-value">{totals.overtimeH}</div>
                    <div className="stat-label">Overtime hours</div>
                </div>
                <div className="stat-card tone-red">
                    <div className="stat-value">{totals.count}</div>
                    <div className="stat-label">Entries</div>
                </div>
            </div>

            <div className="tasks-toolbar">
                <div className="search-box" style={{ minWidth: 240 }}>
                    <input
                        placeholder="Search description…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="search-btn" aria-label="Search">🔍</button>
                </div>
                <div className="chip-group" role="tablist" aria-label="Date range">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'week', label: 'This Week' },
                        { id: 'today', label: 'Today' },
                    ].map(p => (
                        <button
                            key={p.id}
                            className={`chip ${datePreset === p.id ? 'chip-active' : ''}`}
                            onClick={() => setDatePreset(p.id)}
                            type="button"
                        >{p.label}</button>
                    ))}
                </div>
                <div className="select-wrap" style={{ minWidth: 220 }}>
                    <span className="select-icon">▾</span>
                    <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                        <option value="">All projects</option>
                        {ASSIGNED_PROJECTS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
                <div className="toolbar-dropdown">
                    <button
                        type="button"
                        className="toolbar-trigger"
                        onClick={() => setShowMoreMenu(m => !m)}
                        title="More actions"
                    >⋯ More <span className="select-icon-inline">▾</span></button>
                    {showMoreMenu && (
                        <>
                            <div className="toolbar-menu-backdrop" onClick={() => setShowMoreMenu(false)} />
                            <div className="toolbar-menu toolbar-menu-actions">
                                <button type="button" onClick={() => { setShowMoreMenu(false); fileInputRef.current?.click() }}>
                                    📥 Import from Excel
                                </button>
                                <button type="button" onClick={handleExport}>
                                    📤 Export to Excel
                                </button>
                                <button type="button" onClick={handleDownloadTemplate}>
                                    📋 Download Template
                                </button>
                            </div>
                        </>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={handleImport}
                />
                <button className="btn btn-create" onClick={() => { setForm(EMPTY); setShow(true) }}>+ Log Time</button>
            </div>

            <div className="tasks-table-wrap">
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Task</th>
                            <th>Duration</th>
                            <th>Type</th>
                            <th>Completed</th>
                            <th>Description</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {grouped.map(group => (
                            <Fragment key={group.date}>
                                <tr className="day-header-row">
                                    <td colSpan="7">
                                        <div className="day-header">
                                            <span className="day-label">{fmtDayLabel(group.date)}</span>
                                            <span className="day-total">{minsToLabel(group.totalMins)} · {group.items.length} entr{group.items.length === 1 ? 'y' : 'ies'}</span>
                                        </div>
                                    </td>
                                </tr>
                                {group.items.map(e => (
                                    <tr key={e.id} style={e.recalled ? { opacity: 0.55 } : undefined}>
                                        <td>{e.project}</td>
                                        <td style={e.recalled ? { textDecoration: 'line-through' } : undefined}>{e.task}</td>
                                        <td><strong>{minsToLabel(e.durationMins)}</strong></td>
                                        <td>
                                            {e.recalled ? (
                                                <span className="pill pill-amber">Recalled</span>
                                            ) : (
                                                <span className={`pill ${e.type === 'Overtime' ? 'pill-red' : e.type === 'On Break' ? 'pill-amber' : 'pill-green'}`}>
                                                    {e.type}
                                                </span>
                                            )}
                                        </td>
                                        <td>{e.completed ? <span className="pill pill-green">Yes</span> : <span className="muted">No</span>}</td>
                                        <td className="muted">{e.notes || '—'}</td>
                                        <td className="row-action">
                                            <button
                                                className="chevron-btn"
                                                onClick={() => recall(e.id)}
                                                title={e.recalled ? 'Already recalled' : 'Recall entry'}
                                                disabled={e.recalled}
                                                style={e.recalled ? { cursor: 'not-allowed', opacity: 0.5 } : undefined}
                                            >↩️</button>
                                        </td>
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                        {grouped.length === 0 && (
                            <tr><td colSpan="7" className="muted" style={{ padding: 24, textAlign: 'center' }}>No time entries match your filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {show && (
                <div className="modal-backdrop" onClick={() => setShow(false)}>
                    <div className="modal modal-wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Create Time Entry</h2>
                            <button
                                onClick={() => setShow(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}
                                aria-label="Close"
                            >✕</button>
                        </div>
                        <h3 className="section-title" style={{ fontSize: 20, marginBottom: 14 }}>General</h3>

                        <form onSubmit={submit} className="task-form-grid">
                            <label className="field full-row">
                                <span>Date <em>*</em></span>
                                <input
                                    autoFocus
                                    type="date"
                                    value={form.date}
                                    onChange={e => update({ date: e.target.value })}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Duration <em>*</em></span>
                                <select
                                    value={form.durationMins}
                                    onChange={e => update({ durationMins: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select</option>
                                    {DURATIONS.map(d => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="field">
                                <span>Type <em>*</em></span>
                                <select
                                    value={form.type}
                                    onChange={e => update({ type: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select</option>
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </label>

                            <label className="field full-row">
                                <span>Description <em>*</em></span>
                                <input
                                    value={form.task}
                                    onChange={e => update({ task: e.target.value })}
                                    required
                                />
                            </label>

                            {/* Project is auto-filled from the originating task; keep it editable but small */}
                            <label className="field full-row">
                                <span>Project <em>*</em></span>
                                <select value={form.project} onChange={e => update({ project: e.target.value })} required>
                                    <option value="" disabled>Select…</option>
                                    {ASSIGNED_PROJECTS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </label>

                            <label className="field full-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={form.completed}
                                    onChange={e => update({ completed: e.target.checked })}
                                    style={{ width: 16, height: 16, accentColor: '#0078d4' }}
                                />
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>Task Completed</span>
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
