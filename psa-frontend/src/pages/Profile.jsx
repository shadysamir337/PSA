import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Profile() {
    const { user } = useAuth()

    const [form, setForm] = useState({
        firstName: 'Shady',
        lastName: 'Samir',
        email: 'ssamir@aboutthesolution.com',
        businessPhone: '01552922573',
        companyName: 'About The Solution',
        jobTitle: 'CRM Consultant',
    })
    const [saved, setSaved] = useState(false)
    const [showPwd, setShowPwd] = useState(false)
    const [showEmail, setShowEmail] = useState(false)

    const upd = (p) => { setForm(f => ({ ...f, ...p })); setSaved(false) }

    const submit = (e) => {
        e.preventDefault()
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    const initials = `${form.firstName[0] || ''}${form.lastName[0] || ''}`.toUpperCase()

    return (
        <div className="tasks-page profile-page">
            <header className="page-header">
                <h1>👤 My Profile</h1>
                <p className="muted">Manage your personal information and security settings.</p>
            </header>

            <div className="profile-grid">
                {/* Left card: identity */}
                <aside className="profile-side">
                    <div className="profile-id-card">
                        <div className="profile-cover" />
                        <div className="profile-avatar-xl">{initials}</div>
                        <h2 className="profile-name">{form.firstName} {form.lastName}</h2>
                        <p className="profile-role">{form.jobTitle || '—'}</p>
                        <p className="profile-company muted">{form.companyName}</p>
                        <div className="profile-meta">
                            <div><span>📧</span><a href={`mailto:${form.email}`}>{form.email}</a></div>
                            <div><span>📞</span>{form.businessPhone}</div>
                        </div>
                    </div>

                    <div className="security-card">
                        <div className="security-header">🔒 Security</div>
                        <button className="security-row" onClick={() => setShowPwd(true)}>
                            <span>Change password</span><span>›</span>
                        </button>
                        <button className="security-row" onClick={() => setShowEmail(true)}>
                            <span>Change email</span><span>›</span>
                        </button>
                    </div>
                </aside>

                {/* Right card: editable form */}
                <section className="profile-form-card">
                    <h2 className="section-title" style={{ fontSize: 20, marginBottom: 14, paddingBottom: 8 }}>
                        Your information
                    </h2>

                    {saved && <div className="alert" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0', marginBottom: 12 }}>
                        ✓ Profile saved successfully.
                    </div>}

                    <form onSubmit={submit} className="task-form-grid">
                        <label className="field">
                            <span>First Name <em>*</em></span>
                            <input value={form.firstName} onChange={e => upd({ firstName: e.target.value })} required />
                        </label>
                        <label className="field">
                            <span>Last Name <em>*</em></span>
                            <input value={form.lastName} onChange={e => upd({ lastName: e.target.value })} required />
                        </label>
                        <label className="field">
                            <span>Email</span>
                            <input type="email" value={form.email} onChange={e => upd({ email: e.target.value })} />
                        </label>
                        <label className="field">
                            <span>Business Phone</span>
                            <input value={form.businessPhone} onChange={e => upd({ businessPhone: e.target.value })} />
                        </label>
                        <label className="field">
                            <span>Company Name</span>
                            <input value={form.companyName} onChange={e => upd({ companyName: e.target.value })} />
                        </label>
                        <label className="field">
                            <span>Job Title</span>
                            <input value={form.jobTitle} onChange={e => upd({ jobTitle: e.target.value })} />
                        </label>
                        <div className="form-actions full-row">
                            <button type="button" className="btn btn-ghost" onClick={() => setSaved(false)}>Cancel</button>
                            <button type="submit" className="btn-submit-dark">Update</button>
                        </div>
                    </form>
                </section>
            </div>

            {showPwd && (
                <div className="modal-backdrop" onClick={() => setShowPwd(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Change password</h3>
                        <form onSubmit={e => { e.preventDefault(); setShowPwd(false); setSaved(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <label className="field"><span>Current password</span><input type="password" required /></label>
                            <label className="field"><span>New password</span><input type="password" required /></label>
                            <label className="field"><span>Confirm new password</span><input type="password" required /></label>
                            <div className="form-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowPwd(false)}>Cancel</button>
                                <button type="submit" className="btn-submit-dark">Update password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEmail && (
                <div className="modal-backdrop" onClick={() => setShowEmail(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Change email</h3>
                        <form onSubmit={e => { e.preventDefault(); setShowEmail(false); setSaved(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <label className="field"><span>Current email</span><input type="email" defaultValue={form.email} disabled /></label>
                            <label className="field"><span>New email</span><input type="email" required /></label>
                            <label className="field"><span>Password</span><input type="password" required /></label>
                            <div className="form-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowEmail(false)}>Cancel</button>
                                <button type="submit" className="btn-submit-dark">Update email</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
