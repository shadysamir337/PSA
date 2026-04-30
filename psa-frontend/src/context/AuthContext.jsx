import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'psa_user'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) setUser(JSON.parse(saved))
    }, [])

    const signIn = (email) => {
        const u = {
            email,
            name: email.split('@')[0] || email,
            role: 'Employee',
            signedInAt: new Date().toISOString()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
        setUser(u)
        return u
    }

    const signOut = () => {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
