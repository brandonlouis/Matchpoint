import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { db } from '../../config/firebase'
import { UserAuth } from '../../config/authContext';
import { getDocs, collection, query } from 'firebase/firestore'

const NoTeamRoute = ({ children }) => {
    const { user } = UserAuth()
    const [isInTeam, setIsInTeam] = React.useState(false)

    useEffect(() => {
        const getTeams = async () => {
            try {
                const q = query(collection(db, 'teams'))
                const data = await getDocs(q)
                const membersList = data.docs.map((doc) => doc.data().members)
                const concatenatedMembersList = [].concat(...membersList)
                setIsInTeam(concatenatedMembersList.includes(user.uid))
            } catch (err) {
                console.error(err)
            }
        }
        getTeams()
    }, [])

    if (!user) {
        return <Navigate to='/' />
    } else if (isInTeam) {
        return <Navigate to='/' />
    }
    return children
}

export default NoTeamRoute;