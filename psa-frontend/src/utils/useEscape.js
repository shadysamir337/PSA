import { useEffect } from 'react'

/**
 * Calls `onEscape` whenever the user presses the Escape key while `active` is true.
 * Pass `active=false` to disable (e.g. modal isn't open).
 */
export default function useEscape(active, onEscape) {
    useEffect(() => {
        if (!active) return
        const handler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onEscape?.()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [active, onEscape])
}
