import { createContext, useContext, useEffect, useState } from "react"
import { auth, db } from "./firebase"
import { doc, getDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updateEmail, updatePassword } from 'firebase/auth'

const UserContext = createContext()
export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState()
    const [moreUserInfo, setMoreUserInfo] = useState()
    const [loading, setLoading] = useState(true)

    const createUser = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password)
    }

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password)
    }

    const logout = () => {
        return signOut(auth)
    }

    const sendPwdResetEmail = (email) => {
        return sendPasswordResetEmail(auth, email)
    }

    const changeEmail = (email) => {
        return updateEmail(user, email)
    }

    const changePassword = (user, password) => {
        return updatePassword(user, password)
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
                getDoc(doc(db, "accounts", currentUser.uid)).then((doc) => {
                    setMoreUserInfo(doc.data())
                    localStorage.setItem('fullName', doc.data().fullName)
                })
            } else {
                setMoreUserInfo(null)
                localStorage.removeItem('fullName')            
            }

            setLoading(false)
        });
        return () => unsubscribe()
    }, [])

    return (
        <UserContext.Provider value={{createUser, user, moreUserInfo, login, logout, sendPwdResetEmail, changeEmail, changePassword}}>
            {!loading && children}
        </UserContext.Provider>
    )
}

export const UserAuth = () => {
    return useContext(UserContext)
}