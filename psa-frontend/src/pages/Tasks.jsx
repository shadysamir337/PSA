import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ASSIGNED_PROJECTS } from '../data/projects.js'
import { SEED_TASKS } from '../data/tasks.js'
import { useToast } from '../context/ToastContext.jsx'
import { exportToXlsx, importFromXlsx, toMDY } from '../utils/excel.js'
import useEscape from '../utils/useEscape.js'

const STATUSES = ['New', 'In Progress', 'Complete', 'Suspended', 'Pending Approval', 'Canceled']
const TASK_PHASES = [
    'Pre-Sales / Diagnostic',
    'Initiate & Mobilise',
    'Analysis',
    'Solution Design',
    'Build & Configuration',
    'Data Migration',
    'Quality Assurance & Testing',
    'User Training & Change Adoption',
    'UAT & Acceptance',
    'Cut-over / Go-Live',
    'Project Closure & Handover',
    'Operate & Optimise',
    'Documentation',
    'Bugs Fixing',
]
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']

const EMPTY_FORM = {
    name: '',
    project: '',
    description: '',
    proposedStart: '',
    proposedEnd: '',
    dueDate: '',
    statusReason: 'New',
    plannedEffort: '',
    attachmentLink: '',
    taskPhase: '',
    priority: 'Medium',
}

// Map ?status=open|complete from URL → status checkbox values
const OPEN_STATUSES = ['New', 'In Progress', 'Suspended', 'Pending Approval']
const COMPLETE_STATUSES = ['Complete']
const statusFromQuery = (q) => {
    if (q === 'open') return OPEN_STATUSES
    if (q === 'complete') return COMPLETE_STATUSES
    return []
}

