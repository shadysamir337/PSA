import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const remove = useCallback((id) => {
        setToasts(t => t.filter(x => x.id !== id))
    }, [])

    const toast = useCallback((message, opts = {}) => {
        const id = Date.now() + Math.random()
        const t = { id, message, type: opts.type || 'success', duration: opts.duration ?? 2200 }
        setToasts(curr => [...curr, t])
        if (t.duration > 0) setTimeout(() => remove(id), t.duration)
    }, [remove])

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="toast-stack" aria-live="polite" aria-atomic="true">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
                        <span className="toast-icon">
                            {t.type === 'success' ? '✓' : t.type === 'error' ? '!' : 'ℹ'}
                        </span>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export const useToast = () => {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx.toast
}
