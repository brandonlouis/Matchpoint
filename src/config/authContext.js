import { createContext, useContext, useEffect, useState } from "react"
import { auth, db } from "./firebase"
import { doc, getDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updateEmail, updatePassword, sendEmailVerification } from 'firebase/auth'

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

    const changePassword = (password) => {
        return updatePassword(user, password)
    }

    const emailVerification = (user) => {
        return sendEmailVerification(user)
    }

    useEffect(() => { // onAuthStateChanged is a listener that is triggered only when the user logs in or out
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
                getDoc(doc(db, "accounts", currentUser.uid)).then((doc) => {
                    setMoreUserInfo(doc.data())
                    localStorage.setItem('fullName', doc.data().fullName) // Store the user's full name in local storage to prevent flashing navbar
                })
            } else {
                setMoreUserInfo(null)
                localStorage.removeItem('fullName') // Remove the user's full name from local storage on logout
            }

            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    return (
        <UserContext.Provider value={{createUser, user, moreUserInfo, login, logout, sendPwdResetEmail, changeEmail, changePassword, emailVerification}}>
            {!loading && children}
        </UserContext.Provider>
    )
}

export const UserAuth = () => {
    return useContext(UserContext)
}