export default function Tasks() {
    const navigate = useNavigate()
    const toast = useToast()
    const [searchParams, setSearchParams] = useSearchParams()
    const initialProject = searchParams.get('project') || ''
    const initialStatus = statusFromQuery(searchParams.get('status'))

    const [tasks, setTasks] = useState(SEED_TASKS)
    const [statusFilter, setStatusFilter] = useState(initialStatus) // instant-apply now
    const [projectFilter, setProjectFilter] = useState(initialProject) // instant-apply now

    // React to URL changes (project + status from query string)
    useEffect(() => {
        const p = searchParams.get('project') || ''
        const s = statusFromQuery(searchParams.get('status'))
        setProjectFilter(p)
        setStatusFilter(s)
    }, [searchParams])
    const [search, setSearch] = useState('')
    const [openMenu, setOpenMenu] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const updateForm = (patch) => setForm(f => ({ ...f, ...patch }))

    // Toolbar dropdown state
    const [showStatusMenu, setShowStatusMenu] = useState(false)
    const [showMoreMenu, setShowMoreMenu] = useState(false)

    // Project dropdown: only projects assigned to the current employee
    const projectOptions = useMemo(
        () => ASSIGNED_PROJECTS.map(p => p.name),
        []
    )

    const toggleStatus = (s) => {
        const next = statusFilter.includes(s)
            ? statusFilter.filter(x => x !== s)
            : [...statusFilter, s]
        setStatusFilter(next)
        // keep URL clean — drop ?status param when manually editing
        const sp = new URLSearchParams(searchParams)
        sp.delete('status')
        setSearchParams(sp, { replace: true })
    }

    const onProjectFilterChange = (val) => {
        setProjectFilter(val)
        const sp = new URLSearchParams(searchParams)
        if (val) sp.set('project', val); else sp.delete('project')
        setSearchParams(sp, { replace: true })
    }

    const filtered = useMemo(() => {
        return tasks.filter(t => {
            if (statusFilter.length && !statusFilter.includes(t.status)) return false
            if (projectFilter && t.project !== projectFilter) return false
            if (search.trim() && !t.name.toLowerCase().includes(search.trim().toLowerCase())) return false
            return true
        })
    }, [tasks, statusFilter, projectFilter, search])

    const formatDateMDY = (iso) => {
        if (!iso) return '—'
        const [y, m, d] = iso.split('-')
        return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`
    }

    const handleCreate = (e) => {
        e.preventDefault()
        // ALL fields are mandatory
        const requiredText = [
            form.name.trim(), form.project, form.description.trim(),
            form.proposedStart, form.proposedEnd, form.dueDate,
            form.statusReason, form.plannedEffort, form.attachmentLink.trim(),
            form.taskPhase, form.priority,
        ]
        if (requiredText.some(v => !v)) return

        const now = new Date()
        const created =
            `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ` +
            `${((now.getHours() + 11) % 12 + 1)}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`

        setTasks([
            {
                id: Date.now(),
                project: form.project,
                name: form.name.trim(),
                status: form.statusReason,
                start: formatDateMDY(form.proposedStart),
                created,
                description: form.description,
                proposedEnd: formatDateMDY(form.proposedEnd),
                dueDate: formatDateMDY(form.dueDate),
                plannedEffort: form.plannedEffort,
                attachmentLink: form.attachmentLink,
                taskPhase: form.taskPhase,
                priority: form.priority,
                started: false,
                startedAt: null,
            },
            ...tasks
        ])
        setForm(EMPTY_FORM)
        setShowCreate(false)
        toast('Task created')
    }

    const [detailsTask, setDetailsTask] = useState(null)
    const [editTask, setEditTask] = useState(null)

    // Esc closes any open modal/menu
    useEscape(showCreate, () => setShowCreate(false))
    useEscape(!!detailsTask, () => setDetailsTask(null))
    useEscape(!!editTask, () => setEditTask(null))
    useEscape(showStatusMenu, () => setShowStatusMenu(false))
    useEscape(showMoreMenu, () => setShowMoreMenu(false))

    const setStatus = (id, status) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, status } : t))
        setOpenMenu(null)
        toast(`Status changed to "${status}"`)
    }

    const handleQuickComplete = (task) => {
        if (task.status === 'Complete') return
        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: 'Complete' } : t))
        toast(`✓ "${task.name}" marked complete`)
    }

    const handleViewDetails = (task) => { setDetailsTask(task); setOpenMenu(null) }
    const handleEdit = (task) => { setEditTask({ ...task }); setOpenMenu(null) }
    const handleStart = (task) => {
        const stamp = new Date().toISOString()
        setTasks(tasks.map(t => t.id === task.id
            ? { ...t, started: true, startedAt: stamp, status: 'In Progress' }
            : t))
        setOpenMenu(null)
        toast('Task started')
    }
    const handleCreateTimeEntry = (task) => {
        setOpenMenu(null)
        navigate('/time-entries', { state: { prefill: { project: task.project, task: task.name } } })
    }
    const handleViewTimeEntries = (task) => {
        setOpenMenu(null)
        navigate(`/time-entries?project=${encodeURIComponent(task.project)}`)
    }

    const saveEdit = (e) => {
        e.preventDefault()
        setTasks(tasks.map(t => t.id === editTask.id ? editTask : t))
        setEditTask(null)
        toast('Task updated')
    }

    // ===== Excel Import / Export =====
    const fileInputRef = useRef(null)

    const TASK_HEADERS = [
        'Project', 'Name', 'Status', 'Proposed Start Date', 'Proposed End Date',
        'Due Date', 'Created On', 'Priority', 'Task Phase',
        'Planned Effort (Hrs)', 'Description', 'Attachment Link'
    ]

    const handleExport = () => {
        setShowMoreMenu(false)
        const rows = filtered.map(t => ({
            'Project': t.project,
            'Name': t.name,
            'Status': t.status,
            'Proposed Start Date': t.start || '',
            'Proposed End Date': t.proposedEnd || '',
            'Due Date': t.dueDate || '',
            'Created On': t.created || '',
            'Priority': t.priority || '',
            'Task Phase': t.taskPhase || '',
            'Planned Effort (Hrs)': t.plannedEffort || '',
            'Description': t.description || '',
            'Attachment Link': t.attachmentLink || '',
        }))
        const stamp = new Date().toISOString().slice(0, 10)
        exportToXlsx(rows, TASK_HEADERS, `tasks_${stamp}.xlsx`, 'Tasks')
        toast(`Exported ${rows.length} task${rows.length === 1 ? '' : 's'}`)
    }

    const handleDownloadTemplate = () => {
        setShowMoreMenu(false)
        exportToXlsx([], TASK_HEADERS, 'tasks_template.xlsx', 'Tasks')
        toast('Template downloaded')
    }

    const handleImport = async (ev) => {
        const file = ev.target.files?.[0]
        if (!file) return
        ev.target.value = '' // allow re-importing the same file
        try {
            const rows = await importFromXlsx(file, {
                project: ['Project', 'Project Name'],
                name: ['Name', 'Task Name'],
                status: ['Status', 'Status Reason'],
                start: ['Proposed Start Date', 'Start Date', 'Start'],
                proposedEnd: ['Proposed End Date', 'End Date'],
                dueDate: ['Due Date'],
                created: ['Created On', 'Created'],
                priority: ['Priority'],
                taskPhase: ['Task Phase', 'Phase'],
                plannedEffort: ['Planned Effort (Hrs)', 'Planned Effort', 'Planned Effort (Hrs.)'],
                description: ['Description', 'Notes'],
                attachmentLink: ['Attachment Link', 'Link', 'Attachment'],
            })

            const validProjects = new Set(ASSIGNED_PROJECTS.map(p => p.name))
            let added = 0, skipped = 0
            const newTasks = []
            for (const r of rows) {
                if (!r.project || !r.name) { skipped++; continue }
                if (!validProjects.has(r.project)) { skipped++; continue }
                newTasks.push({
                    id: Date.now() + Math.random(),
                    project: r.project,
                    name: String(r.name).trim(),
                    status: STATUSES.includes(r.status) ? r.status : 'New',
                    start: r.start ? toMDY(r.start) : '',
                    proposedEnd: r.proposedEnd ? toMDY(r.proposedEnd) : '',
                    dueDate: r.dueDate ? toMDY(r.dueDate) : '',
                    created: r.created || toMDY(new Date()),
                    priority: PRIORITIES.includes(r.priority) ? r.priority : 'Medium',
                    taskPhase: r.taskPhase || '',
                    plannedEffort: r.plannedEffort || '',
                    description: r.description || '',
                    attachmentLink: r.attachmentLink || '',
                    started: r.status === 'In Progress' || r.status === 'Complete',
                    startedAt: null,
                })
                added++
            }
            if (added) setTasks([...newTasks, ...tasks])
            toast(
                `Imported ${added} task${added === 1 ? '' : 's'}` +
                (skipped ? ` · skipped ${skipped}` : ''),
                { type: skipped && !added ? 'error' : 'success' }
            )
        } catch (err) {
            console.error(err)
            toast('Import failed: ' + err.message, { type: 'error' })
        }
    }

    const statusLabel = statusFilter.length === 0
        ? 'All Statuses'
        : statusFilter.length === 1
            ? statusFilter[0]
            : `Status (${statusFilter.length})`

    return (
        <div className="tasks-page">
            <header className="page-header">
                <h1>Tasks</h1>
                <p className="muted">
                    {projectFilter
                        ? <>Showing your tasks for <strong>{projectFilter}</strong>. <a href="#" onClick={e => { e.preventDefault(); onProjectFilterChange('') }}>Show all</a></>
                        : 'Your tasks across all assigned projects.'}
                </p>
            </header>

            <div className="tasks-toolbar">
                <div className="search-box">
                    <input
                        placeholder="Search task name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="search-btn" aria-label="Search">🔍</button>
                </div>

                {/* Status multi-select inline dropdown */}
                <div className="toolbar-dropdown">
                    <button
                        type="button"
                        className={`toolbar-trigger ${statusFilter.length ? 'toolbar-trigger-active' : ''}`}
                        onClick={() => { setShowStatusMenu(s => !s); setShowMoreMenu(false) }}
                    >
                        {statusLabel} <span className="select-icon-inline">▾</span>
                    </button>
                    {showStatusMenu && (
                        <>
                            <div className="toolbar-menu-backdrop" onClick={() => setShowStatusMenu(false)} />
                            <div className="toolbar-menu">
                                <button
                                    type="button"
                                    className="toolbar-menu-item toolbar-menu-clear"
                                    onClick={() => { setStatusFilter([]); setShowStatusMenu(false) }}
                                >Clear all</button>
                                {STATUSES.map(s => (
                                    <label key={s} className="toolbar-menu-row">
                                        <input
                                            type="checkbox"
                                            checked={statusFilter.includes(s)}
                                            onChange={() => toggleStatus(s)}
                                        />
                                        <span>{s}</span>
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Project filter */}
                <div className="select-wrap toolbar-select">
                    <span className="select-icon">▾</span>
                    <select value={projectFilter} onChange={(e) => onProjectFilterChange(e.target.value)}>
                        <option value="">All projects</option>
                        {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                {/* More menu (Import / Export / Template) */}
                <div className="toolbar-dropdown">
                    <button
                        type="button"
                        className="toolbar-trigger"
                        onClick={() => { setShowMoreMenu(m => !m); setShowStatusMenu(false) }}
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

                <button className="btn btn-create" onClick={() => setShowCreate(true)}>
                    + Create Task
                </button>
            </div>

            {/* Full-width table — sidebar removed */}
            <section className="tasks-table-wrap">
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Proposed Start</th>
                            <th>Created On <span className="sort-arrow">▼</span></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(t => (
                            <tr key={t.id}>
                                <td>
                                    <a
                                        className="link"
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault()
                                            onProjectFilterChange(t.project)
                                            setStatusFilter([])
                                            setSearch('')
                                        }}
                                    >{t.project}</a>
                                </td>
                                <td>{t.name}</td>
                                <td>{t.status}</td>
                                <td>{t.start}</td>
                                <td>{t.created}</td>
                                <td className="row-action row-action-wide">
                                    {t.status !== 'Complete' && (
                                        <>
                                            <button
                                                className="chevron-btn quick-btn quick-complete"
                                                onClick={(e) => { e.stopPropagation(); handleQuickComplete(t) }}
                                                title="Mark complete"
                                                aria-label="Mark complete"
                                            >✓</button>
                                            <button
                                                className="chevron-btn quick-btn"
                                                onClick={(e) => { e.stopPropagation(); handleCreateTimeEntry(t) }}
                                                title="Create New Time Entry"
                                                aria-label="Create New Time Entry"
                                            >⏱️</button>
                                        </>
                                    )}
                                    <button
                                        className="chevron-btn"
                                        onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                                        aria-label="Row menu"
                                    >▾</button>
                                    {openMenu === t.id && (
                                        <div className="row-menu">
                                            <button onClick={() => handleViewDetails(t)}>👁️ View Details</button>
                                            <button onClick={() => handleEdit(t)}>✏️ Edit</button>
                                            {!t.started && (
                                                <button onClick={() => handleStart(t)}>▶️ Start Task</button>
                                            )}
                                            {t.started && t.status !== 'Complete' && (
                                                <>
                                                    <button onClick={() => handleCreateTimeEntry(t)}>➕ Create New Time Entry</button>
                                                    <button onClick={() => setStatus(t.id, 'Suspended')}>⏸️ Suspend</button>
                                                </>
                                            )}
                                            <button onClick={() => handleViewTimeEntries(t)}>📋 View Time Entries</button>
                                            <button className="danger" onClick={() => setStatus(t.id, 'Canceled')}>✖ Cancel</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan="6" className="muted" style={{ padding: 24, textAlign: 'center' }}>No tasks match your filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </section>

            {showCreate && (
                <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
                    <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
                        <h2 className="section-title">General</h2>

                        <form onSubmit={handleCreate} className="task-form-grid">
                            <label className="field">
                                <span>Name <em>*</em></span>
                                <input
                                    autoFocus
                                    value={form.name}
                                    onChange={e => updateForm({ name: e.target.value })}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Project</span>
                                <select
                                    value={form.project}
                                    onChange={e => updateForm({ project: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select…</option>
                                    {ASSIGNED_PROJECTS.map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="field full-row">
                                <span>Description <em>*</em></span>
                                <textarea
                                    rows={5}
                                    value={form.description}
                                    onChange={e => updateForm({ description: e.target.value })}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Proposed Start Date <em>*</em></span>
                                <input
                                    type="date"
                                    value={form.proposedStart}
                                    onChange={e => updateForm({ proposedStart: e.target.value })}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Proposed End Date <em>*</em></span>
                                <input
                                    type="date"
                                    value={form.proposedEnd}
                                    onChange={e => updateForm({ proposedEnd: e.target.value })}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Due Date <em>*</em></span>
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={e => updateForm({ dueDate: e.target.value })}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Attachment Link <em>*</em></span>
                                <input
                                    type="url"
                                    placeholder="https://…"
                                    value={form.attachmentLink}
                                    onChange={e => updateForm({ attachmentLink: e.target.value })}
                                    required
                                />
                            </label>

                            <label className="field full-row">
                                <span>Status Reason <em>*</em></span>
                                <select
                                    value={form.statusReason}
                                    onChange={e => updateForm({ statusReason: e.target.value })}
                                    required
                                >
                                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </label>

                            <label className="field">
                                <span>Planned Efforts (Hrs.) <em>*</em></span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.25"
                                    value={form.plannedEffort}
                                    onChange={e => updateForm({ plannedEffort: e.target.value })}
                                    required
                                />
                            </label>

                            <span /> {/* spacer (no Actual Efforts) */}

                            <label className="field">
                                <span>Task Phase <em>*</em></span>
                                <select
                                    value={form.taskPhase}
                                    onChange={e => updateForm({ taskPhase: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select</option>
                                    {TASK_PHASES.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </label>

                            <label className="field">
                                <span>Priority <em>*</em></span>
                                <select
                                    value={form.priority}
                                    onChange={e => updateForm({ priority: e.target.value })}
                                    required
                                >
                                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </label>

                            <div className="form-actions full-row">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn-submit-dark">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {detailsTask && (
                <div className="modal-backdrop" onClick={() => setDetailsTask(null)}>
                    <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
                        <h2 className="section-title">Task Details</h2>
                        <div className="task-form-grid">
                            <div className="field"><span>Name</span><div>{detailsTask.name}</div></div>
                            <div className="field"><span>Project</span><div>{detailsTask.project}</div></div>
                            <div className="field"><span>Status Reason</span><div>{detailsTask.status}</div></div>
                            <div className="field"><span>Proposed Start Date</span><div>{detailsTask.start}</div></div>
                            <div className="field"><span>Proposed End Date</span><div>{detailsTask.proposedEnd || '—'}</div></div>
                            <div className="field"><span>Due Date</span><div>{detailsTask.dueDate || '—'}</div></div>
                            <div className="field"><span>Created On</span><div>{detailsTask.created}</div></div>
                            <div className="field"><span>Priority</span><div>{detailsTask.priority || '—'}</div></div>
                            <div className="field"><span>Task Phase</span><div>{detailsTask.taskPhase || '—'}</div></div>
                            <div className="field"><span>Planned Efforts (Hrs.)</span><div>{detailsTask.plannedEffort || '—'}</div></div>
                            <div className="field full-row"><span>Description</span><div>{detailsTask.description || '—'}</div></div>
                            <div className="field full-row"><span>Attachment Link</span>
                                <div>{detailsTask.attachmentLink ? <a href={detailsTask.attachmentLink} target="_blank" rel="noreferrer">{detailsTask.attachmentLink}</a> : '—'}</div>
                            </div>
                            <div className="form-actions full-row">
                                <button className="btn btn-ghost" onClick={() => setDetailsTask(null)}>Close</button>
                                <button className="btn-submit-dark" onClick={() => { handleEdit(detailsTask); setDetailsTask(null) }}>Edit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editTask && (
                <div className="modal-backdrop" onClick={() => setEditTask(null)}>
                    <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
                        <h2 className="section-title">Edit Task</h2>
                        <form onSubmit={saveEdit} className="task-form-grid">
                            <label className="field">
                                <span>Name <em>*</em></span>
                                <input autoFocus value={editTask.name} onChange={e => setEditTask({ ...editTask, name: e.target.value })} required />
                            </label>
                            <label className="field">
                                <span>Project <em>*</em></span>
                                <select value={editTask.project} onChange={e => setEditTask({ ...editTask, project: e.target.value })} required>
                                    {ASSIGNED_PROJECTS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </label>
                            <label className="field">
                                <span>Status Reason <em>*</em></span>
                                <select value={editTask.status} onChange={e => setEditTask({ ...editTask, status: e.target.value })} required>
                                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </label>
                            <label className="field">
                                <span>Priority</span>
                                <select value={editTask.priority || 'Medium'} onChange={e => setEditTask({ ...editTask, priority: e.target.value })}>
                                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </label>
                            <label className="field full-row">
                                <span>Description</span>
                                <textarea rows={4} value={editTask.description || ''} onChange={e => setEditTask({ ...editTask, description: e.target.value })} />
                            </label>
                            <div className="form-actions full-row">
                                <button type="button" className="btn btn-ghost" onClick={() => setEditTask(null)}>Cancel</button>
                                <button type="submit" className="btn-submit-dark">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
